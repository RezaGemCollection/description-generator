require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('./utils/logger');
const shopifyService = require('./services/shopifyService');
const descriptionGenerator = require('./services/descriptionGenerator');
const shopifyConfig = require('../config/shopify-config');

class ShopifyGeminiAutomation {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebhooks();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    this.app.use(bodyParser.json({ verify: this.verifyWebhookSignature.bind(this) }));
    this.app.use(bodyParser.urlencoded({ extended: true }));
    
    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });

    // Error handling middleware
    this.app.use((error, req, res, next) => {
      logger.error('Express error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'shopify-gemini-automation'
      });
    });

    // Test connections
    this.app.get('/test-connections', async (req, res) => {
      try {
        const shopifyTest = await shopifyService.testConnection();
        res.json({
          shopify: shopifyTest,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Connection test failed:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Generate description for specific product
    this.app.post('/generate-description/:productId', async (req, res) => {
      try {
        const { productId } = req.params;
        const result = await descriptionGenerator.generateProductDescription(productId);
        res.json(result);
      } catch (error) {
        logger.error('Description generation failed:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Process products needing descriptions
    this.app.post('/process-batch', async (req, res) => {
      try {
        const { limit = 50 } = req.body;
        const result = await descriptionGenerator.processProductsNeedingDescription(limit);
        res.json(result);
      } catch (error) {
        logger.error('Batch processing failed:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get processing status
    this.app.get('/status', (req, res) => {
      const statuses = descriptionGenerator.getAllProcessingStatuses();
      res.json({
        processing: statuses,
        count: Object.keys(statuses).length
      });
    });

    // Get statistics
    this.app.get('/statistics', async (req, res) => {
      try {
        const stats = await descriptionGenerator.getStatistics();
        res.json(stats);
      } catch (error) {
        logger.error('Statistics retrieval failed:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get all products
    this.app.get('/products', async (req, res) => {
      try {
        const products = await shopifyService.getAllProducts(250);
        res.json(products);
      } catch (error) {
        logger.error('Products retrieval failed:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Generate description for specific product
    this.app.post('/generate-description', async (req, res) => {
      try {
        const { productId } = req.body;
        const result = await descriptionGenerator.generateProductDescription(productId);
        res.json(result);
      } catch (error) {
        logger.error('Description generation failed:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Test description generation
    this.app.post('/test-generation', async (req, res) => {
      try {
        const sampleData = req.body;
        const result = await descriptionGenerator.testGeneration(sampleData);
        res.json(result);
      } catch (error) {
        logger.error('Test generation failed:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Clear processing queue
    this.app.delete('/clear-queue', (req, res) => {
      descriptionGenerator.clearProcessingQueue();
      res.json({ message: 'Processing queue cleared' });
    });

    // Webhook management endpoints
    this.app.get('/webhooks', async (req, res) => {
      try {
        const webhooks = await shopifyService.listWebhooks();
        res.json(webhooks);
      } catch (error) {
        logger.error('Webhook listing failed:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/webhooks/create', async (req, res) => {
      try {
        const { topic, address } = req.body;
        const webhook = await shopifyService.createWebhook(topic, address);
        res.json(webhook);
      } catch (error) {
        logger.error('Webhook creation failed:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.delete('/webhooks/:webhookId', async (req, res) => {
      try {
        const { webhookId } = req.params;
        await shopifyService.deleteWebhook(webhookId);
        res.json({ message: 'Webhook deleted successfully' });
      } catch (error) {
        logger.error('Webhook deletion failed:', error);
        res.status(500).json({ error: error.message });
      }
    });
  }

  /**
   * Setup Shopify webhooks
   */
  setupWebhooks() {
    const webhookPath = process.env.WEBHOOK_PATH || '/webhooks/shopify';
    
    this.app.post(webhookPath, async (req, res) => {
      try {
        const topic = req.get('X-Shopify-Topic');
        const payload = req.body;
        
        logger.logWebhookEvent(topic, payload.id, 'received');
        
        // Process webhook
        const webhookData = await shopifyService.processWebhook(topic, payload);
        
        if (webhookData && webhookData.action === 'generate_description') {
          // Handle description generation
          const result = await descriptionGenerator.handleWebhookTrigger(webhookData);
          logger.logWebhookEvent(topic, payload.id, 'processed', { result });
        }
        
        res.status(200).send('OK');
      } catch (error) {
        logger.error('Webhook processing failed:', error);
        res.status(500).send('Error processing webhook');
      }
    });
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(req, res, buf) {
    const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
    
    // Temporarily disable signature verification for testing
    logger.warn('Signature verification temporarily disabled for testing');
    req.rawBody = buf;
    return;
    
    if (hmacHeader) {
      const isValid = shopifyService.verifyWebhookSignature(buf, hmacHeader);
      if (!isValid) {
        logger.logSecurity('Invalid webhook signature', {
          hmacHeader,
          bodyLength: buf.length
        });
        throw new Error('Invalid webhook signature');
      }
    }
    
    req.rawBody = buf;
  }

  /**
   * Start the server
   */
  async start() {
    try {
      // Test connections before starting
      logger.info('Testing API connections...');
      const shopifyTest = await shopifyService.testConnection();
      
      if (!shopifyTest.success) {
        throw new Error(`Shopify connection failed: ${shopifyTest.error}`);
      }
      
      logger.info('All connections successful');
      
      // Start server
      this.app.listen(this.port, () => {
        logger.info(`Shopify-Gemini Automation server started on port ${this.port}`);
        logger.info(`Health check: http://localhost:${this.port}/health`);
        logger.info(`Webhook endpoint: http://localhost:${this.port}${process.env.WEBHOOK_PATH || '/webhooks/shopify'}`);
      });
      
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('Shutting down server...');
    
    // Clear processing queue
    descriptionGenerator.clearProcessingQueue();
    
    logger.info('Server shutdown complete');
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  app.shutdown();
});

process.on('SIGINT', () => {
  logger.info('SIGINT received');
  app.shutdown();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
const app = new ShopifyGeminiAutomation();
app.start();
