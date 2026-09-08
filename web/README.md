# CNM Growth Diagnostic — local app

## Run locally

```bash
cd web
cp .env.example .env.local   # already created with bypass defaults
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Local defaults
- **Stripe bypassed** (`DEV_BYPASS_PAYMENT=true`) — Start Diagnostic goes straight to the quiz
- **Reports** use **Claude** when `ANTHROPIC_API_KEY` is set; mock if Claude is unavailable
- **GHL** syncs contacts when `GHL_API_KEY` + `GHL_LOCATION_ID` are set; report emails send when `GHL_EMAIL_FROM` is also set (or via workflow if `GHL_WEBHOOK_URL` is set)
- Submissions stored in `web/.data/submissions.json` locally, or **Upstash Redis / Vercel KV** in production

### Optional keys
| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude reports |
| `ANTHROPIC_WORKSPACE_ID` | Required if key isn’t workspace-scoped (`wrkspc_…`) |
| `STRIPE_SECRET_KEY` + set `DEV_BYPASS_PAYMENT=false` | Real $9 test checkout |
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` | Required on Vercel (Storage → Upstash Redis / KV) |
| `GHL_API_KEY` | GHL Private Integration / Location API token |
| `GHL_LOCATION_ID` | GHL sub-account location ID |
| `GHL_EMAIL_FROM` | Verified from-address for report emails |
| `GHL_WEBHOOK_URL` | Inbound webhook for GHL workflows |
| `GHL_CUSTOM_FIELD_IDS` | Optional JSON map of field key → GHL field id |
| `GHL_BOOKING_URL` | Stage 4–6 calendar link (optional) |

### Routes
| Path | Purpose |
|---|---|
| `/` | Landing + checkout start |
| `/quiz/[id]` | 25-question diagnostic |
| `/bridge/[id]` | Processing / ready |
| `/report/[token]` | Client report |
| `/advisor/[token]` | Closer-only intel |

Production host target: `diagnostic.create-nation.com`
