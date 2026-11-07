
const configuredApiUrl = String(
  import.meta.env.VITE_API_URL || "/api"
).trim();

const normalizedApiUrl = configuredApiUrl.replace(/\/+$/, "");

export const API_URL = normalizedApiUrl;

export const API_ORIGIN = /^https?:\/\//i.test(API_URL)
  ? API_URL.replace(/\/api$/i, "")
  : "";
