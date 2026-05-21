const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const generateTransactionId = require('./utils/generateTransactionId');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bambapay');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Transaction.deleteMany({});
    console.log('Cleared existing data');

    // Create demo users
    const users = await User.create([
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@bambapay.com',
        phone: '+254700000001',
        password: 'Admin123!',
        pin: '1234',
        balance: 10000,
        currency: 'USD',
        isAdmin: true,
        isVerified: true,
        kycStatus: 'verified'
      },
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+254700000002',
        password: 'Password123!',
        pin: '1234',
        balance: 5000,
        currency: 'USD',
        isVerified: true,
        kycStatus: 'verified'
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '+254700000003',
        password: 'Password123!',
        pin: '1234',
        balance: 3500,
        currency: 'USD',
        isVerified: true,
        kycStatus: 'verified'
      },
      {
        firstName: 'Michael',
        lastName: 'Johnson',
        email: 'michael@example.com',
        phone: '+254700000004',
        password: 'Password123!',
        pin: '1234',
        balance: 2000,
        currency: 'USD',
        isVerified: false,
        kycStatus: 'pending'
      },
      {
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'sarah@example.com',
        phone: '+254700000005',
        password: 'Password123!',
        pin: '1234',
        balance: 7500,
        currency: 'USD',
        isVerified: true,
        kycStatus: 'verified'
      }
    ]);

    console.log(`Created ${users.length} demo users`);

    // Create sample transactions
    const transactions = [];
    const types = ['send', 'receive', 'deposit'];
    const descriptions = [
      'Payment for services',
      'Lunch money',
      'Rent payment',
      'Gift',
      'Refund',
      'Salary advance',
      'Utility bill',
      'Shopping'
    ];

    for (let i = 0; i < 30; i++) {
      const sender = users[Math.floor(Math.random() * users.length)];
      let receiver = users[Math.floor(Math.random() * users.length)];
      while (receiver._id.toString() === sender._id.toString()) {
        receiver = users[Math.floor(Math.random() * users.length)];
      }

      const amount = parseFloat((Math.random() * 500 + 10).toFixed(2));
      const type = types[Math.floor(Math.random() * types.length)];
      const status = Math.random() > 0.1 ? 'completed' : 'pending';

      transactions.push({
        transactionId: generateTransactionId(),
        sender: type === 'deposit' ? sender._id : sender._id,
        receiver: type === 'deposit' ? sender._id : receiver._id,
        amount,
        fee: type === 'send' ? Math.min(amount * 0.01, 5) : 0,
        currency: 'USD',
        type,
        status,
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      });
    }

    await Transaction.insertMany(transactions);
    console.log(`Created ${transactions.length} sample transactions`);

    console.log('\n🎉 Seed data created successfully!');
    console.log('\nDemo Accounts:');
    console.log('Admin: admin@bambapay.com / Admin123!');
    console.log('Users: john@example.com / Password123!');
    console.log('       jane@example.com / Password123!');
    console.log('       michael@example.com / Password123!');
    console.log('       sarah@example.com / Password123!');
    console.log('\nAll PINs: 1234');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
