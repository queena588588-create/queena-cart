const GAS_URL =
  'https://script.google.com/macros/s/AKfycbz3cGUC6hsUJfhKJJ-kCznEaYtwiBKcTPpBO-EK40ZB7q0cp4sHjhUye-zN4p1bcQ8s/exec';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'cache-control': 'no-store'
    }
  });
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function cleanDescription(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

async function getProductsFromGas() {
  const target = new URL(GAS_URL);
  target.searchParams.set('api', 'products');

  const res = await fetch(target.toString(), {
    method: 'GET',
    redirect: 'follow'
  });

  if (!res.ok) {
    throw new Error('讀取商品資料失敗');
  }

  const data = await res.json();

  if (!data || !Array.isArray(data.products)) {
    throw new Error('商品資料格式不正確');
  }

  return data.products;
}

async function handleProductShare(request) {
  const url = new URL(request.url);

   const rowMatch =
    url.pathname.match(/^\/p\/(\d+)$/);

  const productRow =
    rowMatch ? Number(rowMatch[1]) : 0;

  const productName =
    String(url.searchParams.get('name') || '').trim();

  if (!productRow && !productName) {
    return Response.redirect(
      url.origin + '/',
      302
    );
  }

  const products = await getProductsFromGas();

    const product = products.find(function (item) {

    if (productRow) {
      return Number(item.row) === productRow;
    }

    return String(item.name || '').trim() === productName;
  });
    if (!product) {

    if (!productName) {
      return Response.redirect(
        url.origin + '/',
        302
      );
    }

    return Response.redirect(
      url.origin +
        '/?product=' +
        encodeURIComponent(productName),
      302
    );
  }

  const title =
    String(product.name || productName).trim();

  const description =
    cleanDescription(product.intro) ||
    'Queena 精選好物，點擊查看商品詳情。';

  const image =
    String(product.photo || '').trim();

  const shopUrl =
    url.origin +
    '/?product=' +
    encodeURIComponent(title);

    const shareUrl =
    url.origin +
    '/p/' +
    encodeURIComponent(
      String(product.row || productRow)
    );

  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImage = escapeHtml(image);
  const safeShopUrl = escapeHtml(shopUrl);
  const safeShareUrl = escapeHtml(shareUrl);

  const imageMeta = image
    ? `
  <meta property="og:image" content="${safeImage}">
  <meta property="og:image:secure_url" content="${safeImage}">
  <meta property="og:image:alt" content="${safeTitle}">
  <meta name="twitter:image" content="${safeImage}">`
    : '';

  const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title>${safeTitle}｜Queena 精選好物</title>
  <meta name="description" content="${safeDescription}">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Queena 精選好物">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:url" content="${safeShareUrl}">
  ${imageMeta}

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">

  <script>
    window.setTimeout(function () {
      window.location.replace(${JSON.stringify(shopUrl)});
    }, 500);
  </script>

  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      box-sizing: border-box;
      font-family: Arial, "Noto Sans TC", sans-serif;
      background: #fff8f3;
      color: #4f3932;
      text-align: center;
    }

    .card {
      width: min(420px, 100%);
      background: white;
      padding: 24px;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(110, 75, 62, 0.12);
    }

    img {
      width: 100%;
      max-height: 320px;
      object-fit: cover;
      border-radius: 14px;
    }

    h1 {
      margin: 18px 0 10px;
      font-size: 22px;
    }

    p {
      line-height: 1.7;
      color: #755f56;
    }

    a {
      display: inline-block;
      margin-top: 10px;
      padding: 12px 20px;
      border-radius: 999px;
      background: #9a6d60;
      color: white;
      text-decoration: none;
    }
  </style>
</head>

<body>
  <div class="card">
    ${
      image
        ? `<img src="${safeImage}" alt="${safeTitle}">`
        : ''
    }

    <h1>${safeTitle}</h1>
    <p>${safeDescription}</p>
    <a href="${safeShopUrl}">查看商品</a>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=UTF-8',
      'cache-control': 'public, max-age=300'
    }
  });
}

function redirectToShop(request, params) {
  const url = new URL(request.url);
  const target = new URL('/', url.origin);
  const hash = new URLSearchParams(params || {});

  target.hash = hash.toString();

  return Response.redirect(target.toString(), 302);
}

async function proxyGet(request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || '';
  const target = new URL(GAS_URL);

  target.searchParams.set('api', action);

  for (const [key, value] of url.searchParams.entries()) {
    if (key !== 'action') {
      target.searchParams.set(key, value);
    }
  }

  const res = await fetch(target.toString(), {
    method: 'GET',
    redirect: 'follow'
  });

  const text = await res.text();

  return new Response(text, {
    status: res.ok ? 200 : res.status,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'cache-control': 'no-store'
    }
  });
}

async function handleLineCallback(request) {
  const url = new URL(request.url);
  const lineError = url.searchParams.get('error') || '';

  if (lineError) {
    const description =
      url.searchParams.get('error_description') ||
      lineError;

    return redirectToShop(request, {
      line_error: description
    });
  }

  const code = url.searchParams.get('code') || '';
  const state = url.searchParams.get('state') || '';

  if (!code || !state) {
    return redirectToShop(request, {
      line_error: 'LINE 登入回傳資料不完整'
    });
  }

  const target = new URL(GAS_URL);

  target.searchParams.set('api', 'lineCallback');
  target.searchParams.set('code', code);
  target.searchParams.set('state', state);

  try {
    const res = await fetch(target.toString(), {
      method: 'GET',
      redirect: 'follow'
    });

    const text = await res.text();
    let data = null;

    try {
      data = JSON.parse(text);
    } catch (err) {
      throw new Error('Google 後台沒有回傳正確資料');
    }

    if (
      !data ||
      data.success !== true ||
      !data.rememberToken
    ) {
      throw new Error(
        data && data.message
          ? data.message
          : 'LINE 身分確認失敗'
      );
    }

    return redirectToShop(request, {
      line_token: data.rememberToken
    });

  } catch (err) {
    return redirectToShop(request, {
      line_error:
        err && err.message
          ? err.message
          : String(err)
    });
  }
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
    Object.entries(payload || {}).forEach(
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

  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: {
      'content-type':
        'application/x-www-form-urlencoded;charset=UTF-8'
    },
    body: body.toString(),
    redirect: 'follow'
  });

  const text = await res.text();

  return new Response(text, {
    status: res.ok ? 200 : res.status,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'cache-control': 'no-store'
    }
  });
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

           if (
        (
          url.pathname === '/share' ||
          /^\/p\/\d+$/.test(url.pathname)
        ) &&
        request.method === 'GET'
      ) {
        return await handleProductShare(request);
      }
      if (
        url.pathname === '/auth/callback' &&
        request.method === 'GET'
      ) {
        return await handleLineCallback(request);
      }

      if (url.pathname === '/api') {
        if (request.method === 'GET') {
          return await proxyGet(request);
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

      return env.ASSETS.fetch(request);

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
