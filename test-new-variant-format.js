#!/usr/bin/env node

require('dotenv').config();
const VariantParser = require('./src/utils/variantParser');

/**
 * Test script to demonstrate the new grouped variant formatting
 */
function testNewVariantFormat() {
  console.log('🧪 Testing New Grouped Variant Format\n');

  // Test Case 1: Single option (Size only)
  console.log('Test Case 1: Size variants only');
  const sizeOnlyVariants = [
    { id: 1, option1: '2 mm' },
    { id: 2, option1: '4 mm' },
    { id: 3, option1: '6 mm' },
    { id: 4, option1: '8 mm' },
    { id: 5, option1: '10 mm' }
  ];
  const sizeOnlyOptions = [{ name: 'Size', values: ['2 mm', '4 mm', '6 mm', '8 mm', '10 mm'] }];
  
  const sizeOnlyResult = VariantParser.formatVariantsForDescription(sizeOnlyVariants, sizeOnlyOptions);
  console.log(`Result: ${sizeOnlyResult}`);
  console.log('Expected: Size: 2 mm, 4 mm, 6 mm, 8 mm, 10 mm\n');

  // Test Case 2: Two options (Size and Color)
  console.log('Test Case 2: Size and Color variants');
  const sizeColorVariants = [
    { id: 1, option1: '2 mm', option2: 'Red' },
    { id: 2, option1: '4 mm', option2: 'Red' },
    { id: 3, option1: '6 mm', option2: 'Red' },
    { id: 4, option1: '2 mm', option2: 'Blue' },
    { id: 5, option1: '4 mm', option2: 'Blue' },
    { id: 6, option1: '6 mm', option2: 'Blue' },
    { id: 7, option1: '2 mm', option2: 'Yellow' },
    { id: 8, option1: '4 mm', option2: 'Yellow' },
    { id: 9, option1: '6 mm', option2: 'Yellow' }
  ];
  const sizeColorOptions = [
    { name: 'Size', values: ['2 mm', '4 mm', '6 mm'] },
    { name: 'Color', values: ['Red', 'Blue', 'Yellow'] }
  ];
  
  const sizeColorResult = VariantParser.formatVariantsForDescription(sizeColorVariants, sizeColorOptions);
  console.log(`Result: ${sizeColorResult}`);
  console.log('Expected: Size: 2 mm, 4 mm, 6 mm; Color: Red, Blue, Yellow\n');

  // Test Case 3: Three options (Size, Color, Material)
  console.log('Test Case 3: Size, Color, and Material variants');
  const threeOptionVariants = [
    { id: 1, option1: 'Small', option2: 'Red', option3: 'Gold' },
    { id: 2, option1: 'Medium', option2: 'Red', option3: 'Gold' },
    { id: 3, option1: 'Small', option2: 'Blue', option3: 'Gold' },
    { id: 4, option1: 'Medium', option2: 'Blue', option3: 'Gold' },
    { id: 5, option1: 'Small', option2: 'Red', option3: 'Silver' },
    { id: 6, option1: 'Medium', option2: 'Red', option3: 'Silver' },
    { id: 7, option1: 'Small', option2: 'Blue', option3: 'Silver' },
    { id: 8, option1: 'Medium', option2: 'Blue', option3: 'Silver' }
  ];
  const threeOptionOptions = [
    { name: 'Size', values: ['Small', 'Medium'] },
    { name: 'Color', values: ['Red', 'Blue'] },
    { name: 'Material', values: ['Gold', 'Silver'] }
  ];
  
  const threeOptionResult = VariantParser.formatVariantsForDescription(threeOptionVariants, threeOptionOptions);
  console.log(`Result: ${threeOptionResult}`);
  console.log('Expected: Size: Small, Medium; Color: Red, Blue; Material: Gold, Silver\n');

  // Test Case 4: No variants (Standard product)
  console.log('Test Case 4: No variants (Standard product)');
  const noVariants = [];
  const noOptions = [];
  
  const noVariantsResult = VariantParser.formatVariantsForDescription(noVariants, noOptions);
  console.log(`Result: ${noVariantsResult}`);
  console.log('Expected: Standard\n');

  // Test Case 5: Variants with "Default Title"
  console.log('Test Case 5: Variants with "Default Title" (should be filtered out)');
  const defaultTitleVariants = [
    { id: 1, option1: 'Default Title' },
    { id: 2, option1: 'Small' },
    { id: 3, option1: 'Medium' }
  ];
  const defaultTitleOptions = [{ name: 'Size', values: ['Default Title', 'Small', 'Medium'] }];
  
  const defaultTitleResult = VariantParser.formatVariantsForDescription(defaultTitleVariants, defaultTitleOptions);
  console.log(`Result: ${defaultTitleResult}`);
  console.log('Expected: Size: Small, Medium\n');

  console.log('✅ New Variant Format Test Completed!');
}

// Run test
if (require.main === module) {
  console.log('🚀 Starting New Variant Format Test\n');
  
  try {
    testNewVariantFormat();
    console.log('\n✨ Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}
