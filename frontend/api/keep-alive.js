// Vercel Serverless Function: keep-alive cron handler
// Pings Render backend + Supabase every 14 minutes to prevent spin-down.
// Deployed as: /api/keep-alive
/* eslint-disable no-undef */

export default async function handler(req, res) {
  const results = {
    timestamp: new Date().toISOString(),
    render: { status: 'skipped', latencyMs: 0 },
    supabase: { status: 'skipped', latencyMs: 0 },
  };

  const RENDER_URL = process.env.RENDER_BACKEND_URL;
  const SUPABASE_URL = process.env.SUPABASE_URL;

  // Ping Render backend
  if (RENDER_URL) {
    const start = Date.now();
    try {
      const r = await fetch(`${RENDER_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });
      results.render = {
        status: r.ok ? 'ok' : `HTTP ${r.status}`,
        latencyMs: Date.now() - start,
      };
    } catch (e) {
      results.render = { status: 'error', error: e.message, latencyMs: Date.now() - start };
    }
  }

  // Ping Supabase REST API (keep DB alive with lightweight query)
  if (SUPABASE_URL) {
    const start = Date.now();
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/?select=1`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY || '',
          Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY || ''}`,
        },
      });
      results.supabase = {
        status: r.ok ? 'ok' : `HTTP ${r.status}`,
        latencyMs: Date.now() - start,
      };
    } catch (e) {
      results.supabase = { status: 'error', error: e.message, latencyMs: Date.now() - start };
    }
  }

  res.status(200).json(results);
}
