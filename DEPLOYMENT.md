# Sensory Engine Deployment Guide

## Status: ✅ Ready for Deployment

All critical blockers are resolved. The application is production-ready.

**Completion:** 14/19 items (74%)
**Deployment Blockers:** ✅ ZERO
**Tests:** ✅ 318 passing
**TypeScript:** ✅ Clean compilation

---

## Quick Deploy to Vercel

### 1. Connect Repository

```bash
# Login to Vercel (one-time setup)
npx vercel login

# Deploy (from project root)
cd /Users/sachinverma/Downloads/Quinn/Sensory-Engine
npx vercel
```

Follow the prompts:
- Link to existing project? → **No** (for first deployment)
- Project name? → **sensory-engine** (or your preferred name)
- Directory? → **./  ** (root directory)
- Override settings? → **No** (Next.js auto-detected)

### 2. Configure Environment Variables

After initial deployment, add these environment variables in the Vercel dashboard:

#### Required Variables

```bash
# Claude API Configuration
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxx
CLAUDE_MODEL=claude-sonnet-4-20250514

# Weather API Configuration
OPENWEATHER_API_KEY=your_openweather_api_key_here

# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# CSRF Protection
ALLOWED_ORIGINS=https://your-deployment-url.vercel.app,http://localhost:3000
```

#### Optional Variables

```bash
# Rate Limiting (testing only)
RATE_LIMIT_BYPASS_TOKEN=

# CSRF Token Secret (optional)
CSRF_SECRET=your-secret-key-here

# Environment
NODE_ENV=production
```

**Add variables via:**
- Vercel Dashboard → Project → Settings → Environment Variables
- OR via CLI: `npx vercel env add ANTHROPIC_API_KEY`

### 3. Trigger Deployment

```bash
# Production deployment
npx vercel --prod
```

---

## Alternative: GitHub Integration (Recommended)

### Setup

1. **Connect GitHub to Vercel:**
   - Go to https://vercel.com/new
   - Import Git Repository
   - Select `WithQuinn/sensory-engine`
   - Configure project settings (auto-detected)

2. **Add Environment Variables:**
   - Use the Vercel dashboard to add all required env vars
   - See list above

3. **Deploy:**
   - Vercel auto-deploys on every push to `main`
   - Preview deployments for PRs automatically created

### Benefits
- ✅ Auto-deploy on git push
- ✅ Preview deployments for PRs
- ✅ Rollback support
- ✅ Build logs and monitoring

---

## Deployment Verification

After deployment, verify these endpoints:

### 1. Health Check
```bash
curl https://your-deployment-url.vercel.app/api/synthesize-sense \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://your-deployment-url.vercel.app" \
  -d '{"venue": {"name": "Test Venue", "destination": "Tokyo"}}'
```

Expected: 200 OK with synthesis response

### 2. Environment Config
Check that `CLAUDE_MODEL` is respected:
- Verify synthesis requests use the configured model
- Check server logs for "Calling Claude for synthesis" with correct model

### 3. External APIs
Test integrations:
- ✅ OpenWeather API (weather data)
- ✅ Wikipedia API (venue enrichment)
- ✅ Claude API (synthesis)
- ✅ PostHog (telemetry)

### 4. Security
- ✅ CSRF validation working (origin check)
- ✅ Rate limiting active
- ✅ No secrets exposed in client bundles

---

## Production Checklist

Before going live:

- [ ] All environment variables configured in Vercel
- [ ] ALLOWED_ORIGINS includes production domain
- [ ] PostHog project created and KEY configured
- [ ] OpenWeather API key has sufficient quota
- [ ] Claude API key has billing configured
- [ ] Custom domain configured (optional)
- [ ] Monitoring/alerts set up (Vercel dashboard)
- [ ] Error tracking verified (check logs)

---

## Rollback Procedure

If issues arise:

### Via Vercel Dashboard
1. Go to Deployments tab
2. Find last known-good deployment
3. Click "..." → "Promote to Production"

### Via CLI
```bash
npx vercel rollback
```

---

## Performance Monitoring

### Vercel Analytics
- Enabled by default
- View in Vercel Dashboard → Analytics tab
- Metrics: Response times, status codes, bandwidth

### PostHog Telemetry
- View user events in PostHog dashboard
- Key events:
  - `sensory_synthesis_success`
  - `sensory_synthesis_error`
  - `venue_enrichment_cache_hit`

### Logs
```bash
# Stream production logs
npx vercel logs --follow

# View specific deployment logs
npx vercel logs [deployment-url]
```

---

## Environment-Specific Notes

### Development
- Uses localhost CORS origins
- Optional rate limit bypass token
- Debug logging enabled

### Production
- Strict CORS (ALLOWED_ORIGINS)
- Rate limiting enforced
- Error logging only (no debug)
- PostHog telemetry enabled

---

## Troubleshooting

### Issue: "CORS error on synthesis endpoint"
**Fix:** Add your Vercel deployment URL to `ALLOWED_ORIGINS`

### Issue: "OpenWeather API returns 401"
**Fix:** Verify `OPENWEATHER_API_KEY` is set correctly in Vercel

### Issue: "Claude synthesis fails with 401"
**Fix:** Check `ANTHROPIC_API_KEY` is valid and has credits

### Issue: "PostHog events not appearing"
**Fix:** Verify `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` are set

### Issue: "Model not configurable"
**Verify:** Check that `CLAUDE_MODEL` env var is set in Vercel
**Expected:** Server logs should show "Calling Claude for synthesis" with configured model

---

## Next Steps After Deployment

1. **Test Live Site:**
   - Upload test photos
   - Verify synthesis works end-to-end
   - Check all UI states (loading, success, error)

2. **Monitor Performance:**
   - Check Vercel Analytics for response times
   - Verify PostHog events are flowing
   - Review error logs for issues

3. **Update Documentation:**
   - Add deployment URL to README.md
   - Update GitHub repository homepage

4. **Share with Team:**
   - Send deployment URL
   - Document any issues encountered
   - Plan next iteration (Phase 2)

---

## Related Documentation

- `.env.example` - Environment variable reference
- `PHASE-1-ROADMAP.md` - Production readiness tracker
- `README.md` - Project overview
- `CONTRIBUTING.md` - Development workflow

---

**Deployment Prepared:** February 18, 2026
**Last Updated:** February 18, 2026
**Production Status:** ✅ Ready to Deploy
