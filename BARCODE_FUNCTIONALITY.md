# Barcode Generation for Shopify Products

This system adds unique barcodes to each product variant when creating or updating products in your Shopify store.

## Features

- **Unique Barcode Generation**: Each variant gets a unique barcode based on product and variant data
- **Multiple Formats**: Support for custom format and EAN-13 international standard
- **Duplicate Prevention**: Ensures no duplicate barcodes across variants
- **Batch Processing**: Process multiple products at once
- **Validation**: Built-in barcode validation and parsing

## Files

### Core Files
- `src/utils/barcodeGenerator.js` - Barcode generation utility
- `src/scripts/addBarcodesToProduct.js` - Command-line script for adding barcodes
- `test-barcode-generation.js` - Test file to demonstrate functionality

### Updated Files
- `src/services/shopifyService.js` - Added methods for updating product variants

## Usage

### Single Product

Add barcodes to a specific product:

```bash
# Basic usage
node src/scripts/addBarcodesToProduct.js --product-id=123456789

# With custom prefix
node src/scripts/addBarcodesToProduct.js --product-id=123456789 --prefix=GEM

# Use EAN-13 format
node src/scripts/addBarcodesToProduct.js --product-id=123456789 --ean13

# Force update (regenerate existing barcodes)
node src/scripts/addBarcodesToProduct.js --product-id=123456789 --force
```

### Batch Processing

Process multiple products at once:

```bash
# Process up to 10 products
node src/scripts/addBarcodesToProduct.js --batch --limit=10

# Process with custom prefix
node src/scripts/addBarcodesToProduct.js --batch --prefix=GEM --limit=20

# Process with EAN-13 format
node src/scripts/addBarcodesToProduct.js --batch --ean13 --limit=15

# Force update all products
node src/scripts/addBarcodesToProduct.js --batch --force --limit=10
```

## Barcode Formats

### Custom Format
Default format: `PREFIX + PRODUCT_ID + VARIANT_ID + UNIQUE_HASH`

Example: `GEM1234567890987654321ABCD1234`
- `GEM` - Prefix (configurable)
- `123456` - Product ID (padded to 6 digits)
- `7890` - Variant ID (padded to 4 digits)
- `987654321ABCD1234` - Unique hash (8 characters)

### EAN-13 Format
International standard: `COUNTRY_CODE + MANUFACTURER_CODE + PRODUCT_CODE + CHECK_DIGIT`

Example: `0012345678901`
- `00` - Country code (configurable)
- `12345` - Manufacturer code (from product ID)
- `67890` - Product code (from variant ID)
- `1` - Check digit (calculated)

## API Usage

### Generate Barcode for Single Variant

```javascript
const BarcodeGenerator = require('./src/utils/barcodeGenerator');

const product = { id: 123456789, title: 'Ruby Gemstone' };
const variant = { id: 987654321, title: '2mm Round' };

// Custom format
const barcode = BarcodeGenerator.generateBarcode(product, variant, 'GEM');

// EAN-13 format
const ean13Barcode = BarcodeGenerator.generateEAN13Barcode(product, variant);
```

### Generate Barcodes for All Variants

```javascript
const variantsWithBarcodes = BarcodeGenerator.generateBarcodesForProduct(product, 'GEM');
```

### Validate Barcode

```javascript
const isValid = BarcodeGenerator.validateBarcode(barcode, 'GEM');
```

### Parse Barcode Information

```javascript
const info = BarcodeGenerator.parseBarcode(barcode, 'GEM');
// Returns: { prefix, productId, variantId, uniqueHash, fullBarcode }
```

### Check for Duplicates

```javascript
const isDuplicate = BarcodeGenerator.isBarcodeDuplicate(barcode, existingVariants);
```

### Generate Unique Barcode

```javascript
const uniqueBarcode = BarcodeGenerator.generateUniqueBarcode(
  product, 
  variant, 
  existingVariants, 
  'GEM'
);
```

## Shopify Integration

### Update Product Variants

```javascript
const shopifyService = require('./src/services/shopifyService');

const updateData = {
  id: productId,
  variants: variantsWithBarcodes
};

const updatedProduct = await shopifyService.updateProductVariants(productId, updateData);
```

### Get Products

```javascript
const products = await shopifyService.getProducts({ limit: 50 });
```

## Testing

Run the test file to see the barcode generation in action:

```bash
node test-barcode-generation.js
```

This will demonstrate:
- Custom barcode generation
- EAN-13 barcode generation
- Barcode validation
- Duplicate detection
- Barcode parsing

## Configuration

### Environment Variables
Make sure your `.env` file contains the necessary Shopify credentials:

```env
SHOPIFY_SHOP_NAME=your-shop.myshopify.com
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_PASSWORD=your_api_password
```

### Barcode Prefix
You can customize the barcode prefix by using the `--prefix` parameter:

- `GEM` - For gemstone products
- `JEW` - For jewelry products
- `ACC` - For accessories
- Or any other prefix you prefer

## Error Handling

The system includes comprehensive error handling:

- **Connection failures**: Retries with exponential backoff
- **Rate limiting**: Respects Shopify API limits
- **Invalid barcodes**: Validation before saving
- **Duplicate detection**: Prevents conflicts
- **Missing data**: Graceful fallbacks

## Logging

All operations are logged using the existing logger system:

- Info: Successful operations
- Warning: Non-critical issues
- Error: Failed operations

Check the `logs/` directory for detailed operation logs.

## Best Practices

1. **Test First**: Always test with a single product before batch processing
2. **Backup Data**: Ensure you have a backup before running batch operations
3. **Monitor Logs**: Check logs for any issues during processing
4. **Use Appropriate Prefix**: Choose meaningful prefixes for your product categories
5. **Validate Results**: Always verify the generated barcodes are correct

## Troubleshooting

### Common Issues

1. **"Product not found"**
   - Verify the product ID is correct
   - Check if the product exists in your Shopify store

2. **"Shopify connection failed"**
   - Verify your API credentials in `.env`
   - Check your internet connection
   - Ensure your Shopify app has the necessary permissions

3. **"Rate limit exceeded"**
   - The system automatically handles rate limiting
   - If you see this error, wait a moment and try again

4. **"Invalid barcode format"**
   - Check that the prefix matches the expected format
   - Ensure barcodes are alphanumeric only

### Getting Help

If you encounter issues:

1. Check the logs in the `logs/` directory
2. Run the test file to verify functionality
3. Verify your Shopify API credentials
4. Ensure you have the necessary permissions in your Shopify app
