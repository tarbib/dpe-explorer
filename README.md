# Observatoire DPE — Veille immobilière

## Fonctionnalités
- Filtrage des DPE par code postal (un ou plusieurs), type de bâtiment, classe DPE, période d’établissement et surface habitable.
- Limitation du volume de résultats pour préserver la fluidité de l’interface.
- Affichage des résultats sous forme de liste (tableau triable, colonnes personnalisables, liens vers la fiche ADEME).
- Visualisation des résultats sur une carte interactive (Leaflet) avec des marqueurs par classe DPE.
- Génération d’une synthèse partageable (email, X, WhatsApp, copie dans le presse-papiers).
- Thème clair / sombre / automatique avec persistance locale.
- Autoremplissage optionnel du code postal via la géolocalisation.

## Objectif du projet
L’objectif est de détecter rapidement les nouveaux DPE afin d’identifier des signaux vendeurs potentiels.  
Un DPE récent peut indiquer un projet de mise en vente : cette interface permet de surveiller ces signaux, de prioriser la prospection et de gagner du temps sur la recherche manuelle.

## Structure du code
- `index.html` : application complète en une seule page.
  - HTML : structure des filtres, du tableau, de la carte et de la modale de partage.
  - CSS (dans `<style>`) : design system local (tokens de couleur, composants, responsive).
  - JS (dans `<script>`) : logique de filtrage, appels API, rendu du tableau et de la carte, partage et gestion du thème.
- Dépendances chargées via CDN : Bootstrap, Bootstrap Icons, Leaflet, Leaflet Fullscreen.
- Sources de données : API ADEME DPE logements + API Adresse (reverse geocoding).

## Choix de simplification
- Pas de build, pas de backend, pas de framework : une page autonome, facile à ouvrir, partager et déployer.
- Complexité réduite pour valider rapidement la valeur fonctionnelle (MVP).
- Dépendances limitées au strict nécessaire et chargées à la demande.
- Limitation des résultats et simplicité des filtres pour privilégier la lisibilité et la performance.

## Utilisation
Ouvrir `index.html` dans un navigateur. Une connexion Internet est nécessaire pour charger les CDN et interroger les API publiques.