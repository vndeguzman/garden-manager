self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(payload.title || "Garden Manager alert", {
      body: payload.body || "A garden issue needs attention.",
      icon: "/garden-icon.svg",
      badge: "/garden-icon.svg",
      data: { url: payload.url || "/" },
      tag: payload.incidentId || "garden-manager-alert",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
});
