const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { uploadPropertyFiles, uploadFileToS3, deleteFile } = require('../services/s3Service');
const { validateProperty } = require('../middleware/validation');

const prisma = new PrismaClient();

// Helper function to convert S3 URLs to CloudFront URLs
const convertToCloudFrontUrl = (url) => {
    if (!url) return url;
    return url.replace(
        'realitypuchyr-estate-photos.s3.eu-central-1.amazonaws.com',
        'd2ibq52z3bzi2i.cloudfront.net'
    );
};

// Test S3 upload endpoint
router.post('/test-upload', uploadPropertyFiles, async (req, res) => {
    try {
        if (!req.files || (!req.files.images && !req.files.files)) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        console.log('Test upload - Files received:', {
            images: req.files.images?.map(file => ({
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size
            })),
            files: req.files.files?.map(file => ({
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size
            }))
        });

        // Upload all files to S3
        const uploadPromises = [];
        
        if (req.files.images) {
            uploadPromises.push(...req.files.images.map(async (file) => {
                const imageUrl = await uploadFileToS3(file, 'test', 'images');
                return {
                    type: 'image',
                    originalname: file.originalname,
                    url: imageUrl
                };
            }));
        }

        if (req.files.files) {
            uploadPromises.push(...req.files.files.map(async (file) => {
                const fileUrl = await uploadFileToS3(file, 'test', 'files');
                return {
                    type: 'file',
                    originalname: file.originalname,
                    url: fileUrl,
                    mimetype: file.mimetype,
                    size: file.size
                };
            }));
        }

        const results = await Promise.all(uploadPromises);
        res.json(results);
    } catch (error) {
        console.error('Test upload error:', error);
        res.status(500).json({
            error: 'Upload failed',
            details: error.message
        });
    }
});

// Get property statistics
router.get('/stats', async (req, res, next) => {
    try {
        const activeProperties = await prisma.property.count({
            where: { status: 'ACTIVE' }
        });

        const soldProperties = await prisma.property.count({
            where: { status: 'SOLD' }
        });

        // Years of experience is hardcoded since it's a fixed value
        const yearsOfExperience = 5;

        res.json({
            activeProperties,
            soldProperties,
            yearsOfExperience
        });
    } catch (err) {
        console.error('Error fetching property statistics:', err);
        next(err);
    }
});

// Get all properties with pagination and search
router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const search = req.query.search || '';
        const status = req.query.status;
        const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : undefined;
        const skip = (page - 1) * limit;

        // Build where clause for search and filters
        const where = {
            AND: [
                // Search in name and description
                search ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } }
                    ]
                } : {},
                // Filter by status
                status ? { status } : {},
                // Filter by category
                categoryId ? { categoryId } : {}
            ].filter(condition => Object.keys(condition).length > 0)
        };

        // Get total count
        const total = await prisma.property.count({ where });

        // Get properties with pagination
        const properties = await prisma.property.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                images: {
                    orderBy: {
                        order: 'asc'
                    }
                },
                category: true
            }
        });

        // Convert S3 URLs to CloudFront URLs
        const propertiesWithCloudFrontUrls = properties.map(property => ({
            ...property,
            images: property.images.map(image => ({
                ...image,
                url: convertToCloudFrontUrl(image.url)
            })),
            category: {
                ...property.category,
                image: convertToCloudFrontUrl(property.category.image)
            }
        }));

        res.json({
            properties: propertiesWithCloudFrontUrls,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page,
                limit
            }
        });
    } catch (err) {
        console.error('Error fetching properties:', err);
        next(err);
    }
});

// Get properties with video tours for carousel
router.get('/video-tours', async (req, res, next) => {
    try {
        const properties = await prisma.property.findMany({
            where: {
                videoUrl: {
                    not: null
                }
            },
            select: {
                id: true,
                name: true,
                videoUrl: true,
                images: {
                    where: {
                        isMain: true
                    },
                    take: 1,
                    select: {
                        url: true
                    }
                }
            },
            take: 6 // Limit to 6 properties for the carousel
        });

        // Convert S3 URLs to CloudFront URLs
        const propertiesWithCloudFrontUrls = properties.map(property => ({
            ...property,
            images: property.images.map(image => ({
                ...image,
                url: convertToCloudFrontUrl(image.url)
            }))
        }));

        res.json(propertiesWithCloudFrontUrls);
    } catch (err) {
        console.error('Error fetching properties with video tours:', err);
        next(err);
    }
});

// Get single property
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const property = await prisma.property.findUnique({
            where: { id: parseInt(id) },
            include: {
                images: {
                    orderBy: {
                        order: 'asc'
                    }
                },
                floorplans: true,
                category: true
            }
        });
        
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Convert S3 URLs to CloudFront URLs
        const propertyWithCloudFrontUrls = {
            ...property,
            images: property.images.map(image => ({
                ...image,
                url: convertToCloudFrontUrl(image.url)
            })),
            category: {
                ...property.category,
                image: convertToCloudFrontUrl(property.category.image)
            }
        };
        
        res.json(propertyWithCloudFrontUrls);
    } catch (err) {
        console.error('Error fetching property:', err);
        next(err);
    }
});

// Create new property
router.post('/', uploadPropertyFiles, validateProperty, async (req, res, next) => {
    try {
        console.log('Files received:', req.files);
        console.log('Request body:', req.body);

        const {
            name, categoryId, status, ownershipType, description,
            city, street, country, latitude, longitude,
            virtualTour, videoUrl, size, beds, baths,
            price, discountedPrice, buildingStoriesNumber,
            buildingCondition, apartmentCondition, aboveGroundFloors,
            reconstructionYearApartment, reconstructionYearBuilding,
            totalAboveGroundFloors, totalUndergroundFloors,
            floorArea, builtUpArea, gardenHouseArea, terraceArea,
            totalLandArea, gardenArea, garageArea, balconyArea,
            pergolaArea, basementArea, workshopArea, totalObjectArea,
            usableArea, landArea, objectType, objectLocationType,
            houseEquipment, accessRoad, objectCondition,
            reservationPrice, equipmentDescription, additionalSources,
            buildingPermit, buildability, utilitiesOnLand,
            utilitiesOnAdjacentRoad, payments, brokerId, secondaryAgent,
            layout
        } = req.body;

        // Validate required fields
        if (!name || !price || !categoryId) {
            return res.status(400).json({
                error: 'Missing required fields',
                details: [
                    !name && 'Name is required',
                    !price && 'Price is required',
                    !categoryId && 'Category is required'
                ].filter(Boolean)
            });
        }

        // Create property with Prisma
        const property = await prisma.property.create({
            data: {
                // Required fields
                name,
                price: parseFloat(price),
                categoryId: parseInt(categoryId),
                status: status.toUpperCase(),
                ownershipType: ownershipType.toUpperCase(),
                description: description || '',
                city: city || '',
                street: street || '',
                country: country || '',
                size: size || '',
                beds: beds || '',
                baths: baths || '',
                layout: layout || '',
                virtualTour: virtualTour || '',
                files: '[]',
                
                // Optional fields
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                videoUrl: videoUrl || null,
                discountedPrice: discountedPrice ? parseFloat(discountedPrice) : null,
                buildingStoriesNumber: buildingStoriesNumber || null,
                buildingCondition: buildingCondition || null,
                apartmentCondition: apartmentCondition || null,
                aboveGroundFloors: aboveGroundFloors || null,
                reconstructionYearApartment: reconstructionYearApartment || null,
                reconstructionYearBuilding: reconstructionYearBuilding || null,
                totalAboveGroundFloors: totalAboveGroundFloors || null,
                totalUndergroundFloors: totalUndergroundFloors || null,
                floorArea: floorArea || null,
                builtUpArea: builtUpArea || null,
                gardenHouseArea: gardenHouseArea || null,
                terraceArea: terraceArea || null,
                totalLandArea: totalLandArea || null,
                gardenArea: gardenArea || null,
                garageArea: garageArea || null,
                balconyArea: balconyArea || null,
                pergolaArea: pergolaArea || null,
                basementArea: basementArea || null,
                workshopArea: workshopArea || null,
                totalObjectArea: totalObjectArea || null,
                usableArea: usableArea || null,
                landArea: landArea || null,
                objectType: objectType || null,
                objectLocationType: objectLocationType || null,
                houseEquipment: houseEquipment || null,
                accessRoad: accessRoad || null,
                objectCondition: objectCondition || null,
                reservationPrice: reservationPrice ? parseFloat(reservationPrice) : null,
                equipmentDescription: equipmentDescription || null,
                additionalSources: additionalSources || null,
                buildingPermit: buildingPermit || null,
                buildability: buildability || null,
                utilitiesOnLand: utilitiesOnLand || null,
                utilitiesOnAdjacentRoad: utilitiesOnAdjacentRoad || null,
                payments: payments || null,
                brokerId: brokerId ? parseInt(brokerId) : null,
                secondaryAgent: secondaryAgent || null,
            }
        });

        // Handle image uploads
        if (req.files && req.files.images) {
            const imageUploadPromises = req.files.images.map((file, index) => 
                uploadFileToS3(file, property.id, 'images', index)
            );
            const imageUrls = await Promise.all(imageUploadPromises);

            // Create image records in the database
            await prisma.propertyImage.createMany({
                data: imageUrls.map((url, index) => ({
                    propertyId: property.id,
                    url,
                    order: index,
                    isMain: index === 0 // Set first image as main
                }))
            });
        }

        // Handle file uploads
        if (req.files && req.files.files) {
            const fileUploadPromises = req.files.files.map((file, index) => 
                uploadFileToS3(file, property.id, 'files', index)
            );
            const fileUrls = await Promise.all(fileUploadPromises);

            // Update property with file URLs
            await prisma.property.update({
                where: { id: property.id },
                data: {
                    files: JSON.stringify(fileUrls)
                }
            });
        }

        // Fetch the complete property with images and category
        const completeProperty = await prisma.property.findUnique({
            where: { id: property.id },
            include: {
                images: {
                    orderBy: {
                        order: 'asc'
                    }
                },
                category: true
            }
        });

        // Convert S3 URLs to CloudFront URLs
        const propertyWithCloudFrontUrls = {
            ...completeProperty,
            images: completeProperty.images.map(image => ({
                ...image,
                url: convertToCloudFrontUrl(image.url)
            })),
            category: {
                ...completeProperty.category,
                image: convertToCloudFrontUrl(completeProperty.category.image)
            }
        };

        res.status(201).json(propertyWithCloudFrontUrls);
    } catch (err) {
        console.error('Error creating property:', err);
        next(err);
    }
});

// Update property
router.put('/:id', validateProperty, async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Convert numeric fields
        if (updateData.latitude) updateData.latitude = parseFloat(updateData.latitude);
        if (updateData.longitude) updateData.longitude = parseFloat(updateData.longitude);
        if (updateData.price) updateData.price = parseFloat(updateData.price);
        if (updateData.discountedPrice) updateData.discountedPrice = parseFloat(updateData.discountedPrice);

        const property = await prisma.property.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                images: true,
                floorplans: true
            }
        });

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        res.json(property);
    } catch (err) {
        console.error('Error updating property:', err);
        next(err);
    }
});

// Delete property
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const propertyId = parseInt(id);

        // Get property with all related data before deletion
        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            include: {
                images: true,
                floorplans: true
            }
        });

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Delete all images from S3
        const imageDeletePromises = property.images.map(image => deleteFile(image.url));
        await Promise.all(imageDeletePromises);

        // Delete all floorplans from S3
        const floorplanDeletePromises = property.floorplans.map(floorplan => deleteFile(floorplan.url));
        await Promise.all(floorplanDeletePromises);

        // Delete any files stored in the files JSON field
        if (property.files) {
            try {
                const files = JSON.parse(property.files);
                if (Array.isArray(files)) {
                    const fileDeletePromises = files.map(file => deleteFile(file.url));
                    await Promise.all(fileDeletePromises);
                }
            } catch (error) {
                console.error('Error parsing property files:', error);
            }
        }

        // Delete the property from the database (this will cascade delete related records)
        await prisma.property.delete({
            where: { id: propertyId }
        });

        res.json({ message: 'Property and all associated files deleted successfully' });
    } catch (err) {
        console.error('Error deleting property:', err);
        next(err);
    }
});

module.exports = router; 