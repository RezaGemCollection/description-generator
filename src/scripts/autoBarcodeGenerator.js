#!/usr/bin/env node
require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const shopifyService = require('../services/shopifyService');
const BarcodeGenerator = require('../utils/barcodeGenerator');
const logger = require('../utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ verify: verifyWebhook }));

/**
 * Verify Shopify webhook signature
 */
function verifyWebhook(req, res, buf) {
  const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
  const topic = req.get('X-Shopify-Topic');
  const shop = req.get('X-Shopify-Shop-Domain');
  
  if (!hmacHeader || !topic || !shop) {
    throw new Error('Missing webhook headers');
  }
  
  const calculatedHmac = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET || 'your-webhook-secret')
    .update(buf, 'utf8')
    .digest('base64');
  
  if (calculatedHmac !== hmacHeader) {
    throw new Error('Invalid webhook signature');
  }
}

/**
 * Webhook endpoint for product creation
 */
app.post('/webhooks/products/create', async (req, res) => {
  try {
    const product = req.body;
    
    logger.info(`🆕 New product created: ${product.title} (ID: ${product.id})`);
    
    // Check if product has variants
    if (!product.variants || product.variants.length === 0) {
      logger.info(`⚠️  Product ${product.id} has no variants, skipping barcode generation`);
      return res.status(200).send('OK');
    }
    
    // Check if variants already have barcodes
    const variantsWithBarcodes = product.variants.filter(variant => variant.barcode);
    const variantsWithoutBarcodes = product.variants.filter(variant => !variant.barcode);
    
    if (variantsWithBarcodes.length === product.variants.length) {
      logger.info(`✅ Product ${product.id} already has barcodes for all variants`);
      return res.status(200).send('OK');
    }
    
    // Generate barcodes for variants without barcodes
    logger.info(`🏷️  Generating barcodes for ${variantsWithoutBarcodes.length} variants`);
    
    const updatedVariants = product.variants.map(variant => {
      if (variant.barcode) {
        // Keep existing barcode
        return variant;
      } else {
        // Generate new barcode
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
      logger.info(`✅ Successfully added barcodes to product ${product.id}`);
      
      // Log summary
      const newBarcodes = updatedVariants.filter(v => !product.variants.find(orig => orig.id === v.id && orig.barcode));
      logger.info(`📊 Summary: ${newBarcodes.length} new barcodes generated`);
    } else {
      logger.error(`❌ Failed to update product ${product.id} with barcodes`);
    }
    
    res.status(200).send('OK');
    
  } catch (error) {
    logger.error(`❌ Error processing webhook: ${error.message}`);
    res.status(500).send('Error');
  }
});

/**
 * Webhook endpoint for product updates
 */
app.post('/webhooks/products/update', async (req, res) => {
  try {
    const product = req.body;
    
    logger.info(`🔄 Product updated: ${product.title} (ID: ${product.id})`);
    
    // Check if any variants are missing barcodes
    const variantsWithoutBarcodes = product.variants.filter(variant => !variant.barcode);
    
    if (variantsWithoutBarcodes.length === 0) {
      logger.info(`✅ Product ${product.id} already has barcodes for all variants`);
      return res.status(200).send('OK');
    }
    
    // Generate barcodes for missing variants
    logger.info(`🏷️  Generating barcodes for ${variantsWithoutBarcodes.length} missing variants`);
    
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
    
    // Update product
    const updateData = {
      id: product.id,
      variants: updatedVariants
    };
    
    const updatedProduct = await shopifyService.updateProductVariants(product.id, updateData);
    
    if (updatedProduct) {
      logger.info(`✅ Successfully added barcodes to updated product ${product.id}`);
    } else {
      logger.error(`❌ Failed to update product ${product.id} with barcodes`);
    }
    
    res.status(200).send('OK');
    
  } catch (error) {
    logger.error(`❌ Error processing update webhook: ${error.message}`);
    res.status(500).send('Error');
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Auto Barcode Generator',
    timestamp: new Date().toISOString()
  });
});

/**
 * Manual trigger endpoint (for testing)
 */
app.post('/generate-barcodes/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    
    logger.info(`🔧 Manual barcode generation triggered for product ${productId}`);
    
    // Get product from Shopify
    const product = await shopifyService.getProduct(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
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
    logger.error(`❌ Error in manual trigger: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Auto Barcode Generator running on port ${PORT}`);
  logger.info(`📡 Webhook endpoints:`);
  logger.info(`   POST /webhooks/products/create - Auto-generate barcodes for new products`);
  logger.info(`   POST /webhooks/products/update - Auto-generate barcodes for updated products`);
  logger.info(`   GET  /health - Health check`);
  logger.info(`   POST /generate-barcodes/:productId - Manual trigger`);
});

module.exports = app;
