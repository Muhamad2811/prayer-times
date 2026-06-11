/* ══════════════════════════════════════
   حصني — Service Worker
══════════════════════════════════════ */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil(self.clients.claim());
});

// الـ main page بتبعت "NOTIFY_NOW" لما يحين الوقت
self.addEventListener("message", e => {
  if (e.data && e.data.type === "NOTIFY_NOW") {
    self.registration.showNotification("حصني 🕌", {
      body: e.data.body,
      icon: "/prayer-times/icon-192.png",
      tag: e.data.tag,
      renotify: true,
      silent: false,
      dir: "rtl",
      lang: "ar"
    });
  }
});

// لما اليوزر يضغط على الإشعار يفتح الموقع
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow("/prayer-times/");
    })
  );
});
