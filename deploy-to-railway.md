# 🚀 Deploy to Railway - Step by Step

## Prerequisites
- GitHub account
- Railway account (free at railway.app)
- Your Shopify and Gemini API credentials ready

## Step 1: Prepare Your Code
1. Make sure all your files are saved and working locally
2. Your `.env` file should have all the required variables

## Step 2: Deploy to Railway
1. **Go to Railway**: Visit [railway.app](https://railway.app/)
2. **Sign up/Login**: Use your GitHub account
3. **Create New Project**: Click "New Project"
4. **Connect GitHub**: Select "Deploy from GitHub repo"
5. **Choose Repository**: Select your `shopify-gemini-automation` repository
6. **Railway will automatically**:
   - Detect it's a Node.js app
   - Install dependencies
   - Start the application

## Step 3: Set Environment Variables
In Railway dashboard:
1. Go to your project
2. Click on your service
3. Go to "Variables" tab
4. Add these variables:

```
SHOPIFY_SHOP_NAME=rezagemcollection.myshopify.com
SHOPIFY_API_KEY=your_actual_api_key
SHOPIFY_API_PASSWORD=your_actual_api_password
GEMINI_API_KEY=your_actual_gemini_key
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
PORT=3000
REFUND_POLICY_URL=https://rezagemcollection.ca/policies/refund-policy
LOG_LEVEL=info
```

## Step 4: Get Your Public URL
1. In Railway dashboard, click on your service
2. Copy the generated URL (e.g., `https://your-app-name.railway.app`)
3. This is your public webhook endpoint!

## Step 5: Test Your Deployment
1. Visit: `https://your-app-name.railway.app/health`
2. You should see: `{"status":"healthy","timestamp":"...","service":"shopify-gemini-automation"}`

## Step 6: Set Up Webhooks (Automatic Triggers)
Once deployed, create webhooks using your Railway URL:

```bash
# Replace YOUR_RAILWAY_URL with your actual Railway URL
curl -X POST https://YOUR_RAILWAY_URL/webhooks/create \
  -H "Content-Type: application/json" \
  -d '{"topic": "products/create", "address": "https://YOUR_RAILWAY_URL/webhooks/shopify"}'

curl -X POST https://YOUR_RAILWAY_URL/webhooks/create \
  -H "Content-Type: application/json" \
  -d '{"topic": "products/update", "address": "https://YOUR_RAILWAY_URL/webhooks/shopify"}'
```

## Step 7: Test the Full Automation
1. Go to your Shopify admin
2. Create a new product (or edit existing one)
3. Save it without a description
4. **Watch the magic happen!** The automation should trigger automatically

## 🎉 You're Done!
Now when you save a product in Shopify, it will automatically:
- Generate a description with all 8 bullet points
- Create a meta title
- Create a meta description starting with action words
- Update the product in Shopify

## Troubleshooting
- Check Railway logs for errors
- Verify all environment variables are set
- Make sure your API keys are valid
- Check that webhooks were created successfully
