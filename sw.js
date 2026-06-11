/* ══════════════════════════════════════
   حصني — Service Worker
   Prayer Notifications
══════════════════════════════════════ */

const SW_VERSION = "hasni-sw-v1";

// ── Install & Activate ──────────────────
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil(self.clients.claim());
});

// ── Message from main page ──────────────
// Receives: { type: "SCHEDULE_PRAYERS", prayers: [{key, ar, time: "HH:MM"}, ...] }
self.addEventListener("message", e => {
  console.log("[SW] message received:", e.data && e.data.type);
  if (e.data && e.data.type === "SCHEDULE_PRAYERS") {
    console.log("[SW] scheduling prayers, sendBefore:", e.data.sendBefore, "sendAt:", e.data.sendAt);
    console.log("[SW] prayers:", JSON.stringify(e.data.prayers));
    schedulePrayers(e.data.prayers, e.data.sendBefore, e.data.sendAt);
  }
  if (e.data && e.data.type === "CANCEL_PRAYERS") {
    cancelAll();
  }
});

// ── Timer storage ───────────────────────
let prayerTimers = [];

function cancelAll() {
  prayerTimers.forEach(t => clearTimeout(t));
  prayerTimers = [];
}

function schedulePrayers(prayers, sendBefore, sendAt) {
  cancelAll();

  const now = Date.now();
  const todayBase = new Date();
  todayBase.setHours(0, 0, 0, 0);

  prayers.forEach(p => {
    const [hh, mm] = p.time.split(":").map(Number);
    const prayerMs = todayBase.getTime() + hh * 3600000 + mm * 60000;
    console.log("[SW] prayer:", p.ar, "time:", p.time, "diff:", Math.round((prayerMs - now)/1000), "sec");

    if (sendAt) {
      const diffAt = prayerMs - now;
      console.log("[SW] scheduling AT notification in", Math.round(diffAt/1000), "sec");
      if (diffAt > 0) {
        prayerTimers.push(setTimeout(() => {
          console.log("[SW] firing notification for", p.ar);
          self.registration.showNotification("حصني 🕌", {
            body: `حان وقت صلاة ${p.ar}`,
            icon: "/prayer-times/icon-192.png",
            tag: `at-${p.key}`,
            renotify: true,
            silent: false,
            dir: "rtl",
            lang: "ar"
          });
        }, diffAt));
      }
    }

    if (sendBefore) {
      const tenBeforeMs = prayerMs - 10 * 60 * 1000;
      const diffTen = tenBeforeMs - now;
      if (diffTen > 0) {
        prayerTimers.push(setTimeout(() => {
          self.registration.showNotification("حصني 🕌", {
            body: `بعد ١٠ دقائق — صلاة ${p.ar}`,
            icon: "/prayer-times/icon-192.png",
            tag: `before-${p.key}`,
            renotify: true,
            silent: false,
            dir: "rtl",
            lang: "ar"
          });
        }, diffTen));
      }
    }
  });
}

// ── Notification click → open app ──────
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow("/prayer-times/");
    })
  );
});
