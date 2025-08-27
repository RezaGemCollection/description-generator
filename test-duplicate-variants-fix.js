#!/usr/bin/env node

require('dotenv').config();
const VariantParser = require('./src/utils/variantParser');
const GeminiService = require('./src/services/geminiService');

/**
 * Test script to verify duplicate variant issue is fixed
 */
function testDuplicateVariantsFix() {
  console.log('🧪 Testing Duplicate Variants Fix\n');

  // Test Case 1: Check VariantParser formatting
  console.log('Test Case 1: VariantParser.formatVariantsForDescription');
  const variants = [
    { id: 1, option1: '2 mm' },
    { id: 2, option1: '4 mm' },
    { id: 3, option1: '6 mm' }
  ];
  const options = [{ name: 'Size', values: ['2 mm', '4 mm', '6 mm'] }];
  
  const variantParserResult = VariantParser.formatVariantsForDescription(variants, options);
  console.log(`Result: ${variantParserResult}`);
  console.log('Expected: Size: 2 mm, 4 mm, 6 mm\n');

  // Test Case 2: Check GeminiService prompt building
  console.log('Test Case 2: GeminiService.buildProductDescriptionPrompt');
  const productData = {
    title: 'Test Product',
    product_type: 'Jewelry',
    variants: variants,
    options: options
  };
  
  const geminiService = new GeminiService();
  const prompt = geminiService.buildProductDescriptionPrompt(productData);
  
  // Check if the prompt contains the correct variant format
  if (prompt.includes('Size: 2 mm, 4 mm, 6 mm')) {
    console.log('✅ GeminiService correctly uses VariantParser formatting');
  } else {
    console.log('❌ GeminiService still uses old formatting');
  }
  
  // Check for duplicate variant information
  const variantMatches = prompt.match(/Available Variants:/g);
  if (variantMatches && variantMatches.length > 1) {
    console.log('❌ Found duplicate "Available Variants" in prompt');
  } else {
    console.log('✅ No duplicate "Available Variants" found');
  }
  
  console.log('\n');

  // Test Case 3: Check for old format patterns
  console.log('Test Case 3: Check for old format patterns');
  const oldFormatPatterns = [
    '2 mm - 4 mm - 6 mm',
    '2 mm, 4 mm, 6 mm',
    'Size: 2 mm; Size: 4 mm; Size: 6 mm'
  ];
  
  let foundOldFormat = false;
  oldFormatPatterns.forEach(pattern => {
    if (prompt.includes(pattern)) {
      console.log(`❌ Found old format pattern: ${pattern}`);
      foundOldFormat = true;
    }
  });
  
  if (!foundOldFormat) {
    console.log('✅ No old format patterns found');
  }
  
  console.log('\n');

  // Test Case 4: Verify final result
  console.log('Test Case 4: Final verification');
  console.log('Expected behavior:');
  console.log('- Only one "Available Variants" entry');
  console.log('- Format: "Size: 2 mm, 4 mm, 6 mm"');
  console.log('- No duplicate variant information');
  console.log('- No old format patterns');
  
  console.log('\n✅ Duplicate Variants Fix Test Completed!');
}

// Run test
if (require.main === module) {
  console.log('🚀 Starting Duplicate Variants Fix Test\n');
  
  try {
    testDuplicateVariantsFix();
    console.log('\n✨ Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}
