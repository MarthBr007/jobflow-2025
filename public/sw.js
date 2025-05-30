const CACHE_NAME = 'jobflow-v1.0.0';
const API_CACHE_NAME = 'jobflow-api-v1.0.0';

// Assets to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/dashboard/time-tracking',
  '/dashboard/projects',
  '/dashboard/chat',
  '/dashboard/notifications',
  '/login',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/user/profile',
  '/api/projects',
  '/api/time-entries',
  '/api/notifications',
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then((cache) => {
        console.log('📦 Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Cache API endpoints
      caches.open(API_CACHE_NAME).then((cache) => {
        console.log('🌐 Pre-caching API endpoints...');
        return Promise.all(
          API_ENDPOINTS.map(url => 
            fetch(url).then(response => {
              if (response.ok) {
                return cache.put(url, response);
              }
            }).catch(() => {
              // Silently fail for API pre-caching
              console.warn(`Failed to pre-cache ${url}`);
            })
          )
        );
      })
    ]).then(() => {
      console.log('✅ Service Worker installed successfully');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker activated successfully');
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip chrome-extension and non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Handle different types of requests
  if (request.url.includes('/api/')) {
    // API requests - Network First with Cache Fallback
    event.respondWith(handleApiRequest(request));
  } else if (request.destination === 'image') {
    // Images - Cache First with Network Fallback
    event.respondWith(handleImageRequest(request));
  } else {
    // Static assets - Stale While Revalidate
    event.respondWith(handleStaticRequest(request));
  }
});

// Network First strategy for API requests
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    } else {
      // Network error, try cache
      return getCachedResponse(request, API_CACHE_NAME);
    }
  } catch (error) {
    console.log('📶 Network failed, trying cache for:', request.url);
    return getCachedResponse(request, API_CACHE_NAME);
  }
}

// Cache First strategy for images
async function handleImageRequest(request) {
  try {
    // Try cache first
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Failed to fetch image:', request.url, error);
    // Return placeholder or fallback image
    return new Response('', { status: 404 });
  }
}

// Stale While Revalidate for static assets
async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Always try to update cache in background
    const fetchPromise = fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }).catch(() => {
      // Silently fail background updates
    });
    
    // Return cached version immediately if available
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Otherwise wait for network
    return await fetchPromise;
  } catch (error) {
    console.error('Failed to handle static request:', request.url, error);
    return getCachedResponse(request, CACHE_NAME);
  }
}

// Helper function to get cached response
async function getCachedResponse(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return cache.match('/offline') || new Response(
        '<html><body><h1>Offline</h1><p>Check your internet connection.</p></body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      );
    }
    
    return new Response('Offline', { status: 503 });
  } catch (error) {
    return new Response('Cache Error', { status: 503 });
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('📨 Push notification received');
  
  if (!event.data) {
    return;
  }
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/badge.png',
      data: data.data || {},
      actions: data.actions || [
        {
          action: 'open',
          title: 'Open JobFlow'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ],
      requireInteraction: data.data?.priority === 'urgent',
      silent: data.data?.priority === 'low',
      tag: data.data?.type || 'general',
      renotify: true,
      timestamp: Date.now(),
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('Error handling push notification:', error);
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'dismiss') {
    return;
  }
  
  // Determine URL based on notification type
  let url = '/dashboard';
  if (data?.type === 'CHAT_MESSAGE' && data?.roomId) {
    url = `/dashboard/chat?room=${data.roomId}`;
  } else if (data?.type === 'TIME_TRACKING') {
    url = '/dashboard/time-tracking';
  } else if (data?.type === 'PROJECT_UPDATE' && data?.projectId) {
    url = `/dashboard/projects/${data.projectId}`;
  } else if (data?.type === 'NOTIFICATION') {
    url = '/dashboard/notifications';
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if JobFlow is already open
      for (const client of clientList) {
        if (client.url.includes('jobflow') && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: data,
            url: url
          });
          return client.focus();
        }
      }
      
      // Open new window if not already open
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'time-tracking-sync') {
    event.waitUntil(syncTimeEntries());
  } else if (event.tag === 'notification-sync') {
    event.waitUntil(syncNotifications());
  } else if (event.tag === 'chat-sync') {
    event.waitUntil(syncChatMessages());
  }
});

// Sync offline time entries
async function syncTimeEntries() {
  try {
    const offlineEntries = await getOfflineData('time-entries');
    
    if (offlineEntries.length === 0) {
      return;
    }
    
    console.log(`📊 Syncing ${offlineEntries.length} offline time entries...`);
    
    for (const entry of offlineEntries) {
      try {
        const response = await fetch('/api/time-tracking/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        });
        
        if (response.ok) {
          await removeOfflineData('time-entries', entry.id);
          console.log('✅ Time entry synced:', entry.id);
        }
      } catch (error) {
        console.error('❌ Failed to sync time entry:', entry.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Sync offline notifications
async function syncNotifications() {
  try {
    const unreadNotifications = await getOfflineData('notifications');
    
    for (const notification of unreadNotifications) {
      try {
        await fetch(`/api/notifications/${notification.id}/read`, {
          method: 'PUT'
        });
      } catch (error) {
        console.error('Failed to sync notification read status:', error);
      }
    }
  } catch (error) {
    console.error('Notification sync failed:', error);
  }
}

// Sync offline chat messages
async function syncChatMessages() {
  try {
    const offlineMessages = await getOfflineData('chat-messages');
    
    for (const message of offlineMessages) {
      try {
        const response = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });
        
        if (response.ok) {
          await removeOfflineData('chat-messages', message.id);
        }
      } catch (error) {
        console.error('Failed to sync chat message:', error);
      }
    }
  } catch (error) {
    console.error('Chat sync failed:', error);
  }
}

// Helper functions for offline data management
async function getOfflineData(type) {
  try {
    const cache = await caches.open('offline-data');
    const response = await cache.match(`/offline-data/${type}`);
    
    if (response) {
      return await response.json();
    }
    
    return [];
  } catch (error) {
    console.error('Failed to get offline data:', error);
    return [];
  }
}

async function removeOfflineData(type, id) {
  try {
    const cache = await caches.open('offline-data');
    const data = await getOfflineData(type);
    const filteredData = data.filter(item => item.id !== id);
    
    await cache.put(
      `/offline-data/${type}`,
      new Response(JSON.stringify(filteredData))
    );
  } catch (error) {
    console.error('Failed to remove offline data:', error);
  }
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (type === 'CACHE_API_RESPONSE') {
    cacheApiResponse(data.url, data.response);
  } else if (type === 'STORE_OFFLINE_DATA') {
    storeOfflineData(data.type, data.payload);
  }
});

// Store data for offline sync
async function storeOfflineData(type, payload) {
  try {
    const cache = await caches.open('offline-data');
    const existingData = await getOfflineData(type);
    const newData = [...existingData, payload];
    
    await cache.put(
      `/offline-data/${type}`,
      new Response(JSON.stringify(newData))
    );
    
    console.log(`💾 Stored offline data: ${type}`, payload.id);
  } catch (error) {
    console.error('Failed to store offline data:', error);
  }
}

// Cache API response
async function cacheApiResponse(url, response) {
  try {
    const cache = await caches.open(API_CACHE_NAME);
    await cache.put(url, new Response(JSON.stringify(response)));
  } catch (error) {
    console.error('Failed to cache API response:', error);
  }
}

console.log('🚀 JobFlow Service Worker loaded'); 