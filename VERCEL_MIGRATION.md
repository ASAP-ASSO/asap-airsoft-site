# Configuration & Déploiement Vercel + Turso

## 1. Base de données Turso (Déjà configurée & initialisée)
- **URL** : `libsql://asap-airsoft-db-shadowfiedl.aws-eu-west-1.turso.io`
- **Tables & Comptes Dev** : Schéma et comptes d'administration (`admin/admin`, `user/user`, `milsim_test/password123`) déjà créés à distance.

## 2. Déploiement Vercel
1. Importer le projet GitHub (`ASAP-ASSO/asap-airsoft-site`) sur Vercel.
2. Ajouter les **Environment Variables** sur Vercel :
   - `TURSO_DATABASE_URL` = `libsql://asap-airsoft-db-shadowfiedl.aws-eu-west-1.turso.io`
   - `TURSO_AUTH_TOKEN` = `[Votre Token Turso]`
   - `GOOGLE_CALENDAR_API_KEY` = `[Votre Clé Google API]`
   - `DISCORD_BOT_TOKEN` = `[Votre Token Discord Bot]`
   - `DISCORD_GUILD_ID` = `1162993081285615747`
   - `DISCORD_CATEGORY_ID` = `1530470218953134180`
   - `DISCORD_ROLE_ID` = `1300381520527228948`
3. Déployer sur Vercel.
