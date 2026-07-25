import { db } from './index';
import crypto from 'crypto';

export interface CategoryDef {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  display_order: number;
}

export interface TagDef {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export const DEFAULT_CATEGORIES: CategoryDef[] = [
  {
    id: 'cat_ops',
    name: 'Opérations & Briefings',
    slug: 'operations',
    description: 'Ordres de mission, scénarios, inscriptions et débriefings tactiques.',
    icon: '📢',
    color: '#3ba0e3',
    display_order: 1
  },
  {
    id: 'cat_technique',
    name: 'Armurerie & Équipement',
    slug: 'armurerie',
    description: 'Fiches techniques, réglages répliques, tenue, radio et maintenance.',
    icon: '⚙️',
    color: '#c1b97f',
    display_order: 2
  },
  {
    id: 'cat_club',
    name: 'Vie du Club & Taverne',
    slug: 'club',
    description: 'Présentation des membres, annonces associatives et échanges libres.',
    icon: '🛡️',
    color: '#a855f7',
    display_order: 3
  }
];

export const DEFAULT_TAGS: TagDef[] = [
  { id: 'tag_briefing', name: 'Briefing', slug: 'briefing', color: '#0284c7' },
  { id: 'tag_debriefing', name: 'Debriefing', slug: 'debriefing', color: '#ea580c' },
  { id: 'tag_matos', name: 'Matériel', slug: 'matos', color: '#84cc16' },
  { id: 'tag_tuto', name: 'Tuto & Conseil', slug: 'tuto', color: '#eab308' },
  { id: 'tag_officiel', name: 'Officiel', slug: 'officiel', color: '#ef4444' },
  { id: 'tag_taverne', name: 'Taverne', slug: 'taverne', color: '#a855f7' }
];

export async function initForumTables() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS forum_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT,
      color TEXT,
      display_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS forum_topics (
      id TEXT PRIMARY KEY,
      category_id TEXT REFERENCES forum_categories(id),
      title TEXT NOT NULL,
      slug TEXT,
      created_by TEXT NOT NULL REFERENCES users(id),
      is_pinned INTEGER DEFAULT 0,
      is_locked INTEGER DEFAULT 0,
      is_ai_generated INTEGER DEFAULT 0,
      views_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS forum_posts (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS forum_tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#64748b'
    );

    CREATE TABLE IF NOT EXISTS forum_topic_tags (
      topic_id TEXT REFERENCES forum_topics(id) ON DELETE CASCADE,
      tag_id TEXT REFERENCES forum_tags(id) ON DELETE CASCADE,
      PRIMARY KEY (topic_id, tag_id)
    );
  `);
}

export async function ensureForumCategories(): Promise<CategoryDef[]> {
  await initForumTables();

  for (const cat of DEFAULT_CATEGORIES) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO forum_categories (id, name, slug, description, icon, color, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [cat.id, cat.name, cat.slug, cat.description, cat.icon, cat.color, cat.display_order]
    });
  }

  for (const tag of DEFAULT_TAGS) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO forum_tags (id, name, slug, color) VALUES (?, ?, ?, ?)`,
      args: [tag.id, tag.name, tag.slug, tag.color]
    });
  }

  const res = await db.execute('SELECT * FROM forum_categories ORDER BY display_order ASC');
  return res.rows as unknown as CategoryDef[];
}

export async function attachTagToTopic(topicId: string, tagSlug: string) {
  const tagRes = await db.execute({ sql: 'SELECT id FROM forum_tags WHERE slug = ?', args: [tagSlug] });
  const tag = tagRes.rows[0] as unknown as TagDef | undefined;
  if (tag) {
    await db.execute({
      sql: 'INSERT OR IGNORE INTO forum_topic_tags (topic_id, tag_id) VALUES (?, ?)',
      args: [topicId, tag.id]
    });
  }
}

export async function seedInitialForumTopics(authorUserId: string) {
  await ensureForumCategories();

  let validAuthorId = authorUserId;
  const userRes = await db.execute({ sql: 'SELECT id FROM users WHERE id = ?', args: [authorUserId] });
  if (userRes.rows.length === 0) {
    const fallbackRes = await db.execute('SELECT id FROM users LIMIT 1');
    const fallbackUser = fallbackRes.rows[0] as any;
    if (fallbackUser) {
      validAuthorId = fallbackUser.id;
    }
  }

  const oldCatRes = await db.execute(`
    SELECT COUNT(*) as c FROM forum_topics 
    WHERE category_id IN ('cat_briefings', 'cat_debriefings', 'cat_armurerie', 'cat_taverne') OR category_id IS NULL
  `);
  const hasOldCategories = (oldCatRes.rows[0] as any)?.c || 0;

  if (hasOldCategories > 0) {
    await db.executeMultiple(`
      DELETE FROM forum_posts;
      DELETE FROM forum_topics;
      DELETE FROM forum_topic_tags;
    `);
  }

  const countRes = await db.execute('SELECT COUNT(*) as c FROM forum_topics');
  const count = (countRes.rows[0] as any)?.c || 0;
  if (count > 0) return;

  const topicsToSeed = [
    {
      title: '[BRIEFING OFFICIEL] OP Pyrenées 2026 - Phase 1: Reconnaissance',
      category_id: 'cat_ops',
      tags: ['briefing', 'officiel'],
      is_pinned: 1,
      is_ai_generated: 1,
      content: `### 🎯 BRIEFING D'OPÉRATION

**Code Opération:** PYRENEES-2026-ALPHA
**Date & Lieu:** Dimanche 26 Juillet 2026 - Zone Forestière Nord
**Météo Attendue:** Ensoleillé, 24°C, vent léger (5 km/h)

#### 📋 OBJECTIFS MISSION
1. Sécuriser le poste de transmission secteur Bravo.
2. Extraire la balise GPS dans les ruines avant 15h00.
3. Neutraliser l'équipe d'interception adverse.

#### ⚙️ RÈGLES D'ENGAGEMENT (ROE)
- **Puissances maximales:** AEG 350 FPS (0.20g), Sniper 450 FPS (bloqué semi).
- **Emport de billes:** 600 billes max par joueur (Mid-cap recommandé).
- **Medics:** 1 medic par escouade (bandeau blanc / 2 min de respawn).

*Ce briefing a été généré automatiquement depuis le système de planification Milsim.*`
    },
    {
      title: '[DEBRIEFING] Partie Dominicale #42 - Bilan & Retours photos',
      category_id: 'cat_ops',
      tags: ['debriefing'],
      is_pinned: 0,
      is_ai_generated: 1,
      content: `### 💬 RETOUR D'EXPÉRIENCE PARTIE #42

Merci à l'ensemble des 24 opérateurs présents sur le terrain dimanche dernier !

#### 📊 STATISTIQUES DU JOUR
- **Victoires Équipe Alpha:** 3 manches
- **Victoires Équipe Bravo:** 2 manches
- **MVP du jour:** Operateur *Ghost* pour l'infiltration en solo du CQB.

Postez vos photos, vidéos Go-Pro et retours tactiques ci-dessous !`
    },
    {
      title: '[GUIDE MATOS] Bien choisir sa première réplique Milsim & Entretien',
      category_id: 'cat_technique',
      tags: ['matos', 'tuto'],
      is_pinned: 1,
      is_ai_generated: 0,
      content: `### ⚙️ GUIDE & RECOMMANDATIONS ÉQUIPEMENT

Voici notre guide synthétique pour bien démarrer en Milsim sans se ruiner :

1. **Plateforme AEG polyvalente:** M4 ou AK Series (Canon de précision 6.03mm conseillé).
2. **Protection Oculaire:** Lunettes certifiées EN166B (Obligatoire sur terrain association).
3. **Batteries:** LiPo 7.4V ou 11.1V avec Mosfet de protection.
4. **Billes:** 0.25g / 0.28g Bio exclusivement.

Posez vos questions techniques à l'armurier en réponse ci-dessous !`
    },
    {
      title: '[TAVERNE] Présentation des nouveaux membres & Discussions libres',
      category_id: 'cat_club',
      tags: ['taverne'],
      is_pinned: 0,
      is_ai_generated: 0,
      content: `Bienvenue au QG !
Cet espace est dédié aux discussions informelles, aux présentations des nouveaux arrivants et à la vie associative.

N'hésitez pas à vous présenter (pseudo, spécialité souhaitée, matériel principal) !`
    }
  ];

  for (const item of topicsToSeed) {
    const topicId = crypto.randomUUID();
    const postId = crypto.randomUUID();

    await db.execute({
      sql: `INSERT INTO forum_topics (id, category_id, title, created_by, is_pinned, is_ai_generated, views_count)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [topicId, item.category_id, item.title, validAuthorId, item.is_pinned, item.is_ai_generated, 12]
    });

    await db.execute({
      sql: `INSERT INTO forum_posts (id, topic_id, content, created_by) VALUES (?, ?, ?, ?)`,
      args: [postId, topicId, item.content, validAuthorId]
    });

    for (const tagSlug of item.tags) {
      await attachTagToTopic(topicId, tagSlug);
    }
  }
}

export async function generateQuickTopic(type: 'briefing' | 'debriefing' | 'gear', authorUserId: string): Promise<string> {
  await ensureForumCategories();

  let validAuthorId = authorUserId;
  const userRes = await db.execute({ sql: 'SELECT id FROM users WHERE id = ?', args: [authorUserId] });
  if (userRes.rows.length === 0) {
    const fallbackRes = await db.execute('SELECT id FROM users LIMIT 1');
    const fallbackUser = fallbackRes.rows[0] as any;
    if (fallbackUser) {
      validAuthorId = fallbackUser.id;
    }
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  let title = '';
  let categoryId = '';
  let content = '';
  let tagSlug = '';

  if (type === 'briefing') {
    title = `[BRIEFING IA] OP Tactique du ${dateStr}`;
    categoryId = 'cat_ops';
    tagSlug = 'briefing';
    content = `### 📢 BRIEFING D'AMORCE GÉNÉRÉ PAR IA

**Operation ID:** OP-AUTO-${now.getTime().toString().slice(-4)}
**Date:** ${dateStr}
**Status:** Ordre de marche confirmé

#### 📝 FICHE STRATÉGIQUE
- **Objectif principal:** Prise de contrôle des 3 zones clés.
- **Règles d'engagement:** Respect strict des distances de sécurité.
- **Canal Radio Squad:** Canal 4 (446.04375 MHz).

*Appuyez sur "Répondre" pour confirmer votre présence et votre escouade.*`;
  } else if (type === 'debriefing') {
    title = `[DEBRIEFING IA] Retour d'Opération du ${dateStr}`;
    categoryId = 'cat_ops';
    tagSlug = 'debriefing';
    content = `### 💬 FIL DE DEBRIEFING OFFICIEL

La session du ${dateStr} est terminée.

#### 🎯 POINTS À DEBATTRE :
1. Efficacité des transmissions radio.
2. Équilibrage des équipes & fair-play.
3. Idées d'amélioration pour la prochaine session.

Partagez vos impressions et médias ci-dessous !`;
  } else {
    title = `[FICHE MATÉRIEL] Retours & Avis Réplique - ${dateStr}`;
    categoryId = 'cat_technique';
    tagSlug = 'matos';
    content = `### ⚙️ FICHE MATÉRIEL & CONSEIL TECHNIQUE

Topic d'échange sur le matériel et les réglages tactiques.

- **Modèle concerné:** M4 / AK / DMR
- **Type d'upgrade recommandé:** Joint Hop-Up, Canon, LiPo
- **Retours d'expérience:** Partagez vos chronys et tests d'incurvation de bille.`;
  }

  const topicId = crypto.randomUUID();
  const postId = crypto.randomUUID();

  await db.execute({
    sql: `INSERT INTO forum_topics (id, category_id, title, created_by, is_pinned, is_ai_generated, views_count)
          VALUES (?, ?, ?, ?, 0, 1, 1)`,
    args: [topicId, categoryId, title, validAuthorId]
  });

  await db.execute({
    sql: `INSERT INTO forum_posts (id, topic_id, content, created_by) VALUES (?, ?, ?, ?)`,
    args: [postId, topicId, content, validAuthorId]
  });

  await attachTagToTopic(topicId, tagSlug);
  await attachTagToTopic(topicId, 'officiel');

  return topicId;
}
