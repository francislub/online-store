// src/lib/siteConfig.js
// Single source of truth for the storefront. Edit text, links and images here.

export const SITE = {
  name: "Green Planet Computers",
  shortName: "GREEN PLANET",
  logo: "/images/logo.jpeg",
  dealers: "Dealers in: Sales, Repair & Maintenance of Laptops, Computer & Accessories",
  tagline: "Sales, Repair & Maintenance of Laptops, Computers & Accessories",
  phones: [
    { label: "0789 033 647", href: "tel:+256789033647" },
    { label: "0701 055 646", href: "tel:+256701055646" },
  ],
  location: "Kampala Plaza, next to E-Tower, Kampala Road",
  shop: "Shop No. B8",
  address: "Shop No. B8, Kampala Plaza, next to E-Tower, Kampala Road, Kampala, Uganda",
  freeDeliveryMin: "USh 500,000",
  legal:
    "All brand names, logos, and trademarks are the property of their respective owners. Green Planet Computers is an independent retailer selling genuine products from multiple brands.",
  socials: [
    { label: "Facebook", href: "https://facebook.com", key: "facebook" },
    { label: "Instagram", href: "https://instagram.com", key: "instagram" },
    { label: "TikTok", href: "https://tiktok.com", key: "tiktok" },
  ],
  payments: ["Cash on Delivery", "MTN Mobile Money", "Airtel Money", "Bank Transfer"],
  seo: [
    "At Green Planet Computers, we bring you the latest technology from trusted brands at unbeatable prices, making it easy to stay connected, work smarter, and enjoy entertainment on the go.",
    "Whether you’re upgrading your home laptop, looking for a high-performance gaming setup, shopping for a reliable smartphone, or exploring essential tech accessories, Green Planet Computers has everything you need in one place. We also offer professional repair and maintenance for laptops and computers.",
    "Find us at Kampala Plaza, next to E-Tower on Kampala Road, with genuine products and warranty-backed service.",
  ],
};

// icon = key resolved in SideRail.jsx
export const CATEGORIES = [
  { slug: "all-products", label: "All Products", icon: "bag", href: "/products" },
  {
    slug: "electronics", label: "Electronics", icon: "box",
    children: ["Televisions", "Home Theatre", "Projectors", "Power & UPS"],
  },
  {
    slug: "accessories", label: "Accessories", icon: "chip",
    children: ["Cables & Adapters", "Chargers", "Power Banks", "Storage & Memory"],
  },
  {
    slug: "laptops-desktops", label: "Laptops & Desktops", icon: "laptop",
    children: ["Laptops", "Desktops", "All-in-One PCs", "MacBooks", "Gaming Laptops"],
  },
  {
    slug: "smartphones-tablets", label: "Smartphones & Tablets", icon: "phone",
    children: ["Smartphones", "Tablets", "iPhones", "Samsung Galaxy", "Feature Phones"],
  },
  {
    slug: "smartphone-accessories", label: "Smartphone Accessories", icon: "case",
    children: ["Cases & Covers", "Screen Protectors", "Phone Chargers", "Power Banks"],
  },
  {
    slug: "computer-accessories", label: "Computer Accessories", icon: "layers",
    children: ["Keyboards & Mice", "USB Hubs & Docks", "Webcams", "Laptop Bags", "Cooling Pads"],
  },
  {
    slug: "games-entertainment", label: "Games & Entertainment", icon: "gamepad",
    children: ["Gaming Consoles", "Video Games", "Gaming Accessories", "Gaming Laptops", "Gaming PCs"],
    promo: {
      tag: "On Sale",
      title: "PS5 Complete Set",
      cta: "To Shop",
      href: "/category/gaming-consoles",
      image: "/images/promo/ps5.png",
    },
  },
  {
    slug: "smart-watches", label: "Smart Watches", icon: "watch",
    children: ["Apple Watch", "Samsung Watch", "Fitness Bands", "Straps"],
  },
  {
    slug: "audio-sound", label: "Audio & Sound", icon: "headphones",
    children: ["Headphones", "Earbuds", "Bluetooth Speakers", "Soundbars", "Microphones"],
  },
  {
    slug: "cameras-accessories", label: "Cameras & Accessories", icon: "camera",
    children: ["Cameras", "Action Cameras", "Tripods", "Memory Cards"],
  },
  {
    slug: "office-electronics", label: "Office Electronics", icon: "printer",
    children: ["Printers", "Scanners", "Ink & Toner", "Shredders"],
  },
  {
    slug: "monitors", label: "Monitors", icon: "monitor",
    children: ["Gaming Monitors", "Office Monitors", "Curved Monitors", "Monitor Stands"],
  },
];

export const slugify = (s) =>
  s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Header navigation. `menu: "mega"` opens the image-card panel, `list` opens a simple dropdown.
export const NAV = [
  { label: "Popular Categories", menu: "mega" },
  { label: "Smartphones", menu: "list", href: "/category/smartphones",
    items: ["iPhones", "Samsung Galaxy", "Google Pixel", "Tecno & Infinix", "Tablets"] },
  { label: "Laptops & Desktops", menu: "list", href: "/category/laptops-desktops",
    items: ["MacBooks", "HP", "Dell", "Lenovo", "Gaming Laptops", "Desktops"] },
  { label: "Accessories", menu: "list", href: "/category/accessories",
    items: ["Chargers", "Power Banks", "Cables & Adapters", "Keyboards & Mice", "Laptop Bags"] },
  { label: "Contact Us", href: "/contact" },
  { label: "About Us", href: "/about" },
];

export const MEGA_CARDS = [
  { label: "Computers", href: "/category/laptops-desktops", image: "/images/mega/computers.jpg" },
  { label: "Smartphones", href: "/category/smartphones", image: "/images/mega/smartphones.jpg" },
  { label: "Accessories", href: "/category/accessories", image: "/images/mega/accessories.jpg" },
];

export const HERO_SLIDES = [
  {
    title: "EXPLORE LAPTOPS",
    subtitle: "Shop Great Deals on Macbooks, HP, Dell And More",
    cta: "Shop Now",
    href: "/category/laptops-desktops",
    image: "/images/hero/laptops.jpg",
  },
  {
    title: "LATEST SMARTPHONES",
    subtitle: "iPhone, Samsung & Pixel — genuine, with warranty",
    cta: "Shop Now",
    href: "/category/smartphones",
    image: "/images/hero/smartphones.jpg",
  },
  {
    title: "POWER YOUR DAY",
    subtitle: "Fast chargers and power banks from Anker and more",
    cta: "Shop Now",
    href: "/category/accessories",
    image: "/images/hero/accessories.jpg",
  },
];

export const HERO_BANNERS = {
  top: {
    title: "Computer Accessories",
    cta: "Shop Now",
    href: "/category/computer-accessories",
    image: "/images/hero/computer-accessories.jpg",
  },
  bottom: [
    { title: "Video Games", cta: "View Details", href: "/category/video-games", image: "/images/hero/video-games.jpg", badge: "playstation" },
    { title: "Smartphone Accessories", cta: "View Details", href: "/category/smartphone-accessories", image: "/images/hero/smartphone-accessories.jpg" },
  ],
};

export const FOOTER_LINKS = {
  Categories: [
    ["Smartphones & Tablets", "/category/smartphones-tablets"],
    ["Laptops & Desktops", "/category/laptops-desktops"],
    ["Accessories", "/category/accessories"],
    ["Video Games", "/category/video-games"],
    ["Audio & Sound", "/category/audio-sound"],
  ],
  "Useful Links": [
    ["Blog", "/blog"],
    ["About Us", "/about"],
    ["Contact Us", "/contact"],
    ["Payment Methods", "/payment-methods"],
    ["Frequently Asked Questions", "/faq"],
  ],
  "Store Policy": [
    ["Terms And Conditions", "/terms"],
    ["Warranty Policy", "/warranty-policy"],
    ["Shipping Policy", "/shipping-policy"],
    ["Refund And Return Policy", "/refund-policy"],
    ["Privacy Policy", "/privacy-policy"],
  ],
};