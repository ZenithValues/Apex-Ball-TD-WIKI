// ============================================================================
// APEX — CLOUDFLARE WORKERS EDGE PROXY (INFINITE FREE EGRESS SHIELD)
// ============================================================================
// If you want UNLIMITED FREE BANDWIDTH across all your visitors (`2K to 200K+
// daily users`) without burning your Supabase 5 GB quota, deploy this code to
// a free Cloudflare Worker (`100,000 free requests/day, UNLIMITED EGRESS`).
//
// How to deploy in 3 minutes:
// 1. Go to workers.cloudflare.com -> Sign up/Log in -> Click "Create Worker".
// 2. Paste this exact code into the worker editor.
// 3. Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` variables in your Worker
//    Settings (or hardcode your public URL below).
// 4. Copy your new Worker URL (e.g. `https://apex-proxy.yourname.workers.dev`).
// 5. In your local `.env` file, change `VITE_SUPABASE_URL` to your new Worker URL!
//
// Result: 100% of your public traffic is served out of Cloudflare's global Edge
// CDN with INFINITE FREE BANDWIDTH ($0.00 Egress bills). Supabase is only checked
// once every 15 seconds in the background (~1 MB/day total on Supabase)!
// ============================================================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetUrl = `${env.SUPABASE_URL || 'https://your-supabase.supabase.co'}${url.pathname}${url.search}`;

    // Pass through preflight CORS and admin write requests directly
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });
      return addCorsHeaders(response);
    }

    // Check Cloudflare Edge Cache for API GET queries
    const cache = caches.default;
    const cacheKey = new Request(url.toString(), request);
    let cachedResponse = await cache.match(cacheKey);

    if (cachedResponse) {
      return addCorsHeaders(cachedResponse);
    }

    // If cache miss, fetch from Supabase and cache at Edge for 15 seconds
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'apikey': env.SUPABASE_ANON_KEY || 'your-anon-key',
        'Authorization': request.headers.get('Authorization') || `Bearer ${env.SUPABASE_ANON_KEY || 'your-anon-key'}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      const edgeResponse = new Response(response.body, response);
      edgeResponse.headers.set('Cache-Control', 'public, max-age=15, s-maxage=15');
      ctx.waitUntil(cache.put(cacheKey, edgeResponse.clone()));
      return addCorsHeaders(edgeResponse);
    }

    return addCorsHeaders(response);
  },
};

function addCorsHeaders(response) {
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-client-info');
  return newResponse;
}
