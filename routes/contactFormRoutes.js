const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { sendContactFormNotification, emailService } = require('../services/emailService');
const prisma = new PrismaClient();

// Create a new contact form submission
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message, phoneNumber } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, subject, and message are required'
      });
    }

    // Create contact form submission
    const contactForm = await prisma.contactForm.create({
      data: {
        name,
        email,
        subject,
        message,
        phoneNumber
      }
    });

    // Send email notification
    try {
      const emailSent = await sendContactFormNotification(contactForm);
      if (!emailSent) {
        console.warn('Failed to send email notification for contact form submission:', contactForm.id);
      }
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Don't fail the request if email sending fails
    }

    res.status(201).json({
      success: true,
      data: contactForm
    });
  } catch (error) {
    console.error('Error creating contact form submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating contact form submission',
      error: error.message
    });
  }
});

// Get all contact form submissions (admin only)
router.get('/', async (req, res) => {
  try {
    const submissions = await prisma.contactForm.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Error fetching contact form submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contact form submissions',
      error: error.message
    });
  }
});

// Test email service connection (admin only)
router.get('/test-email', async (req, res) => {
  try {
    const isConnected = await emailService.verifyConnection();
    res.json({
      success: true,
      emailServiceConnected: isConnected,
      message: isConnected ? 'Email service is connected' : 'Email service connection failed'
    });
  } catch (error) {
    console.error('Error testing email service:', error);
    res.status(500).json({
      success: false,
      emailServiceConnected: false,
      message: 'Error testing email service',
      error: error.message
    });
  }
});

// Get a single contact form submission by ID (admin only)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that id is a valid integer
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format. ID must be a number.'
      });
    }
    
    const submission = await prisma.contactForm.findUnique({
      where: { id: parsedId }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Contact form submission not found'
      });
    }

    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Error fetching contact form submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contact form submission',
      error: error.message
    });
  }
});

// Delete a contact form submission (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that id is a valid integer
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format. ID must be a number.'
      });
    }
    
    await prisma.contactForm.delete({
      where: { id: parsedId }
    });

    res.json({
      success: true,
      message: 'Contact form submission deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contact form submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting contact form submission',
      error: error.message
    });
  }
});

module.exports = router; 