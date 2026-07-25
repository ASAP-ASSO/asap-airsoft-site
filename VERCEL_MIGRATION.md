# Configuration & Déploiement Vercel + Turso

## 1. Base de données Turso (Déjà configurée & initialisée)
- **URL** : `libsql://asap-airsoft-db-shadowfiedl.aws-eu-west-1.turso.io`
- **Tables & Comptes Dev** : Schéma et comptes d'administration (`admin/admin`, `user/user`, `milsim_test/password123`) déjà créés à distance.

## 2. Déploiement Vercel
1. Importer le projet GitHub sur Vercel.
2. Définir les **Environment Variables** sur le dashboard Vercel :
   - `TURSO_DATABASE_URL` = `libsql://asap-airsoft-db-shadowfiedl.aws-eu-west-1.turso.io`
   - `TURSO_AUTH_TOKEN` = `[Votre Token Turso]`
   - `GOOGLE_CALENDAR_API_KEY` = `[Votre Clé Google API]`
   - `DISCORD_WEBHOOK_URL` = `[Optionnel]`
3. Déployer sur Vercel.
