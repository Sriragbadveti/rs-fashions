export interface Product {
  id: string;
  name: string;
  category: string;
  material: string;
  price: number;
  originalPrice?: number;
  stock?: number;
  rating: number;
  reviewCount: number;
  description: string;
  longDescription: string;
  images: string[];
  colors: string[];
  sizes: string[];
  featured?: boolean;
}

export const products: Product[] = [
  {
    id: "rose-silk-saree",
    name: "Rose SiCo Gadwal Saree",
    category: "SiCo Gadwal Sarees",
    material: "Pure Silk",
    price: 4999,
    originalPrice: 6499,
    rating: 4.8,
    reviewCount: 124,
    description:
      "A softly luminous SiCo Gadwal saree designed around graceful drape, delicate colour and timeless elegance.",
    longDescription:
      "The Rose SiCo Gadwal saree brings together a fluid silhouette, a refined sheen and an understated palette. Designed for celebrations, intimate occasions and evenings where simplicity speaks louder than excess.",
    images: [
      "https://medias.utsavfashion.com/media/catalog/product/cache/1/image/1000x/040ec09b1e35df139433887a97daa66f/e/m/embroidered-viscose-silk-saree-in-baby-pink-v1-sgsa847_1.jpg",
      "https://medias.utsavfashion.com/media/catalog/product/cache/1/image/1000x/040ec09b1e35df139433887a97daa66f/e/m/embroidered-viscose-silk-saree-in-baby-pink-v1-sgsa847.jpg",
    ],
    colors: [
      "Rose",
      "Ivory",
      "Wine",
    ],
    sizes: ["Free Size"],
    featured: true,
  },

  {
    id: "ivory-cotton-saree",
    name: "Ivory SiCo Gadwal Saree",
    category: "SiCo Gadwal Sarees",
    material: "Organic Cotton",
    price: 2899,
    originalPrice: 3599,
    rating: 4.7,
    reviewCount: 89,
    description:
      "An airy SiCo Gadwal saree with a naturally textured finish and effortless everyday elegance.",
    longDescription:
      "Woven for comfort and movement, this SiCo Gadwal saree balances traditional character with an easy contemporary silhouette.",
    images: [
      "https://chugalisarees.com/uploads/products/products-1781856976-5049b4a7.jpeg",
      "https://chugalisarees.com/uploads/products/products-1781856976-85aed79e.jpeg",
    ],
    colors: [
      "Ivory",
      "Sand",
      "Blush",
    ],
    sizes: ["Free Size"],
    featured: true,
  },

  {
    id: "midnight-sico-gadwal",
    name: "Midnight SiCo Gadwal",
    category: "SiCo Gadwal Sarees",
    material: "Silk Cotton (SiCo)",
    price: 7999,
    originalPrice: 9999,
    rating: 4.9,
    reviewCount: 67,
    description:
      "Deep midnight silk with an understated traditional border and an unmistakable festive presence.",
    longDescription:
      "A statement saree inspired by the richness of South Indian silk traditions. The deep tone gives the silhouette a modern sense of drama while the woven border keeps the design rooted in heritage.",
    images: [
      "https://www.navarasamdesigns.com/cdn/shop/files/download_1f71f482-eb48-4425-a3a7-c22b3dab018c.jpg?v=1773946498&width=832",
      "https://images.unsplash.com/photo-1583391733970-2c4b7e4c9e4b?auto=format&fit=crop&w=1200&q=85",
    ],
    colors: [
      "Midnight",
      "Emerald",
      "Maroon",
    ],
    sizes: ["Free Size"],
    featured: true,
  },

  {
    id: "terracotta-handloom",
    name: "Terracotta Handloom",
    category: "SiCo Gadwal Sarees",
    material: "Handloom Cotton",
    price: 3299,
    rating: 4.6,
    reviewCount: 53,
    description:
      "A tactile handloom saree in a warm terracotta tone with a beautifully relaxed fall.",
    longDescription:
      "This handloom piece celebrates natural texture and the quiet beauty of imperfect weaving. Light, breathable and easy to style.",
    images: [
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85",
    ],
    colors: [
      "Terracotta",
      "Rust",
      "Olive",
    ],
    sizes: ["Free Size"],
    featured: false,
  },
    {
    id: "emerald-sico-gadwal",
    name: "Emerald SiCo Gadwal Silk",
    category: "SiCo Gadwal Sarees",
    material: "Silk Cotton (SiCo)",
    price: 6299,
    originalPrice: 7999,
    rating: 4.8,
    reviewCount: 96,
    description:
      "A rich emerald SiCo Gadwal SiCo Gadwal saree with luminous texture and a beautifully traditional silhouette.",
    longDescription:
      "Woven for occasions that call for quiet grandeur, the Emerald SiCo Gadwal Silk pairs a deep jewel tone with the luxurious character of SiCo Gadwal weaving. A timeless choice for weddings, festive evenings and celebrations.",
    images: [
      "https://images.pexels.com/photos/19857173/pexels-photo-19857173.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/8387170/pexels-photo-8387170.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
    colors: ["Emerald", "Bottle Green", "Teal"],
    sizes: ["Free Size"],
    featured: true,
  },

  {
    id: "ruby-red-khadi-saree",
    name: "Ruby Red Khadi Saree",
    category: "SiCo Gadwal Sarees",
    material: "Handwoven Cotton",
    price: 3199,
    originalPrice: 3899,
    rating: 4.7,
    reviewCount: 74,
    description:
      "A warm ruby-red handwoven saree balancing traditional texture with an effortlessly elegant drape.",
    longDescription:
      "Crafted for women who love the character of handwoven fabrics, the Ruby Red Khadi Saree features a comfortable texture and an expressive colour palette.",
    images: [
      "https://images.pexels.com/photos/12327758/pexels-photo-12327758.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/29479997/pexels-photo-29479997.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
    colors: ["Ruby", "Crimson", "Brick Red"],
    sizes: ["Free Size"],
    featured: false,
  },

  {
    id: "golden-sico-gadwal",
    name: "Golden SiCo Gadwal Drape",
    category: "SiCo Gadwal Sarees",
    material: "Silk Cotton (SiCo)",
    price: 4599,
    originalPrice: 5799,
    rating: 4.8,
    reviewCount: 81,
    description:
      "A softly luminous golden saree inspired by the delicate transparency and grace of Gadwal handloom weaving.",
    longDescription:
      "The Golden SiCo Gadwal Drape is light, elegant and naturally festive. Its subtle sheen makes it equally beautiful for daytime celebrations and intimate evening gatherings.",
    images: [
      "https://images.pexels.com/photos/7589447/pexels-photo-7589447.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/37706903/pexels-photo-37706903.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
    colors: ["Golden", "Champagne", "Antique Gold"],
    sizes: ["Free Size"],
    featured: true,
  },

  {
    id: "midnight-indigo-saree",
    name: "Midnight Indigo Saree",
    category: "SiCo Gadwal Sarees",
    material: "Art Silk",
    price: 3899,
    originalPrice: 4699,
    rating: 4.6,
    reviewCount: 61,
    description:
      "An intense indigo saree with a sophisticated finish designed for modern festive dressing.",
    longDescription:
      "Midnight Indigo brings depth and drama without feeling overly ornate. The rich blue tone works beautifully with traditional jewellery and contemporary styling alike.",
    images: [
      "https://images.pexels.com/photos/28058185/pexels-photo-28058185.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/34770725/pexels-photo-34770725.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
    colors: ["Indigo", "Navy", "Royal Blue"],
    sizes: ["Free Size"],
    featured: false,
  },

  {
    id: "blush-sico-gadwal-dream",
    name: "Blush SiCo Gadwal Dream",
    category: "SiCo Gadwal Sarees",
    material: "Silk Cotton (SiCo)",
    price: 4299,
    originalPrice: 5499,
    rating: 4.7,
    reviewCount: 88,
    description:
      "A romantic blush SiCo Gadwal saree with an airy fall and delicate festive character.",
    longDescription:
      "Designed for graceful occasions, the Blush SiCo Gadwal Dream combines a lightweight silk-cotton texture with a softly structured drape. Perfect for receptions, celebrations and elegant daytime events.",
    images: [
      "https://images.pexels.com/photos/33328181/pexels-photo-33328181.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/14596121/pexels-photo-14596121.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
    colors: ["Blush", "Rose Pink", "Dusty Pink"],
    sizes: ["Free Size"],
    featured: true,
  },

  {
    id: "saffron-sico-gadwal",
    name: "Saffron SiCo Gadwal",
    category: "SiCo Gadwal Sarees",
    material: "Silk Cotton (SiCo)",
    price: 8499,
    originalPrice: 10499,
    rating: 4.9,
    reviewCount: 112,
    description:
      "A vibrant saffron traditional Gadwal-crafted SiCo Gadwal saree made for grand celebrations and unforgettable evenings.",
    longDescription:
      "The Saffron SiCo Gadwal celebrates the richness of South Indian silk traditions through a radiant colour palette and an elegant ceremonial drape.",
    images: [
      "https://images.pexels.com/photos/35620983/pexels-photo-35620983.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/37358465/pexels-photo-37358465.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
    colors: ["Saffron", "Mustard", "Marigold"],
    sizes: ["Free Size"],
    featured: true,
  },

  {
    id: "plum-sico-gadwal",
    name: "Plum SiCo Gadwal Glow",
    category: "SiCo Gadwal Sarees",
    material: "Silk Cotton (SiCo)",
    price: 6799,
    originalPrice: 8299,
    rating: 4.8,
    reviewCount: 73,
    description:
      "A deep plum saree with an elegant silk sheen and a rich ceremonial presence.",
    longDescription:
      "Plum SiCo Gadwal Glow brings together a dramatic jewel tone and the unmistakable richness of traditional silk. Designed for weddings, receptions and festive gatherings.",
    images: [
      "https://images.pexels.com/photos/12992062/pexels-photo-12992062.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/37358465/pexels-photo-37358465.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
    colors: ["Plum", "Wine", "Purple"],
    sizes: ["Free Size"],
    featured: false,
  },

  {
    id: "ivory-kasavu-grace",
    name: "Ivory Kasavu Grace",
    category: "SiCo Gadwal Sarees",
    material: "Kerala Cotton",
    price: 3499,
    originalPrice: 4199,
    rating: 4.8,
    reviewCount: 105,
    description:
      "An ivory Kerala-inspired saree with a timeless golden character and beautifully understated elegance.",
    longDescription:
      "Inspired by the classic Kasavu aesthetic, this ivory saree is designed around simplicity, natural texture and subtle festive detailing.",
    images: [
      "https://images.pexels.com/photos/30458527/pexels-photo-30458527.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/30458517/pexels-photo-30458517.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
    colors: ["Ivory", "Cream", "Off White"],
    sizes: ["Free Size"],
    featured: true,
  },

  {
    id: "sunset-orange-silk",
    name: "Sunset Orange Silk",
    category: "SiCo Gadwal Sarees",
    material: "Silk Blend",
    price: 5199,
    originalPrice: 6399,
    rating: 4.7,
    reviewCount: 69,
    description:
      "A glowing sunset-orange SiCo Gadwal saree created for vibrant celebrations and statement dressing.",
    longDescription:
      "Warm, expressive and full of character, the Sunset Orange Silk pairs a radiant colour with a polished drape that transitions effortlessly from festive ceremonies to evening occasions.",
    images: [
      "https://images.pexels.com/photos/15906953/pexels-photo-15906953.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/28943662/pexels-photo-28943662.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
    colors: ["Orange", "Sunset", "Tangerine"],
    sizes: ["Free Size"],
    featured: false,
  },

  {
    id: "pearl-white-saree",
    name: "Pearl White Saree",
    category: "SiCo Gadwal Sarees",
    material: "Silk Cotton (SiCo)",
    price: 3999,
    originalPrice: 4899,
    rating: 4.6,
    reviewCount: 57,
    description:
      "A graceful pearl-white saree designed with a clean silhouette and a modern editorial feel.",
    longDescription:
      "Pearl White is deliberately understated. Its soft fabric, neutral tone and elegant fall make it a versatile piece for intimate occasions and contemporary styling.",
    images: [
      "https://images.pexels.com/photos/10494661/pexels-photo-10494661.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/19162946/pexels-photo-19162946.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
    colors: ["Pearl", "White", "Ivory"],
    sizes: ["Free Size"],
    featured: false,
  },

  {
    id: "royal-maroon-silk",
    name: "Royal Maroon Silk",
    category: "SiCo Gadwal Sarees",
    material: "Pure Silk Blend",
    price: 5899,
    originalPrice: 7199,
    rating: 4.9,
    reviewCount: 91,
    description:
      "A regal maroon SiCo Gadwal saree with a deep colour story and a beautifully traditional mood.",
    longDescription:
      "Royal Maroon Silk is made for evenings when the saree should be the centre of attention. Its rich tone pairs naturally with gold jewellery and festive styling.",
    images: [
      "https://images.pexels.com/photos/14639436/pexels-photo-14639436.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/9419212/pexels-photo-9419212.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
    colors: ["Maroon", "Burgundy", "Wine"],
    sizes: ["Free Size"],
    featured: true,
  },

  {
    id: "mustard-kalamkari",
    name: "Mustard Kalamkari",
    category: "SiCo Gadwal Sarees",
    material: "Cotton Kalamkari",
    price: 2999,
    originalPrice: 3699,
    rating: 4.6,
    reviewCount: 48,
    description:
      "A mustard SiCo Gadwal saree inspired by traditional Indian textile artistry and expressive printed motifs.",
    longDescription:
      "Mustard Kalamkari celebrates the beauty of handcrafted textile traditions through a warm colour palette and an easy everyday drape.",
    images: [
      "https://images.pexels.com/photos/28428044/pexels-photo-28428044.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/28943572/pexels-photo-28943572.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
    colors: ["Mustard", "Ochre", "Yellow"],
    sizes: ["Free Size"],
    featured: false,
  },

  {
    id: "rosewood-handloom",
    name: "Rosewood Handloom",
    category: "SiCo Gadwal Sarees",
    material: "Handloom Cotton",
    price: 2799,
    originalPrice: 3299,
    rating: 4.7,
    reviewCount: 64,
    description:
      "A tactile rosewood-toned handloom saree designed for effortless everyday sophistication.",
    longDescription:
      "Rosewood Handloom celebrates the charm of naturally woven fabric. Lightweight and breathable, it is an easy choice for workdays, lunches and relaxed gatherings.",
    images: [
      "https://images.pexels.com/photos/15321885/pexels-photo-15321885.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/28943578/pexels-photo-28943578.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
    colors: ["Rosewood", "Rust", "Terracotta"],
    sizes: ["Free Size"],
    featured: false,
  },

  {
    id: "royal-purple-sico-gadwal",
    name: "Royal Purple SiCo Gadwal",
    category: "SiCo Gadwal Sarees",
    material: "Silk Cotton (SiCo)",
    price: 4799,
    originalPrice: 5899,
    rating: 4.8,
    reviewCount: 77,
    description:
      "A sophisticated purple SiCo Gadwal SiCo Gadwal saree with a naturally textured finish and graceful fall.",
    longDescription:
      "Royal Purple SiCo Gadwal brings together the organic character of SiCo Gadwal silk and a rich jewel-toned palette. Elegant enough for celebrations while remaining beautifully understated.",
    images: [
      "https://images.pexels.com/photos/32441377/pexels-photo-32441377.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/6018958/pexels-photo-6018958.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
    colors: ["Purple", "Plum", "Violet"],
    sizes: ["Free Size"],
    featured: false,
  },

  {
    id: "garden-green-sico-gadwal",
    name: "Garden Green SiCo Gadwal",
    category: "SiCo Gadwal Sarees",
    material: "Silk Cotton (SiCo)",
    price: 4499,
    originalPrice: 5599,
    rating: 4.7,
    reviewCount: 52,
    description:
      "A fresh garden-green SiCo Gadwal saree with a light silhouette and traditional temple border.",
    longDescription:
      "Garden Green SiCo Gadwal is airy, feminine and easy to style. Its luminous silk-cotton finish gives the drape a refined festive charm.",
    images: [
      "https://images.pexels.com/photos/35737662/pexels-photo-35737662.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/37087941/pexels-photo-37087941.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
    colors: ["Garden Green", "Mint", "Sage"],
    sizes: ["Free Size"],
    featured: true,
  },

  {
    id: "scarlet-festive-saree",
    name: "Scarlet Festive Saree",
    category: "SiCo Gadwal Sarees",
    material: "Silk Blend",
    price: 5299,
    originalPrice: 6499,
    rating: 4.8,
    reviewCount: 83,
    description:
      "A striking scarlet saree designed around festive colour, traditional styling and a polished drape.",
    longDescription:
      "Scarlet Festive Saree is made for celebrations. Its vibrant colour and rich textile character create an instantly festive look when paired with classic jewellery.",
    images: [
      "https://images.pexels.com/photos/34484951/pexels-photo-34484951.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/37358465/pexels-photo-37358465.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
    colors: ["Scarlet", "Red", "Crimson"],
    sizes: ["Free Size"],
    featured: true,
  },

  {
    id: "monsoon-blue-saree",
    name: "Monsoon Blue Saree",
    category: "SiCo Gadwal Sarees",
    material: "Soft Cotton Silk",
    price: 3599,
    originalPrice: 4299,
    rating: 4.7,
    reviewCount: 59,
    description:
      "A cool blue saree inspired by monsoon skies, balancing softness, comfort and contemporary elegance.",
    longDescription:
      "Monsoon Blue brings a calm colour palette to a classic silhouette. The fabric is easy to drape and comfortable enough for long occasions.",
    images: [
      "https://images.pexels.com/photos/8229219/pexels-photo-8229219.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/36194199/pexels-photo-36194199.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
    colors: ["Monsoon Blue", "Sky Blue", "Powder Blue"],
    sizes: ["Free Size"],
    featured: false,
  },

  {
    id: "temple-gold-saree",
    name: "Temple Gold Saree",
    category: "SiCo Gadwal Sarees",
    material: "Silk Cotton",
    price: 4899,
    originalPrice: 5999,
    rating: 4.9,
    reviewCount: 104,
    description:
      "A luminous gold-toned saree inspired by temple architecture, festive rituals and South Indian elegance.",
    longDescription:
      "Temple Gold Saree draws from traditional ceremonial dressing, combining a warm golden palette with an elegant structured drape.",
    images: [
      "https://images.pexels.com/photos/34481843/pexels-photo-34481843.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/37706841/pexels-photo-37706841.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
    colors: ["Temple Gold", "Antique Gold", "Champagne"],
    sizes: ["Free Size"],
    featured: true,
  },

  {
    id: "lotus-pink-saree",
    name: "Lotus Pink Saree",
    category: "SiCo Gadwal Sarees",
    material: "Silk Cotton (SiCo)",
    price: 3299,
    originalPrice: 3999,
    rating: 4.6,
    reviewCount: 47,
    description:
      "A soft lotus-pink saree with a feminine colour palette and an effortlessly graceful silhouette.",
    longDescription:
      "Lotus Pink is designed for intimate celebrations, festive lunches and occasions where delicate colour and movement matter more than heavy embellishment.",
    images: [
      "https://images.pexels.com/photos/8229222/pexels-photo-8229222.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/33225625/pexels-photo-33225625.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
    colors: ["Lotus Pink", "Blush", "Peach"],
    sizes: ["Free Size"],
    featured: false,
  },

  {
    id: "heritage-bengal-cotton",
    name: "Heritage Bengal Cotton",
    category: "SiCo Gadwal Sarees",
    material: "Bengal Cotton",
    price: 2899,
    originalPrice: 3499,
    rating: 4.8,
    reviewCount: 71,
    description:
      "A graceful Bengal-inspired SiCo Gadwal saree celebrating traditional draping and understated textile beauty.",
    longDescription:
      "Heritage Bengal Cotton takes inspiration from classic Bengali saree styling and breathable woven fabrics. A beautiful choice for everyday elegance and cultural occasions.",
    images: [
      "https://images.pexels.com/photos/33996360/pexels-photo-33996360.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/34770725/pexels-photo-34770725.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
    colors: ["White", "Red", "Ivory"],
    sizes: ["Free Size"],
    featured: false,
  },

  {
    id: "royal-teal-saree",
    name: "Royal Teal Saree",
    category: "SiCo Gadwal Sarees",
    material: "Silk Blend",
    price: 5599,
    originalPrice: 6899,
    rating: 4.8,
    reviewCount: 66,
    description:
      "A sophisticated teal saree with a rich jewel tone and a refined festive finish.",
    longDescription:
      "Royal Teal is designed for women who prefer colour with sophistication. The deep jewel tone gives the saree a luxurious visual presence while keeping the silhouette elegant.",
    images: [
      "https://images.pexels.com/photos/15321885/pexels-photo-15321885.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/10494661/pexels-photo-10494661.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
    colors: ["Teal", "Peacock Blue", "Deep Green"],
    sizes: ["Free Size"],
    featured: false,
  },

  {
    id: "burgundy-heritage-saree",
    name: "Burgundy Heritage Saree",
    category: "SiCo Gadwal Sarees",
    material: "Silk",
    price: 6199,
    originalPrice: 7499,
    rating: 4.9,
    reviewCount: 92,
    description:
      "A deep burgundy saree with an heirloom-inspired aesthetic and rich traditional character.",
    longDescription:
      "Burgundy Heritage is designed to feel timeless rather than trendy. Its deep colour, elegant texture and traditional silhouette make it ideal for weddings and evening celebrations.",
    images: [
      "https://images.pexels.com/photos/19162946/pexels-photo-19162946.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/9419212/pexels-photo-9419212.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
    colors: ["Burgundy", "Wine", "Deep Maroon"],
    sizes: ["Free Size"],
    featured: true,
  },
];
