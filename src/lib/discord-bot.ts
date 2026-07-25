const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const CATEGORY_ID = process.env.DISCORD_CATEGORY_ID;
const ROLE_ID = process.env.DISCORD_ROLE_ID;
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

export async function sendDiscordEventSignup(data: {
  name: string;
  pseudo?: string;
  email: string;
  phone: string;
  event_date: string;
  pack_option: string;
  notes?: string;
  rank_name: string;
  newXp: number;
  totalCount: number;
}) {
  const isMilsim = data.event_date.toLowerCase().includes('milsim');
  const embed = {
    title: `🎯 Nouvelle Inscription — ${data.event_date}`,
    color: isMilsim ? 0x3ba0e3 : 0x00d4aa,
    fields: [
      { name: 'Nom / Prénom', value: data.name, inline: true },
      { name: 'Pseudo', value: data.pseudo || 'Non spécifié', inline: true },
      { name: 'Rang & XP', value: `${data.rank_name} (${data.newXp} XP)`, inline: true },
      { name: 'Option', value: data.pack_option, inline: true },
      { name: 'Email', value: data.email, inline: true },
      { name: 'Téléphone', value: data.phone, inline: true },
      { name: 'Total inscrits session', value: `${data.totalCount} participant(s)`, inline: false },
      { name: 'Remarques', value: data.notes || 'Aucune', inline: false }
    ],
    footer: { text: 'ASAP Airsoft — Notifications Inscriptions' },
    timestamp: new Date().toISOString()
  };

  // 1. Mode Webhook HTTP Prioritaire (Recommandé sur Vercel serverless)
  if (WEBHOOK_URL) {
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });
      if (res.ok) return;
      console.warn('Notification Webhook Discord retour non-200:', res.status);
    } catch (err) {
      console.error('Erreur Webhook Discord:', err);
    }
  }

  // 2. Mode Bot Discord REST API (Si configuré et pas de webhook)
  if (BOT_TOKEN && GUILD_ID) {
    try {
      const prefix = isMilsim ? 'milsim' : 'domi';
      const cleanDate = data.event_date.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().slice(0, 15);
      const channelName = `${prefix}-${cleanDate}`.replace(/-+/g, '-').replace(/^-|-$/g, '');

      // Lister les salons du serveur
      const channelsRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/channels`, {
        headers: { Authorization: `Bot ${BOT_TOKEN}` }
      });
      
      if (channelsRes.ok) {
        const channels: any[] = await channelsRes.json();
        let channel = channels.find((c: any) => c.name === channelName && c.type === 0);

        if (!channel) {
          const bodyPayload: any = {
            name: channelName,
            type: 0,
            topic: `Inscriptions et suivi pour la session ${data.event_date}`
          };

          if (CATEGORY_ID) bodyPayload.parent_id = CATEGORY_ID;
          if (ROLE_ID) {
            bodyPayload.permission_overwrites = [
              { id: GUILD_ID, type: 0, allow: '0', deny: '1024' },
              { id: ROLE_ID, type: 0, allow: '1024', deny: '0' }
            ];
          }

          const createRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/channels`, {
            method: 'POST',
            headers: {
              Authorization: `Bot ${BOT_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyPayload)
          });
          if (createRes.ok) channel = await createRes.json();
        }

        if (channel?.id) {
          await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
            method: 'POST',
            headers: {
              Authorization: `Bot ${BOT_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ embeds: [embed] })
          });
          return;
        }
      }
    } catch (err) {
      console.error('Erreur Bot Discord REST API:', err);
    }
  }

  if (!WEBHOOK_URL && !BOT_TOKEN) {
    console.info('Discord notification ignorée: DISCORD_WEBHOOK_URL ou DISCORD_BOT_TOKEN non définis.');
  }
}

