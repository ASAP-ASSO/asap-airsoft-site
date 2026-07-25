import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

const url = process.env.TURSO_DATABASE_URL || 'file:db.sqlite';
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db = createClient({
  url,
  authToken,
});

export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: string;
  tags: string; // JSON string of tags, e.g. '["milsim"]'
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  expires_at: number; // timestamp in ms
}

export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  display_order?: number;
}

export interface ForumTag {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export interface ForumTopic {
  id: string;
  category_id?: string;
  title: string;
  slug?: string;
  created_by: string;
  is_pinned?: number;
  is_locked?: number;
  is_ai_generated?: number;
  views_count?: number;
  created_at: string;
  updated_at?: string;
  username?: string; // for joins
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  replies_count?: number;
  tags?: ForumTag[];
}

export interface ForumPost {
  id: string;
  topic_id: string;
  content: string;
  created_by: string;
  created_at: string;
  username?: string;
  role?: string;
  reactions?: Record<string, { count: number; users: string[]; userReacted: boolean }>;
}

export interface ForumPostReaction {
  id: string;
  post_id: string;
  user_id: string;
  emoji: string;
}

export interface GuestRegistration {
  id: string;
  name: string;
  pseudo?: string;
  email: string;
  phone: string;
  event_date: string;
  pack_option: string;
  notes?: string;
  created_at: string;
}

export interface PlayerXP {
  phone: string;
  pseudo: string;
  xp: number;
  games_count: number;
  updated_at: string;
}

// Ensure table exists & migration helpers
export async function initDbSchema() {
  try {
    await db.executeMultiple(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        tags TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS guest_registrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        pseudo TEXT,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        event_date TEXT NOT NULL,
        pack_option TEXT NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS player_xp (
        phone TEXT PRIMARY KEY,
        pseudo TEXT NOT NULL,
        xp INTEGER DEFAULT 0,
        games_count INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

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

      CREATE TABLE IF NOT EXISTS forum_post_reactions (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id),
        emoji TEXT NOT NULL,
        UNIQUE(post_id, user_id, emoji)
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

      CREATE TABLE IF NOT EXISTS forum_reports (
        id TEXT PRIMARY KEY,
        topic_id TEXT REFERENCES forum_topics(id) ON DELETE CASCADE,
        post_id TEXT REFERENCES forum_posts(id) ON DELETE CASCADE,
        reported_by TEXT NOT NULL REFERENCES users(id),
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {
    console.error("Init Schema error:", e);
  }
}

export async function ensureDevUsers() {
  try {
    await initDbSchema();
    const adminHash = bcrypt.hashSync('admin', 10);
    const userHash = bcrypt.hashSync('user', 10);

    const adminRes = await db.execute({ sql: 'SELECT id FROM users WHERE username = ?', args: ['admin'] });
    if (adminRes.rows.length > 0) {
      await db.execute({ sql: 'UPDATE users SET password_hash = ?, role = ? WHERE username = ?', args: [adminHash, 'admin', 'admin'] });
    } else {
      await db.execute({
        sql: `INSERT INTO users (id, username, password_hash, role, tags) VALUES (?, ?, ?, ?, ?)`,
        args: ['admin_dev_id', 'admin', adminHash, 'admin', JSON.stringify(['milsim', 'dev'])]
      });
    }

    const userRes = await db.execute({ sql: 'SELECT id FROM users WHERE username = ?', args: ['user'] });
    if (userRes.rows.length > 0) {
      await db.execute({ sql: 'UPDATE users SET password_hash = ?, role = ? WHERE username = ?', args: [userHash, 'user', 'user'] });
    } else {
      await db.execute({
        sql: `INSERT INTO users (id, username, password_hash, role, tags) VALUES (?, ?, ?, ?, ?)`,
        args: ['user_dev_id', 'user', userHash, 'user', JSON.stringify(['dev'])]
      });
    }
  } catch (e) {
    console.error("Error seeding dev users:", e);
  }
}
