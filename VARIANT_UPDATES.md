# Variant Update System

This document explains how the Shopify-Gemini automation system handles variant changes and automatically updates product descriptions.

## Overview

When product variants are edited in Shopify, the system automatically detects these changes and regenerates the product description to reflect the updated variant information.

## How It Works

### 1. Webhook Detection
- Shopify sends a `products/update` webhook when any product changes occur
- The webhook includes the updated product data with current variant information

### 2. Variant Change Detection
The system compares the updated product with the current product state to detect changes:

- **Variant Count Changes**: Adding or removing variants
- **Option Changes**: Modifying option names or values
- **Variant Details**: Changing variant titles or option combinations
- **Option Values**: Adding, removing, or modifying option values

### 3. Smart Description Updates
If variant changes are detected, the system:

1. **For products without AI descriptions**: Generates a complete new description
2. **For products with existing AI descriptions**: Updates only the variants bullet point
3. **Preserves all other content**: Keeps the existing description, features, and formatting
4. **Dynamic variant updates**: Only the "Available Variants" bullet point is modified

## Variant Detection Logic

### Types of Changes Detected

```javascript
// Variant count changes
if (oldVariants.length !== newVariants.length) {
  // Triggers regeneration
}

// Option name changes
if (oldOption.name !== newOption.name) {
  // Triggers regeneration
}

// Option value changes
if (oldValues[j] !== newValues[j]) {
  // Triggers regeneration
}

// Variant option changes
if (oldVariant.option1 !== newVariant.option1) {
  // Triggers regeneration
}
```

### Variant Formatting

The system formats variants for inclusion in descriptions:

```javascript
// Example: "Size: Small, Material: Gold; Size: Medium, Material: Gold"
const formattedVariants = VariantParser.formatVariantsForDescription(variants, options);
```

## Configuration

### Webhook Setup
Ensure the `products/update` webhook is configured:

```bash
curl -X POST "https://your-shop.myshopify.com/admin/api/2024-01/webhooks.json" \
  -H "X-Shopify-Access-Token: your_access_token" \
  -d '{
    "webhook": {
      "topic": "products/update",
      "address": "https://your-app-url.com/webhooks/shopify",
      "format": "json"
    }
  }'
```

### Environment Variables
```env
WEBHOOK_PATH=/webhooks/shopify
SHOPIFY_SHOP_NAME=your-shop
SHOPIFY_ACCESS_TOKEN=your_access_token
```

## Testing

Run the variant update test script:

```bash
node test-variant-updates.js
```

This will test:
- Variant change detection
- Variant formatting
- Different change scenarios

## Example Scenarios

### Scenario 1: Adding a New Variant
**Before:**
- Size: Small, Medium
- Material: Gold

**After:**
- Size: Small, Medium, Large
- Material: Gold

**Result:** Only the "Available Variants" bullet point is updated, rest of description remains unchanged

### Scenario 2: Changing Material Options
**Before:**
- Size: Small, Medium
- Material: Gold

**After:**
- Size: Small, Medium
- Material: Platinum

**Result:** Only the "Available Variants" bullet point is updated with new material, rest of description remains unchanged

### Scenario 3: No Changes
**Before:**
- Size: Small, Medium
- Material: Gold

**After:**
- Size: Small, Medium
- Material: Gold

**Result:** No update (no changes detected)

### Scenario 4: Removing All Variants
**Before:**
- Size: Small, Medium
- Material: Gold

**After:**
- No variants (Standard product)

**Result:** The "Available Variants" bullet point is completely removed from the description

## API Endpoints

### Manual Variant Update Trigger
```bash
# Update only variants in existing description
POST /update-variants/:productId

# Force regenerate entire description
POST /force-regenerate/:productId
```

### Check Processing Status
```bash
GET /status
```

### Get Product Information
```bash
GET /products
```

## Logging

The system logs variant change detection:

```
INFO: Variant changes detected for product 123: Option "Material" value changed from "Gold" to "Platinum"
INFO: Product 123 needs description update: Variants changed
INFO: Webhook triggered description generation for product 123
```

## Error Handling

- If variant comparison fails, the system assumes changes occurred (safe default)
- Network errors during product fetching are logged and handled gracefully
- Invalid variant data is filtered out during formatting

## Best Practices

1. **Test Changes**: Use the test script to verify variant detection
2. **Monitor Logs**: Check logs for variant change detection
3. **Webhook Health**: Ensure webhooks are properly configured
4. **Rate Limiting**: The system respects Shopify's API rate limits

## Troubleshooting

### Variants Not Updating
1. Check webhook configuration
2. Verify webhook endpoint is accessible
3. Check logs for error messages
4. Test with manual trigger endpoint

### False Positives
1. Review variant comparison logic
2. Check for data inconsistencies
3. Verify product data structure

### Performance Issues
1. Monitor API rate limits
2. Check processing queue status
3. Review webhook processing times
