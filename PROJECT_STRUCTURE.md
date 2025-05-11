# Complete Project Structure for Short.ly URL Shortener

```
/short.ly
├── src/                        # Application source code
│   ├── core/                   # Domain Layer
│   │   ├── entities/           # Business entities
│   │   │   ├── Url.js          # URL entity
│   │   │   └── Analytics.js    # Analytics entity
│   │   ├── interfaces/         # Repository interfaces
│   │   │   ├── UrlRepository.js
│   │   │   ├── AnalyticsRepository.js
│   │   │   └── CacheRepository.js
│   │   └── use-cases/          # Business logic
│   │       ├── CreateShortUrl.js
│   │       ├── ResolveUrl.js
│   │       └── GetUrlAnalytics.js
│   │
│   ├── infrastructure/         # Infrastructure Layer
│   │   ├── db/                 # Database implementations
│   │   │   ├── models/         # Mongoose models
│   │   │   │   ├── UrlModel.js
│   │   │   │   └── AnalyticsModel.js
│   │   │   ├── repositories/   # Repository implementations
│   │   │   │   ├── MongoUrlRepository.js
│   │   │   │   └── MongoAnalyticsRepository.js
│   │   │   └── mongoClient.js
│   │   ├── cache/             # Cache implementations
│   │   │   ├── RedisCacheRepository.js
│   │   │   └── redisClient.js
│   │   └── providers/         # External services
│   │       └── ipInfoProvider.js
│   │
│   ├── presentation/          # Presentation Layer
│   │   ├── controllers/       # Request handlers
│   │   │   ├── urlController.js
│   │   │   ├── analyticsController.js
│   │   │   └── healthController.js
│   │   ├── middlewares/       # Express middlewares
│   │   │   ├── authMiddleware.js
│   │   │   ├── rateLimitMiddleware.js
│   │   │   └── errorHandlerMiddleware.js
│   │   ├── routes/            # API routes
│   │   │   ├── urlRoutes.js
│   │   │   ├── analyticsRoutes.js
│   │   │   ├── redirectRoutes.js
│   │   │   └── healthRoutes.js
│   │   └── validators/        # Request validation
│   │       ├── urlValidator.js
│   │       └── analyticsValidator.js
│   │
│   ├── services/              # Application services
│   │   ├── shortenerService.js
│   │   ├── analyticsService.js
│   │   └── lambdaService.js
│   │
│   ├── config/                # Configuration
│   │   ├── index.js
│   │   └── env.js
│   │
│   ├── utils/                 # Utility functions
│   │   ├── logger.js
│   │   ├── validator.js
│   │   └── responseFormatter.js
│   │
│   ├── main.js                # Application entry point
│   └── server.js              # Express server
│
├── lambda/                    # AWS Lambda Functions
│   └── redirect.js            # Serverless redirect
│
├── scripts/                   # Deployment Scripts
│   ├── deploy.sh              # Main deployment script
│   └── deploy-lambda.sh       # Lambda deployment script
│
├── docker/                    # Docker Configuration
│   ├── docker-compose.yml     # Development environment
│   └── Dockerfile             # Application container
│
├── tests/                     # Test Suites
│   ├── unit/                  # Unit tests
│   │   ├── core/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/           # Integration tests
│   │   ├── api/
│   │   └── repositories/
│   └── fixtures/              # Test fixtures
│
├── docs/                      # Documentation
│   ├── API.md                 # API documentation
│   ├── CONFIGURATION.md       # Configuration guide
│   ├── deployment/            # Deployment guides
│   │   ├── AWS.md             # AWS deployment
│   │   ├── GCP.md             # Google Cloud deployment
│   │   └── AZURE.md           # Azure deployment
│   └── images/                # Documentation images
│
├── .env.dev                   # Development environment variables
├── .env.mvp                   # MVP environment variables
├── .env.prod                  # Production environment variables
├── .eslintrc.js               # ESLint configuration
├── .prettierrc                # Prettier configuration
├── .gitignore                 # Git ignore file
├── jest.config.js             # Jest configuration
├── package.json               # NPM package configuration
├── swagger.json               # OpenAPI specification
├── LICENSE                    # Project license
├── README.md                  # Project overview
└── CONTRIBUTING.md            # Contribution guidelines
```