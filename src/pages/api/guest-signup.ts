import type { APIRoute } from 'astro';
import { db } from '../../db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { name, pseudo, email, phone, event_date, pack_option, notes } = data;

    if (!name || !email || !phone || !event_date || !pack_option) {
      return new Response(
        JSON.stringify({ error: 'Champs obligatoires manquants.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cleanPhone = phone.replace(/[\s\.-]/g, '');
    const cleanEmail = (email || '').trim().toLowerCase();

    // Vérification anti-doublon : 1 seule inscription par téléphone ou email par session
    const existingRes = await db.execute({
      sql: `
        SELECT id FROM guest_registrations
        WHERE (REPLACE(phone, ' ', '') = ? OR LOWER(email) = ?) AND event_date = ?
      `,
      args: [cleanPhone, cleanEmail, event_date]
    });

    if (existingRes.rows.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Vous êtes déjà inscrit pour cette session ! (Numéro de téléphone ou email déjà enregistré)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const id = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    // Insert into SQLite database
    await db.execute({
      sql: `
        INSERT INTO guest_registrations (id, name, pseudo, email, phone, event_date, pack_option, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [id, name, pseudo || '', email, phone, event_date, pack_option, notes || '']
    });

    // Gestion XP & Rangs du joueur
    const { getXpRewardForPack, getRankForXp } = await import('../../utils/xpRank');
    const gainedXp = getXpRewardForPack(pack_option);
    const playerPseudo = pseudo || name.split(' ')[0];

    const xpRes = await db.execute({
      sql: `SELECT xp, games_count FROM player_xp WHERE phone = ?`,
      args: [cleanPhone]
    });
    const existingXp = xpRes.rows[0] as { xp: number; games_count: number } | undefined;

    let newXp = gainedXp;
    let newGamesCount = 1;

    if (existingXp) {
      newXp = Number(existingXp.xp) + gainedXp;
      newGamesCount = Number(existingXp.games_count) + 1;
      await db.execute({
        sql: `UPDATE player_xp SET xp = ?, games_count = ?, pseudo = ?, updated_at = CURRENT_TIMESTAMP WHERE phone = ?`,
        args: [newXp, newGamesCount, playerPseudo, cleanPhone]
      });
    } else {
      await db.execute({
        sql: `INSERT INTO player_xp (phone, pseudo, xp, games_count) VALUES (?, ?, ?, ?)`,
        args: [cleanPhone, playerPseudo, newXp, newGamesCount]
      });
    }

    const rank = getRankForXp(newXp);

    // Get updated total registrations count for this event
    const countRes = await db.execute({
      sql: `SELECT COUNT(*) as total FROM guest_registrations WHERE event_date = ?`,
      args: [event_date]
    });
    const totalCount = Number((countRes.rows[0] as any)?.total || 0);

    // Notification Discord (Bot avec création dynamique de salon ou Webhook Fallback)
    const { sendDiscordEventSignup } = await import('../../lib/discord-bot');
    await sendDiscordEventSignup({
      name,
      pseudo,
      email,
      phone,
      event_date,
      pack_option,
      notes,
      rank_name: rank.name,
      newXp,
      totalCount
    });

    return new Response(
      JSON.stringify({
        success: true,
        count: totalCount,
        message: `Inscription enregistrée ! +${gainedXp} XP accordés. Rang : ${rank.name}`,
        xp_gained: gainedXp,
        total_xp: newXp,
        games_count: newGamesCount,
        rank_name: rank.name,
        rank_level: rank.level,
        rank_color: rank.color,
        rank_glow: rank.glow,
        rank_icon_svg: rank.iconSvg
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Erreur API Guest Signup:', err);
    return new Response(
      JSON.stringify({ error: import.meta.env.PROD ? 'Une erreur interne est survenue sur le serveur.' : (err.message || 'Erreur serveur.') }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
