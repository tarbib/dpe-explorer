# Observatoire DPE — Veille immobiliere

## Fonctionnel
- Filtre les DPE par code postal (un ou plusieurs), type de batiment, classe DPE, periode d'etablissement et surface habitable.
- Limite le volume de resultats pour garder l'interface fluide.
- Affiche les resultats en liste (tableau triable, colonnes personnalisables, liens vers la fiche ADEME).
- Affiche les resultats sur une carte interactive (Leaflet) avec marqueurs par classe DPE.
- Genere une synthese partageable (email, X, WhatsApp, copie dans le presse-papiers).
- Theme clair/sombre/auto avec persistance locale.
- Autoremplissage optionnel du code postal via geolocalisation.

## Pourquoi ce projet
L'objectif est de detecter rapidement les nouveaux DPE afin d'identifier des signaux vendeurs potentiels. Un DPE recent peut indiquer un projet de mise en vente : cette interface permet de surveiller ces signaux, de prioriser la prospection et de gagner du temps sur la recherche manuelle.

## Structure du code
- `index.html` : application complete en une seule page.
  - HTML : structure des filtres, tableau, carte, et modale de partage.
  - CSS (dans `<style>`) : design system local (tokens couleurs, composants, responsive).
  - JS (dans `<script>`) : logique de filtres, appels API, rendu tableau/carte, partage et theme.
- Dependances chargees via CDN : Bootstrap, Bootstrap Icons, Leaflet, Leaflet Fullscreen.
- Sources de donnees : API ADEME DPE logements + API adresse (reverse geocoding).

## Pourquoi c'est volontairement simplifie
- Pas de build, pas de backend, pas de framework : une page autonome facile a ouvrir, partager et deployer.
- Moins de complexite pour valider rapidement la valeur fonctionnelle (MVP).
- Dependencies limitees au strict necessaire et chargees a la demande.
- Les limites de resultats et la simplicite des filtres privilegient la lisibilite et la performance.

## Utilisation
Ouvrir `index.html` dans un navigateur. Une connexion internet est necessaire pour charger les CDN et interroger les API publiques.
