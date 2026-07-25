# Configuration & Déploiement Vercel + Turso

## 1. Base de données Turso (Déjà configurée & initialisée)
- **URL** : `libsql://asap-airsoft-db-shadowfiedl.aws-eu-west-1.turso.io`
- **Tables & Comptes Dev** : Schéma et comptes d'administration (`admin/admin`, `user/user`, `milsim_test/password123`) déjà créés à distance.

## 2. Déploiement Vercel
1. Pousser le dossier `VERCEL SITE` sur votre dépôt GitHub / GitLab.
2. Importer le projet sur Vercel.
3. Ajouter les **Environment Variables** sur Vercel :
   - `TURSO_DATABASE_URL` = `libsql://asap-airsoft-db-shadowfiedl.aws-eu-west-1.turso.io`
   - `TURSO_AUTH_TOKEN` = `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ5NjE5MjEsImlkIjoiMDE5Zjk4MDUtMzUwMS03YjEyLWE4MzctNWUwODQxNWVmMWFkIiwia2lkIjoiRmQ3ZVQwQnlrUl9PVU02U0FJSU45ZGxyQTdra0dOZVR5UlJyUkMwdGhlMCIsInJpZCI6ImE0MDczMzBjLTFlZWYtNGY5NC1hYjBiLWY1MGM5YTNkNmQxMiJ9.ZBaqdugH7jFYMEAAjrXnwhV-Z9_iAY2j3Y2S_uAtBtd3JM-BQHBOgaXph40gzoydOXBHCEg84AzU2KIjjuZ1AQ`
   - `DISCORD_WEBHOOK_URL` = `[Optionnel]`
4. Déployer sur Vercel.
