import { google } from 'googleapis';

// Timezone for all calendar operations
const TIMEZONE = 'Asia/Kolkata';

// Initialize Google Calendar API with Service Account
const getCalendarClient = () => {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
};

// Get busy times from calendar
const getBusyTimes = async (calendar, calendarId, timeMin, timeMax) => {
  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin,
      timeMax: timeMax,
      timeZone: TIMEZONE,
      items: [{ id: calendarId }],
    },
  });

  return response.data.calendars[calendarId]?.busy || [];
};

// Parse date string (YYYY-MM-DD) and time string to ISO datetime for India timezone
const parseToIndiaTime = (dateStr, hours, minutes) => {
  // Create date string in format that's timezone-aware
  const h = String(hours).padStart(2, '0');
  const m = String(minutes).padStart(2, '0');
  
  // Return ISO string with explicit timezone offset for IST (UTC+5:30)
  return `${dateStr}T${h}:${m}:00+05:30`;
};

// Generate available time slots
const generateTimeSlots = (dateStr, busyTimes) => {
  const slots = [
    { display: '09:00 AM', hours: 9, minutes: 0 },
    { display: '10:00 AM', hours: 10, minutes: 0 },
    { display: '11:00 AM', hours: 11, minutes: 0 },
    { display: '12:00 PM', hours: 12, minutes: 0 },
    { display: '01:00 PM', hours: 13, minutes: 0 },
    { display: '02:00 PM', hours: 14, minutes: 0 },
    { display: '03:00 PM', hours: 15, minutes: 0 },
    { display: '04:00 PM', hours: 16, minutes: 0 },
    { display: '05:00 PM', hours: 17, minutes: 0 },
    { display: '06:00 PM', hours: 18, minutes: 0 },
    { display: '07:00 PM', hours: 19, minutes: 0 },
  ];

  return slots.map(slot => {
    const slotStart = new Date(parseToIndiaTime(dateStr, slot.hours, slot.minutes));
    const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // 1 hour duration

    const isBooked = busyTimes.some(busy => {
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);
      // Check if slot overlaps with busy time
      return slotStart < busyEnd && slotEnd > busyStart;
    });

    return {
      time: slot.display,
      available: !isBooked
    };
  });
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

  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Date parameter required' });
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  // Check for required environment variables
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !process.env.GOOGLE_CALENDAR_ID) {
    console.error('Missing Google Calendar configuration');
    // Return all slots as available in demo mode
    const slots = [
      '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
      '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
      '05:00 PM', '06:00 PM', '07:00 PM'
    ];
    return res.status(200).json({
      date,
      slots: slots.map(time => ({ time, available: true })),
      demo: true
    });
  }

  try {
    const calendar = getCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    // Create start and end of day in India timezone (ISO format with offset)
    const startOfDay = `${date}T00:00:00+05:30`;
    const endOfDay = `${date}T23:59:59+05:30`;

    console.log(`📅 Fetching availability for ${date} (${startOfDay} to ${endOfDay})`);

    const busyTimes = await getBusyTimes(calendar, calendarId, startOfDay, endOfDay);
    
    console.log(`📅 Found ${busyTimes.length} busy periods:`, busyTimes);
    
    const slots = generateTimeSlots(date, busyTimes);

    return res.status(200).json({
      date,
      slots,
      busyTimes, // Include for debugging
      demo: false
    });

  } catch (error) {
    console.error('Calendar API error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch availability',
      message: error.message 
    });
  }
}
