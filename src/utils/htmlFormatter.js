const logger = require('./logger');

class HTMLFormatter {
  /**
   * Clean and format HTML content
   */
  static cleanHTML(html) {
    if (!html) return '';
    
    let cleaned = html
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove empty lines
      .replace(/\n\s*\n/g, '\n')
      // Trim whitespace
      .trim();
    
    return cleaned;
  }

  /**
   * Validate HTML structure
   */
  static validateHTMLStructure(html) {
    const errors = [];
    
    // Check for required elements
    if (!html.includes('<h2>')) {
      errors.push('Missing H2 tag');
    }
    
    if (!html.includes('<ul>')) {
      errors.push('Missing UL tag');
    }
    
    if (!html.includes('</ul>')) {
      errors.push('Missing closing UL tag');
    }
    
    // Check for proper bullet point structure
    const liCount = (html.match(/<li>/g) || []).length;
    if (liCount < 8) {
      errors.push(`Expected 8 bullet points, found ${liCount}`);
    }
    
    // Check for required content
    if (!html.includes('Verified by Gemmologist Reza Piroznia')) {
      errors.push('Missing gemmologist verification');
    }
    
    if (!html.includes('10 days refund')) {
      errors.push('Missing refund policy');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Format product description with proper structure
   */
  static formatProductDescription(productName, description, variants, refundUrl) {
    const formattedVariants = this.formatVariants(variants);
    
    return `
<h2>About ${this.escapeHTML(productName)}</h2>
<p>${description}</p>
<ul>
  <li><strong>Available Variants:</strong> ${formattedVariants}</li>
  <li>${this.generateBulletPoint('features')}</li>
  <li>${this.generateBulletPoint('quality')}</li>
  <li>${this.generateBulletPoint('craftsmanship')}</li>
  <li>${this.generateBulletPoint('materials')}</li>
  <li>${this.generateBulletPoint('design')}</li>
  <li><strong>Verified by Gemmologist Reza Piroznia</strong></li>
  <li>This product has <a href="${refundUrl}">10 days refund</a></li>
</ul>`.trim();
  }

  /**
   * Format variants for display
   */
  static formatVariants(variants) {
    if (!variants || variants.length === 0) {
      return 'Standard';
    }
    
    const variantOptions = variants.map(variant => {
      const options = [];
      if (variant.option1) options.push(variant.option1);
      if (variant.option2) options.push(variant.option2);
      if (variant.option3) options.push(variant.option3);
      return options.join(' - ');
    });
    
    return variantOptions.join(', ');
  }

  /**
   * Generate placeholder bullet points (for fallback)
   */
  static generateBulletPoint(type) {
    const bulletPoints = {
      features: 'Exquisite design with premium materials and superior craftsmanship',
      quality: 'Handcrafted with attention to detail and exceptional quality standards',
      craftsmanship: 'Expertly crafted by skilled artisans using traditional techniques',
      materials: 'Made with the finest materials and genuine gemstones',
      design: 'Timeless design that combines elegance with contemporary style'
    };
    
    return bulletPoints[type] || 'Premium quality jewelry piece with exceptional value';
  }

  /**
   * Escape HTML special characters
   */
  static escapeHTML(text) {
    if (!text) return '';
    
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Unescape HTML special characters
   */
  static unescapeHTML(text) {
    if (!text) return '';
    
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  /**
   * Extract text content from HTML
   */
  static extractText(html) {
    if (!html) return '';
    
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Count words in HTML content
   */
  static countWords(html) {
    const text = this.extractText(html);
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Validate meta title length
   */
  static validateMetaTitle(title) {
    const length = title.length;
    return {
      isValid: length <= 60,
      length: length,
      maxLength: 60,
      isOptimal: length >= 50 && length <= 60
    };
  }

  /**
   * Validate meta description length
   */
  static validateMetaDescription(description) {
    const length = description.length;
    return {
      isValid: length <= 160,
      length: length,
      maxLength: 160,
      isOptimal: length >= 150 && length <= 160
    };
  }

  /**
   * Create fallback description
   */
  static createFallbackDescription(productName, productType = 'Jewelry') {
    return `
<h2>About ${this.escapeHTML(productName)}</h2>
<p>Discover the exquisite beauty of this stunning ${productType.toLowerCase()} piece from Reza Gem Collection. Crafted with precision and attention to detail, this piece showcases exceptional quality and timeless elegance.</p>
<ul>
  <li><strong>Available Variants:</strong> Standard</li>
  <li>Exquisite design with premium materials and superior craftsmanship</li>
  <li>Handcrafted with attention to detail and exceptional quality standards</li>
  <li>Expertly crafted by skilled artisans using traditional techniques</li>
  <li>Made with the finest materials and genuine gemstones</li>
  <li>Timeless design that combines elegance with contemporary style</li>
  <li><strong>Verified by Gemmologist Reza Piroznia</strong></li>
  <li>This product has <a href="/refund-policy">10 days refund</a></li>
</ul>`.trim();
  }

  /**
   * Sanitize HTML content
   */
  static sanitizeHTML(html) {
    if (!html) return '';
    
    // Remove potentially dangerous tags and attributes
    let sanitized = html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/<object[^>]*>.*?<\/object>/gi, '')
      .replace(/<embed[^>]*>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<[^>]*\s+on\w+\s*=[^>]*>/gi, '');
    
    return sanitized;
  }

  /**
   * Format HTML for better readability
   */
  static formatHTML(html) {
    if (!html) return '';
    
    return html
      .replace(/>\s+</g, '>\n<')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }
}

module.exports = HTMLFormatter;
