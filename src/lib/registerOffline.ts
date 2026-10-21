import { canRegisterOffline } from "./offline";

// The only app-shell service-worker registrar. Never cache the editor preview.
export async function registerOffline(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const allowed = canRegisterOffline({
    production: import.meta.env.PROD,
    framed: window.self !== window.top,
    hostname: window.location.hostname,
    search: window.location.search,
  });
  try {
    if (!allowed) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.filter((registration) =>
        [registration.active, registration.waiting, registration.installing].some((worker) =>
          worker && new URL(worker.scriptURL).origin === window.location.origin &&
          new URL(worker.scriptURL).pathname === "/sw.js"
        )
      ).map((registration) => registration.unregister()));
      return;
    }
    const { registerSW } = await import("virtual:pwa-register");
    registerSW({ onRegisterError: (error) => console.warn("Offline setup unavailable.", error) });
  } catch (error) {
    console.warn("Offline setup unavailable.", error);
  }
}