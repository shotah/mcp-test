# MCP Worker - Refactored Structure

This worker has been refactored into a clean, modular structure for better maintainability and organization.

## File Structure

```
src/
├── index.ts              # Main worker entry point
├── types.ts              # TypeScript interfaces and types
├── logger.ts             # Pretty logging utility
├── auth.ts               # Authentication utilities
├── rate-limit.ts         # Rate limiting logic
├── cors.ts               # CORS handling utilities
└── handlers/            # Endpoint handlers
    ├── health.ts         # Health check endpoint
    ├── debug.ts          # Debug information endpoint
    ├── api.ts            # API info endpoint
    ├── embed.ts          # Text embedding endpoint
    ├── search.ts         # Document search endpoint
    └── chat.ts           # Chat completion endpoint
```

## Key Improvements

### 🎨 **Pretty Logging**
- Clean, emoji-based logging with timestamps
- Structured data logging for better debugging
- Consistent formatting across all components

### 🏗️ **Modular Architecture**
- Separated concerns into focused modules
- Reusable utility functions
- Clear separation between handlers and utilities

### 🔧 **Type Safety**
- Comprehensive TypeScript interfaces
- Strong typing throughout the codebase
- Better IDE support and error catching

### 🚀 **Maintainability**
- Easy to add new endpoints
- Simple to modify existing functionality
- Clear code organization

## Usage

The main `index.ts` file orchestrates all the components:

1. **Request Processing**: Logs request details and sets up CORS
2. **Rate Limiting**: Checks client IP against rate limits
3. **Authentication**: Validates tokens for protected endpoints
4. **Routing**: Delegates to appropriate handlers
5. **Error Handling**: Consistent error responses

## Adding New Endpoints

1. Create a new handler in `handlers/`
2. Add the route to the switch statement in `index.ts`
3. Import and use the handler function

## Logging

Use the `Logger` class for consistent, pretty logging:

```typescript
Logger.info('Information message');
Logger.success('Success message', { data: 'example' });
Logger.warning('Warning message');
Logger.error('Error message', errorObject);
```

The logger automatically formats messages with timestamps and emojis for easy reading in Cloudflare Workers logs.
