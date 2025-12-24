Nimisha Khandelwal - Portfolio

Deployment on Vercel

Create a Vercel Postgres database in your Vercel project dashboard.

In your Vercel project settings, add these Environment Variables (you can find POSTGRES_URL in the Storage tab):

POSTGRES_URL

POSTGRES_PRISMA_URL

POSTGRES_URL_NON_POOLING

POSTGRES_USER

POSTGRES_HOST

POSTGRES_PASSWORD

POSTGRES_DATABASE

GEMINI_API_KEY (Optional, for moderation)

EMAIL_USER & EMAIL_PASS (Optional, for emails)

ADMIN_EMAIL (Optional)

Local Development

To run locally with Vercel Postgres, you need to pull the environment variables:

npm i -g vercel
vercel link
vercel env pull .env.local
npm run dev
