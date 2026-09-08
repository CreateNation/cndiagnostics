# CNM Growth Diagnostic

App lives in [`web/`](./web/). Specs:

- [`cnm-funnel-crm-sales-system.md`](./cnm-funnel-crm-sales-system.md)
- [`cnm-diagnostic-prompt-contract.md`](./cnm-diagnostic-prompt-contract.md)
- [`cnm-launch-checklist.md.pdf`](./cnm-launch-checklist.md.pdf)

## Local

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

→ http://localhost:3000

## Vercel

1. Import this GitHub repo in Vercel
2. Set **Root Directory** to `web`
3. Add env vars from `web/.env.example`
4. Set `NEXT_PUBLIC_APP_URL` to your live URL (e.g. `https://diagnostic.create-nation.com`)
5. Deploy, then attach custom domain `diagnostic.create-nation.com` (CNAME from Hostinger)

Production domain: **diagnostic.create-nation.com**
