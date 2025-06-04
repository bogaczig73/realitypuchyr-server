const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/reviews - fetch all reviews, newest first
router.get('/', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        rating: true,
        propertyId: true,
        createdAt: true,
        updatedAt: true
      }
    });
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

/**
 * POST /api/reviews - create a new review
 * 
 * Request body structure:
 * {
 *   "name": string,      // Required: Name of the reviewer
 *   "description": string, // Required: Review text/description
 *   "rating": number,    // Required: Rating from 1 to 5
 *   "propertyId": number | null // Optional: ID of the related property
 * }
 * 
 * Example request body:
 * {
 *   "name": "Lo Scalzo Monika",
 *   "description": "S Archer reality a hlavně s panem Puchýřem jsem byla spokojená...",
 *   "rating": 5,
 *   "propertyId": null
 * }
 * 
 * Response will include:
 * - id: number
 * - name: string
 * - description: string
 * - rating: number
 * - propertyId: number | null
 * - createdAt: string (ISO date)
 * - updatedAt: string (ISO date)
 * 
 * Response codes:
 * - 201: Review created successfully
 * - 400: Invalid input (missing required fields or invalid rating)
 * - 500: Server error
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, rating, propertyId } = req.body;

    // Validate required fields
    if (!name || !description || !rating) {
      return res.status(400).json({ error: 'Name, description, and rating are required' });
    }

    // Validate rating is between 1 and 5
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const review = await prisma.review.create({
      data: {
        name,
        description,
        rating: Number(rating),
        propertyId: propertyId ? Number(propertyId) : null
      }
    });

    res.status(201).json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

module.exports = router; 