const express = require('express');
const router = express.Router();
const { uploadImages, uploadFiles, uploadFileToS3 } = require('../services/s3Service');

// Upload single image
router.post('/image', uploadImages.single('image'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const imageUrl = await uploadFileToS3(req.file, 'temp', 'images');
        res.json({ imageUrl });
    } catch (err) {
        console.error('Error uploading image:', err);
        next(err);
    }
});

// Upload multiple images
router.post('/images', uploadImages.array('images', 10), async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const uploadPromises = req.files.map(file => uploadFileToS3(file, 'temp', 'images'));
        const imageUrls = await Promise.all(uploadPromises);
        
        res.json({ imageUrls });
    } catch (err) {
        console.error('Error uploading images:', err);
        next(err);
    }
});

// Upload single file
router.post('/file', uploadFiles.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileUrl = await uploadFileToS3(req.file, 'temp', 'files');
        res.json({ 
            fileUrl,
            name: req.file.originalname,
            type: req.file.mimetype,
            size: req.file.size
        });
    } catch (err) {
        console.error('Error uploading file:', err);
        next(err);
    }
});

// Upload multiple files
router.post('/files', uploadFiles.array('files', 10), async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const uploadPromises = req.files.map(async file => {
            const fileUrl = await uploadFileToS3(file, 'temp', 'files');
            return {
                fileUrl,
                name: file.originalname,
                type: file.mimetype,
                size: file.size
            };
        });
        
        const files = await Promise.all(uploadPromises);
        res.json({ files });
    } catch (err) {
        console.error('Error uploading files:', err);
        next(err);
    }
});

module.exports = router; 