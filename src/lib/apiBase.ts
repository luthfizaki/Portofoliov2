export function assetUrl(value?: string) {
  if (!value) return "";
  if (/^(https?:|data:|blob:)/.test(value)) return value;
  return value.startsWith("/") ? value : `/${value}`;
}

const configuredPublicApiUrl = import.meta.env.VITE_API_URL?.trim();

export const publicApiUrl = configuredPublicApiUrl
  ? configuredPublicApiUrl.replace(/\/+$/, "")
  : "http://127.0.0.1:4000";
