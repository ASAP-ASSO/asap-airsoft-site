/**
 * Moteur de Modération Automatique du Forum Milsim
 * Détection de spam, mots interdits, insultes, contenu NSFW/Porn et liens suspects.
 */

// Liste des mots/expressions strictement interdits (Insultes, Pornographie, Phishing, Casino Spam)
const BANNED_PATTERNS: Array<{ pattern: RegExp; category: string }> = [
  // NSFW / Pornographie / Explicite
  { pattern: /\b(porn|porno|xvideos|xnxx|hentai|sex|sexe|sexueller?|explicit|nude|nudes|onlyfans)\b/i, category: 'NSFW / Pornographie' },
  // Insultes majeures / Haine
  { pattern: /\b(connard|salope|encul[ee]|pute|fils de pute|nique|pouffiasse|batard|bâtard)\b/i, category: 'Propos Injurieux' },
  // Spam Casino / Crypto / Phishing
  { pattern: /\b(casino|poker|slotmachine|free money|cryptocurrency|bitcoin|whatsapp \+\d+|telegram @[a-z0-9_]+)\b/i, category: 'Spam Commercial / Phishing' }
];

export interface ModerationResult {
  safe: boolean;
  reason?: string;
  category?: string;
}

/**
 * Analyse la sécurité et la conformité d'un texte avant publication.
 */
export function checkContentSafety(text: string): ModerationResult {
  if (!text || text.trim().length === 0) {
    return { safe: true };
  }

  // 1. Vérification des mots strictement interdits / NSFW / Porn / Spam
  for (const item of BANNED_PATTERNS) {
    if (item.pattern.test(text)) {
      return {
        safe: false,
        reason: `Contenu non conforme détecté par le système de sécurité (${item.category}).`,
        category: item.category
      };
    }
  }

  // 2. Détection de spam de liens URL (max 3 liens par message)
  const urlMatches = text.match(/https?:\/\/[^\s]+/gi) || [];
  if (urlMatches.length > 3) {
    return {
      safe: false,
      reason: "Message rejeté : nombre excessif de liens externes (Anti-Spam).",
      category: 'Spam de Liens'
    };
  }

  // 3. Détection de spam de répétition de caractères (ex: AAAAAAAA ou !!!!!!)
  if (/(.)\1{12,}/i.test(text)) {
    return {
      safe: false,
      reason: "Message rejeté : répétition de caractères excessive (Flooding).",
      category: 'Flooding'
    };
  }

  return { safe: true };
}

/**
 * Masque les insultes mineures dans un texte si nécessaire.
 */
export function sanitizeText(text: string): string {
  if (!text) return "";
  let clean = text;
  // Remplacer les jurons par des astérisques
  const mildProfanity = /\b(merde|con|putain)\b/gi;
  return clean.replace(mildProfanity, '***');
}
