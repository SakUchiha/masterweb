/**
 * Service Worker for KidLearner PWA
 * Implements advanced caching strategies for optimal performance
 */

// Add timestamp to cache version to ensure updates are detected
// Use a fixed version for the cache name to force updates when needed
const CACHE_VERSION = "v1.0.4";
const CACHE_NAME = `kidlearner-${CACHE_VERSION}`;
const STATIC_CACHE = "kidlearner-static-" + CACHE_VERSION;
const DYNAMIC_CACHE = "kidlearner-dynamic-" + CACHE_VERSION;
const API_CACHE = "kidlearner-api-" + CACHE_VERSION;

// Resources to cache immediately
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/lessons.html",
  "/editor.html",
  "/ai.html",
  "/ask-ai.html",
  "/study-guide.html",
  "/lesson-viewer.html",
  "/contact.html",
  "/code-explainer.html",
  "/manifest.json",
  "/css/styles.css",
  "/css/ai-styles.css",
  "/js/config.js",
  "/js/api.js",
  "/js/ui.js",
  "/js/app.js",
  "/js/navigation.js",
  "/js/ai.js",
  "/js/ai-chat-only.js",
  "/js/ai-explainer-only.js",
  "/js/syntax-checker.js",
  "/js/error-handler.js",
  "/js/theme.js",
  "/js/error-boundary.js",
  "/js/achievement-system.js",
  "/js/gamification.js",
  "/js/progress-tracker.js",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css",
  "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap",
];

// API endpoints to cache
const API_ENDPOINTS = ["/api/lessons", "/api/groq/health", "/api/groq"];

// Install event - cache static assets and force activation
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activation of new service worker
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(STATIC_ASSETS);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== API_CACHE) {
            console.log('[Service Worker] Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all clients
  event.waitUntil(clients.claim());
});
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker");
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Clear all old caches that don't match our current version
            if (!cacheName.includes(CACHE_VERSION)) {
              console.log("[SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("[SW] Claiming all clients");
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Default strategy for other requests
  event.respondWith(
    caches.match(request).then((response) => {
      return (
        response ||
        safeFetch(request).then((fetchResponse) => {
          // Cache dynamic content
          if (fetchResponse && fetchResponse.ok) {
            const responseClone = fetchResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return fetchResponse;
        })
      );
    })
  );
});

/**
 * Helper safe fetch that falls back to cache on network errors.
 * This prevents unhandled promise rejections in the service worker when
 * external resources (or offline) cause fetch() to fail.
 */
function safeFetch(request) {
  return fetch(request).catch(() => caches.match(request));
}

/**
 * Handle API requests with stale-while-revalidate strategy
 */
function handleApiRequest(request) {
  // For non-GET/HEAD requests, bypass cache and service worker
  if (request.method !== "GET" && request.method !== "HEAD") {
    return Promise.resolve(fetch(request));
  }

  // For GET/HEAD requests, use stale-while-revalidate strategy
  return caches.open(API_CACHE).then((cache) => {
    return cache.match(request).then((cachedResponse) => {
      const fetchPromise = safeFetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      });

      // Return cached version immediately if available, then update in background
      return cachedResponse || fetchPromise;
    });
  });
}

/**
 * Handle static assets with cache-first strategy
 */
function handleStaticRequest(request) {
  return safeFetch(request)
    .then((networkResponse) => {
      // Cache successful responses
      if (networkResponse && networkResponse.ok) {
        const responseClone = networkResponse.clone();
        caches.open(STATIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
      }
      return networkResponse;
    })
    .catch(() => {
      // Fallback to cache if network fails
      return caches.match(request);
    });
}

/**
 * Handle navigation requests
 */
function handleNavigationRequest(request) {
  return caches.match(request).then((response) => {
    if (response) {
      return response;
    }

    return safeFetch(request)
      .then((fetchResponse) => {
        // Cache navigation responses
        if (fetchResponse && fetchResponse.ok) {
          const responseClone = fetchResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return fetchResponse;
      })
      .catch(() => {
        // Fallback to offline page if available
        return caches.match("/index.html");
      });
  });
}

/**
 * Check if request is for a static asset
 */
function isStaticAsset(request) {
  const url = new URL(request.url);
  const staticExtensions = [
    ".css",
    ".js",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
  ];
  return (
    staticExtensions.some((ext) => url.pathname.endsWith(ext)) ||
    url.hostname === "cdnjs.cloudflare.com" ||
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  );
}

// Background sync for failed requests
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Implement background sync logic here
  console.log("[SW] Performing background sync");
}

// Push notifications (for future use)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey,
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || "/"));
});

// Periodic cache cleanup
self.addEventListener("message", (event) => {
  if (!event.data) return;
  if (event.data.type === "CLEAN_CACHE") {
    cleanOldCache();
  } else if (event.data.type === "FORCE_UPDATE") {
    // Force update by clearing all caches and reloading
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName))
          );
        })
        .then(() => {
          return self.registration.update();
        })
    );
  } else if (event.data.type === "SKIP_WAITING") {
    // Immediately activate this service worker
    self.skipWaiting();
  }
});

function cleanOldCache() {
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  caches.open(DYNAMIC_CACHE).then((cache) => {
    cache.keys().then((requests) => {
      requests.forEach((request) => {
        // This is a simplified cleanup - in production you'd check response headers
        // For now, we'll just keep the cache as is
      });
    });
  });
}

// Performance monitoring
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "PERFORMANCE_DATA") {
    // Store performance data for analysis
    console.log("[SW] Performance data received:", event.data.data);
  }
});
