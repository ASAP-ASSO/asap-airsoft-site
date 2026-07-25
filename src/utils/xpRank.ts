// xpRank.ts - Système d'XP et Insignes de Rangs Call of Duty style pour ASAP Airsoft

export interface RankInfo {
  level: number;
  name: string;
  minXp: number;
  maxXp: number;
  color: string;
  glow: string;
  iconSvg: string;
}

export const RANKS: RankInfo[] = [
  {
    level: 1,
    name: 'RECRUE',
    minXp: 0,
    maxXp: 99,
    color: '#9da6b4',
    glow: 'rgba(157, 166, 180, 0.4)',
    // Chevron Simple (Privé / Recrue)
    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>`
  },
  {
    level: 2,
    name: 'OPÉRATIONNEL',
    minXp: 100,
    maxXp: 249,
    color: '#00d4aa',
    glow: 'rgba(0, 212, 170, 0.4)',
    // Double Chevron (Caporal / Opérationnel)
    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 11-6-6-6 6"/><path d="m18 17-6-6-6 6"/></svg>`
  },
  {
    level: 3,
    name: 'VOLTIGEUR',
    minXp: 250,
    maxXp: 499,
    color: '#00b4d8',
    glow: 'rgba(0, 180, 216, 0.4)',
    // Triple Chevron + Cible (Sergent Voltigeur)
    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v3m0 12v3M3 12h3m12 0h3"/></svg>`
  },
  {
    level: 4,
    name: 'HABITUÉ',
    minXp: 500,
    maxXp: 999,
    color: '#c9a84c',
    glow: 'rgba(201, 168, 76, 0.4)',
    // Bouclier Tactique (Adjudant / Regular)
    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`
  },
  {
    level: 5,
    name: 'VÉTÉRAN',
    minXp: 1000,
    maxXp: 1999,
    color: '#e85d04',
    glow: 'rgba(232, 93, 4, 0.4)',
    // Étoile de Vétéran (Major / CoD Prestige Badge)
    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
  },
  {
    level: 6,
    name: 'EXPERT',
    minXp: 2000,
    maxXp: 3999,
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.45)',
    // Tête de mort Tactique (Prestige Skull)
    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 10h.01M15 10h.01M10 18v2M14 18v2M12 2a8 8 0 0 0-8 8c0 2.8 1.4 5.3 3.5 6.7V19a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-2.3C18.6 15.3 20 12.8 20 10a8 8 0 0 0-8-8z"/></svg>`
  },
  {
    level: 7,
    name: 'LÉGENDE',
    minXp: 4000,
    maxXp: Infinity,
    color: '#ffd700',
    glow: 'rgba(255, 215, 0, 0.55)',
    // Couronne Prestige Master (Master Wings & Crown)
    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><path d="m2 4 3 12h14l3-12-6 7-4-5-4 5-6-7zm3 14h14v2H5v-2z"/></svg>`
  }
];

export function getRankForXp(xp: number): RankInfo {
  const rank = RANKS.find(r => xp >= r.minXp && xp <= r.maxXp);
  return rank || RANKS[RANKS.length - 1];
}

export function getXpRewardForPack(packOption: string): number {
  const str = (packOption || '').toLowerCase();
  if (str.includes('milsim') || str.includes('spécial') || str.includes('35')) {
    return 250; // OP Milsim = +250 XP
  }
  if (str.includes('découverte') || str.includes('25')) {
    return 150; // Pack Découverte = +150 XP
  }
  return 100; // P.A.F Dominicale classique = +100 XP
}
