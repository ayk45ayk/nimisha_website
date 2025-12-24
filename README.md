Nimisha Khandelwal - Portfolio

Payment Setup

The website supports Razorpay (for India) and PayPal (International). You must configure the following environment variables in Vercel.

Vercel Environment Variables

Go to your Vercel Project -> Settings -> Environment Variables and add:

Razorpay:

VITE_RAZORPAY_KEY_ID: Your Razorpay Key ID (Public).

RAZORPAY_KEY_ID: Same as above (for Backend access).

RAZORPAY_KEY_SECRET: Your Razorpay Key Secret (Private/Backend).

PayPal:

VITE_PAYPAL_CLIENT_ID: Your PayPal Client ID.

Database & Other:

POSTGRES_URL (and related DB vars)

EMAIL_USER & EMAIL_PASS (for booking confirmations)

GEMINI_API_KEY (optional)

VITE_FIREBASE_* (all firebase config keys)

Local Development

Create a .env file for backend keys:

RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret


Create a .env.local file for frontend keys (Vite):

VITE_RAZORPAY_KEY_ID=your_key_id
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id


Run: npm run dev