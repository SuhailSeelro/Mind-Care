const nodemailer = require('nodemailer');
const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM, CLIENT_URL } = require('../config/env');

// Create transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

// Verify connection
transporter.verify((error) => {
  if (error) {
    console.error('Email server connection error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Send email function
const sendEmail = async (options) => {
  try {
    const message = {
      from: `${EMAIL_FROM} <${EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(message);
    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

// Email templates
const emailTemplates = {
  // Welcome email
  welcome: (user) => ({
    subject: 'Welcome to MindCare - Start Your Wellness Journey',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
          .content { padding: 30px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to MindCare</h1>
            <p>Your mental wellness journey starts here</p>
          </div>
          <div class="content">
            <h2>Hello ${user.firstName},</h2>
            <p>Thank you for joining our community of support and healing. We're excited to have you on board.</p>
            <p>With MindCare, you can:</p>
            <ul>
              <li>Track your mood and emotional patterns</li>
              <li>Connect with our supportive community</li>
              <li>Access mental health resources and tools</li>
              <li>Find professional therapists when needed</li>
            </ul>
            <p style="text-align: center;">
              <a href="${CLIENT_URL}/dashboard" class="button">Go to Your Dashboard</a>
            </p>
            <p>If you have any questions or need immediate support, please don't hesitate to reach out to our team.</p>
            <p>Take care,<br>The MindCare Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${user.email}</p>
            <p>© 2024 MindCare. All rights reserved.</p>
            <p><a href="${CLIENT_URL}/privacy">Privacy Policy</a> | <a href="${CLIENT_URL}/terms">Terms of Service</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Welcome to MindCare, ${user.firstName}! Thank you for joining our community. Access your dashboard at ${CLIENT_URL}/dashboard`
  }),

  // Password reset email
  resetPassword: (user, resetToken) => ({
    subject: 'Reset Your MindCare Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
          .content { padding: 30px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.firstName},</h2>
            <p>You requested to reset your password for your MindCare account.</p>
            <p>Click the button below to create a new password. This link will expire in 10 minutes.</p>
            <p style="text-align: center;">
              <a href="${CLIENT_URL}/reset-password/${resetToken}" class="button">Reset Password</a>
            </p>
            <div class="warning">
              <p><strong>Important:</strong> If you didn't request this password reset, please ignore this email or contact our support team immediately.</p>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${CLIENT_URL}/reset-password/${resetToken}</p>
            <p>Take care,<br>The MindCare Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${user.email}</p>
            <p>© 2024 MindCare. All rights reserved.</p>
            <p><a href="${CLIENT_URL}/privacy">Privacy Policy</a> | <a href="${CLIENT_URL}/terms">Terms of Service</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Reset your MindCare password by clicking: ${CLIENT_URL}/reset-password/${resetToken}`
  }),

  // Appointment confirmation
  appointmentConfirmation: (appointment, user) => ({
    subject: `Appointment Confirmation - ${appointment.date.toLocaleDateString()}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
          .content { padding: 30px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .appointment-details { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; }
          .detail-item { margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Confirmed</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.firstName},</h2>
            <p>Your appointment has been confirmed. Here are the details:</p>
            
            <div class="appointment-details">
              <div class="detail-item"><strong>Date:</strong> ${appointment.date.toLocaleDateString()}</div>
              <div class="detail-item"><strong>Time:</strong> ${appointment.date.toLocaleTimeString()}</div>
              <div class="detail-item"><strong>Duration:</strong> ${appointment.duration} minutes</div>
              <div class="detail-item"><strong>Type:</strong> ${appointment.type}</div>
              <div class="detail-item"><strong>Mode:</strong> ${appointment.mode}</div>
              ${appointment.meetingLink ? `<div class="detail-item"><strong>Meeting Link:</strong> <a href="${appointment.meetingLink}">Join Meeting</a></div>` : ''}
            </div>
            
            <p>You can view and manage your appointment in your dashboard.</p>
            <p style="text-align: center;">
              <a href="${CLIENT_URL}/dashboard/appointments" class="button">View Appointment</a>
            </p>
            
            <p><strong>Reminders:</strong></p>
            <ul>
              <li>Please join 5 minutes before the scheduled time</li>
              <li>Find a quiet, private space for your session</li>
              <li>Test your audio/video equipment beforehand</li>
              <li>Have any questions or notes ready</li>
            </ul>
            
            <p>If you need to reschedule or cancel, please do so at least 24 hours in advance.</p>
            <p>Take care,<br>The MindCare Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${user.email}</p>
            <p>© 2024 MindCare. All rights reserved.</p>
            <p><a href="${CLIENT_URL}/privacy">Privacy Policy</a> | <a href="${CLIENT_URL}/terms">Terms of Service</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Appointment confirmed for ${appointment.date.toLocaleDateString()} at ${appointment.date.toLocaleTimeString()}. View at ${CLIENT_URL}/dashboard/appointments`
  }),

  // Crisis support alert
  crisisSupportAlert: (user) => ({
    subject: 'Important: Crisis Support Information',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
          .content { padding: 30px; background: #f9f9f9; }
          .emergency { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; }
          .resources { background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Immediate Support Available</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.firstName},</h2>
            <p>We noticed you might be going through a difficult time. Please remember that help is always available.</p>
            
            <div class="emergency">
              <h3>🆘 Emergency Contacts</h3>
              <p><strong>988 Suicide & Crisis Lifeline:</strong> Call or text 988 anytime</p>
              <p><strong>Crisis Text Line:</strong> Text HOME to 741741</p>
              <p><strong>Emergency Services:</strong> Call 911 for immediate danger</p>
            </div>
            
            <div class="resources">
              <h3>📞 Additional Resources</h3>
              <p><strong>National Alliance on Mental Illness (NAMI):</strong> 1-800-950-NAMI (6264)</p>
              <p><strong>Veterans Crisis Line:</strong> 1-800-273-8255, press 1</p>
              <p><strong>Trevor Project (LGBTQ+):</strong> 1-866-488-7386</p>
            </div>
            
            <p style="text-align: center;">
              <a href="${CLIENT_URL}/resources/crisis" class="button">View All Crisis Resources</a>
            </p>
            
            <p>Remember, reaching out for help is a sign of strength, not weakness.</p>
            <p>You are not alone, and people care about you.</p>
            <p>With care and concern,<br>The MindCare Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${user.email}</p>
            <p>© 2024 MindCare. All rights reserved.</p>
            <p><a href="${CLIENT_URL}/privacy">Privacy Policy</a> | <a href="${CLIENT_URL}/terms">Terms of Service</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Emergency contacts: 988 Suicide & Crisis Lifeline, Crisis Text Line: Text HOME to 741741. View resources at ${CLIENT_URL}/resources/crisis`
  })
};

module.exports = {
  sendEmail,
  emailTemplates
};