const Shopify = require('shopify-api-node');
const shopifyConfig = require('../../config/shopify-config');
const VariantParser = require('../utils/variantParser');
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
    
    // Check if variants have changed by comparing with previous state
    const hasVariantChanges = await VariantParser.detectVariantChanges(product);
    
    // Check if product needs description generation or variant update
    if (!product.body_html || !product.body_html.includes('Verified by Gemmologist Reza Piroznia')) {
      const reason = 'Product needs description';
      logger.info(`Product ${product.id} needs description generation: ${reason}`);
      
      return {
        action: 'generate_description',
        productId: product.id,
        product: product,
        reason: reason
      };
    } else if (hasVariantChanges) {
      const reason = 'Variants changed';
      logger.info(`Product ${product.id} needs variant update: ${reason}`);
      
      return {
        action: 'update_variants',
        productId: product.id,
        product: product,
        reason: reason
      };
    }
    
    return {
      action: 'skip',
      reason: 'Product already has AI-generated description and no variant changes'
    };
  }

  /**
   * Detect if product variants have changed
   */
  async detectVariantChanges(product) {
    try {
      // Get the current product from Shopify to compare variants
      const currentProduct = await this.getProduct(product.id);
      
      if (!currentProduct) {
        logger.warn(`Could not fetch current product ${product.id} for variant comparison`);
        return false;
      }

      // Log the product data for debugging
      logger.info(`Current product variants: ${JSON.stringify(currentProduct.variants?.map(v => ({ id: v.id, title: v.title, option1: v.option1, option2: v.option2 })))}`);
      logger.info(`Webhook product variants: ${JSON.stringify(product.variants?.map(v => ({ id: v.id, title: v.title, option1: v.option1, option2: v.option2 })))}`);

      // Use VariantParser to detect changes
      const changeResult = VariantParser.detectVariantChanges(currentProduct, product);
      
      if (changeResult.hasChanges) {
        logger.info(`Variant changes detected for product ${product.id}: ${changeResult.details}`);
      } else {
        logger.info(`No variant changes detected for product ${product.id}`);
      }
      
      return changeResult.hasChanges;
    } catch (error) {
      logger.error(`Error detecting variant changes for product ${product.id}: ${error.message}`);
      // If we can't determine if variants changed, assume they did to be safe
      return true;
    }
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

  /**
   * Update only the variants bullet point in existing description
   */
  async updateVariantsInDescription(productId) {
    try {
      await this.applyRateLimit();
      
      // Get the current product
      const product = await this.getProduct(productId);
      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      // Check if product has AI-generated description
      if (!product.body_html || !product.body_html.includes('Verified by Gemmologist Reza Piroznia')) {
        logger.warn(`Product ${productId} does not have AI-generated description, skipping variant update`);
        return { status: 'skipped', reason: 'No AI-generated description found' };
      }

      // Format current variants
      const formattedVariants = VariantParser.formatVariantsForDescription(product.variants, product.options);
      
      // Update the variants bullet point in the description
      const updatedDescription = this.updateVariantsBulletPoint(product.body_html, formattedVariants);
      
      // Update the product with the modified description
      const updateData = {
        id: productId,
        body_html: updatedDescription
      };

      const updatedProduct = await this.shopify.product.update(productId, updateData);
      logger.info(`Updated variants in description for product: ${updatedProduct.title} (ID: ${productId})`);
      
      return {
        status: 'success',
        product: updatedProduct,
        updatedVariants: formattedVariants
      };

    } catch (error) {
      logger.error(`Error updating variants in description for product ${productId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update the variants bullet point in existing HTML description
   */
  updateVariantsBulletPoint(htmlDescription, formattedVariants) {
    try {
      // If no meaningful variants, remove the variants bullet point entirely
      if (!formattedVariants || formattedVariants === 'Standard' || formattedVariants.trim() === '') {
        // Remove ALL bullet points that contain "Available Variants"
        return htmlDescription.replace(/<li>\s*<strong>Available Variants:<\/strong>.*?<\/li>\s*/g, '');
      }

      // Create the new variants bullet point
      const newVariantsBullet = `<li>\n<strong>Available Variants:</strong> ${formattedVariants}</li>`;

      // Check if there's already a variants bullet point
      if (htmlDescription.includes('<strong>Available Variants:</strong>')) {
        // Replace ALL existing variants bullet points with the new one
        return htmlDescription.replace(
          /<li>\s*<strong>Available Variants:<\/strong>.*?<\/li>/g,
          newVariantsBullet
        );
      } else {
        // Insert new variants bullet point after the first <ul> tag
        return htmlDescription.replace(
          /(<ul>)/,
          `$1\n  ${newVariantsBullet}`
        );
      }

    } catch (error) {
      logger.error(`Error updating variants bullet point: ${error.message}`);
      return htmlDescription; // Return original if update fails
    }
  }
}

module.exports = new ShopifyService();
