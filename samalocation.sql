-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: samalocation
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_profiles`
--

DROP TABLE IF EXISTS `admin_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_profiles` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('super_admin','admin','moderator') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admin',
  `permissions` json DEFAULT (_utf8mb4'["view_users", "view_properties", "view_reports"]'),
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_admin_profiles_role` (`role`),
  CONSTRAINT `admin_profiles_ibfk_1` FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_profiles`
--

LOCK TABLES `admin_profiles` WRITE;
/*!40000 ALTER TABLE `admin_profiles` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_messages`
--

DROP TABLE IF EXISTS `contact_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_messages` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('new','replied','archived') COLLATE utf8mb4_unicode_ci DEFAULT 'new',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_messages`
--

LOCK TABLES `contact_messages` WRITE;
/*!40000 ALTER TABLE `contact_messages` DISABLE KEYS */;
INSERT INTO `contact_messages` VALUES ('afbed05d-d1d3-46e4-883c-c10a52d82ce1','Khadim','dimoundoye@gmail.com','blocage','je suis ici','replied','2026-01-12 10:03:39'),('b3affb3d-07d5-4af4-908b-87a677a82683','pape sini','ndoyedollar@gmail.com','Demande de renseignement','fgvilhbsvi bnpsv bzipvs hips','archived','2026-01-12 22:48:26');
/*!40000 ALTER TABLE `contact_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sender_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receiver_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `property_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_messages_sender_id` (`sender_id`),
  KEY `idx_messages_receiver_id` (`receiver_id`),
  KEY `idx_messages_property_id` (`property_id`),
  KEY `idx_messages_unit_id` (`unit_id`),
  KEY `idx_messages_is_read` (`is_read`),
  KEY `idx_messages_created_at` (`created_at`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE SET NULL,
  CONSTRAINT `messages_ibfk_4` FOREIGN KEY (`unit_id`) REFERENCES `property_units` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES ('0cfa7c7b-aa7f-4b54-8324-7a38060d4474','0354859a-58a7-4525-9bb8-8c526fe9a289','7c36048e-1f72-42c8-ab69-6e053cca8417',NULL,NULL,'ièkè-jtj',0,'2026-01-09 13:22:57'),('0fe83f07-31be-4246-9c2f-4a166feae62f','6bc229ba-f390-49b4-9303-320ef136e85d','0354859a-58a7-4525-9bb8-8c526fe9a289','e48fd2d8-8d3e-4e28-886b-82b698da4743',NULL,'Bonjour,\n\nJe suis candidat(e) pour le bien \"Maison à Dakar\" situé à Ouakam cite batrain.\n\nMerci de me répondre.\n\nCordialement.',1,'2026-01-11 20:49:27'),('121f141c-73fb-4838-bd2b-95b54b199d7e','6bc229ba-f390-49b4-9303-320ef136e85d','0354859a-58a7-4525-9bb8-8c526fe9a289','ec0721ba-19f3-4ba4-9262-f57691574f65',NULL,'bon',1,'2026-01-11 03:05:08'),('1a160b7a-b6dd-4554-a316-ef423a7a882f','0354859a-58a7-4525-9bb8-8c526fe9a289','6bc229ba-f390-49b4-9303-320ef136e85d',NULL,NULL,'bonsoir vous avez besion de plus d\'inforamtion ?',1,'2026-01-08 22:03:37'),('2e2bd852-393e-45f9-bc1f-245713276851','6bc229ba-f390-49b4-9303-320ef136e85d','6bc229ba-f390-49b4-9303-320ef136e85d',NULL,NULL,'oui',0,'2026-01-11 02:55:33'),('3583cbfe-7254-4057-9606-e6b35c26c3a8','0354859a-58a7-4525-9bb8-8c526fe9a289','6bc229ba-f390-49b4-9303-320ef136e85d',NULL,NULL,'bon',1,'2026-01-11 03:06:23'),('3721f02a-90f2-43c2-b236-1fcf7dd42c28','6bc229ba-f390-49b4-9303-320ef136e85d','0354859a-58a7-4525-9bb8-8c526fe9a289','ec0721ba-19f3-4ba4-9262-f57691574f65',NULL,'cv',1,'2026-01-11 02:54:49'),('489192ce-2002-45eb-9750-539e158c873f','6bc229ba-f390-49b4-9303-320ef136e85d','0354859a-58a7-4525-9bb8-8c526fe9a289','ec0721ba-19f3-4ba4-9262-f57691574f65',NULL,'merci j\'ai reçu la quittance',1,'2026-01-12 22:41:14'),('51f062af-958a-4b9a-93c9-1c010a4e8023','05a91382-9855-4108-81c3-e98bb5c9a0d4','59dc61d9-1dce-4ed5-b02d-3887a6f420f6','0965cd4c-16ea-48f4-be96-544ce89dfe53',NULL,'Bonjour,\n\nJe suis candidat(e) pour le bien \"Chambre Almadie\" situé à almadie ngor.\n\nMerci de me répondre.\n\nCordialement.',1,'2026-01-11 21:44:00'),('56307f4a-1357-4219-b2a4-f364b22fb18e','59dc61d9-1dce-4ed5-b02d-3887a6f420f6','05a91382-9855-4108-81c3-e98bb5c9a0d4',NULL,NULL,'cv',1,'2026-01-11 21:45:46'),('70a80d74-5562-4cf7-87d2-5ced37ac8696','6bc229ba-f390-49b4-9303-320ef136e85d','6bc229ba-f390-49b4-9303-320ef136e85d',NULL,NULL,'oui',0,'2026-01-11 02:55:50'),('7813d5f1-0248-4578-ae83-380019eaa2f6','6bc229ba-f390-49b4-9303-320ef136e85d','0354859a-58a7-4525-9bb8-8c526fe9a289','ec0721ba-19f3-4ba4-9262-f57691574f65',NULL,'oui ',1,'2026-01-11 02:56:32'),('7ea3e5d1-3917-48e0-9bd2-f86bd16e99ce','59dc61d9-1dce-4ed5-b02d-3887a6f420f6','05a91382-9855-4108-81c3-e98bb5c9a0d4',NULL,NULL,'bien et toi',1,'2026-01-11 21:52:27'),('7efc215f-85c6-4fcd-8006-3eba8b0766af','0354859a-58a7-4525-9bb8-8c526fe9a289','6bc229ba-f390-49b4-9303-320ef136e85d',NULL,NULL,'cv',1,'2026-01-11 21:32:16'),('8ba1722b-6c7e-491f-b08d-080888b99270','0354859a-58a7-4525-9bb8-8c526fe9a289','6bc229ba-f390-49b4-9303-320ef136e85d',NULL,NULL,'bon',1,'2026-01-11 03:04:09'),('90dea973-37b6-48a8-8cc6-3877fda91f3c','6bc229ba-f390-49b4-9303-320ef136e85d','0354859a-58a7-4525-9bb8-8c526fe9a289','ec0721ba-19f3-4ba4-9262-f57691574f65',NULL,'bon',1,'2026-01-11 02:57:19'),('ad04961a-cd41-4012-ba2d-9865f0c7de85','6bc229ba-f390-49b4-9303-320ef136e85d','0354859a-58a7-4525-9bb8-8c526fe9a289','ec0721ba-19f3-4ba4-9262-f57691574f65',NULL,'bon',1,'2026-01-11 03:19:21'),('b67e2b90-9674-424f-8efa-d1733c363769','6bc229ba-f390-49b4-9303-320ef136e85d','0354859a-58a7-4525-9bb8-8c526fe9a289','ec0721ba-19f3-4ba4-9262-f57691574f65',NULL,'Bonjour,\n\nJe suis candidat(e) pour le bien \"Appartement Dakar\" situé à cité batrain Ouakam Dakar.\n\nMerci de me répondre.\n\nCordialement.',1,'2026-01-08 21:58:56'),('b776426b-f9fa-43b1-ac12-035583bc0417','6bc229ba-f390-49b4-9303-320ef136e85d','0354859a-58a7-4525-9bb8-8c526fe9a289','ec0721ba-19f3-4ba4-9262-f57691574f65',NULL,'th^rg$^gz$rr',1,'2026-01-09 08:15:31'),('b8a6a78b-b614-4f5f-b0f7-ea2541930c94','05a91382-9855-4108-81c3-e98bb5c9a0d4','0354859a-58a7-4525-9bb8-8c526fe9a289','e48fd2d8-8d3e-4e28-886b-82b698da4743',NULL,'Bonjour,\n\nJe suis candidat(e) pour le bien \"Maison à Dakar\" situé à Ouakam cite batrain.\n\nMerci de me répondre.\n\nCordialement.',1,'2026-01-12 22:43:45'),('cb301eb7-e406-465c-a3c2-f9a5b01b8f5e','05a91382-9855-4108-81c3-e98bb5c9a0d4','59dc61d9-1dce-4ed5-b02d-3887a6f420f6','0965cd4c-16ea-48f4-be96-544ce89dfe53',NULL,'bien',1,'2026-01-11 21:46:39'),('ceddc92d-2f2b-45d6-bb28-815b1dbbe49c','6bc229ba-f390-49b4-9303-320ef136e85d','6bc229ba-f390-49b4-9303-320ef136e85d',NULL,NULL,'oui',0,'2026-01-11 02:56:44'),('d3a392b5-be78-4455-9d99-fb20374f4d7c','0354859a-58a7-4525-9bb8-8c526fe9a289','6bc229ba-f390-49b4-9303-320ef136e85d',NULL,NULL,'cv',1,'2026-01-11 03:22:45'),('d3eba57f-13ef-4497-b16f-121909d671b8','59dc61d9-1dce-4ed5-b02d-3887a6f420f6','05a91382-9855-4108-81c3-e98bb5c9a0d4',NULL,NULL,'fils',1,'2026-01-11 22:23:44'),('d7d4eeb4-251d-47d8-8879-804a47a97cbc','05a91382-9855-4108-81c3-e98bb5c9a0d4','59dc61d9-1dce-4ed5-b02d-3887a6f420f6','0965cd4c-16ea-48f4-be96-544ce89dfe53',NULL,'boy',1,'2026-01-11 22:24:31'),('dd61641c-8ad5-4fec-a123-7043c0063bb7','6bc229ba-f390-49b4-9303-320ef136e85d','0354859a-58a7-4525-9bb8-8c526fe9a289','ec0721ba-19f3-4ba4-9262-f57691574f65',NULL,'oui',1,'2026-01-11 02:59:05'),('e4a542df-204a-48fb-8aad-64f7a3c1b497','59dc61d9-1dce-4ed5-b02d-3887a6f420f6','05a91382-9855-4108-81c3-e98bb5c9a0d4',NULL,NULL,'bien',1,'2026-01-11 22:15:49'),('e6b445ac-d2a3-487a-b817-82b769c4653b','6bc229ba-f390-49b4-9303-320ef136e85d','0354859a-58a7-4525-9bb8-8c526fe9a289','ec0721ba-19f3-4ba4-9262-f57691574f65',NULL,'erg,',1,'2026-01-08 22:29:07'),('f599fa2f-8b9a-45bf-b0ac-b13172488968','0354859a-58a7-4525-9bb8-8c526fe9a289','6bc229ba-f390-49b4-9303-320ef136e85d',NULL,NULL,'bien',1,'2026-01-11 02:58:15'),('f8fb9654-926e-49a2-9d72-f1ad294b8107','0354859a-58a7-4525-9bb8-8c526fe9a289','6bc229ba-f390-49b4-9303-320ef136e85d',NULL,NULL,'bon!!!!',1,'2026-01-08 22:27:48');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('message','property','tenant','system','receipt') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `link` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_id` (`user_id`),
  KEY `idx_notifications_created_at` (`created_at` DESC),
  KEY `idx_notifications_is_read` (`is_read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES ('046b5562-9f6b-43b4-84b9-298d292488df','0354859a-58a7-4525-9bb8-8c526fe9a289','message','Nouvelle candidature','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages&propertyId=ec0721ba-19f3-4ba4-9262-f57691574f65','2026-01-08 22:29:27'),('08e2e1a3-443b-4d03-8811-d8902444d9b4','7c36048e-1f72-42c8-ab69-6e053cca8417','message','Nouveau message','Vous avez reçu un nouveau message concernant un bien.',0,'/owner-dashboard?tab=messages','2026-01-09 13:22:57'),('18340e15-efd3-11f0-99cb-005056c00001','6bc229ba-f390-49b4-9303-320ef136e85d','receipt','Nouveau reçu de loyer','Votre reçu de paiement N° REC-202601-0015 pour 1/2026 est maintenant disponible.',1,NULL,'2026-01-12 16:23:57'),('1b85fbeb-efe6-11f0-99cb-005056c00001','6bc229ba-f390-49b4-9303-320ef136e85d','receipt','Nouveau reçu de loyer','Votre reçu de paiement N° REC-202601-0018 pour 1/2026 est maintenant disponible.',1,NULL,'2026-01-12 18:40:03'),('1bd38c91-ea46-4cf6-a23b-b90b8a488c93','0354859a-58a7-4525-9bb8-8c526fe9a289','message','Nouvelle candidature','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages&propertyId=ec0721ba-19f3-4ba4-9262-f57691574f65','2026-01-09 13:22:09'),('1d6a55ab-246b-4d6b-8405-d6b8aaadaedd','6bc229ba-f390-49b4-9303-320ef136e85d','message','Nouveau message','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages','2026-01-08 22:03:52'),('1eefa631-aaa7-4b36-8e46-345a04f0676b','6bc229ba-f390-49b4-9303-320ef136e85d','message','Nouveau message','Vous avez reçu un nouveau message du propriétaire',1,'/tenant-dashboard?tab=messages','2026-01-08 22:27:48'),('1ff5b4a1-5073-4855-8181-89a1292c7a05','6bc229ba-f390-49b4-9303-320ef136e85d','message','Nouveau message','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages','2026-01-08 22:27:48'),('2584fec8-16ff-4b47-b13e-c3a855885dae','6bc229ba-f390-49b4-9303-320ef136e85d','message','Nouveau message','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages','2026-01-11 02:55:33'),('27875b62-a0c8-448d-8cb0-0fad9c6177a9','0354859a-58a7-4525-9bb8-8c526fe9a289','message','Nouvelle candidature','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages&propertyId=e48fd2d8-8d3e-4e28-886b-82b698da4743','2026-01-12 22:43:45'),('2910af29-0650-4a92-9dd9-7e87665f774e','6bc229ba-f390-49b4-9303-320ef136e85d','message','Nouveau message','Vous avez reçu un nouveau message du propriétaire',1,'/tenant-dashboard?tab=messages','2026-01-08 22:03:37'),('2c87c1c1-2bb5-49d4-9046-c3f565db0823','0354859a-58a7-4525-9bb8-8c526fe9a289','message','Nouvelle candidature','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages&propertyId=ec0721ba-19f3-4ba4-9262-f57691574f65','2026-01-11 02:59:05'),('32ad15b0-090d-47c2-8049-ee81e9a64b23','05a91382-9855-4108-81c3-e98bb5c9a0d4','message','Nouveau message','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages','2026-01-11 22:15:49'),('3390b577-69da-4c95-9f9c-23540cb270d2','0354859a-58a7-4525-9bb8-8c526fe9a289','message','Nouvelle candidature','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages&propertyId=ec0721ba-19f3-4ba4-9262-f57691574f65','2026-01-11 03:19:21'),('34e9c585-5e72-4f9c-8602-7111d001c5ca','6bc229ba-f390-49b4-9303-320ef136e85d','message','Nouveau message','Vous avez reçu un nouveau message du propriétaire',1,'/tenant-dashboard?tab=messages','2026-01-11 02:55:33'),('356ce567-e00d-4563-9f2e-8c5a2053aaff','0354859a-58a7-4525-9bb8-8c526fe9a289','message','Nouvelle candidature','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages&propertyId=ec0721ba-19f3-4ba4-9262-f57691574f65','2026-01-11 02:56:32'),('40a7213b-6b80-49fc-9529-15f80d1188a3','6bc229ba-f390-49b4-9303-320ef136e85d','message','Nouveau message','Vous avez reçu un nouveau message du propriétaire',1,'/tenant-dashboard?tab=messages','2026-01-08 22:03:52'),('433e889e-6271-4d2b-99e1-10003594f870','0354859a-58a7-4525-9bb8-8c526fe9a289','message','Nouvelle candidature','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages&propertyId=ec0721ba-19f3-4ba4-9262-f57691574f65','2026-01-09 08:15:31'),('435bc477-ac57-4ef3-ab81-b1cf5cf0dd1f','6bc229ba-f390-49b4-9303-320ef136e85d','message','Nouveau message','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages','2026-01-11 03:04:09'),('44f8fe25-0717-479b-8bd5-c29987cc2a24','0354859a-58a7-4525-9bb8-8c526fe9a289','message','Nouveau message','Vous avez reçu un nouveau message de babacar mbaye',1,'/owner-dashboard?tab=messages','2026-01-11 02:59:05'),('4dfc3df5-28e9-4a0c-8e6f-ce5dd0616b6d','0354859a-58a7-4525-9bb8-8c526fe9a289','message','Nouvelle candidature','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages&propertyId=ec0721ba-19f3-4ba4-9262-f57691574f65','2026-01-08 21:58:56'),('5e819bcf-ef3f-11f0-99cb-005056c00001','05a91382-9855-4108-81c3-e98bb5c9a0d4','receipt','Nouveau reçu de loyer','Votre reçu de paiement N° REC-202601-0013 pour 1/2026 est maintenant disponible.',1,NULL,'2026-01-11 22:46:29'),('5f9cbbb8-770f-4a2d-8341-eaf079b6d2de','6bc229ba-f390-49b4-9303-320ef136e85d','message','Nouveau message','Vous avez reçu un nouveau message du propriétaire',1,'/tenant-dashboard?tab=messages','2026-01-11 02:53:56'),('6f86fc84-d191-452a-837f-76e7f373af3c','59dc61d9-1dce-4ed5-b02d-3887a6f420f6','message','Nouvelle candidature','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages&propertyId=0965cd4c-16ea-48f4-be96-544ce89dfe53','2026-01-11 21:46:39'),('729035f4-e080-408d-80ce-547e601b26c4','0354859a-58a7-4525-9bb8-8c526fe9a289','message','Nouveau message','Vous avez reçu un nouveau message de babacar mbaye',1,'/owner-dashboard?tab=messages','2026-01-11 02:56:32'),('7345b491-f020-4ef4-9435-6d9115dd1b64','0354859a-58a7-4525-9bb8-8c526fe9a289','message','Nouvelle candidature','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages&propertyId=ec0721ba-19f3-4ba4-9262-f57691574f65','2026-01-11 02:54:49'),('756492f4-d629-45ab-9b3e-5dc2ee7df114','6bc229ba-f390-49b4-9303-320ef136e85d','message','Nouveau message','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages','2026-01-11 21:32:16'),('780afd25-5d90-4d6d-8a71-dc7037b5fc89','0354859a-58a7-4525-9bb8-8c526fe9a289','message','Nouveau message','Vous avez reçu un nouveau message de babacar mbaye',1,'/owner-dashboard?tab=messages','2026-01-11 02:54:49'),('7cb6b7ab-d559-4856-b785-3404a8d7288a','0354859a-58a7-4525-9bb8-8c526fe9a289','message','Nouveau message','Vous avez reçu un nouveau message de babacar mbaye',1,'/owner-dashboard?tab=messages','2026-01-08 22:29:07'),('7eda5d65-bec1-4bf0-b4f8-cb626ca7f3ac','59dc61d9-1dce-4ed5-b02d-3887a6f420f6','message','Nouvelle candidature','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages&propertyId=0965cd4c-16ea-48f4-be96-544ce89dfe53','2026-01-11 22:24:31'),('7f56d72b-ef32-11f0-99cb-005056c00001','0354859a-58a7-4525-9bb8-8c526fe9a289','tenant','Nouveau reçu créé','Un reçu de paiement N° REC-202601-0009 a été créé pour babacar mbaye - Montant: 45000 FCFA',1,NULL,'2026-01-11 21:14:21'),('81167c9d-6fb7-4d31-9fc7-d474b71b61ec','05a91382-9855-4108-81c3-e98bb5c9a0d4','message','Nouveau message','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages','2026-01-11 22:15:22'),('88d4b4e9-67f3-49ca-bfb6-d1e706deaff8','6bc229ba-f390-49b4-9303-320ef136e85d','message','Nouveau message','Vous avez reçu un nouveau message du propriétaire',1,'/tenant-dashboard?tab=messages','2026-01-08 22:28:07'),('8a6d2e83-f83e-41be-88c9-b4b04d629857','0354859a-58a7-4525-9bb8-8c526fe9a289','message','Nouveau message','Vous avez reçu un nouveau message de babacar mbaye',1,'/owner-dashboard?tab=messages','2026-01-08 22:29:27'),('8eaba17a-f007-11f0-99cb-005056c00001','6bc229ba-f390-49b4-9303-320ef136e85d','receipt','Nouveau reçu de loyer','Votre reçu de paiement N° REC-202601-0020 pour 1/2026 est maintenant disponible.',1,NULL,'2026-01-12 22:39:29'),('92356905-a88c-425b-bd5f-faaa85ea48a9','6bc229ba-f390-49b4-9303-320ef136e85d','message','Nouveau message','Vous avez reçu un nouveau message du propriétaire',1,'/tenant-dashboard?tab=messages','2026-01-11 02:56:44'),('96490105-6534-491e-b185-23d691d40276','0354859a-58a7-4525-9bb8-8c526fe9a289','message','Nouvelle candidature','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages&propertyId=ec0721ba-19f3-4ba4-9262-f57691574f65','2026-01-12 22:41:14'),('9e01389b-e190-407c-a572-1f63842c3356','0354859a-58a7-4525-9bb8-8c526fe9a289','message','Nouvelle candidature','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages&propertyId=ec0721ba-19f3-4ba4-9262-f57691574f65','2026-01-11 02:57:19'),('9e256758-c1ae-4aef-b853-cdcfd181dbcb','05a91382-9855-4108-81c3-e98bb5c9a0d4','message','Nouveau message','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages','2026-01-11 22:23:44'),('a1e4859f-3c1f-452d-863e-5d83a0ebd7f6','6bc229ba-f390-49b4-9303-320ef136e85d','message','Nouveau message','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages','2026-01-11 02:53:56'),('a8f8b311-efcb-11f0-99cb-005056c00001','6bc229ba-f390-49b4-9303-320ef136e85d','receipt','Nouveau reçu de loyer','Votre reçu de paiement N° REC-202601-0014 pour 1/2026 est maintenant disponible.',1,NULL,'2026-01-12 15:30:44'),('abe8f2bb-3dbc-4d32-b1da-d7a0efda9d56','6bc229ba-f390-49b4-9303-320ef136e85d','message','Nouveau message','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages','2026-01-11 02:56:44'),('bcfaf46b-b3c8-415e-9ee2-d1e36e997070','0354859a-58a7-4525-9bb8-8c526fe9a289','message','Nouvelle candidature','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages&propertyId=ec0721ba-19f3-4ba4-9262-f57691574f65','2026-01-08 22:29:07'),('c023676f-d906-40e8-a501-850fd935380e','6bc229ba-f390-49b4-9303-320ef136e85d','message','Nouveau message','Vous avez reçu un nouveau message du propriétaire',1,'/tenant-dashboard?tab=messages','2026-01-11 02:58:15'),('c0a9d03d-8be2-4dc9-b1a5-ef4814ac9d54','6bc229ba-f390-49b4-9303-320ef136e85d','message','Nouveau message','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages','2026-01-11 03:06:23'),('c654e3f9-1384-4353-8eb4-43222f2f0f6d','59dc61d9-1dce-4ed5-b02d-3887a6f420f6','message','Nouvelle candidature','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages&propertyId=0965cd4c-16ea-48f4-be96-544ce89dfe53','2026-01-11 21:44:00'),('c90c519d-b048-47b9-86b8-ae3817d6f5cb','0354859a-58a7-4525-9bb8-8c526fe9a289','message','Nouvelle candidature','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages&propertyId=ec0721ba-19f3-4ba4-9262-f57691574f65','2026-01-11 03:43:15'),('c9ceffe3-3e94-4619-b10a-d9c3d7a88785','6bc229ba-f390-49b4-9303-320ef136e85d','message','Nouveau message','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages','2026-01-11 02:58:15'),('caedfa2b-354b-4054-8518-d4aa4f14fdf1','6bc229ba-f390-49b4-9303-320ef136e85d','message','Nouveau message','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages','2026-01-11 03:22:45'),('cdf47a7b-efd4-11f0-99cb-005056c00001','6bc229ba-f390-49b4-9303-320ef136e85d','receipt','Nouveau reçu de loyer','Votre reçu de paiement N° REC-202601-0017 pour 1/2026 est maintenant disponible.',1,NULL,'2026-01-12 16:36:11'),('d4415311-0b0a-4774-b2d4-76220968193c','05a91382-9855-4108-81c3-e98bb5c9a0d4','message','Nouveau message','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages','2026-01-11 21:52:27'),('d922082f-1d38-4eeb-b464-f4e778b8904a','6bc229ba-f390-49b4-9303-320ef136e85d','message','Nouveau message','Vous avez reçu un nouveau message du propriétaire',1,'/tenant-dashboard?tab=messages','2026-01-11 02:55:50'),('e11ffa88-97c6-4214-a99c-b57c3b89cd3d','0354859a-58a7-4525-9bb8-8c526fe9a289','message','Nouveau message','Vous avez reçu un nouveau message de babacar mbaye',1,'/owner-dashboard?tab=messages','2026-01-11 02:57:19'),('e3784095-7eca-4fbb-b40b-3dc53a2a527d','7c36048e-1f72-42c8-ab69-6e053cca8417','message','Nouveau message','Vous avez reçu un nouveau message du propriétaire',0,'/tenant-dashboard?tab=messages','2026-01-09 13:22:57'),('e4ee7e55-eea7-436c-8838-349f69849788','0354859a-58a7-4525-9bb8-8c526fe9a289','message','Nouveau message','Vous avez reçu un nouveau message de babacar mbaye',1,'/owner-dashboard?tab=messages','2026-01-09 08:15:31'),('e7671dcc-dbda-4b38-8a80-dcf285798661','6bc229ba-f390-49b4-9303-320ef136e85d','message','Nouveau message','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages','2026-01-08 22:03:37'),('ec0099ce-f829-46a8-8e5c-3ed4132e673d','0354859a-58a7-4525-9bb8-8c526fe9a289','message','Nouvelle candidature','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages&propertyId=e48fd2d8-8d3e-4e28-886b-82b698da4743','2026-01-11 20:49:27'),('ec4277de-ea29-4122-830f-82402bbf69a9','05a91382-9855-4108-81c3-e98bb5c9a0d4','message','Nouveau message','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages','2026-01-11 21:45:46'),('f331d219-8024-45b8-8fc5-f478d64fbe14','6bc229ba-f390-49b4-9303-320ef136e85d','message','Nouveau message','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages','2026-01-08 22:28:07'),('f4d49130-681e-4c29-9406-33effb7144e5','6bc229ba-f390-49b4-9303-320ef136e85d','message','Nouveau message','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages','2026-01-11 02:55:50'),('f8e0313a-efd3-11f0-99cb-005056c00001','6bc229ba-f390-49b4-9303-320ef136e85d','receipt','Nouveau reçu de loyer','Votre reçu de paiement N° REC-202601-0016 pour 1/2026 est maintenant disponible.',1,NULL,'2026-01-12 16:30:14'),('fbaf0912-39e5-4504-a90d-351b6583b464','0354859a-58a7-4525-9bb8-8c526fe9a289','message','Nouvelle candidature','Vous avez reçu un nouveau message concernant un bien.',1,'/owner-dashboard?tab=messages&propertyId=ec0721ba-19f3-4ba4-9262-f57691574f65','2026-01-11 03:05:08'),('fe2f84a2-ef3c-11f0-99cb-005056c00001','0354859a-58a7-4525-9bb8-8c526fe9a289','tenant','Nouveau reçu créé','Un reçu de paiement N° REC-202601-0010 a été créé pour babacar mbaye - Montant: 500000 FCFA',1,NULL,'2026-01-11 22:29:29'),('fe8d84a4-efe6-11f0-99cb-005056c00001','6bc229ba-f390-49b4-9303-320ef136e85d','receipt','Nouveau reçu de loyer','Votre reçu de paiement N° REC-202601-0019 pour 1/2026 est maintenant disponible.',1,NULL,'2026-01-12 18:46:24');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `owner_profiles`
--

DROP TABLE IF EXISTS `owner_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `owner_profiles` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `user_profile_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `bio` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_owner_profiles_user_profile_id` (`user_profile_id`),
  CONSTRAINT `owner_profiles_ibfk_1` FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `owner_profiles_ibfk_2` FOREIGN KEY (`user_profile_id`) REFERENCES `user_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `owner_profiles`
--

LOCK TABLES `owner_profiles` WRITE;
/*!40000 ALTER TABLE `owner_profiles` DISABLE KEYS */;
INSERT INTO `owner_profiles` VALUES ('0354859a-58a7-4525-9bb8-8c526fe9a289','dim-immo','77123456789','dakar ','0354859a-58a7-4525-9bb8-8c526fe9a289','2026-01-08 01:34:16','2026-01-11 02:44:01','je suis courtier et bailleur en meme temps'),('564d00d9-25f6-40b8-81f4-60e5f014c302','Test Owner','771234567',NULL,'564d00d9-25f6-40b8-81f4-60e5f014c302','2026-01-11 14:30:15','2026-01-11 14:30:15',NULL),('59dc61d9-1dce-4ed5-b02d-3887a6f420f6','samb-immo','+221771234567',NULL,'59dc61d9-1dce-4ed5-b02d-3887a6f420f6','2026-01-11 13:05:24','2026-01-11 13:05:24',NULL);
/*!40000 ALTER TABLE `owner_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `properties`
--

DROP TABLE IF EXISTS `properties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `properties` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `property_type` enum('maison','villa','appartement','studio','chambre','garage','box','locale') COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `photo_url` text COLLATE utf8mb4_unicode_ci,
  `photos` json DEFAULT (_utf8mb4'[]'),
  `equipments` json DEFAULT (_utf8mb4'[]'),
  `is_published` tinyint(1) DEFAULT '0',
  `published_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_properties_owner_id` (`owner_id`),
  KEY `idx_properties_property_type` (`property_type`),
  KEY `idx_properties_is_published` (`is_published`),
  CONSTRAINT `properties_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `properties`
--

LOCK TABLES `properties` WRITE;
/*!40000 ALTER TABLE `properties` DISABLE KEYS */;
INSERT INTO `properties` VALUES ('0965cd4c-16ea-48f4-be96-544ce89dfe53','59dc61d9-1dce-4ed5-b02d-3887a6f420f6','chambre','Chambre Almadie','almadie ngor','pret du pharmacie','http://localhost:5000/uploads/1768136852205-630012230.png','[\"http://localhost:5000/uploads/1768136852205-630012230.png\", \"http://localhost:5000/uploads/1768136852212-543959979.png\", \"http://localhost:5000/uploads/1768136852225-495350996.png\"]','[\"parking\"]',0,NULL,'2026-01-11 13:07:32','2026-01-12 09:03:19'),('7bb76ff8-9168-4649-8dc8-2440c37dfc49','564d00d9-25f6-40b8-81f4-60e5f014c302','appartement','Appartement Test','Dakar',NULL,NULL,'[]','[]',0,NULL,'2026-01-11 14:37:13','2026-01-11 14:37:13'),('e48fd2d8-8d3e-4e28-886b-82b698da4743','0354859a-58a7-4525-9bb8-8c526fe9a289','maison','Maison à Dakar','Ouakam cite batrain','pret du transport en commun','http://localhost:5000/uploads/1768078869343-101699691.png','[\"http://localhost:5000/uploads/1768078869343-101699691.png\"]','[\"climatisation\"]',1,'2026-01-10 21:01:14','2026-01-10 21:01:09','2026-01-10 21:01:13'),('ec0721ba-19f3-4ba4-9262-f57691574f65','0354859a-58a7-4525-9bb8-8c526fe9a289','maison','Appartement Dakar','cité batrain Ouakam Dakar','inijnjiyfvjfgvjdrjgviygov','http://localhost:5000/uploads/1767837145681-852393220.png','[\"http://localhost:5000/uploads/1767837145681-852393220.png\", \"http://localhost:5000/uploads/1767837145694-788143727.png\"]','[\"climatisation\"]',1,'2026-01-08 01:52:40','2026-01-08 01:52:25','2026-01-08 01:52:40');
/*!40000 ALTER TABLE `properties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `property_units`
--

DROP TABLE IF EXISTS `property_units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `property_units` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `property_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_type` enum('maison','villa','chambre','appartement','studio','garage','box','locale') COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `monthly_rent` int NOT NULL DEFAULT '0',
  `area_sqm` decimal(10,2) DEFAULT NULL,
  `bedrooms` int DEFAULT '0',
  `bathrooms` int DEFAULT '0',
  `is_available` tinyint(1) DEFAULT '1',
  `description` text COLLATE utf8mb4_unicode_ci,
  `photos` json DEFAULT (_utf8mb4'[]'),
  `rent_period` enum('jour','semaine','mois') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'mois',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_property_units_property_id` (`property_id`),
  KEY `idx_property_units_unit_type` (`unit_type`),
  KEY `idx_property_units_is_available` (`is_available`),
  CONSTRAINT `property_units_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `property_units`
--

LOCK TABLES `property_units` WRITE;
/*!40000 ALTER TABLE `property_units` DISABLE KEYS */;
INSERT INTO `property_units` VALUES ('1a5c174f-c611-457b-8e4c-bf80488361fd','ec0721ba-19f3-4ba4-9262-f57691574f65','maison','Maison',150000,150.00,2,2,1,'inijnjiyfvjfgvjdrjgviygov','[]','mois','2026-01-08 01:52:25'),('2b2c1453-29c9-4b4c-9529-308c2b813a73','0965cd4c-16ea-48f4-be96-544ce89dfe53','chambre','Chambre',50000,10.00,1,0,0,'pret du pharmacie','[]','mois','2026-01-11 13:07:32'),('5ad7c4f7-8d07-42ee-aa04-d0887fb6961d','7bb76ff8-9168-4649-8dc8-2440c37dfc49','appartement','Appartement',150000,NULL,0,0,0,NULL,'[]','mois','2026-01-11 14:37:13'),('8e14b16e-0ac9-4fa2-813f-95d4c4d0dfad','e48fd2d8-8d3e-4e28-886b-82b698da4743','maison','Maison',500000,300.00,6,4,1,'pret du transport en commun','[]','mois','2026-01-10 21:01:09');
/*!40000 ALTER TABLE `property_units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receipts`
--

DROP TABLE IF EXISTS `receipts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receipts` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `property_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `month` int NOT NULL,
  `year` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'virement',
  `receipt_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `receipt_number` (`receipt_number`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_property_id` (`property_id`),
  KEY `idx_month_year` (`month`,`year`),
  KEY `idx_payment_date` (`payment_date`),
  CONSTRAINT `receipts_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `receipts_ibfk_2` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receipts`
--

LOCK TABLES `receipts` WRITE;
/*!40000 ALTER TABLE `receipts` DISABLE KEYS */;
INSERT INTO `receipts` VALUES ('0510376d-8bd0-48a1-bdcc-99ecab1a48c4','6bc229ba-f390-49b4-9303-320ef136e85d','e48fd2d8-8d3e-4e28-886b-82b698da4743',1,2026,50000.00,'2026-01-12','especes','REC-202601-0014','remis par koto','2026-01-12 15:30:44','2026-01-12 15:30:44'),('09339b6a-b836-44b0-a4a7-c05b5e789e6e','02fc576d-ef18-11f0-99cb-005056c00001','7bb76ff8-9168-4649-8dc8-2440c37dfc49',1,2026,75000.00,'2026-01-11','especes','REC-202601-0005','Test recu apres correction','2026-01-11 18:07:59','2026-01-11 18:07:59'),('161d154e-7683-42a3-b869-f09c3df65638','6bc229ba-f390-49b4-9303-320ef136e85d','e48fd2d8-8d3e-4e28-886b-82b698da4743',1,2026,45000.00,'2026-01-11','especes','REC-202601-0009','Remis par moussa','2026-01-11 21:14:21','2026-01-11 21:14:21'),('1d2966c0-774e-4907-9f4a-0ae6f5811d83','6bc229ba-f390-49b4-9303-320ef136e85d','e48fd2d8-8d3e-4e28-886b-82b698da4743',1,2026,4.00,'2026-01-12','especes','REC-202601-0019','','2026-01-12 18:46:24','2026-01-12 18:46:24'),('35eb5eb9-4dfa-49a9-a9d8-b93c658da7ac','6bc229ba-f390-49b4-9303-320ef136e85d','e48fd2d8-8d3e-4e28-886b-82b698da4743',1,2026,500000.00,'2026-01-11','especes','REC-202601-0011','','2026-01-11 22:36:24','2026-01-11 22:36:24'),('407d2e44-776b-4a2e-8b59-787885c700d1','6bc229ba-f390-49b4-9303-320ef136e85d','e48fd2d8-8d3e-4e28-886b-82b698da4743',1,2026,500000.00,'2026-01-11','especes','REC-202601-0010','','2026-01-11 22:29:28','2026-01-11 22:29:28'),('445ff1a9-8c92-4041-bae9-c3f4fe1cc576','6bc229ba-f390-49b4-9303-320ef136e85d','e48fd2d8-8d3e-4e28-886b-82b698da4743',1,2026,50000.00,'2026-01-11','especes','REC-202601-0003','remis par Mor','2026-01-11 17:01:33','2026-01-11 17:01:33'),('564b11ef-64e0-4ae1-ba29-e60aeaa0d7cf','05a91382-9855-4108-81c3-e98bb5c9a0d4','0965cd4c-16ea-48f4-be96-544ce89dfe53',1,2026,50000.00,'2026-01-11','mobile','REC-202601-0013','Par Wave','2026-01-11 22:46:29','2026-01-11 22:46:29'),('6eba0ef7-1103-4b6a-aac9-c97fd003555d','6bc229ba-f390-49b4-9303-320ef136e85d','e48fd2d8-8d3e-4e28-886b-82b698da4743',1,2026,50000.00,'2026-01-11','especes','REC-202601-0008','remis par moussa','2026-01-11 20:47:45','2026-01-11 20:47:45'),('7dd058e4-bc4b-4e72-bce2-edc4d6eb6225','02fc576d-ef18-11f0-99cb-005056c00001','7bb76ff8-9168-4649-8dc8-2440c37dfc49',1,2026,90000.00,'2026-01-11','virement','REC-202601-0007','','2026-01-11 18:14:45','2026-01-11 18:14:45'),('9c6ef1e5-39c4-4385-9bf2-bebb0aa07f7e','6bc229ba-f390-49b4-9303-320ef136e85d','e48fd2d8-8d3e-4e28-886b-82b698da4743',1,2026,5221.00,'2026-01-12','virement','REC-202601-0017','sfovmjv','2026-01-12 16:36:11','2026-01-12 16:36:11'),('c23108a2-1244-4fcc-b607-e9cbf5b6f5c3','02fc576d-ef18-11f0-99cb-005056c00001','7bb76ff8-9168-4649-8dc8-2440c37dfc49',1,2026,80000.00,'2026-01-11','virement','REC-202601-0006','','2026-01-11 18:11:36','2026-01-11 18:11:36'),('c41eaeb3-4a3d-4367-bf95-6b853f29dbde','6bc229ba-f390-49b4-9303-320ef136e85d','e48fd2d8-8d3e-4e28-886b-82b698da4743',1,2026,20000.00,'2026-01-12','especes','REC-202601-0015','remis par diallo','2026-01-12 16:23:57','2026-01-12 16:23:57'),('c5c8c643-16bf-4c9c-b473-69724407f341','6bc229ba-f390-49b4-9303-320ef136e85d','e48fd2d8-8d3e-4e28-886b-82b698da4743',1,2026,20.00,'2026-01-12','virement','REC-202601-0016','par saliou','2026-01-12 16:30:14','2026-01-12 16:30:14'),('c7551f67-7d83-4536-8038-2b6e964a1014','05a91382-9855-4108-81c3-e98bb5c9a0d4','0965cd4c-16ea-48f4-be96-544ce89dfe53',1,2026,50000.00,'2026-01-11','mobile','REC-202601-0012','par Wave\n','2026-01-11 22:39:43','2026-01-11 22:39:43'),('c8076b77-ce37-4805-9567-82f8db1e9f97','6bc229ba-f390-49b4-9303-320ef136e85d','e48fd2d8-8d3e-4e28-886b-82b698da4743',1,2026,456.00,'2026-01-12','especes','REC-202601-0018','','2026-01-12 18:40:03','2026-01-12 18:40:03'),('c9b5904c-42c6-4252-b321-b398f596c54c','6bc229ba-f390-49b4-9303-320ef136e85d','e48fd2d8-8d3e-4e28-886b-82b698da4743',1,2026,50000.00,'2026-01-11','especes','REC-202601-0002','remis par moustapha','2026-01-11 16:01:34','2026-01-11 16:01:34'),('cb083d2a-405b-4ac7-89b4-0af6c8b1eb13','6bc229ba-f390-49b4-9303-320ef136e85d','e48fd2d8-8d3e-4e28-886b-82b698da4743',1,2026,50000.00,'2026-01-11','especes','REC-202601-0004','remis par Mor Samb','2026-01-11 17:42:58','2026-01-11 17:42:58'),('eedc6a3e-8ba9-4ab0-b79c-b3ecb1fe6f1f','6bc229ba-f390-49b4-9303-320ef136e85d','e48fd2d8-8d3e-4e28-886b-82b698da4743',1,2026,50000.00,'2026-01-11','especes','REC-202601-0001','remis par moustapha','2026-01-11 16:00:58','2026-01-11 16:00:58'),('f6bcbd52-0ecc-4172-9b2e-3fbe7761fafa','6bc229ba-f390-49b4-9303-320ef136e85d','e48fd2d8-8d3e-4e28-886b-82b698da4743',1,2026,250000.00,'2026-01-12','especes','REC-202601-0020','Remis par son frere mouhamed','2026-01-12 22:39:29','2026-01-12 22:39:29');
/*!40000 ALTER TABLE `receipts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` varchar(36) NOT NULL,
  `reporter_id` varchar(36) NOT NULL COMMENT 'ID du locataire',
  `reported_id` varchar(36) NOT NULL COMMENT 'ID du propriétaire',
  `reason` text NOT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `admin_notes` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reporter` (`reporter_id`),
  KEY `idx_reported` (`reported_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
INSERT INTO `reports` VALUES ('b845738b-5780-47e3-bf00-5133dcda901c','6bc229ba-f390-49b4-9303-320ef136e85d','0354859a-58a7-4525-9bb8-8c526fe9a289','bien non conforme au photo','resolved','Compte bloqué','2026-01-10 23:20:33','2026-01-10 23:27:59'),('d5a07865-5d60-47d0-8092-efa99847698b','6bc229ba-f390-49b4-9303-320ef136e85d','0354859a-58a7-4525-9bb8-8c526fe9a289','photo non conforme au bien proposé','resolved',NULL,'2026-01-12 22:45:55','2026-01-12 22:46:56'),('f42a21fb-cdb4-49b1-aa6c-4d8c104a65de','6bc229ba-f390-49b4-9303-320ef136e85d','0354859a-58a7-4525-9bb8-8c526fe9a289','photo non conforme au bien','pending',NULL,'2026-01-11 01:17:56','2026-01-11 01:17:56');
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenants`
--

DROP TABLE IF EXISTS `tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenants` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `move_in_date` date NOT NULL,
  `lease_end_date` date DEFAULT NULL,
  `deposit_amount` int DEFAULT '0',
  `monthly_rent` int NOT NULL,
  `status` enum('active','pending','terminated') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenants_user_id` (`user_id`),
  KEY `idx_tenants_unit_id` (`unit_id`),
  KEY `idx_tenants_status` (`status`),
  CONSTRAINT `tenants_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tenants_ibfk_2` FOREIGN KEY (`unit_id`) REFERENCES `property_units` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenants`
--

LOCK TABLES `tenants` WRITE;
/*!40000 ALTER TABLE `tenants` DISABLE KEYS */;
INSERT INTO `tenants` VALUES ('243936e0-a9a1-4610-8198-0aec8bb1dbf8','05a91382-9855-4108-81c3-e98bb5c9a0d4','2b2c1453-29c9-4b4c-9529-308c2b813a73','djili sene','+221785876897','djili@gmail.com','2026-01-11',NULL,0,50000,'active','2026-01-11 22:39:15'),('3f419060-02f1-41cd-a8f9-94863d614246','02fc576d-ef18-11f0-99cb-005056c00001','5ad7c4f7-8d07-42ee-aa04-d0887fb6961d','Tenant Test','771112233','tenant@test.com','2026-01-01',NULL,0,150000,'active','2026-01-11 14:47:53'),('74e0540c-f192-413e-9d84-347517f944e5',NULL,'5ad7c4f7-8d07-42ee-aa04-d0887fb6961d','New Tenant','771234567','new-tenant@test.com','2026-01-01',NULL,0,150000,'active','2026-01-11 16:34:13'),('9925ef3a-c2ae-4000-9174-8a64942964a7','6bc229ba-f390-49b4-9303-320ef136e85d','8e14b16e-0ac9-4fa2-813f-95d4c4d0dfad','babacar mbaye','+221785876897','mbaye@gmail.com','2026-01-10',NULL,0,500000,'active','2026-01-10 22:31:06');
/*!40000 ALTER TABLE `tenants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_blocks`
--

DROP TABLE IF EXISTS `user_blocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_blocks` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `blocked_by` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `blocked_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_blocks_user_id` (`user_id`),
  KEY `idx_user_blocks_blocked_by` (`blocked_by`),
  CONSTRAINT `user_blocks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_blocks_ibfk_2` FOREIGN KEY (`blocked_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_blocks`
--

LOCK TABLES `user_blocks` WRITE;
/*!40000 ALTER TABLE `user_blocks` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_blocks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_profiles`
--

DROP TABLE IF EXISTS `user_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_profiles` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('admin','owner','tenant') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'tenant',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_user_profiles_email` (`email`),
  KEY `idx_user_profiles_role` (`role`),
  CONSTRAINT `user_profiles_ibfk_1` FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_profiles`
--

LOCK TABLES `user_profiles` WRITE;
/*!40000 ALTER TABLE `user_profiles` DISABLE KEYS */;
INSERT INTO `user_profiles` VALUES ('0354859a-58a7-4525-9bb8-8c526fe9a289','khadim@gmail.com','Khadim ndoye','77123456789','owner','2026-01-08 01:34:16','2026-01-11 02:33:47'),('05a91382-9855-4108-81c3-e98bb5c9a0d4','djili@gmail.com','djili sene','+221771234567','tenant','2026-01-10 21:53:06','2026-01-10 21:53:06'),('564d00d9-25f6-40b8-81f4-60e5f014c302','testowner@test.com','Test Owner','771234567','owner','2026-01-11 14:30:15','2026-01-11 14:30:15'),('59dc61d9-1dce-4ed5-b02d-3887a6f420f6','samb@gmail.com','ousmane samb','+221771234567','owner','2026-01-11 13:05:24','2026-01-11 13:05:24'),('6bc229ba-f390-49b4-9303-320ef136e85d','mbaye@gmail.com','babacar mbaye','+221771234567','tenant','2026-01-08 01:53:51','2026-01-08 01:53:51'),('7c36048e-1f72-42c8-ab69-6e053cca8417','babouserigne028@gmail.com','serigne Abdoulaue Babou','771651137','tenant','2026-01-09 13:10:06','2026-01-09 13:10:06'),('b9a53c5a-4aa6-42d6-bc7a-1a8254c9e15a','admin@samalocation.com','Administrateur Samalocation','+221 77 000 00 00','admin','2026-01-10 19:10:29','2026-01-10 19:10:29'),('c0f71a49-6f29-45ba-b2c4-249d20886a60','khadim5896@gmail.com','Moussa Diop','+221 78 175 22 22','tenant','2026-01-12 12:56:18','2026-01-12 12:56:18');
/*!40000 ALTER TABLE `user_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_blocked` tinyint(1) DEFAULT '0',
  `blocked_at` datetime DEFAULT NULL,
  `blocked_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `block_reason` text COLLATE utf8mb4_unicode_ci,
  `verification_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verification_token_expires` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_email` (`email`),
  KEY `fk_blocked_by` (`blocked_by`),
  KEY `idx_blocked` (`is_blocked`),
  CONSTRAINT `fk_blocked_by` FOREIGN KEY (`blocked_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('02fc576d-ef18-11f0-99cb-005056c00001','tenant@test.com','$2a$10$YhUCd2VZDhH4BPVnREWnZeXzN.jt2GqOiECEXH6kGV1X4X3X7EqFm',0,'2026-01-11 18:04:45','2026-01-11 18:04:45',0,NULL,NULL,NULL,NULL,NULL),('0354859a-58a7-4525-9bb8-8c526fe9a289','khadim@gmail.com','$2b$10$Qvq1k6SuCMZh8NN2LycloOnsrA4uNh0u6UvUaGyWZfUzOncb/.ONW',0,'2026-01-08 01:34:16','2026-01-11 01:15:44',0,NULL,NULL,NULL,NULL,NULL),('05a91382-9855-4108-81c3-e98bb5c9a0d4','djili@gmail.com','$2b$10$A08NTnuY3r8g8rPXc.RxA.8tmcjXqsNsXcoBEHGzgDMNHTIb4HOtG',0,'2026-01-10 21:53:06','2026-01-10 21:53:06',0,NULL,NULL,NULL,NULL,NULL),('564d00d9-25f6-40b8-81f4-60e5f014c302','testowner@test.com','$2b$10$7cstvLPvY2TuyNN2Y5sX1eOnWf1pKLRVX/pcMBZoW6ts/PQDUuyZO',0,'2026-01-11 14:30:15','2026-01-11 14:30:15',0,NULL,NULL,NULL,NULL,NULL),('59dc61d9-1dce-4ed5-b02d-3887a6f420f6','samb@gmail.com','$2b$10$CbFQi1JZHUNun8fgL2slruVliZus5FXaDGwIYRrbhk1iv7dEkCkU6',0,'2026-01-11 13:05:24','2026-01-11 13:05:24',0,NULL,NULL,NULL,NULL,NULL),('6bc229ba-f390-49b4-9303-320ef136e85d','mbaye@gmail.com','$2b$10$0TRaMwqrKWUDG50/JEdEHeWVOxjIyO6xzY1l/Fhzoq5z1HRt7aU6G',0,'2026-01-08 01:53:51','2026-01-11 02:20:24',0,NULL,NULL,NULL,NULL,NULL),('7c36048e-1f72-42c8-ab69-6e053cca8417','babouserigne028@gmail.com','$2b$10$0tN/5YbNOa0/cMgr0FqGlO5SuW06NHQB0DAlTfD7JfWb4Nq0SN9j2',0,'2026-01-09 13:10:06','2026-01-09 13:10:06',0,NULL,NULL,NULL,NULL,NULL),('b9a53c5a-4aa6-42d6-bc7a-1a8254c9e15a','admin@samalocation.com','$2b$10$vC.37YVvjrUF3oLCllxvgOhG5vr0IQgFGREJMN16WZcY74bzighd6',0,'2026-01-10 19:10:29','2026-01-10 19:10:29',0,NULL,NULL,NULL,NULL,NULL),('c0f71a49-6f29-45ba-b2c4-249d20886a60','khadim5896@gmail.com','$2b$10$bHUxlvopcvQbpmDSjOYWlOpNJmOO7bBE026kFmG5NglDeeNkTBfyq',1,'2026-01-12 12:56:18','2026-01-12 12:56:18',0,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-13  0:38:44
