// calendar.ts - Integration Agenda Google Calendar pour la gestion des événements réels
export interface CalendarEventItem {
  id: string;
  title: string;
  category: string;
  start: string;       // e.g. "Samedi 29 Août 2026"
  isoDate: string;     // e.g. "2026-08-29"
  time: string;        // e.g. "07:00 – 07:00" ou "Toute la journée"
  location: string;
  description: string;
  fullDateLabel: string; // e.g. "Samedi 29 Août 2026 — Milsim MES"
  isMilsim: boolean;
}

export async function getUpcomingCalendarEvents(): Promise<CalendarEventItem[]> {
  try {
    const calendarId = '221cd9f549c1f1a88c6f99b34d65feba6a225a0d8a520b58c5f71d169effeaa5@group.calendar.google.com';
    const apiKey = (typeof process !== 'undefined' && process.env.GOOGLE_CALENDAR_API_KEY)
      || (import.meta && import.meta.env && import.meta.env.GOOGLE_CALENDAR_API_KEY);

    if (!apiKey) {
      console.warn("GOOGLE_CALENDAR_API_KEY non configurée.");
      return [];
    }
    
    const timeMin = new Date().toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${apiKey}&timeMin=${timeMin}&singleEvents=true&orderBy=startTime&maxResults=15`;

    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.items) return [];

    return data.items.map((item: any) => {
      let category = 'Général';
      let title = item.summary || 'Événement sans titre';
      if (title.includes(':')) {
        const parts = title.split(':');
        category = parts[0].trim();
        title = parts.slice(1).join(':').trim();
      }

      const startDateTime = item.start.dateTime || item.start.date;
      const endDateTime = item.end.dateTime || item.end.date;
      const startDate = new Date(startDateTime);
      const isoDate = startDate.toISOString().split('T')[0];

      const formattedDateRaw = startDate.toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
      const formattedDate = formattedDateRaw.charAt(0).toUpperCase() + formattedDateRaw.slice(1);

      let formattedTime = 'Toute la journée';
      if (item.start.dateTime && item.end.dateTime) {
        const startTime = new Date(startDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const endTime   = new Date(endDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        formattedTime = `${startTime} – ${endTime}`;
      }

      const isMilsim = title.toLowerCase().includes('milsim') || category.toLowerCase().includes('milsim');
      const fullDateLabel = `${formattedDate} — ${title}`;

      return {
        id: item.id,
        title,
        category,
        start: formattedDate,
        isoDate,
        time: formattedTime,
        location: item.location || '',
        description: item.description || '',
        fullDateLabel,
        isMilsim
      };
    });
  } catch (e) {
    console.error('Erreur getUpcomingCalendarEvents:', e);
    return [];
  }
}
