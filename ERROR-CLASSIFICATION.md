# Error Classification Matrix - Sensory Agent v1

**Purpose:** Categorize all errors by type, severity, and recovery strategy.

---

## Error Categories

### 1. Validation Errors (4xx)

#### Input Validation Errors
| Error Code | Condition | HTTP Status | Recovery | User Message |
|---|---|---|---|---|
| `VALIDATION_ERROR` | Invalid JSON request body | 400 | Reject request | "Invalid request format" |
| `VALIDATION_ERROR` | Missing required field (photos, venue, captured_at) | 400 | Reject request | "Missing required data" |
| `VALIDATION_ERROR` | Invalid coordinate (lat -90/90, lon -180/180) | 400 | Reject request | "Invalid location coordinates" |
| `VALIDATION_ERROR` | Audio duration > 300s | 400 | Reject request | "Audio too long (max 5 min)" |
| `VALIDATION_ERROR` | Sentiment score out of range (-1.0 to 1.0) | 400 | Reject request | "Invalid sentiment value" |
| `VALIDATION_ERROR` | Invalid datetime format | 400 | Reject request | "Invalid timestamp format" |
| `VALIDATION_ERROR` | Photo count = 0 | 400 | Reject request | "At least 1 photo required" |
| `VALIDATION_ERROR` | Empty venue name | 400 | Reject request | "Venue name required" |

#### Output Validation Errors
| Error Code | Condition | HTTP Status | Recovery | Fallback |
|---|---|---|---|---|
| `SYNTHESIS_FAILED` | Claude response missing required fields | 500 | Use local fallback | Generate fallback narrative |
| `SYNTHESIS_FAILED` | Synthesis response validation fails | 500 | Use local fallback | Local-only processing tier |

---

### 2. Rate Limiting Errors (429)

| Error Code | Condition | HTTP Status | Recovery | User Message |
|---|---|---|---|---|
| `RATE_LIMITED` | Request limit exceeded (30 req/min) | 429 | Reject + retry after | "Rate limit exceeded. Retry in 2-60s" |
| `RATE_LIMITED` | By-IP rate limit exceeded | 429 | Reject + retry after | "Too many requests from your IP" |
| `RATE_LIMITED` | Burst rate limit exceeded | 429 | Reject + retry after | "Too many concurrent requests" |

**Headers:**
- `X-RateLimit-Limit: 30`
- `X-RateLimit-Remaining: N`
- `Retry-After: 60`

---

### 3. Security Errors (403)

| Error Code | Condition | HTTP Status | Recovery | User Message |
|---|---|---|---|---|
| `CSRF_INVALID` | Missing CSRF token | 403 | Reject request | "Security validation failed" |
| `CSRF_INVALID` | Invalid origin (not in ALLOWED_ORIGINS) | 403 | Reject request | "Request from unauthorized origin" |
| `CSRF_INVALID` | Cross-origin without token | 403 | Reject request | "Cross-origin request rejected" |

---

### 4. External API Errors (Graceful Degradation)

#### Wikipedia Errors
| Condition | HTTP Status | Recovery | Fallback |
|---|---|---|---|
| Wikipedia timeout | 500 | Cache miss, use mock | Generate mock venue data |
| Wikipedia 404 (not found) | 404 | Venue unknown | Use mock venue data |
| Wikipedia rate limited (429) | 429 | Retry with backoff | Use mock after 3 retries |
| Wikipedia network error | TIMEOUT | Immediate fallback | Use mock venue data |
| Wikipedia malformed response | 200 | Validation fails | Use mock venue data |

**Latency Targets:**
- P50: < 400ms
- P95: < 800ms
- P99: < 1500ms

#### OpenWeather Errors
| Condition | HTTP Status | Recovery | Fallback |
|---|---|---|---|
| OpenWeather timeout | 500 | Cache miss | Continue without weather |
| OpenWeather 401 (invalid key) | 401 | Log error | Continue without weather |
| OpenWeather 404 (coordinates out of range) | 404 | Validate coordinates | Continue without weather |
| OpenWeather 429 (rate limited) | 429 | Retry with backoff | Continue without weather |
| OpenWeather network error | TIMEOUT | Immediate fallback | Continue without weather |
| OpenWeather malformed response | 200 | Validation fails | Continue without weather |

**Latency Targets:**
- P50: < 200ms
- P95: < 400ms
- P99: < 800ms

#### Claude API Errors
| Condition | HTTP Status | Recovery | Fallback |
|---|---|---|---|
| Claude timeout | 500 | Wait for result | Use local synthesis |
| Claude 401 (invalid API key) | 401 | Log error, fail gracefully | Use local synthesis |
| Claude 429 (rate limited) | 429 | Return 429 to client | User must retry |
| Claude 500+ (server error) | 5xx | Retry once | Use local synthesis |
| Claude response validation fails | 200 | Parse error | Use local synthesis |
| Claude timeout after 30s | TIMEOUT | Abort | Use local synthesis |

**Latency Targets:**
- P50: < 2000ms
- P95: < 2500ms
- P99: < 3500ms

---

## Error Response Format

### Standard Error Response
```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "requestId": "req_timestamp_random",
    "field": "problematic_field",
    "value": "value_that_failed"
  },
  "requestId": "req_timestamp_random"
}
```

### Examples

#### Input Validation Error
```json
{
  "success": false,
  "error": "Invalid coordinate",
  "code": "VALIDATION_ERROR",
  "details": {
    "requestId": "req_1234567890_abc123",
    "field": "venue.coordinates.lat",
    "value": 91,
    "constraint": "must be between -90 and 90"
  },
  "requestId": "req_1234567890_abc123"
}
```

#### Rate Limit Error
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later.",
  "code": "RATE_LIMITED",
  "details": {
    "requestId": "req_1234567890_abc123",
    "limit": 30,
    "period": "minute",
    "retryAfter": 45
  },
  "requestId": "req_1234567890_abc123",
  "headers": {
    "X-RateLimit-Limit": "30",
    "X-RateLimit-Remaining": "0",
    "Retry-After": "45"
  }
}
```

#### CSRF Error
```json
{
  "success": false,
  "error": "CSRF validation failed",
  "code": "CSRF_INVALID",
  "details": {
    "requestId": "req_1234567890_abc123",
    "origin": "http://evil.com",
    "allowedOrigins": ["http://localhost:3000", "http://localhost:3001"]
  },
  "requestId": "req_1234567890_abc123"
}
```

---

## Error Handling Strategy by Type

### Critical Errors (Reject Request)
- Input validation (400)
- CSRF validation (403)
- Rate limiting (429)
- Unrecoverable parsing errors (400)

**Action:** Return error response, log event, increment error counter

### Degraded Errors (Graceful Fallback)
- Wikipedia unavailable → use mock
- OpenWeather unavailable → skip weather
- Claude timeout → use local synthesis

**Action:** Continue request, return degraded response, log fallback event

### Retryable Errors (With Backoff)
- Network timeouts → retry 1-2x
- Rate limits on external APIs → backoff then fallback
- Transient 5xx errors → retry once

**Action:** Retry logic + fallback, track retry attempt, log event

### Fatal Errors (Return 500)
- Response validation failures (critical data integrity)
- Unhandled exceptions

**Action:** Log stack trace, return generic 500, alert team

---

## HTTP Status Code Mapping

| Code | Error Type | Recovery |
|---|---|---|
| 400 | Input validation failure | Client must fix request |
| 403 | CSRF/security check failure | Client must include valid CSRF token |
| 429 | Rate limit exceeded | Client must wait and retry |
| 500 | Output validation / server error | Automatic fallback |
| 200 + error data | Graceful degradation | Continue with fallback |

---

## Monitoring & Alerting

### Critical Alerts
- Error rate > 5% for 5 min
- 429 (rate limit) > 50/min
- 500 errors > 10/min
- P95 latency > 3 seconds

### Warning Alerts
- Error rate > 2% for 5 min
- Fallback tier > 20% of requests
- Cache hit rate < 40%
- External API failures > 10%

### Dashboard Metrics
- Error rate by type (4xx, 5xx, timeouts)
- Error rate by service (Wikipedia, OpenWeather, Claude)
- Fallback processing rate
- Retry attempts distribution
- Response time percentiles (P50, P95, P99)

---

## Implementation Notes

1. **Error Tracking ID**: All errors include `requestId` for trace-ability
2. **Sensitive Data**: Error messages never include API keys, tokens, or user data
3. **User Messages**: Different from internal messages for security
4. **Logging**: All errors logged with event name, code, and context
5. **Metrics**: All error conditions tracked in PostHog/CloudWatch
6. **Fallback Chains**: Errors trigger fallback to next tier:
   - Full (external APIs) → Local (Claude only) → Fallback (hardcoded narrative)
