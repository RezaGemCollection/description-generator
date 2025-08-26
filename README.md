# 🛍️ Shopify-Gemini Automation

Automatically generate Amazon-style product descriptions, meta titles, and meta descriptions for your Shopify store using Google Gemini AI.

## ✨ Features

- **Automatic Triggering**: Generates content when products are created or updated
- **Amazon-Style Descriptions**: Professional, conversion-focused product descriptions
- **SEO Optimization**: Generates meta titles and descriptions with action words
- **Variant Handling**: Intelligently handles product variants
- **Quality Assurance**: Includes gemmologist verification and refund policy
- **Webhook Integration**: Real-time automation via Shopify webhooks

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Shopify       │    │   Automation     │    │   Google        │
│   Store         │◄──►│   Server         │◄──►│   Gemini AI     │
│                 │    │                  │    │                 │
│ • Products      │    │ • Webhooks       │    │ • Descriptions  │
│ • Webhooks      │    │ • API Calls      │    │ • Meta Titles   │
│ • API           │    │ • Processing     │    │ • Meta Desc     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Shopify store with API access
- Google Gemini API key
- Node.js 16+ and npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/RezaGemCollection/description-generator.git
   cd description-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Start the server**
   ```bash
   npm start
   ```

### Environment Variables

```env
# Shopify Configuration
SHOPIFY_SHOP_NAME=your-store.myshopify.com
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_PASSWORD=your_api_password
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Application
PORT=3000
REFUND_POLICY_URL=https://your-store.com/policies/refund-policy
LOG_LEVEL=info
```

## 📝 Generated Content Structure

### Product Description
```html
<h2>About {Product Name}</h2>
<p>[Amazon-style paragraph about the product]</p>
<ul>
  <li>Available Variants: {variants} (if applicable)</li>
  <li>[Feature benefit 1]</li>
  <li>[Feature benefit 2]</li>
  <li>[Feature benefit 3]</li>
  <li>[Feature benefit 4]</li>
  <li>[Feature benefit 5]</li>
  <li><strong>Verified by Gemmologist Reza Piroznia</strong></li>
  <li>This product has <a href="/refund-policy">7 days refund</a></li>
</ul>
```

### Meta Title
- 50-60 characters
- Includes primary keyword and benefit
- Amazon-style formatting

### Meta Description
- 160 characters maximum
- Starts with action words (Buy, Shop, Find, etc.)
- Conversion-focused language

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/products` | GET | List all products |
| `/generate-description/:id` | POST | Generate content for specific product |
| `/webhooks/shopify` | POST | Shopify webhook endpoint |
| `/test-connections` | GET | Test API connections |

## 🚀 Deployment

### Railway (Recommended)

1. **Deploy to Railway**
   - Go to [railway.app](https://railway.app/)
   - Connect your GitHub repository
   - Set environment variables
   - Deploy automatically

2. **Set up webhooks**
   ```bash
   curl -X POST https://your-railway-url.com/webhooks/create \
     -H "Content-Type: application/json" \
     -d '{"topic": "products/create", "address": "https://your-railway-url.com/webhooks/shopify"}'
   ```

### Other Platforms

- **Heroku**: Use the included `Procfile`
- **Vercel**: Deploy as serverless functions
- **Docker**: Use the included `Dockerfile`

## 🔄 Automation Flow

1. **Product Created/Updated** in Shopify
2. **Webhook Triggered** to your server
3. **Gemini AI Generates** description, meta title, meta description
4. **Content Updated** in Shopify automatically
5. **Product Ready** with professional content

## 📊 Monitoring

- **Health Check**: `/health` endpoint
- **Logs**: Winston logging with different levels
- **Status**: `/status` endpoint for processing status
- **Railway Dashboard**: Built-in monitoring

## 🛠️ Development

### Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
```

### Project Structure

```
src/
├── services/          # Business logic
│   ├── geminiService.js
│   ├── shopifyService.js
│   └── descriptionGenerator.js
├── utils/             # Utilities
│   ├── logger.js
│   └── htmlFormatter.js
├── config/            # Configuration
│   ├── gemini-prompts.js
│   └── shopify-config.js
└── index.js           # Main application
```

## 🔒 Security

- Webhook signature verification
- Environment variable protection
- Rate limiting for API calls
- Input validation and sanitization

## 📈 Performance

- Rate limiting for Shopify and Gemini APIs
- Efficient product filtering
- Optimized webhook processing
- Connection pooling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please check:
- [Issues](https://github.com/RezaGemCollection/description-generator/issues)
- [Documentation](https://github.com/RezaGemCollection/description-generator/wiki)

## 🎯 Roadmap

- [ ] Batch processing for existing products
- [ ] Multiple language support
- [ ] Custom prompt templates
- [ ] Analytics dashboard
- [ ] A/B testing for descriptions
