const VariantParser = require('./src/utils/variantParser');

// Mock the updateVariantsBulletPoint function with the fixed regex
function updateVariantsBulletPoint(htmlDescription, formattedVariants) {
  try {
    // If no meaningful variants, remove the variants bullet point entirely
    if (!formattedVariants || formattedVariants === 'Standard' || formattedVariants.trim() === '') {
      // Remove ALL bullet points that contain "Available Variants"
      return htmlDescription.replace(/<li>\s*<strong>Available Variants:<\/strong>.*?<\/li>\s*/g, '');
    }

    // Create the new variants bullet point
    const newVariantsBullet = `<li>\n<strong>Available Variants:</strong> ${formattedVariants}</li>`;

    // Check if there's already a variants bullet point
    if (htmlDescription.includes('<strong>Available Variants:</strong>')) {
      // Replace ALL existing variants bullet points with the new one
      return htmlDescription.replace(
        /<li>\s*<strong>Available Variants:<\/strong>.*?<\/li>/g,
        newVariantsBullet
      );
    } else {
      // Insert new variants bullet point after the first <ul> tag
      return htmlDescription.replace(
        /(<ul>)/,
        `$1\n  ${newVariantsBullet}`
      );
    }

  } catch (error) {
    console.error(`Error updating variants bullet point: ${error.message}`);
    return htmlDescription; // Return original if update fails
  }
}

async function testFix() {
  console.log('🧪 Testing Variant Update Fix with Real HTML Format\n');

  // Real HTML from the server log
  const realHtml = `<h2>About Tree Moss Agate Polished Round Beads</h2>
<p>Unleash the earthy elegance of nature with our exquisite Tree Moss Agate Polished Round Beads.  These captivating beads, meticulously polished to a luminous sheen, offer a unique blend of vibrant greens and browns, perfect for creating stunning jewelry pieces that reflect your individual style and connect you to the beauty of the natural world. Elevate your crafting experience with these high-quality, ethically sourced gemstones.</p>

<ul>
  <li>
<strong>Available Variants:</strong> Size: 2 mm, 4 mm</li>
  <li>
<strong>Naturally Vibrant Hues:</strong> Each bead showcases the unique and mesmerizing dendritic patterns characteristic of Tree Moss Agate, ensuring a one-of-a-kind piece of jewelry.</li>
  <li>
<strong>Premium Quality Polish:</strong> Meticulously polished to a smooth, high-gloss finish, these beads radiate an alluring luminosity, enhancing their natural beauty.</li>
  <li>
<strong>Ethically Sourced Materials:</strong>  We source our Tree Moss Agate from reputable suppliers committed to sustainable and ethical mining practices, ensuring you can wear your jewelry with confidence.</li>
  <li>
<strong>Versatile Design Potential:</strong>  Perfect for crafting necklaces, bracelets, earrings, and more, these round beads offer endless creative possibilities for jewelry designers and enthusiasts alike.</li>
  <li>
<strong>Exceptional Durability:</strong>  Tree Moss Agate is known for its relative hardness and durability, making these beads ideal for everyday wear and long-lasting enjoyment.</li>
  <li><strong>Verified by Gemmologist Reza Piroznia</strong></li>
  <li>This product has <a href="https://rezagemcollection.ca/policies/refund-policy">7 days refund</a>
</li>
</ul>`;

  console.log('📝 Original HTML (from server log):');
  console.log(realHtml);
  console.log('');

  // Test updating variants to include 6 mm
  const newVariants = 'Size: 2 mm, 4 mm, 6 mm';
  console.log(`🔄 Updating variants to: ${newVariants}`);
  
  try {
    const updatedHtml = updateVariantsBulletPoint(realHtml, newVariants);
    
    console.log('📝 Updated HTML:');
    console.log(updatedHtml);
    console.log('');
    
    // Check if the update worked
    const variantsLine = updatedHtml.match(/<li>\s*<strong>Available Variants:<\/strong>.*?<\/li>/);
    if (variantsLine) {
      console.log(`✅ Variants updated successfully: ${variantsLine[0].replace(/<[^>]*>/g, '')}`);
    } else {
      console.log('❌ Variants update failed - no variants line found');
    }
    
    // Check if 6 mm is included
    if (updatedHtml.includes('6 mm')) {
      console.log('✅ 6 mm variant is now included in the description');
    } else {
      console.log('❌ 6 mm variant is NOT included in the description');
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('');
  console.log('🔧 Fix Summary:');
  console.log('- Updated regex pattern to handle newlines: /<li>\\s*<strong>Available Variants:<\\/strong>.*?<\\/li>/g');
  console.log('- Updated bullet point format to include newline: <li>\\n<strong>Available Variants:</strong>');
  console.log('- This should now correctly update variants in real HTML from Shopify');
}

// Run the test
if (require.main === module) {
  testFix();
}

module.exports = { testFix };
