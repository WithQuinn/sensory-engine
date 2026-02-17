/**
 * Synthesis Request Queue System
 * Persists synthesis requests locally when device can't synthesize immediately
 * Retries automatically when device capability improves
 *
 * Use cases:
 * - iOS <15: Queue until user upgrades
 * - Apple Intelligence inference failure: Queue for later retry
 * - Network issues: Queue and retry when connection restored
 */

import { SensoryInput, MomentSense } from "@/lib/sensoryValidation";

// =============================================================================
// Types
// =============================================================================

export interface QueuedSynthesisRequest {
  id: string;
  momentId: string;
  input: SensoryInput;
  createdAt: string;
  retryCount: number;
  maxRetries: number;
  lastRetryAt?: string;
  error?: string;
  status: "pending" | "processing" | "failed" | "completed";
}

export interface QueueResult {
  success: boolean;
  queueId?: string;
  error?: string;
}

export interface DegradedResponse {
  success: true;
  moment: MomentSense;
  isDegraded: boolean;
  degradationReason: string;
}

// =============================================================================
// Queue Storage (IndexedDB-based)
// =============================================================================

const DB_NAME = "quinn_sensory_queue";
const STORE_NAME = "synthesis_requests";
const DB_VERSION = 1;

/**
 * Initialize IndexedDB for queue storage
 */
async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

/**
 * Queue a synthesis request for later processing
 */
export async function queueSynthesisRequest(
  input: SensoryInput,
  momentId: string
): Promise<QueueResult> {
  try {
    const db = await initDB();
    const queueId = crypto.randomUUID();

    const request: QueuedSynthesisRequest = {
      id: queueId,
      momentId,
      input,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3,
      status: "pending",
    };

    return new Promise<QueueResult>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const dbRequest = store.add(request);

      dbRequest.onsuccess = () => {
        resolve({ success: true, queueId });
      };

      dbRequest.onerror = () => {
        reject(dbRequest.error);
      };
    }).catch((error: unknown) => {
      console.error("[synthesisQueue] Error queueing request:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to queue synthesis request: ${errorMsg}`,
      } as QueueResult;
    });
  } catch (error) {
    console.error("[synthesisQueue] Queue initialization error:", error);
    return {
      success: false,
      error: "Queue system unavailable",
    };
  }
}

/**
 * Get all queued requests (for retry logic)
 */
export async function getQueuedRequests(): Promise<QueuedSynthesisRequest[]> {
  try {
    const db = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const requests = request.result as QueuedSynthesisRequest[];
        const pending = requests.filter((r) => r.status === "pending");
        resolve(pending);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("[synthesisQueue] Error fetching queued requests:", error);
    return [];
  }
}

/**
 * Update queue request status (e.g., mark as completed)
 */
export async function updateQueueRequest(
  queueId: string,
  updates: Partial<QueuedSynthesisRequest>
): Promise<boolean> {
  try {
    const db = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(queueId);

      getRequest.onsuccess = () => {
        const record = getRequest.result as QueuedSynthesisRequest;
        if (!record) {
          resolve(false);
          return;
        }

        const updated = { ...record, ...updates };
        const putRequest = store.put(updated);

        putRequest.onsuccess = () => resolve(true);
        putRequest.onerror = () => reject(putRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch (error) {
    console.error("[synthesisQueue] Error updating queue request:", error);
    return false;
  }
}

/**
 * Clear old requests (>7 days old) to prevent database bloat
 */
export async function cleanupOldRequests(): Promise<number> {
  try {
    const db = await initDB();
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const requests = request.result as QueuedSynthesisRequest[];
        let deletedCount = 0;

        requests.forEach((req) => {
          if (new Date(req.createdAt) < cutoffDate) {
            const deleteRequest = store.delete(req.id);
            deleteRequest.onsuccess = () => deletedCount++;
          }
        });

        resolve(deletedCount);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("[synthesisQueue] Error cleaning up old requests:", error);
    return 0;
  }
}

// =============================================================================
// Degraded Response
// =============================================================================

/**
 * Create degraded response for when synthesis can't happen immediately
 * Returns photo analysis + sentiment, but NO narratives
 */
export function createDegradedResponse(
  input: SensoryInput,
  momentId: string
): MomentSense {
  const now = new Date().toISOString();

  // Extract basic emotion from photo analysis if available
  const primaryEmotion =
    input.photos.refs[0]?.local_analysis?.basic_emotion || "Transcendence";
  const emotion_confidence =
    input.audio?.sentiment_score !== null &&
    input.audio?.sentiment_score !== undefined
      ? Math.abs(input.audio.sentiment_score)
      : 0.5;

  // Build transcendence score from available signals
  let transcendenceScore = 5; // Start at middle
  if (input.audio?.sentiment_score) {
    transcendenceScore = Math.round(input.audio.sentiment_score * 10);
  }

  return {
    moment_id: momentId,
    timestamp: now,
    venue_name: input.venue?.name || "Unnamed Location",
    venue_category: input.venue?.category || null,
    detection: input.detection,
    photos: input.photos,
    emotion_tags: input.audio?.sentiment_keywords || [primaryEmotion],
    primary_emotion: primaryEmotion,
    emotion_confidence,
    atmosphere: {
      lighting:
        input.photos.refs[0]?.local_analysis?.lighting || "bright",
      energy:
        input.photos.refs[0]?.local_analysis?.energy_level || "calm",
      setting: "indoor" as const,
      crowd_feel: "moderate" as const,
    },
    transcendence_score: transcendenceScore,
    transcendence_factors: [
      "sentiment_from_voice",
      "visual_analysis",
      ...(input.venue ? ["venue_context"] : []),
    ],
    sensory_details: {
      visual: `Photo analysis: ${input.photos.count} image(s) captured`,
      audio:
        input.audio?.transcript?.substring(0, 100) || null,
      scent: null,
      tactile: null,
    },
    excitement: {
      fame_score: null,
      fame_signals: [],
      unique_claims: [],
      historical_significance: null,
      excitement_hook: null,
    },
    memory_anchors: {
      sensory_anchor: `Visual memory of the moment`,
      emotional_anchor: `Sentiment: ${input.audio?.sentiment_keywords.join(", ") || "mixed"}`,
      unexpected_anchor: null,
      shareable_anchor: null,
      family_anchor: null,
    },
    narratives: {
      short: "Your moment is being processed. Check back soon for the full narrative.",
      medium:
        "This moment is queued for narrative synthesis. We'll create a personalized story when your device is ready.",
      full: "This moment is queued for narrative synthesis. We'll create a personalized story when your device is ready.",
    },
    companion_experiences: input.companions.map((c) => ({
      name: c.name,
      relationship: c.relationship,
      moment_highlight: "Captured in this moment",
      engagement_level: "moderate" as const,
      interests_matched: [],
      needs_met: [],
      concerns: [],
    })),
    environment: {
      weather: null, // TODO: Cloud enrichment from Fact Agent in v1.1
      timing: {
        local_time: new Date().toLocaleTimeString(),
        is_golden_hour:
          input.photos.refs[0]?.local_analysis?.lighting === "golden_hour",
      },
    },
    user_reflection: {
      voice_note_transcript: input.audio?.transcript || null,
      sentiment: input.audio?.sentiment_score || null,
      keywords: input.audio?.sentiment_keywords || [],
    },
    processing: {
      local_percentage: 50,
      cloud_calls: [],
      processing_time_ms: 100,
      tier: "local_only",
    },
    status: "active",
    created_at: now,
    updated_at: now,
  };
}

// =============================================================================
// Retry Logic (Called on app launch)
// =============================================================================

/**
 * Process queued requests (call this on app launch when device is capable)
 * This would be called by the SensoryAgentUI component on mount
 */
export async function processQueuedRequests(): Promise<{
  processed: number;
  failed: number;
}> {
  const queuedRequests = await getQueuedRequests();

  if (queuedRequests.length === 0) {
    return { processed: 0, failed: 0 };
  }

  console.log(
    `[synthesisQueue] Processing ${queuedRequests.length} queued requests`
  );

  let processed = 0;
  let failed = 0;

  for (const req of queuedRequests) {
    try {
      // Update status to processing
      await updateQueueRequest(req.id, {
        status: "processing",
        lastRetryAt: new Date().toISOString(),
      });

      // Call synthesis API to process the queued request
      const response = await fetch("/api/synthesize-sense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.input),
      });

      if (response.ok) {
        // Mark as completed
        await updateQueueRequest(req.id, { status: "completed" });
        processed++;
      } else {
        // Increment retry count
        const newRetryCount = req.retryCount + 1;
        if (newRetryCount >= req.maxRetries) {
          await updateQueueRequest(req.id, {
            status: "failed",
            retryCount: newRetryCount,
            error: `Failed after ${newRetryCount} retries`,
          });
          failed++;
        } else {
          await updateQueueRequest(req.id, {
            retryCount: newRetryCount,
            status: "pending",
          });
        }
      }
    } catch (error) {
      console.error(
        `[synthesisQueue] Error processing queued request ${req.id}:`,
        error
      );
      failed++;
    }
  }

  console.log(
    `[synthesisQueue] Queue processing complete: ${processed} successful, ${failed} failed`
  );

  // Clean up old requests after processing
  await cleanupOldRequests();

  return { processed, failed };
}
