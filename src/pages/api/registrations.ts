import type { APIRoute } from 'astro';
import { db } from '../../db';
import { getRankForXp, getXpRewardForPack } from '../../utils/xpRank';

export const GET: APIRoute = async ({ url }) => {
  try {
    const event_date = url.searchParams.get('event_date') || 'Prochain Dimanche (Briefing 08h45)';

    // Get count for selected event date
    const countRes = await db.execute({
      sql: `SELECT COUNT(*) as total FROM guest_registrations WHERE event_date = ?`,
      args: [event_date]
    });
    const totalCount = Number((countRes.rows[0] as any)?.total || 0);

    // Get list of registered pseudos and join player_xp
    const rowsRes = await db.execute({
      sql: `
        SELECT g.id, g.pseudo, g.name, g.phone, g.event_date, g.pack_option, g.created_at, p.xp, p.games_count
        FROM guest_registrations g
        LEFT JOIN player_xp p ON REPLACE(g.phone, ' ', '') = p.phone OR g.pseudo = p.pseudo
        WHERE g.event_date = ?
        ORDER BY g.created_at DESC
        LIMIT 30
      `,
      args: [event_date]
    });
    const rows = rowsRes.rows as unknown as Array<{
      id: string;
      pseudo: string;
      name: string;
      phone: string;
      event_date: string;
      pack_option: string;
      created_at: string;
      xp?: number;
      games_count?: number;
    }>;

    // Get all available event dates
    const datesRes = await db.execute(`
      SELECT DISTINCT event_date FROM guest_registrations ORDER BY created_at DESC
    `);
    const datesRows = datesRes.rows as unknown as Array<{ event_date: string }>;

    const datesList = datesRows.map(r => r.event_date);
    if (!datesList.includes('Prochain Dimanche (Briefing 08h45)')) {
      datesList.unshift('Prochain Dimanche (Briefing 08h45)');
    }
    if (!datesList.includes('Dimanche dans 2 semaines')) {
      datesList.push('Dimanche dans 2 semaines');
    }

    const inscritsFormatted = rows.map(r => {
      const displayName = r.pseudo || r.name.split(' ')[0];
      const xp = typeof r.xp === 'number' ? r.xp : getXpRewardForPack(r.pack_option);
      const gamesCount = r.games_count || 1;
      const rank = getRankForXp(xp);

      return {
        display_name: displayName,
        event_date: r.event_date,
        pack_option: r.pack_option,
        created_at: r.created_at,
        xp,
        games_count: gamesCount,
        rank_name: rank.name,
        rank_level: rank.level,
        rank_color: rank.color,
        rank_glow: rank.glow,
        rank_icon_svg: rank.iconSvg
      };
    });

    return new Response(
      JSON.stringify({
        event_date,
        total_inscrits: totalCount,
        inscrits: inscritsFormatted,
        available_dates: datesList
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
