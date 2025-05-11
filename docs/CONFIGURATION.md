# Short.ly Configuration Guide

This document provides detailed information about configuring Short.ly for different environments and use cases.

## Table of Contents

- [Environment Variables](#environment-variables)
- [Configuration Files](#configuration-files)
- [Database Configuration](#database-configuration)
- [Redis Cache Configuration](#redis-cache-configuration)
- [URL Configuration](#url-configuration)
- [Analytics Configuration](#analytics-configuration)
- [AWS Lambda Configuration](#aws-lambda-configuration)
- [Security Configuration](#security-configuration)
- [Logging Configuration](#logging-configuration)
- [Custom Domain Configuration](#custom-domain-configuration)

## Environment Variables

Short.ly uses environment variables for configuration. These can be set in `.env` files or directly in the environment.

### Core Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Node.js environment | `development` | Yes |
| `APP_ENV` | Application environment | `development` | Yes |
| `PORT` | Server port | `3000` | Yes |
| `HOST` | Server hostname | `localhost:3000` | Yes |
| `BASE_URL` | Base URL for API | `http://localhost:3000` | Yes |

### Environment Selection

The application uses different configuration files based on the `APP_ENV` variable:

```bash
# For development
APP_ENV=development npm run dev

# For MVP
APP_ENV=mvp npm start

# For production
APP_ENV=production npm start
```

## Configuration Files

Short.ly uses the following configuration files:

- `.env.dev`: Development environment
- `.env.mvp`: MVP environment
- `.env.prod`: Production environment

### File Structure

Each file follows the same structure:

```
# Environment settings
NODE_ENV=development
APP_ENV=development
PORT=3000
HOST=localhost:3000
BASE_URL=http://localhost:3000

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/shortlydb_dev
MONGO_OPTIONS={"useNewUrlParser": true, "useUnifiedTopology": true}

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TTL=86400

# URL Configuration
URL_LENGTH=7
DOMAIN_URL=http://localhost:3000

# Analytics
IPINFO_API_KEY=your_ipinfo_api_key
ANALYTICS_ENABLED=true

# AWS Lambda
AWS_REGION=us-east-1
AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET_KEY=your_aws_secret_key
AWS_LAMBDA_FUNCTION=short-ly-redirect
USE_LAMBDA_REDIRECTS=false

# Logging
LOG_LEVEL=debug
REQUEST_LOGGING=true

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## Database Configuration

### MongoDB Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/shortlydb_dev` | Yes |
| `MONGO_OPTIONS` | MongoDB connection options (JSON) | `{"useNewUrlParser": true, "useUnifiedTopology": true}` | No |

### Connection Options

For production, we recommend using MongoDB Atlas with the following settings:

```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/shortlydb_prod
MONGO_OPTIONS={"useNewUrlParser": true, "useUnifiedTopology": true, "retryWrites": true, "w": "majority"}
```

### Replica Sets

For high availability in production, use MongoDB replica sets:

```
MONGO_URI=mongodb://mongo1:27017,mongo2:27017,mongo3:27017/shortlydb_prod?replicaSet=rs0
```

## Redis Cache Configuration

### Redis Connection Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REDIS_HOST` | Redis host | `localhost` | Yes |
| `REDIS_PORT` | Redis port | `6379` | Yes |
| `REDIS_PASSWORD` | Redis password | ` ` | No |
| `REDIS_SSL` | Enable SSL | `false` | No |
| `REDIS_TTL` | Default TTL in seconds | `86400` (1 day) | No |

### Redis Cluster

For production with Redis Cluster:

```
REDIS_HOST=your-redis-cluster.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_SSL=true
REDIS_TTL=604800  # 1 week
```

### Cache TTL Values

| Content Type | Recommended TTL | Configuration |
|--------------|-----------------|---------------|
| URL redirects | 1 day | `REDIS_TTL=86400` |
| Analytics dashboards | 1 hour | (Hardcoded in service) |
| User data | 15 minutes | (Hardcoded in service) |

## URL Configuration

### URL Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `URL_LENGTH` | Length of generated short codes | `7` | No |
| `DOMAIN_URL` | Domain for short URLs | `http://localhost:3000` | Yes |

### Custom URL Patterns

Short.ly supports custom URL patterns and aliases:

- Alphanumeric: `[a-zA-Z0-9]`
- With hyphens and underscores: `[a-zA-Z0-9-_]`
- Custom regex patterns (configurable in code)

## Analytics Configuration

### Analytics Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ANALYTICS_ENABLED` | Enable analytics tracking | `true` | No |
| `IPINFO_API_KEY` | API key for IP geolocation | ` ` | No |

### IP Geolocation

Short.ly uses ipinfo.io for IP geolocation. Register at [ipinfo.io](https://ipinfo.io/) to get an API key.

### Disable Analytics

For privacy-focused deployments, you can disable analytics:

```
ANALYTICS_ENABLED=false
```

## AWS Lambda Configuration

### Lambda Variables

| Variable | Description | Default | Required for Lambda |
|----------|-------------|---------|---------------------|
| `AWS_REGION` | AWS region | `us-east-1` | Yes |
| `AWS_ACCESS_KEY` | AWS access key | ` ` | Yes |
| `AWS_SECRET_KEY` | AWS secret key | ` ` | Yes |
| `AWS_LAMBDA_FUNCTION` | Lambda function name | `short-ly-redirect` | Yes |
| `USE_LAMBDA_REDIRECTS` | Use Lambda for redirects | `false` | No |

### Lambda Deployment

To deploy the Lambda function:

```bash
./scripts/deploy-lambda.sh -e prod -r us-east-1
```

### API Gateway Integration

Set up API Gateway to trigger the Lambda function:

```bash
aws apigateway create-rest-api --name "Short.ly Redirect API" --description "API for Short.ly URL redirection"
```

For detailed Lambda setup, see [AWS Lambda Deployment](deployment/AWS_LAMBDA.md).

## Security Configuration

### Rate Limiting

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RATE_LIMIT_WINDOW_MS` | Time window in milliseconds | `900000` (15 minutes) | No |
| `RATE_LIMIT_MAX` | Maximum requests per window | `100` | No |

### Authentication

Short.ly uses JWT for authentication. Configure with:

```
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=86400  # 1 day
```

### CORS Configuration

To configure CORS:

```
CORS_ORIGIN=*
CORS_METHODS=GET,POST,PATCH,DELETE
```

## Logging Configuration

### Logging Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `LOG_LEVEL` | Logging level | `info` | No |
| `REQUEST_LOGGING` | Enable HTTP request logging | `true` | No |

### Log Levels

Available log levels:

- `error`: Error events only
- `warn`: Warning and error events
- `info`: Informational, warning, and error events
- `debug`: Debug, informational, warning, and error events

### External Logging

For production, configure external logging:

```
LOG_TO_FILE=true
LOG_FILE_PATH=/var/log/shortly
LOG_TO_CLOUDWATCH=true
```

## Custom Domain Configuration

### Domain Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DOMAIN_URL` | Domain for short URLs | `http://localhost:3000` | Yes |

### Multiple Domains

Short.ly supports multiple domains:

```
PRIMARY_DOMAIN=short.ly
ALTERNATE_DOMAINS=s.ly,shortly.link
```

### Domain Setup with Cloudflare

1. Add domain to Cloudflare
2. Configure DNS records:
   ```
   API  A   1.2.3.4
   WWW  A   1.2.3.4
   @    A   1.2.3.4
   ```
3. Set up Page Rules for caching

For detailed Cloudflare setup, see [Cloudflare Integration](deployment/CLOUDFLARE.md).

---

## Advanced Configuration Examples

### High-Performance Production Setup

```
# MongoDB with connection pooling
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/shortlydb_prod
MONGO_OPTIONS={"useNewUrlParser":true,"useUnifiedTopology":true,"maxPoolSize":50,"minPoolSize":10}

# Redis with cluster
REDIS_HOST=your-redis-cluster.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_SSL=true
REDIS_TTL=604800

# Performance tuning
NODE_ENV=production
COMPRESSION_ENABLED=true
CACHE_CONTROL_MAX_AGE=86400
CLUSTER_MODE=true
WORKERS=4

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=50
HELMET_ENABLED=true
```

### Minimal Resource Development Setup

```
# Lightweight MongoDB
MONGO_URI=mongodb://localhost:27017/shortlydb_dev
MONGO_OPTIONS={"useNewUrlParser":true,"useUnifiedTopology":true,"maxPoolSize":5}

# Local Redis with minimal memory
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL=3600

# Development settings
NODE_ENV=development
COMPRESSION_ENABLED=false
CLUSTER_MODE=false
WORKERS=1

# Liberal rate limits for development
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX=1000
```

<!-- For further configuration options or customization, please contact support@short.ly or open an issue on GitHub. -->