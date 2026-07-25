# Chess MasterClass Platform

A thin-slice, end-to-end skeleton covering all 5 modules for the Chess MasterClass client,
built to expand module-by-module without rewrites.

```
chess-masterclass/
├── backend/    Node + Express + Prisma + Postgres (single API, all 5 modules)
├── web/        Next.js web portal (parents, coaches, admins, sponsors)
└── mobile/     Expo / React Native app (parents + kids on the go)
```

Web and mobile both talk to the same backend API — one source of truth, one auth
system, one database. That's the whole point of doing it this way: Module 3
(learning) can reuse the same child/progress records Module 1 (registration)
created, Module 5 (reports) can query across all of them, etc.

## What's real vs. what's a stub right now

This is a **working skeleton**, not a finished product. Concretely:

| Module | What actually works | What's stubbed for later |
|---|---|---|
| 1. Registration + Parent Portal | Register a child, age-bracket auto-assign, waitlist when full, parent dashboard pulling real DB data, **real Stripe Checkout + webhook confirmation, real email receipts** | Waiver e-sign (currently a checkbox + timestamp — fine for launch, revisit if your lawyer wants a signed PDF) |
| 2. Live Tournament + Results | Rounds, pairings, result entry, live standings computed from real data, QR check-in code generation | Physical clock sync, projector display mode, certificate PDF generation |
| 3. Learning Platform | Courses/lessons model, progress tracking per child, "after-class access" gating by registration | Actual video hosting/streaming (using placeholder URLs), push notifications |
| 4. Sponsor + Marketing | Sponsor + donation records, public sponsor page, quiz model with badge awarding | Photo gallery storage, real email/SMS sending (logs to console instead) |
| 5. Data + Reporting for Grants | Live aggregate dashboard (age groups, postal codes, retention), CSV export | Charting polish, saved report templates |

Every stub has a clearly marked `// TODO(module-x):` in the code so you know
exactly where to plug in the real service.

## Running it

### 1. Backend
```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL + JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev                 # http://localhost:4000
```
Needs a Postgres instance — easiest local option:
```bash
docker run --name chess-db -e POSTGRES_PASSWORD=chess -e POSTGRES_DB=chess -p 5432:5432 -d postgres:16
```

To test payments locally, forward Stripe webhooks to your machine with the
[Stripe CLI](https://stripe.com/docs/stripe-cli):
```bash
stripe listen --forward-to localhost:4000/webhooks/stripe
```
It prints a `whsec_...` value — put that in `backend/.env` as `STRIPE_WEBHOOK_SECRET`.

### 2. Web portal
```bash
cd web
npm install
npm run dev                 # http://localhost:3000
```

### 3. Mobile app
```bash
cd mobile
npm install
npx expo start
```
Point `EXPO_PUBLIC_API_URL` (in `mobile/src/lib/api.js` fallback) and
`NEXT_PUBLIC_API_URL` (web `.env.local`) at your running backend.

## 4-week launch plan (Module 1 only — this is the real timeline)

Payments run on **Stripe Checkout** (test mode works immediately, no approval
needed to start building — live mode approval usually takes 1-2 business days,
so apply for it in week 1). Email receipts run on plain SMTP, so any email
account works — no separate email vendor to sign up for.

**Week 1 — accounts & content**
- Create a Stripe account, grab the **test** secret key, drop it into `backend/.env`.
- Apply for Stripe **live** mode approval now (Settings → Activate account) —
  this is the thing most likely to block launch if left late.
- Get the real event details from the client: date, location, capacity, price,
  and their actual waiver text.
- Set up a real Postgres instance (Render or Railway — both have a free/cheap tier).

**Week 2 — build against real data**
- Replace the seed event with the client's real MasterClass event.
- Swap in an SMTP account for receipts (a Google Workspace address the org
  already owns works fine — no new tool for them to learn).
- Deploy backend (Render/Railway) and web (Vercel); point `NEXT_PUBLIC_API_URL`
  at the deployed backend.
- Add the Stripe **webhook endpoint** in the Stripe dashboard pointing at
  `https://your-backend.com/webhooks/stripe`, copy the signing secret into
  `STRIPE_WEBHOOK_SECRET`.

**Week 3 — test like a parent would**
- Run 3-4 full registrations yourself in Stripe **test** mode: confirmed spot,
  waitlisted spot, and one you deliberately abandon at checkout.
- Check the receipt email actually arrives and the QR code renders.
- Load-test capacity logic: set capacity to 2 in a test event and confirm the
  3rd registration waitlists correctly.

**Week 4 — go live**
- Flip `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` to live-mode values.
- Soft-launch registration to a small group (the org's mailing list) 3-5 days
  before wider promotion, so you catch anything real users hit first.
- Skip mobile app store submission for this deadline — Apple/Google review
  alone can eat your whole 4 weeks. Use the **web portal** (mobile-responsive
  already) for the first event; submit the Expo app to TestFlight/Play
  afterward once there's no launch deadline pressure.

## Suggested build order from here

1. **Ship Module 1 fully** (Stripe live keys, real waiver PDF + e-sign, email receipts) —
   this is the one they'll pay for immediately and the MasterClass needs it soonest.
2. **Module 2 next**, timed to the actual event date — QR check-in + live standings
   is the "wow factor" that sells the recurring membership in Module 3.
3. **Module 3** turns the one event into the $200/month relationship.
4. **Modules 4 & 5** layer on top once there's real data flowing — sponsors and
   grant officers want to see numbers, so these are strongest *after* an event or two.

## Deployment notes (when you're ready)

- **Backend + Postgres**: Render or Railway (both give you a managed Postgres + a
  web service in ~10 minutes).
- **Web**: Vercel (zero-config for Next.js).
- **Mobile**: EAS Build + EAS Submit (Expo's hosted build/submit pipeline) for
  TestFlight / Play Store internal testing first.
