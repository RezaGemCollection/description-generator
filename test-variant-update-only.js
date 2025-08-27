#!/usr/bin/env node

require('dotenv').config();
const shopifyService = require('./src/services/shopifyService');

/**
 * Test script to demonstrate variant-only updates
 */
async function testVariantUpdateOnly() {
  console.log('🧪 Testing Variant-Only Update System\n');

  // Sample product with existing AI-generated description
  const sampleProduct = {
    id: 123,
    title: 'Test Ring',
    body_html: `
<h2>About Test Ring</h2>
<p>This beautiful ring features exquisite craftsmanship and premium materials.</p>
<ul>
  <li><strong>Available Variants:</strong> Size: Small, Material: Gold</li>
  <li>Premium quality gemstone with excellent clarity</li>
  <li>Handcrafted by skilled artisans</li>
  <li>Made with 14k gold for durability</li>
  <li>Perfect for special occasions</li>
  <li>Includes certificate of authenticity</li>
  <li><strong>Verified by Gemmologist Reza Piroznia</strong></li>
  <li>This product has <a href="https://rezagemcollection.ca/policies/refund-policy">7 days refund</a></li>
</ul>`,
    variants: [
      { id: 1, title: 'Small - Gold', option1: 'Small', option2: 'Gold' },
      { id: 2, title: 'Medium - Gold', option1: 'Medium', option2: 'Gold' }
    ],
    options: [
      { name: 'Size', values: ['Small', 'Medium'] },
      { name: 'Material', values: ['Gold'] }
    ]
  };

  console.log('📝 Original Description:');
  console.log(sampleProduct.body_html);
  console.log('\n' + '='.repeat(80) + '\n');

  // Test updating variants
  console.log('🔄 Updating variants to include Large size...');
  
  // Simulate variant change
  const updatedProduct = {
    ...sampleProduct,
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

  // Test the variant update function
  try {
    const updatedDescription = shopifyService.updateVariantsBulletPoint(
      sampleProduct.body_html, 
      'Size: Small, Material: Gold; Size: Medium, Material: Gold; Size: Large, Material: Gold'
    );

    console.log('📝 Updated Description:');
    console.log(updatedDescription);
    console.log('\n' + '='.repeat(80) + '\n');

    // Test removing variants
    console.log('🔄 Removing variants (setting to Standard)...');
    const noVariantsDescription = shopifyService.updateVariantsBulletPoint(
      updatedDescription, 
      'Standard'
    );

    console.log('📝 Description with no variants:');
    console.log(noVariantsDescription);
    console.log('\n' + '='.repeat(80) + '\n');

    // Test adding variants back
    console.log('🔄 Adding variants back...');
    const finalDescription = shopifyService.updateVariantsBulletPoint(
      noVariantsDescription, 
      'Size: Small, Material: Gold; Size: Medium, Material: Gold'
    );

    console.log('📝 Final Description:');
    console.log(finalDescription);

    console.log('\n✅ Variant-Only Update Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test different scenarios
async function testVariantScenarios() {
  console.log('\n🧪 Testing Different Variant Scenarios\n');

  const scenarios = [
    {
      name: 'Adding new variant',
      original: 'Size: Small, Material: Gold',
      updated: 'Size: Small, Material: Gold; Size: Medium, Material: Gold'
    },
    {
      name: 'Changing material',
      original: 'Size: Small, Material: Gold',
      updated: 'Size: Small, Material: Platinum'
    },
    {
      name: 'Removing all variants',
      original: 'Size: Small, Material: Gold; Size: Medium, Material: Gold',
      updated: 'Standard'
    },
    {
      name: 'Adding multiple variants',
      original: 'Size: Small, Material: Gold',
      updated: 'Size: Small, Material: Gold; Size: Medium, Material: Gold; Size: Large, Material: Gold'
    }
  ];

  const sampleHtml = `
<h2>About Test Product</h2>
<p>Beautiful product description.</p>
<ul>
  <li><strong>Available Variants:</strong> Size: Small, Material: Gold</li>
  <li>Feature 1</li>
  <li>Feature 2</li>
  <li><strong>Verified by Gemmologist Reza Piroznia</strong></li>
  <li>This product has <a href="refund-url">7 days refund</a></li>
</ul>`;

  for (const scenario of scenarios) {
    console.log(`📋 Scenario: ${scenario.name}`);
    console.log(`   Original: ${scenario.original}`);
    console.log(`   Updated:  ${scenario.updated}`);
    
    try {
      const result = shopifyService.updateVariantsBulletPoint(sampleHtml, scenario.updated);
      const variantsLine = result.match(/<li><strong>Available Variants:<\/strong>.*?<\/li>/);
      
      if (variantsLine) {
        console.log(`   Result:   ${variantsLine[0].replace(/<[^>]*>/g, '')}`);
      } else {
        console.log(`   Result:   No variants bullet point (removed)`);
      }
    } catch (error) {
      console.log(`   Error:    ${error.message}`);
    }
    
    console.log('');
  }
}

// Run tests
if (require.main === module) {
  console.log('🚀 Starting Variant-Only Update Tests\n');
  
  testVariantUpdateOnly()
    .then(() => testVariantScenarios())
    .then(() => {
      console.log('\n✨ All tests completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Tests failed:', error);
      process.exit(1);
    });
}
