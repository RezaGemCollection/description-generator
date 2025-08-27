const logger = require('./logger');

class VariantParser {
  /**
   * Parse product variants and options
   */
  static parseVariants(product) {
    try {
      const variants = product.variants || [];
      const options = product.options || [];
      
      if (variants.length === 0) {
        return {
          hasVariants: false,
          variantTypes: [],
          variantList: ['Standard'],
          formattedVariants: 'Standard'
        };
      }

      // Extract option names (e.g., "Size", "Color", "Material")
      const optionNames = options.map(option => option.name);
      
      // Parse each variant
      const parsedVariants = variants.map(variant => {
        const variantData = {
          id: variant.id,
          title: variant.title,
          sku: variant.sku,
          price: variant.price,
          compareAtPrice: variant.compare_at_price,
          inventoryQuantity: variant.inventory_quantity,
          options: {}
        };

        // Map option values to option names
        optionNames.forEach((optionName, index) => {
          const optionValue = variant[`option${index + 1}`];
          if (optionValue) {
            variantData.options[optionName] = optionValue;
          }
        });

        return variantData;
      });

      // Get unique option values for each option type
      const optionValues = {};
      optionNames.forEach(optionName => {
        const values = [...new Set(
          parsedVariants
            .map(variant => variant.options[optionName])
            .filter(value => value)
        )];
        optionValues[optionName] = values;
      });

      // Create formatted variant list
      const variantList = parsedVariants.map(variant => {
        const optionStrings = optionNames
          .map(optionName => variant.options[optionName])
          .filter(value => value);
        return optionStrings.join(' - ');
      });

      const formattedVariants = variantList.join(', ');

      return {
        hasVariants: true,
        variantTypes: optionNames,
        variantList: variantList,
        formattedVariants: formattedVariants,
        optionValues: optionValues,
        parsedVariants: parsedVariants
      };

    } catch (error) {
      logger.error(`Error parsing variants: ${error.message}`);
      return {
        hasVariants: false,
        variantTypes: [],
        variantList: ['Standard'],
        formattedVariants: 'Standard',
        error: error.message
      };
    }
  }

  /**
   * Format variants for display in description
   */
  static formatVariantsForDescription(variants, options) {
    try {
      if (!variants || variants.length === 0) {
        return 'Standard';
      }

      const optionNames = options ? options.map(opt => opt.name) : [];
      
      const formattedVariants = variants.map(variant => {
        const optionValues = [];
        
        optionNames.forEach((optionName, index) => {
          const value = variant[`option${index + 1}`];
          if (value) {
            optionValues.push(`${optionName}: ${value}`);
          }
        });

        if (optionValues.length > 0) {
          return optionValues.join(', ');
        } else {
          return variant.title || 'Standard';
        }
      });

      return formattedVariants.join('; ');
    } catch (error) {
      logger.error(`Error formatting variants for description: ${error.message}`);
      return 'Standard';
    }
  }

  /**
   * Extract variant information for AI prompt
   */
  static extractVariantInfoForPrompt(product) {
    try {
      const parsed = this.parseVariants(product);
      
      if (!parsed.hasVariants) {
        return {
          variantInfo: 'Standard product with no variants',
          variantTypes: [],
          variantCount: 1
        };
      }

      const variantInfo = parsed.variantTypes.map(type => {
        const values = parsed.optionValues[type];
        return `${type}: ${values.join(', ')}`;
      }).join('; ');

      return {
        variantInfo: variantInfo,
        variantTypes: parsed.variantTypes,
        variantCount: parsed.variantList.length,
        totalVariants: parsed.variantList.length
      };

    } catch (error) {
      logger.error(`Error extracting variant info for prompt: ${error.message}`);
      return {
        variantInfo: 'Standard product',
        variantTypes: [],
        variantCount: 1
      };
    }
  }

  /**
   * Get variant summary for meta description
   */
  static getVariantSummary(product) {
    try {
      const parsed = this.parseVariants(product);
      
      if (!parsed.hasVariants) {
        return 'Available in standard version';
      }

      const summary = parsed.variantTypes.map(type => {
        const values = parsed.optionValues[type];
        if (values.length <= 3) {
          return `${type}: ${values.join(', ')}`;
        } else {
          return `${type}: ${values.length} options`;
        }
      }).join('; ');

      return `Available in ${summary}`;

    } catch (error) {
      logger.error(`Error getting variant summary: ${error.message}`);
      return 'Available in multiple variants';
    }
  }

  /**
   * Check if product has specific variant types
   */
  static hasVariantType(product, variantType) {
    try {
      const parsed = this.parseVariants(product);
      return parsed.variantTypes.includes(variantType);
    } catch (error) {
      logger.error(`Error checking variant type: ${error.message}`);
      return false;
    }
  }

  /**
   * Get variant options for a specific type
   */
  static getVariantOptions(product, variantType) {
    try {
      const parsed = this.parseVariants(product);
      
      if (!parsed.hasVariants || !parsed.optionValues[variantType]) {
        return [];
      }

      return parsed.optionValues[variantType];

    } catch (error) {
      logger.error(`Error getting variant options: ${error.message}`);
      return [];
    }
  }

  /**
   * Create variant combination matrix
   */
  static createVariantMatrix(product) {
    try {
      const parsed = this.parseVariants(product);
      
      if (!parsed.hasVariants) {
        return [];
      }

      const matrix = [];
      const optionTypes = parsed.variantTypes;
      const optionValues = parsed.optionValues;

      // Generate all possible combinations
      const generateCombinations = (current, index) => {
        if (index === optionTypes.length) {
          matrix.push([...current]);
          return;
        }

        const optionType = optionTypes[index];
        const values = optionValues[optionType];

        values.forEach(value => {
          current[index] = { type: optionType, value: value };
          generateCombinations(current, index + 1);
        });
      };

      generateCombinations([], 0);
      return matrix;

    } catch (error) {
      logger.error(`Error creating variant matrix: ${error.message}`);
      return [];
    }
  }

  /**
   * Validate variant data
   */
  static validateVariants(product) {
    try {
      const variants = product.variants || [];
      const options = product.options || [];
      
      const errors = [];

      // Check if variants exist but no options
      if (variants.length > 0 && options.length === 0) {
        errors.push('Product has variants but no option definitions');
      }

      // Check if options exist but no variants
      if (options.length > 0 && variants.length === 0) {
        errors.push('Product has option definitions but no variants');
      }

      // Validate each variant
      variants.forEach((variant, index) => {
        if (!variant.id) {
          errors.push(`Variant ${index} missing ID`);
        }
        
        if (!variant.title) {
          errors.push(`Variant ${index} missing title`);
        }

        // Check if variant has all required options
        options.forEach((option, optionIndex) => {
          const optionValue = variant[`option${optionIndex + 1}`];
          if (!optionValue) {
            errors.push(`Variant ${index} missing option ${option.name}`);
          }
        });
      });

      return {
        isValid: errors.length === 0,
        errors: errors
      };

    } catch (error) {
      logger.error(`Error validating variants: ${error.message}`);
      return {
        isValid: false,
        errors: [error.message]
      };
    }
  }

  /**
   * Get inventory status for variants
   */
  static getInventoryStatus(product) {
    try {
      const variants = product.variants || [];
      
      if (variants.length === 0) {
        return {
          totalVariants: 0,
          inStock: 0,
          outOfStock: 0,
          lowStock: 0
        };
      }

      let inStock = 0;
      let outOfStock = 0;
      let lowStock = 0;

      variants.forEach(variant => {
        const quantity = variant.inventory_quantity || 0;
        
        if (quantity > 5) {
          inStock++;
        } else if (quantity === 0) {
          outOfStock++;
        } else {
          lowStock++;
        }
      });

      return {
        totalVariants: variants.length,
        inStock: inStock,
        outOfStock: outOfStock,
        lowStock: lowStock
      };

    } catch (error) {
      logger.error(`Error getting inventory status: ${error.message}`);
      return {
        totalVariants: 0,
        inStock: 0,
        outOfStock: 0,
        lowStock: 0
      };
    }
  }

  /**
   * Compare two product states to detect variant changes
   */
  static detectVariantChanges(oldProduct, newProduct) {
    try {
      const oldVariants = oldProduct.variants || [];
      const newVariants = newProduct.variants || [];
      const oldOptions = oldProduct.options || [];
      const newOptions = newProduct.options || [];

      // Check if variant count changed
      if (oldVariants.length !== newVariants.length) {
        return {
          hasChanges: true,
          changeType: 'variant_count',
          oldCount: oldVariants.length,
          newCount: newVariants.length,
          details: `Variant count changed from ${oldVariants.length} to ${newVariants.length}`
        };
      }

      // Check if options changed
      if (oldOptions.length !== newOptions.length) {
        return {
          hasChanges: true,
          changeType: 'option_count',
          oldCount: oldOptions.length,
          newCount: newOptions.length,
          details: `Option count changed from ${oldOptions.length} to ${newOptions.length}`
        };
      }

      // Check option names and values
      for (let i = 0; i < oldOptions.length; i++) {
        const oldOption = oldOptions[i];
        const newOption = newOptions[i];

        if (oldOption.name !== newOption.name) {
          return {
            hasChanges: true,
            changeType: 'option_name',
            oldValue: oldOption.name,
            newValue: newOption.name,
            details: `Option name changed from "${oldOption.name}" to "${newOption.name}"`
          };
        }

        const oldValues = oldOption.values || [];
        const newValues = newOption.values || [];

        if (oldValues.length !== newValues.length) {
          return {
            hasChanges: true,
            changeType: 'option_values_count',
            optionName: oldOption.name,
            oldCount: oldValues.length,
            newCount: newValues.length,
            details: `Option "${oldOption.name}" values count changed from ${oldValues.length} to ${newValues.length}`
          };
        }

        // Check if any values changed
        for (let j = 0; j < oldValues.length; j++) {
          if (oldValues[j] !== newValues[j]) {
            return {
              hasChanges: true,
              changeType: 'option_value',
              optionName: oldOption.name,
              oldValue: oldValues[j],
              newValue: newValues[j],
              details: `Option "${oldOption.name}" value changed from "${oldValues[j]}" to "${newValues[j]}"`
            };
          }
        }
      }

      // Check variant details
      for (let i = 0; i < oldVariants.length; i++) {
        const oldVariant = oldVariants[i];
        const newVariant = newVariants[i];

        // Check variant options
        if (oldVariant.option1 !== newVariant.option1 ||
            oldVariant.option2 !== newVariant.option2 ||
            oldVariant.option3 !== newVariant.option3) {
          
          return {
            hasChanges: true,
            changeType: 'variant_options',
            variantIndex: i,
            oldVariant: oldVariant.title,
            newVariant: newVariant.title,
            details: `Variant options changed from "${oldVariant.title}" to "${newVariant.title}"`
          };
        }

        // Check variant title
        if (oldVariant.title !== newVariant.title) {
          return {
            hasChanges: true,
            changeType: 'variant_title',
            variantIndex: i,
            oldValue: oldVariant.title,
            newValue: newVariant.title,
            details: `Variant title changed from "${oldVariant.title}" to "${newVariant.title}"`
          };
        }
      }

      return {
        hasChanges: false,
        details: 'No variant changes detected'
      };

    } catch (error) {
      logger.error(`Error detecting variant changes: ${error.message}`);
      return {
        hasChanges: true, // Assume changes if we can't determine
        changeType: 'error',
        details: `Error detecting changes: ${error.message}`
      };
    }
  }
}

module.exports = VariantParser;
