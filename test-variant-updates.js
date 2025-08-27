#!/usr/bin/env node

require('dotenv').config();
const VariantParser = require('./src/utils/variantParser');
const logger = require('./src/utils/logger');

/**
 * Test script to demonstrate variant change detection
 */
function testVariantChangeDetection() {
  console.log('🧪 Testing Variant Change Detection\n');

  // Test Case 1: No changes
  console.log('Test Case 1: No variant changes');
  const product1 = {
    id: 123,
    title: 'Test Ring',
    variants: [
      { id: 1, title: 'Small', option1: 'Small', option2: 'Gold' },
      { id: 2, title: 'Medium', option1: 'Medium', option2: 'Gold' }
    ],
    options: [
      { name: 'Size', values: ['Small', 'Medium'] },
      { name: 'Material', values: ['Gold'] }
    ]
  };

  const product1Updated = {
    id: 123,
    title: 'Test Ring',
    variants: [
      { id: 1, title: 'Small', option1: 'Small', option2: 'Gold' },
      { id: 2, title: 'Medium', option1: 'Medium', option2: 'Gold' }
    ],
    options: [
      { name: 'Size', values: ['Small', 'Medium'] },
      { name: 'Material', values: ['Gold'] }
    ]
  };

  const result1 = VariantParser.detectVariantChanges(product1, product1Updated);
  console.log(`Result: ${result1.hasChanges ? '❌ Changes detected' : '✅ No changes'}`);
  console.log(`Details: ${result1.details}\n`);

  // Test Case 2: Variant count change
  console.log('Test Case 2: Variant count change');
  const product2 = {
    id: 124,
    title: 'Test Necklace',
    variants: [
      { id: 3, title: 'Small', option1: 'Small', option2: 'Silver' }
    ],
    options: [
      { name: 'Size', values: ['Small'] },
      { name: 'Material', values: ['Silver'] }
    ]
  };

  const product2Updated = {
    id: 124,
    title: 'Test Necklace',
    variants: [
      { id: 3, title: 'Small', option1: 'Small', option2: 'Silver' },
      { id: 4, title: 'Large', option1: 'Large', option2: 'Silver' }
    ],
    options: [
      { name: 'Size', values: ['Small', 'Large'] },
      { name: 'Material', values: ['Silver'] }
    ]
  };

  const result2 = VariantParser.detectVariantChanges(product2, product2Updated);
  console.log(`Result: ${result2.hasChanges ? '❌ Changes detected' : '✅ No changes'}`);
  console.log(`Details: ${result2.details}\n`);

  // Test Case 3: Option value change
  console.log('Test Case 3: Option value change');
  const product3 = {
    id: 125,
    title: 'Test Bracelet',
    variants: [
      { id: 5, title: 'Small - Gold', option1: 'Small', option2: 'Gold' },
      { id: 6, title: 'Medium - Gold', option1: 'Medium', option2: 'Gold' }
    ],
    options: [
      { name: 'Size', values: ['Small', 'Medium'] },
      { name: 'Material', values: ['Gold'] }
    ]
  };

  const product3Updated = {
    id: 125,
    title: 'Test Bracelet',
    variants: [
      { id: 5, title: 'Small - Platinum', option1: 'Small', option2: 'Platinum' },
      { id: 6, title: 'Medium - Platinum', option1: 'Medium', option2: 'Platinum' }
    ],
    options: [
      { name: 'Size', values: ['Small', 'Medium'] },
      { name: 'Material', values: ['Platinum'] }
    ]
  };

  const result3 = VariantParser.detectVariantChanges(product3, product3Updated);
  console.log(`Result: ${result3.hasChanges ? '❌ Changes detected' : '✅ No changes'}`);
  console.log(`Details: ${result3.details}\n`);

  // Test Case 4: Option name change
  console.log('Test Case 4: Option name change');
  const product4 = {
    id: 126,
    title: 'Test Earrings',
    variants: [
      { id: 7, title: 'Small - Gold', option1: 'Small', option2: 'Gold' }
    ],
    options: [
      { name: 'Size', values: ['Small'] },
      { name: 'Material', values: ['Gold'] }
    ]
  };

  const product4Updated = {
    id: 126,
    title: 'Test Earrings',
    variants: [
      { id: 7, title: 'Small - Gold', option1: 'Small', option2: 'Gold' }
    ],
    options: [
      { name: 'Dimensions', values: ['Small'] },
      { name: 'Material', values: ['Gold'] }
    ]
  };

  const result4 = VariantParser.detectVariantChanges(product4, product4Updated);
  console.log(`Result: ${result4.hasChanges ? '❌ Changes detected' : '✅ No changes'}`);
  console.log(`Details: ${result4.details}\n`);

  console.log('🎯 Variant Change Detection Test Complete!');
}

/**
 * Test variant formatting
 */
function testVariantFormatting() {
  console.log('🧪 Testing Variant Formatting\n');

  const VariantParser = require('./src/utils/variantParser');

  // Test Case 1: Product with meaningful variants
  console.log('Test Case 1: Product with meaningful variants');
  const product1 = {
    variants: [
      { id: 1, title: 'Small - Gold', option1: 'Small', option2: 'Gold' },
      { id: 2, title: 'Medium - Gold', option1: 'Medium', option2: 'Gold' },
      { id: 3, title: 'Large - Gold', option1: 'Large', option2: 'Gold' }
    ],
    options: [
      { name: 'Size', values: ['Small', 'Medium', 'Large'] },
      { name: 'Material', values: ['Gold'] }
    ]
  };

  const formatted1 = VariantParser.formatVariantsForDescription(product1.variants, product1.options);
  console.log(`Formatted variants: ${formatted1}\n`);

  // Test Case 2: Product with "Default Title" variants
  console.log('Test Case 2: Product with "Default Title" variants');
  const product2 = {
    variants: [
      { id: 4, title: 'Default Title', option1: 'Default Title', option2: null }
    ],
    options: [
      { name: 'Title', values: ['Default Title'] }
    ]
  };

  const formatted2 = VariantParser.formatVariantsForDescription(product2.variants, product2.options);
  console.log(`Formatted variants: ${formatted2}\n`);

  // Test Case 3: Product with no variants
  console.log('Test Case 3: Product with no variants');
  const product3 = {
    variants: [],
    options: []
  };

  const formatted3 = VariantParser.formatVariantsForDescription(product3.variants, product3.options);
  console.log(`Formatted variants: ${formatted3}\n`);

  console.log('🎯 Variant Formatting Test Complete!');
}

// Run tests
if (require.main === module) {
  console.log('🚀 Starting Variant Update Tests\n');
  
  testVariantChangeDetection();
  console.log('\n' + '='.repeat(50) + '\n');
  testVariantFormatting();
  
  console.log('\n✨ All tests completed!');
}
