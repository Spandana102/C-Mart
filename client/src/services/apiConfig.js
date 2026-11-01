const configuredApiUrl = String(
  import.meta.env.VITE_API_URL || "/api"
).trim();

export const API_URL = configuredApiUrl.replace(/\/+$/, "");
export const API_ORIGIN = /^https?:\/\//i.test(API_URL)
  ? API_URL.replace(/\/api$/i, "")
  : "";
