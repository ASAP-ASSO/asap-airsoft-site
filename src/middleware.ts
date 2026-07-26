import { defineMiddleware } from 'astro:middleware';
import { validateSession } from './db/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const sessionId = context.cookies.get('session_id')?.value || '';
  
  if (sessionId) {
    const { user, session } = await validateSession(sessionId);
    context.locals.user = user;
    context.locals.session = session;
  } else {
    context.locals.user = null;
    context.locals.session = null;
  }

  // Redirection de sécurité basique
  const url = new URL(context.request.url);

  // Protection anti-CSRF sur les requêtes de modification (POST, PUT, DELETE, PATCH)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(context.request.method)) {
    const origin = context.request.headers.get('origin');
    const referer = context.request.headers.get('referer');
    const host = context.request.headers.get('host');

    if (origin) {
      try {
        const originHost = new URL(origin).host;
        if (host && originHost !== host) {
          return new Response('Anti-CSRF: Validation d\'origine échouée.', { status: 403 });
        }
      } catch (e) {
        return new Response('En-tête Origin invalide.', { status: 403 });
      }
    } else if (referer) {
      try {
        const refererHost = new URL(referer).host;
        if (host && refererHost !== host) {
          return new Response('Anti-CSRF: Validation du référent échouée.', { status: 403 });
        }
      } catch (e) {
        return new Response('En-tête Referer invalide.', { status: 403 });
      }
    }
  }

  // Sécurité Espace Admin
  if (url.pathname.startsWith('/admin')) {
    if (!context.locals.user || context.locals.user.role !== 'admin') {
      return context.redirect('/connexion?redirect=' + encodeURIComponent(url.pathname));
    }
  }

  // Sécurité Forum
  if (url.pathname.startsWith('/forum')) {
    if (!context.locals.user) {
      return context.redirect('/connexion?redirect=' + encodeURIComponent(url.pathname));
    }
    // Vérifier si membre milsim
    let isMilsim = false;
    try {
      const tags = JSON.parse(context.locals.user.tags || '[]');
      isMilsim = Array.isArray(tags) && tags.includes('milsim');
    } catch (e) {
      // Ignorer
    }

    if (!isMilsim && context.locals.user.role !== 'admin') {
      return context.redirect('/membres?error=milsim_only');
    }
  }

  // Sécurité Espace Membres
  if (url.pathname.startsWith('/membres')) {
    if (!context.locals.user) {
      return context.redirect('/connexion');
    }
  }

  return next();
});
