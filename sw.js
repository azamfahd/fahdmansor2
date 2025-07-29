/**
 * Service Worker لموقع مؤسسة ركن النحت
 *
 * الغرض: تحسين الأداء والعمل دون اتصال بالإنترنت
 *
 * الوظائف:
 * - تخزين الملفات المهمة في الذاكرة المؤقتة (Cache)
 * - تقديم المحتوى من الذاكرة المؤقتة عند عدم توفر الإنترنت
 * - تحديث الذاكرة المؤقتة تلقائياً
 * - دعم الإشعارات (مستقبلياً)
 * - مزامنة البيانات في الخلفية
 *
 * ملاحظة: يتم تسجيل هذا الملف تلقائياً في index.html
 */

const CACHE_NAME = "sculpture-site-v1"; // اسم الذاكرة المؤقتة
const urlsToCache = [
  // قائمة الملفات المراد تخزينها
  "/",
  "/index.html",
  "/index.css",
  "/manifest.json",
  "https://cdn.tailwindcss.com",
  "https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap",
  "https://unpkg.com/react@18/umd/react.development.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.development.js",
  "https://unpkg.com/@babel/standalone/babel.min.js",
  "/assets/site/profile.jpg",
];

// حدث التثبيت - تخزين الموارد في الذاكرة المؤقتة
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("تم فتح الذاكرة المؤقتة");
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      if (response) {
        return response;
      }

      // Clone the request because it's a stream
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest)
        .then((response) => {
          // Check if we received a valid response
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Clone the response because it's a stream
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Return offline page or cached content
          if (event.request.destination === "document") {
            return caches.match("/");
          }
        });
    })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(
      // Handle background sync tasks
      console.log("Background sync triggered")
    );
  }
});

// Push notifications (if needed in the future)
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "إشعار جديد من مؤسسة ركن النحت",
    icon: "/assets/site/profile.jpg",
    badge: "/assets/site/profile.jpg",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "استكشاف",
        icon: "/assets/site/profile.jpg",
      },
      {
        action: "close",
        title: "إغلاق",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification("مؤسسة ركن النحت", options)
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"));
  }
});
