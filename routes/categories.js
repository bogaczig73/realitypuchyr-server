const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { uploadFileToS3, deleteFile } = require('../services/s3Service');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const prisma = new PrismaClient();

// Function to convert S3 URL to CloudFront URL
const convertToCloudFrontUrl = (s3Url) => {
    if (!s3Url) return null;
    // Extract just the path part after the bucket name
    const urlParts = s3Url.split('/');
    const bucketIndex = urlParts.findIndex(part => part.includes('s3.eu-central-1.amazonaws.com'));
    if (bucketIndex === -1) return s3Url; // Return original URL if not an S3 URL
    const key = urlParts.slice(bucketIndex + 1).join('/');
    return `https://d2ibq52z3bzi2i.cloudfront.net/${key}`;
};

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: {
                name: 'asc'
            }
        });

        // Convert S3 URLs to CloudFront URLs
        const categoriesWithCloudFrontUrls = categories.map(category => ({
            ...category,
            image: convertToCloudFrontUrl(category.image)
        }));

        res.json(categoriesWithCloudFrontUrls);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Get category by ID
router.get('/:id', async (req, res) => {
    try {
        const category = await prisma.category.findUnique({
            where: {
                id: parseInt(req.params.id)
            }
        });
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Convert S3 URL to CloudFront URL
        const categoryWithCloudFrontUrl = {
            ...category,
            image: convertToCloudFrontUrl(category.image)
        };

        res.json(categoryWithCloudFrontUrl);
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ error: 'Failed to fetch category' });
    }
});

// Create new category
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { name, slug } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: 'Image is required' });
        }

        // Upload image to S3 and get CloudFront URL
        const imageUrl = await uploadFileToS3(req.file, 'categories', slug);

        const category = await prisma.category.create({
            data: {
                name,
                slug,
                image: imageUrl // This will already be a CloudFront URL
            }
        });
        res.status(201).json(category);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

// Update category
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { name, slug } = req.body;
        const categoryId = parseInt(req.params.id);

        // Get existing category
        const existingCategory = await prisma.category.findUnique({
            where: { id: categoryId }
        });

        if (!existingCategory) {
            return res.status(404).json({ error: 'Category not found' });
        }

        let imageUrl = existingCategory.image;

        // If new image is uploaded, update it in S3
        if (req.file) {
            // Delete old image from S3
            if (existingCategory.image) {
                await deleteFile(existingCategory.image);
            }
            // Upload new image and get CloudFront URL
            imageUrl = await uploadFileToS3(req.file, 'categories', slug);
        }

        const category = await prisma.category.update({
            where: { id: categoryId },
            data: {
                name,
                slug,
                image: imageUrl // This will already be a CloudFront URL
            }
        });
        res.json(category);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
});

// Delete category
router.delete('/:id', async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);

        // Get category to delete its image
        const category = await prisma.category.findUnique({
            where: { id: categoryId }
        });

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Delete image from S3
        if (category.image) {
            await deleteFile(category.image);
        }

        // Delete category from database
        await prisma.category.delete({
            where: { id: categoryId }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

module.exports = router; 