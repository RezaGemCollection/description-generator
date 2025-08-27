const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PRODUCT_DESCRIPTION_PROMPT, META_TITLE_PROMPT, META_DESCRIPTION_PROMPT } = require('../../config/gemini-prompts');
const VariantParser = require('../utils/variantParser');
const logger = require('../utils/logger');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    this.rateLimit = parseInt(process.env.GEMINI_RATE_LIMIT) || 60;
    this.requestCount = 0;
    this.lastReset = Date.now();
  }

  /**
   * Check rate limiting
   */
  checkRateLimit() {
    const now = Date.now();
    if (now - this.lastReset >= 60000) { // Reset every minute
      this.requestCount = 0;
      this.lastReset = now;
    }
    
    if (this.requestCount >= this.rateLimit) {
      throw new Error('Rate limit exceeded for Gemini API');
    }
    
    this.requestCount++;
  }

  /**
   * Generate product description using Gemini AI
   */
  async generateProductDescription(productData) {
    try {
      this.checkRateLimit();
      
      const prompt = this.buildProductDescriptionPrompt(productData);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      logger.info(`Generated product description for ${productData.title}`);
      
      // Clean the generated HTML
      const cleanedHtml = this.cleanHtmlResponse(text);
      
      // Add variants bullet point dynamically
      const descriptionWithVariants = this.addVariantsBulletPoint(cleanedHtml, productData);
      
      return descriptionWithVariants;
    } catch (error) {
      logger.error(`Error generating product description: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate meta title using Gemini AI
   */
  async generateMetaTitle(productData) {
    try {
      this.checkRateLimit();
      
      const prompt = this.buildMetaTitlePrompt(productData);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      logger.info(`Generated meta title for ${productData.title}`);
      return this.cleanTextResponse(text);
    } catch (error) {
      logger.error(`Error generating meta title: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate meta description using Gemini AI
   */
  async generateMetaDescription(productData) {
    try {
      this.checkRateLimit();
      
      const prompt = this.buildMetaDescriptionPrompt(productData);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      logger.info(`Generated meta description for ${productData.title}`);
      return this.cleanTextResponse(text);
    } catch (error) {
      logger.error(`Error generating meta description: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate all content for a product (description, meta title, meta description)
   */
  async generateAllContent(productData) {
    try {
      const [description, metaTitle, metaDescription] = await Promise.all([
        this.generateProductDescription(productData),
        this.generateMetaTitle(productData),
        this.generateMetaDescription(productData)
      ]);

      return {
        description,
        metaTitle,
        metaDescription
      };
    } catch (error) {
      logger.error(`Error generating all content: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build product description prompt with product data
   */
  buildProductDescriptionPrompt(productData) {
    const refundUrl = 'https://rezagemcollection.ca/policies/refund-policy';
    
    return PRODUCT_DESCRIPTION_PROMPT
      .replace('{productName}', productData.title)
      .replace('{productType}', productData.product_type || 'Jewelry')
      .replace('{category}', productData.product_type || 'Jewelry')
      .replace('{refundUrl}', refundUrl);
  }

  /**
   * Build meta title prompt with product data
   */
  buildMetaTitlePrompt(productData) {
    const keyFeatures = this.extractKeyFeatures(productData);
    
    return META_TITLE_PROMPT
      .replace('{productName}', productData.title)
      .replace('{category}', productData.product_type || 'Jewelry')
      .replace('{keyFeatures}', keyFeatures);
  }

  /**
   * Build meta description prompt with product data
   */
  buildMetaDescriptionPrompt(productData) {
    const keyFeatures = this.extractKeyFeatures(productData);
    const shortDescription = this.createShortDescription(productData);
    
    return META_DESCRIPTION_PROMPT
      .replace('{productName}', productData.title)
      .replace('{category}', productData.product_type || 'Jewelry')
      .replace('{keyFeatures}', keyFeatures)
      .replace('{shortDescription}', shortDescription);
  }



  /**
   * Extract key features from product data
   */
  extractKeyFeatures(productData) {
    const features = [];
    
    if (productData.product_type) features.push(productData.product_type);
    if (productData.vendor) features.push(productData.vendor);
    if (productData.tags) features.push(productData.tags);
    
    return features.join(', ');
  }

  /**
   * Create short description for meta description
   */
  createShortDescription(productData) {
    // Don't use existing body_html to avoid circular dependency
    // Create a generic description based on product info
    const productType = productData.product_type || 'jewelry';
    const productName = productData.title;
    
    return `Beautiful ${productType} piece from Reza Gem Collection. ${productName} offers exceptional quality and craftsmanship.`;
  }

  /**
   * Clean HTML response from Gemini
   */
  cleanHtmlResponse(text) {
    // Remove any markdown formatting that might be present
    let cleaned = text
      .replace(/```html/g, '')
      .replace(/```/g, '')
      .trim();
    
    // Ensure proper HTML structure
    if (!cleaned.includes('<h2>')) {
      throw new Error('Generated content does not contain required H2 tag');
    }
    
    return cleaned;
  }

  /**
   * Clean text response from Gemini
   */
  cleanTextResponse(text) {
    return text
      .replace(/"/g, '')
      .replace(/'/g, '')
      .trim();
  }

  /**
   * Add variants bullet point to generated description
   */
  addVariantsBulletPoint(htmlDescription, productData) {
    try {
      const VariantParser = require('../utils/variantParser');
      const formattedVariants = VariantParser.formatVariantsForDescription(productData.variants, productData.options);
      
      // If no meaningful variants, return the description as is
      if (!formattedVariants || formattedVariants === 'Standard' || formattedVariants.trim() === '') {
        return htmlDescription;
      }

      // Create the variants bullet point
      const variantsBullet = `<li>\n<strong>Available Variants:</strong> ${formattedVariants}</li>`;

      // Insert the variants bullet point after the first <ul> tag
      return htmlDescription.replace(
        /(<ul>)/,
        `$1\n  ${variantsBullet}`
      );

    } catch (error) {
      logger.error(`Error adding variants bullet point: ${error.message}`);
      return htmlDescription; // Return original if adding variants fails
    }
  }

  /**
   * Validate generated content
   */
  validateDescription(description) {
    const requiredElements = [
      '<h2>',
      '<ul>',
      '<li>',
      '<strong>Verified and Certified by Gemmologist Reza Piroznia</strong>',
      '7-day money-back guarantee'
    ];

    for (const element of requiredElements) {
      if (!description.includes(element)) {
        throw new Error(`Generated description missing required element: ${element}`);
      }
    }

    return true;
  }

  /**
   * Validate meta title length
   */
  validateMetaTitle(title) {
    if (title.length > 60) {
      logger.warn(`Meta title too long: ${title.length} characters (max 60) - consider editing manually`);
    }
    return true;
  }

  /**
   * Validate meta description length
   */
  validateMetaDescription(description) {
    if (description.length > 160) {
      logger.warn(`Meta description too long: ${description.length} characters (max 160) - consider editing manually`);
    }
    return true;
  }
}

module.exports = new GeminiService();
