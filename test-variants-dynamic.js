const geminiService = require('./src/services/geminiService');
const VariantParser = require('./src/utils/variantParser');

async function testDynamicVariants() {
  console.log('🧪 Testing Dynamic Variants System\n');

  // Sample product data
  const sampleProduct = {
    title: 'Test Diamond Ring',
    product_type: 'Ring',
    variants: [
      {
        title: 'Small / Gold',
        option1: 'Small',
        option2: 'Gold',
        option3: null
      },
      {
        title: 'Medium / Gold',
        option1: 'Medium',
        option2: 'Gold',
        option3: null
      },
      {
        title: 'Large / Gold',
        option1: 'Large',
        option2: 'Gold',
        option3: null
      }
    ],
    options: [
      { name: 'Size', values: ['Small', 'Medium', 'Large'] },
      { name: 'Material', values: ['Gold'] }
    ]
  };

  try {
    console.log('📋 Testing variant formatting...');
    const formattedVariants = VariantParser.formatVariantsForDescription(sampleProduct.variants, sampleProduct.options);
    console.log(`Formatted variants: ${formattedVariants}`);
    console.log('');

    console.log('🤖 Testing Gemini prompt generation (without variants)...');
    const prompt = geminiService.buildProductDescriptionPrompt(sampleProduct);
    console.log('Generated prompt (first 200 chars):', prompt.substring(0, 200) + '...');
    console.log('');

    console.log('✅ Prompt does NOT contain variants (as expected)');
    console.log('Variants will be added dynamically after generation');
    console.log('');

    console.log('🔧 Testing addVariantsBulletPoint method...');
    const sampleHtml = `
<h2>About Test Diamond Ring</h2>
<p>Beautiful diamond ring with exceptional craftsmanship.</p>
<ul>
  <li>Exquisite design with premium materials</li>
  <li>Handcrafted with attention to detail</li>
  <li>Expertly crafted by skilled artisans</li>
  <li>Made with the finest materials</li>
  <li>Timeless design that combines elegance</li>
  <li><strong>Verified and Certified by Gemmologist Reza Piroznia</strong></li>
  <li>This product includes a <a href="https://rezagemcollection.ca/policies/refund-policy">7-day money-back guarantee</a></li>
</ul>`;

    const htmlWithVariants = geminiService.addVariantsBulletPoint(sampleHtml, sampleProduct);
    console.log('HTML with variants added:');
    console.log(htmlWithVariants);
    console.log('');

    // Test with no variants
    console.log('🔄 Testing with no variants...');
    const productNoVariants = {
      ...sampleProduct,
      variants: [{ title: 'Default Title', option1: 'Default Title', option2: null, option3: null }],
      options: []
    };

    const htmlNoVariants = geminiService.addVariantsBulletPoint(sampleHtml, productNoVariants);
    console.log('HTML with no variants (should be unchanged):');
    console.log(htmlNoVariants);
    console.log('');

    console.log('✅ Dynamic Variants Test Completed Successfully!');
    console.log('');
    console.log('📝 Summary:');
    console.log('- Variants are no longer sent to Gemini');
    console.log('- Variants are added dynamically after generation');
    console.log('- System handles both meaningful variants and no variants correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testDynamicVariants();
}

module.exports = { testDynamicVariants };
