const GAS_URL =
  'https://script.google.com/macros/s/AKfycbz3cGUC6hsUJfhKJJ-kCznEaYtwiBKcTPpBO-EK40ZB7q0cp4sHjhUye-zN4p1bcQ8s/exec';

const PRODUCT_REFRESH_MS = 5 * 60 * 1000;
const PRODUCT_KEEP_SECONDS = 7 * 24 * 60 * 60;
const SITE_ORIGIN = 'https://queena-cart.pages.dev';

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'cache-control': 'no-store',
      ...extraHeaders
    }
  });
}

function looksLikeJson(text) {
  const t = String(text || '').trim();
  return t.startsWith('{') || t.startsWith('[');
}

async function readGasJson(url, options) {
  let res = await fetch(url, {
    ...options,
    redirect: 'manual'
  });

  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get('location');

    if (location) {
      res = await fetch(location, {
        method: 'GET',
        redirect: 'follow',
        headers:
          options && options.headers
            ? options.headers
            : {}
      });
    }
  }

  const text = await res.text();

  if (!res.ok || !looksLikeJson(text)) {
    return {
      ok: false,
      message: 'Google 資料暫時讀取失敗',
      text
    };
  }

  try {
    JSON.parse(text);
  } catch (_) {
    return {
      ok: false,
      message: 'Google 回傳格式異常',
      text
    };
  }

  return {
    ok: true,
    text
  };
}

function productCacheKey(request) {
  const u = new URL(request.url);

  u.pathname = '/__queena_products_cache_v3__';
  u.search = '';

  return new Request(u.toString(), {
    method: 'GET'
  });
}

async function fetchFreshProducts() {
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
    throw new Error(
      result.message || '商品資料讀取失敗'
    );
  }

  const parsed = JSON.parse(result.text);

  if (
    !parsed ||
    parsed.success === false ||
    !Array.isArray(parsed.products) ||
    !parsed.products.length
  ) {
    throw new Error('商品資料為空');
  }

  return new Response(result.text, {
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
  });
}

async function refreshProductCache(cache, key) {
  const fresh = await fetchFreshProducts();

  await cache.put(
    key,
    fresh.clone()
  );

  return fresh;
}

async function getProductsFast(request, ctx) {
  const cache = caches.default;
  const key = productCacheKey(request);
  const cached = await cache.match(key);

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

    if (age > PRODUCT_REFRESH_MS) {
      ctx.waitUntil(
        refreshProductCache(
          cache,
          key
        ).catch(() => {})
      );
    }

    return cached;
  }

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
          err && err.message
            ? err.message
            : '商品資料暫時讀取不到'
      },
      502
    );
  }
}

async function getProductsObject(request, ctx) {
  const response =
    await getProductsFast(
      request,
      ctx
    );

  const text =
    await response.text();

  const data =
    JSON.parse(text);

  if (
    !data ||
    data.success === false ||
    !Array.isArray(data.products)
  ) {
    throw new Error('商品資料無效');
  }

  return data;
}

function escAttr(value) {
  return String(
    value == null ? '' : value
  )
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function safeSeed(data) {
  return JSON.stringify(data)
    .replace(/<\//g, '<\\/')
    .replace(/<!--/g, '<\\!--');
}

function replaceOrAddMeta(
  html,
  property,
  content
) {
  const escaped =
    escAttr(content);

  const re =
    new RegExp(
      '<meta\\s+property=["\\\']' +
      property.replace(':', '\\:') +
      '["\\\'][^>]*>',
      'i'
    );

  const tag =
    '<meta property="' +
    property +
    '" content="' +
    escaped +
    '">';

  return re.test(html)
    ? html.replace(re, tag)
    : html.replace(
        '</head>',
        '  ' + tag + '\n</head>'
      );
}

function replaceCanonical(
  html,
  url
) {
  const tag =
    '<link rel="canonical" href="' +
    escAttr(url) +
    '">';

  const re =
    /<link\s+rel=["']canonical["'][^>]*>/i;

  return re.test(html)
    ? html.replace(re, tag)
    : html.replace(
        '</head>',
        '  ' + tag + '\n</head>'
      );
}

function injectSeed(
  html,
  data
) {
  const seed =
    '<script type="application/json" id="queenaProductSeed">' +
    safeSeed(data) +
    '</script>\n';

  if (
    html.includes(
      'id="queenaProductSeed"'
    )
  ) {
    return html;
  }

  return html.replace(
    '</body>',
    seed + '</body>'
  );
}

async function serveShopPage(
  request,
  env,
  ctx,
  productRow
) {
  const assetUrl = new URL(request.url);

  assetUrl.pathname = '/';
  assetUrl.search = '';

  const assetReq =
    new Request(
      assetUrl.toString(),
      {
        method: 'GET'
      }
    );

  const asset =
    await env.ASSETS.fetch(assetReq);

  if (!asset.ok) {
    return asset;
  }

  let html =
    await asset.text();

  let productData = null;

  try {
    productData =
      await getProductsObject(
        request,
        ctx
      );
  } catch (_) {
    productData = null;
  }

  if (productRow) {
    let product =
      productData &&
      Array.isArray(productData.products)
        ? productData.products.find(
            p =>
              String(p.row) ===
              String(productRow)
          )
        : null;

    if (!product) {
      try {
        const cache =
          caches.default;

        const key =
          productCacheKey(request);

        const freshResponse =
          await refreshProductCache(
            cache,
            key
          );

        const freshText =
          await freshResponse
            .clone()
            .text();

        const freshData =
          JSON.parse(freshText);

        if (
          freshData &&
          freshData.success !== false &&
          Array.isArray(
            freshData.products
          )
        ) {
          productData = freshData;

          product =
            freshData.products.find(
              p =>
                String(p.row) ===
                String(productRow)
            );
        }
      } catch (_) {}
    }

    if (!product) {
      return new Response(
        '商品暫時讀取不到，請稍後再試',
        {
          status: 503,
          headers: {
            'content-type':
              'text/plain; charset=UTF-8',
            'cache-control':
              'no-store, no-cache, must-revalidate, max-age=0'
          }
        }
      );
    }

    if (productData) {
      html =
        injectSeed(
          html,
          productData
        );
    }

    const name =
      String(
        product.name ||
        'Queena SELECT'
      );

    const image =
      String(
        product.photo ||
        product.image ||
        ''
      ).trim() ||
      SITE_ORIGIN +
        '/queena-home.jpg';

    const canonical =
      SITE_ORIGIN +
      '/p/' +
      encodeURIComponent(
        String(product.row)
      );

    const desc =
      'Queena SELECT｜Queena 私心推薦 ♡';

    html =
      html.replace(
        /<title>[\s\S]*?<\/title>/i,
        '<title>' +
          escAttr(name) +
          '</title>'
      );

    html =
      replaceOrAddMeta(
        html,
        'og:title',
        name
      );

    html =
      replaceOrAddMeta(
        html,
        'og:description',
        desc
      );

    html =
      replaceOrAddMeta(
        html,
        'og:image',
        image
      );

    html =
      replaceOrAddMeta(
        html,
        'og:url',
        canonical
      );

    html =
      replaceOrAddMeta(
        html,
        'og:type',
        'website'
      );

    html =
      replaceCanonical(
        html,
        canonical
      );

  } else {

    if (productData) {
      html =
        injectSeed(
          html,
          productData
        );
    }

    html =
      replaceCanonical(
        html,
        SITE_ORIGIN + '/'
      );
  }

  return new Response(
    html,
    {
      status: 200,
      headers: {
        'content-type':
          'text/html; charset=UTF-8',
        'cache-control':
          'no-store, no-cache, must-revalidate, max-age=0',
        'pragma':
          'no-cache',
        'expires':
          '0'
      }
    }
  );
}

/* ==========================================
   LINE Login callback
========================================== */

async function handleLineAuthCallback(request) {

  const url =
    new URL(request.url);

  const code =
    String(
      url.searchParams.get('code') || ''
    ).trim();

  const state =
    String(
      url.searchParams.get('state') || ''
    ).trim();

  const lineError =
    String(
      url.searchParams.get(
        'error_description'
      ) ||
      url.searchParams.get(
        'error'
      ) ||
      ''
    ).trim();

  if (lineError) {
    return Response.redirect(
      SITE_ORIGIN +
      '/#line_error=' +
      encodeURIComponent(lineError),
      302
    );
  }

  if (!code || !state) {
    return Response.redirect(
      SITE_ORIGIN +
      '/#line_error=' +
      encodeURIComponent(
        'LINE 登入回傳資料不完整'
      ),
      302
    );
  }

  const target =
    new URL(GAS_URL);

  target.searchParams.set(
    'api',
    'lineCallback'
  );

  target.searchParams.set(
    'code',
    code
  );

  target.searchParams.set(
    'state',
    state
  );

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
    return Response.redirect(
      SITE_ORIGIN +
      '/#line_error=' +
      encodeURIComponent(
        result.message ||
        'LINE 身分確認失敗'
      ),
      302
    );
  }

  let data;

  try {
    data =
      JSON.parse(result.text);
  } catch (_) {
    return Response.redirect(
      SITE_ORIGIN +
      '/#line_error=' +
      encodeURIComponent(
        'LINE 身分確認格式異常'
      ),
      302
    );
  }

  if (
    !data ||
    data.success === false ||
    !data.rememberToken
  ) {
    return Response.redirect(
      SITE_ORIGIN +
      '/#line_error=' +
      encodeURIComponent(
        data && data.message
          ? data.message
          : 'LINE 身分確認失敗'
      ),
      302
    );
  }

  return Response.redirect(
    SITE_ORIGIN +
    '/#line_token=' +
    encodeURIComponent(
      String(data.rememberToken)
    ),
    302
  );
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
      ? String(
          incoming.action
        )
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
          typeof value === 'string'
            ? value
            : JSON.stringify(value)
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
        new URL(
          request.url
        );

      /* =========================
         LINE OAuth callback
      ========================= */

      if (
        request.method === 'GET' &&
        url.pathname === '/auth/callback'
      ) {
        return handleLineAuthCallback(
          request
        );
      }

      /* =========================
         API
      ========================= */

      if (
        url.pathname === '/api'
      ) {

        if (
          request.method === 'GET'
        ) {
          return proxyGet(
            request,
            ctx
          );
        }

        if (
          request.method === 'POST'
        ) {
          return proxyPost(
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

      /* =========================
         網頁
      ========================= */

      if (
        request.method === 'GET'
      ) {

        const m =
          url.pathname.match(
            /^\/p\/(\d+)\/?$/
          );

        if (m) {
          return serveShopPage(
            request,
            env,
            ctx,
            m[1]
          );
        }

        if (
          url.pathname === '/'
        ) {
          return serveShopPage(
            request,
            env,
            ctx,
            null
          );
        }

        if (
          url.pathname ===
          '/index.html'
        ) {
          return env.ASSETS.fetch(
            request
          );
        }
      }

      return env.ASSETS.fetch(
        request
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
