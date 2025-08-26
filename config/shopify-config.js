const shopifyConfig = {
  // API Configuration
  api: {
    version: '2024-01',
    restResources: true,
    timeout: 30000,
    retryLimit: 3,
    retryDelay: 1000
  },

  // Rate Limiting
  rateLimiting: {
    requestsPerSecond: 2,
    bucketSize: 40,
    retryAfterHeader: 'Retry-After'
  },

  // Product Fields to Extract
  productFields: [
    'id',
    'title',
    'body_html',
    'product_type',
    'vendor',
    'tags',
    'variants',
    'options',
    'images',
    'metafields',
    'seo'
  ],

  // Variant Fields
  variantFields: [
    'id',
    'title',
    'option1',
    'option2',
    'option3',
    'sku',
    'price',
    'compare_at_price',
    'inventory_quantity',
    'inventory_management'
  ],

  // Webhook Topics
  webhookTopics: [
    'products/create',
    'products/update',
    'products/delete'
  ],

  // Webhook Configuration
  webhooks: {
    format: 'json',
    api_version: '2024-01',
    private_app: false
  },

  // SEO Fields
  seoFields: {
    title: 'title',
    description: 'description'
  },

  // Metafields Configuration
  metafields: {
    namespace: 'rezagem',
    key: 'ai_description',
    type: 'multi_line_text_field'
  },

  // Error Handling
  errorHandling: {
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true
  },

  // Logging
  logging: {
    enabled: true,
    level: 'info',
    includeRequestId: true
  }
};

module.exports = shopifyConfig;
