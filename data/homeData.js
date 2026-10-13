// src/data/homeData.js
// All images live in:  public/images/products/   ->  served at  /images/products/<file>
// Swap these arrays for API / database data later; the component shape stays the same.

const IMAGE_BASE = "/images";

/** Build a public image URL. Pass ONLY the file name, e.g. img("speaker.svg"). */
export const img = (name) => `${IMAGE_BASE}/${name}`;

/** Used automatically by <SafeImage /> if an image fails to load. */
export const FALLBACK_IMAGE = img("placeholder.svg");

export const bluetooth = {
  title: "Bluetooth speakers",
  subtitle: "Your music, your freedom. Explore portable Bluetooth speakers.",
  image: img("speaker.png"),
  chips: [
    { label: "PARTY", href: "/category", icon: "party" },
    { label: "IN DOOR", href: "/category", icon: "indoor" },
    { label: "OUT DOOR", href: "/category", icon: "outdoor" },
    { label: "MINI", href: "/category", icon: "mini" },
  ],
  tiles: [
    { title: "Bluetooth", subtitle: "HeadPhones", image: img("spa.png"), href: "/category" },
    { title: "Bluetooth", subtitle: "EarPhones", image: img("spaa.png"), href: "/category" },
    { title: "Audio", subtitle: "Accessories", image: img("spak.png"), href: "/category" },
  ],
};