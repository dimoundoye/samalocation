const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const authMiddleware = require('../middleware/authMiddleware');

// Cloudinary configuration is automatically picked up from CLOUDINARY_URL in .env
// but we can also be explicit if needed. 
// cloudinary.config({ 
//   cloud_name: '...', 
//   api_key: '...', 
//   api_secret: '...' 
// });

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'samalocation',
        format: async (req, file) => {
            const ext = file.mimetype.split('/')[1];
            return ['jpeg', 'jpg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
        },
        public_id: (req, file) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            return uniqueSuffix;
        },
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// POST /api/upload
router.post('/', authMiddleware, upload.array('photos', 5), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ status: 'error', message: 'No files uploaded' });
        }

        // multer-storage-cloudinary adds 'path' to the file object which is the Cloudinary URL
        const fileUrls = req.files.map(file => {
            return file.path;
        });

        res.json({
            status: 'success',
            urls: fileUrls
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
