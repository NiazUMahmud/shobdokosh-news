import { Product, Category } from '../types';

export const categories: Category[] = [
  {
    id: '1',
    name: 'Electronics',
    slug: 'electronics',
    icon: 'Smartphone',
    subcategories: [
      { id: '1-1', name: 'Smartphones', slug: 'smartphones' },
      { id: '1-2', name: 'Laptops', slug: 'laptops' },
      { id: '1-3', name: 'Audio', slug: 'audio' },
      { id: '1-4', name: 'Gaming', slug: 'gaming' }
    ]
  },
  {
    id: '2',
    name: 'Fashion',
    slug: 'fashion',
    icon: 'Shirt',
    subcategories: [
      { id: '2-1', name: 'Men\'s Clothing', slug: 'mens-clothing' },
      { id: '2-2', name: 'Women\'s Clothing', slug: 'womens-clothing' },
      { id: '2-3', name: 'Shoes', slug: 'shoes' },
      { id: '2-4', name: 'Accessories', slug: 'accessories' }
    ]
  },
  {
    id: '3',
    name: 'Home & Garden',
    slug: 'home-garden',
    icon: 'Home',
    subcategories: [
      { id: '3-1', name: 'Furniture', slug: 'furniture' },
      { id: '3-2', name: 'Kitchen', slug: 'kitchen' },
      { id: '3-3', name: 'Garden', slug: 'garden' },
      { id: '3-4', name: 'Decor', slug: 'decor' }
    ]
  },
  {
    id: '4',
    name: 'Sports & Outdoors',
    slug: 'sports-outdoors',
    icon: 'Bike',
    subcategories: [
      { id: '4-1', name: 'Fitness', slug: 'fitness' },
      { id: '4-2', name: 'Outdoor Recreation', slug: 'outdoor-recreation' },
      { id: '4-3', name: 'Team Sports', slug: 'team-sports' },
      { id: '4-4', name: 'Water Sports', slug: 'water-sports' }
    ]
  }
];

export const products: Product[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro',
    description: 'The most advanced iPhone yet, featuring the powerful A17 Pro chip and titanium design.',
    price: 999,
    originalPrice: 1099,
    images: [
      'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg',
      'https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg'
    ],
    category: 'Electronics',
    subcategory: 'Smartphones',
    brand: 'Apple',
    stock: 50,
    rating: 4.8,
    reviewCount: 1247,
    featured: true,
    tags: ['smartphone', 'apple', 'pro', 'titanium'],
    specifications: {
      'Screen Size': '6.1 inches',
      'Storage': '128GB',
      'Color': 'Natural Titanium',
      'Camera': '48MP Main'
    }
  },
  {
    id: '2',
    name: 'MacBook Air M2',
    description: 'Supercharged by the next-generation M2 chip, the redesigned MacBook Air combines incredible performance and up to 18 hours of battery life into its strikingly thin design.',
    price: 1199,
    images: [
      'https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg',
      'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg'
    ],
    category: 'Electronics',
    subcategory: 'Laptops',
    brand: 'Apple',
    stock: 25,
    rating: 4.9,
    reviewCount: 892,
    featured: true,
    tags: ['laptop', 'apple', 'm2', 'portable'],
    specifications: {
      'Screen Size': '13.6 inches',
      'Processor': 'Apple M2',
      'Memory': '8GB',
      'Storage': '256GB SSD'
    }
  },
  {
    id: '3',
    name: 'Sony WH-1000XM5',
    description: 'Industry-leading noise cancellation with premium sound quality and all-day comfort.',
    price: 399,
    originalPrice: 449,
    images: [
      'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg',
      'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg'
    ],
    category: 'Electronics',
    subcategory: 'Audio',
    brand: 'Sony',
    stock: 100,
    rating: 4.7,
    reviewCount: 2156,
    featured: false,
    tags: ['headphones', 'wireless', 'noise-canceling'],
    specifications: {
      'Battery Life': '30 hours',
      'Connectivity': 'Bluetooth 5.2',
      'Weight': '250g',
      'Driver Size': '30mm'
    }
  },
  {
    id: '4',
    name: 'Classic Denim Jacket',
    description: 'Timeless denim jacket crafted from premium cotton with a vintage-inspired wash.',
    price: 89,
    images: [
      'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg',
      'https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg'
    ],
    category: 'Fashion',
    subcategory: 'Men\'s Clothing',
    brand: 'Urban Style',
    stock: 75,
    rating: 4.4,
    reviewCount: 324,
    featured: false,
    tags: ['jacket', 'denim', 'casual', 'vintage'],
    specifications: {
      'Material': '100% Cotton',
      'Fit': 'Regular',
      'Care': 'Machine wash cold',
      'Origin': 'Made in USA'
    }
  },
  {
    id: '5',
    name: 'Modern Office Chair',
    description: 'Ergonomic office chair with lumbar support and adjustable height for all-day comfort.',
    price: 299,
    originalPrice: 349,
    images: [
      'https://images.pexels.com/photos/1957477/pexels-photo-1957477.jpeg',
      'https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg'
    ],
    category: 'Home & Garden',
    subcategory: 'Furniture',
    brand: 'WorkSpace Pro',
    stock: 30,
    rating: 4.6,
    reviewCount: 567,
    featured: true,
    tags: ['chair', 'office', 'ergonomic', 'adjustable'],
    specifications: {
      'Material': 'Mesh back, fabric seat',
      'Weight Capacity': '300 lbs',
      'Height Range': '42-46 inches',
      'Warranty': '5 years'
    }
  },
  {
    id: '6',
    name: 'Yoga Mat Premium',
    description: 'Non-slip yoga mat made from eco-friendly TPE material, perfect for all types of yoga and exercise.',
    price: 45,
    images: [
      'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg',
      'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg'
    ],
    category: 'Sports & Outdoors',
    subcategory: 'Fitness',
    brand: 'ZenFlow',
    stock: 200,
    rating: 4.5,
    reviewCount: 743,
    featured: false,
    tags: ['yoga', 'mat', 'exercise', 'eco-friendly'],
    specifications: {
      'Material': 'TPE',
      'Thickness': '6mm',
      'Size': '72" x 24"',
      'Weight': '2.5 lbs'
    }
  }
];