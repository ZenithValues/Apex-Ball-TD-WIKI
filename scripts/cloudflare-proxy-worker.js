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
let IN_MEMORY_PASSWORDS_FALLBACK = null;

const TEAM_EMAILS = [
  'gustavo.rb1410@gmail.com',
  'bananatempest25@gmail.com',
  'treymurphy3rd@gmail.com',
  'destroyha3@gmail.com',
  'gloomy302010@gmail.com',
  'jiteaianis@gmail.com',
  'dakingnub@gmail.com',
  'johnmustard129@gmail.com',
  'alieldaw6@gmail.com',
  'hungryaistukas@gmail.com',
  'luquitas290414@gmail.com',
  'hellfiregamingytt@gmail.com'
];

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

    // Helper: Retrieve all individual admin passwords map (KV or fallback or defaults)
    async function getPasswordsMap() {
      let passwordsText = null;
      try {
        if (env.APEX_OVERRIDES) {
          passwordsText = await env.APEX_OVERRIDES.get('adminPasswords');
        } else {
          passwordsText = IN_MEMORY_PASSWORDS_FALLBACK;
        }
      } catch (e) {
        console.error('Failed to read passwords from KV:', e);
      }

      let map = {};
      if (passwordsText) {
        try {
          map = JSON.parse(passwordsText);
        } catch (e) {
          console.error('Failed to parse passwords map:', e);
        }
      }

      // Initialize defaults for any team member who does not have a password yet
      let updated = false;
      TEAM_EMAILS.forEach(email => {
        const clean = email.toLowerCase().trim();
        if (!map[clean]) {
          map[clean] = 'apex2026'; // Default initial passcode
          updated = true;
        }
      });

      // Cache back to KV if updated
      if (updated) {
        try {
          const serialized = JSON.stringify(map);
          if (env.APEX_OVERRIDES) {
            await env.APEX_OVERRIDES.put('adminPasswords', serialized);
          } else {
            IN_MEMORY_PASSWORDS_FALLBACK = serialized;
          }
        } catch (e) {
          console.error('Failed to write initialized passwords to KV:', e);
        }
      }

      return map;
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
      // Validate that the request contains a valid passcode matching the editor's individual password!
      const passcode = request.headers.get('X-Admin-Passcode');
      const emailHeader = request.headers.get('X-Admin-Email');
      
      const passwordsMap = await getPasswordsMap();
      const cleanEmail = String(emailHeader || '').trim().toLowerCase();
      const expectedPass = passwordsMap[cleanEmail] || 'apex2026';

      if (!passcode || passcode !== expectedPass) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid Admin Passcode or Session' }), {
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

    // 3. POST /change-password - Update an individual editor's secure password in KV
    if (path === '/change-password' && request.method === 'POST') {
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

      const { email: rawEmail, currentPassword, newPassword } = payload;
      if (!rawEmail || !currentPassword || !newPassword) {
        return new Response(JSON.stringify({ error: 'Missing email, currentPassword or newPassword' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const cleanEmail = rawEmail.trim().toLowerCase();
      const passwordsMap = await getPasswordsMap();
      const livePass = passwordsMap[cleanEmail];

      if (!livePass) {
        return new Response(JSON.stringify({ error: 'Email not found on the APEX team roster.' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      if (currentPassword !== livePass) {
        return new Response(JSON.stringify({ error: 'Incorrect current password' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      // Update password
      passwordsMap[cleanEmail] = newPassword;

      try {
        const serialized = JSON.stringify(passwordsMap);
        if (env.APEX_OVERRIDES) {
          await env.APEX_OVERRIDES.put('adminPasswords', serialized);
        } else {
          IN_MEMORY_PASSWORDS_FALLBACK = serialized;
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: `KV Password Write Failed: ${e.message}` }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Password updated successfully!' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 4. POST /login - Verify individual editor credentials
    if (path === '/login' && request.method === 'POST') {
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

      const { email: rawEmail, password } = payload;
      if (!rawEmail || !password) {
        return new Response(JSON.stringify({ error: 'Missing email or password' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const cleanEmail = rawEmail.trim().toLowerCase();
      const passwordsMap = await getPasswordsMap();
      const livePass = passwordsMap[cleanEmail];

      if (!livePass) {
        return new Response(JSON.stringify({ error: 'Email not found on the APEX team roster.' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      if (password !== livePass) {
        return new Response(JSON.stringify({ error: 'Incorrect password' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Authenticated successfully!' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(
      JSON.stringify({
        status: '✅ APEX Serverless Cloudflare KV Engine is Live!',
        endpoints: {
          'GET /overrides': 'Read the live values and WIKI overrides database',
          'POST /overrides': 'Update and publish the live database',
          'POST /change-password': 'Change an individual editor password dynamically in KV',
          'POST /login': 'Authenticate an individual editor dynamically in KV'
        },
      }, null, 2),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
};
