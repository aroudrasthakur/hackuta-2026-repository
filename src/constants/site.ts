/**
 * Registration lives in its own deployment (hackuta-2026-registration).
 * prod: https://register.hackuta.org   dev: https://register-dev.hackuta.org
 */
export const REGISTER_URL =
  import.meta.env.VITE_REGISTER_URL?.trim() || "https://register.hackuta.org";
