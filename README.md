# GemMint

Professional AI trading card grading platform. Predict PSA and Beckett grades in under 30 seconds using advanced computer vision.

## Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Radix UI / shadcn-style primitives
- Lucide Icons
- Firebase Authentication + Firestore

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Firebase Auth setup

1. Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → Sign-in methods:
   - Email/Password
   - Google
3. Project settings → Your apps → Web app → copy the config values into `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

4. Restart `npm run dev`

After sign-in, users land on `/dashboard`.

## Firestore setup (credits & Recent Scans)

Credits and graded cards persist in Firestore under `users/{uid}`.

Collections: `grades`, `reports`, `lots`, `purchases`, `usages`.

1. Firebase Console → **Build → Firestore Database** → Create database (start in production mode).
2. Deploy security rules from [`firestore.rules`](firestore.rules):
   - Console → Firestore → Rules → paste the file contents → Publish
   - Or with Firebase CLI: `firebase deploy --only firestore:rules`
3. Confirm Auth is enabled (rules require `request.auth.uid`).

New accounts get **1 free scan credit**. After that, balance and Recent Scans survive refresh, sign-out, and sign-in.

**Important:** Republish `firestore.rules` after pulling payment changes. Purchases are Admin-only writes; clients can no longer grant themselves credits.

## Stripe payments

GemMint uses **Stripe Checkout** (one-time payments, no subscriptions).

### 1. Stripe products

In [Stripe Dashboard → Products](https://dashboard.stripe.com/products), create one-time Prices matching `src/lib/scan-packs.ts`:

| Product | Amount | Env var |
|---|---|---|
| Lot Price Report | $4.99 | `STRIPE_PRICE_LOT_PRICE` |
| Professional Report | $7.99 | `STRIPE_PRICE_PROFESSIONAL` |
| Starter (10 credits) | $29.99 | `STRIPE_PRICE_STARTER` |
| Collector (25 credits) | $49.99 | `STRIPE_PRICE_COLLECTOR` |
| Dealer (100 credits) | $199.99 | `STRIPE_PRICE_DEALER` |

Copy each Price ID (`price_...`) into `.env.local`.

### 2. API keys + webhook

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Local webhook forwarding:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Production: add an endpoint `https://your-domain.com/api/webhooks/stripe` for events:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`

### 3. Firebase Admin (required for fulfillment)

Stripe webhooks grant credits with the **Firebase Admin SDK** (bypasses client rules).

1. Firebase Console → Project settings → **Service accounts** → Generate new private key
2. Put values in `.env.local`:

```bash
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-...@....iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 4. Flow

1. Signed-in user clicks Buy → `POST /api/checkout` (Firebase ID token)
2. Redirect to Stripe Checkout
3. Return to `/dashboard?billing=success&session_id=...`
4. Webhook (and confirm endpoint) fulfill credits idempotently using `session.id`

## Live market comps (ROI)

ROI uses **PriceCharting / SportsCardsPro** grade comps (raw, PSA 8 / 9 / 10) after the AI identifies the card.

1. Subscribe at [SportsCardsPro](https://www.sportscardspro.com) or [PriceCharting](https://www.pricecharting.com) (plan with API access).
2. Subscription → **API/Download** → copy your token into `.env.local`:

```bash
PRICECHARTING_API_TOKEN=your_token_here
```

3. Restart `npm run dev`.

Without a token, ROI falls back to AI estimates (less accurate). With a token, the Value tab shows “Market comps from PriceCharting”.

## Scripts

- `npm run dev` — development server (Turbopack)
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — ESLint

## Structure

```
src/
  app/                 # Routes & metadata
  components/
    auth/              # Auth provider, forms, guards
    layout/            # Navbar, Footer, Logo
    marketing/         # Dashboard preview, card viz
    sections/          # Landing page sections
    ui/                # Reusable primitives
  lib/                 # Firebase, utils & content constants
```
