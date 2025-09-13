require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');

const sampleOrders = [
  {
    customer_name: 'John Smith',
    product_name: 'MacBook Pro 16"',
    status: 'pending'
  },
  {
    customer_name: 'Sarah Johnson',
    product_name: 'iPhone 15 Pro',
    status: 'shipped'
  },
  {
    customer_name: 'Mike Wilson',
    product_name: 'Samsung Galaxy S24',
    status: 'delivered'
  },
  {
    customer_name: 'Emily Davis',
    product_name: 'Dell XPS 13',
    status: 'pending'
  },
  {
    customer_name: 'David Brown',
    product_name: 'iPad Air',
    status: 'shipped'
  },
  {
    customer_name: 'Lisa Anderson',
    product_name: 'Sony WH-1000XM5 Headphones',
    status: 'delivered'
  },
  {
    customer_name: 'Robert Taylor',
    product_name: 'Nintendo Switch OLED',
    status: 'pending'
  },
  {
    customer_name: 'Jennifer Martinez',
    product_name: 'Apple Watch Series 9',
    status: 'shipped'
  },
  {
    customer_name: 'Christopher Lee',
    product_name: 'Microsoft Surface Pro 9',
    status: 'delivered'
  },
  {
    customer_name: 'Amanda White',
    product_name: 'AirPods Pro 2nd Gen',
    status: 'pending'
  }
];

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/realtime_orders';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Seed the database
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    await Order.deleteMany({});
    console.log('🗑️ Cleared existing orders');
    const createdOrders = await Order.insertMany(sampleOrders);
    console.log(`✅ Created ${createdOrders.length} sample orders`);
    console.log('\n📋 Created Orders:');
    createdOrders.forEach((order, index) => {
      console.log(`${index + 1}. ${order.customer_name} - ${order.product_name} (${order.status})`);
    });
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('\n📊 Order Statistics:');
    stats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count}`);
    });
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('💡 You can now start the server and see real-time updates');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the seeding
const runSeed = async () => {
  await connectDB();
  await seedDatabase();
};

// Handle command line arguments

runSeed();
