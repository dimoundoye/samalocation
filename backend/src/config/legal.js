/**
 * Versions des pages juridiques (date de "Dernière mise à jour", au format AAAA-MM-JJ).
 *
 * Après une modification importante de frontend/src/pages/Terms.tsx ou Privacy.tsx :
 * changer la date ici ET dans la page. Au démarrage suivant, le serveur envoie une seule fois
 * une notification (cloche) à tous les utilisateurs pour les inviter à relire la page.
 * Une simple correction de faute ne nécessite pas de changer la version.
 */
module.exports = {
    terms: {
        version: '2026-10-13',
        name: "Conditions d'utilisation",
        // Phrase de la notification : « Nos Conditions d'utilisation ont été mises à jour le … Prenez quelques minutes pour les lire. »
        updated: "Nos Conditions d'utilisation ont été mises à jour",
        pronoun: 'les',
        link: '/terms'
    },
    privacy: {
        version: '2026-10-13',
        name: 'Politique de confidentialité',
        updated: 'Notre Politique de confidentialité a été mise à jour',
        pronoun: 'la',
        link: '/privacy'
    }
};
