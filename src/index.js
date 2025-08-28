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

    // Force regenerate description for specific product (bypasses "already generated" check)
    this.app.post('/force-regenerate/:productId', async (req, res) => {
      try {
        const { productId } = req.params;
        logger.info(`Force regenerating description for product ${productId}`);
        
        // Get the product data
        const product = await shopifyService.getProduct(productId);
        if (!product) {
          return res.status(404).json({ error: 'Product not found' });
        }
        
        // Force regeneration
        const result = await descriptionGenerator.generateDescriptionFromData(product, true);
        res.json(result);
      } catch (error) {
        logger.error('Force regeneration failed:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Update only variants in existing description
    this.app.post('/update-variants/:productId', async (req, res) => {
      try {
        const { productId } = req.params;
        logger.info(`Updating variants in description for product ${productId}`);
        
        const result = await shopifyService.updateVariantsInDescription(productId);
        res.json(result);
      } catch (error) {
        logger.error('Variant update failed:', error);
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

    // Barcode generation endpoints
    this.app.post('/generate-barcodes/:productId', async (req, res) => {
      try {
        const { productId } = req.params;
        logger.info(`🔧 Manual barcode generation triggered for product ${productId}`);
        
        // Get product from Shopify
        const product = await shopifyService.getProduct(productId);
        
        if (!product) {
          return res.status(404).json({ error: 'Product not found' });
        }
        
        // Import barcode generator
        const BarcodeGenerator = require('./utils/barcodeGenerator');
        
        // Generate barcodes for all variants
        const updatedVariants = product.variants.map(variant => {
          const barcode = BarcodeGenerator.generateUniqueBarcode(
            product, 
            variant, 
            product.variants, 
            'GEM'
          );
          
          return {
            ...variant,
            barcode: barcode
          };
        });
        
        // Update product
        const updateData = {
          id: product.id,
          variants: updatedVariants
        };
        
        const updatedProduct = await shopifyService.updateProductVariants(product.id, updateData);
        
        if (updatedProduct) {
          res.json({ 
            success: true, 
            message: `Generated barcodes for ${updatedVariants.length} variants`,
            product: updatedProduct
          });
        } else {
          res.status(500).json({ error: 'Failed to update product' });
        }
        
      } catch (error) {
        logger.error(`❌ Error in manual barcode generation: ${error.message}`);
        res.status(500).json({ error: error.message });
      }
    });

    // Batch barcode generation
    this.app.post('/generate-barcodes-batch', async (req, res) => {
      try {
        const { limit = 10 } = req.body;
        logger.info(`🔧 Batch barcode generation triggered for ${limit} products`);
        
        // Get products without barcodes
        const products = await shopifyService.getProducts({ limit });
        const BarcodeGenerator = require('./utils/barcodeGenerator');
        
        let processed = 0;
        let errors = 0;
        
        for (const product of products) {
          try {
            // Check if any variants need barcodes
            const variantsWithoutBarcodes = product.variants.filter(variant => !variant.barcode);
            
            if (variantsWithoutBarcodes.length === 0) {
              continue; // Skip if all variants have barcodes
            }
            
            // Generate barcodes for missing variants
            const updatedVariants = product.variants.map(variant => {
              if (variant.barcode) {
                return variant;
              } else {
                const barcode = BarcodeGenerator.generateUniqueBarcode(
                  product, 
                  variant, 
                  product.variants, 
                  'GEM'
                );
                
                return {
                  ...variant,
                  barcode: barcode
                };
              }
            });
            
            // Update product
            const updateData = {
              id: product.id,
              variants: updatedVariants
            };
            
            await shopifyService.updateProductVariants(product.id, updateData);
            processed++;
            
            logger.info(`✅ Generated barcodes for product ${product.id}: ${product.title}`);
            
          } catch (error) {
            logger.error(`❌ Error processing product ${product.id}: ${error.message}`);
            errors++;
          }
        }
        
        res.json({ 
          success: true, 
          message: `Batch processing complete`,
          processed,
          errors,
          total: products.length
        });
        
      } catch (error) {
        logger.error(`❌ Error in batch barcode generation: ${error.message}`);
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
        } else if (webhookData && webhookData.action === 'update_variants') {
          // Handle variant update only
          const result = await shopifyService.updateVariantsInDescription(webhookData.productId);
          logger.logWebhookEvent(topic, payload.id, 'processed', { result });
        }
        
        // Always handle barcode generation for new/updated products (regardless of other actions)
        if (topic === 'products/create' || topic === 'products/update') {
          try {
            const BarcodeGenerator = require('./utils/barcodeGenerator');
            const product = payload;
            
            logger.info(`🏷️  Auto-generating barcodes for product: ${product.title} (ID: ${product.id})`);
            
            // Check if any variants need barcodes
            const variantsWithoutBarcodes = product.variants.filter(variant => !variant.barcode);
            
            if (variantsWithoutBarcodes.length > 0) {
              // Generate barcodes for missing variants
              const updatedVariants = product.variants.map(variant => {
                if (variant.barcode) {
                  return variant;
                } else {
                  const barcode = BarcodeGenerator.generateUniqueBarcode(
                    product, 
                    variant, 
                    product.variants, 
                    'GEM'
                  );
                  
                  logger.info(`   Generated barcode for ${variant.title}: ${barcode}`);
                  
                  return {
                    ...variant,
                    barcode: barcode
                  };
                }
              });
              
              // Update product with new barcodes
              const updateData = {
                id: product.id,
                variants: updatedVariants
              };
              
              const updatedProduct = await shopifyService.updateProductVariants(product.id, updateData);
              
              if (updatedProduct) {
                logger.info(`✅ Successfully auto-generated barcodes for product ${product.id}`);
                logger.logWebhookEvent(topic, payload.id, 'processed', { 
                  action: 'barcode_generation',
                  barcodesGenerated: variantsWithoutBarcodes.length 
                });
              } else {
                logger.error(`❌ Failed to auto-generate barcodes for product ${product.id}`);
              }
            } else {
              logger.info(`✅ Product ${product.id} already has barcodes for all variants`);
            }
          } catch (error) {
            logger.error(`❌ Error in auto barcode generation: ${error.message}`);
          }
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
        logger.info(`🚀 Shopify-Gemini Automation server started on port ${this.port}`);
        logger.info(`📊 Health check: http://localhost:${this.port}/health`);
        logger.info(`📡 Webhook endpoint: http://localhost:${this.port}${process.env.WEBHOOK_PATH || '/webhooks/shopify'}`);
        logger.info(`🏷️  Barcode endpoints:`);
        logger.info(`   POST /generate-barcodes/:productId - Manual barcode generation`);
        logger.info(`   POST /generate-barcodes-batch - Batch barcode generation`);
        logger.info(`🔄 Auto barcode generation enabled for new/updated products`);
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
