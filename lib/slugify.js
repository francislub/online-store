// lib/slugify.js
// Route: n/a. Turns a product name into a URL slug: "HP ProBook 450 G9" -> "hp-probook-450-g9"
export function slugify(input = "") {
  return String(input)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const productHref = (p) => `/product/${p.slug || slugify(p.name)}`;