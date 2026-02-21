# Profile Agent Integration Plan

**Status:** Phase 2 (Future Work)
**Dependencies:** Profile Agent implementation, User authentication system
**Impact:** Improved transcendence scoring accuracy (novelty factor)
**Estimated Effort:** 3-5 days

---

## Overview

The Sensory Agent currently uses a **conservative default** (`isFirstVisit = false`) when calculating transcendence scores. This prevents systematic score inflation but misses the opportunity to accurately reward genuine first-time discoveries.

The Profile Agent will provide **persistent visit history tracking** per user, enabling the Sensory Agent to:
1. Accurately identify first visits vs. repeat visits
2. Calculate meaningful novelty factors (0.75 vs 0.45)
3. Track visit patterns over time (frequency, recency, context)

---

## Current Implementation (Phase 1)

### X-First-Visit Header (Temporary Solution)

Clients can explicitly signal first visits via HTTP header:

```typescript
// Client-side (iOS app with local CoreData tracking)
const headers = {
  'X-First-Visit': visitHistory.isFirstVisit(venueId) ? 'true' : 'false'
};

// Server-side (synthesize-sense/route.ts)
const firstVisitHeader = request.headers.get("X-First-Visit");
const isFirstVisit = firstVisitHeader === "true";
```

**Limitations:**
- ❌ Requires client-side visit tracking (iOS app only)
- ❌ No cross-device sync
- ❌ Client can lie about first visits (untrusted)
- ❌ No aggregate insights (e.g., "you've visited 12 landmarks this trip")

**Benefits:**
- ✅ Works without backend changes
- ✅ Privacy-preserving (no user data stored server-side)
- ✅ Immediate availability for MVP

---

## Phase 2: Profile Agent Integration

### Architecture

```
┌─────────────────┐
│  Sensory Agent  │
│  (synthesize)   │
└────────┬────────┘
         │
         │ 1. Request visit history
         ▼
┌─────────────────┐
│ Profile Agent   │ ← User ID + Venue ID
│ (visit history) │
└────────┬────────┘
         │
         │ 2. Query database
         ▼
┌─────────────────┐
│   Supabase DB   │
│ visit_history   │
└─────────────────┘
```

### Database Schema

```sql
-- Visit History Table
CREATE TABLE visit_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id TEXT NOT NULL,  -- Wikipedia page ID or coordinates hash
  venue_name TEXT NOT NULL,
  venue_category TEXT,

  -- Visit metadata
  visit_date TIMESTAMPTZ NOT NULL,
  visit_count INT DEFAULT 1,  -- Increment on repeat visits
  first_visit_date TIMESTAMPTZ NOT NULL,
  last_visit_date TIMESTAMPTZ NOT NULL,

  -- Context at first visit (for nostalgia features)
  first_visit_companions TEXT[],  -- ["Mom", "Dad"]
  first_visit_emotion TEXT,  -- "awe"
  first_visit_transcendence_score FLOAT,

  -- Indexes for performance
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_visit_history_user_venue ON visit_history(user_id, venue_id);
CREATE INDEX idx_visit_history_user_date ON visit_history(user_id, visit_date DESC);

-- RLS Policies (users can only see their own visit history)
ALTER TABLE visit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own visit history"
  ON visit_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visit history"
  ON visit_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own visit history"
  ON visit_history FOR UPDATE
  USING (auth.uid() = user_id);
```

### API Contract

#### Profile Agent API Endpoint

```typescript
// GET /api/profile/visit-history?user_id={userId}&venue_id={venueId}
interface VisitHistoryResponse {
  success: true;
  data: {
    venue_id: string;
    venue_name: string;
    visit_count: number;
    is_first_visit: boolean;
    first_visit_date: string | null;
    last_visit_date: string | null;
    days_since_last_visit: number | null;

    // First visit context (for "remember when..." features)
    first_visit_context?: {
      companions: string[];
      emotion: string;
      transcendence_score: number;
    };
  };
}
```

#### Sensory Agent Integration

```typescript
// app/api/synthesize-sense/route.ts (Phase 2 implementation)
import { fetchVisitHistory } from '@/lib/profileAgent';

export async function POST(request: NextRequest) {
  // ... existing code ...

  // Get authenticated user ID
  const userId = await getUserIdFromSession(request);
  const venueId = getVenueIdFromInput(input.venue);

  let isFirstVisit = false;

  if (userId && venueId) {
    // Phase 2: Query Profile Agent
    const visitHistory = await fetchVisitHistory(userId, venueId);
    isFirstVisit = visitHistory.success && visitHistory.data.is_first_visit;
  } else {
    // Fallback: use X-First-Visit header (untrusted)
    const firstVisitHeader = request.headers.get("X-First-Visit");
    isFirstVisit = firstVisitHeader === "true";
  }

  // Use in transcendence scoring
  const transcendenceFactors = buildTranscendenceFactors({
    // ... other factors ...
    isFirstVisit,
  });

  // After successful synthesis, record visit
  if (userId && venueId) {
    await recordVisit(userId, venueId, {
      venueName: input.venue.name,
      venueCategory: venueEnrichment?.category,
      companions: input.companions.map(c => c.name),
      primaryEmotion: synthesisOutput.primaryEmotion,
      transcendenceScore: transcendenceResult.score,
    });
  }
}
```

### Profile Agent Functions

```typescript
// lib/profileAgent.ts (new file in Phase 2)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function fetchVisitHistory(
  userId: string,
  venueId: string
): Promise<VisitHistoryResponse> {
  const { data, error } = await supabase
    .from('visit_history')
    .select('*')
    .eq('user_id', userId)
    .eq('venue_id', venueId)
    .single();

  if (error || !data) {
    return {
      success: true,
      data: {
        venue_id: venueId,
        venue_name: 'Unknown',
        visit_count: 0,
        is_first_visit: true,
        first_visit_date: null,
        last_visit_date: null,
        days_since_last_visit: null,
      },
    };
  }

  return {
    success: true,
    data: {
      venue_id: data.venue_id,
      venue_name: data.venue_name,
      visit_count: data.visit_count,
      is_first_visit: false,
      first_visit_date: data.first_visit_date,
      last_visit_date: data.last_visit_date,
      days_since_last_visit: calculateDaysSince(data.last_visit_date),
      first_visit_context: {
        companions: data.first_visit_companions,
        emotion: data.first_visit_emotion,
        transcendence_score: data.first_visit_transcendence_score,
      },
    },
  };
}

export async function recordVisit(
  userId: string,
  venueId: string,
  visitData: {
    venueName: string;
    venueCategory: string | null;
    companions: string[];
    primaryEmotion: string;
    transcendenceScore: number;
  }
): Promise<void> {
  const now = new Date().toISOString();

  // Upsert visit record
  const { error } = await supabase
    .from('visit_history')
    .upsert({
      user_id: userId,
      venue_id: venueId,
      venue_name: visitData.venueName,
      venue_category: visitData.venueCategory,
      visit_date: now,
      visit_count: supabase.sql`visit_count + 1`,  // Increment
      last_visit_date: now,
      // Only set first visit data if this is the first visit
      first_visit_date: supabase.sql`COALESCE(first_visit_date, ${now})`,
      first_visit_companions: supabase.sql`COALESCE(first_visit_companions, ${visitData.companions})`,
      first_visit_emotion: supabase.sql`COALESCE(first_visit_emotion, ${visitData.primaryEmotion})`,
      first_visit_transcendence_score: supabase.sql`COALESCE(first_visit_transcendence_score, ${visitData.transcendenceScore})`,
      updated_at: now,
    }, {
      onConflict: 'user_id,venue_id',
    });

  if (error) {
    console.error('Failed to record visit:', error);
    // Don't throw - visit recording is non-critical
  }
}

function calculateDaysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
```

---

## Venue ID Strategy

### Problem: What uniquely identifies a venue?

Options:
1. **Wikipedia Page ID** - Stable, unique, works for famous venues
2. **Coordinates Hash** - Works for any location, but imprecise
3. **Google Place ID** - Requires Google Places API, vendor lock-in
4. **Composite Key** - Coordinates + name hash

### Recommended Approach

```typescript
function getVenueIdFromInput(venue: VenueInput | null): string | null {
  if (!venue) return null;

  // Priority 1: Wikipedia page ID (if available from enrichment)
  if (venue.wikipedia_page_id) {
    return `wiki:${venue.wikipedia_page_id}`;
  }

  // Priority 2: Coordinates hash (accurate to ~50m)
  if (venue.coordinates) {
    const { lat, lon } = venue.coordinates;
    // Round to 3 decimal places (~111m precision)
    const roundedLat = Math.round(lat * 1000) / 1000;
    const roundedLon = Math.round(lon * 1000) / 1000;
    return `geo:${roundedLat},${roundedLon}`;
  }

  // Priority 3: Name hash (fallback for manual entry)
  if (venue.name) {
    const hash = simpleHash(venue.name.toLowerCase().trim());
    return `name:${hash}`;
  }

  return null;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
```

**Trade-offs:**
- ✅ Wikipedia IDs are stable and authoritative
- ✅ Coordinates work for any location
- ⚠️ Coordinate precision may miss exact venue (50m radius)
- ⚠️ Name hashes brittle to spelling variations ("Eiffel Tower" vs "Tour Eiffel")

---

## Privacy Considerations

### What's Stored

**Minimal PII:**
- ✅ User ID (required for RLS)
- ✅ Venue names (public places only)
- ✅ Visit dates
- ✅ Companion names (first names only, user-provided)

**NOT Stored:**
- ❌ Photos
- ❌ Audio transcripts
- ❌ Exact coordinates (rounded to ~50m)
- ❌ IP addresses
- ❌ Device identifiers

### Data Retention

**Supabase RLS Policies:**
- Users can ONLY see their own visit history
- Users can DELETE their visit history at any time
- Visit history auto-deleted when user deletes account (ON DELETE CASCADE)

**GDPR Compliance:**
- Visit history is optional (can use X-First-Visit header instead)
- Right to be forgotten: DELETE FROM visit_history WHERE user_id = ?
- Data export: SELECT * FROM visit_history WHERE user_id = ?

---

## Migration Plan

### Phase 1 → Phase 2 Transition

1. **Deploy Profile Agent database schema** (2 hours)
   - Create `visit_history` table
   - Set up RLS policies
   - Create indexes

2. **Implement Profile Agent API** (1 day)
   - `GET /api/profile/visit-history`
   - `POST /api/profile/record-visit`
   - Authentication middleware

3. **Update Sensory Agent** (1 day)
   - Add `fetchVisitHistory()` call
   - Add `recordVisit()` after synthesis
   - Graceful fallback to X-First-Visit header

4. **Testing** (1 day)
   - Unit tests for Profile Agent functions
   - Integration tests for visit recording
   - Edge cases (no auth, duplicate visits, deleted venues)

5. **Documentation** (0.5 days)
   - Update API docs
   - Privacy policy updates
   - User-facing feature announcement

**Total Effort:** 3.5-5 days

---

## Future Enhancements

### Visit Insights (Phase 3+)

Once visit history is tracked, enable new features:

1. **Repeat Visit Narratives**
   ```
   "Back again—your third time at this café.
   The first time was with Sarah in spring.
   Now it's autumn, and you're here alone.
   Some places become anchors."
   ```

2. **Trip Statistics**
   ```
   transcendence_factors: [
     "12 landmarks visited this trip",
     "First time at a Michelin-starred restaurant",
     "3 repeat visits to favorite spots"
   ]
   ```

3. **Nostalgia Triggers**
   ```
   "You were last here 847 days ago with Mom.
   Same golden hour light. Different season."
   ```

4. **Recommendations**
   ```
   "You loved Senso-ji Temple (transcendence: 0.92).
   Try Meiji Shrine—similar peaceful energy,
   but you haven't been yet."
   ```

---

## Open Questions

### 1. Cross-Device Sync

**Problem:** User visits Eiffel Tower on iPhone, then uploads photo from iPad. Should it count as first visit?

**Options:**
- A) User-level tracking (cross-device) ✅ Recommended
- B) Device-level tracking (per-device)

**Decision:** User-level (requires authentication)

### 2. Visit Definition

**Problem:** User visits Louvre Museum twice in one day. Is that 2 visits or 1?

**Options:**
- A) Time-based: visits >2 hours apart count separately
- B) Date-based: only one visit per day
- C) Session-based: only one visit per trip

**Decision:** Date-based (simplest, most intuitive)

### 3. Venue Merging

**Problem:** "Eiffel Tower" vs "Tour Eiffel" vs "Paris Tower" all same place

**Options:**
- A) Exact match only (brittle)
- B) Fuzzy matching (complex)
- C) Wikipedia canonical names (requires enrichment)

**Decision:** Wikipedia canonical names when available, exact match otherwise

---

## Success Metrics

### Phase 2 Launch Criteria

- [ ] Visit history table created with RLS policies
- [ ] Profile Agent API endpoints deployed
- [ ] Sensory Agent integration complete
- [ ] 90%+ visit recording success rate
- [ ] <100ms latency overhead for visit history lookup
- [ ] Privacy audit passed (no PII leaks)
- [ ] Tests passing (unit + integration)

### Post-Launch Monitoring

Track:
- Visit history lookup latency (target <100ms)
- Visit recording success rate (target >95%)
- First visit detection accuracy (validate against user feedback)
- Database growth rate (visits per user per day)

---

## Related Documentation

- **ERROR-CLASSIFICATION.md** - Error handling for Profile Agent failures
- **TELEMETRY-TAXONOMY.md** - Events to track (visit_recorded, visit_history_fetched)
- **docs/sensory-agent-epics.md** - E9: Profile Agent epic (Phase 2)
- **PRIVACY-POLICY.md** - Visit history data retention policies

---

**Last Updated:** February 21, 2026
**Status:** Phase 2 Planning (not yet implemented)
**Owner:** Sensory Agent + Profile Agent teams
