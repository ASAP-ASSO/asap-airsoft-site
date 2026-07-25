# Configuration & Déploiement Vercel + Turso

## 1. Base de données Turso (Déjà configurée & initialisée)
- **URL** : `libsql://asap-airsoft-db-shadowfiedl.aws-eu-west-1.turso.io`
- **Tables & Comptes Dev** : Schéma et comptes d'administration (`admin/admin`, `user/user`, `milsim_test/password123`) déjà créés à distance.

## 2. Déploiement Vercel
1. Pousser le dossier `VERCEL SITE` sur votre dépôt GitHub / GitLab.
2. Importer le projet sur Vercel.
3. Ajouter les **Environment Variables** sur Vercel :
   - `TURSO_DATABASE_URL` = `libsql://asap-airsoft-db-shadowfiedl.aws-eu-west-1.turso.io`
   - `TURSO_AUTH_TOKEN` = `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...`
   - `GOOGLE_CALENDAR_API_KEY` = `AIzaSyDESZ8vJgN7QVPGvqcbZX0OnpO1gDjHWFw`
   - `DISCORD_WEBHOOK_URL` = `[Optionnel]`
4. Déployer sur Vercel.
