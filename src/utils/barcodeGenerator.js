const crypto = require('crypto');
const logger = require('./logger');

class BarcodeGenerator {
  /**
   * Generate a unique barcode for a product variant
   * @param {Object} product - The product object
   * @param {Object} variant - The variant object
   * @param {string} prefix - Optional prefix for the barcode (e.g., 'GEM')
   * @returns {string} - Unique barcode string
   */
  static generateBarcode(product, variant, prefix = 'GEM') {
    try {
      // Create a unique identifier based on product and variant data
      const productId = (product.id || '0').toString();
      const variantId = (variant.id || '0').toString();
      const productTitle = (product.title || '').replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
      const variantTitle = (variant.title || '').replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
      
      // Create a hash of the combination
      const dataToHash = `${productId}-${variantId}-${productTitle}-${variantTitle}`;
      const hash = crypto.createHash('md5').update(dataToHash).digest('hex');
      
      // Take first 8 characters of hash for uniqueness
      const uniquePart = hash.substring(0, 8).toUpperCase();
      
      // Create barcode format: PREFIX + PRODUCT_ID + VARIANT_ID + UNIQUE_HASH
      const barcode = `${prefix}${productId.padStart(6, '0')}${variantId.padStart(4, '0')}${uniquePart}`;
      
      logger.info(`Generated barcode for variant ${variant.id}: ${barcode}`);
      return barcode;
    } catch (error) {
      logger.error(`Error generating barcode: ${error.message}`);
      // Fallback to a simple timestamp-based barcode
      return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
    }
  }

  /**
   * Generate barcodes for all variants of a product
   * @param {Object} product - The product object
   * @param {string} prefix - Optional prefix for the barcode
   * @returns {Array} - Array of variant objects with barcodes
   */
  static generateBarcodesForProduct(product, prefix = 'GEM') {
    try {
      const variants = product.variants || [];
      const variantsWithBarcodes = [];

      variants.forEach(variant => {
        const barcode = this.generateBarcode(product, variant, prefix);
        variantsWithBarcodes.push({
          ...variant,
          barcode: barcode
        });
      });

      logger.info(`Generated barcodes for ${variantsWithBarcodes.length} variants of product ${product.id}`);
      return variantsWithBarcodes;
    } catch (error) {
      logger.error(`Error generating barcodes for product: ${error.message}`);
      return [];
    }
  }

  /**
   * Validate barcode format
   * @param {string} barcode - The barcode to validate
   * @param {string} prefix - Expected prefix
   * @returns {boolean} - Whether the barcode is valid
   */
  static validateBarcode(barcode, prefix = 'GEM') {
    try {
      if (!barcode || typeof barcode !== 'string') {
        return false;
      }

      // Check if barcode starts with prefix
      if (!barcode.startsWith(prefix)) {
        return false;
      }

      // Check minimum length (prefix + product_id + variant_id + hash)
      const minLength = prefix.length + 6 + 4 + 8; // 18 characters minimum
      if (barcode.length < minLength) {
        return false;
      }

      // Check if contains only alphanumeric characters
      const alphanumericRegex = /^[A-Z0-9]+$/;
      if (!alphanumericRegex.test(barcode)) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error(`Error validating barcode: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate EAN-13 barcode format
   * @param {string} barcode - The barcode to validate
   * @returns {boolean} - Whether the barcode is valid
   */
  static validateEAN13Barcode(barcode) {
    try {
      if (!barcode || typeof barcode !== 'string') {
        return false;
      }

      // EAN-13 must be exactly 13 digits
      if (barcode.length !== 13) {
        return false;
      }

      // Check if contains only digits
      const digitRegex = /^\d{13}$/;
      if (!digitRegex.test(barcode)) {
        return false;
      }

      // Validate check digit
      const baseCode = barcode.substring(0, 12);
      const checkDigit = barcode.substring(12, 13);
      const calculatedCheckDigit = this.calculateEAN13CheckDigit(baseCode);

      return checkDigit === calculatedCheckDigit;
    } catch (error) {
      logger.error(`Error validating EAN-13 barcode: ${error.message}`);
      return false;
    }
  }

  /**
   * Extract information from barcode
   * @param {string} barcode - The barcode to parse
   * @param {string} prefix - Expected prefix
   * @returns {Object} - Parsed barcode information
   */
  static parseBarcode(barcode, prefix = 'GEM') {
    try {
      if (!this.validateBarcode(barcode, prefix)) {
        throw new Error('Invalid barcode format');
      }

      const withoutPrefix = barcode.substring(prefix.length);
      const productId = withoutPrefix.substring(0, 6);
      const variantId = withoutPrefix.substring(6, 10);
      const uniqueHash = withoutPrefix.substring(10, 18);

      return {
        prefix: prefix,
        productId: parseInt(productId),
        variantId: parseInt(variantId),
        uniqueHash: uniqueHash,
        fullBarcode: barcode
      };
    } catch (error) {
      logger.error(`Error parsing barcode: ${error.message}`);
      return null;
    }
  }

  /**
   * Check if barcode already exists in a list of variants
   * @param {string} barcode - The barcode to check
   * @param {Array} variants - Array of variant objects
   * @returns {boolean} - Whether the barcode already exists
   */
  static isBarcodeDuplicate(barcode, variants) {
    try {
      return variants.some(variant => variant.barcode === barcode);
    } catch (error) {
      logger.error(`Error checking barcode duplicate: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate a unique barcode that doesn't exist in the given variants
   * @param {Object} product - The product object
   * @param {Object} variant - The variant object
   * @param {Array} existingVariants - Array of existing variants with barcodes
   * @param {string} prefix - Optional prefix for the barcode
   * @returns {string} - Unique barcode string
   */
  static generateUniqueBarcode(product, variant, existingVariants = [], prefix = 'GEM') {
    try {
      let attempts = 0;
      const maxAttempts = 10;
      let barcode;

      do {
        barcode = this.generateBarcode(product, variant, prefix);
        attempts++;
        
        if (attempts > maxAttempts) {
          // If we can't generate a unique barcode after max attempts, add a random suffix
          barcode = `${barcode}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
          break;
        }
      } while (this.isBarcodeDuplicate(barcode, existingVariants));

      logger.info(`Generated unique barcode after ${attempts} attempts: ${barcode}`);
      return barcode;
    } catch (error) {
      logger.error(`Error generating unique barcode: ${error.message}`);
      return this.generateBarcode(product, variant, prefix);
    }
  }

  /**
   * Generate EAN-13 compatible barcode (for international standards)
   * @param {Object} product - The product object
   * @param {Object} variant - The variant object
   * @param {string} countryCode - Country code (default: '00' for generic)
   * @returns {string} - EAN-13 compatible barcode
   */
  static generateEAN13Barcode(product, variant, countryCode = '00') {
    try {
      // EAN-13 format: Country Code (2) + Manufacturer Code (5) + Product Code (5) + Check Digit (1)
      const productId = (product.id || '0').toString().padStart(5, '0').substring(0, 5);
      const variantId = (variant.id || '0').toString().padStart(5, '0').substring(0, 5);
      
      // Create base code (12 digits)
      const baseCode = `${countryCode}${productId}${variantId}`;
      
      // Calculate check digit
      const checkDigit = this.calculateEAN13CheckDigit(baseCode);
      
      // Return complete EAN-13 barcode
      const ean13Barcode = `${baseCode}${checkDigit}`;
      
      logger.info(`Generated EAN-13 barcode for variant ${variant.id}: ${ean13Barcode}`);
      return ean13Barcode;
    } catch (error) {
      logger.error(`Error generating EAN-13 barcode: ${error.message}`);
      return this.generateBarcode(product, variant);
    }
  }

  /**
   * Calculate EAN-13 check digit
   * @param {string} baseCode - 12-digit base code
   * @returns {string} - Check digit
   */
  static calculateEAN13CheckDigit(baseCode) {
    try {
      if (baseCode.length !== 12) {
        throw new Error('Base code must be 12 digits');
      }

      let sum = 0;
      for (let i = 0; i < 12; i++) {
        const digit = parseInt(baseCode[i]);
        sum += digit * (i % 2 === 0 ? 1 : 3);
      }

      const remainder = sum % 10;
      const checkDigit = remainder === 0 ? 0 : 10 - remainder;

      return checkDigit.toString();
    } catch (error) {
      logger.error(`Error calculating EAN-13 check digit: ${error.message}`);
      return '0';
    }
  }
}

module.exports = BarcodeGenerator;
