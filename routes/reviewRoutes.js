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
        createdAt: true
      }
    });
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

module.exports = router; 