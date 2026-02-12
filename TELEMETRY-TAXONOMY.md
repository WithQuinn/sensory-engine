# Telemetry Event Taxonomy - Sensory Agent v1

**Purpose:** Define canonical event names, schemas, and integrations for production observability.

**Integration:** PostHog, CloudWatch, custom analytics

---

## Core Events

### 1. Request Lifecycle Events

#### `sensory_agent.request.started`
**When:** POST request received, after CSRF/rate limit checks
**Properties:**
```json
{
  "photo_count": number,
  "has_audio": boolean,
  "has_venue": boolean,
  "companion_count": number,
  "request_id": string,
  "session_id": string,
  "timestamp": ISO8601
}
```

#### `sensory_agent.request.succeeded`
**When:** Synthesis returned 200 with valid moment data
**Properties:**
```json
{
  "request_id": string,
  "processing_tier": "full" | "local_only",
  "processing_time_ms": number,
  "cloud_calls": string[],
  "moment_id": UUID,
  "primary_emotion": string,
  "transcendence_score": 0-1,
  "timestamp": ISO8601
}
```

#### `sensory_agent.request.failed`
**When:** Request error (400, 429, 500, etc)
**Properties:**
```json
{
  "request_id": string,
  "status_code": number,
  "error_code": string,
  "error_message": string,
  "processing_time_ms": number,
  "timestamp": ISO8601
}
```

---

### 2. External API Events

#### `sensory_agent.wikipedia.call`
**When:** Wikipedia API called
**Properties:**
```json
{
  "request_id": string,
  "venue_name": string,
  "success": boolean,
  "latency_ms": number,
  "status_code": number,
  "cache_hit": boolean,
  "timestamp": ISO8601
}
```

#### `sensory_agent.openweather.call`
**When:** OpenWeather API called
**Properties:**
```json
{
  "request_id": string,
  "latitude": number,
  "longitude": number,
  "success": boolean,
  "latency_ms": number,
  "status_code": number,
  "condition": string,
  "timestamp": ISO8601
}
```

#### `sensory_agent.claude.call`
**When:** Claude API called for synthesis
**Properties:**
```json
{
  "request_id": string,
  "model": string,
  "success": boolean,
  "latency_ms": number,
  "status_code": number,
  "input_tokens": number,
  "output_tokens": number,
  "timestamp": ISO8601
}
```

---

### 3. Processing Events

#### `sensory_agent.synthesis.completed`
**When:** Claude synthesis response parsed successfully
**Properties:**
```json
{
  "request_id": string,
  "emotion_detected": string,
  "confidence": 0-1,
  "narrative_lengths": {
    "short": number,
    "medium": number,
    "full": number
  },
  "memory_anchors_count": number,
  "timestamp": ISO8601
}
```

#### `sensory_agent.fallback.engaged`
**When:** Fallback processing used (local-only synthesis)
**Properties:**
```json
{
  "request_id": string,
  "reason": "claude_error" | "claude_timeout" | "validation_error" | "all_apis_down",
  "details": string,
  "timestamp": ISO8601
}
```

#### `sensory_agent.validation.error`
**When:** Input or output validation fails
**Properties:**
```json
{
  "request_id": string,
  "validation_type": "input" | "output",
  "schema": string,
  "error_path": string,
  "error_message": string,
  "timestamp": ISO8601
}
```

---

### 4. Performance Events

#### `sensory_agent.performance.milestone`
**When:** Request reaches performance milestones
**Properties:**
```json
{
  "request_id": string,
  "milestone": "parsing" | "rate_limit" | "weather" | "venue" | "synthesis" | "complete",
  "elapsed_ms": number,
  "timestamp": ISO8601
}
```

---

### 5. Security Events

#### `sensory_agent.security.csrf_rejected`
**When:** CSRF validation fails
**Properties:**
```json
{
  "request_id": string,
  "origin": string,
  "referer": string,
  "reason": "invalid_origin" | "missing_token" | "cross_origin",
  "timestamp": ISO8601
}
```

#### `sensory_agent.security.rate_limit_exceeded`
**When:** Rate limit enforced
**Properties:**
```json
{
  "request_id": string,
  "identifier": string,
  "limit": number,
  "period_seconds": number,
  "timestamp": ISO8601
}
```

---

## Event Routing

### PostHog Integration
```
sensory_agent.* → PostHog
├── Dashboard: Synthesis funnel (started → success → error)
├── Funnel: Request success rate
├── Trends: Processing time, emotion distribution
└── Session recording: User session traces
```

### CloudWatch Integration (Future)
```
sensory_agent.request.* → CloudWatch Logs
sensory_agent.performance.* → CloudWatch Metrics
└── Alarms: P95 latency > 2s, error rate > 5%
```

---

## Naming Conventions

**Format:** `sensory_agent.<domain>.<action>`

**Domains:**
- `request` - Request lifecycle
- `wikipedia` - Wikipedia API
- `openweather` - OpenWeather API
- `claude` - Claude API
- `synthesis` - Synthesis processing
- `fallback` - Fallback processing
- `validation` - Validation errors
- `performance` - Performance metrics
- `security` - Security events
- `cache` - Caching operations

**Actions:**
- `started` - Event initiated
- `succeeded` - Event succeeded
- `failed` - Event failed
- `call` - API call made
- `completed` - Processing completed
- `engaged` - Feature activated
- `error` - Error occurred
- `exceeded` - Limit exceeded
- `rejected` - Request rejected
- `milestone` - Progress checkpoint

---

## Implementation Checklist

- [ ] Integrate with PostHog via `lib/telemetry.ts`
- [ ] Log all core events with canonical names
- [ ] Attach request IDs to all events for tracing
- [ ] Implement event batching for high-frequency events
- [ ] Set up PostHog dashboards for:
  - [ ] Synthesis funnel (started → success → error)
  - [ ] Request success rate (200 vs 4xx/5xx)
  - [ ] Processing time distribution (P50, P95, P99)
  - [ ] Emotion distribution chart
  - [ ] Transcendence score histogram
  - [ ] Cloud service error rates
  - [ ] Cache hit rate tracking
- [ ] Configure CloudWatch alerts for:
  - [ ] P95 latency > 2000ms
  - [ ] Error rate > 5%
  - [ ] Rate limit violations
  - [ ] CSRF rejections

---

## Privacy Constraints

❌ **Never log:**
- Photo references or metadata
- Audio transcripts or analysis
- Venue coordinates (use coarsened only)
- User names or IDs
- API keys or tokens

✅ **Safe to log:**
- Request counts and timings
- Error codes and messages
- Emotion/sentiment classifications
- Processing tier
- Cache hit/miss rates
- Service call counts
