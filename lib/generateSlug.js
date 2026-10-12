// lib/generateSlug.js
// Route: n/a (helper used by /dashboard/categories/new and /dashboard/categories/update/[id])
export function generateSlug(title = "") {
  return title
    .toLowerCase() // lowercase
    .trim()
    .replace(/\s+/g, "-") // spaces -> dashes
    .replace(/[^\w\-]+/g, "") // remove non-word characters except dashes
    .replace(/\-\-+/g, "-") // collapse multiple dashes
    .replace(/^\-+/, "") // trim leading dashes
    .replace(/\-+$/, ""); // trim trailing dashes
}