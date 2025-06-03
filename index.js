const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');
const { uploadImages, uploadFiles, deleteFile, getSignedUrl, uploadFileToS3 } = require('./services/s3Service');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import routes
const propertyRoutes = require('./routes/propertyRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const categoriesRouter = require('./routes/categories');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();
const port = process.env.PORT || 3001;

// Database configuration
const pool = new Pool({
    user: process.env.DB_USER || 'radimbohac',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || '12345',
    port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Successfully connected to the database');
    release();
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: '*', // More permissive for development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());
app.use(morgan('dev')); // Logging

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/properties', propertyRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/categories', categoriesRouter);
app.use('/api/reviews', reviewRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// Test AWS Configuration
app.get('/api/test-aws', async (req, res) => {
    try {
        console.log('AWS Configuration:');
        // console.log('Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? '✓ Set' : '✗ Missing');
        // console.log('Secret Access Key:', process.env.AWS_SECRET_ACCESS_KEY ? '✓ Set' : '✗ Missing');
        // console.log('Region:', process.env.AWS_REGION || 'eu-central-1');
        // console.log('Bucket:', process.env.AWS_BUCKET_NAME || 'realitypuchyr-estate-photos');

        // Test S3 bucket access
        const s3Client = new S3Client({
            region: process.env.AWS_REGION || 'eu-central-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });

        // Try to list objects in the bucket
        const command = new ListObjectsV2Command({
            Bucket: process.env.AWS_BUCKET_NAME || 'realitypuchyr-estate-photos',
            MaxKeys: 1
        });
        const data = await s3Client.send(command);

        res.json({
            status: 'success',
            message: 'AWS S3 configuration is working',
            bucketContents: data.Contents || []
        });
    } catch (error) {
        console.error('AWS Test Error:', error);
        res.status(500).json({
            status: 'error',
            message: 'AWS S3 configuration test failed',
            error: error.message
        });
    }
});

// Create new property
app.post('/api/properties', uploadImages.array('images', 10), uploadFiles.array('files', 10), async (req, res) => {
    try {
        console.log('Received request body:', req.body);
        console.log('Received images:', req.files);
        console.log('Received files:', req.files);
        
        const { name, sqf, beds, baths, price, layout, virtual_tour } = req.body;
        
        // First create the property without images and files
        const result = await pool.query(
            'INSERT INTO properties (name, image, sqf, beds, baths, price, layout, virtual_tour, files) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [name, 'pending', sqf, beds, baths, price, layout, virtual_tour, '[]']
        );

        const propertyId = result.rows[0].id;
        let featuredImageUrl = null;
        const uploadedFiles = [];

        // Handle image uploads
        if (req.files && req.files.length > 0) {
            const imageUrls = [];
            const imageMainFlags = req.body.imageMainFlags ? 
                (Array.isArray(req.body.imageMainFlags) ? req.body.imageMainFlags : [req.body.imageMainFlags]) : 
                [];
            
            // Upload all images
            for (let i = 0; i < req.files.length; i++) {
                const imageUrl = await uploadFileToS3(req.files[i], propertyId, 'images', i);
                imageUrls.push(imageUrl);
                
                // Check if this image should be the main image
                const isMain = imageMainFlags[i] === 'true';
                if (isMain) {
                    featuredImageUrl = imageUrl;
                }
            }

            // Update property with the featured image URL
            if (featuredImageUrl) {
                await pool.query(
                    'UPDATE properties SET image = $1 WHERE id = $2',
                    [featuredImageUrl, propertyId]
                );
            }

            // Save all image URLs to the property_images table
            for (let i = 0; i < imageUrls.length; i++) {
                const isMain = imageMainFlags[i] === 'true';
                await pool.query(
                    'INSERT INTO property_images (property_id, image_url, is_main) VALUES ($1, $2, $3)',
                    [propertyId, imageUrls[i], isMain]
                );
            }
        }

        // Handle file uploads
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const fileUrl = await uploadFileToS3(file, propertyId, 'files');
                uploadedFiles.push({
                    name: file.originalname,
                    url: fileUrl,
                    type: file.mimetype,
                    size: file.size
                });
            }

            // Update property with the file references
            await pool.query(
                'UPDATE properties SET files = $1 WHERE id = $2',
                [JSON.stringify(uploadedFiles), propertyId]
            );
        }

        // Get updated property with images and files
        const updatedProperty = await pool.query(
            `SELECT p.*, 
                json_agg(json_build_object(
                    'id', pi.id,
                    'url', pi.image_url,
                    'isMain', pi.is_main
                )) as images
            FROM properties p
            LEFT JOIN property_images pi ON p.id = pi.property_id
            WHERE p.id = $1
            GROUP BY p.id`,
            [propertyId]
        );

        res.status(201).json(updatedProperty.rows[0]);
    } catch (err) {
        console.error('Detailed error in /api/properties POST:', {
            message: err.message,
            stack: err.stack,
            body: req.body,
            files: req.files
        });

        res.status(500).json({ 
            error: 'Internal server error',
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// Upload property image
app.post('/api/properties/:id/image', uploadImages.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const imageUrl = await uploadFileToS3(req.file, id, 'images');

        // Update property with new image URL
        const result = await pool.query(
            'UPDATE properties SET image = $1 WHERE id = $2 RETURNING *',
            [imageUrl, id]
        );

        if (result.rows.length === 0) {
            // If property not found, delete the uploaded file
            await deleteFile(imageUrl);
            return res.status(404).json({ error: 'Property not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error uploading image:', err);
        res.status(500).json({ 
            error: 'Internal server error',
            details: err.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 