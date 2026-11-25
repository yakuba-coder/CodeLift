const apiBase = 'https://api.cloudflare.com/client/v4';

function config() {
  const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } = process.env;
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    throw new Error('Cloudflare Stream is not configured on the server.');
  }
  return { accountId: CLOUDFLARE_ACCOUNT_ID, token: CLOUDFLARE_API_TOKEN };
}

async function cfRequest(path, options = {}) {
  const { accountId, token } = config();
  const response = await fetch(`${apiBase}/accounts/${accountId}/stream${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.errors?.[0]?.message || 'Cloudflare Stream request failed.');
  return data.result;
}

export async function createDirectUpload() {
  const maxDurationSeconds = Number(process.env.CLOUDFLARE_MAX_VIDEO_SECONDS || 7200);
  return cfRequest('/direct_upload', {
    method: 'POST',
    body: JSON.stringify({ maxDurationSeconds, requireSignedURLs: true })
  });
}

export async function createPlaybackToken(uid) {
  const result = await cfRequest(`/${encodeURIComponent(uid)}/token`, {
    method: 'POST',
    body: JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 * 15 })
  });
  return result.token;
}
