const geminiService = require('./geminiService');
const shopifyService = require('./shopifyService');
const logger = require('../utils/logger');

class DescriptionGenerator {
  constructor() {
    this.processingQueue = new Map();
    this.maxConcurrent = 3;
    this.currentProcessing = 0;
  }

  /**
   * Generate description for a single product
   */
  async generateProductDescription(productId) {
    try {
      // Check if already processing
      if (this.processingQueue.has(productId)) {
        logger.warn(`Product ${productId} is already being processed`);
        return { status: 'already_processing' };
      }

      // Add to processing queue
      this.processingQueue.set(productId, { status: 'processing', startTime: Date.now() });

      // Get product data from Shopify
      const product = await shopifyService.getProduct(productId);
      
      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      // Check if product already has AI-generated description
      if (this.hasAIGeneratedDescription(product)) {
        logger.info(`Product ${productId} already has AI-generated description`);
        this.processingQueue.delete(productId);
        return { status: 'already_generated' };
      }

      // Generate content using Gemini AI
      const content = await geminiService.generateAllContent(product);

      // Validate generated content
      this.validateGeneratedContent(content);

      // Update product in Shopify
      const updatedProduct = await shopifyService.updateProduct(productId, content);

      // Remove from processing queue
      this.processingQueue.delete(productId);

      logger.info(`Successfully generated and updated description for product: ${product.title}`);
      
      return {
        status: 'success',
        product: updatedProduct,
        content: content
      };

    } catch (error) {
      // Remove from processing queue on error
      this.processingQueue.delete(productId);
      
      logger.error(`Error generating description for product ${productId}: ${error.message}`);
      
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Process multiple products in batch
   */
  async processBatch(products, maxConcurrent = this.maxConcurrent) {
    const results = [];
    const chunks = this.chunkArray(products, maxConcurrent);

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(product => 
        this.generateProductDescription(product.id)
      );

      const chunkResults = await Promise.allSettled(chunkPromises);
      
      chunkResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push({
            productId: chunk[index].id,
            ...result.value
          });
        } else {
          results.push({
            productId: chunk[index].id,
            status: 'error',
            error: result.reason.message
          });
        }
      });

      // Add delay between chunks to respect rate limits
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return results;
  }

  /**
   * Process products that need description generation
   */
  async processProductsNeedingDescription(limit = 50) {
    try {
      const products = await shopifyService.getProductsNeedingDescription(limit);
      
      if (products.length === 0) {
        logger.info('No products found that need description generation');
        return { processed: 0, results: [] };
      }

      logger.info(`Processing ${products.length} products that need description generation`);
      
      const results = await this.processBatch(products);
      
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      logger.info(`Batch processing completed: ${successCount} successful, ${errorCount} errors`);
      
      return {
        processed: products.length,
        successful: successCount,
        errors: errorCount,
        results: results
      };

    } catch (error) {
      logger.error(`Error processing products needing description: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle webhook-triggered description generation
   */
  async handleWebhookTrigger(webhookData) {
    try {
      const { action, productId, product } = webhookData;
      
      if (action === 'generate_description') {
        logger.info(`Webhook triggered description generation for product ${productId}`);
        
        // Use product data from webhook if available, otherwise fetch from Shopify
        if (product) {
          return await this.generateDescriptionFromData(product);
        } else {
          return await this.generateProductDescription(productId);
        }
      }
      
      return { status: 'skipped', reason: action };

    } catch (error) {
      logger.error(`Error handling webhook trigger: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate description from product data (for webhook processing)
   */
  async generateDescriptionFromData(product) {
    try {
      // Check if product already has AI-generated description
      if (this.hasAIGeneratedDescription(product)) {
        return { status: 'already_generated' };
      }

      // Generate content using Gemini AI
      const content = await geminiService.generateAllContent(product);

      // Validate generated content
      this.validateGeneratedContent(content);

      // Update product in Shopify
      const updatedProduct = await shopifyService.updateProduct(product.id, content);

      logger.info(`Webhook: Successfully generated and updated description for product: ${product.title}`);
      
      return {
        status: 'success',
        product: updatedProduct,
        content: content
      };

    } catch (error) {
      logger.error(`Error generating description from webhook data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if product already has AI-generated description
   */
  hasAIGeneratedDescription(product) {
    return product.body_html && 
           product.body_html.includes('Verified by Gemmologist Reza Piroznia') &&
           product.body_html.includes('<h2>') &&
           product.body_html.includes('<ul>');
  }

  /**
   * Validate generated content
   */
  validateGeneratedContent(content) {
    if (!content.description) {
      throw new Error('Generated description is empty');
    }

    if (!content.metaTitle) {
      throw new Error('Generated meta title is empty');
    }

    if (!content.metaDescription) {
      throw new Error('Generated meta description is empty');
    }

    // Validate description structure (this can throw errors for missing required elements)
    geminiService.validateDescription(content.description);
    
    // These now only log warnings, not throw errors
    geminiService.validateMetaTitle(content.metaTitle);
    geminiService.validateMetaDescription(content.metaDescription);
  }

  /**
   * Get processing status for a product
   */
  getProcessingStatus(productId) {
    return this.processingQueue.get(productId) || { status: 'not_processing' };
  }

  /**
   * Get all processing statuses
   */
  getAllProcessingStatuses() {
    const statuses = {};
    for (const [productId, status] of this.processingQueue) {
      statuses[productId] = status;
    }
    return statuses;
  }

  /**
   * Clear processing queue
   */
  clearProcessingQueue() {
    this.processingQueue.clear();
    logger.info('Processing queue cleared');
  }

  /**
   * Split array into chunks
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Test description generation with sample data
   */
  async testGeneration(sampleProductData) {
    try {
      logger.info('Testing description generation with sample data');
      
      const content = await geminiService.generateAllContent(sampleProductData);
      
      // Skip validation for test - just log warnings
      try {
        this.validateGeneratedContent(content);
      } catch (validationError) {
        logger.warn(`Validation warning: ${validationError.message}`);
        // Continue with generation even if validation fails
      }
      
      logger.info('Test generation successful');
      
      return {
        status: 'success',
        content: content
      };

    } catch (error) {
      logger.error(`Test generation failed: ${error.message}`);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Get statistics about processed products
   */
  async getStatistics() {
    try {
      const allProducts = await shopifyService.getAllProducts(250);
      
      const stats = {
        total: allProducts.length,
        withAIDescription: 0,
        withoutAIDescription: 0,
        processing: this.processingQueue.size
      };

      allProducts.forEach(product => {
        if (this.hasAIGeneratedDescription(product)) {
          stats.withAIDescription++;
        } else {
          stats.withoutAIDescription++;
        }
      });

      return stats;

    } catch (error) {
      logger.error(`Error getting statistics: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new DescriptionGenerator();
