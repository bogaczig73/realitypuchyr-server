const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { uploadPropertyFiles, uploadFileToS3, deleteFile } = require('../services/s3Service');
const { validateProperty } = require('../middleware/validation');
const { translateProperty, SUPPORTED_LANGUAGES } = require('../services/translationService');
const { S3Client, ListObjectsV2Command, DeleteObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

const prisma = new PrismaClient();

// Helper function to convert S3 URLs to CloudFront URLs
const convertToCloudFrontUrl = (url) => {
    if (!url) return url;
    return url.replace(
        'realitypuchyr-estate-photos.s3.eu-central-1.amazonaws.com',
        'd2ibq52z3bzi2i.cloudfront.net'
    );
};

// Helper function to convert S3 key to CloudFront URL (for external routes)
const getCloudFrontUrl = (key) => {
  return `${process.env.CLOUDFRONT_URL}/${key}`;
};

// Helper function to get preferred language from Accept-Language header
const getPreferredLanguage = (acceptLanguage) => {
  if (!acceptLanguage) return 'cs';
  
  // Parse Accept-Language header (e.g., "en-US,en;q=0.9,cs;q=0.8")
  const languages = acceptLanguage.split(',')
    .map(lang => {
      const [language, q = 'q=1.0'] = lang.trim().split(';');
      return {
        language: language.split('-')[0], // Get primary language code
        q: parseFloat(q.split('=')[1])
      };
    })
    .sort((a, b) => b.q - a.q);

  // Find first supported language
  const preferredLanguage = languages.find(lang => 
    SUPPORTED_LANGUAGES.includes(lang.language)
  );

  return preferredLanguage?.language || 'cs';
};

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
        const yearsOfExperience = new Date().getFullYear() - 2019;

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

// Get property counts by category
router.get('/category-stats', async (req, res, next) => {
    try {
        // First get all categories
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: {
                        properties: {
                            where: {
                                status: 'ACTIVE'
                            }
                        }
                    }
                }
            }
        });

        // Transform the data into a more usable format
        const formattedStats = categories.map(category => ({
            categoryId: category.id,
            categoryName: category.name,
            count: category._count.properties
        }));
        res.json(formattedStats);
    } catch (err) {
        console.error('Error fetching property category statistics:', err);
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
        const preferredLanguage = req.language || 'cs';

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
                category: true,
                translations: {
                    where: {
                        language: preferredLanguage
                    }
                }
            }
        });

        // Process properties to use translations if available
        const processedProperties = properties.map(property => {
            let processedProperty = { ...property };
            
            // If translation exists and it's not the original language, use it
            if (property.translations && property.translations.length > 0 && preferredLanguage !== property.language) {
                const translation = property.translations[0];
                processedProperty = {
                    ...property,
                    name: translation.name,
                    description: translation.description,
                    country: translation.country,
                    size: translation.size,
                    beds: translation.beds,
                    baths: translation.baths,
                    buildingCondition: translation.buildingCondition,
                    apartmentCondition: translation.apartmentCondition,
                    objectType: translation.objectType,
                    objectLocationType: translation.objectLocationType,
                    houseEquipment: translation.houseEquipment,
                    accessRoad: translation.accessRoad,
                    objectCondition: translation.objectCondition,
                    equipmentDescription: translation.equipmentDescription,
                    additionalSources: translation.additionalSources,
                    buildingPermit: translation.buildingPermit,
                    buildability: translation.buildability,
                    utilitiesOnLand: translation.utilitiesOnLand,
                    utilitiesOnAdjacentRoad: translation.utilitiesOnAdjacentRoad,
                    payments: translation.payments,
                    translations: undefined // Remove translations array from response
                };
            }

            // Convert S3 URLs to CloudFront URLs
            return {
                ...processedProperty,
                images: processedProperty.images.map(image => ({
                    ...image,
                    url: convertToCloudFrontUrl(image.url)
                })),
                category: {
                    ...processedProperty.category,
                    image: convertToCloudFrontUrl(processedProperty.category.image)
                }
            };
        });

        res.json({
            properties: processedProperties,
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
                    },
                    orderBy: {
                        order: 'asc'
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

// Get property with translation
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const preferredLanguage = req.language || 'cs';
    console.log('Using language:', preferredLanguage);

    const property = await prisma.property.findUnique({
      where: { id: parseInt(id) },
      include: {
        translations: {
          where: {
            language: preferredLanguage
          }
        },
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

    // If translation exists and it's not the original language, use it
    if (property.translations && property.translations.length > 0 && preferredLanguage !== property.language) {
      const translation = property.translations[0];
      const translatedProperty = {
        ...property,
        name: translation.name,
        description: translation.description,
        country: translation.country,
        size: translation.size,
        beds: translation.beds,
        baths: translation.baths,
        buildingCondition: translation.buildingCondition,
        apartmentCondition: translation.apartmentCondition,
        objectType: translation.objectType,
        objectLocationType: translation.objectLocationType,
        houseEquipment: translation.houseEquipment,
        accessRoad: translation.accessRoad,
        objectCondition: translation.objectCondition,
        equipmentDescription: translation.equipmentDescription,
        additionalSources: translation.additionalSources,
        buildingPermit: translation.buildingPermit,
        buildability: translation.buildability,
        utilitiesOnLand: translation.utilitiesOnLand,
        utilitiesOnAdjacentRoad: translation.utilitiesOnAdjacentRoad,
        payments: translation.payments,
        translations: undefined // Remove translations array from response
      };

      // Convert S3 URLs to CloudFront URLs
      const propertyWithCloudFrontUrls = {
        ...translatedProperty,
        images: translatedProperty.images.map(image => ({
          ...image,
          url: convertToCloudFrontUrl(image.url)
        })),
        category: {
          ...translatedProperty.category,
          image: convertToCloudFrontUrl(translatedProperty.category.image)
        }
      };

      return res.json(propertyWithCloudFrontUrls);
    }

    // If no translation exists or if preferred language is the original language,
    // return original property with CloudFront URLs
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
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new property (Internal/Admin)
router.post('/', uploadPropertyFiles, validateProperty, async (req, res, next) => {
    try {
        console.log('Files received:', req.files);
        console.log('Request body:', req.body);

        const {
            name, categoryId, status, ownershipType, description,
            city, street, country, language = 'cs', latitude, longitude,
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

        // Validate language
        if (!SUPPORTED_LANGUAGES.includes(language)) {
            return res.status(400).json({ error: 'Unsupported language' });
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
                description: description || null,
                city: city || null,
                street: street || null,
                country: country || null,
                size: parseInt(size) || 0,
                beds: parseInt(beds) || 0,
                baths: parseInt(baths) || 0,
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
                language,
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

/**
 * @route POST /api/properties/external
 * @desc Create a new property from external source (simplified version)
 * @access Public
 */
router.post('/external', async (req, res) => {
  try {
    const {
      name,
      categoryId,
      status = 'ACTIVE',
      ownershipType,
      description,
      city,
      street,
      country,
      latitude,
      longitude,
      virtualTour,
      videoUrl,
      size,
      beds,
      baths,
      layout,
      files,
      price,
      discountedPrice,
      buildingStoriesNumber,
      buildingCondition,
      apartmentCondition,
      aboveGroundFloors,
      reconstructionYearApartment,
      reconstructionYearBuilding,
      totalAboveGroundFloors,
      totalUndergroundFloors,
      floorArea,
      builtUpArea,
      gardenHouseArea,
      terraceArea,
      totalLandArea,
      gardenArea,
      garageArea,
      balconyArea,
      pergolaArea,
      basementArea,
      workshopArea,
      totalObjectArea,
      usableArea,
      landArea,
      objectType,
      objectLocationType,
      houseEquipment,
      accessRoad,
      objectCondition,
      reservationPrice,
      equipmentDescription,
      additionalSources,
      buildingPermit,
      buildability,
      utilitiesOnLand,
      utilitiesOnAdjacentRoad,
      payments,
      brokerId,
      secondaryAgent
    } = req.body;

    // Validate required fields
    const requiredFields = {
      name: 'Property name',
      categoryId: 'Category',
      ownershipType: 'Ownership type',
      size: 'Size',
      price: 'Price'
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([field]) => !req.body[field])
      .map(([_, label]) => label);

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        missingFields: missingFields
      });
    }

    // Create the property
    const property = await prisma.property.create({
      data: {
        name,
        categoryId: parseInt(categoryId),
        status,
        ownershipType,
        description: description || null,
        city: city || null,
        street: street || null,
        country: country || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        virtualTour,
        videoUrl,
        size,
        beds,
        baths,
        layout,
        files: files ? JSON.stringify(files) : '[]',
        price: parseFloat(price),
        discountedPrice: discountedPrice ? parseFloat(discountedPrice) : null,
        buildingStoriesNumber,
        buildingCondition,
        apartmentCondition,
        aboveGroundFloors,
        reconstructionYearApartment,
        reconstructionYearBuilding,
        totalAboveGroundFloors,
        totalUndergroundFloors,
        floorArea,
        builtUpArea,
        gardenHouseArea,
        terraceArea,
        totalLandArea,
        gardenArea,
        garageArea,
        balconyArea,
        pergolaArea,
        basementArea,
        workshopArea,
        totalObjectArea,
        usableArea,
        landArea,
        objectType,
        objectLocationType,
        houseEquipment,
        accessRoad,
        objectCondition,
        reservationPrice,
        equipmentDescription,
        additionalSources,
        buildingPermit,
        buildability,
        utilitiesOnLand,
        utilitiesOnAdjacentRoad,
        payments,
        brokerId,
        secondaryAgent
      }
    });

    // Create S3 folders for the new property
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'eu-central-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    // Create empty objects to represent folders
    const folderPromises = [
      s3Client.send(new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME || 'realitypuchyr-estate-photos',
        Key: `images/${property.id}/`,
        Body: ''
      })),
      s3Client.send(new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME || 'realitypuchyr-estate-photos',
        Key: `floorplans/${property.id}/`,
        Body: ''
      })),
      s3Client.send(new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME || 'realitypuchyr-estate-photos',
        Key: `files/${property.id}/`,
        Body: ''
      }))
    ];

    await Promise.all(folderPromises);

    res.status(201).json({
      data: property.id
    });
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating property',
      details: error.message
    });
  }
});

/**
 * @route PUT /api/properties/:id/sync
 * @desc Update property images and files from S3 (external sync)
 * @access Public
 */
router.put('/:id/sync', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Initialize S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'eu-central-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: parseInt(id) },
      include: {
        images: true,
        floorplans: true
      }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // List objects from S3
    const imagesCommand = new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME || 'realitypuchyr-estate-photos',
      Prefix: `images/${id}/`
    });

    const floorplansCommand = new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME || 'realitypuchyr-estate-photos',
      Prefix: `floorplans/${id}/`
    });

    const filesCommand = new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME || 'realitypuchyr-estate-photos',
      Prefix: `files/${id}/`
    });

    const [imagesResult, floorplansResult, filesResult] = await Promise.all([
      s3Client.send(imagesCommand),
      s3Client.send(floorplansCommand),
      s3Client.send(filesCommand)
    ]);

    // Process images
    if (imagesResult.Contents && imagesResult.Contents.length > 0) {
      // Delete existing images from database
      await prisma.propertyImage.deleteMany({
        where: { propertyId: parseInt(id) }
      });

      // Filter out directory entries and create new image records
      const imagePromises = imagesResult.Contents
        .filter(image => !image.Key.endsWith('/')) // Filter out directory entries
        .map((image, index) => {
          const imageUrl = getCloudFrontUrl(image.Key);
          return prisma.propertyImage.create({
            data: {
              url: imageUrl,
              isMain: index === 0, // First image is main
              order: index,
              propertyId: parseInt(id)
            }
          });
        });

      await Promise.all(imagePromises);
    }

    // Process floorplans
    if (floorplansResult.Contents && floorplansResult.Contents.length > 0) {
      // Delete existing floorplans from database
      await prisma.propertyFloorplan.deleteMany({
        where: { propertyId: parseInt(id) }
      });

      // Filter out directory entries and create new floorplan records
      const floorplanPromises = floorplansResult.Contents
        .filter(floorplan => !floorplan.Key.endsWith('/')) // Filter out directory entries
        .map((floorplan) => {
          const floorplanUrl = getCloudFrontUrl(floorplan.Key);
          const name = floorplan.Key.split('/').pop().split('.')[0]; // Get filename without extension
          return prisma.propertyFloorplan.create({
            data: {
              url: floorplanUrl,
              name: name,
              propertyId: parseInt(id)
            }
          });
        });

      await Promise.all(floorplanPromises);
    }

    // Process files
    if (filesResult.Contents && filesResult.Contents.length > 0) {
      const files = filesResult.Contents
        .filter(file => !file.Key.endsWith('/')) // Filter out directory entries
        .map(file => ({
          name: file.Key.split('/').pop(),
          url: getCloudFrontUrl(file.Key),
          size: file.Size,
          type: file.Key.split('.').pop()
        }));

      // Update property with new files
      await prisma.property.update({
        where: { id: parseInt(id) },
        data: {
          files: files // Prisma will handle the JSON conversion
        }
      });
    }

    // Get updated property
    const updatedProperty = await prisma.property.findUnique({
      where: { id: parseInt(id) },
      include: {
        images: {
          orderBy: {
            order: 'asc'
          }
        },
        floorplans: true
      }
    });

    res.json({
      success: true,
      data: updatedProperty
    });
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating property',
      details: error.message
    });
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

        // Initialize S3 client
        const s3Client = new S3Client({
            region: process.env.AWS_REGION || 'eu-central-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });

        // List all objects in the property's folders
        const listCommands = [
            new ListObjectsV2Command({
                Bucket: process.env.AWS_BUCKET_NAME,
                Prefix: `images/${propertyId}/`
            }),
            new ListObjectsV2Command({
                Bucket: process.env.AWS_BUCKET_NAME,
                Prefix: `floorplans/${propertyId}/`
            }),
            new ListObjectsV2Command({
                Bucket: process.env.AWS_BUCKET_NAME,
                Prefix: `files/${propertyId}/`
            })
        ];

        const [imagesResult, floorplansResult, filesResult] = await Promise.all(
            listCommands.map(cmd => s3Client.send(cmd))
        );

        // Delete all objects from S3
        const deletePromises = [];

        // Delete images
        if (imagesResult.Contents) {
            const imageDeletePromises = imagesResult.Contents.map(object => 
                s3Client.send(new DeleteObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: object.Key
                }))
            );
            deletePromises.push(...imageDeletePromises);
        }

        // Delete floorplans
        if (floorplansResult.Contents) {
            const floorplanDeletePromises = floorplansResult.Contents.map(object => 
                s3Client.send(new DeleteObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: object.Key
                }))
            );
            deletePromises.push(...floorplanDeletePromises);
        }

        // Delete files
        if (filesResult.Contents) {
            const fileDeletePromises = filesResult.Contents.map(object => 
                s3Client.send(new DeleteObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: object.Key
                }))
            );
            deletePromises.push(...fileDeletePromises);
        }

        // Wait for all S3 deletions to complete
        await Promise.all(deletePromises);

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

// Change property state
router.patch('/:id/state', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        if (!status || !['ACTIVE', 'SOLD', 'RENT'].includes(status.toUpperCase())) {
            return res.status(400).json({
                error: 'Invalid status',
                details: 'Status must be one of: ACTIVE, SOLD, RENT'
            });
        }

        // Update property status
        const property = await prisma.property.update({
            where: { id: parseInt(id) },
            data: { status: status.toUpperCase() },
            include: {
                images: {
                    orderBy: {
                        order: 'asc'
                    }
                },
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
        console.error('Error updating property state:', err);
        next(err);
    }
});

// Translate property to target language
router.post('/:id/translate', async (req, res) => {
  try {
    const { id } = req.params;
    const { targetLanguage, sourceLanguage } = req.body;

    if (!targetLanguage || !SUPPORTED_LANGUAGES.includes(targetLanguage)) {
      return res.status(400).json({ error: 'Invalid or unsupported target language' });
    }

    // Get the property
    const property = await prisma.property.findUnique({
      where: { id: parseInt(id) },
      include: {
        translations: true
      }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check if translation already exists
    console.log('Translating property:', property);
    console.log('Translating property:', targetLanguage);
    const existingTranslation = property.translations.find(t => t.language === targetLanguage);
    if (existingTranslation) {
      return res.status(400).json({ error: 'Translation already exists for this language' });
    }

    // Translate the property
    const translations = await translateProperty(property, targetLanguage, sourceLanguage);

    // Create translation record
    const translation = await prisma.propertyTranslation.create({
      data: {
        propertyId: parseInt(id),
        language: targetLanguage,
        ...translations
      }
    });

    res.json(translation);
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 