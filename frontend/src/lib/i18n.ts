import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    fr: {
        translation: {
            "common": {
                "back": "Retour",
                "loading": "Chargement...",
                "submit": "Envoyer",
                "cancel": "Annuler",
                "change": "Changer",
                "email": "Email",
                "password": "Mot de passe",
                "save": "Enregistrer",
                "delete": "Supprimer",
                "edit": "Modifier",
                "view": "Voir",
                "address": "Adresse",
                "phone": "Téléphone",
                "name": "Nom",
                "type": "Type",
                "status": "Statut",
                "price": "Prix",
                "area": "Surface",
                "bedrooms": "Chambres",
                "bathrooms": "Salles de bain",
                "error": "Erreur",
                "success": "Succès",
                "id": "ID",
                "total": "Total",
                "active": "Actif",
                "inactive": "Inactif",
                "pending": "En attente",
                "confirmed": "Confirmé",
                "refused": "Refusé",
                "all": "Tous",
                "none": "Aucun",
                "search": "Rechercher",
                "filter": "Filtrer",
                "actions": "Actions",
                "yes": "Oui",
                "no": "Non",
                "close": "Fermer",
                "details": "Détails",
                "send": "Envoyer",
                "photos": "photos",
                "unit": "Unité",
                "rent": "Loyer",
                "contact": "Contact",
                "receipt": "Reçu",
                "property": "Propriété",
                "monthly_rent": "Loyer mensuel",
                "coming_soon": "Bientôt disponible",
                "loading_error": "Impossible de charger les données pour le moment.",
                "save_success": "Modifications enregistrées avec succès.",
                "save_error": "La mise à jour a échoué. Veuillez réessayer.",
                "upload_success": "Document téléchargé avec succès.",
                "upload_error": "Échec du téléchargement du document."
            },
            "nav": {
                "home": "Accueil",
                "explore": "Explorer",
                "contact": "Contact",
                "login": "Connexion",
                "signup": "Inscription",
                "logout": "Déconnexion",
                "my_space": "Mon espace",
                "pricing": "Tarifs",
                "about": "À Propos",
                "favorites": "Favoris"
            },
            "period": {
                "jour": "jour",
                "semaine": "semaine",
                "mois": "mois"
            },
            "property": {
                "available": "Dispo",
                "occupied": "Occupé",
                "applied": "Candidaté",
                "verified": "Vérifié",
                "verified_owner": "Propriétaire vérifié",
                "on_request": "Sur demande",
                "view_details": "Voir les détails",
                "bedrooms_short": "ch.",
                "bathrooms_short": "sdb",
                "details_soon": "La page de détails sera bientôt disponible.",
                "new": "Nouveau",
                "favorites": {
                    "add": "Ajouter aux favoris",
                    "remove": "Retirer des favoris",
                    "added": "Ajouté aux favoris",
                    "removed": "Retiré des favoris",
                    "added_desc": "Le bien a été ajouté à vos favoris.",
                    "removed_desc": "Le bien a été retiré de vos favoris.",
                    "login_required": "Connexion requise",
                    "login_required_desc": "Vous devez être connecté pour ajouter des favoris."
                }
            },
            "hero": {
                "badge": "La révolution locative au Sénégal",
                "title_part1": "Gérez & Trouvez un logement",
                "title_part2": "en toute confiance.",
                "description": "Samalocation simplifie la vie des propriétaires et des locataires. Une plateforme transparente, sécurisée et 100% digitale au Sénégal.",
                "list_property": "Mettre en location",
                "search_property": "Chercher un logement",
                "search_placeholder": "Quartier, ville (ex: Almadies, Thiès...)",
                "search_button": "Rechercher"
            },
            "features": {
                "title": "Pourquoi choisir Samalocation\u00A0?",
                "subtitle": "Nous avons construit la solution idéale pour le marché sénégalais, en combinant technologie moderne et simplicité d'utilisation.",
                "security": {
                    "title": "Sécurité",
                    "desc": "Vérification des profils et protection de vos documents et transactions."
                },
                "time": {
                    "title": "Gain de Temps",
                    "desc": "Digitalisez vos visites et la gestion de vos logements en quelques clics."
                },
                "transparency": {
                    "title": "Transparence Totale",
                    "desc": "Des échanges clairs, sans frais cachés, pour une confiance mutuelle."
                }
            },
            "roles": {
                "owners": {
                    "title": "Pour les Propriétaires",
                    "desc": "Gérez votre patrimoine avec sérénité. Trouvez des locataires vérifiés et suivez vos paiements sans stress.",
                    "item1": "Publication de vos logements",
                    "item2": "Trouvez des locataires",
                    "item3": "Suivez vos paiements",
                    "item4": "Gestion des quittances",
                    "cta": "Publier mon annonce"
                },
                "tenants": {
                    "title": "Pour les Locataires",
                    "desc": "Le logement de vos rêves est à portée de clic. Visites facilitées et échange direct avec les propriétaires.",
                    "item1": "Annonces vérifiées au Sénégal",
                    "item2": "Filtrage intelligent",
                    "item3": "Candidature en un clic",
                    "item4": "Discuter avec le propriétaire",
                    "cta": "Trouver mon logement"
                }
            },
            "featured": {
                "title": "Logements à la une",
                "desc": "Découvrez les meilleures opportunités du moment.",
                "view_all": "Voir tout l'immobilier"
            },
            "process": {
                "title": "Comment ça marche\u00A0?",
                "step1": {
                    "title": "Cherchez",
                    "desc": "Explorez nos annonces vérifiées partout au Sénégal."
                },
                "step2": {
                    "title": "Candidature",
                    "desc": "Discutez avec le propriétaire en toute sérénité."
                },
                "step3": {
                    "title": "Installez-vous",
                    "desc": "Emménagez en toute sérénité."
                }
            },
            "cta": {
                "title": "Prêt à simplifier votre expérience locative\u00A0?",
                "desc": "Rejoignez des centaines de Sénégalais qui ont déjà choisi Samalocation pour une gestion transparente.",
                "signup": "S'inscrire",
                "contact": "Nous contacter"
            },
            "footer": {
                "desc": "La plateforme de référence pour la location immobilière au Sénégal. Sécurité, simplicité, transparence.",
                "nav": {
                    "title": "Navigation",
                    "home": "Accueil",
                    "search": "Rechercher",
                    "login": "Se connecter",
                    "about": "À Propos"
                },
                "legal": {
                    "title": "Légal",
                    "terms": "Conditions Générales",
                    "privacy": "Confidentialité"
                },
                "support": {
                    "title": "Support",
                    "contact": "Contactez-nous"
                },
                "copyright": "© 2026 Samalocation. Tous droits réservés au Sénégal"
            },
            "contact": {
                "title": "Contactez-nous",
                "subtitle": "Vous avez une question, une suggestion ou besoin d'assistance ? Notre équipe est là pour vous aider.",
                "info": {
                    "address_title": "Notre Adresse",
                    "address_text": "Ouakam, Cité Batrain, Dakar, Sénégal",
                    "phone_title": "Téléphone",
                    "phone_sub": "Lun-Ven, 9h-18h",
                    "email_title": "Email",
                    "email_sub": "Réponse sous 24h",
                    "hours_title": "Horaires",
                    "hours_sub1": "Lundi - Vendredi : 9h00 - 18h00",
                    "hours_sub2": "Samedi : 9h00 - 13h00"
                },
                "form": {
                    "title": "Envoyez-nous un message",
                    "name": "Nom complet",
                    "name_placeholder": "Votre nom",
                    "email": "Email valide",
                    "email_placeholder": "votre@email.com",
                    "subject": "Objet",
                    "subject_placeholder": "Sujet de votre message",
                    "message": "Message",
                    "message_placeholder": "Comment pouvons-nous vous aider ?",
                    "submit": "Envoyer le message",
                    "sending": "Envoi en cours...",
                    "success_title": "Message envoyé !",
                    "success_desc": "Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais.",
                    "robot_error": "Veuillez confirmer que vous n'êtes pas un robot."
                }
            },
            "auth": {
                "login": {
                    "title": "Connexion",
                    "subtitle": "Heureux de vous revoir !",
                    "card_desc": "Connectez-vous à votre compte",
                    "identifier": "Email ou ID",
                    "placeholder_id": "exemple@email.com ou AA12345",
                    "forgot_password": "Mot de passe oublié\u00A0?",
                    "submit": "Se connecter",
                    "logging_in": "Connexion...",
                    "no_account": "Pas de compte ?",
                    "signup": "S'inscrire"
                },
                "signup": {
                    "title": "Inscription",
                    "card_desc": "Créez votre compte",
                    "welcome": "Bienvenue sur Samalocation",
                    "choice_type": "Quel type de compte souhaitez-vous créer\u00A0?",
                    "owner_type": "Propriétaire",
                    "owner_desc": "Je souhaite mettre mes logements en location et gérer mes locataires.",
                    "tenant_type": "Locataire",
                    "tenant_desc": "Je recherche un logement ou je souhaite gérer mes quittances.",
                    "owner_badge": "Compte Propriétaire",
                    "tenant_badge": "Compte Locataire",
                    "full_name": "Nom et prénom",
                    "company": "Nom de l'entreprise (optionnel)",
                    "phone": "Téléphone",
                    "terms_accept": "J'ai lu et j'accepte les",
                    "terms_link": "conditions d'utilisation",
                    "privacy_link": "politique de confidentialité",
                    "submit": "Créer mon compte",
                    "creating": "Création...",
                    "has_account": "Déjà un compte ?",
                    "login": "Se connecter"
                }
            },
            "search": {
                "title": "Trouvez votre logement idéal",
                "placeholder": "Rechercher par ville, quartier... (ex: Villa à Dakar)",
                "results_count_one": "{{count}} logement disponible",
                "results_count_other": "{{count}} logements disponibles",
                "filters": "Filtres",
                "more_filters": "Plus de filtres",
                "price_range": "Gamme de prix",
                "property_type": "Type de logement",
                "types": {
                    "all": "Tous les types",
                    "house": "Maison",
                    "villa": "Villa",
                    "apartment": "Appartement",
                    "studio": "Studio",
                    "room": "Chambre",
                    "garage": "Garage",
                    "office": "Locale"
                },
                "prices": {
                    "all": "Tous les prix",
                    "under_100k": "0 - 100 000 F",
                    "100k_200k": "100 000 - 200 000 F",
                    "200k_400k": "200 000 - 400 000 F",
                    "over_440k": "400 000 F+"
                },
                "no_results": "Aucun logement disponible pour le moment.",
                "no_results_desc": "Revenez plus tard pour voir les nouvelles offres.",
                "loading": "Chargement des logements...",
                "pagination": {
                    "prev": "Précédent",
                    "next": "Suivant",
                    "page": "Page {{current}} sur {{total}}"
                },
                "view_map": "Voir la carte",
                "view_list": "Voir la liste",
                "map_title": "Localisation",
                "map_desc": "Seuls les logements avec des coordonnées renseignées apparaissent sur la carte."
            },
            "dashboard": {
                "sidebar": {
                    "home": "Tableau de bord",
                    "search": "Rechercher",
                    "properties": "Mes logements",
                    "tenants": "Locataires",
                    "management": "Gérance",
                    "maintenance": "Maintenance",
                    "messages": "Messages",
                    "contracts": "Document",
                    "subscription": "Abonnement",
                    "documents": "Mes reçus",
                    "settings": "Paramètres",
                    "logout": "Déconnexion"
                },
                "common": {
                    "welcome": "Bienvenue",
                    "active_lease": "Contrat",
                    "no_active_lease": "Aucun contrat actif",
                    "new_message": "Nouveau message",
                    "from": "de",
                    "conversations": "Conversations",
                    "no_conversations": "Aucune conversation",
                    "type_message": "Tapez votre message...",
                    "select_chat": "Sélectionnez une conversation pour commencer",
                    "no_messages": "Aucun message dans cette conversation",
                    "personal_info": "Informations personnelles",
                    "account": "Compte",
                    "profile": "Profil",
                    "recent_activity": "Activité récente",
                    "no_activity": "Aucune activité trouvée",
                    "show_guide": "Afficher le guide",
                    "hide_guide": "Masquer le guide"
                }
            },
            "tenant": {
                "my_rentals": "Mon contrat",
                "no_lease_desc": "Vous n'avez pas encore de location assignée. Contactez le propriétaire ou l'administrateur pour plus d'informations.",
                "report_owner": "Signaler un propriétaire",
                "no_owner_error": "Vous devez avoir une location active pour signaler un propriétaire.",
                "no_owner_title": "Aucun propriétaire",
                "rent": "Loyer",
                "unit": "Unité",
                "move_in": "Arrivée",
                "owner": "Propriétaire",
                "not_defined": "Non définie",
                "receipt_n": "Reçu N°",
                "download_pdf": "Télécharger PDF",
                "no_receipts": "Aucun reçu disponible",
                "delete_confirm": "Êtes-vous sûr de vouloir supprimer ce message ?",
                "delete_success": "Le message a été supprimé avec succès."
            },
            "owner": {
                "incomplete_config": "Configuration incomplète",
                "incomplete_desc": "Terminez la configuration de votre compte en intégrant une signature électronique pour vos reçus.",
                "scan_signature": "Scanner ma signature",
                "add_property": "Ajouter un logement",
                "add_first_property": "Ajouter mon premier logement",
                "property_registered": "logement enregistré",
                "properties_registered": "logements enregistrés",
                "no_properties": "Aucun logement enregistré",
                "no_properties_desc": "Commencez par ajouter votre premier logement (maison, villa, appartement, studio, chambre ou locale)",
                "total_units": "Unités totales",
                "available_units": "Disponibles",
                "unit_types": "Types d'unités",
                "published": "Publié",
                "draft": "Brouillon",
                "publish": "Publier",
                "unpublish": "Dépublier",
                "property_published": "Logement publié",
                "property_published_desc": "Le logement est maintenant visible par les locataires",
                "property_unpublished": "Logement dépublié",
                "property_unpublished_desc": "Le logement n'est plus visible publiquement",
                "search_tenant": "Rechercher un locataire...",
                "assign_tenant": "Affecter un locataire",
                "tenant_registered": "locataire enregistré",
                "tenants_registered": "locataires enregistrés",
                "tenants_list": "Liste des locataires",
                "no_tenants": "Aucun locataire enregistré",
                "no_tenant_found": "Aucun locataire ne correspond à votre recherche",
                "tenant": "Locataire",
                "conversations": "Conversations",
                "stats": {
                    "total_properties": "Total des logements",
                    "occupied_units": "Unités occupées",
                    "occupancy_rate": "Taux d'occupation",
                    "active_tenants": "Locataires actifs",
                    "total_revenue": "Revenu total",
                    "revenue_growth": "Croissance des revenus",
                    "payment_received": "Paiement reçu"
                }
            },
            "settings": {
                "title": "Paramètres",
                "subtitle": "Gérez votre profil et vos préférences",
                "profile_tab": "Profil",
                "account_tab": "Compte",
                "profile_info": "Informations du profil",
                "full_name": "Nom complet",
                "full_name_placeholder": "Votre nom complet",
                "company_name": "Nom de l'entreprise",
                "company_placeholder": "Ex: Immobilier Dakar",
                "contact_phone": "Téléphone de contact",
                "phone_placeholder": "Ex: +221 77 123 45 67",
                "contact_email": "Email de contact",
                "email_placeholder": "Ex: contact@immobilierdakar.com",
                "address_placeholder": "Ex: Dakar, Sénégal",
                "bio": "Bio",
                "bio_placeholder": "Quelques mots sur vous...",
                "identity_verification": "Demande de Badge Vérifié",
                "profile_verified": "Propriétaire Vérifié",
                "verification_pending": "Vérification en cours",
                "verification_rejected": "Vérification rejetée",
                "verification_desc": "Obtenez le badge de confiance pour rassurer vos locataires et valoriser vos annonces.",
                "verification_docs_desc": "Pour être certifié, vous devez fournir les 3 documents suivants :",
                "ownership_proof": "Preuve de propriété",
                "proof_desc": "Titre Foncier ou facture (Eau/Élec) à votre nom.",
                "liveness_check": "Liveness Check",
                "selfie_desc": "Un selfie de vous tenant votre pièce d'identité.",
                "id_card": "Pièce d'identité",
                "id_card_desc": "Copie lisible de votre CNI ou Passeport.",
                "no_document": "Document non soumis",
                "formats_supported": "Formats JPG ou PNG supportés",
                "submit_id": "Soumettre les documents",
                "signature_stamp": "Signature ou Cachet",
                "signature_desc": "Cette signature ou cachet sera automatiquement apposé sur tous vos reçus de loyer.",
                "no_signature": "Aucune signature",
                "scan_signature_stamp": "Scanner une signature ou un cachet",
                "receipt_form": "Modèle de reçu PDF",
                "receipt_form_desc": "Choisissez l'apparence de vos quittances de loyer générées.",
                "receipt_templates": {
                    "classic": "Classique (Défaut)",
                    "modern": "Moderne & Épuré",
                    "minimal": "Minimaliste (N&B)",
                    "corporate": "Agence / Corporate"
                },
                "save_changes": "Enregistrer les modifications",
                "saving": "Enregistrement...",
                "change_password": "Changer le mot de passe",
                "change_password_desc": "Modifiez votre mot de passe de connexion",
                "current_password": "Mot de passe actuel",
                "new_password": "Nouveau mot de passe",
                "confirm_password": "Confirmer le nouveau mot de passe",
                "password_placeholder": "Minimum 6 caractères",
                "confirm_placeholder": "Retapez le mot de passe",
                "password_mismatch": "Les mots de passe ne correspondent pas.",
                "password_length": "Le mot de passe doit contenir au moins 6 caractères.",
                "password_changed": "Votre mot de passe a été modifié avec succès.",
                "fill_all_fields": "Veuillez remplir tous les champs.",
                "branding": "Branding & Logo",
                "branding_desc": "Personnalisez vos quittances avec le logo de votre agence.",
                "no_logo": "Aucun logo",
                "upload_logo": "Importer un logo"
            },
            "signature_scanner": {
                "title": "Scanner de Signature & Cachet",
                "description": "Prenez une photo de votre signature sur papier blanc. Nous allons supprimer le fond automatiquement.",
                "import_photo": "Cliquez pour importer une photo",
                "formats_mobile": "PNG, JPG ou Capture mobile",
                "scan_threshold": "Seuil de scan",
                "threshold_desc": "Ajustez pour supprimer le fond sans effacer la signature.",
                "bw_mode": "Mode Noir & Blanc",
                "bw_desc": "Activez pour une signature purement noire (idéal pour les baux). Désactivez pour garder les couleurs des cachets.",
                "use_signature": "Utiliser cette signature",
                "processed_title": "Signature traitée",
                "processed_desc": "Votre signature a été optimisée et prête à être enregistrée."
            }
        }
    },
    en: {
        translation: {
            "common": {
                "back": "Back",
                "loading": "Loading...",
                "submit": "Submit",
                "cancel": "Cancel",
                "change": "Change",
                "email": "Email",
                "password": "Password",
                "save": "Save",
                "delete": "Delete",
                "edit": "Edit",
                "view": "View",
                "address": "Address",
                "phone": "Phone",
                "name": "Name",
                "type": "Type",
                "status": "Status",
                "price": "Price",
                "area": "Area",
                "bedrooms": "Bedrooms",
                "bathrooms": "Bathrooms",
                "error": "Error",
                "success": "Success",
                "id": "ID",
                "total": "Total",
                "active": "Active",
                "inactive": "Inactive",
                "pending": "Pending",
                "confirmed": "Confirmed",
                "refused": "Refused",
                "all": "All",
                "none": "None",
                "search": "Search",
                "filter": "Filter",
                "actions": "Actions",
                "yes": "Yes",
                "no": "No",
                "close": "Close",
                "details": "Details",
                "send": "Send",
                "photos": "photos",
                "unit": "Unit",
                "rent": "Rent",
                "contact": "Contact",
                "receipt": "Receipt",
                "property": "Property",
                "monthly_rent": "Monthly Rent",
                "coming_soon": "Coming soon",
                "loading_error": "Unable to load data at this time.",
                "save_success": "Changes saved successfully.",
                "save_error": "Failed to save changes. Please try again.",
                "upload_success": "Document uploaded successfully.",
                "upload_error": "Failed to upload document."
            },
            "nav": {
                "home": "Home",
                "explore": "Explore",
                "contact": "Contact",
                "login": "Login",
                "signup": "Sign Up",
                "logout": "Logout",
                "my_space": "My space",
                "pricing": "Pricing",
                "about": "About Us",
                "favorites": "Favorites"
            },
            "period": {
                "jour": "day",
                "semaine": "week",
                "mois": "month"
            },
            "property": {
                "available": "Avail",
                "occupied": "Occupied",
                "applied": "Applied",
                "verified": "Verified",
                "verified_owner": "Verified Owner",
                "on_request": "On request",
                "view_details": "View details",
                "bedrooms_short": "bd.",
                "bathrooms_short": "bt",
                "details_soon": "The details page will be available soon.",
                "new": "New",
                "favorites": {
                    "add": "Add to favorites",
                    "remove": "Remove from favorites",
                    "added": "Added to favorites",
                    "removed": "Removed from favorites",
                    "added_desc": "The property has been added to your favorites.",
                    "removed_desc": "The property has been removed from your favorites.",
                    "login_required": "Login required",
                    "login_required_desc": "You must be logged in to add favorites."
                }
            },
            "hero": {
                "badge": "The rental revolution in Senegal",
                "title_part1": "Manage & Find a property",
                "title_part2": "with confidence.",
                "description": "Samalocation simplifies life for owners and tenants. A transparent, secure and 100% digital platform in Senegal.",
                "list_property": "List property",
                "search_property": "Search property",
                "search_placeholder": "Neighborhood, city (ex: Almadies, Thies...)",
                "search_button": "Search"
            },
            "features": {
                "title": "Why choose Samalocation?",
                "subtitle": "We built the ideal solution for the Senegalese market, combining modern technology and ease of use.",
                "security": {
                    "title": "Security",
                    "desc": "Profile verification and protection of your documents and transactions."
                },
                "time": {
                    "title": "Save Time",
                    "desc": "Digitize your visits and property management in a few clicks."
                },
                "transparency": {
                    "title": "Total Transparency",
                    "desc": "Clear exchanges, no hidden fees, for mutual trust."
                }
            },
            "roles": {
                "owners": {
                    "title": "For Owners",
                    "desc": "Manage your assets with peace of mind. Find verified tenants and track your payments stress-free.",
                    "item1": "Post your property",
                    "item2": "Find tenants",
                    "item3": "Track payments",
                    "item4": "Receipt management",
                    "cta": "Post my ad"
                },
                "tenants": {
                    "title": "For Tenants",
                    "desc": "The home of your dreams is just a click away. Easy visits and direct exchange with owners.",
                    "item1": "Verified listings in Senegal",
                    "item2": "Smart filtering",
                    "item3": "One-click application",
                    "item4": "Chat with the owner",
                    "cta": "Find my home"
                }
            },
            "featured": {
                "title": "Featured Properties",
                "desc": "Discover the best opportunities of the moment.",
                "view_all": "View all real estate"
            },
            "process": {
                "title": "How it works?",
                "step1": {
                    "title": "Search",
                    "desc": "Explore our verified listings across Senegal."
                },
                "step2": {
                    "title": "Application",
                    "desc": "Chat with the owner with peace of mind."
                },
                "step3": {
                    "title": "Move in",
                    "desc": "Move in with peace of mind."
                }
            },
            "cta": {
                "title": "Ready to simplify your rental experience?",
                "desc": "Join hundreds of Senegalese who have already chosen Samalocation for transparent management.",
                "signup": "Sign Up",
                "contact": "Contact Us"
            },
            "footer": {
                "desc": "The leading platform for real estate rentals in Senegal. Security, simplicity, transparency.",
                "nav": {
                    "title": "Navigation",
                    "home": "Home",
                    "search": "Search",
                    "login": "Login",
                    "about": "About Us"
                },
                "legal": {
                    "title": "Legal",
                    "terms": "Terms & Conditions",
                    "privacy": "Privacy Policy"
                },
                "support": {
                    "title": "Support",
                    "contact": "Contact Us"
                },
                "copyright": "© 2026 Samalocation. All rights reserved in Senegal"
            },
            "contact": {
                "title": "Contact Us",
                "subtitle": "Do you have a question, a suggestion or need assistance? Our team is here to help.",
                "info": {
                    "address_title": "Our Address",
                    "address_text": "Ouakam, Cite Batrain, Dakar, Senegal",
                    "phone_title": "Phone",
                    "phone_sub": "Mon-Fri, 9am-6pm",
                    "email_title": "Email",
                    "email_sub": "Response within 24h",
                    "hours_title": "Opening Hours",
                    "hours_sub1": "Monday - Friday: 9:00am - 6:00pm",
                    "hours_sub2": "Saturday: 9:00am - 1:00pm"
                },
                "form": {
                    "title": "Send us a message",
                    "name": "Full name",
                    "name_placeholder": "Your name",
                    "email": "Valid email",
                    "email_placeholder": "your@email.com",
                    "subject": "Subject",
                    "subject_placeholder": "Subject of your message",
                    "message": "Message",
                    "message_placeholder": "How can we help you?",
                    "submit": "Send message",
                    "sending": "Sending...",
                    "success_title": "Message sent!",
                    "success_desc": "We have received your message and will respond as soon as possible.",
                    "robot_error": "Please confirm that you are not a robot."
                }
            },
            "auth": {
                "login": {
                    "title": "Login",
                    "subtitle": "Happy to see you again!",
                    "card_desc": "Log in to your account",
                    "identifier": "Email or ID",
                    "placeholder_id": "example@email.com or AA12345",
                    "forgot_password": "Forgot password?",
                    "submit": "Login",
                    "logging_in": "Logging in...",
                    "no_account": "No account?",
                    "signup": "Sign Up"
                },
                "signup": {
                    "title": "Sign Up",
                    "card_desc": "Create your account",
                    "welcome": "Welcome to Samalocation",
                    "choice_type": "What type of account would you like to create?",
                    "owner_type": "Owner",
                    "owner_desc": "I want to list my properties and manage my tenants.",
                    "tenant_type": "Tenant",
                    "tenant_desc": "I'm looking for a home or I want to manage my receipts.",
                    "owner_badge": "Owner Account",
                    "tenant_badge": "Tenant Account",
                    "full_name": "Full Name",
                    "company": "Company Name (optional)",
                    "phone": "Phone",
                    "terms_accept": "I have read and I accept the",
                    "terms_link": "terms of use",
                    "privacy_link": "privacy policy",
                    "submit": "Create my account",
                    "creating": "Creating...",
                    "has_account": "Already have an account?",
                    "login": "Login"
                }
            },
            "search": {
                "title": "Find your ideal home",
                "placeholder": "Search by city, neighborhood... (ex: Villa in Dakar)",
                "results_count_one": "{{count}} property available",
                "results_count_other": "{{count}} properties available",
                "filters": "Filters",
                "more_filters": "More filters",
                "price_range": "Price range",
                "property_type": "Property type",
                "types": {
                    "all": "All types",
                    "house": "House",
                    "villa": "Villa",
                    "apartment": "Apartment",
                    "studio": "Studio",
                    "room": "Room",
                    "garage": "Garage",
                    "office": "Office"
                },
                "prices": {
                    "all": "All prices",
                    "under_100k": "0 - 100,000 F",
                    "100k_200k": "100,000 - 200,000 F",
                    "200k_400k": "200,000 - 400,000 F",
                    "over_440k": "400,000 F+"
                },
                "no_results": "No properties available at the moment.",
                "no_results_desc": "Check back later to see new offers.",
                "loading": "Loading properties...",
                "pagination": {
                    "prev": "Previous",
                    "next": "Next",
                    "page": "Page {{current}} of {{total}}"
                },
                "view_map": "View map",
                "view_list": "View list",
                "map_title": "Location",
                "map_desc": "Only properties with coordinates provided appear on the map."
            },
            "dashboard": {
                "sidebar": {
                    "home": "Dashboard",
                    "search": "Search",
                    "properties": "Properties",
                    "tenants": "Tenants",
                    "management": "Management",
                    "maintenance": "Maintenance",
                    "messages": "Messages",
                    "contracts": "Contracts",
                    "subscription": "Subscription",
                    "settings": "Settings",
                    "logout": "Logout"
                },
                "common": {
                    "welcome": "Welcome",
                    "active_lease": "Active lease",
                    "no_active_lease": "No active lease",
                    "new_message": "New message",
                    "from": "from",
                    "conversations": "Conversations",
                    "no_conversations": "No conversations",
                    "type_message": "Type your message...",
                    "select_chat": "Select a conversation to start",
                    "no_messages": "No messages in this conversation",
                    "personal_info": "Personal information",
                    "account": "Account",
                    "profile": "Profile",
                    "recent_activity": "Recent Activity",
                    "no_activity": "No activity found",
                    "show_guide": "Show Guide",
                    "hide_guide": "Hide Guide",
                    "loading_error": "Unable to load data at this time.",
                    "save_success": "Changes saved successfully.",
                    "save_error": "Failed to save changes. Please try again.",
                    "upload_success": "Document uploaded successfully.",
                    "upload_error": "Failed to upload document."
                },
                "settings": {
                    "title": "Settings",
                    "subtitle": "Manage your profile and preferences",
                    "profile_tab": "Profile",
                    "account_tab": "Account",
                    "profile_info": "Profile Information",
                    "full_name": "Full Name",
                    "full_name_placeholder": "Your full name",
                    "company_name": "Company Name",
                    "company_placeholder": "Ex: Dakar Real Estate",
                    "contact_phone": "Contact Phone",
                    "phone_placeholder": "Ex: +221 77 123 45 67",
                    "contact_email": "Contact Email",
                    "email_placeholder": "Ex: contact@dakar-estate.com",
                    "address_placeholder": "Ex: Dakar, Senegal",
                    "bio": "Bio",
                    "bio_placeholder": "A few words about yourself...",
                    "identity_verification": "Verified Badge Request",
                    "profile_verified": "Verified Owner",
                    "verification_pending": "Verification in progress",
                    "verification_rejected": "Verification rejected",
                    "verification_desc": "Get the trust badge to reassure your tenants and highlight your listings.",
                    "verification_docs_desc": "To be certified, you must provide the following 3 documents:",
                    "ownership_proof": "Proof of ownership",
                    "proof_desc": "Title deed or utility bill (Water/Elec) in your name.",
                    "liveness_check": "Liveness Check",
                    "selfie_desc": "A selfie of you holding your ID card.",
                    "id_card": "Identity Document",
                    "id_card_desc": "Readable copy of your ID card or Passport.",
                    "no_document": "Document not submitted",
                    "formats_supported": "JPG or PNG formats supported",
                    "submit_id": "Submit documents",
                    "signature_stamp": "Signature or Stamp",
                    "signature_desc": "This signature or stamp will be automatically applied to all your rent receipts.",
                    "no_signature": "No signature",
                    "scan_signature_stamp": "Scan a signature or stamp",
                    "receipt_form": "PDF Receipt Template",
                    "receipt_form_desc": "Choose the appearance of your generated rent receipts.",
                    "receipt_templates": {
                        "classic": "Classic (Default)",
                        "modern": "Modern & Sleek",
                        "minimal": "Minimalist (B&W)",
                        "corporate": "Agency / Corporate"
                    },
                    "save_changes": "Save Changes",
                    "saving": "Saving...",
                    "change_password": "Change Password",
                    "change_password_desc": "Update your login password",
                    "current_password": "Current Password",
                    "new_password": "New Password",
                    "confirm_password": "Confirm New Password",
                    "password_placeholder": "Minimum 6 characters",
                    "confirm_placeholder": "Retype password",
                    "password_mismatch": "Passwords do not match.",
                    "password_length": "Password must be at least 6 characters.",
                    "password_changed": "Password changed successfully.",
                    "fill_all_fields": "Please fill in all fields.",
                    "branding": "Branding & Logo",
                    "branding_desc": "Personalize your receipts with your agency logo.",
                    "no_logo": "No logo",
                    "upload_logo": "Upload logo"
                },
                "signature_scanner": {
                    "title": "Signature & Stamp Scanner",
                    "description": "Take a photo of your signature on white paper. We will remove the background automatically.",
                    "import_photo": "Click to import a photo",
                    "formats_mobile": "PNG, JPG or Mobile capture",
                    "scan_threshold": "Scan threshold",
                    "threshold_desc": "Adjust to remove the background without erasing the signature.",
                    "bw_mode": "Black & White Mode",
                    "bw_desc": "Enable for a purely black signature (ideal for leases). Disable to keep the colors of the stamps.",
                    "use_signature": "Use this signature",
                    "processed_title": "Signature processed",
                    "processed_desc": "Your signature has been optimized and is ready to be saved."
                }
            },
            "tenant": {
                "my_rentals": "My rentals",
                "no_lease_desc": "You don't have an active lease assigned yet. Contact the owner or administrator for more information.",
                "report_owner": "Report owner",
                "no_owner_error": "You must have an active lease to report an owner.",
                "no_owner_title": "No owner",
                "rent": "Rent",
                "unit": "Unit",
                "move_in": "Arrival",
                "owner": "Owner",
                "not_defined": "Not defined",
                "receipt_n": "Receipt N°",
                "download_pdf": "Download PDF",
                "no_receipts": "No receipts available",
                "delete_confirm": "Are you sure you want to delete this message?",
                "delete_success": "The message has been successfully deleted."
            },
            "owner": {
                "incomplete_config": "Incomplete configuration",
                "incomplete_desc": "Finish your account configuration by integrating an electronic signature for your receipts.",
                "scan_signature": "Scan my signature",
                "add_property": "Add Property",
                "add_first_property": "Add first property",
                "property_registered": "property registered",
                "properties_registered": "properties registered",
                "no_properties": "No properties registered",
                "no_properties_desc": "Start by adding your first real estate property (house, garage, apartment, studio, room or office)",
                "total_units": "Total units",
                "available_units": "Available",
                "unit_types": "Unit types",
                "published": "Published",
                "draft": "Draft",
                "publish": "Publish",
                "unpublish": "Unpublish",
                "property_published": "Property published",
                "property_published_desc": "The property is now visible to tenants",
                "property_unpublished": "Property unpublished",
                "property_unpublished_desc": "The property is no longer publicly visible",
                "search_tenant": "Search for a tenant...",
                "assign_tenant": "Assign a tenant",
                "tenant_registered": "tenant registered",
                "tenants_registered": "tenants registered",
                "tenants_list": "Tenants list",
                "no_tenants": "No tenants registered",
                "no_tenant_found": "No tenant matches your search",
                "tenant": "Tenant",
                "conversations": "Conversations",
                "stats": {
                    "total_properties": "Total Properties",
                    "occupied_units": "Occupied Units",
                    "occupancy_rate": "Occupancy rate",
                    "active_tenants": "Active Tenants",
                    "total_revenue": "Total Revenue",
                    "revenue_growth": "Revenue growth",
                    "payment_received": "Payment Received"
                }
            }
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'fr',
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        }
    });

export default i18n;
