/**
 * Registration lives in its own deployment (hackuta-2026-registration).
 * prod: https://register.hackuta.com   dev: http://localhost:5273
 */
export const REGISTER_URL =
  import.meta.env.VITE_REGISTER_URL?.trim() || "https://register.hackuta.com";
