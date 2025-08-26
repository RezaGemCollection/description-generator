#!/usr/bin/env node

require('dotenv').config();
const descriptionGenerator = require('../services/descriptionGenerator');
const shopifyService = require('../services/shopifyService');
const logger = require('../utils/logger');

/**
 * Command-line script to process multiple products in batch
 */
async function batchProcess() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const limit = args.find(arg => arg.startsWith('--limit='))?.split('=')[1] || 50;
    const dryRun = args.includes('--dry-run');
    const force = args.includes('--force');
    
    console.log(`Starting batch processing (limit: ${limit}, dry-run: ${dryRun})`);
    
    // Test connections first
    console.log('Testing connections...');
    const shopifyTest = await shopifyService.testConnection();
    
    if (!shopifyTest.success) {
      console.error('Shopify connection failed:', shopifyTest.error);
      process.exit(1);
    }
    
    console.log('✓ Connections successful');
    
    // Get products needing description
    console.log('Finding products that need description generation...');
    const products = await shopifyService.getProductsNeedingDescription(limit);
    
    if (products.length === 0) {
      console.log('✓ No products found that need description generation');
      process.exit(0);
    }
    
    console.log(`Found ${products.length} products needing description generation`);
    
    // Show products that will be processed
    console.log('\nProducts to be processed:');
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.title} (ID: ${product.id})`);
    });
    
    if (dryRun) {
      console.log('\n✓ Dry run completed - no changes made');
      process.exit(0);
    }
    
    // Confirm before proceeding
    if (!force) {
      console.log('\nPress Ctrl+C to cancel or any key to continue...');
      await new Promise(resolve => {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.once('data', () => {
          process.stdin.setRawMode(false);
          resolve();
        });
      });
    }
    
    // Process products
    console.log('\nStarting batch processing...');
    const startTime = Date.now();
    
    const results = await descriptionGenerator.processBatch(products);
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    // Display results
    console.log('\n=== Batch Processing Results ===');
    console.log(`Duration: ${duration} seconds`);
    console.log(`Total processed: ${results.length}`);
    
    const successful = results.filter(r => r.status === 'success').length;
    const errors = results.filter(r => r.status === 'error').length;
    const skipped = results.filter(r => r.status === 'already_generated').length;
    
    console.log(`✓ Successful: ${successful}`);
    console.log(`✗ Errors: ${errors}`);
    console.log(`⚠ Skipped: ${skipped}`);
    
    // Show successful products
    if (successful > 0) {
      console.log('\nSuccessfully processed:');
      results.filter(r => r.status === 'success').forEach(result => {
        console.log(`✓ ${result.product.title} (ID: ${result.productId})`);
      });
    }
    
    // Show errors
    if (errors > 0) {
      console.log('\nErrors:');
      results.filter(r => r.status === 'error').forEach(result => {
        console.log(`✗ Product ID ${result.productId}: ${result.error}`);
      });
    }
    
    // Show statistics
    console.log('\n=== Statistics ===');
    const stats = await descriptionGenerator.getStatistics();
    console.log(`Total products: ${stats.total}`);
    console.log(`With AI descriptions: ${stats.withAIDescription}`);
    console.log(`Without AI descriptions: ${stats.withoutAIDescription}`);
    console.log(`Currently processing: ${stats.processing}`);
    
    console.log('\n✓ Batch processing completed');
    
  } catch (error) {
    console.error('Script error:', error.message);
    logger.error('Batch process script error:', error);
    process.exit(1);
  }
}

// Run the script
batchProcess();
