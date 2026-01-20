-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : dim. 18 jan. 2026 à 18:14
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `samalocation`
--

-- --------------------------------------------------------

--
-- Structure de la table `contact_messages`
--

CREATE TABLE `contact_messages` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `status` enum('new','replied','archived') DEFAULT 'new',
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `contact_messages`
--

INSERT INTO `contact_messages` (`id`, `name`, `email`, `subject`, `message`, `status`, `created_at`) VALUES
('141bdbbd-562a-4a5c-9acf-9ff72e849aac', 'pape sini', 'ndoyedollar@gmail.com', 'Demande de renseignement', 'yufvbniytgft_iunyihyèoyètgtè', 'new', '2026-01-14 00:15:32'),
('afbed05d-d1d3-46e4-883c-c10a52d82ce1', 'Khadim', 'dimoundoye@gmail.com', 'blocage', 'je suis ici', 'replied', '2026-01-12 10:03:39');

-- --------------------------------------------------------

--
-- Structure de la table `messages`
--

CREATE TABLE `messages` (
  `id` varchar(36) NOT NULL,
  `sender_id` varchar(36) NOT NULL,
  `receiver_id` varchar(36) NOT NULL,
  `property_id` varchar(36) DEFAULT NULL,
  `unit_id` varchar(36) DEFAULT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `messages`
--

INSERT INTO `messages` (`id`, `sender_id`, `receiver_id`, `property_id`, `unit_id`, `message`, `is_read`, `created_at`) VALUES
('120adb4e-31b7-4687-b19a-f2965a4899fe', '6bc229ba-f390-49b4-9303-320ef136e85d', '0354859a-58a7-4525-9bb8-8c526fe9a289', 'e48fd2d8-8d3e-4e28-886b-82b698da4743', NULL, 'Bonjour,\n\nJe suis candidat(e) pour le bien \"Maison à Dakar\" situé à Ouakam cite batrain.\n\nMerci de me répondre.\n\nCordialement.', 1, '2026-01-13 22:40:25'),
('3fa79476-294c-4f87-b172-a88dcb77d9b5', '0354859a-58a7-4525-9bb8-8c526fe9a289', '0354859a-58a7-4525-9bb8-8c526fe9a289', 'e48fd2d8-8d3e-4e28-886b-82b698da4743', NULL, 'Bonjour,\n\nJe suis candidat(e) pour le bien \"Maison à Dakar\" situé à Ouakam cite batrain.\n\nMerci de me répondre.\n\nCordialement.', 1, '2026-01-13 23:51:21'),
('60915562-9418-4482-bb4a-4d4d6b137118', '1b112da5-b6a3-47c4-b040-0d8b8c6969f3', '0354859a-58a7-4525-9bb8-8c526fe9a289', '7d4f3d3b-bb67-49c7-b463-6c0b7e87bdf0', NULL, 'Bonjour,\n\nJe suis candidat(e) pour le bien \"Chambre cité avion\" situé à oukam; cité avion.\n\nMerci de me répondre.\n\nCordialement.', 1, '2026-01-13 23:59:04'),
('c000a3e5-8fd3-4fe3-8f4a-9f2633ce35a9', '1b112da5-b6a3-47c4-b040-0d8b8c6969f3', '0354859a-58a7-4525-9bb8-8c526fe9a289', '7d4f3d3b-bb67-49c7-b463-6c0b7e87bdf0', NULL, 'gkbgiui', 1, '2026-01-13 23:59:36'),
('e7905800-cd89-49bf-904f-43be608ba468', '0354859a-58a7-4525-9bb8-8c526fe9a289', '1b112da5-b6a3-47c4-b040-0d8b8c6969f3', NULL, NULL, 'hygugu', 0, '2026-01-14 00:00:18');

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
--

CREATE TABLE `notifications` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `type` enum('message','property','tenant','system','receipt') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `link` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `is_read`, `link`, `created_at`) VALUES
('50dc3b99-94b7-44bd-889d-042f1a16a622', '0354859a-58a7-4525-9bb8-8c526fe9a289', 'message', 'Nouvelle candidature', 'Vous avez reçu un nouveau message concernant un bien.', 1, '/owner-dashboard?tab=messages&propertyId=7d4f3d3b-bb67-49c7-b463-6c0b7e87bdf0', '2026-01-13 23:59:36'),
('51e2695a-f0d0-11f0-a14b-005056c00001', '6bc229ba-f390-49b4-9303-320ef136e85d', 'receipt', 'Nouveau reçu de loyer', 'Votre reçu de paiement N° REC-202601-0005 pour 1/2026 est maintenant disponible.', 1, NULL, '2026-01-13 22:36:36'),
('5f966991-f0dc-11f0-a14b-005056c00001', '1b112da5-b6a3-47c4-b040-0d8b8c6969f3', 'receipt', 'Nouveau reçu de loyer', 'Votre reçu de paiement N° REC-202601-0006 pour 1/2026 est maintenant disponible.', 1, NULL, '2026-01-14 00:02:53'),
('608f5390-13f7-4bf8-954f-f4078e5478c6', '0354859a-58a7-4525-9bb8-8c526fe9a289', 'message', 'Nouvelle candidature', 'Vous avez reçu un nouveau message concernant un bien.', 1, '/owner-dashboard?tab=messages&propertyId=e48fd2d8-8d3e-4e28-886b-82b698da4743', '2026-01-13 23:51:21'),
('8e12d3a0-7926-4388-a6d3-376f51576206', '0354859a-58a7-4525-9bb8-8c526fe9a289', 'message', 'Nouvelle candidature', 'Vous avez reçu un nouveau message concernant un bien.', 1, '/owner-dashboard?tab=messages&propertyId=7d4f3d3b-bb67-49c7-b463-6c0b7e87bdf0', '2026-01-13 23:59:04'),
('96736d64-1025-4470-925c-75dab553e318', '1b112da5-b6a3-47c4-b040-0d8b8c6969f3', 'message', 'Nouveau message', 'Vous avez reçu un nouveau message concernant un bien.', 0, '/owner-dashboard?tab=messages', '2026-01-14 00:00:18'),
('b8bc046f-c73a-42e4-810e-01581e75d323', '0354859a-58a7-4525-9bb8-8c526fe9a289', 'message', 'Nouvelle candidature', 'Vous avez reçu un nouveau message concernant un bien.', 1, '/owner-dashboard?tab=messages&propertyId=e48fd2d8-8d3e-4e28-886b-82b698da4743', '2026-01-13 22:40:25');

-- --------------------------------------------------------

--
-- Structure de la table `owner_profiles`
--

CREATE TABLE `owner_profiles` (
  `id` varchar(36) NOT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `user_profile_id` varchar(36) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `bio` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `owner_profiles`
--

INSERT INTO `owner_profiles` (`id`, `company_name`, `phone`, `address`, `user_profile_id`, `created_at`, `updated_at`, `bio`) VALUES
('0354859a-58a7-4525-9bb8-8c526fe9a289', 'dim-immo', '77123456789', 'dakar ', '0354859a-58a7-4525-9bb8-8c526fe9a289', '2026-01-08 01:34:16', '2026-01-11 02:44:01', 'je suis courtier et bailleur en meme temps'),
('564d00d9-25f6-40b8-81f4-60e5f014c302', 'Test Owner', '771234567', NULL, '564d00d9-25f6-40b8-81f4-60e5f014c302', '2026-01-11 14:30:15', '2026-01-11 14:30:15', NULL),
('59dc61d9-1dce-4ed5-b02d-3887a6f420f6', 'samb-immo', '+221771234567', NULL, '59dc61d9-1dce-4ed5-b02d-3887a6f420f6', '2026-01-11 13:05:24', '2026-01-11 13:05:24', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `properties`
--

CREATE TABLE `properties` (
  `id` varchar(36) NOT NULL,
  `owner_id` varchar(36) NOT NULL,
  `property_type` enum('maison','villa','appartement','studio','chambre','garage','box','locale') NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `description` text DEFAULT NULL,
  `photo_url` text DEFAULT NULL,
  `photos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT (JSON_ARRAY()),
  `equipments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT (JSON_ARRAY()),
  `is_published` tinyint(1) DEFAULT 0,
  `published_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `properties`
--

INSERT INTO `properties` (`id`, `owner_id`, `property_type`, `name`, `address`, `description`, `photo_url`, `photos`, `equipments`, `is_published`, `published_at`, `created_at`, `updated_at`) VALUES
('0965cd4c-16ea-48f4-be96-544ce89dfe53', '59dc61d9-1dce-4ed5-b02d-3887a6f420f6', 'chambre', 'Chambre Almadie', 'almadie ngor', 'pret du pharmacie', 'http://localhost:5000/uploads/1768136852205-630012230.png', '[\"http://localhost:5000/uploads/1768136852205-630012230.png\", \"http://localhost:5000/uploads/1768136852212-543959979.png\", \"http://localhost:5000/uploads/1768136852225-495350996.png\"]', '[\"parking\"]', 0, NULL, '2026-01-11 13:07:32', '2026-01-12 09:03:19'),
('7bb76ff8-9168-4649-8dc8-2440c37dfc49', '564d00d9-25f6-40b8-81f4-60e5f014c302', 'appartement', 'Appartement Test', 'Dakar', NULL, NULL, '[]', '[]', 0, NULL, '2026-01-11 14:37:13', '2026-01-11 14:37:13'),
('7d4f3d3b-bb67-49c7-b463-6c0b7e87bdf0', '0354859a-58a7-4525-9bb8-8c526fe9a289', 'chambre', 'Chambre cité avion', 'oukam; cité avion', 'climatisation', 'http://localhost:5000/uploads/1768338079946-744058433.jpg', '[\"http://localhost:5000/uploads/1768338079946-744058433.jpg\"]', '[\"climatisation\"]', 1, '2026-01-13 23:26:21', '2026-01-13 21:01:19', '2026-01-13 23:26:21'),
('e48fd2d8-8d3e-4e28-886b-82b698da4743', '0354859a-58a7-4525-9bb8-8c526fe9a289', 'maison', 'Maison à Dakar', 'Ouakam cite batrain', 'pret du transport en commun', 'http://localhost:5000/uploads/1768078869343-101699691.png', '[\"http://localhost:5000/uploads/1768078869343-101699691.png\"]', '[\"climatisation\"]', 1, '2026-01-10 21:01:14', '2026-01-10 21:01:09', '2026-01-10 21:01:13'),
('ec0721ba-19f3-4ba4-9262-f57691574f65', '0354859a-58a7-4525-9bb8-8c526fe9a289', 'maison', 'Appartement Dakar', 'cité batrain Ouakam Dakar', 'inijnjiyfvjfgvjdrjgviygov', 'http://localhost:5000/uploads/1767837145681-852393220.png', '[\"http://localhost:5000/uploads/1767837145681-852393220.png\", \"http://localhost:5000/uploads/1767837145694-788143727.png\"]', '[\"climatisation\"]', 1, '2026-01-08 01:52:40', '2026-01-08 01:52:25', '2026-01-08 01:52:40');

-- --------------------------------------------------------

--
-- Structure de la table `property_units`
--

CREATE TABLE `property_units` (
  `id` varchar(36) NOT NULL,
  `property_id` varchar(36) NOT NULL,
  `unit_type` enum('maison','villa','chambre','appartement','studio','garage','box','locale') NOT NULL,
  `unit_number` varchar(100) NOT NULL,
  `monthly_rent` int(11) NOT NULL DEFAULT 0,
  `area_sqm` decimal(10,2) DEFAULT NULL,
  `bedrooms` int(11) DEFAULT 0,
  `bathrooms` int(11) DEFAULT 0,
  `is_available` tinyint(1) DEFAULT 1,
  `description` text DEFAULT NULL,
  `photos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT (JSON_ARRAY()),
  `rent_period` enum('jour','semaine','mois') NOT NULL DEFAULT 'mois',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `property_units`
--

INSERT INTO `property_units` (`id`, `property_id`, `unit_type`, `unit_number`, `monthly_rent`, `area_sqm`, `bedrooms`, `bathrooms`, `is_available`, `description`, `photos`, `rent_period`, `created_at`) VALUES
('1a5c174f-c611-457b-8e4c-bf80488361fd', 'ec0721ba-19f3-4ba4-9262-f57691574f65', 'maison', 'Maison', 150000, 150.00, 2, 2, 0, 'inijnjiyfvjfgvjdrjgviygov', '[]', 'mois', '2026-01-08 01:52:25'),
('2b2c1453-29c9-4b4c-9529-308c2b813a73', '0965cd4c-16ea-48f4-be96-544ce89dfe53', 'chambre', 'Chambre', 50000, 10.00, 1, 0, 0, 'pret du pharmacie', '[]', 'mois', '2026-01-11 13:07:32'),
('51e781c2-3dd5-401a-95aa-3c16b3052c95', '7d4f3d3b-bb67-49c7-b463-6c0b7e87bdf0', 'chambre', 'Chambre', 24984, 25.00, 1, 0, 1, 'climatisation', '[]', 'mois', '2026-01-13 21:01:20'),
('5ad7c4f7-8d07-42ee-aa04-d0887fb6961d', '7bb76ff8-9168-4649-8dc8-2440c37dfc49', 'appartement', 'Appartement', 150000, NULL, 0, 0, 0, NULL, '[]', 'mois', '2026-01-11 14:37:13'),
('8e14b16e-0ac9-4fa2-813f-95d4c4d0dfad', 'e48fd2d8-8d3e-4e28-886b-82b698da4743', 'maison', 'Maison', 500000, 300.00, 6, 4, 1, 'pret du transport en commun', '[]', 'mois', '2026-01-10 21:01:09');

-- --------------------------------------------------------

--
-- Structure de la table `receipts`
--

CREATE TABLE `receipts` (
  `id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `property_id` varchar(36) NOT NULL,
  `month` int(11) NOT NULL,
  `year` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_method` varchar(50) DEFAULT 'virement',
  `receipt_number` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `receipts`
--

INSERT INTO `receipts` (`id`, `tenant_id`, `property_id`, `month`, `year`, `amount`, `payment_date`, `payment_method`, `receipt_number`, `notes`, `created_at`, `updated_at`) VALUES
('0510376d-8bd0-48a1-bdcc-99ecab1a48c4', '6bc229ba-f390-49b4-9303-320ef136e85d', 'e48fd2d8-8d3e-4e28-886b-82b698da4743', 1, 2026, 50000.00, '2026-01-12', 'especes', 'REC-202601-0014', 'remis par koto', '2026-01-12 15:30:44', '2026-01-12 15:30:44'),
('09339b6a-b836-44b0-a4a7-c05b5e789e6e', '02fc576d-ef18-11f0-99cb-005056c00001', '7bb76ff8-9168-4649-8dc8-2440c37dfc49', 1, 2026, 75000.00, '2026-01-11', 'especes', 'REC-202601-0005', 'Test recu apres correction', '2026-01-11 18:07:59', '2026-01-11 18:07:59'),
('161d154e-7683-42a3-b869-f09c3df65638', '6bc229ba-f390-49b4-9303-320ef136e85d', 'e48fd2d8-8d3e-4e28-886b-82b698da4743', 1, 2026, 45000.00, '2026-01-11', 'especes', 'REC-202601-0009', 'Remis par moussa', '2026-01-11 21:14:21', '2026-01-11 21:14:21'),
('60049b46-d92b-4a3f-b73f-9a643333a117', '6bc229ba-f390-49b4-9303-320ef136e85d', 'e48fd2d8-8d3e-4e28-886b-82b698da4743', 1, 2026, 20000.00, '2026-01-13', 'especes', 'REC-202601-0005', 'remis par abdoulaye', '2026-01-13 22:36:36', '2026-01-13 22:36:36'),
('b47dd446-1baa-48c0-93b2-b2085e334e9d', '1b112da5-b6a3-47c4-b040-0d8b8c6969f3', 'ec0721ba-19f3-4ba4-9262-f57691574f65', 1, 2026, 20000.00, '2026-01-14', 'especes', 'REC-202601-0006', 'remis par pape sini\n', '2026-01-14 00:02:53', '2026-01-14 00:02:53'),
('f6bcbd52-0ecc-4172-9b2e-3fbe7761fafa', '6bc229ba-f390-49b4-9303-320ef136e85d', 'e48fd2d8-8d3e-4e28-886b-82b698da4743', 1, 2026, 250000.00, '2026-01-12', 'especes', 'REC-202601-0020', 'Remis par son frere mouhamed', '2026-01-12 22:39:29', '2026-01-12 22:39:29');

-- --------------------------------------------------------

--
-- Structure de la table `reports`
--

CREATE TABLE `reports` (
  `id` varchar(36) NOT NULL,
  `reporter_id` varchar(36) NOT NULL,
  `reported_id` varchar(36) NOT NULL,
  `reason` text NOT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `admin_notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `tenants`
--

CREATE TABLE `tenants` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `unit_id` varchar(36) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `move_in_date` date NOT NULL,
  `lease_end_date` date DEFAULT NULL,
  `deposit_amount` int(11) DEFAULT 0,
  `monthly_rent` int(11) NOT NULL,
  `status` enum('active','pending','terminated') NOT NULL DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `tenants`
--

INSERT INTO `tenants` (`id`, `user_id`, `unit_id`, `full_name`, `phone`, `email`, `move_in_date`, `lease_end_date`, `deposit_amount`, `monthly_rent`, `status`, `created_at`) VALUES
('243936e0-a9a1-4610-8198-0aec8bb1dbf8', '05a91382-9855-4108-81c3-e98bb5c9a0d4', '2b2c1453-29c9-4b4c-9529-308c2b813a73', 'djili sene', '+221785876897', 'djili@gmail.com', '2026-01-11', NULL, 0, 50000, 'active', '2026-01-11 22:39:15'),
('3f419060-02f1-41cd-a8f9-94863d614246', '02fc576d-ef18-11f0-99cb-005056c00001', '5ad7c4f7-8d07-42ee-aa04-d0887fb6961d', 'Tenant Test', '771112233', 'tenant@test.com', '2026-01-01', NULL, 0, 150000, 'active', '2026-01-11 14:47:53'),
('74e0540c-f192-413e-9d84-347517f944e5', NULL, '5ad7c4f7-8d07-42ee-aa04-d0887fb6961d', 'New Tenant', '771234567', 'new-tenant@test.com', '2026-01-01', NULL, 0, 150000, 'active', '2026-01-11 16:34:13'),
('9925ef3a-c2ae-4000-9174-8a64942964a7', '6bc229ba-f390-49b4-9303-320ef136e85d', '8e14b16e-0ac9-4fa2-813f-95d4c4d0dfad', 'babacar mbaye', '+221785876897', 'mbaye@gmail.com', '2026-01-10', NULL, 0, 500000, 'active', '2026-01-10 22:31:06'),
('f9953dae-283a-4ccb-9139-bd785fc59d7c', '1b112da5-b6a3-47c4-b040-0d8b8c6969f3', '1a5c174f-c611-457b-8e4c-bf80488361fd', 'Aicha', '+221785876897', 'aishanaa07@gmail.com', '2026-01-14', NULL, 0, 150000, 'active', '2026-01-14 00:01:40');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_blocked` tinyint(1) DEFAULT 0,
  `blocked_at` datetime DEFAULT NULL,
  `blocked_by` varchar(36) DEFAULT NULL,
  `block_reason` text DEFAULT NULL,
  `verification_token` varchar(255) DEFAULT NULL,
  `verification_token_expires` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `email_verified`, `created_at`, `updated_at`, `is_blocked`, `blocked_at`, `blocked_by`, `block_reason`, `verification_token`, `verification_token_expires`) VALUES
('02fc576d-ef18-11f0-99cb-005056c00001', 'tenant@test.com', '$2a$10$YhUCd2VZDhH4BPVnREWnZeXzN.jt2GqOiECEXH6kGV1X4X3X7EqFm', 0, '2026-01-11 18:04:45', '2026-01-11 18:04:45', 0, NULL, NULL, NULL, NULL, NULL),
('0354859a-58a7-4525-9bb8-8c526fe9a289', 'khadim@gmail.com', '$2b$10$Qvq1k6SuCMZh8NN2LycloOnsrA4uNh0u6UvUaGyWZfUzOncb/.ONW', 0, '2026-01-08 01:34:16', '2026-01-11 01:15:44', 0, NULL, NULL, NULL, NULL, NULL),
('05a91382-9855-4108-81c3-e98bb5c9a0d4', 'djili@gmail.com', '$2b$10$A08NTnuY3r8g8rPXc.RxA.8tmcjXqsNsXcoBEHGzgDMNHTIb4HOtG', 0, '2026-01-10 21:53:06', '2026-01-10 21:53:06', 0, NULL, NULL, NULL, NULL, NULL),
('1b112da5-b6a3-47c4-b040-0d8b8c6969f3', 'aishanaa07@gmail.com', '$2b$10$k7WIU.soP8TjFpkvwIOdeeM2hV6ztsQ9.68wAcxgktFd.s6K8/axe', 1, '2026-01-13 23:58:30', '2026-01-13 23:58:30', 0, NULL, NULL, NULL, NULL, NULL),
('564d00d9-25f6-40b8-81f4-60e5f014c302', 'testowner@test.com', '$2b$10$7cstvLPvY2TuyNN2Y5sX1eOnWf1pKLRVX/pcMBZoW6ts/PQDUuyZO', 0, '2026-01-11 14:30:15', '2026-01-11 14:30:15', 0, NULL, NULL, NULL, NULL, NULL),
('59dc61d9-1dce-4ed5-b02d-3887a6f420f6', 'samb@gmail.com', '$2b$10$CbFQi1JZHUNun8fgL2slruVliZus5FXaDGwIYRrbhk1iv7dEkCkU6', 0, '2026-01-11 13:05:24', '2026-01-11 13:05:24', 0, NULL, NULL, NULL, NULL, NULL),
('6bc229ba-f390-49b4-9303-320ef136e85d', 'mbaye@gmail.com', '$2b$10$0TRaMwqrKWUDG50/JEdEHeWVOxjIyO6xzY1l/Fhzoq5z1HRt7aU6G', 0, '2026-01-08 01:53:51', '2026-01-11 02:20:24', 0, NULL, NULL, NULL, NULL, NULL),
('7c36048e-1f72-42c8-ab69-6e053cca8417', 'babouserigne028@gmail.com', '$2b$10$0tN/5YbNOa0/cMgr0FqGlO5SuW06NHQB0DAlTfD7JfWb4Nq0SN9j2', 0, '2026-01-09 13:10:06', '2026-01-09 13:10:06', 0, NULL, NULL, NULL, NULL, NULL),
('b9a53c5a-4aa6-42d6-bc7a-1a8254c9e15a', 'admin@samalocation.com', '$2b$10$vC.37YVvjrUF3oLCllxvgOhG5vr0IQgFGREJMN16WZcY74bzighd6', 0, '2026-01-10 19:10:29', '2026-01-10 19:10:29', 0, NULL, NULL, NULL, NULL, NULL),
('c0f71a49-6f29-45ba-b2c4-249d20886a60', 'khadim5896@gmail.com', '$2b$10$bHUxlvopcvQbpmDSjOYWlOpNJmOO7bBE026kFmG5NglDeeNkTBfyq', 1, '2026-01-12 12:56:18', '2026-01-12 12:56:18', 0, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `user_profiles`
--

CREATE TABLE `user_profiles` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `role` enum('admin','owner','tenant') NOT NULL DEFAULT 'tenant',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `user_profiles`
--

INSERT INTO `user_profiles` (`id`, `email`, `full_name`, `phone`, `role`, `created_at`, `updated_at`) VALUES
('0354859a-58a7-4525-9bb8-8c526fe9a289', 'khadim@gmail.com', 'Khadim ndoye', '77123456789', 'owner', '2026-01-08 01:34:16', '2026-01-11 02:33:47'),
('05a91382-9855-4108-81c3-e98bb5c9a0d4', 'djili@gmail.com', 'djili sene', '+221771234567', 'tenant', '2026-01-10 21:53:06', '2026-01-10 21:53:06'),
('1b112da5-b6a3-47c4-b040-0d8b8c6969f3', 'aishanaa07@gmail.com', 'Aicha', '+221 784507903', 'tenant', '2026-01-13 23:58:30', '2026-01-13 23:58:30'),
('564d00d9-25f6-40b8-81f4-60e5f014c302', 'testowner@test.com', 'Test Owner', '771234567', 'owner', '2026-01-11 14:30:15', '2026-01-11 14:30:15'),
('59dc61d9-1dce-4ed5-b02d-3887a6f420f6', 'samb@gmail.com', 'ousmane samb', '+221771234567', 'owner', '2026-01-11 13:05:24', '2026-01-11 13:05:24'),
('6bc229ba-f390-49b4-9303-320ef136e85d', 'mbaye@gmail.com', 'babacar mbaye', '+221771234567', 'tenant', '2026-01-08 01:53:51', '2026-01-08 01:53:51'),
('7c36048e-1f72-42c8-ab69-6e053cca8417', 'babouserigne028@gmail.com', 'serigne Abdoulaue Babou', '771651137', 'tenant', '2026-01-09 13:10:06', '2026-01-09 13:10:06'),
('b9a53c5a-4aa6-42d6-bc7a-1a8254c9e15a', 'admin@samalocation.com', 'Administrateur Samalocation', '+221 77 000 00 00', 'admin', '2026-01-10 19:10:29', '2026-01-10 19:10:29'),
('c0f71a49-6f29-45ba-b2c4-249d20886a60', 'khadim5896@gmail.com', 'Moussa Diop', '+221 78 175 22 22', 'tenant', '2026-01-12 12:56:18', '2026-01-12 12:56:18');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `owner_profiles`
--
ALTER TABLE `owner_profiles`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `properties`
--
ALTER TABLE `properties`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `property_units`
--
ALTER TABLE `property_units`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `receipts`
--
ALTER TABLE `receipts`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `tenants`
--
ALTER TABLE `tenants`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Index pour la table `user_profiles`
--
ALTER TABLE `user_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
