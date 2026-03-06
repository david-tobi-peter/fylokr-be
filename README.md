# Fylokr

Fylokr is a modern, high-performance file hosting and sharing application built with TypeScript and Node.js.

## 🏗️ Architecture & Branching

The `main` branch serves as the architectural foundation of the application. It defines the core patterns, directory structure, and infrastructure setup to ensure scalability and maintainability.

### Monorepo Structure

Fylokr uses an **NPM workspaces** monorepo with two packages:

```
fylokr/
├── packages/
│   ├── foundation/          # Shared, app-agnostic library
│   │   └── src/
│   │       ├── cache/              # Session & auth caching (Redis)
│   │       ├── database/
│   │       │   ├── postgres/       # TypeORM config, DataSource, BaseRepository
│   │       │   └── redis/          # Redis connection management
│   │       ├── decorators/         # @Controller error-boundary decorator
│   │       ├── errors/             # Standardized error classes & handler
│   │       ├── logger/             # Winston logging with daily rotation
│   │       ├── middlewares/        # Express interceptors & authentication
│   │       ├── security/           # JWT, 2FA, brute-force protection, fingerprinting
│   │       ├── shared/             # Interfaces, enums, types, constants, utilities
│   │       ├── storage/            # File persistence (Cloudflare R2 / S3)
│   │       └── application.ts      # FoundationApplication base class
│   │
│   └── backend/             # Concrete API service
│       └── src/
│           ├── config/             # Environment loading & DI container population
│           ├── controllers/        # HTTP request handlers
│           ├── entities/           # TypeORM entity definitions
│           ├── migrations/         # Database migrations
│           ├── repositories/       # Entity-specific repository instances
│           ├── routes/             # Express route factories (v1, root)
│           ├── scripts/            # Utility scripts (migration generation, API spec)
│           ├── services/           # Business logic (auth, health-check)
│           ├── spec/               # OpenAPI/Swagger specs & YAML components
│           ├── app.ts              # App class (extends FoundationApplication)
│           └── index.ts            # Entry point & bootstrap
│
├── package.json             # Root workspace config, devDependencies, lint-staged
├── eslint.config.ts         # Shared ESLint configuration
└── tsconfig.json            # Root TypeScript config
```

### Package Responsibilities

| Package | Role |
|---------|------|
| **foundation** | Generic, reusable infrastructure. Has zero knowledge of `.env` variables or business logic. Consumed via `@david-tobi-peter/foundation`. |
| **backend** | The concrete API application. Owns the environment config, entities, migrations, routes, and business services. Provides configuration to foundation via TypeDI. |

### Dependency Injection Flow

1. **Backend bootstraps** — `index.ts` loads `.env` and calls `Container.set()` for each config token.
2. **Foundation consumes** — Services use `@Inject("IRedisConfig")` (or lazy `@Inject(() => Service)`) to receive configuration without importing backend code.
3. **Routes resolve lazily** — Route files export factory functions that call `Container.get(Controller)` only when `registerRoutes()` is invoked at runtime.