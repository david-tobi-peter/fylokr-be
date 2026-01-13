# Fylokr

Fylokr is a modern, high-performance file hosting and sharing application built with TypeScript and Node.js.

## 🏗️ Architecture & Branching

The `main` branch serves as the architectural foundation of the application. It defines the core patterns, directory structure, and infrastructure setup to ensure scalability and maintainability.

### Project Structure

- `src/adapters/http`: Entry points for the application.
  - `controllers`: HTTP request handlers (uses `typedi` for dependency injection).
  - `decorators`: Custom decorators (e.g., `@Controller` for error handling).
  - `documentation`: OpenAPI/Swagger specifications and YAML components.
  - `middlewares`: Express.js interceptors and security middlewares.
  - `routes`: API route definitions and versioning.
- `src/core`: Pure business logic and application orchestration.
  - `errors`: Standardized application error handling.
  - `services`: Encapsulated business rules and logic.
- `src/infra`: Infrastructure and external service integrations.
  - `database`: PostgreSQL configuration, TypeORM entities, and migrations.
  - `logger`: Centralized logging service (Winston).
  - `security`: Cryptographic utilities and JWT management.
  - `storage`: File persistence strategy implementation.
- `src/config`: Application configuration and environment variable management.
- `src/shared`: Ubiquitous types, interfaces, constants, and utilities.
- `src/scripts`: Maintenance and utility scripts (e.g., migration generation).