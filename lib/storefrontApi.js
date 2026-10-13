// lib/storefrontApi.js
// Route: n/a. Tiny fetch wrapper for storefront JSON APIs.
export async function api(url, { method = "GET", body } = {}) {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    return {
      ok: res.ok,
      status: res.status,
      data: json.data ?? null,
      message: json.message || (res.ok ? "" : "Something went wrong"),
      code: json.code,
    };
  } catch {
    return { ok: false, status: 0, data: null, message: "Network error. Please try again." };
  }
}