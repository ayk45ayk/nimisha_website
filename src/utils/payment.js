/**
 * Synchronous Fallback: Checks Timezone.
 * Fast, non-blocking, but strictly a heuristic.
 */
export const getPaymentConfig = () => {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone === 'Asia/Calcutta' || timeZone === 'Asia/Kolkata') {
      return { isIndia: true, currency: 'INR', amount: 1500, provider: 'Razorpay', symbol: '₹' };
    }
  } catch (e) {
    console.warn("Timezone detection failed", e);
  }
  // Default to International
  return { isIndia: false, currency: 'USD', amount: 30, provider: 'PayPal', symbol: '$' };
};

/**
 * Asynchronous / Accurate: Checks IP Address.
 * Uses a free IP geolocation API to confirm the country.
 */
export const getPaymentConfigAsync = async () => {
  try {
    // We use a timeout to ensure the UI doesn't hang if the API is slow
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

    const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) throw new Error("IP API failed");
    
    const data = await response.json();
    
    if (data.country_code === 'IN') {
      return { isIndia: true, currency: 'INR', amount: 1500, provider: 'Razorpay', symbol: '₹' };
    } else {
      return { isIndia: false, currency: 'USD', amount: 30, provider: 'PayPal', symbol: '$' };
    }
  } catch (error) {
    console.warn("IP Geolocation failed or timed out, falling back to Timezone", error);
    return getPaymentConfig(); // Fallback to timezone if IP check fails
  }
};

/**
 * Simulates the payment process.
 */
export const processPayment = async (paymentConfig, bookingDetails) => {
  console.log(`Initializing ${paymentConfig.provider} for ${paymentConfig.currency} ${paymentConfig.amount}`);
  await new Promise(resolve => setTimeout(resolve, 2000));
  return {
    success: true,
    transactionId: `tx_${paymentConfig.provider}_${Date.now()}`
  };
};