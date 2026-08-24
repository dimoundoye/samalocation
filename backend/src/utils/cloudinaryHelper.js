const cloudinary = require('cloudinary').v2;

/**
 * Extract Cloudinary public_id from a URL
 * e.g., "https://res.cloudinary.com/cloudname/image/upload/v1234567/samalocation/abc123.jpg" -> "samalocation/abc123"
 */
const extractPublicId = (url) => {
    if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return null;
    try {
        const parts = url.split('/upload/');
        if (parts.length < 2) return null;
        let path = parts[1];
        // Remove version component v1234567/ if present
        path = path.replace(/^v\d+\//, '');
        // Remove file extension
        const lastDotIndex = path.lastIndexOf('.');
        if (lastDotIndex !== -1) {
            path = path.substring(0, lastDotIndex);
        }
        return path;
    } catch (e) {
        return null;
    }
};

/**
 * Delete a single file from Cloudinary by URL or public_id
 */
const deleteFromCloudinary = async (urlOrPublicId) => {
    if (!urlOrPublicId) return;
    const publicId = urlOrPublicId.includes('cloudinary.com') 
        ? extractPublicId(urlOrPublicId) 
        : urlOrPublicId;
        
    if (!publicId) return;

    try {
        const resourceType = (typeof urlOrPublicId === 'string' && urlOrPublicId.toLowerCase().endsWith('.pdf')) ? 'raw' : 'image';
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        console.log(`[CLOUDINARY] Fichier supprimé de Cloudinary : ${publicId}`);
    } catch (err) {
        console.error(`[CLOUDINARY] Erreur suppression Cloudinary (${publicId}):`, err.message);
    }
};

/**
 * Delete multiple files from Cloudinary by array of URLs or public_ids
 */
const deleteMultipleFromCloudinary = async (urls = []) => {
    if (!Array.isArray(urls) || urls.length === 0) return;
    const promises = urls.map(url => deleteFromCloudinary(url));
    await Promise.allSettled(promises);
};

module.exports = {
    extractPublicId,
    deleteFromCloudinary,
    deleteMultipleFromCloudinary
};
