import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, phone, message } = req.body;

  if (!name || !phone || !message) {
    console.error('❌ Missing required fields:', { name: !!name, phone: !!phone, message: !!message });
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check email configuration
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email configuration missing. EMAIL_USER:', !!process.env.EMAIL_USER, 'EMAIL_PASS:', !!process.env.EMAIL_PASS);
    return res.status(500).json({ error: 'Email configuration missing on server' });
  }

  console.log('📧 Sending contact email from:', name, 'Phone:', phone);

  // Configure Email Transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"Website Contact" <${process.env.EMAIL_USER}>`,
    to: 'nimishakhandelwal995@gmail.com',
    replyTo: process.env.EMAIL_USER, // So you can reply to the sender
    subject: `📩 New Message from ${name} - Website Contact`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px;">
        <div style="background: linear-gradient(135deg, #0d9488, #14b8a6); padding: 20px; border-radius: 10px 10px 0 0;">
          <h2 style="color: white; margin: 0;">New Contact Form Submission</h2>
        </div>
        <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>Name:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>Phone:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                <a href="tel:${phone}" style="color: #0d9488; text-decoration: none;">${phone}</a>
              </td>
            </tr>
          </table>
          
          <div style="margin-top: 20px; background: white; padding: 15px; border-left: 4px solid #0d9488; border-radius: 4px;">
            <p style="margin: 0 0 5px 0; font-weight: bold; color: #0d9488;">Message:</p>
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          
          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
            <a href="https://wa.me/${phone.replace(/[^0-9]/g, '')}" 
               style="display: inline-block; background: #25D366; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">
              📱 Reply on WhatsApp
            </a>
          </div>
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 15px; text-align: center;">
          Sent from your website contact form at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Contact email sent successfully');
    return res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    console.error('Error code:', error.code);
    
    // Provide more helpful error messages
    let userMessage = 'Failed to send email';
    if (error.code === 'EAUTH') {
      userMessage = 'Email authentication failed. Please check EMAIL_PASS is an App Password, not your regular password.';
    } else if (error.code === 'ECONNECTION') {
      userMessage = 'Could not connect to email server';
    }
    
    return res.status(500).json({ error: userMessage, details: error.message });
  }
}
