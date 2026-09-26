/**
 * Cloudflare Worker Edge PIN Gate
 * Authenticates visitors at the edge before serving static assets.
 * Implements a 1-year sliding window cookie for active users.
 */

const COOKIE_NAME = 's24_auth';
const ONE_YEAR_SECONDS = 31536000; // 365 days

/**
 * Computes a secure SHA-256 hash of the PIN + salt
 */
async function getExpectedToken(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + '_s24_secure_edge_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Parses a specific cookie from request headers
 */
function getCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  const parts = header.split(';').map((c) => c.trim());
  for (const part of parts) {
    if (part.startsWith(name + '=')) {
      return part.slice(name.length + 1);
    }
  }
  return null;
}

/**
 * Generates an HttpOnly, Secure, SameSite=Strict cookie header
 */
function buildAuthCookie(token, maxAgeSeconds = ONE_YEAR_SECONDS) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSeconds}`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Read PIN from Wrangler secret / environment variable (fallback to '1234' if unset)
    const configuredPin = (env.APP_PIN || '1234').trim();
    const expectedToken = await getExpectedToken(configuredPin);

    // 1. PIN verification endpoint
    if (url.pathname === '/api/auth' && request.method === 'POST') {
      try {
        const body = await request.json();
        const submittedPin = (body.pin || '').trim();

        if (submittedPin === configuredPin) {
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Set-Cookie': buildAuthCookie(expectedToken, ONE_YEAR_SECONDS),
              'Cache-Control': 'no-store'
            }
          });
        } else {
          return new Response(JSON.stringify({ error: 'Incorrect passcode' }), {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store'
            }
          });
        }
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid request' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          }
        });
      }
    }

    // 2. Logout endpoint (clears cookie)
    if (url.pathname === '/logout') {
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/',
          'Set-Cookie': buildAuthCookie('', 0),
          'Cache-Control': 'no-store'
        }
      });
    }

    // 3. Normalize trailing slash for /boa/
    if (url.pathname === '/boa/') {
      return Response.redirect(new URL('/boa', request.url), 301);
    }

    // 4. Public assets needed to render pin.html, favicon, and PWA manifest/icons
    const isPublic =
      url.pathname === '/js/theme.js' ||
      url.pathname === '/manifest.json' ||
      url.pathname === '/favicon.ico' ||
      url.pathname.startsWith('/img/icon');

    if (isPublic) {
      return env.ASSETS.fetch(request);
    }

    // 5. Check for valid authentication cookie
    const clientToken = getCookie(request, COOKIE_NAME);
    const isAuthenticated = clientToken === expectedToken;

    if (!isAuthenticated) {
      // Unauthenticated: intercept and serve pin.html directly at current URL with no-cache headers
      let pinResponse = await env.ASSETS.fetch(new Request(new URL('/pin.html', request.url)));

      // If Cloudflare Assets returns a 3xx redirect (e.g. clean URL redirect), follow the Location header
      if (pinResponse.status >= 300 && pinResponse.status < 400) {
        const redirectUrl = pinResponse.headers.get('Location');
        if (redirectUrl) {
          pinResponse = await env.ASSETS.fetch(new Request(new URL(redirectUrl, request.url)));
        }
      }

      const pinHeaders = new Headers(pinResponse.headers);
      pinHeaders.delete('location'); // Strip any accidental redirect header so browser renders HTML
      pinHeaders.set('Content-Type', 'text/html; charset=utf-8');
      pinHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');

      return new Response(pinResponse.body, {
        status: 200,
        headers: pinHeaders
      });
    }

    // 6. Authenticated: handle route aliases like / -> /index.html and /boa -> /boa.html
    let assetRequest = request;
    if (url.pathname === '/' || url.pathname === '') {
      assetRequest = new Request(new URL('/index.html', request.url), request);
    } else if (url.pathname === '/boa') {
      assetRequest = new Request(new URL('/boa.html', request.url), request);
    }

    // Fetch the real static asset from Cloudflare CDN
    const response = await env.ASSETS.fetch(assetRequest);

    // Extend sliding window: re-issue 1-year cookie so active users never see PIN again
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Set-Cookie', buildAuthCookie(expectedToken, ONE_YEAR_SECONDS));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
};
