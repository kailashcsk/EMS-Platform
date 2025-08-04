# EMS Data Portal - Frontend

A modern, responsive React frontend for Emergency Medical Services (EMS) professionals to interact with medical protocols, medications, and AI-powered clinical insights.

## 🏥 Features

### 🔐 **Authentication & Authorization**
- Google OAuth integration via Firebase Auth
- Role-based access control (Admin/Patient)
- Secure JWT token management
- Protected routes with automatic redirects

### 👥 **User Roles**
- **Admin Users**: Full CRUD access to all data, file uploads, user management
- **Patient Users**: Read-only access to protocols/medications, AI query capabilities

### 📊 **Core Modules**
- **Dashboard**: Overview of system statistics, recent activity, quick actions
- **Protocols**: Emergency medical protocols with file attachments
- **Medications**: Drug database with dosage information and documentation
- **AI Query**: Natural language interface for medical data queries
- **Admin Panel**: User role management (Admin only)

### 🤖 **AI-Powered Features**
- Natural language query processing
- Smart endpoint selection (with/without document analysis)
- Clinical insights and recommendations
- SQL query generation and display
- Medical data visualization

### 🎨 **User Experience**
- Modern UI with shadcn/ui components and Tailwind CSS
- Responsive design (mobile, tablet, desktop)
- Dark/light mode support
- Professional medical interface
- Real-time search and filtering

## 🛠 Technology Stack

### **Core Framework**
- **React 18** - Component-based UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server

### **UI & Styling**
- **shadcn/ui** - Modern component library
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **Radix UI** - Accessible component primitives

### **Authentication & State**
- **Firebase Auth** - Authentication service
- **React Context** - Global state management
- **React Router** - Client-side routing

### **Development Tools**
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

## 📁 Project Structure

```
ems-frontend/
├── public/                     # Static assets
│   ├── vite.svg               # App favicon
│   └── index.html             # HTML template
│
├── src/                       # Source code
│   ├── components/            # Reusable components
│   │   ├── auth/             # Authentication components
│   │   │   └── ProtectedRoute.tsx
│   │   ├── layout/           # Layout components
│   │   │   └── Layout.tsx    # Main app layout with navigation
│   │   └── ui/               # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── dialog.tsx
│   │       ├── table.tsx
│   │       ├── badge.tsx
│   │       ├── alert.tsx
│   │       ├── avatar.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── sheet.tsx
│   │       ├── select.tsx
│   │       ├── textarea.tsx
│   │       ├── toast.tsx
│   │       └── toaster.tsx
│   │
│   ├── contexts/             # React contexts
│   │   └── AuthContext.tsx   # Authentication state management
│   │
│   ├── hooks/                # Custom React hooks
│   │   └── useAPI.ts         # API service hook
│   │
│   ├── pages/                # Page components
│   │   ├── LoginPage.tsx     # Google OAuth login
│   │   ├── DashboardPage.tsx # System overview & stats
│   │   ├── ProtocolsPage.tsx # Protocol management (CRUD)
│   │   ├── MedicationsPage.tsx # Medication management (CRUD)
│   │   ├── AIQueryPage.tsx   # AI chat interface
│   │   └── AdminPage.tsx     # User management (Admin only)
│   │
│   ├── services/             # External services
│   │   └── api.ts            # Backend API integration
│   │
│   ├── types/                # TypeScript definitions
│   │   └── index.d.ts        # Interface definitions
│   │
│   ├── config/               # Configuration files
│   │   └── firebase.ts       # Firebase initialization
│   │
│   ├── utils/                # Utility functions
│   │   └── cn.ts             # Class name utilities
│   │
│   ├── App.tsx               # Main app component & routing
│   ├── main.tsx              # App entry point
│   ├── index.css             # Global styles & Tailwind imports
│   └── vite-env.d.ts         # Vite type definitions
│
├── .env                      # Environment variables (not committed)
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
├── components.json           # shadcn/ui configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
├── tsconfig.node.json        # Node.js TypeScript config
├── vite.config.ts            # Vite build configuration
├── package.json              # Dependencies & scripts
├── package-lock.json         # Locked dependency versions
└── README.md                 # This file
```

## ⚙️ Environment Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Backend API Configuration
VITE_API_BASE_URL=http://localhost:3001/api
```

### Environment Setup Guide

#### 1. **Firebase Configuration**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create or select your project
3. Navigate to Project Settings → General
4. Scroll to "Your apps" section
5. Click "Web app" (</> icon) or create one
6. Copy the config values to your `.env` file

#### 2. **Backend API Configuration**
- `VITE_API_BASE_URL`: Your backend server URL
  - Development: `http://localhost:3001/api`
  - Production: `https://your-api-domain.com/api`

### Security Notes

⚠️ **Important Security Considerations:**

- **Never commit `.env` files** to version control
- Firebase API keys are **safe for client-side use** (they're meant to be public)
- The `.env.example` file shows the structure without real values
- In production, use environment variables provided by your hosting service

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Firebase project** with Authentication enabled
- **Backend API** running (see backend README)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ems-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

### Development Workflow

1. **Login Setup**
   - First user will be assigned "patient" role
   - Use backend script to promote first user to admin
   - Admin users can then promote others through the UI

2. **Code Style**
   - Uses ESLint for code quality
   - Prettier for code formatting
   - TypeScript for type safety

## 📋 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Dependencies
npm install          # Install dependencies
npm update           # Update dependencies
```

## 🏗 Build & Deployment

### Production Build

```bash
npm run build
```

This creates a `dist/` directory with optimized static files ready for deployment.

### Deployment Options

#### **Vercel** (Recommended)
```bash
npm install -g vercel
vercel --prod
```

#### **Netlify**
```bash
npm run build
# Upload dist/ folder to Netlify
```

#### **Firebase Hosting**
```bash
npm install -g firebase-tools
npm run build
firebase deploy
```

### Environment Variables in Production

Set these environment variables in your hosting platform:

- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Environment Variables
- **Firebase**: Use `firebase functions:config:set`

## 🔧 Configuration Files

### **Tailwind CSS** (`tailwind.config.js`)
- Custom color palette for medical UI
- Component-specific styling
- Dark mode configuration
- Responsive breakpoints

### **TypeScript** (`tsconfig.json`)
- Strict type checking enabled
- Modern ES2020 target
- Path mapping for cleaner imports
- React JSX configuration

### **Vite** (`vite.config.ts`)
- React plugin configuration
- Path aliases for clean imports
- Development server settings
- Build optimization

### **shadcn/ui** (`components.json`)
- Component library configuration
- Styling system setup
- Import alias configuration

## 🧪 Testing

### Manual Testing Checklist

#### **Authentication Flow**
- [ ] Google OAuth login works
- [ ] User roles are properly assigned
- [ ] Protected routes redirect correctly
- [ ] Logout functionality works

#### **Core Features**
- [ ] Dashboard loads with correct statistics
- [ ] Protocol CRUD operations (Admin only)
- [ ] Medication CRUD operations (Admin only)
- [ ] AI query responses display correctly
- [ ] File upload functionality works
- [ ] Search and filtering work

#### **Responsive Design**
- [ ] Mobile layout works correctly
- [ ] Tablet layout is functional
- [ ] Desktop layout is optimal
- [ ] Navigation menu works on all sizes

## 🐛 Troubleshooting

### Common Issues

#### **Firebase Authentication Errors**
```
Error: Firebase project not found
```
- Check `VITE_FIREBASE_PROJECT_ID` in .env
- Verify Firebase project exists and is active

#### **API Connection Issues**
```
API Error: 404 Not Found
```
- Ensure backend server is running
- Check `VITE_API_BASE_URL` configuration
- Verify CORS settings in backend

#### **Build Errors**
```
Module not found: Can't resolve './types'
```
- Check TypeScript file extensions (.d.ts vs .ts)
- Verify import paths are correct
- Run `npm install` to ensure dependencies

#### **Authentication State Issues**
```
User appears logged out after refresh
```
- Check Firebase configuration
- Verify token persistence
- Check browser local storage

### Debug Mode

Enable debug logging by adding to your `.env`:
```env
VITE_DEBUG_MODE=true
```

## 🎯 Quick Start Checklist

- [ ] Node.js installed (v18+)
- [ ] Firebase project created
- [ ] Google Auth enabled in Firebase
- [ ] Environment variables configured
- [ ] Backend API running
- [ ] Dependencies installed (`npm install`)
- [ ] Development server started (`npm run dev`)
- [ ] First admin user promoted
- [ ] Login successful
- [ ] All features tested

**Ready to help EMS professionals save lives with better data access! 🚑**