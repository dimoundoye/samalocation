const Contract = require('../models/contractModel');
const { generateContractPDF } = require('../utils/contractGenerator');
const path = require('path');

const contractController = {
    async createContract(req, res, next) {
        try {
            const owner_id = req.ownerId;
            const contractData = {
                ...req.body,
                owner_id,
                contract_type: req.body.contract_type || 'standard'
            };
            const contract = await Contract.create(contractData);
            res.status(201).json(contract);
        } catch (error) {
            next(error);
        }
    },

    async getOwnerContracts(req, res, next) {
        try {
            const ownerId = req.ownerId;
            const contracts = await Contract.findByOwnerId(ownerId);
            res.json(contracts);
        } catch (error) {
            next(error);
        }
    },

    async getTenantContracts(req, res, next) {
        try {
            const userId = req.user.id;
            const contracts = await Contract.findByTenantUserId(userId);
            res.json(contracts);
        } catch (error) {
            next(error);
        }
    },

    async getContractDetails(req, res, next) {
        try {
            const { id } = req.params;
            const contract = await Contract.findById(id);

            if (!contract) {
                return res.status(404).json({ message: 'Contrat non trouvé' });
            }

            // Security check: only owner (including collaborators) or tenant can see details
            if (req.ownerId !== contract.owner_id && req.user.id !== contract.tenant_user_id) {
                return res.status(403).json({ message: 'Non autorisé' });
            }
            // Simplified check for now
            res.json(contract);
        } catch (error) {
            next(error);
        }
    },

    async signContract(req, res, next) {
        try {
            const { id } = req.params;
            const contract = await Contract.findById(id);

            if (!contract) return res.status(404).json({ message: 'Contrat non trouvé' });

            let result;
            if (req.user.role === 'owner' && req.ownerId === contract.owner_id) {
                result = await Contract.signByOwner(id);
            } else if (req.user.role === 'tenant') {
                // Need to verify if this user is indeed the tenant for this contract
                result = await Contract.signByTenant(id);
            } else {
                return res.status(403).json({ message: 'Non autorisé' });
            }

            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    async downloadContract(req, res, next) {
        try {
            const { id } = req.params;
            const contractData = await Contract.findById(id);

            if (!contractData) {
                return res.status(404).json({ message: "Contrat introuvable" });
            }

            const doc = await generateContractPDF(contractData);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Contrat_${contractData.contract_number}.pdf`);

            doc.pipe(res);
            doc.end();
        } catch (error) {
            console.error('CRITICAL ERROR in PDF Generation:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    message: "Erreur lors de la génération du PDF",
                    details: error.message
                });
            }
        }
    },

    async verifyContract(req, res, next) {
        try {
            const { id } = req.params;
            const contract = await Contract.findById(id);

            if (!contract) {
                return res.status(404).json({ message: 'Contrat non trouvé ou invalide' });
            }

            // Return only public non-sensitive data for verification
            const publicData = {
                id: contract.id,
                contract_number: contract.contract_number,
                contract_type: contract.contract_type,
                property_name: contract.property_name,
                property_address: contract.property_address,
                tenant_name: contract.tenant_name.split(' ').map((n, i) => i === 0 ? n : n[0] + '***').join(' '), // Obfuscate last name
                owner_name: contract.owner_name,
                start_date: contract.start_date,
                status: contract.status,
                tenant_signed: contract.tenant_signed,
                tenant_signed_at: contract.tenant_signed_at,
                owner_signed: contract.owner_signed,
                owner_signed_at: contract.owner_signed_at,
                created_at: contract.created_at
            };

            res.json(publicData);
        } catch (error) {
            next(error);
        }
    }
};

module.exports = contractController;
