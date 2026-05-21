#!/bin/bash
# BambaPay Deployment Script

echo "🚀 Starting BambaPay Deployment..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Setup Backend
echo ""
echo "📦 Setting up Backend..."
cd backend
npm install
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your configuration"
fi

# Seed data option
read -p "Seed demo data? (y/n): " seed
if [ "$seed" = "y" ]; then
    node seed.js
fi

cd ..

# Setup Frontend
echo ""
echo "🎨 Setting up Frontend..."
cd frontend
npm install
cd ..

echo ""
echo "✅ Setup Complete!"
echo ""
echo "To start development:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm start"
echo ""
echo "Demo Accounts:"
echo "  Admin: admin@bambapay.com / Admin123!"
echo "  User:  john@example.com / Password123!"
echo "  PIN:   1234"
