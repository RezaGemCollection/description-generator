#!/usr/bin/env node

require('dotenv').config();
const descriptionGenerator = require('../services/descriptionGenerator');
const shopifyService = require('../services/shopifyService');
const logger = require('../utils/logger');

/**
 * Command-line script to process a single product
 */
async function processProduct() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const productId = args.find(arg => arg.startsWith('--product-id='))?.split('=')[1];
    
    if (!productId) {
      console.error('Usage: node processProduct.js --product-id=123456789');
      process.exit(1);
    }

    console.log(`Processing product ID: ${productId}`);
    
    // Test connections first
    console.log('Testing connections...');
    const shopifyTest = await shopifyService.testConnection();
    
    if (!shopifyTest.success) {
      console.error('Shopify connection failed:', shopifyTest.error);
      process.exit(1);
    }
    
    console.log('✓ Connections successful');
    
    // Get product details
    console.log('Fetching product details...');
    const product = await shopifyService.getProduct(productId);
    
    if (!product) {
      console.error(`Product ${productId} not found`);
      process.exit(1);
    }
    
    console.log(`✓ Found product: ${product.title}`);
    
    // Check if product already has AI-generated description
    if (descriptionGenerator.hasAIGeneratedDescription(product)) {
      console.log('⚠ Product already has AI-generated description');
      console.log('Use --force flag to regenerate');
      
      if (!args.includes('--force')) {
        process.exit(0);
      }
    }
    
    // Generate description
    console.log('Generating product description...');
    const result = await descriptionGenerator.generateProductDescription(productId);
    
    if (result.status === 'success') {
      console.log('✓ Description generated successfully');
      console.log(`Product: ${result.product.title}`);
      console.log(`Meta Title: ${result.content.metaTitle}`);
      console.log(`Meta Description: ${result.content.metaDescription}`);
      console.log(`Description Length: ${result.content.description.length} characters`);
    } else {
      console.error('✗ Description generation failed:', result.error);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Script error:', error.message);
    logger.error('Process product script error:', error);
    process.exit(1);
  }
}

// Run the script
processProduct();
