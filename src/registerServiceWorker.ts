import { registerSW } from "virtual:pwa-register";

const HOUR_MS = 60 * 60 * 1000;

/**
 * Registers the service worker and actively checks for a new build — on an
 * interval and, crucially, whenever the app is foregrounded or focused.
 *
 * The foreground check is what makes updates work on iOS: launching an installed
 * PWA there usually *resumes* it without a fresh navigation, so the browser's own
 * update check never fires. Calling `registration.update()` on visibilitychange
 * forces it. With `registerType: "autoUpdate"`, a found update activates and
 * reloads the page automatically.
 */
export function registerServiceWorker() {
  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      const checkForUpdate = () => {
        registration.update().catch(() => {
          /* offline or transient — it'll try again on the next trigger */
        });
      };

      setInterval(checkForUpdate, HOUR_MS);
      window.addEventListener("focus", checkForUpdate);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") checkForUpdate();
      });
    },
  });
}
