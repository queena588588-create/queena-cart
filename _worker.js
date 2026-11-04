const GAS_URL =
  'https://script.google.com/macros/s/AKfycbz3cGUC6hsUJfhKJJ-kCznEaYtwiBKcTPpBO-EK40ZB7q0cp4sHjhUye-zN4p1bcQ8s/exec';

const PRODUCT_REFRESH_MS = 5 * 60 * 1000;
const PRODUCT_KEEP_SECONDS = 7 * 24 * 60 * 60;
const SITE_ORIGIN = 'https://queena.tw';

// 舊分享網址永久對應：以 W 欄為準，禁止把舊網址當成目前列號。
const QUEENA_LEGACY_SHARE_NAMES = {"2": "PRIME雪花牛排", "3": "圓筒收納置物凳", "4": "日本頂級山梨縣溫室水蜜桃-1KG+-10%/盒（原裝進口盒｜5-6顆裝）", "5": "USB迷你直髮夾 BY-535(白色/紫色", "6": "九胜肽緊膚⾯膜", "7": "洗衣機清潔錠", "8": "水洗雲朵冰淇淋被", "9": "6D蝶型涼感記憶枕", "10": "嬰幼兒玩具｜早教｜用品", "11": "益智玩具,兒童玩具,文具", "12": "兒童用品專區", "13": "臭氧多功能暖烘機", "14": "馬卡龍行動電源 🔋", "15": "活動", "16": "🍒夏日限定西北空運櫻桃", "17": "芝初芝麻粉", "18": "魚油", "19": "仙女霜", "20": "水嫩彈力飲", "21": "青春防曬", "22": "金剛大王白蝦", "23": "八合一磁吸行動電源", "24": "ㄛ MY GOD", "25": "Omilia", "26": "健髮養護精華", "27": "涼感巾", "28": "慧上癮", "29": "超冰風扇", "30": "兒童三合一洗髮沐浴露", "31": "台灣製 七星級飯店可水洗抗菌枕", "32": "加大款反向環扣自動傘", "33": "洗衣球", "34": "24HRS一秒冰冰衣", "35": "票券", "36": "Snug系列", "37": "蒟蒻凍", "38": "精油沐浴", "39": "身體想偷偷告訴你的事", "40": "合作", "41": "知覺優格", "42": "[吳寶春] 無嫌鳳梨酥12入禮盒", "43": "藍海饌牛肉麵", "44": "韓國爆紅 THE COFFEE BEAN 經典美式無糖咖啡糖 32g/盒", "45": "日不落內衣", "46": "卓蘭寶島甘露梨 小阿姨自己種的30A", "47": "紅豆食府 I 原味蛋捲人氣箱購組", "48": "平安芙蓉艾草沐浴包30入", "49": "德國Moskinto蚊蟲叮咬舒緩膚色貼片 -24片裝", "50": "Bravity 深層水光面膜", "51": "復古迷你鑰匙圈翻蓋相機", "52": "大漢酵素有機燉木耳醱酵飲 (24入/箱)", "53": "林銀杏 經典杏仁粉", "54": "【所長】茶葉蛋多口味任選5包組(免運)", "55": "補貨專屬組合｜捲麵18碗｜不辣組", "56": "寶盒系列任選(500g/盒)【預購】7個工作天出貨", "57": "HAWN’S BAKERY I芒果乳酪寶盒", "58": "小潘鳳凰酥裸裝禮盒版", "59": "🥚好愛雞｜白殼初生卵60顆", "60": "低噪音大風量負離子吹風機 玫瑰金", "61": "《CHEERS 生日心願箱》舉杯低卡蒟蒻凍", "62": "超方便去漬筆", "63": "毛孔清潔款", "64": "Bmxmao｜超輕量折疊高速吹風機", "65": "防水防蟎 銀離子抗菌床包保潔墊", "66": "如你所享藥膳雞湯』大包裝800g", "67": "aibo 行動KTV 單無線麥克風 藍牙音響K歌組", "69": "愛美保養飲", "70": "南僑 益生菌長效抗菌親膚手洗精", "71": "德膳 X CUOCO 鈦晶百味鍋具組(五件組)", "72": "曬後舒緩小綠瓶", "73": "Disney × MINISO《動物方城市》兒童無線對講機組", "74": "PORClean 寶可齡 VSonic™ V601 V幅音波電動牙刷", "75": "舒浮罐｜智能負壓刮痧拔罐器", "76": "火山泥", "77": "SOSO tea", "78": "SOSO coffee", "79": "S 潔膚乳", "80": "電眼翹睫款", "81": "熬夜急救貼", "82": "YSL 恆久完美霧光全黑皮革氣墊粉餅 SPF23/PA++", "83": "三角立體茶包/冷泡茶", "88": "極度朵朵 三層超厚柔抽取式花紋衛生紙120抽72包", "89": "芝初黑芝麻Q潤蛋黃酥x6顆", "90": "可愛連帽毯", "91": "搭電梯模擬玩具認識數字", "92": "商城", "93": "大電動保齡球 室內玩具", "94": "花朵城堡帳篷", "95": "Philips 飛利浦｜抗敏奈米級空氣清淨機(AC0950/80)", "96": "飛利浦旋鈕式海星氣炸鍋3.2L-黑皮小星(NA110/00)", "97": "2026升級款｜智能藍牙體脂計 A3", "98": "打趴市面上的水餃~坤伯傳家餃🥟", "99": "查理布朗烘焙中秋禮盒 3盒 $999", "100": "日本P&G Bold 白麝香＆花香香氛洗衣精", "101": "北投老爺酒店｜泉月・菠蘿映心六入禮盒", "102": "鋼化玻璃超薄藍牙體重計app連線", "103": "加厚 透明書套30入", "104": "德國銀離子防蟎抗菌3D立體舒眠枕", "105": "五合一濃縮4D潔淨洗衣球", "106": "曲線食品", "107": "紐西蘭PS嫩肩牛排10片組(1片-100公克)", "108": "歐舒丹 普羅旺斯童話節慶護手霜限量組合(30ml*4)", "109": "M·A·C 超持妝奢緞氣墊精華 
SPF50+", "110": "德國KNF 全屏滿花不鏽鋼不沾鍋組", "111": "居酒屋級「純肉狂歡組」", "112": "吊掛式旅行盥洗收納包 360度旋轉掛鉤", "113": "Costco Philips Sonicare 飛利浦聲波電動牙刷 2入組", "114": "章魚抗皺生物纖維面膜", "115": "冰淇淋泡芙", "116": "亮眼神器", "117": "質感風衣外套", "118": "日本東京銀座 幹細胞蠶絲蛋白 香氛洗髮精 1000ml", "119": "萬用掃拖組-自動夾布拖把2.0版x1+抹布x4 (加贈兩巾組x1包)", "120": "【SNOOPY史努比系列】超薄科技棉止滑地墊", "121": "爆汁豬肉乾 任選 7 包免運組", "122": "美拉德色系超美的桑蠶絲12件組", "123": "申請 試用包", "124": "美國Disney Zootopia 動物方城3D立體絨毛斜背包", "125": "折疊式競技陀螺盤｜一秒開戰！", "126": "兒童聲光廚房玩具 仿真咖啡機 料理台 感溫變色", "127": "Owala聯名寶可夢系列", "128": "Threads爆紅好穿爆表  MIT台灣製造 牛頭牌土豆一代／鸚鵡螺", "129": "溫感按摩金絲玉梳", "130": "巨無霸白蝦蝦后約18公分共3盒 加碼贈整蝦霸燒賣1盒", "131": "防蟎抗菌100%頂級法國羊毛被", "132": "Truly Soymilk真豆奶", "133": "獨立包裝梅有夾心 500g", "134": "石墨烯可水洗超導被  【送兔毛絨水洗毯】", "135": "能量精油噴霧 中秋優惠組", "136": "兒童蔬菜水果切切樂 43件 組", "137": "PHILIPS飛利浦｜透明款行動電源 DLP5715CM", "138": "X戰鬥陀螺工具箱組", "139": "多功能料理盤 AI-GEH3", "140": "CHEERSJELLY 花漾禮盒 中秋限定口味", "141": "石墨烯德芙絨可水洗冬被 送 石墨烯釋壓枕2顆", "142": "買1送1 升級版石墨烯可水洗冬被 2KG", "143": "韓國 LLOYD 經典鋯石網球手鍊 3mm", "144": "全新陀螺對戰組", "145": "水光小藍瓶", "146": "西藏朝聖系列-岡仁波齊神山隨身祈願掛飾", "147": "莫蘭迪綠鈦3鍋組(28炒鍋+25玉子燒鍋)", "148": "睡美人雲朵枕 買一送一", "149": "燃燒辣椒", "150": "能量Q", "151": "鳳凰A+", "152": "Relax", "153": "熟齡保養配方", "154": "香港明星商品", "155": "加拿大限定 HERSHEY’S KISSES × Pokémon 寶可夢聯名巧克力180g", "156": "閃耀全鑽", "157": "招財戒", "158": "名媛最愛全鑽可調式手鍊", "159": "一直鑽項鍊", "160": "收納架 可移動收納推車", "161": "匹克球木製沙灘球拍套裝", "162": "嬰幼兒汽車方向盤聲光益智遊戲盤", "163": "S 化妝水", "164": "🍁 雙十煥顏・美麗綻放 🍁", "165": "茶來了 黑糖桂圓紅棗薑母茶 買二送一", "166": "DIKE 氣旋超聲波智能除蟎機 HCF310WT", "167": "石墨烯針織水洗雲朵被", "168": "韓國 Biodance 水凝膠面膜 34g × 4片", "169": "招財開運沐浴露", "170": "韓系寶寶絨床墊", "171": "SPAO聯名寶可夢睡衣", "172": "身體乳", "173": "植萃精油沐浴組", "174": "MLB蝴蝶結貓耳帽", "175": "3D水立方石墨烯可水洗冬被", "176": "MLB現貨", "177": "舒柔棉素色床包枕套三件組", "178": "美國Owala FreeSip 透明灰 Tritan 水瓶 25oz（740cc)", "179": "鱷魚安全帶枕 護肩枕", "180": "韓國 麝香葡萄🍇", "181": "輕壓機能足弓抗菌除臭襪16雙免運組", "182": "100%純天然乳膠枕 買一送一", "183": "福伯黑松露藜麥奇亞籽蘇打餅乾 320g/4包", "184": "柔膚感抽取式衛生紙-極地冰紛", "185": "即食沙拉舒肥雞胸100g隨手包組", "186": "美國HUNTER 毛帽＋圍巾套組", "187": "CHANEL 香奈兒超炫耀持色唇萃", "188": "PHILIPS 2.0 買大送小優惠組", "189": "絲絨唇膏系列 買一送一", "190": "飛利浦手持式蒸汽掛燙機", "191": "aibo 摺疊式 SPA按摩足浴機/泡腳機", "192": "紅燒羊肉爐 酸菜白肉鍋系列", "193": "小牛皮包扣造型三折短夾", "194": "韓國🇰🇷 牛皮小機車包", "195": "金剛白蝦仁絕無膨發 21/25 450G(共2包)"};
function queenaShareId_(raw) {
  try {
    const u = new URL(String(raw || ''));
    if (!/^(?:www\.)?queena\.tw$/.test(u.hostname)) return '';
    const m = u.pathname.match(/^\/p\/(\d+)\/?$/);
    return m ? m[1] : '';
  } catch (_) { return ''; }
}
function resolveQueenaSharedProduct_(data, id) {
  const list = data && Array.isArray(data.products) ? data.products : [];
  const matches = list.filter(p => queenaShareId_(p.shareUrl) === String(id));
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) return null;
  const name = QUEENA_LEGACY_SHARE_NAMES[String(id)];
  if (!name) return null;
  const byName = list.filter(p => String(p.name || '').trim() === name);
  return byName.length === 1 ? byName[0] : null;
}
function injectQueenaShareTarget_(html, name) {
  // 在前端程式執行前指定正確商品名稱；保留原本網址及查詢參數。
  const safeName = JSON.stringify(String(name)).replace(/</g, '\\u003c');
  const script = '<script id="queenaStableShareTarget">window.__queenaResolvedShareName=' + safeName + ';</script>';
  return html.replace(/<head(?:\s[^>]*)?>/i, tag => tag + script);
}


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
    let product = resolveQueenaSharedProduct_(productData, productRow);

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

          product = resolveQueenaSharedProduct_(freshData, productRow);
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

    html = injectQueenaShareTarget_(html, product.name);

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
        String(productRow)
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

  if (action === 'checkout') {
    body.set('checkoutJson',JSON.stringify(payload));
  } else if (action === 'wishlist') {

    body.set('requestId', String(payload.requestId || ''));
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

      // 舊商品網址轉至品牌網域；API 與 OAuth 回傳仍留在原處處理。
      if ((request.method === 'GET' || request.method === 'HEAD') &&
          (url.hostname === 'queena-cart.pages.dev' || url.hostname === 'www.queena.tw') &&
          url.pathname !== '/api' && !url.pathname.startsWith('/api/') &&
          url.pathname !== '/auth/callback') {
        const destination = new URL(url.toString());
        destination.protocol = 'https:';
        destination.host = 'queena.tw';
        return new Response(null, {
          status: 302,
          headers: {location: destination.toString(), 'cache-control': 'no-store'}
        });
      }

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
