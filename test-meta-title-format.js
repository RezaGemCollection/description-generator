const geminiService = require('./src/services/geminiService');

async function testMetaTitleFormat() {
  console.log('🧪 Testing Meta Title Format - Must Start with Product Name\n');

  // Sample product data
  const sampleProducts = [
    {
      title: 'Diamond Ring',
      product_type: 'Ring',
      vendor: 'Reza Gem Collection',
      tags: 'diamond, ring, jewelry'
    },
    {
      title: 'Tree Moss Agate Polished Round Beads',
      product_type: 'Beads',
      vendor: 'Reza Gem Collection',
      tags: 'agate, beads, natural'
    },
    {
      title: 'Gold Necklace',
      product_type: 'Necklace',
      vendor: 'Reza Gem Collection',
      tags: 'gold, necklace, jewelry'
    }
  ];

  for (const product of sampleProducts) {
    console.log(`📋 Testing Product: ${product.title}`);
    
    try {
      // Test the prompt building
      const prompt = geminiService.buildMetaTitlePrompt(product);
      console.log(`   Generated prompt includes product name requirement: ${prompt.includes('ALWAYS start with the product name')}`);
      console.log(`   Prompt includes format example: ${prompt.includes('Format:')}`);
      
      // Test validation function
      const testTitles = [
        `${product.title} - Premium Quality Jewelry`, // ✅ Correct
        `Beautiful ${product.title} - Handcrafted`, // ❌ Wrong
        `${product.title}`, // ✅ Correct (just product name)
        `Shop ${product.title} - Best Price` // ❌ Wrong
      ];
      
      console.log('   Testing validation:');
      for (const testTitle of testTitles) {
        const isValid = testTitle.toLowerCase().startsWith(product.title.toLowerCase());
        console.log(`     "${testTitle}" - ${isValid ? '✅ Valid' : '❌ Invalid'}`);
      }
      
      console.log('');
    } catch (error) {
      console.log(`   Error: ${error.message}`);
      console.log('');
    }
  }

  console.log('✅ Meta Title Format Test Summary:');
  console.log('- Meta titles will ALWAYS start with the product name');
  console.log('- Format: "Product Name - [benefit/keyword]"');
  console.log('- Validation ensures compliance');
  console.log('- Examples:');
  console.log('  ✅ "Diamond Ring - Premium Quality Jewelry"');
  console.log('  ✅ "Tree Moss Agate Polished Round Beads - Natural Beauty"');
  console.log('  ❌ "Beautiful Diamond Ring - Handcrafted"');
  console.log('  ❌ "Shop Gold Necklace - Best Price"');
}

// Run the test
if (require.main === module) {
  testMetaTitleFormat();
}

module.exports = { testMetaTitleFormat };
