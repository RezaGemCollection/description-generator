const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  defaultMeta: { service: 'shopify-gemini-automation' },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Daily rotating file
    new winston.transports.File({
      filename: path.join(logsDir, 'daily.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 30
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Add request ID to logs if available
logger.addRequestId = (requestId) => {
  return winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        requestId,
        ...meta
      });
    })
  );
};

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Colors for different log levels
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(colors);

// Custom logging methods
logger.logProductGeneration = (productId, productTitle, status, details = {}) => {
  logger.info('Product description generation', {
    productId,
    productTitle,
    status,
    ...details
  });
};

logger.logWebhookEvent = (topic, productId, action, details = {}) => {
  logger.info('Webhook event received', {
    topic,
    productId,
    action,
    ...details
  });
};

logger.logAPICall = (service, endpoint, status, duration, details = {}) => {
  logger.info('API call', {
    service,
    endpoint,
    status,
    duration,
    ...details
  });
};

logger.logError = (error, context = {}) => {
  logger.error('Application error', {
    error: error.message,
    stack: error.stack,
    ...context
  });
};

// Performance logging
logger.logPerformance = (operation, duration, details = {}) => {
  logger.info('Performance metric', {
    operation,
    duration,
    ...details
  });
};

// Security logging
logger.logSecurity = (event, details = {}) => {
  logger.warn('Security event', {
    event,
    ...details
  });
};

// Export logger instance
module.exports = logger;
