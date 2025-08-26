# 🚀 Railway Deployment Guide

## Quick Deploy to Railway

### Step 1: Prepare Your Code
1. Make sure all your files are committed to git
2. Ensure your `.env` file has all required variables

### Step 2: Deploy to Railway
1. Go to [Railway.app](https://railway.app/)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. Railway will automatically detect it's a Node.js app

### Step 3: Set Environment Variables
In Railway dashboard, go to your project → Variables tab and add:

```
SHOPIFY_SHOP_NAME=rezagemcollection.myshopify.com
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_PASSWORD=your_api_password
GEMINI_API_KEY=your_gemini_api_key
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
PORT=3000
REFUND_POLICY_URL=https://rezagemcollection.ca/policies/refund-policy
LOG_LEVEL=info
```

### Step 4: Get Your Public URL
1. Go to your Railway project
2. Click on your service
3. Copy the generated URL (e.g., `https://your-app-name.railway.app`)

### Step 5: Set Up Webhooks
Once deployed, your app will be available at your Railway URL. You can then set up webhooks to trigger automatically when products are created/updated.

## Manual Webhook Setup

After deployment, you can create webhooks using:

```bash
# Create webhook for product creation
curl -X POST https://your-railway-url.com/webhooks/create \
  -H "Content-Type: application/json" \
  -d '{"topic": "products/create", "address": "https://your-railway-url.com/webhooks/shopify"}'

# Create webhook for product updates
curl -X POST https://your-railway-url.com/webhooks/create \
  -H "Content-Type: application/json" \
  -d '{"topic": "products/update", "address": "https://your-railway-url.com/webhooks/shopify"}'
```

## Testing After Deployment

1. Visit your Railway URL + `/health` to check if the app is running
2. Visit your Railway URL + `/test-connections` to test API connections
3. Create a product in Shopify and watch it get automated!

## Troubleshooting

- Check Railway logs for any errors
- Ensure all environment variables are set correctly
- Verify your Shopify app has the required permissions
- Make sure your Gemini API key is valid and has sufficient quota
