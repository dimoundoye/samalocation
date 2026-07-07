const axios = require('axios');
const FormData = require('form-data');

class ApiClient {
    constructor() {
        this.apiUrl = process.env.SAMALOCATION_API_URL || 'http://localhost:5000';
        this.email = process.env.BOT_EMAIL;
        this.password = process.env.BOT_PASSWORD;
        this.token = null;
    }

    /**
     * Authenticate with Samalocation backend and save the JWT token
     */
    async login() {
        try {
            console.log(`[API Client] Connexion en cours à ${this.apiUrl}/api/auth/login...`);
            const response = await axios.post(`${this.apiUrl}/api/auth/login`, {
                email: this.email,
                password: this.password
            });

            if (response.data && response.data.status === 'success') {
                this.token = response.data.data.token;
                console.log('[API Client] ✅ Authentification réussie.');
                return true;
            } else {
                throw new Error(response.data.message || 'Réponse invalide');
            }
        } catch (error) {
            console.error('[API Client] ❌ Échec de la connexion :', error.response?.data?.message || error.message);
            throw error;
        }
    }

    /**
     * Send headers with the Bearer authorization token
     */
    getHeaders(extraHeaders = {}) {
        return {
            'Authorization': `Bearer ${this.token}`,
            ...extraHeaders
        };
    }

    /**
     * Fetch all properties belonging to the authenticated owner
     */
    async getOwnerProperties() {
        try {
            const response = await axios.get(`${this.apiUrl}/api/properties/owner`, {
                headers: this.getHeaders()
            });
            if (response.data && response.data.status === 'success') {
                return response.data.data || [];
            }
            return [];
        } catch (error) {
            console.error('[API Client] ❌ Erreur lors de la récupération des biens existants :', error.message);
            return [];
        }
    }

    /**
     * Send raw listing text to backend AI parse-listing endpoint
     */
    async parseListing(text) {
        try {
            console.log('[API Client] Envoi du texte de l\'annonce à l\'IA pour structuration...');
            const response = await axios.post(
                `${this.apiUrl}/api/ai/parse-listing`,
                { text },
                { headers: this.getHeaders() }
            );

            if (response.data && response.data.status === 'success') {
                return response.data.data;
            } else {
                throw new Error("L'IA n'a pas pu structurer l'annonce.");
            }
        } catch (error) {
            console.error('[API Client] ❌ Erreur lors du parsing IA :', error.response?.data?.message || error.message);
            return null;
        }
    }

    /**
     * Download a file from an external URL and upload it directly to Samalocation media upload
     */
    async uploadPhotos(photoUrls) {
        if (!photoUrls || photoUrls.length === 0) return [];
        const uploadedUrls = [];

        console.log(`[API Client] Début du transfert de ${photoUrls.length} image(s)...`);

        const form = new FormData();
        let addedFilesCount = 0;

        for (let i = 0; i < photoUrls.length; i++) {
            const url = photoUrls[i];
            try {
                // Download image as a buffer
                const imageResponse = await axios.get(url, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(imageResponse.data, 'binary');

                // Determine filename and mimetype
                const contentType = imageResponse.headers['content-type'] || 'image/jpeg';
                const extension = contentType.split('/')[1] || 'jpg';
                const filename = `scraped_image_${Date.now()}_${i}.${extension}`;

                form.append('photos', buffer, {
                    filename,
                    contentType
                });
                addedFilesCount++;
            } catch (err) {
                console.warn(`[API Client] ⚠️ Impossible de télécharger l'image à l'adresse : ${url}. Erreur :`, err.message);
            }
        }

        if (addedFilesCount === 0) {
            console.log("[API Client] ⚠️ Aucune image n'a pu être téléchargée pour l'upload.");
            return [];
        }

        try {
            const response = await axios.post(
                `${this.apiUrl}/api/upload`,
                form,
                {
                    headers: this.getHeaders(form.getHeaders()),
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                }
            );

            if (response.data && response.data.status === 'success') {
                console.log(`[API Client] ✅ Upload réussi. ${response.data.urls.length} images stockées sur Cloudinary.`);
                return response.data.urls;
            } else {
                throw new Error(response.data.message || "Erreur de réponse lors de l'upload.");
            }
        } catch (error) {
            console.error('[API Client] ❌ Échec de l\'upload des images :', error.response?.data?.message || error.message);
            return [];
        }
    }

    /**
     * Create property in draft mode
     */
    async createProperty(propertyData) {
        try {
            console.log(`[API Client] Création du bien : "${propertyData.name}" à ${propertyData.address}...`);
            const response = await axios.post(
                `${this.apiUrl}/api/properties`,
                propertyData,
                { headers: this.getHeaders() }
            );

            if (response.data && response.data.status === 'success') {
                console.log(`[API Client] ✅ Bien créé avec succès ! (ID: ${response.data.data.id})`);
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Erreur lors de la création');
            }
        } catch (error) {
            console.error('[API Client] ❌ Échec de la création du bien :', error.response?.data?.message || error.message);
            return null;
        }
    }
}

module.exports = ApiClient;
