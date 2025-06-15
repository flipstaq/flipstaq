# FlipStaq Web Frontend

A modern, responsive multi-vendor eCommerce platform built with Next.js 15, TypeScript, and Tailwind CSS.

## 🚀 Features

- **🌐 Internationalization**: Support for English and Arabic with RTL layout
- **🌙 Dark/Light Mode**: Automatic theme detection with manual override
- **📱 Responsive Design**: Mobile-first approach with Tailwind CSS
- **♿ Accessibility**: WCAG compliant with semantic HTML and ARIA attributes
- **🔒 Form Validation**: Client-side validation with Zod and React Hook Form
- **🎨 Modern UI**: Clean, professional design with smooth animations

## 🛠️ Tech Stack

- **Framework**: Next.js 15.1.0
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Fonts**: Inter (LTR), Cairo (RTL)

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/
│   │   └── SignupForm.tsx      # User registration form
│   ├── layout/
│   │   ├── Header.tsx          # Navigation header
│   │   ├── Footer.tsx          # Site footer
│   │   └── Layout.tsx          # Main layout wrapper
│   ├── pages/
│   │   └── HomePage.tsx        # Landing page component
│   └── providers/
│       ├── ThemeProvider.tsx   # Dark/light mode context
│       └── LanguageProvider.tsx # i18n context
├── lib/
│   └── utils.ts                # Utility functions
├── pages/
│   ├── api/
│   │   └── locales/            # API route for translations
│   ├── auth/
│   │   ├── signup.tsx          # Registration page
│   │   └── signin.tsx          # Login page
│   ├── _app.tsx                # App wrapper with providers
│   ├── index.tsx               # Home page
│   └── products.tsx            # Products listing page
├── styles/
│   └── globals.css             # Global styles and Tailwind
└── types/
    └── index.ts                # TypeScript type definitions
```

## 🌍 Internationalization

The app supports English and Arabic languages:

- **No language-based routing** (no `/en` or `/ar` URLs)
- **Automatic language detection** from browser settings
- **Manual language switching** with persistence in localStorage
- **RTL support** for Arabic with proper text direction
- **Dynamic translation loading** from `packages/locales/`

### Translation Files Structure

```
packages/locales/
├── en/
│   ├── common.json             # Common UI elements
│   └── auth.json               # Authentication forms
└── ar/
    ├── common.json             # Arabic translations
    └── auth.json               # Arabic auth translations
```

## 🎨 Theme System

- **Automatic detection** of system preference (`prefers-color-scheme`)
- **Manual toggle** with persistence in localStorage
- **Smooth transitions** between themes
- **Consistent color palette** across light and dark modes

## 🔧 Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Getting Started

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start development server**:

   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

## 📋 User Registration Requirements

- **Minimum age**: 13 years
- **Required fields**:
  - First Name
  - Last Name
  - Email (validated)
  - Username (minimum 2 characters)
  - Password (minimum 8 characters)
  - Country (dropdown selection)

## 🔗 API Integration

The frontend is prepared for backend integration with:

- **Authentication service** (`/api/auth/*`)
- **User service** (`/api/users/*`)
- **Product service** (planned)
- **Order service** (planned)

API routes are configured in `next.config.mjs` for development proxy.

## 🚀 Deployment

The app is ready for deployment on:

- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- **Docker** containers

### Environment Variables

Create a `.env.local` file for local development:

```env
# Add environment variables as needed
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🧪 Testing

Testing setup is ready for:

- **Unit tests** with Jest and React Testing Library
- **E2E tests** with Playwright or Cypress
- **Visual regression tests** with Chromatic

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Hook Form Documentation](https://react-hook-form.com/docs)

## 🤝 Contributing

1. Follow the existing code style
2. Use TypeScript for type safety
3. Write semantic, accessible HTML
4. Test in both light/dark modes
5. Test in both English and Arabic

## 📄 License

This project is part of the FlipStaq eCommerce platform.
