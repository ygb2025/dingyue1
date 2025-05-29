// 订阅管理应用 Service Worker

// 缓存名称和版本
const CACHE_NAME = 'subscription-manager-cache-v1';

// 需要缓存的核心文件
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './offline.html',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png'
];

// Service Worker 安装事件
self.addEventListener('install', event => {
  console.log('[Service Worker] 安装中...');

  // 等待缓存完成
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] 缓存核心应用文件');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        // 跳过等待，立即激活
        return self.skipWaiting();
      })
  );
});

// Service Worker 激活事件
self.addEventListener('activate', event => {
  console.log('[Service Worker] 激活中...');

  // 清理旧缓存
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 立即接管所有客户端
      return self.clients.claim();
    })
  );
});

// 网络请求拦截
self.addEventListener('fetch', event => {
  // 只处理GET请求
  if (event.request.method !== 'GET') return;

  // 排除第三方请求
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin &&
      !event.request.url.includes('google.com/s2/favicons') &&
      !event.request.url.includes('ui-avatars.com')) {
    return;
  }

  // 网络优先策略，适用于API请求
  if (event.request.url.includes('exchangerate-api.com')) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }

  // 缓存优先策略，适用于静态资源
  event.respondWith(cacheFirstStrategy(event.request));
});

// 缓存优先策略
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    // 只缓存成功的响应
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] 获取资源失败:', error);

    // 对于图标请求，返回一个默认图标
    if (request.url.includes('/favicon') || request.url.includes('icon')) {
      return caches.match('./icons/icon-72x72.png');
    }

    // 返回离线页面
    if (request.mode === 'navigate') {
      return caches.match('./offline.html');
    }

    // 返回错误提示
    return new Response('网络请求失败，请检查您的网络连接。', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// 网络优先策略
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);

    // 缓存响应
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());

    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] 网络请求失败，使用缓存:', error);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // 如果没有缓存，返回一个错误响应
    return new Response(JSON.stringify({
      error: true,
      message: '无法连接到服务器，请检查您的网络连接。'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 后台同步
self.addEventListener('sync', event => {
  if (event.tag === 'sync-subscriptions') {
    event.waitUntil(syncSubscriptions());
  }
});

// 同步订阅数据
async function syncSubscriptions() {
  // 这里可以实现数据同步逻辑
  console.log('[Service Worker] 同步订阅数据');
}

// 推送通知
self.addEventListener('push', event => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body || '您有新的订阅提醒',
      icon: data.icon || './icons/icon-192x192.png',
      badge: './icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || './'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title || '订阅管理提醒', options)
    );
  } catch (error) {
    console.error('[Service Worker] 处理推送通知时出错:', error);
  }
});

// 通知点击
self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // 如果已经有打开的窗口，则聚焦到该窗口
      for (const client of clientList) {
        // 检查URL是否匹配当前部署路径
        if ((client.url.endsWith('/') || client.url.endsWith('/index.html')) && 'focus' in client) {
          return client.focus();
        }
      }

      // 否则打开新窗口
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url || './');
      }
    })
  );
});
