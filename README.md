# NOVA Santé

NOVA Santé est une application mobile de suivi personnel conçue pour rendre les habitudes de santé simples à consulter et faciles à tenir. L’interface associe un tableau de bord bleu nuit, des repères visuels et un historique conservé sur l’appareil.

## Fonctionnalités

- **Poids & IMC** — enregistrement des pesées, objectif de poids, calcul de l’IMC et tendance sur les dernières mesures.
- **Glycémie** — relevés contextualisés (à jeun, avant ou après un repas, au coucher), indicateurs visuels et historique horodaté.
- **Bien-être** — suivi quotidien de l’hydratation et des minutes actives, avec objectifs personnalisables et aperçu sur 7 jours.
- **Profil** — réglage des objectifs, export des données au format JSON via le menu de partage et réinitialisation confirmée.
- **Interface** — navigation par onglets, composants cohérents, retours visuels, graphiques animés et états vides guidés.

## Démarrer

    npm install
    npm run start

Puis lancez l’application avec Expo Go, ou utilisez :

    npm run android
    npm run ios
    npm run web

## Stack

- Expo SDK 51
- React Native et Expo Router
- TypeScript
- AsyncStorage pour la persistance locale
- Lucide pour les icônes

Aucune dépendance supplémentaire n’a été ajoutée pour la refonte.

## Données & limites

Les mesures sont enregistrées localement avec AsyncStorage. L’application ne configure pas de compte, de synchronisation cloud ni de rappels push. L’export est déclenché explicitement par l’utilisateur depuis le profil.

Les indicateurs de glycémie et l’IMC sont des repères d’information ; ils ne constituent pas un diagnostic ni un avis médical. Les objectifs doivent être adaptés à chaque personne.
