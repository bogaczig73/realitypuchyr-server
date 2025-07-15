# Email Setup for Contact Form

This application uses nodemailer to send email notifications when contact forms are submitted. Follow these steps to configure email functionality:

## Environment Variables

Add the following variables to your `.env` file:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
CONTACT_EMAIL=admin@realitypuchyr.com
```

## Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password as `SMTP_PASS`

## Other Email Providers

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
```

### Custom SMTP Server
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
```

## Testing Email Configuration

You can test the email configuration by making a GET request to:
```
GET /api/contactform/test-email
```

This will verify the SMTP connection and return the status.

## Contact Form Email Flow

When a contact form is submitted:

1. The form data is saved to the database
2. An email notification is sent to the admin (CONTACT_EMAIL)
3. The email includes:
   - Sender's name, email, and phone number
   - Subject and message
   - Timestamp
   - Professional HTML formatting

## Email Templates

The application generates both HTML and plain text versions of emails with:
- Professional styling
- All contact form fields
- Timestamp
- Responsive design

## Troubleshooting

### Common Issues:

1. **Authentication failed**: Check your SMTP credentials
2. **Connection timeout**: Verify SMTP host and port
3. **Gmail blocks login**: Use App Password instead of regular password
4. **Email not received**: Check spam folder and CONTACT_EMAIL setting

### Debug Mode:

Enable debug logging by adding to your `.env`:
```env
DEBUG_EMAIL=true
```

## Security Notes

- Never commit your `.env` file to version control
- Use App Passwords for Gmail instead of your main password
- Consider using environment-specific email configurations
- Monitor email sending logs for any issues 