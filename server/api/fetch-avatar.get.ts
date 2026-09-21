/**
 * Server-side fetch of an external avatar image (e.g. Google).
 * Avoids browser CORS limits on googleusercontent.com.
 */
function isAllowedAvatarHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host.endsWith('.googleusercontent.com')
    || host.endsWith('.ggpht.com')
    || host === 'www.googleapis.com'
    || host === 'googleapis.com'
  );
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const url = typeof query.url === 'string' ? query.url.trim() : '';

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'URL inválida' });
  }

  if (parsed.protocol !== 'https:' || !isAllowedAvatarHost(parsed.hostname)) {
    throw createError({ statusCode: 400, statusMessage: 'Host não permitido' });
  }

  const res = await fetch(parsed.toString(), {
    headers: { Accept: 'image/*' },
    redirect: 'follow',
  });

  if (!res.ok) {
    throw createError({ statusCode: 502, statusMessage: 'Falha ao baixar imagem' });
  }

  const contentType = res.headers.get('content-type') || 'image/jpeg';
  if (!contentType.startsWith('image/')) {
    throw createError({ statusCode: 400, statusMessage: 'Resposta não é imagem' });
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > 2 * 1024 * 1024) {
    throw createError({ statusCode: 413, statusMessage: 'Imagem muito grande' });
  }

  return {
    contentType: contentType.split(';')[0].trim(),
    base64: buffer.toString('base64'),
  };
});
