/**
 * inventoryData.js
 * Clean shared catalog definitions, categories, and normalizer.
 * No circular dependencies.
 */

export const ADMIN_STORAGE_KEY = 'ganapati_admin_products_v1';
export const CATEGORIES_STORAGE_KEY = 'ganapati_admin_categories_v1';

export const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Groceries & Staples', slug: 'groceries-staples', count: 0, icon: 'ShoppingBag' },
  { id: 'cat-2', name: 'Snacks & Beverages', slug: 'snacks-beverages', count: 0, icon: 'Coffee' },
  { id: 'cat-3', name: 'Packaged Foods', slug: 'packaged-foods', count: 0, icon: 'Package' },
  { id: 'cat-4', name: 'Dairy & Bakery', slug: 'dairy-bakery', count: 0, icon: 'Milk' },
  { id: 'cat-5', name: 'Spices & Masalas', slug: 'spices-masalas', count: 0, icon: 'Flame' },
  { id: 'cat-6', name: 'Personal Care', slug: 'personal-care', count: 0, icon: 'Sparkles' },
  { id: 'cat-7', name: 'Household Essentials', slug: 'household-essentials', count: 0, icon: 'Home' },
];

export const INITIAL_DEFAULT_PRODUCTS = [
  {
    id: 'prod-1',
    title: 'Fortune Sunlite Refined Sunflower Oil',
    name: 'Fortune Sunlite Refined Sunflower Oil',
    category: 'Groceries & Staples',
    brand: 'Fortune',
    unit: '1 Litre Pouch',
    selling_price: 155,
    mrp: 185,
    cost_price: 130,
    stock_quantity: 45,
    low_stock_threshold: 10,
    expiry_date: '2026-12-31',
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
    description: 'Fortune Sunlite Sunflower Oil is enriched with Vitamin A and Vitamin D, light and easy to digest for daily cooking.',
    sku: 'GP-100201',
    has_variants: true,
    variants: [
      { id: 'v-oil-1', name: '1 Litre Pouch', unit: '1 L', selling_price: 155, mrp: 185, stock_quantity: 45 },
      { id: 'v-oil-2', name: '2 Litre Jar', unit: '2 L', selling_price: 305, mrp: 360, stock_quantity: 20 },
      { id: 'v-oil-3', name: '5 Litre Can', unit: '5 L', selling_price: 740, mrp: 880, stock_quantity: 15 }
    ]
  },
  {
    id: 'prod-2',
    title: 'Aashirvaad Superior MP Shudh Chakki Atta',
    name: 'Aashirvaad Superior MP Shudh Chakki Atta',
    category: 'Groceries & Staples',
    brand: 'Aashirvaad',
    unit: '5 kg Pack',
    selling_price: 245,
    mrp: 280,
    cost_price: 205,
    stock_quantity: 30,
    low_stock_threshold: 8,
    expiry_date: '2026-11-30',
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    description: '100% whole wheat flour made from grain heavy MP Shudh wheat with 0% maida for soft and fluffy rotis.',
    sku: 'GP-100202',
    has_variants: true,
    variants: [
      { id: 'v-atta-1', name: '1 kg Pack', unit: '1 kg', selling_price: 55, mrp: 62, stock_quantity: 50 },
      { id: 'v-atta-2', name: '5 kg Pack', unit: '5 kg', selling_price: 245, mrp: 280, stock_quantity: 30 },
      { id: 'v-atta-3', name: '10 kg Bag', unit: '10 kg', selling_price: 475, mrp: 540, stock_quantity: 18 }
    ]
  },
  {
    id: 'prod-3',
    title: 'India Gate Super Premium Basmati Rice',
    name: 'India Gate Super Premium Basmati Rice',
    category: 'Groceries & Staples',
    brand: 'India Gate',
    unit: '5 kg Bag',
    selling_price: 480,
    mrp: 560,
    cost_price: 390,
    stock_quantity: 25,
    low_stock_threshold: 5,
    expiry_date: '2027-06-30',
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
    description: 'Aged long-grain aromatic Basmati rice, perfect for special occasions, biryanis, and pulav.',
    sku: 'GP-100203',
    has_variants: true,
    variants: [
      { id: 'v-rice-1', name: '1 kg Pouch', unit: '1 kg', selling_price: 110, mrp: 130, stock_quantity: 40 },
      { id: 'v-rice-2', name: '5 kg Bag', unit: '5 kg', selling_price: 480, mrp: 560, stock_quantity: 25 }
    ]
  },
  {
    id: 'prod-4',
    title: 'Tata Salt Vacuum Evaporated Iodised Salt',
    name: 'Tata Salt Vacuum Evaporated Iodised Salt',
    category: 'Groceries & Staples',
    brand: 'Tata Salt',
    unit: '1 kg Pouch',
    selling_price: 28,
    mrp: 30,
    cost_price: 22,
    stock_quantity: 100,
    low_stock_threshold: 20,
    expiry_date: '2027-12-31',
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=600&q=80',
    description: 'Desh Ka Namak — purity tested vacuum evaporated iodised salt for everyday healthy nutrition.',
    sku: 'GP-100204'
  },
  {
    id: 'prod-5',
    title: 'Tata Sampann Unpolished Toor Dal',
    name: 'Tata Sampann Unpolished Toor Dal',
    category: 'Groceries & Staples',
    brand: 'Tata Sampann',
    unit: '1 kg Pack',
    selling_price: 175,
    mrp: 199,
    cost_price: 145,
    stock_quantity: 40,
    low_stock_threshold: 10,
    expiry_date: '2026-10-31',
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    description: 'Naturally rich in protein unpolished toor dal without chemical water polishing.',
    sku: 'GP-100205'
  },
  {
    id: 'prod-6',
    title: 'Maggi 2-Minute Masala Instant Noodles',
    name: 'Maggi 2-Minute Masala Instant Noodles',
    category: 'Packaged Foods',
    brand: 'Nestle Maggi',
    unit: '420g (Pack of 6)',
    selling_price: 96,
    mrp: 105,
    cost_price: 80,
    stock_quantity: 55,
    low_stock_threshold: 15,
    expiry_date: '2026-09-30',
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80',
    description: 'Classic favorite masala noodles with goodness of iron and authentic Indian spices blend.',
    sku: 'GP-100206'
  },
  {
    id: 'prod-7',
    title: 'Tata Tea Gold Premium Leaf Tea',
    name: 'Tata Tea Gold Premium Leaf Tea',
    category: 'Snacks & Beverages',
    brand: 'Tata Tea',
    unit: '500g Pack',
    selling_price: 280,
    mrp: 330,
    cost_price: 230,
    stock_quantity: 35,
    low_stock_threshold: 8,
    expiry_date: '2026-12-15',
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
    description: 'An exquisite blend of gently rolled Assam CTC leaves with 15% long leaves for rich aroma and taste.',
    sku: 'GP-100207'
  },
  {
    id: 'prod-8',
    title: 'Amul Salted Pasteurized Butter',
    name: 'Amul Salted Pasteurized Butter',
    category: 'Dairy & Bakery',
    brand: 'Amul',
    unit: '500g Carton',
    selling_price: 275,
    mrp: 285,
    cost_price: 240,
    stock_quantity: 20,
    low_stock_threshold: 5,
    expiry_date: '2026-07-20',
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80',
    description: 'Utterly butterly delicious pure dairy butter made from fresh cream.',
    sku: 'GP-100208'
  },
  {
    id: 'prod-9',
    title: 'Everest Garam Masala Powder',
    name: 'Everest Garam Masala Powder',
    category: 'Spices & Masalas',
    brand: 'Everest',
    unit: '100g Box',
    selling_price: 88,
    mrp: 98,
    cost_price: 72,
    stock_quantity: 45,
    low_stock_threshold: 10,
    expiry_date: '2026-12-30',
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
    description: 'A select blend of 13 whole spices creating authentic aroma in curries, gravies, and vegetables.',
    sku: 'GP-100209'
  },
  {
    id: 'prod-10',
    title: 'Britannia Good Day Butter Cookies',
    name: 'Britannia Good Day Butter Cookies',
    category: 'Snacks & Beverages',
    brand: 'Britannia',
    unit: '600g (Family Pack)',
    selling_price: 110,
    mrp: 130,
    cost_price: 90,
    stock_quantity: 40,
    low_stock_threshold: 10,
    expiry_date: '2026-11-15',
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
    description: 'Crisp and buttery rich cookies with charming smile design for tea time crunch.',
    sku: 'GP-100210'
  },
  {
    id: 'prod-11',
    title: 'Surf Excel Easy Wash Detergent Powder',
    name: 'Surf Excel Easy Wash Detergent Powder',
    category: 'Household Essentials',
    brand: 'Surf Excel',
    unit: '1 kg Pouch',
    selling_price: 140,
    mrp: 160,
    cost_price: 115,
    stock_quantity: 35,
    low_stock_threshold: 8,
    expiry_date: '2027-08-30',
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80',
    description: 'Superfine powder that dissolves quickly and removes tough stains like mud and grease effortlessly.',
    sku: 'GP-100211'
  },
  {
    id: 'prod-12',
    title: 'Dettol Original Liquid Handwash Refill',
    name: 'Dettol Original Liquid Handwash Refill',
    category: 'Personal Care',
    brand: 'Dettol',
    unit: '1.5 Litre Pouch',
    selling_price: 230,
    mrp: 275,
    cost_price: 185,
    stock_quantity: 24,
    low_stock_threshold: 6,
    expiry_date: '2027-05-30',
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
    description: '100% better protection from illness causing germs with trusted Dettol pine fragrance.',
    sku: 'GP-100212'
  }
];

/**
 * Normalizes a product item to a standard simple schema
 */
export function normalizeProduct(p) {
  if (!p) return null;
  const sellingPrice = parseFloat(p.selling_price ?? p.price ?? p.unit_price ?? 0) || 0;
  const mrp = parseFloat(p.mrp ?? p.original_price ?? sellingPrice) || sellingPrice;
  const primaryImage = p.image_url || p.image || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '');

  // In Stock status: boolean
  let inStock = true;
  if (p.in_stock !== undefined && p.in_stock !== null) {
    inStock = Boolean(p.in_stock);
  } else if (p.stock !== undefined && p.stock !== null) {
    inStock = Number(p.stock) > 0;
  } else if (p.stock_quantity !== undefined && p.stock_quantity !== null) {
    inStock = Number(p.stock_quantity) > 0;
  } else if (p.status === 'out_of_stock') {
    inStock = false;
  }

  const status = p.status === 'draft' ? 'draft' : 'active';
  const effectiveStock = parseInt(p.stock_quantity ?? p.stock ?? (inStock ? 50 : 0), 10);
  const costPrice = parseFloat(p.cost_price || 0) || 0;
  const lowStockThreshold = parseInt(p.low_stock_threshold ?? 5, 10);

  return {
    id: p.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    title: p.title || p.name || 'Untitled Product',
    name: p.title || p.name || 'Untitled Product',
    category: p.category || 'Groceries & Staples',
    sub_category: p.sub_category || '',
    description: p.description || '',
    selling_price: sellingPrice,
    price: sellingPrice,
    mrp: mrp,
    original_price: mrp,
    cost_price: costPrice,
    in_stock: inStock && effectiveStock > 0,
    stock: effectiveStock,
    stock_quantity: effectiveStock,
    low_stock_threshold: lowStockThreshold,
    status: status, // 'active' | 'draft'
    image_url: primaryImage,
    image: primaryImage,
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (primaryImage ? [primaryImage] : []),
    sku: p.sku || `GP-${String(Math.floor(100000 + Math.random() * 900000))}`,
    unit: p.unit || p.weight || '1 unit',
    brand: p.brand || 'Ganapati Stores',
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString(),
    variants: Array.isArray(p.variants) ? p.variants : []
  };
}

