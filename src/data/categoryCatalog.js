/**
 * categoryCatalog.js
 * Curated list of quick-commerce category sections matching the mobile Blinkit/Zepto grid layout
 */

export const CATEGORY_SECTIONS = [
  {
    id: 'grocery-kitchen',
    title: 'Grocery & Kitchen',
    items: [
      {
        id: 'veg-fruits',
        name: 'Vegetables & Fruits',
        slug: 'vegetables-fruits',
        image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=300&q=80',
        keywords: ['vegetable', 'vegetables', 'fruit', 'fruits', 'banana', 'apple', 'potato', 'onion', 'tomato', 'spinach', 'fresh']
      },
      {
        id: 'atta-rice-dal',
        name: 'Atta, Rice & Dal',
        slug: 'atta-rice-dal',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=300&q=80',
        keywords: ['atta', 'rice', 'dal', 'flour', 'wheat', 'pulses', 'grains', 'toor dal', 'moong dal', 'aashirvaad', 'groceries & staples']
      },
      {
        id: 'oil-ghee-masala',
        name: 'Oil, Ghee & Masala',
        slug: 'oil-ghee-masala',
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=300&q=80',
        keywords: ['oil', 'ghee', 'masala', 'spices', 'mustard oil', 'sunflower oil', 'salt', 'fortune', 'everest', 'spices & masalas']
      },
      {
        id: 'dairy-bread-eggs',
        name: 'Dairy, Bread & Eggs',
        slug: 'dairy-bread-eggs',
        image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=300&q=80',
        keywords: ['dairy', 'milk', 'butter', 'bread', 'eggs', 'paneer', 'cheese', 'curd', 'dahi', 'amul', 'dairy & bakery']
      },
      {
        id: 'bakery-biscuits',
        name: 'Bakery & Biscuits',
        slug: 'bakery-biscuits',
        image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=300&q=80',
        keywords: ['bakery', 'biscuits', 'biscuit', 'cookie', 'cookies', 'toast', 'rusk', 'cake', 'good day', 'oreo']
      },
      {
        id: 'dry-fruits-cereals',
        name: 'Dry Fruits & Cereals',
        slug: 'dry-fruits-cereals',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
        keywords: ['dry fruits', 'cereals', 'almonds', 'kaju', 'cashew', 'raisins', 'oats', 'corn flakes', 'muesli', 'nuts']
      },
      {
        id: 'chicken-meat-fish',
        name: 'Chicken, Meat & Fish',
        slug: 'chicken-meat-fish',
        image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=300&q=80',
        keywords: ['chicken', 'meat', 'fish', 'seafood', 'mutton', 'prawns', 'non veg', 'egg']
      },
      {
        id: 'kitchenware-appliances',
        name: 'Kitchenware & Appliances',
        slug: 'kitchenware-appliances',
        image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=300&q=80',
        keywords: ['kitchenware', 'bottle', 'mixer', 'appliances', 'pan', 'cooker', 'utensils', 'flask']
      }
    ]
  },
  {
    id: 'snacks-drinks',
    title: 'Snacks & Drinks',
    items: [
      {
        id: 'chips-namkeen',
        name: 'Chips & Namkeen',
        slug: 'chips-namkeen',
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=300&q=80',
        keywords: ['chips', 'namkeen', 'snack', 'snacks', 'munchies', 'lays', 'kurkure', 'bhujia', 'snacks & beverages']
      },
      {
        id: 'sweets-chocolates',
        name: 'Sweets & Chocolates',
        slug: 'sweets-chocolates',
        image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=300&q=80',
        keywords: ['sweets', 'chocolates', 'chocolate', 'mithai', 'gulab jamun', 'cadbury', 'silk', 'sweet']
      },
      {
        id: 'drinks-juices',
        name: 'Drinks & Juices',
        slug: 'drinks-juices',
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80',
        keywords: ['drinks', 'juices', 'juice', 'cold drink', 'pepsi', 'coke', 'soda', 'real', 'frooti', 'water']
      },
      {
        id: 'tea-coffee-milk-drinks',
        name: 'Tea, Coffee & Milk Drinks',
        slug: 'tea-coffee-milk-drinks',
        image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=300&q=80',
        keywords: ['tea', 'coffee', 'bournvita', 'horlicks', 'chai', 'green tea', 'nescafe', 'tata tea']
      },
      {
        id: 'instant-food',
        name: 'Instant Food',
        slug: 'instant-food',
        image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=300&q=80',
        keywords: ['instant food', 'maggi', 'noodles', 'pasta', 'cereal', 'soup', 'ready to eat', 'packaged foods']
      },
      {
        id: 'sauces-spreads',
        name: 'Sauces & Spreads',
        slug: 'sauces-spreads',
        image: 'https://images.unsplash.com/photo-1528751014936-863e6e7a319c?auto=format&fit=crop&w=300&q=80',
        keywords: ['sauce', 'sauces', 'ketchup', 'spread', 'spreads', 'jam', 'mayonnaise', 'nutella', 'peanut butter']
      },
      {
        id: 'paan-corner',
        name: 'Paan Corner',
        slug: 'paan-corner',
        image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=300&q=80',
        keywords: ['paan', 'mouth freshener', 'mint', 'supari', 'saunf', 'lighter', 'chewing gum']
      },
      {
        id: 'ice-creams-more',
        name: 'Ice Creams & More',
        slug: 'ice-creams-more',
        image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=300&q=80',
        keywords: ['ice cream', 'icecreams', 'kulfi', 'cone', 'cup', 'amul ice cream', 'cornetto', 'dessert']
      }
    ]
  },
  {
    id: 'beauty-personal-care',
    title: 'Beauty & Personal Care',
    items: [
      {
        id: 'bath-body',
        name: 'Bath & Body',
        slug: 'bath-body',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80',
        keywords: ['soap', 'body wash', 'handwash', 'pears', 'dettol', 'colgate', 'bath', 'personal care']
      },
      {
        id: 'hair',
        name: 'Hair',
        slug: 'hair',
        image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80',
        keywords: ['hair', 'shampoo', 'conditioner', 'hair oil', 'hair color', 'tresemme', 'clinic plus']
      },
      {
        id: 'skin-face',
        name: 'Skin & Face',
        slug: 'skin-face',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=300&q=80',
        keywords: ['skin', 'face', 'face wash', 'moisturizer', 'sunscreen', 'cetaphil', 'nivea', 'lotion', 'cream']
      },
      {
        id: 'beauty-cosmetics',
        name: 'Beauty & Cosmetics',
        slug: 'beauty-cosmetics',
        image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=300&q=80',
        keywords: ['beauty', 'cosmetics', 'lipstick', 'makeup', 'kajal', 'eyeliner', 'nail polish', 'brush']
      },
      {
        id: 'feminine-hygiene',
        name: 'Feminine Hygiene',
        slug: 'feminine-hygiene',
        image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=300&q=80',
        keywords: ['feminine hygiene', 'whisper', 'stayfree', 'pads', 'sanitary', 'hygiene', 'intimate wash']
      },
      {
        id: 'baby-care',
        name: 'Baby Care',
        slug: 'baby-care',
        image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=300&q=80',
        keywords: ['baby', 'diaper', 'pampers', 'wipes', 'baby food', 'cerelac', 'himalaya baby']
      },
      {
        id: 'health-pharma',
        name: 'Health & Pharma',
        slug: 'health-pharma',
        image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=300&q=80',
        keywords: ['health', 'pharma', 'medicine', 'protein', 'whey', 'honitus', 'cough syrup', 'pain relief', 'iodex', 'wellness']
      },
      {
        id: 'sexual-wellness',
        name: 'Sexual Wellness',
        slug: 'sexual-wellness',
        image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=300&q=80',
        keywords: ['sexual wellness', 'durex', 'condoms', 'lubricant', 'wellness']
      }
    ]
  }
];

// Flattened helper for backwards compatibility
export const QUICK_COMMERCE_CATEGORIES = CATEGORY_SECTIONS.flatMap(section => section.items);
