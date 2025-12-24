/**
 * Synchronous Fallback: Checks Timezone.
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
  return { isIndia: false, currency: 'USD', amount: 30, provider: 'PayPal', symbol: '$' };
};

/**
 * Asynchronous / Accurate: Checks IP Address.
 */
export const getPaymentConfigAsync = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); 

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
    return getPaymentConfig(); 
  }
};

/**
 * Loads a script dynamically.
 */
export const loadScript = (src) => {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) {
        resolve(true);
        return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Simulates a payment for demo purposes or when keys are missing.
 */
export const processPayment = async (paymentConfig, bookingDetails) => {
  console.log(`Initializing ${paymentConfig.provider} (Demo Mode) for ${paymentConfig.currency} ${paymentConfig.amount}`);
  await new Promise(resolve => setTimeout(resolve, 2000));
  return {
    success: true,
    transactionId: `tx_${paymentConfig.provider}_demo_${Date.now()}`
  };
};