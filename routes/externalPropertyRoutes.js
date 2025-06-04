const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { S3Client, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3');
const prisma = new PrismaClient();

// Helper function to convert S3 key to CloudFront URL
const getCloudFrontUrl = (key) => {
  return `${process.env.CLOUDFRONT_URL}/${key}`;
};

/**
 * @route POST /api/external/properties
 * @desc Create a new property from external source
 * @access Public
 */
router.post('/properties', async (req, res) => {
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
    if (!name || !categoryId || !ownershipType || !description || !city || !street || !country || !size || !beds || !baths || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create the property
    const property = await prisma.property.create({
      data: {
        name,
        categoryId: parseInt(categoryId),
        status,
        ownershipType,
        description,
        city,
        street,
        country,
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
 * @route PUT /api/external/properties/:id
 * @desc Update property images and files from S3
 * @access Public
 */
router.put('/properties/:id', async (req, res) => {
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
        images: true,
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

module.exports = router; 