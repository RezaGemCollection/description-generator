const Shopify = require('shopify-api-node');
const shopifyConfig = require('../../config/shopify-config');
const logger = require('../utils/logger');

class ShopifyService {
  constructor() {
    this.shopify = new Shopify({
      shopName: process.env.SHOPIFY_SHOP_NAME,
      apiKey: process.env.SHOPIFY_API_KEY,
      password: process.env.SHOPIFY_API_PASSWORD,
      apiVersion: shopifyConfig.api.version
    });
    
    this.rateLimit = {
      requestsPerSecond: shopifyConfig.rateLimiting.requestsPerSecond,
      bucketSize: shopifyConfig.rateLimiting.bucketSize,
      lastRequest: 0
    };
  }

  /**
   * Rate limiting for Shopify API
   */
  async applyRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.rateLimit.lastRequest;
    const minInterval = 1000 / this.rateLimit.requestsPerSecond;
    
    if (timeSinceLastRequest < minInterval) {
      const delay = minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.rateLimit.lastRequest = Date.now();
  }

  /**
   * Get product by ID
   */
  async getProduct(productId) {
    try {
      await this.applyRateLimit();
      
      const product = await this.shopify.product.get(productId);
      logger.info(`Retrieved product: ${product.title} (ID: ${productId})`);
      return product;
    } catch (error) {
      logger.error(`Error retrieving product ${productId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update product with generated content
   */
  async updateProduct(productId, content) {
    try {
      await this.applyRateLimit();
      
      const updateData = {
        id: productId,
        body_html: content.description,
        metafields: [
          {
            namespace: shopifyConfig.metafields.namespace,
            key: shopifyConfig.metafields.key,
            value: content.description,
            type: shopifyConfig.metafields.type
          },
          {
            namespace: shopifyConfig.metafields.namespace,
            key: 'ai_meta_title',
            value: content.metaTitle,
            type: 'single_line_text_field'
          },
          {
            namespace: shopifyConfig.metafields.namespace,
            key: 'ai_meta_description',
            value: content.metaDescription,
            type: 'single_line_text_field'
          }
        ]
      };

      const updatedProduct = await this.shopify.product.update(productId, updateData);
      logger.info(`Updated product: ${updatedProduct.title} (ID: ${productId})`);
      
      // Also update SEO fields
      try {
        await this.updateProductSEO(productId, content.metaTitle, content.metaDescription);
        logger.info(`Updated SEO fields for product: ${productId}`);
      } catch (seoError) {
        logger.warn(`Could not update SEO fields for product ${productId}: ${seoError.message}`);
      }
      
      return updatedProduct;
    } catch (error) {
      logger.error(`Error updating product ${productId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update product SEO fields
   */
  async updateProductSEO(productId, metaTitle, metaDescription) {
    try {
      await this.applyRateLimit();
      
      // According to Shopify docs, we need to use the SEO API
      const axios = require('axios');
      const shopName = process.env.SHOPIFY_SHOP_NAME;
      const apiKey = process.env.SHOPIFY_API_KEY;
      const password = process.env.SHOPIFY_API_PASSWORD;
      
             // First, try to get existing SEO data
       const getUrl = `https://${apiKey}:${password}@${shopName}/admin/api/2024-01/products/${productId}/metafields.json?namespace=global`;
      
      try {
        const existingResponse = await axios.get(getUrl);
        const existingMetafields = existingResponse.data.metafields || [];
        
                 // Update existing metafields or create new ones
         for (const metafield of existingMetafields) {
           if (metafield.key === 'title_tag') {
             await axios.put(`https://${apiKey}:${password}@${shopName}/admin/api/2024-01/metafields/${metafield.id}.json`, {
               metafield: {
                 id: metafield.id,
                 value: metaTitle
               }
             });
           } else if (metafield.key === 'description_tag') {
             await axios.put(`https://${apiKey}:${password}@${shopName}/admin/api/2024-01/metafields/${metafield.id}.json`, {
               metafield: {
                 id: metafield.id,
                 value: metaDescription
               }
             });
           }
         }
         
         // Create new metafields if they don't exist
         const hasTitle = existingMetafields.some(m => m.key === 'title_tag');
         const hasDescription = existingMetafields.some(m => m.key === 'description_tag');
        
        if (!hasTitle) {
          await axios.post(`https://${apiKey}:${password}@${shopName}/admin/api/2024-01/products/${productId}/metafields.json`, {
            metafield: {
              namespace: 'global',
              key: 'title_tag',
              value: metaTitle,
              type: 'single_line_text_field'
            }
          });
        }
        
        if (!hasDescription) {
          await axios.post(`https://${apiKey}:${password}@${shopName}/admin/api/2024-01/products/${productId}/metafields.json`, {
            metafield: {
              namespace: 'global',
              key: 'description_tag',
              value: metaDescription,
              type: 'single_line_text_field'
            }
          });
        }
        
        logger.info(`Updated SEO fields for product ID: ${productId}`);
        return true;
        
      } catch (getError) {
        // If getting existing metafields fails, create new ones
        logger.warn(`Could not get existing SEO metafields, creating new ones: ${getError.message}`);
        
        const createUrl = `https://${apiKey}:${password}@${shopName}/admin/api/2024-01/products/${productId}/metafields.json`;
        
                 const seoMetafields = [
           {
             metafield: {
               namespace: 'global',
               key: 'title_tag',
               value: metaTitle,
               type: 'single_line_text_field'
             }
           },
           {
             metafield: {
               namespace: 'global',
               key: 'description_tag',
               value: metaDescription,
               type: 'single_line_text_field'
             }
           }
         ];

        // Create SEO metafields
        for (const metafield of seoMetafields) {
          await axios.post(createUrl, metafield);
        }
        
        logger.info(`Created SEO fields for product ID: ${productId}`);
        return true;
      }
      
    } catch (error) {
      logger.error(`Error updating SEO for product ${productId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all products (with pagination)
   */
  async getAllProducts(limit = 50, sinceId = null) {
    try {
      await this.applyRateLimit();
      
      const params = {
        limit: limit,
        fields: shopifyConfig.productFields.join(',')
      };
      
      if (sinceId) {
        params.since_id = sinceId;
      }

      const products = await this.shopify.product.list(params);
      logger.info(`Retrieved ${products.length} products`);
      return products;
    } catch (error) {
      logger.error(`Error retrieving products: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get products that need description generation
   */
  async getProductsNeedingDescription(limit = 50) {
    try {
      const products = await this.getAllProducts(limit);
      
      // Filter products that don't have AI-generated descriptions
      const productsNeedingDescription = products.filter(product => {
        return !product.body_html || 
               !product.body_html.includes('Verified by Gemmologist Reza Piroznia') ||
               product.body_html.length < 100;
      });

      logger.info(`Found ${productsNeedingDescription.length} products needing description`);
      return productsNeedingDescription;
    } catch (error) {
      logger.error(`Error finding products needing description: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create webhook for product events
   */
  async createWebhook(topic, address) {
    try {
      await this.applyRateLimit();
      
      const webhook = await this.shopify.webhook.create({
        topic: topic,
        address: address,
        format: shopifyConfig.webhooks.format,
        api_version: shopifyConfig.webhooks.api_version
      });
      
      logger.info(`Created webhook for topic: ${topic}`);
      return webhook;
    } catch (error) {
      logger.error(`Error creating webhook for ${topic}: ${error.message}`);
      throw error;
    }
  }

  /**
   * List all webhooks
   */
  async listWebhooks() {
    try {
      await this.applyRateLimit();
      
      const webhooks = await this.shopify.webhook.list();
      logger.info(`Retrieved ${webhooks.length} webhooks`);
      return webhooks;
    } catch (error) {
      logger.error(`Error listing webhooks: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId) {
    try {
      await this.applyRateLimit();
      
      await this.shopify.webhook.delete(webhookId);
      logger.info(`Deleted webhook: ${webhookId}`);
    } catch (error) {
      logger.error(`Error deleting webhook ${webhookId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body, hmacHeader) {
    const crypto = require('crypto');
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    
    if (!secret) {
      logger.warn('No webhook secret configured, skipping signature verification');
      return true;
    }

    const hash = crypto
      .createHmac('sha256', secret)
      .update(body, 'utf8')
      .digest('base64');

    return hash === hmacHeader;
  }

  /**
   * Process webhook payload
   */
  async processWebhook(topic, payload) {
    try {
      logger.info(`Processing webhook: ${topic}`);
      
      switch (topic) {
        case 'products/create':
          return await this.handleProductCreate(payload);
        case 'products/update':
          return await this.handleProductUpdate(payload);
        case 'products/delete':
          return await this.handleProductDelete(payload);
        default:
          logger.warn(`Unknown webhook topic: ${topic}`);
          return null;
      }
    } catch (error) {
      logger.error(`Error processing webhook ${topic}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle product creation webhook
   */
  async handleProductCreate(payload) {
    const product = payload;
    logger.info(`Product created: ${product.title} (ID: ${product.id})`);
    
    // Check if product needs description generation
    if (!product.body_html || product.body_html.length < 100) {
      return {
        action: 'generate_description',
        productId: product.id,
        product: product
      };
    }
    
    return {
      action: 'skip',
      reason: 'Product already has description'
    };
  }

  /**
   * Handle product update webhook
   */
  async handleProductUpdate(payload) {
    const product = payload;
    logger.info(`Product updated: ${product.title} (ID: ${product.id})`);
    
    // Check if product needs description regeneration
    if (!product.body_html || 
        !product.body_html.includes('Verified by Gemmologist Reza Piroznia')) {
      return {
        action: 'generate_description',
        productId: product.id,
        product: product
      };
    }
    
    return {
      action: 'skip',
      reason: 'Product already has AI-generated description'
    };
  }

  /**
   * Handle product deletion webhook
   */
  async handleProductDelete(payload) {
    const product = payload;
    logger.info(`Product deleted: ${product.title} (ID: ${product.id})`);
    
    return {
      action: 'deleted',
      productId: product.id
    };
  }

  /**
   * Get shop information
   */
  async getShopInfo() {
    try {
      await this.applyRateLimit();
      
      const shop = await this.shopify.shop.get();
      logger.info(`Retrieved shop info: ${shop.name}`);
      return shop;
    } catch (error) {
      logger.error(`Error retrieving shop info: ${error.message}`);
      throw error;
    }
  }

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      const shop = await this.getShopInfo();
      logger.info('Shopify API connection successful');
      return {
        success: true,
        shop: shop
      };
    } catch (error) {
      logger.error(`Shopify API connection failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ShopifyService();
