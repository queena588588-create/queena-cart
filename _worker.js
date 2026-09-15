const GAS_URL =
  'https://script.google.com/macros/s/AKfycbz3cGUC6hsUJfhKJJ-kCznEaYtwiBKcTPpBO-EK40ZB7q0cp4sHjhUye-zN4p1bcQ8s/exec';

const PRODUCT_CACHE_SECONDS = 60;

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'cache-control': 'no-store, no-cache, must-revalidate',
      ...extraHeaders
    }
  });
}

function looksLikeJson(text) {
  const s = String(text || '').trim();
  return s.startsWith('{') || s.startsWith('[');
}

async function readGasJson(url, options, attempt = 1) {
  const requestUrl = new URL(url);

  requestUrl.searchParams.set(
    '_cf_try',
    String(Date.now()) + '_' + attempt
  );

  let res = await fetch(requestUrl.toString(), {
    ...options,
    redirect: 'manual'
  });

  // GAS 常會先 302 到 googleusercontent
  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get('location');

    if (location) {
      res = await fetch(location, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'accept': 'application/json,text/plain,*/*',
          'cache-control': 'no-cache'
        }
      });
    }
  }

  const text = await res.text();

  if (res.ok && looksLikeJson(text)) {
    try {
      JSON.parse(text);

      return {
        ok: true,
        text: text,
        status: 200
      };
    } catch (_) {}
  }

  if (attempt < 4) {
    await new Promise(function(resolve) {
      setTimeout(resolve, 250 * attempt);
    });

    return readGasJson(url, options, attempt + 1);
  }

  return {
    ok: false,
    status: res.status || 502,
    text: text,
    message: '商品資料暫時讀取不到，請重新整理後再試'
  };
}

async function getCachedProducts(request, env) {
  const cache = caches.default;

  // 固定 cache key，不讓前端的 _cb 造成每次都重新打 GAS
  const cacheKey =
    new Request(
      new URL('/__queena_products_cache__', request.url).toString(),
      { method: 'GET' }
    );

  const cached = await cache.match(cacheKey);

  if (cached) {
    return cached;
  }

  const target = new URL(GAS_URL);
  target.searchParams.set('api', 'products');

  const result = await readGasJson(
    target.toString(),
    {
      method: 'GET',
      headers: {
        'accept': 'application/json,text/plain,*/*',
        'cache-control': 'no-cache'
      }
    }
  );

  if (!result.ok) {
    return jsonResponse(
      {
        success: false,
        message: result.message
      },
      502
    );
  }

  const response = new Response(result.text, {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'cache-control':
        'public, max-age=0, s-maxage=' + PRODUCT_CACHE_SECONDS
    }
  });

  // 不阻塞客人畫面
  if (env && env.ctx && typeof env.ctx.waitUntil === 'function') {
    env.ctx.waitUntil(cache.put(cacheKey, response.clone()));
  } else {
    try {
      await cache.put(cacheKey, response.clone());
    } catch (_) {}
  }

  return response;
}

async function proxyGet(request, env) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || '';

  // 商品資料使用 Cloudflare 60 秒暫存
  if (action === 'products') {
    return getCachedProducts(request, env);
  }

  const target = new URL(GAS_URL);
  target.searchParams.set('api', action);

  for (const [key, value] of url.searchParams.entries()) {
    if (key !== 'action' && key !== '_cb') {
      target.searchParams.set(key, value);
    }
  }

  const result = await readGasJson(
    target.toString(),
    {
      method: 'GET',
      headers: {
        'accept': 'application/json,text/plain,*/*',
        'cache-control': 'no-cache'
      }
    }
  );

  if (!result.ok) {
    return jsonResponse(
      {
        success: false,
        message: result.message
      },
      502
    );
  }

  return new Response(result.text, {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'cache-control': 'no-store, no-cache, must-revalidate'
    }
  });
}

async function proxyPost(request) {
  const incoming = await request.json();

  const action =
    incoming && incoming.action
      ? String(incoming.action)
      : '';

  const payload =
    incoming && incoming.payload
      ? incoming.payload
      : {};

  const body = new URLSearchParams();

  body.set('type', action);

  if (action === 'wishlist') {
    body.set(
      'rememberToken',
      String(payload.rememberToken || '')
    );

    body.set(
      'itemsJson',
      JSON.stringify(
        Array.isArray(payload.items)
          ? payload.items
          : []
      )
    );
  } else {
    Object.entries(payload || {}).forEach(function(entry) {
      const key = entry[0];
      const value = entry[1];

      body.set(
        key,
        typeof value === 'string'
          ? value
          : JSON.stringify(value)
      );
    });
  }

  // POST 絕對不自動重送，避免重複訂單
  let res = await fetch(GAS_URL, {
    method: 'POST',
    headers: {
      'content-type':
        'application/x-www-form-urlencoded;charset=UTF-8',
      'accept': 'application/json,text/plain,*/*'
    },
    body: body.toString(),
    redirect: 'manual'
  });

  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get('location');

    if (location) {
      res = await fetch(location, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'accept': 'application/json,text/plain,*/*',
          'cache-control': 'no-cache'
        }
      });
    }
  }

  const text = await res.text();

  if (!res.ok || !looksLikeJson(text)) {
    return jsonResponse(
      {
        success: false,
        message:
          '訂單送出結果暫時異常，請先不要重複送出，稍後確認訂單紀錄'
      },
      502
    );
  }

  try {
    JSON.parse(text);
  } catch (_) {
    return jsonResponse(
      {
        success: false,
        message:
          '訂單送出結果格式異常，請先不要重複送出'
      },
      502
    );
  }

  return new Response(text, {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'cache-control': 'no-store, no-cache, must-revalidate'
    }
  });
}

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      if (url.pathname === '/api') {
        if (request.method === 'GET') {
          // 把 ctx 傳進商品 cache
          const workerEnv = Object.assign({}, env || {});
          workerEnv.ctx = ctx;

          return await proxyGet(request, workerEnv);
        }

        if (request.method === 'POST') {
          return await proxyPost(request);
        }

        return jsonResponse(
          {
            success: false,
            message: 'Method not allowed'
          },
          405
        );
      }

      // 首頁 / index.html 不做 Cloudflare cache，
      // 避免 iPhone Safari 一直吃到舊版 HTML
      const assetResponse = await env.ASSETS.fetch(request);

      const headers = new Headers(assetResponse.headers);

      if (
        url.pathname === '/' ||
        url.pathname === '/index.html'
      ) {
        headers.set(
          'cache-control',
          'no-store, no-cache, must-revalidate, max-age=0'
        );
        headers.set('pragma', 'no-cache');
        headers.set('expires', '0');
      }

      return new Response(assetResponse.body, {
        status: assetResponse.status,
        statusText: assetResponse.statusText,
        headers: headers
      });

    } catch (err) {
      return jsonResponse(
        {
          success: false,
          message:
            err && err.message
              ? err.message
              : String(err)
        },
        500
      );
    }
  }
};
