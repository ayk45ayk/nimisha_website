import { google } from 'googleapis';

// Timezone for all calendar operations
const TIMEZONE = 'Asia/Kolkata';
const DAYS_TO_FETCH = 30; // Fetch 30 days at once

// Initialize Google Calendar API with Service Account
const getCalendarClient = () => {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
};

// Get busy times from calendar for a date range
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

// Parse date string (YYYY-MM-DD) and time to ISO datetime for India timezone
const parseToIndiaTime = (dateStr, hours, minutes) => {
  const h = String(hours).padStart(2, '0');
  const m = String(minutes).padStart(2, '0');
  return `${dateStr}T${h}:${m}:00+05:30`;
};

// Generate available time slots for a single date
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

    // Check if ANY part of this slot overlaps with ANY busy time
    const overlappingBusy = busyTimes.find(busy => {
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);
      
      // Two time ranges overlap if: start1 < end2 AND end1 > start2
      return slotStart.getTime() < busyEnd.getTime() && slotEnd.getTime() > busyStart.getTime();
    });

    return {
      time: slot.display,
      available: !overlappingBusy
    };
  });
};

// Generate date string in YYYY-MM-DD format
const formatDateStr = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Generate array of dates starting from a given date
const generateDateRange = (startDateStr, days) => {
  const dates = [];
  const [year, month, day] = startDateStr.split('-').map(Number);
  const startDate = new Date(year, month - 1, day);
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(formatDateStr(date));
  }
  return dates;
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

  const { date, days } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Date parameter required' });
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  // Number of days to fetch (default to DAYS_TO_FETCH, max 60)
  const numDays = Math.min(parseInt(days) || DAYS_TO_FETCH, 60);
  const dateRange = generateDateRange(date, numDays);

  // Check for required environment variables
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !process.env.GOOGLE_CALENDAR_ID) {
    console.error('Missing Google Calendar configuration');
    // Return all slots as available in demo mode
    const defaultSlots = [
      '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
      '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
      '05:00 PM', '06:00 PM', '07:00 PM'
    ];
    
    const availability = {};
    dateRange.forEach(d => {
      availability[d] = defaultSlots.map(time => ({ time, available: true }));
    });
    
    return res.status(200).json({
      startDate: date,
      days: numDays,
      availability,
      demo: true
    });
  }

  try {
    const calendar = getCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    // Fetch busy times for the entire range in one API call
    const startOfRange = `${dateRange[0]}T00:00:00+05:30`;
    const endOfRange = `${dateRange[dateRange.length - 1]}T23:59:59+05:30`;

    console.log(`📅 Fetching availability for ${numDays} days: ${dateRange[0]} to ${dateRange[dateRange.length - 1]}`);

    const busyTimes = await getBusyTimes(calendar, calendarId, startOfRange, endOfRange);
    
    console.log(`📅 Found ${busyTimes.length} busy periods in range`);

    // Generate slots for each day
    const availability = {};
    dateRange.forEach(dateStr => {
      // Filter busy times relevant to this specific date
      const dayStart = new Date(parseToIndiaTime(dateStr, 0, 0));
      const dayEnd = new Date(parseToIndiaTime(dateStr, 23, 59));
      
      const dayBusyTimes = busyTimes.filter(busy => {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);
        // Check if busy time overlaps with this day at all
        return busyStart < dayEnd && busyEnd > dayStart;
      });
      
      availability[dateStr] = generateTimeSlots(dateStr, dayBusyTimes);
    });

    return res.status(200).json({
      startDate: date,
      days: numDays,
      availability,
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
