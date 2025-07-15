const nodemailer = require('nodemailer');

/**
 * @typedef {Object} ContactFormData
 * @property {string} name
 * @property {string} email
 * @property {string} subject
 * @property {string} message
 * @property {string} [phoneNumber]
 */

class EmailService {
  constructor() {
    // Validate required environment variables
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('Email service: Missing SMTP credentials. Email notifications will be disabled.');
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Add timeout and connection settings
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    // Log email service initialization
    console.log(`Email service initialized with SMTP host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
  }

  /**
   * Send contact form email notification
   * @param {ContactFormData} data - Contact form data
   * @returns {Promise<boolean>} - Success status
   */
  async sendContactFormEmail(data) {
    // Check if transporter is available
    if (!this.transporter) {
      console.warn('Email service: Transporter not available. Skipping email send.');
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.CONTACT_EMAIL || process.env.SMTP_USER, // Send to admin email or fallback to SMTP user
        subject: `New Contact Form Submission: ${data.subject}`,
        html: this.generateContactFormEmailHTML(data),
        text: this.generateContactFormEmailText(data),
      };

      console.log(`Sending contact form email to: ${mailOptions.to}`);
      await this.transporter.sendMail(mailOptions);
      console.log('Contact form email sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Generate HTML email content
   * @param {ContactFormData} data - Contact form data
   * @returns {string} - HTML email content
   */
  generateContactFormEmailHTML(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Contact Form Submission</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #555; }
          .value { margin-top: 5px; padding: 10px; background-color: #f8f9fa; border-radius: 3px; }
          .message { white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Contact Form Submission</h2>
            <p>A new contact form has been submitted on your website.</p>
          </div>
          
          <div class="field">
            <div class="label">Name:</div>
            <div class="value">${data.name}</div>
          </div>
          
          <div class="field">
            <div class="label">Email:</div>
            <div class="value">${data.email}</div>
          </div>
          
          ${data.phoneNumber ? `
          <div class="field">
            <div class="label">Phone Number:</div>
            <div class="value">${data.phoneNumber}</div>
          </div>
          ` : ''}
          
          <div class="field">
            <div class="label">Subject:</div>
            <div class="value">${data.subject}</div>
          </div>
          
          <div class="field">
            <div class="label">Message:</div>
            <div class="value message">${data.message}</div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            <p>This email was sent from your website contact form.</p>
            <p>Submitted at: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text email content
   * @param {ContactFormData} data - Contact form data
   * @returns {string} - Plain text email content
   */
  generateContactFormEmailText(data) {
    return `
New Contact Form Submission

A new contact form has been submitted on your website.

Name: ${data.name}
Email: ${data.email}
${data.phoneNumber ? `Phone Number: ${data.phoneNumber}` : ''}
Subject: ${data.subject}

Message:
${data.message}

---
This email was sent from your website contact form.
Submitted at: ${new Date().toLocaleString()}
    `.trim();
  }

  /**
   * Verify SMTP connection
   * @returns {Promise<boolean>} - Connection status
   */
  async verifyConnection() {
    if (!this.transporter) {
      console.warn('Email service: Transporter not available for connection verification.');
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
      return false;
    }
  }

  /**
   * Send contact form notification (legacy method for backward compatibility)
   * @param {Object} contactForm - Contact form data from database
   * @returns {Promise<boolean>} - Success status
   */
  async sendContactFormNotification(contactForm) {
    const { name, email, subject, message, phoneNumber } = contactForm;
    return this.sendContactFormEmail({ name, email, subject, message, phoneNumber });
  }
}

const emailService = new EmailService();

module.exports = {
  emailService,
  sendContactFormNotification: (contactForm) => emailService.sendContactFormNotification(contactForm)
}; 