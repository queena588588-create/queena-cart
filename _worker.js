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

function redirectToShop(request, params) {

  const url = new URL(request.url);

  const target =
    new URL('/', url.origin);

  const hash =
    new URLSearchParams(
      params || {}
    );

  target.hash =
    hash.toString();

  return Response.redirect(
    target.toString(),
    302
  );
}

async function proxyGet(request) {

  const url =
    new URL(request.url);

  const action =
    url.searchParams.get('action') || '';

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

    if (key !== 'action') {
      target.searchParams.set(
        key,
        value
      );
    }
  }

  const res =
    await fetch(
      target.toString(),
      {
        method: 'GET',
        redirect: 'follow'
      }
    );

  const text =
    await res.text();

  return new Response(
    text,
    {
      status:
        res.ok
          ? 200
          : res.status,

      headers: {
        'content-type':
          'application/json; charset=UTF-8',

        'cache-control':
          'no-store'
      }
    }
  );
}

async function handleLineCallback(request) {

  const url =
    new URL(request.url);

  const lineError =
    url.searchParams.get('error') || '';

  if (lineError) {

    const description =
      url.searchParams.get(
        'error_description'
      ) || lineError;

    return redirectToShop(
      request,
      {
        line_error: description
      }
    );
  }

  const code =
    url.searchParams.get('code') || '';

  const state =
    url.searchParams.get('state') || '';

  if (!code || !state) {

    return redirectToShop(
      request,
      {
        line_error:
          'LINE 登入回傳資料不完整'
      }
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

  try {

    const res =
      await fetch(
        target.toString(),
        {
          method: 'GET',
          redirect: 'follow'
        }
      );

    const text =
      await res.text();

    let data = null;

    try {

      data =
        JSON.parse(text);

    } catch (err) {

      throw new Error(
        'Google 後台沒有回傳正確資料'
      );
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

    return redirectToShop(
      request,
      {
        line_token:
          data.rememberToken
      }
    );

  } catch (err) {

    return redirectToShop(
      request,
      {
        line_error:
          err && err.message
            ? err.message
            : String(err)
      }
    );
  }
}

async function proxyPost(request) {

  const incoming =
    await request.json();

  const action =
    incoming && incoming.action
      ? String(incoming.action)
      : '';

  const payload =
    incoming && incoming.payload
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
        payload.rememberToken || ''
      )
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

  const res =
    await fetch(
      GAS_URL,
      {
        method: 'POST',

        headers: {
          'content-type':
            'application/x-www-form-urlencoded;charset=UTF-8'
        },

        body:
          body.toString(),

        redirect:
          'follow'
      }
    );

  const text =
    await res.text();

  return new Response(
    text,
    {
      status:
        res.ok
          ? 200
          : res.status,

      headers: {
        'content-type':
          'application/json; charset=UTF-8',

        'cache-control':
          'no-store'
      }
    }
  );
}

export default {

  async fetch(request, env) {

    try {

      const url =
        new URL(request.url);

      // LINE 登入完成會直接回到 Cloudflare
      if (
        url.pathname ===
          '/auth/callback' &&
        request.method === 'GET'
      ) {

        return await
          handleLineCallback(request);
      }

      if (
        url.pathname === '/api'
      ) {

        if (
          request.method === 'GET'
        ) {

          return await
            proxyGet(request);
        }

        if (
          request.method === 'POST'
        ) {

          return await
            proxyPost(request);
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

      return env.ASSETS.fetch(
        request
      );

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
