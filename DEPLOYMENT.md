# C-Mart deployment

This repository keeps the existing React/Vite client and Express API. Deploy the
`client` directory to Vercel and the `server` directory to Render; MongoDB Atlas
and Cloudinary remain externally managed services.

## Local configuration

1. Copy `client/.env.example` to `client/.env.local` and set
   `VITE_API_URL=http://localhost:5000/api`. The Vite development server proxies
   `/api` to the local backend if this value is left blank.
2. Copy `server/.env.example` to `server/.env`; set the MongoDB, JWT, Google,
   Cloudinary, and Resend values required for the features you use.
3. Keep `.env` files out of version control. The example files intentionally
   contain no credentials.

## Render backend

1. In Render, create a Blueprint from this repository and use the root
   `render.yaml`, or create a Node web service with **Root Directory** `server`,
   **Build Command** `npm ci`, and **Start Command** `npm start`.
2. Set `CLIENT_URLS` to the exact HTTPS Vercel origin (multiple origins may be
   comma-separated). Production startup rejects a missing origin allowlist.
3. Set the following values in the Render service's environment settings:
   - `MONGO_URI`: MongoDB Atlas connection string. In Atlas, create a dedicated
     application user and allow the Render service's outbound IPs, or use Atlas
     network access appropriate to your plan.
   - `JWT_SECRET`: a long, random secret (generate it locally; never commit or
     send it in chat). Production requires at least 32 characters.
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
     `CLOUDINARY_API_SECRET`: Cloudinary API credentials.
   - `GOOGLE_CLIENT_ID`: OAuth client ID matching the frontend.
   - `RESEND_API_KEY` and `EMAIL_FROM`: Resend key and a sender address/domain
     verified with Resend.
   - `NODE_ENV=production` is declared in the Blueprint. Render supplies
     `PORT`; the server listens on that value.
4. Production startup requires all the listed integration variables and an
   HTTPS `CLIENT_URLS` allowlist. Wait for the service to become healthy at
   `/api/health`. Keep credentials in
   Render's environment settings, not this repository.

## Vercel frontend

1. Import the repository in Vercel and set **Root Directory** to `client`.
   Vercel uses `client/vercel.json` to build the Vite app and serve
   client-side routes on refresh.
2. Add these Vercel environment variables for the Production environment (and
   Preview if needed):
   - `VITE_API_URL`: the Render URL ending in `/api`, for example
     `https://c-mart-api.onrender.com/api`.
   - `VITE_GOOGLE_CLIENT_ID`: the same Google OAuth client ID configured on
     Render. Add the deployed Vercel origin to the Google OAuth authorized
     JavaScript origins.
3. After the Vercel deployment is created, add its exact HTTPS origin to Render's
   `CLIENT_URLS`, then redeploy the backend if needed.

Vite embeds `VITE_*` variables in public browser assets. Never put secrets,
MongoDB credentials, JWT secrets, Resend keys, or Cloudinary API secrets in
`VITE_*` variables.

## Commands and checks

- Root frontend build: `npm run build`
- Frontend build directly: `cd client && npm ci && npm run build`
- Backend install/start: `cd server && npm ci && npm start`
- Backend local development: `cd server && npm run dev`
- Backend health endpoint: `GET /api/health`

GitHub Actions runs the client production build and checks backend entry-point
syntax on pushes to `main`/`master` and pull requests. The repository has no
automated integration suite for authenticated database, payment-proof, or
Cloudinary operations; those require configured external services and should
be exercised against a non-production test account before launch.

The manual `Deploy` workflow triggers a Render deploy hook and then deploys the
Vercel client. Before using it, add the following GitHub Actions secrets:
`RENDER_DEPLOY_HOOK_URL`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and
`VERCEL_PROJECT_ID`. Configure frontend `VITE_*` values in Vercel itself. Do not
commit deploy-hook URLs or Vercel tokens.

## Before making the site public

- Configure Atlas, Cloudinary, Google OAuth, and Resend using the values above.
- Confirm student registration/login, Google login, password reset email/OTP,
  product CRUD, image uploads, wishlist, chat, swap/rent, bargaining, orders,
  payment-proof review, reviews, complaints, and admin authorization against the
  deployed services.
- Existing local-only image files are not portable to Render's ephemeral
  filesystem. Migrate any such assets to Cloudinary before relying on them.
- Payment verification in this project is the existing order/payment-proof
  workflow; this configuration does not add a payment gateway.

Deployment is not complete until both services are deployed, configured, and
the end-to-end checks above pass.
