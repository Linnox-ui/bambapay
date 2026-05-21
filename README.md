# 🚀 BambaPay - Digital Payment Platform

A complete, production-ready digital payment platform similar to M-Pesa/PayPal, built with the MERN stack (MongoDB, Express, React, Node.js) and Stripe integration.

## ✨ Features

### User Features
- 🔐 **Secure Authentication** - JWT-based auth with bcrypt password hashing
- 💰 **Wallet System** - Send, receive, deposit, and withdraw money
- 📊 **Transaction Dashboard** - Real-time balance and transaction history
- 💳 **Stripe Integration** - Secure card deposits via Stripe PaymentIntents
- 📱 **Mobile Money Support** - Withdraw to mobile money accounts
- 🔒 **Transaction PIN** - Extra security layer for all transactions
- 🌍 **Multi-Currency** - USD, EUR, GBP, KES, NGN, ZAR

### Admin Features
- 📈 **Analytics Dashboard** - Charts and statistics
- 👥 **User Management** - View, search, activate/deactivate users
- 💸 **Transaction Monitoring** - Full transaction history with filters
- 🔍 **KYC Tracking** - Monitor verification status

### Security
- Helmet.js security headers
- Rate limiting on all endpoints
- CORS configuration
- Input validation with express-validator
- MongoDB injection protection
- Password hashing with bcrypt (12 rounds)
- Transaction PIN verification

## 📁 Project Structure

```
bambapay/
├── backend/
│   ├── server.js              # Main server entry
│   ├── package.json           # Backend dependencies
│   ├── .env                   # Environment variables
│   ├── .env.example           # Example env file
│   ├── seed.js                # Demo data seeder
│   ├── models/
│   │   ├── User.js            # User model
│   │   ├── Transaction.js     # Transaction model
│   │   └── Deposit.js         # Deposit model
│   ├── routes/
│   │   ├── auth.js            # Auth routes (login/register)
│   │   ├── wallet.js          # Wallet operations
│   │   ├── transactions.js    # Transaction history
│   │   ├── payments.js        # Stripe payments & withdrawals
│   │   └── admin.js           # Admin panel API
│   ├── middleware/
│   │   ├── auth.js            # JWT & PIN verification
│   │   └── errorHandler.js    # Global error handler
│   └── utils/
│       └── generateTransactionId.js
│
└── frontend/
    ├── package.json           # Frontend dependencies
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── index.js           # React entry
    │   ├── index.css          # Tailwind + custom styles
    │   ├── App.js             # Router setup
    │   ├── utils/
    │   │   └── api.js         # Axios API client
    │   ├── context/
    │   │   └── AuthContext.js # Auth state management
    │   ├── components/
    │   │   ├── DashboardLayout.js
    │   │   └── AdminLayout.js
    │   └── pages/
    │       ├── LandingPage.js
    │       ├── Login.js
    │       ├── Register.js
    │       ├── Dashboard.js
    │       ├── SendMoney.js
    │       ├── Deposit.js
    │       ├── Withdraw.js
    │       ├── Transactions.js
    │       ├── Profile.js
    │       ├── AdminDashboard.js
    │       ├── AdminUsers.js
    │       └── AdminTransactions.js
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, React Router 6, Tailwind CSS, Recharts, Stripe React |
| **Backend** | Node.js, Express.js, MongoDB (Mongoose) |
| **Payment** | Stripe API (PaymentIntents) |
| **Auth** | JWT, bcryptjs |
| **Security** | Helmet, express-rate-limit, CORS |

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ installed
- MongoDB (local or MongoDB Atlas)
- Stripe account (for payments)

### Step 1: Clone and Setup

```bash
# Extract the project files
cd bambapay

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Environment Configuration

```bash
cd backend

# Copy the example env file
cp .env.example .env

# Edit .env with your values:
# - MongoDB URI (local or Atlas)
# - JWT_SECRET (generate with: openssl rand -base64 32)
# - Stripe keys from https://dashboard.stripe.com/apikeys
```

### Step 3: Start MongoDB

**Option A - Local MongoDB:**
```bash
# Make sure MongoDB is running on port 27017
mongod
```

**Option B - MongoDB Atlas (Cloud):**
```bash
# Use your Atlas connection string in .env
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/bambapay
```

### Step 4: Seed Demo Data

```bash
cd backend
node seed.js
```

This creates 5 demo accounts:
- **Admin:** admin@bambapay.com / Admin123!
- **Users:** john@example.com, jane@example.com, etc. / Password123!
- **All PINs:** 1234

### Step 5: Start the Backend

```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

### Step 6: Start the Frontend

```bash
cd frontend
npm start
# App opens on http://localhost:3000
```

## 🌐 Deployment Guide

### Deploy Backend to Render/Railway

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/bambapay.git
git push -u origin main
```

2. **Deploy to Render**
   - Go to [render.com](https://render.com) → "New Web Service"
   - Connect your GitHub repo
   - Set root directory to `backend/`
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Add Environment Variables from your `.env` file
   - Click "Create Web Service"

3. **Deploy to Railway**
   - Go to [railway.app](https://railway.app) → "New Project"
   - Deploy from GitHub repo
   - Add MongoDB plugin (or use external URI)
   - Add environment variables
   - Deploy

### Deploy Frontend to Vercel

1. **Update API URL**
```bash
# In frontend/src/utils/api.js, update:
const API_URL = 'https://your-backend-url.onrender.com/api';
# OR set environment variable:
# REACT_APP_API_URL=https://your-backend-url.onrender.com/api
```

2. **Deploy**
```bash
cd frontend
npm install -g vercel
vercel
# Follow prompts to deploy
```

Or use Vercel Dashboard:
- Import GitHub repo
- Set framework preset to "Create React App"
- Add environment variable: `REACT_APP_API_URL`
- Deploy

### Configure Stripe Webhooks (Production)

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-backend.com/api/payments/webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy the webhook signing secret to your `.env` as `STRIPE_WEBHOOK_SECRET`

## 🔑 Environment Variables

```env
# Server
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend.vercel.app

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bambapay

# JWT (generate strong secret)
JWT_SECRET=your_super_secret_key_here_min_32_chars
JWT_EXPIRE=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Admin
ADMIN_SECRET_KEY=your_admin_secret
```

## 📱 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |

### Wallet
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wallet/balance` | Get balance |
| POST | `/api/wallet/send` | Send money (requires PIN) |
| POST | `/api/wallet/request` | Request money |
| GET | `/api/wallet/contacts` | Get contacts |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | Get history (paginated) |
| GET | `/api/transactions/:id` | Get single transaction |
| GET | `/api/transactions/stats/summary` | Get stats |

### Payments (Stripe)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create-payment-intent` | Create deposit intent |
| POST | `/api/payments/webhook` | Stripe webhook |
| POST | `/api/payments/withdraw` | Withdraw funds |
| GET | `/api/payments/config` | Get Stripe key |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Dashboard stats |
| GET | `/api/admin/users` | List users |
| GET | `/api/admin/users/:id` | User details |
| PUT | `/api/admin/users/:id/status` | Toggle status |
| GET | `/api/admin/transactions` | All transactions |
| GET | `/api/admin/analytics` | Analytics data |

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Manual testing with demo accounts:
# Admin: admin@bambapay.com / Admin123!
# User:  john@example.com / Password123!
# PIN:   1234
```

## 🔒 Security Checklist

- [x] Passwords hashed with bcrypt (12 rounds)
- [x] JWT tokens with expiration
- [x] Rate limiting on auth endpoints
- [x] Helmet security headers
- [x] Input validation on all routes
- [x] CORS properly configured
- [x] Transaction PIN required for transfers
- [x] MongoDB injection protection (Mongoose)
- [x] Stripe webhook signature verification

## 📄 License

MIT License - Free for personal and commercial use.

## 🆘 Support

For issues or questions:
1. Check the `.env.example` file for required variables
2. Ensure MongoDB is running
3. Verify Stripe keys are correct
4. Check backend logs for errors

---

**Built with ❤️ by BambaPay Team**
