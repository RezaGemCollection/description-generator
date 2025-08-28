#!/usr/bin/env node

require('dotenv').config();
const shopifyService = require('../services/shopifyService');
const BarcodeGenerator = require('../utils/barcodeGenerator');
const logger = require('../utils/logger');

/**
 * Command-line script to add barcodes to product variants
 */
async function addBarcodesToProduct() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const productId = args.find(arg => arg.startsWith('--product-id='))?.split('=')[1];
    const prefix = args.find(arg => arg.startsWith('--prefix='))?.split('=')[1] || 'GEM';
    const useEAN13 = args.includes('--ean13');
    const force = args.includes('--force');
    
    if (!productId) {
      console.error('Usage: node addBarcodesToProduct.js --product-id=123456789 [--prefix=GEM] [--ean13] [--force]');
      console.error('');
      console.error('Options:');
      console.error('  --product-id=<id>  Product ID to add barcodes to');
      console.error('  --prefix=<prefix>   Barcode prefix (default: GEM)');
      console.error('  --ean13            Use EAN-13 format instead of custom format');
      console.error('  --force            Force update even if barcodes already exist');
      process.exit(1);
    }

    console.log(`🔍 Processing product ID: ${productId}`);
    console.log(`🏷️  Using prefix: ${prefix}`);
    console.log(`📊 Barcode format: ${useEAN13 ? 'EAN-13' : 'Custom'}`);
    
    // Test connections first
    console.log('🔗 Testing connections...');
    const shopifyTest = await shopifyService.testConnection();
    
    if (!shopifyTest.success) {
      console.error('❌ Shopify connection failed:', shopifyTest.error);
      process.exit(1);
    }
    
    console.log('✅ Connections successful');
    
    // Get product details
    console.log('📦 Fetching product details...');
    const product = await shopifyService.getProduct(productId);
    
    if (!product) {
      console.error(`❌ Product ${productId} not found`);
      process.exit(1);
    }
    
    console.log(`✅ Found product: ${product.title}`);
    console.log(`📋 Variants count: ${product.variants?.length || 0}`);
    
    // Check if variants already have barcodes
    const variantsWithBarcodes = product.variants?.filter(variant => variant.barcode) || [];
    const variantsWithoutBarcodes = product.variants?.filter(variant => !variant.barcode) || [];
    
    if (variantsWithBarcodes.length > 0 && !force) {
      console.log(`⚠️  ${variantsWithBarcodes.length} variants already have barcodes`);
      console.log('Use --force flag to regenerate barcodes');
      
      console.log('\n📊 Current barcodes:');
      variantsWithBarcodes.forEach(variant => {
        console.log(`   ${variant.title}: ${variant.barcode}`);
      });
      
      if (variantsWithoutBarcodes.length > 0) {
        console.log(`\n📝 ${variantsWithoutBarcodes.length} variants need barcodes:`);
        variantsWithoutBarcodes.forEach(variant => {
          console.log(`   ${variant.title}: No barcode`);
        });
      }
      
      process.exit(0);
    }
    
    // Generate barcodes for variants
    console.log('\n🏷️  Generating barcodes...');
    const updatedVariants = [];
    
    for (const variant of product.variants) {
      let barcode;
      
      if (useEAN13) {
        barcode = BarcodeGenerator.generateEAN13Barcode(product, variant);
      } else {
        // Check if variant already has a valid barcode
        if (variant.barcode && BarcodeGenerator.validateBarcode(variant.barcode, prefix) && !force) {
          barcode = variant.barcode;
          console.log(`   ✅ ${variant.title}: ${barcode} (existing)`);
        } else {
          barcode = BarcodeGenerator.generateUniqueBarcode(product, variant, updatedVariants, prefix);
          console.log(`   🆕 ${variant.title}: ${barcode}`);
        }
      }
      
      updatedVariants.push({
        ...variant,
        barcode: barcode
      });
    }
    
    // Update product with new barcodes
    console.log('\n💾 Updating product with barcodes...');
    const updateData = {
      id: productId,
      variants: updatedVariants
    };
    
    const updatedProduct = await shopifyService.updateProductVariants(productId, updateData);
    
    if (updatedProduct) {
      console.log('✅ Product updated successfully');
      
      console.log('\n📊 Final barcode summary:');
      updatedProduct.variants.forEach(variant => {
        console.log(`   ${variant.title}: ${variant.barcode}`);
      });
      
      // Validate all barcodes
      console.log('\n🔍 Validating barcodes...');
      let validCount = 0;
      let invalidCount = 0;
      
             updatedProduct.variants.forEach(variant => {
         const isValid = useEAN13 ? 
           BarcodeGenerator.validateEAN13Barcode(variant.barcode) :
           BarcodeGenerator.validateBarcode(variant.barcode, prefix);
         
         if (isValid) {
           validCount++;
         } else {
           invalidCount++;
           console.log(`   ❌ Invalid barcode: ${variant.title} - ${variant.barcode}`);
         }
       });
      
      console.log(`✅ ${validCount} valid barcodes`);
      if (invalidCount > 0) {
        console.log(`❌ ${invalidCount} invalid barcodes`);
      }
      
    } else {
      console.error('❌ Failed to update product');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
    logger.error('Add barcodes script error:', error);
    process.exit(1);
  }
}

/**
 * Batch process multiple products to add barcodes
 */
async function batchAddBarcodes() {
  try {
    const args = process.argv.slice(2);
    const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1]) || 10;
    const prefix = args.find(arg => arg.startsWith('--prefix='))?.split('=')[1] || 'GEM';
    const useEAN13 = args.includes('--ean13');
    const force = args.includes('--force');
    
    console.log(`🔄 Batch processing up to ${limit} products`);
    console.log(`🏷️  Using prefix: ${prefix}`);
    console.log(`📊 Barcode format: ${useEAN13 ? 'EAN-13' : 'Custom'}`);
    
    // Get products that need barcodes
    console.log('📋 Fetching products...');
    const products = await shopifyService.getProducts({ limit: limit * 2 }); // Get more to filter
    
    if (!products || products.length === 0) {
      console.log('❌ No products found');
      return;
    }
    
    // Filter products that need barcodes
    const productsNeedingBarcodes = products.filter(product => {
      if (!product.variants || product.variants.length === 0) return false;
      
      if (force) return true; // Force update all
      
      // Check if any variant is missing barcode
      return product.variants.some(variant => !variant.barcode);
    }).slice(0, limit);
    
    console.log(`📦 Found ${productsNeedingBarcodes.length} products needing barcodes`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < productsNeedingBarcodes.length; i++) {
      const product = productsNeedingBarcodes[i];
      console.log(`\n[${i + 1}/${productsNeedingBarcodes.length}] Processing: ${product.title} (ID: ${product.id})`);
      
      try {
        // Generate barcodes for this product
        const updatedVariants = [];
        
        for (const variant of product.variants) {
          let barcode;
          
          if (useEAN13) {
            barcode = BarcodeGenerator.generateEAN13Barcode(product, variant);
          } else {
            if (variant.barcode && BarcodeGenerator.validateBarcode(variant.barcode, prefix) && !force) {
              barcode = variant.barcode;
            } else {
              barcode = BarcodeGenerator.generateUniqueBarcode(product, variant, updatedVariants, prefix);
            }
          }
          
          updatedVariants.push({
            ...variant,
            barcode: barcode
          });
        }
        
        // Update product
        const updateData = {
          id: product.id,
          variants: updatedVariants
        };
        
        await shopifyService.updateProductVariants(product.id, updateData);
        console.log(`   ✅ Updated ${updatedVariants.length} variants`);
        successCount++;
        
        // Rate limiting between products
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`   ❌ Error processing product ${product.id}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Batch processing complete:`);
    console.log(`   ✅ Success: ${successCount} products`);
    console.log(`   ❌ Errors: ${errorCount} products`);
    
  } catch (error) {
    console.error('❌ Batch processing error:', error.message);
    logger.error('Batch add barcodes error:', error);
  }
}

// Check if this is a batch operation
if (process.argv.includes('--batch')) {
  batchAddBarcodes();
} else {
  addBarcodesToProduct();
}
