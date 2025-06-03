const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Upload } = require('@aws-sdk/lib-storage');
const multer = require('multer');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

// console.log('AWS Credentials:');
// console.log('Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID : '✗ Missing');
// console.log('Secret Access Key:', process.env.AWS_SECRET_ACCESS_KEY ? process.env.AWS_SECRET_ACCESS_KEY : '✗ Missing');

// Configure AWS S3 Client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Configure multer for image uploads
const imageStorage = multer.memoryStorage();
const imageFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WEBP images are allowed.'), false);
    }
};

// Configure multer for document uploads
const fileStorage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, and XLSX files are allowed.'), false);
    }
};

// Create multer instances
const uploadImages = multer({
    storage: imageStorage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit for images
    }
});

const uploadFiles = multer({
    storage: fileStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit for files
    }
});

// Combined middleware for handling both images and files
const uploadPropertyFiles = (req, res, next) => {
    const upload = multer({
        storage: multer.memoryStorage(),
        fileFilter: (req, file, cb) => {
            // Check if it's an image
            if (file.fieldname === 'images') {
                return imageFilter(req, file, cb);
            }
            // Check if it's a document
            if (file.fieldname === 'files') {
                return fileFilter(req, file, cb);
            }
            cb(new Error('Invalid field name'), false);
        },
        limits: {
            fileSize: 10 * 1024 * 1024 // 10MB limit for all files
        }
    }).fields([
        { name: 'images', maxCount: 10 },
        { name: 'files', maxCount: 10 }
    ]);

    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: err.message });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
};

// Function to upload file to S3
const uploadFileToS3 = async (file, propertyId, type, index = 0) => {
    const fileExtension = path.extname(file.originalname);
    // Format index as 3-digit number (001, 002, etc.)
    const paddedIndex = String(index + 1).padStart(3, '0');
    const key = `${type}/${propertyId}/${propertyId}_${paddedIndex}${fileExtension}`;

    const upload = new Upload({
        client: s3Client,
        params: {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype
        }
    });

    await upload.done();
    return `https://d2ibq52z3bzi2i.cloudfront.net/${key}`;
};

// Function to delete a file from S3
const deleteFile = async (fileUrl) => {
    try {
        const key = fileUrl.split('/').slice(-3).join('/'); // Get the key from the URL (properties/id/filename)
        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
        });
        await s3Client.send(command);
        return true;
    } catch (error) {
        console.error('Error deleting file from S3:', error);
        throw error;
    }
};

// Function to get a signed URL for temporary access
const getSignedUrlForFile = async (key, expiresIn = 3600) => {
    try {
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
        });
        const url = await getSignedUrl(s3Client, command, { expiresIn });
        return url;
    } catch (error) {
        console.error('Error generating signed URL:', error);
        throw error;
    }
};

module.exports = {
    uploadImages,
    uploadFiles,
    uploadPropertyFiles,
    uploadFileToS3,
    deleteFile,
    getSignedUrl: getSignedUrlForFile
}; 