const crypto = require('crypto');
const logger = require('./logger');

class BarcodeGenerator {
  /**
   * Generate a unique barcode for a product variant (EAN-13 format)
   * @param {Object} product - The product object
   * @param {Object} variant - The variant object
   * @param {string} prefix - Optional prefix for the barcode (e.g., 'GEM')
   * @returns {string} - Unique EAN-13 barcode string
   */
  static generateBarcode(product, variant, prefix = 'GEM') {
    try {
      // Use EAN-13 format for standard retail barcodes
      return this.generateEAN13Barcode(product, variant, '00');
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
   * Validate barcode format (EAN-13)
   * @param {string} barcode - The barcode to validate
   * @param {string} prefix - Expected prefix (not used for EAN-13)
   * @returns {boolean} - Whether the barcode is valid
   */
  static validateBarcode(barcode, prefix = 'GEM') {
    try {
      if (!barcode || typeof barcode !== 'string') {
        return false;
      }

      // EAN-13 must be exactly 13 digits
      if (barcode.length !== 13) {
        return false;
      }

      // Check if contains only digits
      const digitRegex = /^[0-9]+$/;
      if (!digitRegex.test(barcode)) {
        return false;
      }

      // Validate check digit
      const baseCode = barcode.substring(0, 12);
      const checkDigit = barcode.substring(12, 13);
      const calculatedCheckDigit = this.calculateEAN13CheckDigit(baseCode);

      return checkDigit === calculatedCheckDigit;
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
   * Extract information from EAN-13 barcode
   * @param {string} barcode - The EAN-13 barcode to parse
   * @param {string} prefix - Expected prefix (not used for EAN-13)
   * @returns {Object} - Parsed barcode information
   */
  static parseBarcode(barcode, prefix = 'GEM') {
    try {
      if (!this.validateEAN13Barcode(barcode)) {
        throw new Error('Invalid EAN-13 barcode format');
      }

      // EAN-13 format: Country Code (2) + Manufacturer Code (5) + Product Code (5) + Check Digit (1)
      const countryCode = barcode.substring(0, 2);
      const manufacturerCode = barcode.substring(2, 7);
      const productCode = barcode.substring(7, 12);
      const checkDigit = barcode.substring(12, 13);

      return {
        countryCode: countryCode,
        manufacturerCode: manufacturerCode,
        productCode: productCode,
        checkDigit: checkDigit,
        fullBarcode: barcode,
        format: 'EAN-13'
      };
    } catch (error) {
      logger.error(`Error parsing EAN-13 barcode: ${error.message}`);
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
      // Take last 5 digits of product ID and variant ID to ensure proper length
      const productIdStr = (product.id || '0').toString();
      const variantIdStr = (variant.id || '0').toString();
      
      // Take last 5 digits of each ID
      const productId = productIdStr.slice(-5).padStart(5, '0');
      const variantId = variantIdStr.slice(-5).padStart(5, '0');
      
      // Create base code (12 digits)
      const baseCode = `${countryCode}${productId}${variantId}`;
      
      // Calculate check digit
      const checkDigit = this.calculateEAN13CheckDigit(baseCode);
      
      // Return complete EAN-13 barcode
      const ean13Barcode = `${baseCode}${checkDigit}`;
      
      logger.info(`Generated EAN-13 barcode for variant ${variant.id}: ${ean13Barcode} (from product: ${product.id}, variant: ${variant.id})`);
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

  /**
   * Validate EAN-13 barcode format
   * @param {string} barcode - The EAN-13 barcode to validate
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
      const digitRegex = /^[0-9]+$/;
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
}

module.exports = BarcodeGenerator;
