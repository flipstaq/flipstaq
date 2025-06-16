---
applyTo: "**"
---

```markdown
# 🛠️ Project Setup Instructions for GitHub Copilot Agent (AI-Powered Multi-Vendor eCommerce)

## 📦 Tech Stack (Latest Versions)

- **Frontend:** Next.js `15.4.0`, Tailwind CSS, TypeScript
- **Backend:** NestJS `11.1.3`, TypeScript
- **ORM:** Prisma `6.9.0` (PostgreSQL)
- **Internationalization:** With auto-detection and RTL support
- **Monorepo Tooling:** TurboRepo
- **API Documentation:** Swagger + Custom markdown docs per microservice
- **Authentication:** OAuth2 / JWT
- **Packages Folder:** Shared packages for `locales/`, `db/`, etc.
- **Styling:** Tailwind CSS with light/dark mode

---

## 🗃️ Project Folder Structure
```

ecommerce-platform/
├── apps/
│ ├── web/ # Next.js frontend (buyer/seller/admin UI)
│ ├── api-gateway/ # Optional BFF (Next.js / NestJS)
│ └── admin/ # Optional separate admin panel (can be merged with web)
│
├── services/ # Microservices
│ ├── auth-service/
│ ├── user-service/
│ ├── product-service/
│ ├── order-service/
│ ├── payment-service/
│ ├── review-service/
│ └── notification-service/
│
├── packages/
│ ├── db/ # Prisma + PostgreSQL shared schema
│ └── locales/ # Multi-language files for i18n
│ ├── en/
│ │ ├── settings.json
│ │ ├── common.json
│ │ └── ...
│ └── ar/
│ ├── settings.json
│ ├── common.json
│ └── ...
│
├── docs/ # Central documentation folder
│ ├── auth-service/
│ ├── user-service/
│ ├── ...
│ └── global-architecture.md
│
├── .env # Environment variables
├── docker-compose.yml # Local dev setup
└── README.md

```

---

## ✅ Account Roles
- `Owner`: Full platform access (can be multiple)
- `Higher Staff`: Elevated backend/admin access
- `Staff`: Restricted management access
- `User`: Buyers or sellers

---

## 📝 Signup Requirements
- Minimum age: 13+
- First Name
- Last Name
- Email
- Username (minimum 2 characters)
- Password
- Country (dropdown selector, sourced from locale)

---

## 🌐 Internationalization (English + Arabic)
- Use **i18next** or **next-i18next** with dynamic JSON loading
- **No `/en` or `/ar` routes** — language auto-detected via browser
- Use cookies/localStorage to store selected language
- All translations split across JSON files:
```

packages/locales/en/settings.json
packages/locales/ar/settings.json

````
- Proper **RTL support** for Arabic
- Tailwind CSS configuration must include `dir="rtl"` for Arabic pages

---

## 🎨 Theme Support (Dark & Light Mode)
- Auto-detect system theme via `prefers-color-scheme`
- Allow manual override via user preference
- Tailwind CSS must support both modes:
```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  ...
}
````

- Design UI for both dark and light themes

---

## 📄 Documentation Policy

- All documentation must reside in the root-level `docs/` folder.

- Each **implemented microservice or app** must have:

  - A `README.md` explaining its purpose and logic
  - A `docs/<service-name>/` folder containing:
    - Detailed API documentation (for implemented endpoints only)
    - Diagrams, usage examples, and any internal architecture notes
    - Updated Swagger/OpenAPI spec if applicable

- **Do not create or keep docs** for features or services that are not yet implemented.

- Keep documentation in sync with the codebase — delete or revise outdated docs when changes are made.

- All **shared logic**, such as Prisma models or message patterns, should be documented in `docs/global-architecture.md`.

- The `api-gateway` must have its own documentation (`docs/api-gateway/`) since it's the public-facing entry point.

---

## 🧩 Database Setup (Prisma + PostgreSQL)

- Shared Prisma schema in `packages/db/`
- Each microservice generates its own Prisma client from shared schema
- Use PostgreSQL as the main database
- Prisma version: `6.9.0`

---

## 🚀 Final Notes

- Use Docker for local setup (PostgreSQL, services, Redis if needed)
- Ensure monorepo tooling supports scalable build + test pipelines
- Enable language toggle, dark/light toggle, and responsive UI
- Start with Auth and User services, then Product, Order, and Payment
- Do run the projects by yourself, I always keep the projects running using turbo so you don't need to worry.

ALWYAYS REFER TO DOCS for microservice-specific guidlines and API details.
