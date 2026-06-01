const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('❌ MONGODB_URI is not set in backend/.env');
  console.error('   Please add your MongoDB Atlas connection string to backend/.env');
  process.exit(1);
}

const users = [
  {
    name: 'Admin User',
    email: 'admin@ecommer.com',
    password: 'admin123',
    role: 'admin',
    phone: '+1-555-0100'
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'user123',
    role: 'user',
    phone: '+1-555-0101',
    address: { street: '123 Main St', city: 'New York', state: 'NY', country: 'USA', zipCode: '10001' }
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'user123',
    role: 'user',
    phone: '+1-555-0102',
    address: { street: '456 Oak Ave', city: 'Los Angeles', state: 'CA', country: 'USA', zipCode: '90001' }
  }
];

const products = [
  {
    name: 'iPhone 15 Pro Max',
    description: 'The most powerful iPhone ever with A17 Pro chip, 48MP camera system, titanium design, and USB-C connectivity. Features ProMotion display at 120Hz with always-on display capability.',
    price: 1199,
    originalPrice: 1299,
    category: 'Electronics',
    brand: 'Apple',
    stock: 50,
    featured: true,
    ratings: 4.8,
    numReviews: 245,
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500'],
    tags: ['smartphone', 'apple', 'ios', '5g']
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Samsung flagship smartphone with built-in S Pen, 200MP camera, Snapdragon 8 Gen 3, and a stunning 6.8-inch Dynamic AMOLED 2X display. Perfect for productivity and creativity.',
    price: 1099,
    originalPrice: 1199,
    category: 'Electronics',
    brand: 'Samsung',
    stock: 35,
    featured: true,
    ratings: 4.7,
    numReviews: 189,
    images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500'],
    tags: ['smartphone', 'samsung', 'android', '5g', 's-pen']
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    description: 'Industry-leading noise canceling headphones with Auto NC Optimizer, 30-hour battery life, multipoint connection, and crystal clear hands-free calling.',
    price: 349,
    originalPrice: 399,
    category: 'Electronics',
    brand: 'Sony',
    stock: 80,
    featured: true,
    ratings: 4.9,
    numReviews: 512,
    images: ['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500'],
    tags: ['headphones', 'noise-canceling', 'wireless', 'sony']
  },
  {
    name: 'Apple MacBook Pro 14"',
    description: 'MacBook Pro with M3 Pro chip delivers extraordinary performance. Features a stunning Liquid Retina XDR display, all-day battery life, and the latest connectivity options.',
    price: 1999,
    originalPrice: 2199,
    category: 'Electronics',
    brand: 'Apple',
    stock: 25,
    featured: true,
    ratings: 4.9,
    numReviews: 320,
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500'],
    tags: ['laptop', 'apple', 'macbook', 'm3']
  },
  {
    name: 'Apple AirPods Pro 2nd Gen',
    description: 'AirPods Pro feature up to 2x more Active Noise Cancellation, Adaptive Transparency, Personalized Spatial Audio with dynamic head tracking, and an Apple H2 chip.',
    price: 249,
    originalPrice: 279,
    category: 'Electronics',
    brand: 'Apple',
    stock: 100,
    featured: false,
    ratings: 4.7,
    numReviews: 678,
    images: ['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500'],
    tags: ['earbuds', 'apple', 'wireless', 'noise-canceling']
  },
  {
    name: 'Dell XPS 15 Laptop',
    description: 'Premium Windows laptop with Intel Core i7-13700H, NVIDIA GeForce RTX 4060, 32GB RAM, 1TB SSD, and a stunning OLED display. Perfect for professionals and creatives.',
    price: 1799,
    originalPrice: 1999,
    category: 'Electronics',
    brand: 'Dell',
    stock: 20,
    featured: false,
    ratings: 4.6,
    numReviews: 145,
    images: ['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500'],
    tags: ['laptop', 'dell', 'windows', 'gaming']
  },
  {
    name: 'Nike Air Max 270',
    description: 'Inspired by two icons of big Air, the Nike Air Max 270 delivers a super-soft ride with the tallest Air unit yet. The sleek upper with bold colorways makes it a standout.',
    price: 150,
    originalPrice: 180,
    category: 'Clothing',
    brand: 'Nike',
    stock: 150,
    featured: true,
    ratings: 4.5,
    numReviews: 823,
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'],
    tags: ['shoes', 'nike', 'sneakers', 'running']
  },
  {
    name: "Levi's 511 Slim Fit Jeans",
    description: "The 511 slim fit jeans sit below the waist with a slim leg from hip to ankle. Made from soft, stretchy denim that moves with you all day. A wardrobe essential.",
    price: 59,
    originalPrice: 79,
    category: 'Clothing',
    brand: "Levi's",
    stock: 200,
    featured: false,
    ratings: 4.4,
    numReviews: 567,
    images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=500'],
    tags: ['jeans', 'denim', 'slim-fit', 'casual']
  },
  {
    name: "Men's Wool Blend Overcoat",
    description: 'Classic tailored overcoat crafted from a premium wool blend. Features a single-breasted front, notch lapels, and welt pockets. A timeless outerwear piece for any wardrobe.',
    price: 189,
    originalPrice: 249,
    category: 'Clothing',
    brand: 'TailorsChoice',
    stock: 60,
    featured: false,
    ratings: 4.6,
    numReviews: 234,
    images: ['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500'],
    tags: ['coat', 'wool', 'winter', 'formal']
  },
  {
    name: 'The Alchemist - Paulo Coelho',
    description: "A special 25th anniversary edition of Paulo Coelho's extraordinary international bestseller. A timeless story of following your dreams and listening to your heart.",
    price: 14,
    originalPrice: 18,
    category: 'Books',
    brand: 'HarperOne',
    stock: 300,
    featured: false,
    ratings: 4.8,
    numReviews: 2341,
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500'],
    tags: ['fiction', 'novel', 'bestseller', 'inspirational']
  },
  {
    name: 'Clean Code by Robert Martin',
    description: "Even bad code can function, but if it isn't clean, it can bring a development organization to its knees. A must-read for every software developer.",
    price: 35,
    originalPrice: 45,
    category: 'Books',
    brand: 'Prentice Hall',
    stock: 150,
    featured: false,
    ratings: 4.7,
    numReviews: 1234,
    images: ['https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500'],
    tags: ['programming', 'software', 'coding', 'professional']
  },
  {
    name: 'Instant Pot Duo 7-in-1',
    description: 'The Instant Pot Duo replaces 7 kitchen appliances: pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker, and warmer. 6-quart capacity.',
    price: 89,
    originalPrice: 119,
    category: 'Home & Garden',
    brand: 'Instant Pot',
    stock: 75,
    featured: true,
    ratings: 4.7,
    numReviews: 1876,
    images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500'],
    tags: ['kitchen', 'cooking', 'pressure-cooker', 'appliance']
  },
  {
    name: 'Dyson V15 Detect Cordless Vacuum',
    description: 'Dyson V15 Detect reveals the dust you cannot see with a laser. Automatically adapts suction and run time to the floor type and amount of dust detected.',
    price: 699,
    originalPrice: 799,
    category: 'Home & Garden',
    brand: 'Dyson',
    stock: 30,
    featured: false,
    ratings: 4.8,
    numReviews: 456,
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500'],
    tags: ['vacuum', 'cordless', 'cleaning', 'dyson']
  },
  {
    name: 'Yoga Mat Premium 6mm',
    description: 'Extra thick 6mm yoga mat provides superior cushioning for knees, hips, and joints. Non-slip surface ensures stability in all poses. Includes carrying strap.',
    price: 39,
    originalPrice: 55,
    category: 'Sports',
    brand: 'YogaLife',
    stock: 120,
    featured: false,
    ratings: 4.5,
    numReviews: 892,
    images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500'],
    tags: ['yoga', 'fitness', 'exercise', 'mat']
  },
  {
    name: 'Adjustable Dumbbell Set 5-50lbs',
    description: 'Space-efficient adjustable dumbbells replace 15 sets of weights. Dial from 5 to 50 lbs in 5 lb increments. Ideal for home gym workouts.',
    price: 299,
    originalPrice: 399,
    category: 'Sports',
    brand: 'PowerBlocks',
    stock: 45,
    featured: true,
    ratings: 4.6,
    numReviews: 567,
    images: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500'],
    tags: ['dumbbells', 'weights', 'fitness', 'home-gym']
  },
  {
    name: 'LEGO Creator Expert Big Ben',
    description: "Recreate London's iconic Big Ben with this incredible LEGO set. Features 4163 pieces with authentic architectural details, functioning clock faces, and Westminster bridge.",
    price: 249,
    originalPrice: 279,
    category: 'Toys',
    brand: 'LEGO',
    stock: 40,
    featured: false,
    ratings: 4.9,
    numReviews: 345,
    images: ['https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500'],
    tags: ['lego', 'building', 'collectible', 'architecture']
  },
  {
    name: 'CeraVe Moisturizing Cream 16oz',
    description: 'CeraVe Moisturizing Cream with three essential ceramides and hyaluronic acid. Developed with dermatologists for 24-hour hydration. Non-comedogenic and fragrance-free.',
    price: 18,
    originalPrice: 24,
    category: 'Beauty',
    brand: 'CeraVe',
    stock: 250,
    featured: false,
    ratings: 4.8,
    numReviews: 5432,
    images: ['https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500'],
    tags: ['skincare', 'moisturizer', 'ceramides', 'dermatologist']
  },
  {
    name: 'Nespresso Vertuo Next Coffee Maker',
    description: 'Nespresso Vertuo Next brews 5 cup sizes with a single touch. Innovative Centrifusion technology extracts coffee at optimal settings. Includes free welcome kit of 12 capsules.',
    price: 159,
    originalPrice: 199,
    category: 'Home & Garden',
    brand: 'Nespresso',
    stock: 55,
    featured: true,
    ratings: 4.5,
    numReviews: 789,
    images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500'],
    tags: ['coffee', 'espresso', 'kitchen', 'appliance']
  },
  {
    name: 'Garmin Forerunner 965 GPS Watch',
    description: 'Premium GPS running and triathlon smartwatch with AMOLED display. Features training readiness, morning report, race predictor, and up to 31 days battery life.',
    price: 599,
    originalPrice: 649,
    category: 'Sports',
    brand: 'Garmin',
    stock: 35,
    featured: false,
    ratings: 4.7,
    numReviews: 234,
    images: ['https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500'],
    tags: ['smartwatch', 'gps', 'running', 'fitness', 'garmin']
  },
  {
    name: 'Nintendo Switch OLED Model',
    description: 'Nintendo Switch OLED Model features a vibrant 7-inch OLED screen, wide adjustable stand, 64GB internal storage, enhanced audio, and dock with wired LAN port.',
    price: 349,
    originalPrice: 369,
    category: 'Electronics',
    brand: 'Nintendo',
    stock: 60,
    featured: true,
    ratings: 4.8,
    numReviews: 1123,
    images: ['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=500'],
    tags: ['gaming', 'nintendo', 'console', 'portable']
  }
];

const connectAndSeed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected');

    if (process.argv[2] === '--destroy') {
      await Promise.all([User.deleteMany(), Product.deleteMany(), Order.deleteMany()]);
      console.log('🗑️  All data destroyed');
      process.exit(0);
    }

    // Clear existing data
    await Promise.all([User.deleteMany(), Product.deleteMany(), Order.deleteMany()]);
    console.log('🗑️  Cleared existing data');

    // Create users with hashed passwords
    const createdUsers = await User.create(users);
    console.log(`👤 Created ${createdUsers.length} users`);

    // Create products
    const createdProducts = await Product.create(products);
    console.log(`📦 Created ${createdProducts.length} products`);

    // Create sample orders
    const customer = createdUsers.find(u => u.role === 'user');
    const sampleOrders = [
      {
        user: customer._id,
        orderItems: [
          { product: createdProducts[0]._id, name: createdProducts[0].name, image: createdProducts[0].images[0], price: createdProducts[0].price, quantity: 1 },
          { product: createdProducts[2]._id, name: createdProducts[2].name, image: createdProducts[2].images[0], price: createdProducts[2].price, quantity: 1 }
        ],
        shippingAddress: { street: '123 Main St', city: 'New York', state: 'NY', country: 'USA', zipCode: '10001' },
        paymentMethod: 'Credit Card',
        itemsPrice: createdProducts[0].price + createdProducts[2].price,
        shippingPrice: 0,
        taxPrice: Math.round((createdProducts[0].price + createdProducts[2].price) * 0.08),
        totalPrice: Math.round((createdProducts[0].price + createdProducts[2].price) * 1.08),
        isPaid: true,
        paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        orderStatus: 'Delivered',
        deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        user: customer._id,
        orderItems: [
          { product: createdProducts[6]._id, name: createdProducts[6].name, image: createdProducts[6].images[0], price: createdProducts[6].price, quantity: 2 }
        ],
        shippingAddress: { street: '123 Main St', city: 'New York', state: 'NY', country: 'USA', zipCode: '10001' },
        paymentMethod: 'PayPal',
        itemsPrice: createdProducts[6].price * 2,
        shippingPrice: 9.99,
        taxPrice: Math.round(createdProducts[6].price * 2 * 0.08),
        totalPrice: Math.round(createdProducts[6].price * 2 * 1.08 + 9.99),
        isPaid: true,
        paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        orderStatus: 'Shipped'
      },
      {
        user: customer._id,
        orderItems: [
          { product: createdProducts[11]._id, name: createdProducts[11].name, image: createdProducts[11].images[0], price: createdProducts[11].price, quantity: 1 }
        ],
        shippingAddress: { street: '123 Main St', city: 'New York', state: 'NY', country: 'USA', zipCode: '10001' },
        paymentMethod: 'Cash on Delivery',
        itemsPrice: createdProducts[11].price,
        shippingPrice: 4.99,
        taxPrice: Math.round(createdProducts[11].price * 0.08),
        totalPrice: Math.round(createdProducts[11].price * 1.08 + 4.99),
        isPaid: false,
        orderStatus: 'Pending'
      }
    ];

    await Order.create(sampleOrders);
    console.log(`📋 Created ${sampleOrders.length} sample orders`);

    console.log('\n✅ Database seeded successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 Admin Login:');
    console.log('   Email   : admin@ecommer.com');
    console.log('   Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 User Login:');
    console.log('   Email   : jane@example.com');
    console.log('   Password: user123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder Error:', error.message);
    process.exit(1);
  }
};

connectAndSeed();
