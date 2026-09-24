const Contract = require('../models/contractModel');
const { generateContractPDF, generateCustomContractPDFWithBrowser } = require('../utils/contractGenerator');
const path = require('path');
const logActivity = require('../utils/logActivity');
const { emitToWorkspace } = require('../utils/socket');

/**
 * Rôle de l'utilisateur connecté vis-à-vis d'un contrat : 'owner', 'tenant', 'admin' ou null
 */
const getContractAccess = (req, contract) => {
    if (req.ownerId === contract.owner_id || req.user.id === contract.owner_id) return 'owner';
    if (contract.tenant_user_id && req.user.id === contract.tenant_user_id) return 'tenant';
    if (req.user.role === 'admin') return 'admin';
    return null;
};

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
            emitToWorkspace(owner_id, 'workspace_updated', { entity: 'contracts', action: 'create', id: contract.id });

            // Journal d'activité
            const tenantName = req.body.tenant_name || 'Locataire inconnu';
            const propName = req.body.property_name || 'Bien inconnu';
            await logActivity(req, {
                action: 'CREATE',
                entityType: 'contract',
                entityId: contract.id,
                entityLabel: `Contrat créé pour ${tenantName} — ${propName}`,
                metadata: { contract_type: contractData.contract_type, start_date: req.body.start_date, end_date: req.body.end_date }
            });

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

            // Security check: only owner (including collaborators), tenant or admin can see details
            if (!getContractAccess(req, contract)) {
                return res.status(403).json({ message: 'Non autorisé' });
            }
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
            const access = getContractAccess(req, contract);
            if (access === 'owner' && req.user.role === 'owner') {
                result = await Contract.signByOwner(id);
            } else if (access === 'tenant') {
                // Seul le locataire rattaché à ce contrat peut le signer
                result = await Contract.signByTenant(id);
            } else {
                return res.status(403).json({ message: 'Non autorisé' });
            }

            emitToWorkspace(contract.owner_id, 'workspace_updated', { entity: 'contracts', action: 'sign', id });

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

            if (!getContractAccess(req, contractData)) {
                return res.status(403).json({ message: 'Non autorisé' });
            }

            const isInline = req.query.inline === 'true' || req.query.disposition === 'inline';
            const disposition = isInline ? 'inline' : 'attachment';

            if (contractData.custom_content) {
                const buffer = await generateCustomContractPDFWithBrowser(contractData.custom_content, contractData);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `${disposition}; filename=Contrat_${contractData.contract_number}.pdf`);
                
                if (isInline) {
                    console.log(`✅ [SUCCÈS PREVISUALISATION] Contrat N° ${contractData.contract_number} (ID: ${id}) ouvert en ligne`);
                } else {
                    console.log(`✅ [SUCCÈS TÉLÉCHARGEMENT] Contrat N° ${contractData.contract_number} (ID: ${id}) téléchargé`);
                }
                
                res.send(buffer);
            } else {
                const doc = await generateContractPDF(contractData);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `${disposition}; filename=Contrat_${contractData.contract_number}.pdf`);
                
                if (isInline) {
                    console.log(`✅ [SUCCÈS PREVISUALISATION] Contrat N° ${contractData.contract_number} (ID: ${id}) ouvert en ligne`);
                } else {
                    console.log(`✅ [SUCCÈS TÉLÉCHARGEMENT] Contrat N° ${contractData.contract_number} (ID: ${id}) téléchargé`);
                }
                
                doc.pipe(res);
                doc.end();
            }
        } catch (error) {
            console.error(`❌ [ÉCHEC CONTRAT] Erreur lors de la prévisualisation/téléchargement du contrat ID ${req.params.id}:`, error);
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
