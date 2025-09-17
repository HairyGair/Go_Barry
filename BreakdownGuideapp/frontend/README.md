# Go North East Breakdown Guide - Frontend

## ✅ Production Ready React + Vite Application

This is the frontend for the Go North East Breakdown Guide application, built with React 18 and Vite for optimal performance.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📋 Current Status

### ✅ Fully Functional
- **All syntax errors resolved** - Clean builds ✅
- **33 SDC-compliant wizards** - Complete assessment system
- **React Router navigation** - Proper routing throughout app
- **Responsive design** - Works on desktop and mobile
- **Tailwind CSS styling** - Modern, consistent UI
- **PWA ready** - Offline capabilities included

### 🏗️ Architecture

- **React 18** with functional components and hooks
- **Vite** for fast development and optimized builds
- **React Router** for client-side routing
- **Tailwind CSS** + custom CSS for styling
- **Modular components** in organized directory structure

## 📁 Key Directories

```
src/
├── breakdown-guide/           # Main breakdown guide application
│   ├── components/           # Reusable React components
│   │   ├── common/          # Shared components (icons, constants)
│   │   └── wizards/         # 33 assessment wizard components
│   ├── styles/              # Tailwind CSS and custom styles
│   └── App.jsx              # Main breakdown guide app component
├── dashboards/              # Dashboard HTML files
└── data/                    # Fleet database and static data
```

## 🛠️ Technology Stack

- **React 18** - Modern React with hooks and functional components
- **Vite** - Fast build tool with HMR (Hot Module Replacement)
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls
- **Supabase** - Backend integration ready

## 🔗 Available Scripts

- `npm run dev` - Start development server at http://localhost:3000
- `npm run build` - Build for production (outputs to `dist/`)
- `npm run preview` - Preview production build locally

## 📦 Build & Deployment

```bash
# Build for production
npm run build

# Output will be in dist/ folder
# Upload dist/ contents to cPanel for deployment
```

## 🎯 Features

- **NO AUTH Mode** - Simplified testing without backend
- **Fleet Selection** - Search 759+ vehicles by fleet number/registration
- **Assessment Wizards** - 33 SDC-compliant assessment types
- **Real-time Updates** - Ready for backend integration
- **Offline Support** - PWA capabilities for offline use
- **Assessment Summary** - Comprehensive reporting for Tracerit

## 🔧 Configuration

### Environment Variables
```env
VITE_API_BASE_URL=https://breakdown-guide.onrender.com
VITE_NO_AUTH=true
```

### Vite Configuration
- Path aliases configured for clean imports
- React plugin with Fast Refresh
- Build optimization for production

For more details, see the main project [README.md](../README.md) in the parent directory.
