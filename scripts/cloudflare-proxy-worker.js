// ============================================================================
// APEX — CLOUDFLARE KV ENGINE (ZERO-SUPABASE, INFINITE FREE LIVE DATABASE)
// ============================================================================
// Storing your entire live Values & WIKI overrides directly in Cloudflare KV.
// Edits are live INSTANTLY for everyone, with ZERO dependency on developers,
// ZERO manual git pushes, and ABSOLUTE ZERO Supabase egress or billing limits!
//
// How to deploy in 1 minute:
// 1. Go to your Cloudflare Dashboard -> Workers & Pages -> Click "Create Application".
// 2. Paste this exact code into your Worker editor.
// 3. Go to your Worker Settings -> KV Namespace Bindings -> Click "Add Binding".
// 4. Name the binding "APEX_OVERRIDES" and select/create a KV Namespace.
// 5. Save & Deploy!
// ============================================================================

// Simple in-memory fallback for initial tests/cold starts in case KV is not bound
let IN_MEMORY_DB_FALLBACK = null;
let IN_MEMORY_PASSCODE_FALLBACK = null;

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight check immediately with standard 204 No Content
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Passcode',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Retrieve active passcode (KV or fallback or default 'apex2026')
    let livePasscode = 'apex2026';
    try {
      if (env.APEX_OVERRIDES) {
        livePasscode = await env.APEX_OVERRIDES.get('adminPasscode') || 'apex2026';
      } else {
        livePasscode = IN_MEMORY_PASSCODE_FALLBACK || 'apex2026';
      }
    } catch (e) {
      console.error('Failed to read passcode from KV:', e);
    }

    // 1. GET /overrides - Read the live staticOverrides JSON database
    if (path === '/overrides' && request.method === 'GET') {
      let data = null;
      try {
        if (env.APEX_OVERRIDES) {
          data = await env.APEX_OVERRIDES.get('staticOverrides');
        } else {
          data = IN_MEMORY_DB_FALLBACK;
        }
      } catch (e) {
        console.error('Failed to read from Cloudflare KV:', e);
      }

      // Fallback: If KV database is completely empty/fresh, fetch the latest baked database from your GitHub Pages live site!
      if (!data) {
        try {
          const fbResponse = await fetch('https://zenithvalues.github.io/Apex-Ball-TD-WIKI/overrides/staticOverrides.json');
          if (fbResponse.ok) {
            data = await fbResponse.text();
            // Automatically bootstrap/cache it into KV so we don't have to fetch GitHub again!
            if (env.APEX_OVERRIDES) {
              await env.APEX_OVERRIDES.put('staticOverrides', data);
            } else {
              IN_MEMORY_DB_FALLBACK = data;
            }
          }
        } catch (err) {
          console.error('Failed to fetch static bootstrap from GitHub:', err);
        }
      }

      // Default fallback structure if KV database and GitHub fetch both failed
      if (!data) {
        data = JSON.stringify({
          timestamp: new Date().toISOString(),
          valueOverrides: {},
          wikiOverrides: {},
        });
      }

      return new Response(data, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=10', // Edge CDN caches for 10s
        },
      });
    }

    // 2. POST /overrides - Write the live staticOverrides JSON database
    if (path === '/overrides' && request.method === 'POST') {
      const passcode = request.headers.get('X-Admin-Passcode');
      if (passcode !== livePasscode) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid Admin Passcode' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const payloadText = await request.text();
      try {
        JSON.parse(payloadText);
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON payload format' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      try {
        if (env.APEX_OVERRIDES) {
          await env.APEX_OVERRIDES.put('staticOverrides', payloadText);
        } else {
          IN_MEMORY_DB_FALLBACK = payloadText;
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: `KV Write Failed: ${e.message}` }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Saved successfully to Cloudflare KV database!' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 3. POST /change-passcode - Update the secure admin passcode in KV
    if (path === '/change-passcode' && request.method === 'POST') {
      const payloadText = await request.text();
      let payload = null;
      try {
        payload = JSON.parse(payloadText);
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON payload format' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const { currentPasscode, newPasscode } = payload;
      if (!currentPasscode || !newPasscode) {
        return new Response(JSON.stringify({ error: 'Missing currentPasscode or newPasscode' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      if (currentPasscode !== livePasscode) {
        return new Response(JSON.stringify({ error: 'Incorrect current passcode' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      try {
        if (env.APEX_OVERRIDES) {
          await env.APEX_OVERRIDES.put('adminPasscode', newPasscode);
        } else {
          IN_MEMORY_PASSCODE_FALLBACK = newPasscode;
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: `KV Passcode Write Failed: ${e.message}` }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Passcode changed successfully!' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(
      JSON.stringify({
        status: '✅ APEX Serverless Cloudflare KV Engine is Live!',
        endpoints: {
          'GET /overrides': 'Read the live values and WIKI overrides database',
          'POST /overrides': 'Update and publish the live database (requires X-Admin-Passcode)',
          'POST /change-passcode': 'Change the secure admin passcode dynamically in KV'
        },
      }, null, 2),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
};
