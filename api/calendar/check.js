import { google } from 'googleapis';

// Initialize Google Calendar API with Service Account
const getCalendarClient = () => {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });

  return google.calendar({ version: 'v3', auth });
};

// Parse slot time (e.g., "04:00 PM") to hours and minutes
const parseSlotTime = (timeStr) => {
  const [time, period] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  return { hours, minutes };
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { date, slot } = req.query;

  if (!date || !slot) {
    return res.status(400).json({ error: 'Date and slot parameters required' });
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  // Check for required environment variables
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !process.env.GOOGLE_CALENDAR_ID) {
    // Demo mode - always available
    return res.status(200).json({ date, slot, available: true, demo: true });
  }

  try {
    const calendar = getCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    
    // Parse slot time
    const { hours, minutes } = parseSlotTime(slot);
    
    // Create start and end times for this specific slot (1 hour duration)
    const startTime = `${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+05:30`;
    const endTime = new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString();
    
    console.log(`🔍 Checking slot availability: ${date} ${slot} (${startTime} to ${endTime})`);
    
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startTime,
        timeMax: endTime,
        timeZone: 'Asia/Kolkata',
        items: [{ id: calendarId }],
      },
    });
    
    const busyTimes = response.data.calendars[calendarId]?.busy || [];
    const isAvailable = busyTimes.length === 0;
    
    console.log(`📅 Slot ${slot} on ${date}: ${isAvailable ? 'AVAILABLE ✅' : 'BUSY ❌'}`, busyTimes);

    return res.status(200).json({
      date,
      slot,
      available: isAvailable,
      busyTimes: isAvailable ? [] : busyTimes,
      demo: false
    });

  } catch (error) {
    console.error('Calendar check error:', error);
    // If check fails, return available to not block payment (booking API has final check)
    return res.status(200).json({ 
      date, 
      slot, 
      available: true, 
      error: error.message,
      fallback: true 
    });
  }
}

