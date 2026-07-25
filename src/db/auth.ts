import { db, type User, type Session } from './index';
import crypto from 'crypto';

const SESSION_EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

// Générer un UUID pour la session
export async function createSession(userId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiresAt = Date.now() + SESSION_EXPIRATION_MS;

  await db.execute({
    sql: `
      INSERT INTO sessions (id, user_id, expires_at)
      VALUES (?, ?, ?)
    `,
    args: [sessionId, userId, expiresAt]
  });

  return sessionId;
}

// Valider une session et la prolonger si nécessaire
export async function validateSession(sessionId: string): Promise<{ user: User | null; session: Session | null }> {
  if (!sessionId) {
    return { user: null, session: null };
  }

  const sessionRes = await db.execute({
    sql: 'SELECT * FROM sessions WHERE id = ?',
    args: [sessionId]
  });
  const session = (sessionRes.rows[0] as unknown as Session) || null;
  if (!session) {
    return { user: null, session: null };
  }

  if (Date.now() >= session.expires_at) {
    await db.execute({ sql: 'DELETE FROM sessions WHERE id = ?', args: [sessionId] });
    return { user: null, session: null };
  }

  // Prolongation si moins de la moitié du temps restant
  const halfExpiration = SESSION_EXPIRATION_MS / 2;
  if (session.expires_at - Date.now() < halfExpiration) {
    const nextExpiresAt = Date.now() + SESSION_EXPIRATION_MS;
    await db.execute({
      sql: 'UPDATE sessions SET expires_at = ? WHERE id = ?',
      args: [nextExpiresAt, sessionId]
    });
    session.expires_at = nextExpiresAt;
  }

  const userRes = await db.execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [session.user_id]
  });
  const user = (userRes.rows[0] as unknown as User) || null;
  if (!user) {
    await db.execute({ sql: 'DELETE FROM sessions WHERE id = ?', args: [sessionId] });
    return { user: null, session: null };
  }

  return { user, session };
}

// Détruire une session
export async function destroySession(sessionId: string): Promise<void> {
  if (sessionId) {
    await db.execute({ sql: 'DELETE FROM sessions WHERE id = ?', args: [sessionId] });
  }
}

// Fonction utilitaire pour vérifier si l'utilisateur possède un tag
export function hasTag(user: User | null, tag: string): boolean {
  if (!user || !user.tags) return false;
  try {
    const tagsArray = JSON.parse(user.tags);
    return Array.isArray(tagsArray) && tagsArray.includes(tag);
  } catch (e) {
    return false;
  }
}
