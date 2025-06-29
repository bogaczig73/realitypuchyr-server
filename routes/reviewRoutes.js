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

/**
 * PUT /api/reviews/:id - update an existing review
 * 
 * Request body structure:
 * {
 *   "name": string,      // Optional: Name of the reviewer
 *   "description": string, // Optional: Review text/description
 *   "rating": number,    // Optional: Rating from 1 to 5
 *   "propertyId": number | null // Optional: ID of the related property
 * }
 * 
 * Response codes:
 * - 200: Review updated successfully
 * - 400: Invalid input (invalid rating)
 * - 404: Review not found
 * - 500: Server error
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, rating, propertyId } = req.body;

    // Check if review exists
    const existingReview = await prisma.review.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Prepare update data (only include fields that are provided)
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (rating !== undefined) updateData.rating = Number(rating);
    if (propertyId !== undefined) updateData.propertyId = propertyId ? Number(propertyId) : null;

    const updatedReview = await prisma.review.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json(updatedReview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

/**
 * DELETE /api/reviews/:id - delete a review
 * 
 * Response codes:
 * - 204: Review deleted successfully
 * - 404: Review not found
 * - 500: Server error
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if review exists
    const existingReview = await prisma.review.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await prisma.review.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

/**
 * GET /api/reviews/:id - get a single review by ID
 * 
 * Response codes:
 * - 200: Review found
 * - 404: Review not found
 * - 500: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id: parseInt(id) }
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

module.exports = router; 