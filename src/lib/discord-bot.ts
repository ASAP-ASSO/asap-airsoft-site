const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

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
    footer: { text: 'ASAP Airsoft — Bot Inscriptions' },
    timestamp: new Date().toISOString()
  };

  // 1. Mode Bot Discord API (Création dynamique de salons)
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

        // Si le salon n'existe pas, le créer automatiquement
        if (!channel) {
          const createRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/channels`, {
            method: 'POST',
            headers: {
              Authorization: `Bot ${BOT_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: channelName,
              type: 0,
              topic: `Inscriptions et suivi pour la session ${data.event_date}`
            })
          });
          if (createRes.ok) {
            channel = await createRes.json();
          }
        }

        if (channel && channel.id) {
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

  // 2. Mode Webhook Fallback (Si le bot n'est pas encore configuré)
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });
    } catch (err) {
      console.error('Erreur Webhook Discord:', err);
    }
  }
}
