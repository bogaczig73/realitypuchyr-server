const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const { uploadImages, uploadFiles, deleteFile, getSignedUrl, uploadFileToS3 } = require('./services/s3Service');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { initializeDatabase } = require('./services/dbInit');
const { SUPPORTED_LANGUAGES } = require('./services/translationService');
const validateApiKey = require('./middleware/apiKeyAuth');
const { prismaErrorHandler } = require('./middleware/prismaErrorHandler');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Load Swagger document
const swaggerDocument = YAML.load('./swagger.yaml');

// Import routes
const propertyRoutes = require('./routes/propertyRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const categoriesRouter = require('./routes/categories');
const reviewRoutes = require('./routes/reviewRoutes');
const blogRoutes = require('./routes/blogRoutes');
const contactFormRoutes = require('./routes/contactFormRoutes');

const app = express();
const port = process.env.PORT || 3001;

// Initialize database and start server
async function startServer() {
    try {
        // Initialize database (this will run migrations if needed)
        await initializeDatabase();
        
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
        app.use(helmet({
            contentSecurityPolicy: false, // Disable CSP for Swagger UI
        })); // Security headers
        
        // CORS configuration
        const corsOptions = {
            origin: function (origin, callback) {
                // Allow requests with no origin (like mobile apps or curl requests)
                if (!origin) {
                    console.log('CORS: No origin provided, allowing request');
                    return callback(null, true);
                }
                
                console.log('CORS: Checking origin:', origin);
                
                // Allow your frontend domains
                const allowedOrigins = [
                    'https://realitypuchyr.cz',
                    'https://www.realitypuchyr.cz',
                    'http://localhost:3000',
                    'http://localhost:3001',
                    'http://localhost:3002',
                    'http://localhost:5173',
                    'http://localhost:4173',
                    'https://realitypuchyr.vercel.app',
                    'https://realitypuchyr.netlify.app',
                    'https://realityupchyr-server-production.up.railway.app',
                    'http://realityupchyr-server-production.up.railway.app',
                    'https://realitypuchyr-admin.vercel.app'
                ];
                
                if (allowedOrigins.indexOf(origin) !== -1) {
                    console.log('CORS: Origin allowed:', origin);
                    callback(null, true);
                } else {
                    console.log('CORS: Origin blocked:', origin);
                    console.log('CORS: Allowed origins:', allowedOrigins);
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'Origin', 'X-Requested-With', 'Accept'],
            exposedHeaders: ['Content-Length', 'X-API-Key'],
            credentials: true,
            optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
            preflightContinue: false,
            maxAge: 86400 // Cache preflight response for 24 hours
        };
        
        app.use(cors(corsOptions));
        
        // Handle preflight requests
        app.options('*', cors(corsOptions));
        
        app.use(express.json());
        app.use(morgan('dev')); // Logging

        // Apply API key validation to all routes except health check and Swagger UI
        app.use((req, res, next) => {
            // Skip API key validation for health check and Swagger UI
            if (req.path === '/health' || req.path.startsWith('/api-docs')) {
                return next();
            }
            validateApiKey(req, res, next);
        });

        // Swagger UI
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
            explorer: true,
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: "Reality Puchýř API Documentation",
            customfavIcon: "/favicon.ico",
            docExpansion: 'none',
            filter: true,
            showExtensions: true,
            showCommonExtensions: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
            defaultModelsExpandDepth: 3,
            defaultModelExpandDepth: 3,
            displayRequestDuration: true,
            tryItOutEnabled: true,
            persistAuthorization: true
        }));

        // Language middleware
        app.use((req, res, next) => {
            // Extract language from URL path
            const pathParts = req.path.split('/').filter(Boolean);
            console.log('Path parts:', pathParts);
            // Check if the first part is 'api'
            if (pathParts[0] === 'api') {
                // If second part is a supported language, use it
                const language = pathParts[1];
                if (SUPPORTED_LANGUAGES.includes(language)) {
                    req.language = language;
                    // Remove language from path for route matching
                    req.url = '/api/' + pathParts.slice(2).join('/');
                } else {
                    // Default to Czech if no language specified
                    req.language = 'cs';
                }
            } else {
                // Default to Czech if no language specified
                req.language = 'cs';
            }
            
            next();
        });

        // Request logging middleware
        app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.url} (Language: ${req.language})`);
            next();
        });

        // Routes
        app.use('/api/properties', propertyRoutes);
        app.use('/api/upload', uploadRoutes);
        app.use('/api/categories', categoriesRouter);
        app.use('/api/reviews', reviewRoutes);
        app.use('/api/blogs', blogRoutes);
        app.use('/api/contactform', contactFormRoutes);

        // Health check endpoint
        app.get('/health', (req, res) => {
            res.status(200).json({ status: 'healthy' });
        });




        // Create new property
        app.post('/api/properties', uploadImages.array('images', 10), uploadFiles.array('files', 10), async (req, res) => {
            try {
                // console.log('Received request body:', req.body);
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
        app.use(prismaErrorHandler);
        
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

        // Start the server
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer(); 