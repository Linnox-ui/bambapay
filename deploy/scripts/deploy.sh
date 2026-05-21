#!/bin/bash
# =================================================================
# BAMBA PAY - COMPLETE PRODUCTION DEPLOYMENT SCRIPT
# =================================================================
# This script guides you through deploying to:
# - MongoDB Atlas (Database)
# - Railway or Render (Backend API)
# - Vercel (Frontend)
# - Stripe (Payments)
# - Custom Domain (bambapay.com)
# =================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# =================================================================
# STEP 0: PREREQUISITES CHECK
# =================================================================
print_header "STEP 0: CHECKING PREREQUISITES"

check_command() {
    if command -v $1 &> /dev/null; then
        print_success "$1 is installed"
        return 0
    else
        print_error "$1 is NOT installed. Please install it first."
        return 1
    fi
}

REQUIRED_COMMANDS=("node" "npm" "git")
MISSING=0
for cmd in "${REQUIRED_COMMANDS[@]}"; do
    check_command $cmd || MISSING=1
done

if [ $MISSING -eq 1 ]; then
    echo ""
    print_error "Please install missing tools and rerun this script."
    echo "   Node.js: https://nodejs.org (v18+)"
    echo "   Git: https://git-scm.com"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js 18+ required. Current: $(node -v)"
    exit 1
fi

print_success "All prerequisites met! Node $(node -v), npm $(npm -v)"

# =================================================================
# STEP 1: MONGODB ATLAS SETUP
# =================================================================
print_header "STEP 1: MONGODB ATLAS SETUP"

echo ""
echo "Follow these steps to set up your free MongoDB Atlas database:"
echo ""
echo "1. Go to https://cloud.mongodb.com and sign up/log in"
echo "2. Click 'Build a Database' → Choose 'FREE M0 Tier'"
echo "3. Select AWS/GCP/Azure and region closest to your users"
echo "4. Click 'Create Cluster' (takes 1-3 minutes)"
echo ""
echo "5. In 'Security Quickstart':"
echo "   - Create a username (e.g., 'bambapay-user')"
echo "   - Click 'Autogenerate Secure Password' → COPY IT"
echo "   - Click 'Create User'"
echo ""
echo "6. In 'Network Access':"
echo "   - Click 'Add IP Address'"
echo "   - Choose 'Allow Access from Anywhere' (0.0.0.0/0)"
echo "   - For production later, restrict to your server IPs"
echo ""
echo "7. Get your connection string:"
echo "   - Click 'Connect' → 'Drivers' → 'Node.js'"
echo "   - Copy the connection string"
echo "   - It looks like: mongodb+srv://user:pass@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority"
echo ""

read -p "Paste your MongoDB Atlas connection string: " MONGODB_URI

if [ -z "$MONGODB_URI" ]; then
    print_error "MongoDB URI is required. Exiting."
    exit 1
fi

print_success "MongoDB URI captured"

# =================================================================
# STEP 2: STRIPE SETUP
# =================================================================
print_header "STEP 2: STRIPE CONFIGURATION"

echo ""
echo "1. Go to https://dashboard.stripe.com and sign up/log in"
echo "2. Switch to 'Test mode' (toggle in top-right)"
echo "3. Go to 'Developers' → 'API keys'"
echo "4. Copy your Publishable key (pk_test_...) and Secret key (sk_test_...)"
echo ""

read -p "Paste your STRIPE PUBLISHABLE KEY (pk_test_...): " STRIPE_PUBLISHABLE_KEY
read -p "Paste your STRIPE SECRET KEY (sk_test_...): " STRIPE_SECRET_KEY

if [ -z "$STRIPE_PUBLISHABLE_KEY" ] || [ -z "$STRIPE_SECRET_KEY" ]; then
    print_warning "Stripe keys not provided. Payment features will be disabled."
    STRIPE_PUBLISHABLE_KEY="pk_test_placeholder"
    STRIPE_SECRET_KEY="sk_test_placeholder"
fi

print_success "Stripe keys captured"

# =================================================================
# STEP 3: GENERATE SECRETS
# =================================================================
print_header "STEP 3: GENERATING SECURITY SECRETS"

if command -v openssl &> /dev/null; then
    JWT_SECRET=$(openssl rand -base64 32)
    ADMIN_SECRET=$(openssl rand -base64 16)
    print_success "Generated JWT_SECRET and ADMIN_SECRET_KEY"
else
    JWT_SECRET="bambapay-jwt-secret-$(date +%s)-replace-this-in-production"
    ADMIN_SECRET="bambapay-admin-$(date +%s)-replace-this"
    print_warning "OpenSSL not found. Using fallback secrets - CHANGE THESE IN PRODUCTION!"
fi

# =================================================================
# STEP 4: CREATE PRODUCTION ENV FILE
# =================================================================
print_header "STEP 4: CREATING PRODUCTION ENVIRONMENT FILE"

cd backend

cat > .env << EOF
# BambaPay Production Environment
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://bambapay.vercel.app

# Database
MONGODB_URI=${MONGODB_URI}

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=7d

# Stripe
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}
STRIPE_WEBHOOK_SECRET=whsec_placeholder_update_after_webhook_setup

# Admin
ADMIN_SECRET_KEY=${ADMIN_SECRET}
EOF

print_success "Created backend/.env with your configuration"
print_warning "IMPORTANT: Add backend/.env to .gitignore!"

# =================================================================
# STEP 5: DEPLOY BACKEND TO RAILWAY (Recommended)
# =================================================================
print_header "STEP 5: DEPLOY BACKEND TO RAILWAY"

echo ""
echo "Railway is the recommended platform for the backend."
echo "It offers: Free tier ($5 credit/month), auto-scaling, zero-config deploy"
echo ""
echo "MANUAL STEPS (Railway Dashboard):"
echo "1. Go to https://railway.app and sign up with GitHub"
echo "2. Click 'New Project' → 'Deploy from GitHub repo'"
echo "3. Select your BambaPay repository"
echo "4. Railway auto-detects Node.js and deploys"
echo ""
echo "5. Add environment variables in Railway Dashboard:"
echo "   - Go to your service → 'Variables' tab"
echo "   - Add all variables from backend/.env"
echo "   - For MONGODB_URI, use your Atlas connection string"
echo ""
echo "6. Generate public domain:"
echo "   - Go to 'Settings' → 'Networking'"
echo "   - Click 'Generate Domain'"
echo "   - Your API URL will be: https://bambapay-api.up.railway.app"
echo ""

read -p "Enter your Railway backend URL (e.g., https://bambapay-api.up.railway.app): " BACKEND_URL

if [ -z "$BACKEND_URL" ]; then
    BACKEND_URL="https://bambapay-api.up.railway.app"
    print_warning "Using default URL: $BACKEND_URL"
fi

print_success "Backend URL set to: $BACKEND_URL"

# =================================================================
# STEP 6: CONFIGURE STRIPE WEBHOOK
# =================================================================
print_header "STEP 6: CONFIGURE STRIPE WEBHOOK"

echo ""
echo "After your backend is deployed, configure the webhook:"
echo ""
echo "1. Go to https://dashboard.stripe.com/webhooks"
echo "2. Click '+ Add endpoint'"
echo "3. Endpoint URL: ${BACKEND_URL}/api/payments/webhook"
echo "4. Select events:"
echo "   - payment_intent.succeeded"
echo "   - payment_intent.payment_failed"
echo "5. Click 'Add endpoint'"
echo "6. Copy the 'Signing secret' (whsec_...)"
echo "7. Add it to your Railway environment variables as STRIPE_WEBHOOK_SECRET"
echo ""

print_warning "You must complete this step manually after deployment!"

# =================================================================
# STEP 7: DEPLOY FRONTEND TO VERCEL
# =================================================================
print_header "STEP 7: DEPLOY FRONTEND TO VERCEL"

cd ../frontend

# Update API URL in source
print_info "Updating frontend API configuration..."

sed -i "s|const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';|const API_URL = process.env.REACT_APP_API_URL || '${BACKEND_URL}/api';|g" src/utils/api.js

print_success "Updated src/utils/api.js with backend URL"

echo ""
echo "MANUAL STEPS (Vercel Dashboard or CLI):"
echo ""
echo "Option A - Vercel CLI (Recommended):"
echo "   1. npm install -g vercel"
echo "   2. vercel login"
echo "   3. cd frontend"
echo "   4. vercel --prod"
echo "   5. Set environment variables when prompted:"
echo "      - REACT_APP_API_URL=${BACKEND_URL}/api"
echo "      - REACT_APP_STRIPE_KEY=${STRIPE_PUBLISHABLE_KEY}"
echo ""
echo "Option B - Vercel Dashboard:"
echo "   1. Go to https://vercel.com and sign up with GitHub"
echo "   2. Click 'Add New Project' → Import your GitHub repo"
echo "   3. Framework Preset: 'Create React App'"
echo "   4. Root Directory: frontend/"
echo "   5. Build Command: npm run build"
echo "   6. Output Directory: build"
echo "   7. Add Environment Variables:"
echo "      - REACT_APP_API_URL=${BACKEND_URL}/api"
echo "      - REACT_APP_STRIPE_KEY=${STRIPE_PUBLISHABLE_KEY}"
echo "   8. Click 'Deploy'"
echo ""

read -p "Enter your Vercel frontend URL (e.g., https://bambapay.vercel.app): " FRONTEND_URL

if [ -z "$FRONTEND_URL" ]; then
    FRONTEND_URL="https://bambapay.vercel.app"
    print_warning "Using default URL: $FRONTEND_URL"
fi

print_success "Frontend URL set to: $FRONTEND_URL"

# =================================================================
# STEP 8: UPDATE CORS ON BACKEND
# =================================================================
print_header "STEP 8: UPDATING CORS CONFIGURATION"

cd ../backend

print_info "Updating CORS to allow your frontend domain..."

# Update CORS in server.js
sed -i "s|origin: process.env.FRONTEND_URL || 'http://localhost:3000'|origin: ['${FRONTEND_URL}', 'http://localhost:3000']|g" server.js

print_success "Updated CORS configuration in server.js"

# =================================================================
# STEP 9: CUSTOM DOMAIN SETUP
# =================================================================
print_header "STEP 9: CUSTOM DOMAIN SETUP (bambapay.com)"

echo ""
echo "To connect bambapay.com to your Vercel deployment:"
echo ""
echo "1. Buy domain at Namecheap/GoDaddy/Cloudflare (if not owned)"
echo ""
echo "2. In Vercel Dashboard:"
echo "   - Go to your project → 'Settings' → 'Domains'"
echo "   - Click 'Add Domain' → Enter 'bambapay.com'"
echo "   - Vercel will show you required DNS records"
echo ""
echo "3. At your domain registrar, add these DNS records:"
echo "   - Type: A     | Name: @    | Value: 76.76.21.21 (Vercel's IP)"
echo "   - Type: CNAME | Name: www  | Value: cname.vercel-dns.com"
echo ""
echo "   OR use Nameservers method (recommended):"
echo "   - Change nameservers to:"
echo "     ns1.vercel-dns.com"
echo "     ns2.vercel-dns.com"
echo ""
echo "4. Wait 5-30 minutes for DNS propagation"
echo "5. Vercel auto-provisions SSL certificate"
echo ""

print_info "For the backend API subdomain (api.bambapay.com):"
echo ""
echo "Option 1 - Railway Custom Domain (Easiest):"
echo "   - In Railway: Settings → Networking → 'Custom Domain'"
echo "   - Enter: api.bambapay.com"
echo "   - Railway gives you a CNAME target"
echo "   - Add CNAME record at registrar: api → railway-target"
echo ""
echo "Option 2 - Cloudflare Proxy (Advanced):"
echo "   - Use Cloudflare as DNS proxy"
echo "   - Add CNAME: api → your-railway-app.up.railway.app"
echo "   - Enable SSL/TLS: Full (strict)"
echo ""

# =================================================================
# STEP 10: FINAL VERIFICATION
# =================================================================
print_header "STEP 10: DEPLOYMENT SUMMARY"

cat << SUMMARY

${GREEN}========================================${NC}
${GREEN}  BAMBA PAY DEPLOYMENT CONFIGURATION${NC}
${GREEN}========================================${NC}

${BLUE}Database:${NC}
  MongoDB Atlas: ${MONGODB_URI:0:50}...

${BLUE}Backend API:${NC}
  URL: ${BACKEND_URL}
  Health Check: ${BACKEND_URL}/api/health

${BLUE}Frontend:${NC}
  URL: ${FRONTEND_URL}
  Admin Panel: ${FRONTEND_URL}/admin

${BLUE}Stripe:${NC}
  Publishable Key: ${STRIPE_PUBLISHABLE_KEY:0:20}...
  Secret Key: ${STRIPE_SECRET_KEY:0:20}...
  Webhook: ${BACKEND_URL}/api/payments/webhook

${BLUE}Security:${NC}
  JWT Secret: ${JWT_SECRET:0:20}...
  Admin Secret: ${ADMIN_SECRET:0:20}...

${BLUE}Demo Accounts:${NC}
  Admin: admin@bambapay.com / Admin123!
  User:  john@example.com / Password123!
  PIN:   1234

${YELLOW}========================================${NC}
${YELLOW}  NEXT STEPS (MANUAL)${NC}
${YELLOW}========================================${NC}

1. ${GREEN}Push code to GitHub${NC}
   git init
   git add .
   git commit -m "Production ready"
   git remote add origin https://github.com/YOUR_USERNAME/bambapay.git
   git push -u origin main

2. ${GREEN}Deploy Backend to Railway${NC}
   - Connect GitHub repo to Railway
   - Add environment variables
   - Deploy

3. ${GREEN}Deploy Frontend to Vercel${NC}
   - Connect GitHub repo to Vercel
   - Set build settings and env vars
   - Deploy

4. ${GREEN}Configure Stripe Webhook${NC}
   - Add endpoint: ${BACKEND_URL}/api/payments/webhook
   - Copy signing secret to Railway env vars

5. ${GREEN}Set Custom Domain${NC}
   - Add bambapay.com to Vercel
   - Configure DNS at registrar
   - Wait for SSL provisioning

6. ${GREEN}Test Everything${NC}
   - Visit ${FRONTEND_URL}
   - Login with demo accounts
   - Test send/deposit/withdraw
   - Check admin panel

${GREEN}========================================${NC}
${GREEN}  VERIFICATION CHECKLIST${NC}
${GREEN}========================================${NC}

[ ] Backend health check returns 200
[ ] Frontend loads without errors
[ ] Login works with demo accounts
[ ] Send money transaction completes
[ ] Deposit via Stripe test card works (4242 4242 4242 4242)
[ ] Withdrawal request submits
[ ] Admin dashboard shows analytics
[ ] Admin users page lists accounts
[ ] Admin transactions page shows data
[ ] Custom domain resolves correctly
[ ] SSL certificate is valid
[ ] Stripe webhook events process correctly

${GREEN}========================================${NC}
${GREEN}  PRODUCTION RECOMMENDATIONS${NC}
${GREEN}========================================${NC}

1. Enable MongoDB Atlas backups (M10+ tier)
2. Set up application monitoring (Sentry/LogRocket)
3. Configure rate limiting per user, not just IP
4. Add 2FA for admin accounts
5. Set up automated database backups
6. Use Cloudflare for DDoS protection
7. Enable Stripe Radar for fraud detection
8. Set up uptime monitoring (UptimeRobot)
9. Configure log aggregation (Datadog/Papertrail)
10. Implement API versioning for future updates

${GREEN}========================================${NC}
${GREEN}  SUPPORT & TROUBLESHOOTING${NC}
${GREEN}========================================${NC}

CORS Errors:
  - Ensure FRONTEND_URL in backend matches actual frontend URL
  - Check CORS origin array includes both www and non-www versions

Database Connection Failures:
  - Verify IP whitelist in MongoDB Atlas includes 0.0.0.0/0
  - Check connection string has correct password

Stripe Payment Failures:
  - Verify webhook endpoint is accessible (not behind auth)
  - Check webhook signing secret matches
  - Use test card: 4242 4242 4242 4242, any future date, any CVC

Build Failures:
  - Ensure Node.js version is 18+ in package.json engines
  - Check that all dependencies are in package.json

${GREEN}========================================${NC}

SUMMARY

print_success "Deployment configuration complete!"
print_info "Run this script again anytime to update configuration."
print_info "For help, check the README.md file."

echo ""
