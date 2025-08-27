const PRODUCT_DESCRIPTION_PROMPT = `
You are a professional gemologist and jewelry expert writing Amazon-style product descriptions for a high-end jewelry store. 

Product Information:
- Product Name: {productName}
- Product Type: {productType}
- Available Variants: {variants}
- Product Category: {category}

Please create an Amazon-style compelling product description in HTML format following this exact structure:

1. Start with: <h2>About {productName}</h2>
2. Write one engaging paragraph (2-3 sentences) about the product in Amazon style - highlighting key benefits, features, and value proposition
3. Create a bulleted list with exactly 8 items:
   - Bullet 1: "Available Variants: {variants}" (if variants are "Default Title" or empty, skip this bullet point entirely)
   - Bullets 2-6: Generate 5 unique, compelling bullet points about the product's features, quality, craftsmanship, materials, and design (Amazon-style with clear benefits and specifications)
   - Bullet 7: "<strong>Verified by Gemmologist Reza Piroznia</strong>" (keep this exact with bold formatting)
   - Bullet 8: "This product has <a href=\"{refundUrl}\">7 days refund</a>"

IMPORTANT VARIANT RULES:
- If variants are "Default Title" or empty, completely skip bullet point 1 (Available Variants)
- Only show "Available Variants" if there are actual meaningful variants like sizes, colors, materials, etc.
- If no meaningful variants exist, start directly with bullet point 2
- ALWAYS use the exact variants provided in the "Available Variants" field above
- Do NOT make up variants - only use what is provided

Amazon-Style Requirements:
- Use clear, benefit-focused language that converts browsers to buyers
- Highlight specific features and their benefits to the customer
- Include technical specifications and quality indicators
- Use persuasive, action-oriented language
- Focus on customer pain points and solutions
- Maintain professional, luxury tone while being accessible
- Include emotional triggers and value propositions
- Use bullet points that are scannable and easy to read
- Emphasize quality, craftsmanship, and unique selling points
- Include gemological accuracy and expertise

Return only the HTML content, no additional text or explanations.
`;

const META_TITLE_PROMPT = `
Create an Amazon-style SEO-optimized meta title for this jewelry product:

Product: {productName}
Category: {category}
Key Features: {keyFeatures}

Amazon-Style Requirements:
- 50-60 characters maximum
- Include primary keyword and key benefit
- Be compelling and click-worthy like Amazon product titles
- Include brand name if space allows
- Focus on value proposition and key selling points
- Use action words and benefit-focused language
- Make it search-friendly and conversion-optimized

Return only the meta title text, no quotes or additional formatting.
`;

const META_DESCRIPTION_PROMPT = `
Create an Amazon-style SEO-optimized meta description for this jewelry product:

Product: {productName}
Category: {category}
Key Features: {keyFeatures}
Description: {shortDescription}

Amazon-Style Requirements:
- STRICTLY 160 characters maximum (not 150-160, but exactly 160 or less)
- ALWAYS start with one of these action words: Buy, Shop, Find, Check, Explore, Browse, Get, Order, View, Purchase, Select, Search, See, Compare, Upgrade your, Start with, Enjoy, Experience, Save on
- Include primary and secondary keywords
- Be compelling and descriptive like Amazon product descriptions
- Include call-to-action and benefit-focused language
- Highlight unique value proposition and key selling points
- Focus on benefits, quality, and customer pain points
- Use persuasive, conversion-optimized language
- Include emotional triggers and urgency where appropriate
- Make it scannable and easy to understand
- Keep it concise and impactful

Return only the meta description text, no quotes or additional formatting.
`;

const BULLET_POINT_PROMPT = `
Generate 5 unique, Amazon-style compelling bullet points for this jewelry product:

Product: {productName}
Category: {category}
Materials: {materials}
Style: {style}

Focus areas for each bullet point:
1. Product features and specifications (Amazon-style with clear benefits)
2. Quality and craftsmanship (highlighting value and expertise)
3. Materials and gemstones (technical details with customer benefits)
4. Design and aesthetics (emotional appeal and style benefits)
5. Value and benefits (conversion-focused selling points)

Amazon-Style Requirements:
- Each bullet point should be 1-2 sentences
- Use clear, benefit-focused language that converts browsers to buyers
- Highlight gemological expertise and quality indicators
- Include specific details about the product with customer benefits
- Focus on customer pain points and solutions
- Maintain professional, luxury tone while being accessible
- Use persuasive, action-oriented language
- Include emotional triggers and value propositions
- Make bullet points scannable and easy to read
- Emphasize unique selling points and competitive advantages

Return only the 5 bullet points, one per line, no numbering or formatting.
`;

module.exports = {
  PRODUCT_DESCRIPTION_PROMPT,
  META_TITLE_PROMPT,
  META_DESCRIPTION_PROMPT,
  BULLET_POINT_PROMPT
};
