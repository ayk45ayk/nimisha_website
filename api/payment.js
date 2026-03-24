import Razorpay from 'razorpay';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { amount, currency } = req.body;

  // 1. Razorpay Order Creation (For India/INR)
  if (currency === 'INR') {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.warn("Razorpay keys missing in environment variables.");
      // Fallback for demo/dev if keys aren't set
      return res.status(200).json({ id: "demo_order_" + Date.now(), currency: "INR", amount: amount * 100 });
    }

    try {
      const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const options = {
        amount: amount * 100, // amount in smallest currency unit (paise)
        currency: "INR",
        receipt: "receipt_order_" + Date.now(),
      };

      const order = await instance.orders.create(options);
      return res.status(200).json(order);
    } catch (error) {
      console.error("Razorpay Error:", error);
      return res.status(500).json({ error: 'Failed to create Razorpay order' });
    }
  }

  // 2. PayPal (International) - Client-side primarily, but we can echo back config here if needed
  // For standard PayPal integrations, the order is often created on the client or via a different endpoint.
  // We'll return a success status to allow the frontend to proceed with client-side flow.
  return res.status(200).json({ status: 'ok', message: 'Proceed with client-side PayPal flow' });
}