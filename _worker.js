const GAS_URL =
  'https://script.google.com/macros/s/AKfycbz3cGUC6hsUJfhKJJ-kCznEaYtwiBKcTPpBO-EK40ZB7q0cp4sHjhUye-zN4p1bcQ8s/exec';

// 商品：快取本體保留 7 天；超過 5 分鐘就在背景更新。
// 客人永遠優先拿到快取，不需要等 Google 試算表。
const PRODUCT_REFRESH_MS = 5 * 60 * 1000;
const PRODUCT_KEEP_SECONDS = 7 * 24 * 60 * 60;

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
        text,
        status: 200
      };
    } catch (_) {}
  }

  if (attempt < 3) {
    await new Promise(resolve =>
      setTimeout(resolve, 350 * attempt)
    );

    return readGasJson(
      url,
      options,
      attempt + 1
    );
  }

  return {
    ok: false,
    status: res.status || 502,
    text,
    message: '商品資料暫時讀取不到，請稍後再試'
  };
}

function productCacheKey(request) {
  const u = new URL(request.url);

  u.pathname =
    '/__queena_products_cache_v2__';

  u.search = '';

  return new Request(
    u.toString(),
    { method: 'GET' }
  );
}

async function fetchFreshProducts() {
  const target = new URL(GAS_URL);

  target.searchParams.set(
    'api',
    'products'
  );

  const result = await readGasJson(
    target.toString(),
    {
      method: 'GET',
      headers: {
        'accept':
          'application/json,text/plain,*/*',
        'cache-control':
          'no-cache'
      }
    }
  );

  if (!result.ok) {
    throw new Error(
      result.message ||
      '商品資料讀取失敗'
    );
  }

  const parsed =
    JSON.parse(result.text);

  if (
    !parsed ||
    parsed.success === false ||
    !Array.isArray(parsed.products) ||
    parsed.products.length === 0
  ) {
    throw new Error(
      '商品資料為空'
    );
  }

  return new Response(
    result.text,
    {
      status: 200,
      headers: {
        'content-type':
          'application/json; charset=UTF-8',

        'cache-control':
          'public, max-age=' +
          PRODUCT_KEEP_SECONDS,

        'x-queena-cached-at':
          String(Date.now())
      }
    }
  );
}

async function refreshProductCache(
  cache,
  key
) {
  const fresh =
    await fetchFreshProducts();

  await cache.put(
    key,
    fresh.clone()
  );

  return fresh;
}

async function getProductsFast(
  request,
  ctx
) {
  const cache =
    caches.default;

  const key =
    productCacheKey(request);

  const cached =
    await cache.match(key);

  if (cached) {
    const cachedAt =
      Number(
        cached.headers.get(
          'x-queena-cached-at'
        ) || 0
      );

    const age =
      cachedAt
        ? Date.now() - cachedAt
        : PRODUCT_REFRESH_MS + 1;

    // 有舊商品資料：
    // 直接先給客人，不讓客人等 Google。
    // 超過 5 分鐘才在背景更新。
    if (
      age >
      PRODUCT_REFRESH_MS
    ) {
      ctx.waitUntil(
        refreshProductCache(
          cache,
          key
        ).catch(err =>
          console.log(
            'Queena background product refresh failed:',
            err &&
            err.message
              ? err.message
              : err
          )
        )
      );
    }

    return cached;
  }

  // 只有第一次還沒有快取時，
  // 才需要等 Google 建立一次商品快取。
  try {
    return await refreshProductCache(
      cache,
      key
    );

  } catch (err) {
    return jsonResponse(
      {
        success: false,
        message:
          err &&
          err.message
            ? err.message
            : '商品資料暫時讀取不到'
      },
      502
    );
  }
}

async function proxyGet(
  request,
  ctx
) {
  const url =
    new URL(request.url);

  const action =
    url.searchParams.get(
      'action'
    ) || '';

  if (action === 'products') {
    return getProductsFast(
      request,
      ctx
    );
  }

  const target =
    new URL(GAS_URL);

  target.searchParams.set(
    'api',
    action
  );

  for (
    const [key, value]
    of url.searchParams.entries()
  ) {
    if (
      key !== 'action' &&
      key !== '_cb'
    ) {
      target.searchParams.set(
        key,
        value
      );
    }
  }

  const result =
    await readGasJson(
      target.toString(),
      {
        method: 'GET',
        headers: {
          'accept':
            'application/json,text/plain,*/*',
          'cache-control':
            'no-cache'
        }
      }
    );

  if (!result.ok) {
    return jsonResponse(
      {
        success: false,
        message:
          result.message
      },
      502
    );
  }

  return new Response(
    result.text,
    {
      status: 200,
      headers: {
        'content-type':
          'application/json; charset=UTF-8',

        'cache-control':
          'no-store, no-cache, must-revalidate'
      }
    }
  );
}

async function proxyPost(request) {
  const incoming =
    await request.json();

  const action =
    incoming &&
    incoming.action
      ? String(incoming.action)
      : '';

  const payload =
    incoming &&
    incoming.payload
      ? incoming.payload
      : {};

  const body =
    new URLSearchParams();

  body.set(
    'type',
    action
  );

  if (action === 'wishlist') {
    body.set(
      'rememberToken',
      String(
        payload.rememberToken ||
        ''
      )
    );

    body.set(
      'itemsJson',
      JSON.stringify(
        Array.isArray(
          payload.items
        )
          ? payload.items
          : []
      )
    );

  } else {
    Object.entries(
      payload || {}
    ).forEach(
      ([key, value]) => {

        body.set(
          key,
          typeof value ===
          'string'
            ? value
            : JSON.stringify(
                value
              )
        );

      }
    );
  }

  let res =
    await fetch(
      GAS_URL,
      {
        method: 'POST',

        headers: {
          'content-type':
            'application/x-www-form-urlencoded;charset=UTF-8',

          'accept':
            'application/json,text/plain,*/*'
        },

        body:
          body.toString(),

        redirect:
          'manual'
      }
    );

  if (
    res.status >= 300 &&
    res.status < 400
  ) {
    const location =
      res.headers.get(
        'location'
      );

    if (location) {
      res =
        await fetch(
          location,
          {
            method: 'GET',
            redirect: 'follow',

            headers: {
              'accept':
                'application/json,text/plain,*/*',

              'cache-control':
                'no-cache'
            }
          }
        );
    }
  }

  const text =
    await res.text();

  if (
    !res.ok ||
    !looksLikeJson(text)
  ) {
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

  return new Response(
    text,
    {
      status: 200,
      headers: {
        'content-type':
          'application/json; charset=UTF-8',

        'cache-control':
          'no-store, no-cache, must-revalidate'
      }
    }
  );
}

export default {
  async fetch(
    request,
    env,
    ctx
  ) {
    try {
      const url =
        new URL(request.url);

      // =========================
      // API
      // =========================
      if (
        url.pathname === '/api'
      ) {

        if (
          request.method ===
          'GET'
        ) {
          return await proxyGet(
            request,
            ctx
          );
        }

        if (
          request.method ===
          'POST'
        ) {
          return await proxyPost(
            request
          );
        }

        return jsonResponse(
          {
            success: false,
            message:
              'Method not allowed'
          },
          405
        );
      }

      // =========================
      // 網站靜態檔案
      // =========================
      const assetResponse =
        await env.ASSETS.fetch(
          request
        );

      const headers =
        new Headers(
          assetResponse.headers
        );

      // 首頁 HTML 不快取，
      // 避免 Safari 一直拿舊 index。
      if (
        url.pathname === '/' ||
        url.pathname ===
          '/index.html'
      ) {
        headers.set(
          'cache-control',
          'no-store, no-cache, must-revalidate, max-age=0'
        );

        headers.set(
          'pragma',
          'no-cache'
        );

        headers.set(
          'expires',
          '0'
        );
      }

      return new Response(
        assetResponse.body,
        {
          status:
            assetResponse.status,

          statusText:
            assetResponse.statusText,

          headers
        }
      );

    } catch (err) {
      return jsonResponse(
        {
          success: false,

          message:
            err &&
            err.message
              ? err.message
              : String(err)
        },
        500
      );
    }
  }
};
