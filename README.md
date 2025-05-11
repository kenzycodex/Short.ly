# Short.ly - Enterprise URL Shortener Platform

<div align="center">

<!-- ![Short.ly Logo](https://via.placeholder.com/200x60?text=Short.ly) -->

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2016.0.0-brightgreen)](package.json)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.4%2B-green)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-6.0%2B-red)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-ready-blue)](docker/docker-compose.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

*A professional, production-ready cloud URL shortener platform with analytics, caching, and multi-cloud deployment capabilities.*

</div>

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Cloud Deployment](#-cloud-deployment)
- [Monitoring](#-monitoring)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Core Features
- **URL Shortening**
  - Custom aliases support
  - Expiration dates
  - Batch URL creation
  - URL deactivation/reactivation
 
### Analytics
- **Comprehensive Tracking**
  - Click counts and history
  - Referrer analysis
  - Browser/device detection
  - Geographic location tracking
  - Time-series visualizations

### Performance
- **Advanced Caching**
  - Redis-based for optimal performance
  - Tiered caching strategy
  - Cache invalidation on URL updates
  - Distributed cache support

### Security
- **Enterprise-Grade Security**
  - Rate limiting
  - Input validation
  - JWT authentication
  - CSRF protection
  - XSS prevention

### Integrations
- **Serverless Architecture Support**
  - AWS Lambda integration
  - Cloudflare Workers compatible
  - Google Cloud Functions support
  
### Developer Experience
- **Multi-Environment Support**
  - Development mode
  - MVP mode
  - Production mode
  - Seamless environment switching

## 🏗 Architecture

Short.ly is built using Clean Architecture principles, ensuring separation of concerns and allowing for easy maintenance and extensibility.

![Architecture Diagram](https://via.placeholder.com/800x400?text=Short.ly+Architecture)

### Core Layers

#### 1. Domain Layer
The inner-most layer containing business entities and logic independent of any external frameworks or technologies.

- **Entities**: `Url`, `Analytics`, etc.
- **Use Cases**: Business rules defining how entities interact.
- **Interfaces**: Contracts that external layers must implement.

#### 2. Infrastructure Layer
Implements interfaces defined by the domain layer and handles external dependencies.

- **Database Adapters**: MongoDB implementation of repositories.
- **Cache Adapters**: Redis implementation of cache repositories.
- **External Services**: Third-party API integrations (IP geolocation, etc.).

#### 3. Presentation Layer
Handles HTTP requests and responses, implementing the API endpoints.

- **Controllers**: Handle incoming requests and format responses.
- **Routes**: Define API endpoints and connect to controllers.
- **Middlewares**: Authentication, rate limiting, error handling, etc.

#### 4. Application Layer
Coordinates the flow of data and orchestrates use cases.

- **Services**: Coordinate multiple use cases and aggregate data.
- **DTOs**: Data Transfer Objects for transforming data between layers.

### Directory Structure

```
/short.ly
├── src/
│   ├── core/                         # Domain Layer
│   │   ├── entities/
│   │   ├── interfaces/
│   │   └── use-cases/
│   │
│   ├── infrastructure/               # Infrastructure Layer
│   │   ├── db/
│   │   ├── cache/
│   │   └── providers/
│   │
│   ├── presentation/                 # Presentation Layer
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   └── validators/
│   │
│   ├── services/                     # Application Layer
│   │   ├── shortenerService.js
│   │   └── analyticsService.js
│   │
│   ├── config/                       # Configuration
│   │   ├── index.js
│   │   └── env.js
│   │
│   ├── utils/                        # Utilities
│   ├── main.js                       # Entry point
│   └── server.js                     # Express server
│
├── lambda/                           # AWS Lambda Functions
├── scripts/                          # Deployment Scripts
├── docker/                           # Docker Configuration
├── tests/                            # Test Suites
└── docs/                             # Documentation
```

## 🛠 Tech Stack

### Backend
- **[Node.js](https://nodejs.org/)** (v16+): JavaScript runtime
- **[Express](https://expressjs.com/)**: Web framework
- **[MongoDB](https://www.mongodb.com/)**: NoSQL database for persistence
- **[Redis](https://redis.io/)**: In-memory data structure store for caching

### Storage
- **MongoDB Atlas**: For production database hosting
- **Redis Cloud/ElastiCache**: For production cache hosting

### Hosting/Cloud
- **AWS**: Lambda, EC2, Route 53, S3
- **Google Cloud Platform**: Cloud Run, Cloud Functions, Cloud Storage
- **Cloudflare**: Workers, DNS, caching

### Monitoring & Logging
- **Winston**: Logging library
- **Express Prometheus**: Metrics collection
- **Morgan**: HTTP request logging

### Development
- **Docker**: Containerization
- **Jest**: Testing framework
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks

## 📥 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Redis (v6.0 or higher)
- Docker and Docker Compose (optional, for containerized development)

### Local Setup

1. **Clone the repository**

```bash
git clone https://github.com/kenzycodex/short.ly.git
cd short.ly
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
# For development
cp .env.dev .env
```

4. **Start with Docker Compose** (recommended)

```bash
docker-compose -f docker/docker-compose.yml up -d
```

5. **Or start services individually**

```bash
# Start MongoDB
mongod --dbpath /path/to/data/db

# Start Redis
redis-server

# Start the application
npm run dev
```

6. **Verify installation**

Visit [http://localhost:3000/api-docs](http://localhost:3000/api-docs) to view the API documentation and [http://localhost:3000/api/v1/health](http://localhost:3000/api/v1/health) to check the application health.

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --testPathPattern=url

# Run with coverage
npm test -- --coverage
```

## ⚙️ Configuration

Short.ly supports multiple environments through different configuration files:

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_ENV` | Environment (development, mvp, production) | `development` |
| `PORT` | Port the server listens on | `3000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/shortlydb_dev` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `URL_LENGTH` | Length of generated short codes | `7` |
| `DOMAIN_URL` | Domain for short URLs | `http://localhost:3000` |
| `ANALYTICS_ENABLED` | Whether analytics are enabled | `true` |
| `USE_LAMBDA_REDIRECTS` | Use AWS Lambda for redirects | `false` |

### Environment-Specific Configuration

- `.env.dev`: Development environment settings
- `.env.mvp`: Minimum Viable Product environment settings
- `.env.prod`: Production environment settings

### Switching Environments

```bash
# Development mode
cp .env.dev .env
npm run dev

# MVP mode
cp .env.mvp .env
npm run start:mvp

# Production mode
cp .env.prod .env
npm run start:prod
```

### Advanced Configuration

For advanced configuration options, see the [Configuration Guide](docs/CONFIGURATION.md).

## 📚 API Documentation

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/urls` | Create a new short URL |
| `GET` | `/api/v1/urls/{shortCode}` | Get URL details |
| `PATCH` | `/api/v1/urls/{shortCode}` | Update a URL |
| `DELETE` | `/api/v1/urls/{shortCode}` | Delete a URL |
| `GET` | `/{shortCode}` | Redirect to the original URL |
| `GET` | `/api/v1/analytics/{shortCode}` | Get URL analytics |

### Swagger Documentation

When the application is running, Swagger documentation is available at:

- Development: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- MVP: [https://api-mvp.short.ly/api-docs](https://api-mvp.short.ly/api-docs)
- Production: [https://api.short.ly/api-docs](https://api.short.ly/api-docs)

### Detailed API Documentation

For detailed API documentation, see the [API Guide](docs/API.md).

## 🌩 Cloud Deployment

Short.ly can be deployed to various cloud providers:

### AWS Deployment

1. **Set up infrastructure**

```bash
# Create Lambda function for redirects
./scripts/deploy-lambda.sh -e prod -r us-east-1

# Deploy to EC2 or ECS
./scripts/deploy.sh -e prod
```

2. **Configure DNS with Route 53**

```bash
# Create DNS records
aws route53 change-resource-record-sets --hosted-zone-id ZXXXXXXXXXX --change-batch file://route53-changes.json
```

For a step-by-step AWS deployment guide, see [AWS Deployment](docs/deployment/AWS.md).

### Google Cloud Deployment

1. **Build and push Docker image**

```bash
docker build -t gcr.io/your-project/short-ly .
docker push gcr.io/your-project/short-ly
```

2. **Deploy to Cloud Run**

```bash
gcloud run deploy short-ly --image gcr.io/your-project/short-ly --platform managed --region us-central1
```

For a step-by-step GCP deployment guide, see [GCP Deployment](docs/deployment/GCP.md).

### CI/CD Pipeline

Short.ly includes GitHub Actions workflows for CI/CD:

- `.github/workflows/test.yml`: Runs tests on pull requests
- `.github/workflows/deploy.yml`: Deploys to appropriate environment on merge to main

For CI/CD details, see [CI/CD Documentation](docs/CI_CD.md).

## 📊 Monitoring

### Health Checks

The application includes a health check endpoint at `/api/v1/health` that returns the status of the application and its dependencies.

### Metrics

Short.ly exports Prometheus metrics at `/api/v1/metrics` for monitoring:

- Request counts and latencies
- Redis cache hit/miss ratios
- MongoDB query performance
- Memory usage

### Logging

Logs are structured as JSON for easy parsing and analysis:

```javascript
{
  "level": "info",
  "timestamp": "2023-07-22T10:15:30.123Z",
  "message": "URL created",
  "shortCode": "abc123",
  "originalUrl": "https://example.com"
}
```

For production deployments, logs can be shipped to:
- AWS CloudWatch
- Google Cloud Logging
- ELK Stack
- Datadog

For detailed monitoring setup, see [Monitoring Guide](docs/MONITORING.md).

## 🤝 Contributing

We welcome contributions to Short.ly! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:

- Code of conduct
- Development process
- Pull request process
- Coding standards
- Testing requirements

### Getting Started with Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [Express.js](https://expressjs.com/) - Web framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Redis](https://redis.io/) - Caching
- [AWS Lambda](https://aws.amazon.com/lambda/) - Serverless computing
- [Docker](https://www.docker.com/) - Containerization
- [Swagger](https://swagger.io/) - API documentation

---

<div align="center">

**[Website](https://short.ly)** • 
**[Documentation](https://docs.short.ly)** • 
**[Issues](https://github.com/kenzycodex/short.ly/issues)** • 
**[Support](support@short.ly)**

</div>
