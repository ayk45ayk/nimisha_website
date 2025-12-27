import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Initialize Firebase (Web SDK - same as frontend)
let firebaseApp;
let db;

const initFirebase = () => {
  if (db) return db;
  
  // Check if Firebase is configured
  if (!process.env.VITE_FIREBASE_API_KEY || !process.env.VITE_FIREBASE_PROJECT_ID) {
    console.warn('⚠️ Firebase not configured, skipping Firestore');
    return null;
  }
  
  try {
    const firebaseConfig = {
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID
    };
    
    // Check if already initialized
    if (getApps().length === 0) {
      firebaseApp = initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized');
    } else {
      firebaseApp = getApps()[0];
    }
    
    db = getFirestore(firebaseApp);
    return db;
  } catch (error) {
    console.error('❌ Firebase init error:', error.message);
    return null;
  }
};

// Save booking to Firestore
const saveBookingToFirestore = async (bookingData) => {
  const firestore = initFirebase();
  if (!firestore) return null;
  
  try {
    const bookingsRef = collection(firestore, 'bookings');
    
    const docRef = await addDoc(bookingsRef, {
      ...bookingData,
      createdAt: serverTimestamp(),
      status: 'confirmed'
    });
    
    console.log('✅ Booking saved to Firestore:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Firestore save error:', error.message);
    return null;
  }
};

// Initialize Google Calendar API with Service Account
const getCalendarClient = () => {
  const keyString = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  
  if (!keyString) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
  }
  
  let credentials;
  try {
    credentials = JSON.parse(keyString);
  } catch (e) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON: ' + e.message);
  }
  
  // Validate required fields
  if (!credentials.client_email) {
    console.error('Service account key fields:', Object.keys(credentials));
    throw new Error('Service account key is missing client_email field. Make sure you copied the entire JSON file.');
  }
  
  if (!credentials.private_key) {
    throw new Error('Service account key is missing private_key field.');
  }
  
  console.log('✅ Using service account:', credentials.client_email);
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
};

// Parse slot time string to Date object
const parseSlotToDate = (dateStr, timeStr) => {
  // Handle various date formats
  let date;
  
  // Try parsing as ISO date first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    date = new Date(dateStr);
  } 
  // Handle locale date string (e.g., "12/29/2024" or "29/12/2024")
  else if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      // Assume MM/DD/YYYY format (US locale)
      const [month, day, year] = parts.map(Number);
      date = new Date(year, month - 1, day);
    }
  }
  // Fallback: try native Date parsing
  else {
    date = new Date(dateStr);
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.error('Failed to parse date:', dateStr);
    // Fallback to today
    date = new Date();
  }
  
  // Parse time
  const [time, period] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// Create Google Calendar Event
const createCalendarEvent = async (calendar, calendarId, bookingDetails) => {
  const { name, email, phone, date, slot } = bookingDetails;
  
  const startTime = parseSlotToDate(date, slot);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

  const event = {
    summary: `Consultation: ${name}`,
    description: `
Client: ${name}
Email: ${email}
Phone: ${phone}

Booked via website.
    `.trim(),
    start: {
      dateTime: startTime.toISOString(),
      timeZone: 'Asia/Kolkata',
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'Asia/Kolkata',
    },
    // Note: Removed 'attendees' as service accounts can't send invites without Domain-Wide Delegation
    // Customer receives confirmation via our custom email instead
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 30 },       // 30 mins before
      ],
    },
  };

  const response = await calendar.events.insert({
    calendarId: calendarId,
    resource: event,
    sendUpdates: 'none', // We handle notifications via custom email
  });

  return response.data;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, email, phone, date, dateDisplay, slot, currency, amount, transactionId } = req.body;
  
  // Use dateDisplay for human-readable emails, date (ISO) for calendar
  const displayDate = dateDisplay || date;

  console.log('📅 Booking request received:', { name, email, date, slot });

  // Validate required fields
  if (!name || !email || !phone || !date || !slot) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let calendarEventId = null;
  let calendarError = null;

  // 1. Create Google Calendar Event (if configured)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY && process.env.GOOGLE_CALENDAR_ID) {
    try {
      const calendar = getCalendarClient();
      const calendarId = process.env.GOOGLE_CALENDAR_ID;
      
      const event = await createCalendarEvent(calendar, calendarId, {
        name, email, phone, date, slot
      });
      
      calendarEventId = event.id;
      console.log('✅ Calendar event created:', calendarEventId);
    } catch (error) {
      console.error('❌ Calendar event creation failed:', error.message);
      calendarError = error.message;
      // Continue with email - don't fail the whole booking
    }
  } else {
    console.log('⚠️ Google Calendar not configured, skipping event creation');
  }

  // 2. Save booking to Firestore
  let firestoreId = null;
  try {
    firestoreId = await saveBookingToFirestore({
      name,
      email,
      phone,
      date,
      dateDisplay: displayDate,
      slot,
      currency: currency || 'INR',
      amount: amount || null,
      transactionId: transactionId || null,
      calendarEventId: calendarEventId || null
    });
  } catch (error) {
    console.error('❌ Firestore error:', error.message);
    // Continue - don't fail booking if Firestore fails
  }

  // 3. Send Email Confirmation
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email config missing');
    return res.status(500).json({ 
      error: 'Email config missing',
      calendarEventId 
    });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { 
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS 
    }
  });

  try {
    // Email to customer
    await transporter.sendMail({
      from: `"Nimisha Khandelwal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `✅ Appointment Confirmed: ${displayDate} at ${slot}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0d9488, #14b8a6); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Appointment Confirmed!</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <p>Hello <strong>${name}</strong>,</p>
            <p>Your appointment has been successfully booked.</p>
            
            <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #0d9488; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${displayDate}</p>
              <p style="margin: 5px 0;"><strong>⏰ Time:</strong> ${slot}</p>
              <p style="margin: 5px 0;"><strong>📍 Location:</strong> 142 Royal Bungalow, Sukhliya, Indore</p>
              ${transactionId ? `<p style="margin: 5px 0;"><strong>💳 Transaction ID:</strong> ${transactionId}</p>` : ''}
            </div>
            
            <p>A calendar invite has been sent to your email.</p>
            
            <p style="color: #666; font-size: 14px;">
              Need to reschedule? Contact us at +91-8000401045
            </p>
          </div>
          <div style="background: #1e293b; padding: 20px; text-align: center;">
            <p style="color: #94a3b8; margin: 0; font-size: 12px;">
              Nimisha Khandelwal - Counselling Psychologist
            </p>
          </div>
        </div>
      `
    });

    // Email notification to Nimisha
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'nimishakhandelwal995@gmail.com',
      subject: `🆕 New Booking: ${name} - ${displayDate} at ${slot}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #0d9488;">New Appointment Booked</h2>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
            <p><strong>Client:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Date:</strong> ${displayDate}</p>
            <p><strong>Time:</strong> ${slot}</p>
            ${currency ? `<p><strong>Currency:</strong> ${currency}</p>` : ''}
            ${transactionId ? `<p><strong>Transaction ID:</strong> ${transactionId}</p>` : ''}
            ${calendarEventId ? `<p><strong>Calendar Event:</strong> Created ✅</p>` : ''}
            ${calendarError ? `<p style="color: red;"><strong>Calendar Error:</strong> ${calendarError}</p>` : ''}
          </div>
        </div>
      `
    });

    console.log('✅ Confirmation emails sent');

    return res.status(200).json({ 
      success: true,
      calendarEventId,
      firestoreId,
      message: 'Booking confirmed and saved'
    });

  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Email sending failed',
      calendarEventId, // Still return calendar event if it was created
      firestoreId // Still return Firestore ID if it was saved
    });
  }
}
