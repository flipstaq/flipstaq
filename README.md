# 🛒 Flipstaq - Multi-Vendor eCommerce Platform

A modern, scalable eCommerce platform built with **microservices architecture** and **API Gateway pattern**.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Web App (Next.js)  │  Mobile App  │  Admin Panel  │  3rd Party │
│     Port 3000       │   (Future)   │   (Future)    │    APIs    │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway (NestJS)                      │
│                         Port 3100                              │
│  • Single Entry Point  • Request Routing  • Authentication     │
│  • Rate Limiting       • CORS Management  • API Versioning     │
└─────────────────────────────────────────────────────────────────┘
                                  │
                        ┌─────────┼─────────┐
                        ▼         ▼         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Internal Microservices                      │
├─────────────────────────────────────────────────────────────────┤
│ Auth Service │ User Service │ Product Service │ Order Service   │
│   Port 3001  │   Port 3002  │   Port 3003     │   Port 3004     │
│  (Internal)  │  (Future)    │   (Future)      │   (Future)      │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL (Port 5432)  │  Redis Cache (Port 6379)           │
│  • Shared Schema         │  • Session Storage                  │
│  • Prisma ORM           │  • Rate Limiting                    │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (LTS)
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd flipstaq

# Install dependencies for all apps
npm install
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up postgres redis -d

# Or start all services with Docker
docker-compose up -d
```

### 3. Start Development Servers

```bash
# Terminal 1: Start API Gateway (Port 3100)
cd apps/api-gateway
npm install
npm run start:dev

# Terminal 2: Start Auth Service (Port 3001 - Internal)
cd services/auth-service
npm install
npx prisma generate --schema=../../packages/db/schema.prisma
npx prisma migrate dev --schema=../../packages/db/schema.prisma
npm run start:dev

# Terminal 3: Start Frontend (Port 3000)
cd apps/web
npm install
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3100/api/v1
- **API Documentation**: http://localhost:3100/api/docs
- **Auth Service (Internal)**: http://localhost:3001/internal (for testing only)

## 📋 API Endpoints

All external requests go through the **API Gateway** at `http://localhost:3100/api/v1/`

### Authentication Endpoints

| Method | Endpoint                | Description         |
| ------ | ----------------------- | ------------------- |
| POST   | `/api/v1/auth/signup`   | User registration   |
| POST   | `/api/v1/auth/login`    | User authentication |
| POST   | `/api/v1/auth/logout`   | User logout         |
| GET    | `/api/v1/auth/validate` | Token validation    |
| POST   | `/api/v1/auth/refresh`  | Refresh JWT token   |

## 🏢 Project Structure

```
flipstaq/
├── apps/
│   ├── web/                    # Next.js Frontend (Port 3000)
│   └── api-gateway/            # NestJS API Gateway (Port 3100)
│
├── services/                   # Internal Microservices
│   └── auth-service/           # Authentication Service (Port 3001)
│
├── packages/
│   ├── db/                     # Shared Prisma Schema
│   └── locales/                # Internationalization (EN/AR)
│
├── docs/                       # Documentation
│   ├── api-gateway/            # Gateway documentation
│   ├── auth-service/           # Auth service docs
│   └── global-architecture.md  # System architecture
│
├── docker-compose.yml          # Docker configuration
└── README.md                   # This file
```

## 🔧 Key Features

### ✅ Implemented

- **API Gateway Pattern**: Single entry point for all external requests
- **Authentication System**: JWT-based auth with signup/login
- **Microservices Architecture**: Loosely coupled, independently deployable services
- **Multi-language Support**: English and Arabic with RTL support
- **Dark/Light Theme**: Automatic theme detection with manual override
- **Type Safety**: Full TypeScript implementation
- **Database ORM**: Prisma with PostgreSQL
- **API Documentation**: Swagger/OpenAPI for all services
- **Docker Support**: Containerized development and deployment

### 🔄 In Progress

- User profile management service
- Product catalog service
- Order management system

### 📋 Planned

- Payment processing service
- Review and rating system
- Notification service
- Admin dashboard
- Mobile app (React Native)

## 🌐 Internationalization

The platform supports **English** and **Arabic** with:

- **No URL prefixes** (language auto-detected)
- **RTL support** for Arabic
- **JSON-based translations** in `packages/locales/`
- **Dynamic language switching**

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Mode**: System preference detection + manual toggle
- **Modern UI**: Clean, professional interface
- **Accessibility**: WCAG 2.1 compliant
- **Performance**: Optimized loading and rendering

## 🔒 Security

- **JWT Authentication**: Short-lived access tokens + refresh tokens
- **Password Security**: bcrypt hashing with salt
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured for specific origins
- **Rate Limiting**: Protection against abuse (future)
- **Internal Network**: Services only accessible via gateway

## 🧪 Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📚 Documentation

- **Global Architecture**: [`docs/global-architecture.md`](docs/global-architecture.md)
- **API Gateway**: [`docs/api-gateway/README.md`](docs/api-gateway/README.md)
- **Auth Service**: [`docs/auth-service/README.md`](docs/auth-service/README.md)
- **API Docs**: http://localhost:3100/api/docs (when running)

## 🐳 Docker Development

```bash
# Start all services
docker-compose up

# Start specific services
docker-compose up postgres redis api-gateway auth-service

# View logs
docker-compose logs -f api-gateway

# Stop all services
docker-compose down
```

## 🔄 Request Flow

1. **Client** sends request to Frontend (port 3000)
2. **Frontend** calls API Gateway (port 3100)
3. **API Gateway** validates and routes to appropriate microservice
4. **Microservice** processes request and returns response
5. **API Gateway** forwards response to Frontend
6. **Frontend** renders response to user

## 🚀 Deployment

### Development

1. Start infrastructure: `docker-compose up postgres redis -d`
2. Start services individually for development
3. Access via http://localhost:3000

### Production

1. Build all services: `docker-compose build`
2. Deploy with: `docker-compose up -d`
3. Configure reverse proxy (Nginx) for SSL and load balancing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 Environment Variables

### API Gateway (`apps/api-gateway/.env`)

```bash
NODE_ENV=development
PORT=3100
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
AUTH_SERVICE_URL=http://localhost:3001
JWT_SECRET=your-super-secret-jwt-key-for-api-gateway
```

### Auth Service (`services/auth-service/.env`)

```bash
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://flipstaq_user:flipstaq_password@localhost:5432/flipstaq_db
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Frontend (`apps/web/.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3100
NODE_ENV=development
```

## 📊 Monitoring

### Health Checks

- **API Gateway**: http://localhost:3100/health
- **Auth Service**: http://localhost:3001/health
- **Database**: Monitored via Prisma connection

### Logs

All services use structured JSON logging:

```json
{
  "timestamp": "2025-06-13T13:00:00.000Z",
  "level": "info",
  "service": "api-gateway",
  "method": "POST",
  "path": "/api/v1/auth/login",
  "statusCode": 200,
  "responseTime": 125
}
```

## 🔮 Future Roadmap

### Phase 1: Core Platform (Current)

- ✅ API Gateway + Auth Service
- 🔄 User Service
- 📋 Product Service (basic)

### Phase 2: MVP Features

- 📋 Shopping cart
- 📋 Order management
- 📋 Payment integration
- 📋 Basic admin panel

### Phase 3: Advanced Features

- 📋 Multi-vendor support
- 📋 Review system
- 📋 Advanced notifications
- 📋 Analytics dashboard

### Phase 4: Scale and Optimize

- 📋 Mobile app
- 📋 Performance optimization
- 📋 Machine learning features
- 📋 Advanced reporting

## 📞 Support

For questions, issues, or contributions:

- **Issues**: Create a GitHub issue
- **Discussions**: Use GitHub Discussions
- **Documentation**: Check the `docs/` folder
- **API Reference**: http://localhost:3100/api/docs

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Flipstaq** - Built with ❤️ using modern web technologies
