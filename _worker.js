const GAS_URL =
  'https://script.google.com/macros/s/AKfycbz3cGUC6hsUJfhKJJ-kCznEaYtwiBKcTPpBO-EK40ZB7q0cp4sHjhUye-zN4p1bcQ8s/exec';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'cache-control': 'no-store, no-cache, must-revalidate'
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
    message: 'GAS 暫時沒有回傳 JSON，請重新整理後再試'
  };
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
    Object.entries(payload || {}).forEach(
      function(entry) {
        const key = entry[0];
        const value = entry[1];

        body.set(
          key,
          typeof value === 'string'
            ? value
            : JSON.stringify(value)
        );
      }
    );
  }

  let res = await fetch(GAS_URL, {
    method: 'POST',

    headers: {
      'content-type':
        'application/x-www-form-urlencoded;charset=UTF-8',

      'accept':
        'application/json,text/plain,*/*'
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
          'accept':
            'application/json,text/plain,*/*',

          'cache-control':
            'no-cache'
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
      'content-type':
        'application/json; charset=UTF-8',

      'cache-control':
        'no-store, no-cache, must-revalidate'
    }
  });
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

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
