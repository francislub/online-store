// src/data/homeData.js
// Replace the image paths with your real product images (public/ folder or CDN URLs).
// Later you can swap these arrays for data fetched from your API / database.

const img = (name) => `/images/products/${name}`;

export const categories = [
  { id: "office", name: "Office Accessories", count: 78, image: img("cat-office.png"), href: "/category/office-accessories" },
  { id: "monitors", name: "Monitors", count: 40, image: img("cat-monitors.png"), href: "/category/monitors" },
  { id: "games", name: "Games & Entertainment", count: 89, image: img("cat-games.png"), href: "/category/games-entertainment" },
  { id: "photo", name: "Photo & Video", count: 86, image: img("cat-photo.png"), href: "/category/photo-video" },
  { id: "phones", name: "Smartphones & Tablets", count: 74, image: img("cat-phones.png"), href: "/category/smartphones-tablets" },
  { id: "accessories", name: "Accessories", count: 823, image: img("cat-accessories.png"), href: "/category/accessories" },
  { id: "laptops", name: "Laptops & Desktops", count: 8, image: img("cat-laptops.png"), href: "/category/laptops-desktops" },
];

export const newArrivals = [
  { id: "na-1", name: "HP S500 USB Wireless Optical Mouse, Black", brand: "HP", price: 50000, image: img("hp-s500-mouse.png"), href: "/product/hp-s500-mouse", sku: "NX101" },
  { id: "na-2", name: "Yesido EC32 Handheld Wireless Vacuum Cleaner", brand: "Yesido", price: 450000, image: img("yesido-ec32.png"), href: "/product/yesido-ec32", sku: "NX102" },
  { id: "na-3", name: "150W Inverter Camping Energy Storage 50Hz/60Hz", brand: "", price: 480000, image: img("camping-power-station.png"), href: "/product/150w-camping-power-station", sku: "NX103" },
  { id: "na-4", name: "C104 Desktop Angle Adjustable Mobile Phone Stand", brand: "Yesido", price: 60000, image: img("c104-phone-stand.png"), href: "/product/c104-phone-stand", sku: "NX104" },
  { id: "na-5", name: "Ugreen Uno 6 in 1 USB C Hub 3.2 10Gbps Data", brand: "UGREEN", price: 450000, image: img("ugreen-uno-hub.png"), href: "/product/ugreen-uno-6in1-hub", sku: "NX105" },
  { id: "na-6", name: "Google Pixel Watch 2, Heart Rate Tracking, Stress", brand: "Google Pixel", price: 1300000, image: img("pixel-watch-2.png"), href: "/product/google-pixel-watch-2", sku: "NX106" },
];

export const laptops = [
  { id: "lp-1", name: "Acer Nitro V 15 Gaming Laptop, 15.6″ FHD IPS 165Hz Display, Intel", brand: "", price: 3800000, image: img("acer-nitro-v15.png"), href: "/product/acer-nitro-v15", sku: "NX1542" },
  { id: "lp-2", name: "HP Victus 15 Gaming Laptop, 15.6 Inch FHD 144Hz Display, Intel", brand: "HP", price: 3500000, image: img("hp-victus-15.png"), href: "/product/hp-victus-15", sku: "NX1460" },
  { id: "lp-3", name: "Lenovo IdeaPad 5 2-in-1 14IAL10 Laptop, 14″ WUXGA IPS Display,", brand: "Lenovo", price: 3000000, image: img("lenovo-ideapad-5.png"), href: "/product/lenovo-ideapad-5-2in1", sku: "NX1553" },
  { id: "lp-4", name: "Lenovo LOQ Gaming Laptop, 15.6″ FHD IPS G-SYNC Display, Intel", brand: "Lenovo", price: 4700000, image: img("lenovo-loq.png"), href: "/product/lenovo-loq", sku: "NX1545", inStock: false },
];

export const laptopPromo = {
  tag: "ON SALE",
  title: "LENOVO IDEAPAD",
  cta: "Buy Now",
  href: "/product/lenovo-ideapad-5-2in1",
  image: img("promo-lenovo-ideapad.png"),
};

export const monitors = [
  { id: "mo-1", name: "HP OMEN 34c 34-inch WQHD 165Hz 1ms Curved Gaming", brand: "HP", price: 3740000, image: img("omen-34c.png"), href: "/product/hp-omen-34c" },
  { id: "mo-2", name: "HP OMEN 32c QHD 165Hz 31.5″ Curved Gaming Monitor", brand: "HP", price: 2780000, image: img("omen-32c.png"), href: "/product/hp-omen-32c" },
  { id: "mo-3", name: "HP OMEN 24 23.8-inch FHD 165Hz 1ms Gaming Monitor –", brand: "HP", price: 1372000, image: img("omen-24.png"), href: "/product/hp-omen-24" },
  { id: "mo-4", name: "HP OMEN 27-inch FHD 165Hz 1ms Gaming Monitor", brand: "HP", price: 1300000, image: img("omen-27.png"), href: "/product/hp-omen-27" },
  { id: "mo-5", name: "HP OMEN 32q 31.5-inch QHD 165Hz 1ms Gaming Monitor", brand: "HP", price: 2790000, image: img("omen-32q.png"), href: "/product/hp-omen-32q" },
  { id: "mo-6", name: "Lenovo ThinkVision S27i-30 27-inch Full HD IPS Monitor with", brand: "HP", price: 1261000, image: img("thinkvision-s27i.png"), href: "/product/lenovo-thinkvision-s27i-30" },
];

export const accessoriesBanner = {
  title: "Accessories for Every Need",
  subtitle: "Enhance Your Devices with Genuine, High-Quality Accessories",
  cta: "Go Shopping",
  href: "/category/accessories",
  image: img("banner-accessories.png"),
};

export const accessories = [
  { id: "ac-1", name: "Anker Zolo 30W Compact GaN Charger,", brand: "Anker", price: 100000, image: img("anker-zolo-30w.png"), href: "/product/anker-zolo-30w", sku: "NX201" },
  { id: "ac-2", name: "Anker 30W Power Bank 20000mah", brand: "Anker", price: 250000, image: img("anker-powerbank-20000.png"), href: "/product/anker-30w-power-bank", sku: "NX202" },
  { id: "ac-3", name: "LG 34G600A-B UltraGear Curved", brand: "LG", price: 2500000, image: img("lg-34g600a.png"), href: "/product/lg-34g600a-b", sku: "NX203" },
  { id: "ac-4", name: "Logitech M171 Wireless Mouse for PC,", brand: "Logitech", price: 70000, image: img("logitech-m171.png"), href: "/product/logitech-m171", sku: "NX204" },
];

export const pcHardware = [
  { id: "pc-1", name: "ANTEC CX500M Micro Tower Gaming Case, Black, ARGB,", brand: "Antec", price: 900000, image: img("antec-cx500m.png"), href: "/product/antec-cx500m", sku: "NX301" },
  { id: "pc-2", name: "ASUS Dual GeForce RTX 5060 OC Edition Graphics", brand: "Asus", price: 3000000, image: img("asus-dual-rtx5060.png"), href: "/product/asus-dual-rtx-5060-oc", sku: "NX302" },
  { id: "pc-3", name: "Antec VX310 ARGB ATX Mid Tower PC Case Black High", brand: "Antec", price: 900000, image: img("antec-vx310.png"), href: "/product/antec-vx310-argb", sku: "NX303" },
  { id: "pc-4", name: "AMD Ryzen 5 5500 Desktop Processor (6-core/12-thread, 19 MB cache, up to 4.2 GHz max boost)", brand: "AMD", price: 750000, image: img("ryzen-5-5500.png"), href: "/product/amd-ryzen-5-5500", sku: "N/A" },
  { id: "pc-5", name: "Thermalright TL-S12-S X3 CPU Fan 120mm ARGB Case Cooler Fan Comes with ARGB Lighting Effect,PC PWM Silent Computer Fan with", brand: "Thermalright", price: 300000, image: img("thermalright-tl-s12.png"), href: "/product/thermalright-tl-s12-s-x3", sku: "NX305" },
  { id: "pc-6", name: "Thermalright Burst Assassin 120 SE ARGB CPU Cooler, 6", brand: "Thermalright", price: 250000, image: img("thermalright-burst-assassin.png"), href: "/product/thermalright-burst-assassin-120-se", sku: "NX306" },
];

export const bluetooth = {
  title: "Bluetooth speakers",
  subtitle: "Your music, your freedom explore portable Bluetooth speakers.",
  image: img("banner-speakers.png"),
  chips: [
    { label: "PARTY", href: "/category/bluetooth-speakers?type=party", icon: "party" },
    { label: "IN DOOR", href: "/category/bluetooth-speakers?type=indoor", icon: "indoor" },
    { label: "OUT DOOR", href: "/category/bluetooth-speakers?type=outdoor", icon: "outdoor" },
    { label: "MINI", href: "/category/bluetooth-speakers?type=mini", icon: "mini" },
  ],
  tiles: [
    { title: "Bluetooth", subtitle: "HeadPhones", image: img("tile-headphones.jpg"), href: "/category/bluetooth-headphones" },
    { title: "Bluetooth", subtitle: "EarPhones", image: img("tile-earphones.jpg"), href: "/category/bluetooth-earphones" },
    { title: "Audio", subtitle: "Accessories", image: img("tile-audio-accessories.jpg"), href: "/category/audio-accessories" },
  ],
  featured: {
    id: "bt-1",
    name: "Anker Soundcore Life Q30 Bluetooth Noise Cancelling Headphones, 40H Playtime, USB",
    brand: "Anker",
    price: 250000,
    oldPrice: 280000,
    image: img("soundcore-q30.png"),
    href: "/product/anker-soundcore-life-q30",
    sku: "NX040",
    badges: [
      { label: "-11%", color: "bg-blue-600" },
      { label: "NEW", color: "bg-green-700" },
    ],
  },
};
