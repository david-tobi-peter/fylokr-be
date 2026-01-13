# Fylokr

Fylokr is a modern, high performance file hosting and sharing application built with TypeScript and Node.js.

## 🏗️ Architecture & Branching

The `main` branch serves as the architectural foundation of the application. It defines the core patterns, directory structure, and infrastructure setup to ensure scalability and maintainability.

### Project Structure (Clean Architecture)

- `src/config`: Application configuration and environment variable management
- `src/core`: Core business logic and application orchestration.
  - `controllers`: HTTP request handlers.
  - `decorators`: Custom TypeScript decorators for cross-cutting concerns.
  - `documentation`: OpenAPI/Swagger specifications and YAML components.
  - `errors`: Standardized application error handling.
  - `middlewares`: Express.js interceptors and security middlewares.
  - `services`: Encapsulated business rules and logic.
- `src/infra`: Infrastructure and external service integrations.
  - `database`: PostgreSQL configuration, TypeORM entities, migrations and redis setup
  - `logger`: Centralized logging service (Winston).
  - `security`: Cryptographic utilities and token management.
  - `storage`: File persistence strategy implementation.
- `src/routes`: API route definitions and versioning.
- `src/shared`: Ubiquitous types, interfaces, constants, and utilities.
- `src/scripts`: Maintenance and utility scripts (e.g., migration generation).