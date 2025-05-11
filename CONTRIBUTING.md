# Contributing to Short.ly

First of all, thank you for considering contributing to Short.ly! It's people like you that make Short.ly such a great tool. We welcome contributions from everyone, whether it's a bug report, feature suggestion, documentation improvement, or code contribution.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)
- [Project Structure](#project-structure)

## Code of Conduct

This project and everyone participating in it is governed by the [Short.ly Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@short.ly.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Redis (v6.0 or higher)
- Git

### Fork and Clone the Repository

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/kenzycodex/short.ly.git
   cd short.ly
   ```

3. Add the original repository as a remote:
   ```bash
   git remote add upstream https://github.com/original-org/short.ly.git
   ```

4. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Setting Up the Development Environment

1. Install the dependencies:
   ```bash
   npm install
   ```

2. Set up the environment variables:
   ```bash
   cp .env.dev .env
   ```

3. Start the development environment with Docker:
   ```bash
   docker-compose -f docker/docker-compose.yml up -d
   ```

4. Or start the services individually:
   ```bash
   # Start MongoDB and Redis
   mongod --dbpath /path/to/data/db
   redis-server

   # Start the application
   npm run dev
   ```

5. Verify the setup:
   - Application: http://localhost:3000
   - API Documentation: http://localhost:3000/api-docs
   - Health Check: http://localhost:3000/api/v1/health

## Development Workflow

### Branching Strategy

We use a simplified Git flow approach:

- `main`: The production branch, always stable
- `develop`: The development branch, where new features are integrated
- `feature/*`: Feature branches
- `bugfix/*`: Bug fix branches
- `hotfix/*`: Hot fix branches for production issues
- `release/*`: Release preparation branches

### Keeping Your Fork Updated

Regularly sync your fork with the upstream repository:

```bash
git fetch upstream
git checkout develop
git merge upstream/develop
git push origin develop
```

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Changes that do not affect the code's meaning (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Test-related changes
- `chore`: Changes to the build process, tools, etc.

Examples:
```
feat(analytics): add time-series endpoint for clicks over time
fix(cache): resolve issue with Redis connection timeout
docs: update API documentation with new endpoints
```

## Pull Request Process

1. **Update your branch**: Rebase your branch on the latest upstream develop
   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```

2. **Test your changes**: Ensure all tests pass
   ```bash
   npm test
   ```

3. **Submit your PR**: Push your branch to your fork and create a pull request to the `develop` branch of the upstream repository

4. **PR Template**: Fill out the pull request template, including:
   - Description of changes
   - Issue number(s) addressed
   - Checklist of completed items
   - Screenshots if applicable

5. **Code Review**: Wait for code reviews and address any feedback

6. **Merge**: Once approved, a maintainer will merge your PR

### PR Requirements

- [ ] Tests are included for new features or bug fixes
- [ ] Documentation is updated if necessary
- [ ] Code follows the project's coding standards
- [ ] Commit messages follow conventional commits
- [ ] CI checks pass

## Coding Standards

We use ESLint and Prettier to enforce coding standards:

```bash
# Check code style
npm run lint

# Fix code style issues
npm run format
```

### JavaScript Style Guidelines

- **Naming Conventions**:
  - `camelCase` for variables, functions, methods
  - `PascalCase` for classes
  - `UPPER_SNAKE_CASE` for constants
  - Descriptive names (avoid abbreviations)

- **Code Organization**:
  - One class/component per file
  - Related functionality grouped in directories
  - Follow clean architecture principles

- **Documentation**:
  - JSDoc comments for public APIs
  - Inline comments for complex logic
  - Update README and API docs when needed

### Clean Code Principles

- Single Responsibility Principle
- Don't Repeat Yourself (DRY)
- Keep It Simple, Stupid (KISS)
- You Aren't Gonna Need It (YAGNI)
- Fail Fast

## Testing

We use Jest for testing. All code should be covered by tests:

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific tests
npm test -- --testPathPattern=urlService
```

### Testing Guidelines

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test how components work together
3. **API Tests**: Test API endpoints
4. **Test Coverage**: Aim for at least 80% coverage
5. **Test Organization**: Mirror the source directory structure

Example test structure:
```
/tests
  /unit
    /services
      shortenerService.test.js
    /use-cases
      createShortUrl.test.js
  /integration
    /api
      urlEndpoints.test.js
```

## Documentation

Good documentation is crucial for an open-source project:

1. **Code Comments**: Use JSDoc for public APIs and inline comments for complex logic
2. **README**: Keep the main README.md updated with installation, usage, and key features
3. **API Documentation**: Update Swagger annotations and API.md when adding/changing endpoints
4. **Guides**: Create/update detailed guides in the `/docs` directory

## Community

### Where to Get Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and community support
- **Slack Channel**: For real-time communication
- **Email**: support@short.ly for private inquiries

### Reporting Bugs

Use the bug report template to create a new issue. Include:

1. Bug description
2. Steps to reproduce
3. Expected vs. actual behavior
4. Screenshots if applicable
5. Environment details

### Suggesting Features

Use the feature request template to suggest new features. Include:

1. Problem your feature solves
2. Description of the solution
3. Alternative solutions considered
4. Additional context

## Project Structure

Understanding the project structure is important for contributing effectively:

```
/short.ly
├── src/
│   ├── core/                         # Domain Layer
│   │   ├── entities/                 # Business entities
│   │   │   ├── Url.js                # URL entity
│   │   │   └── Analytics.js          # Analytics entity
│   │   ├── interfaces/               # Repository interfaces
│   │   │   ├── UrlRepository.js      # URL repository interface
│   │   │   └── CacheRepository.js    # Cache repository interface
│   │   └── use-cases/                # Business logic
│   │       ├── CreateShortUrl.js     # URL creation use case
│   │       └── ResolveUrl.js         # URL resolution use case
│   │
│   ├── infrastructure/               # Infrastructure Layer
│   │   ├── db/                       # Database implementations
│   │   │   ├── models/               # Mongoose models
│   │   │   └── repositories/         # Repository implementations
│   │   ├── cache/                    # Cache implementations
│   │   └── providers/                # External APIs
│   │
│   ├── presentation/                 # Presentation Layer
│   │   ├── controllers/              # Request handlers
│   │   ├── middlewares/              # Express middlewares
│   │   ├── routes/                   # API routes
│   │   └── validators/               # Request validation
│   │
│   ├── services/                     # Application services
│   │   ├── shortenerService.js       # URL shortening service
│   │   └── analyticsService.js       # Analytics service
│   │
│   ├── config/                       # Configuration
│   │   ├── index.js                  # Config exports
│   │   └── env.js                    # Environment variables
│   │
│   ├── utils/                        # Utility functions
│   ├── main.js                       # Application entry point
│   └── server.js                     # Express server
```

### Key Areas for Contribution

1. **Core Functionality**: `/src/core`
2. **Database Adapters**: `/src/infrastructure/db`
3. **API Endpoints**: `/src/presentation`
4. **Services**: `/src/services`
5. **Documentation**: `/docs` and inline comments
6. **Tests**: `/tests`

## Recognition

Contributors are recognized in several ways:

- Listed in the [CONTRIBUTORS.md](CONTRIBUTORS.md) file
- Mentioned in release notes
- Acknowledged in our documentation

Thank you for contributing to Short.ly!

---

This document is adapted from various open-source contribution guidelines and is licensed under the [MIT License](LICENSE).