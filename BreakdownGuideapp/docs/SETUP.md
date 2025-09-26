# Setup Guide

This guide will help you set up and run the Go North East Breakdown Management System on your local development environment.

## Prerequisites

### Required Software

- **Node.js** (v16.0.0 or higher)
  ```bash
  # Check your version
  node --version
  ```

- **npm** (v7.0.0 or higher) or **yarn**
  ```bash
  # Check npm version
  npm --version
  ```

- **Git** for version control
  ```bash
  # Check git installation
  git --version
  ```

### Optional Software

- **VS Code** (recommended IDE)
- **Chrome/Firefox** with React Developer Tools
- **Postman** for API testing

## Installation Steps

### 1. Clone the Repository

```bash
# Clone via HTTPS
git clone https://github.com/gonortheast/breakdown-guide-app.git

# Or clone via SSH
git clone git@github.com:gonortheast/breakdown-guide-app.git

# Navigate to project directory
cd BreakdownGuideapp
```

### 2. Install Dependencies

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies using npm
npm install

# Or using yarn
yarn install
```

### 3. Environment Configuration

Create a `.env` file in the frontend directory:

```bash
# Copy example environment file
cp .env.example .env

# Or create new file
touch .env
```

Edit `.env` with your configuration:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Configuration
VITE_API_BASE_URL=http://localhost:5000
VITE_API_VERSION=v1

# Authentication
VITE_ENABLE_AUTH=true
VITE_SESSION_TIMEOUT=3600

# Features Flags
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_ANALYTICS=false

# Environment
VITE_ENV=development
```

### 4. Database Setup (Supabase)

#### Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

#### Run Database Migrations

```sql
-- Create supervisors table
CREATE TABLE supervisors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  depot VARCHAR(100),
  role VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create breakdowns table
CREATE TABLE breakdowns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bus_number VARCHAR(10) NOT NULL,
  route VARCHAR(50),
  location TEXT,
  status VARCHAR(50) DEFAULT 'active',
  priority VARCHAR(20),
  supervisor_id UUID REFERENCES supervisors(id),
  reported_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  notes TEXT
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supervisor_id UUID REFERENCES supervisors(id),
  type VARCHAR(50),
  priority VARCHAR(20),
  title VARCHAR(255),
  message TEXT,
  metadata JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_breakdowns_status ON breakdowns(status);
CREATE INDEX idx_breakdowns_supervisor ON breakdowns(supervisor_id);
CREATE INDEX idx_notifications_supervisor ON notifications(supervisor_id);
CREATE INDEX idx_notifications_read ON notifications(read);
```

### 5. Start Development Server

```bash
# Start the frontend development server
npm run dev

# Or with yarn
yarn dev

# The app will be available at http://localhost:5173
```

### 6. Start Backend Server (Optional)

If you have the backend API:

```bash
# Navigate to backend directory
cd ../backend

# Install dependencies
npm install

# Start server
npm start

# API will be available at http://localhost:5000
```

## Development Workflow

### Running in Development Mode

```bash
# Start with hot reload
npm run dev

# Start with specific port
npm run dev -- --port 3000

# Start with host exposure (for testing on other devices)
npm run dev -- --host
```

### Building for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview

# Analyze bundle size
npm run analyze
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- MyComponent.test.jsx
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting
npm run format:check
```

## Configuration Options

### Vite Configuration

Edit `vite.config.js` for build customization:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser'
  },
  define: {
    'process.env': {}
  }
})
```

### TypeScript Configuration (Optional)

If using TypeScript, configure `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

## Docker Setup (Optional)

### Create Dockerfile

```dockerfile
# Frontend Dockerfile
FROM node:16-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
    volumes:
      - ./frontend/dist:/usr/share/nginx/html

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - database

  database:
    image: postgres:14
    environment:
      - POSTGRES_DB=breakdown_db
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Run with Docker

```bash
# Build and start containers
docker-compose up --build

# Run in background
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs -f
```

## Troubleshooting

### Common Issues and Solutions

#### Port Already in Use

```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use different port
npm run dev -- --port 3001
```

#### Module Not Found Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### Environment Variables Not Loading

```bash
# Ensure .env file exists
ls -la | grep .env

# Check variable names start with VITE_
grep VITE_ .env

# Restart dev server after .env changes
```

#### Build Errors

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Update dependencies
npm update

# Check for conflicting dependencies
npm ls
```

#### Supabase Connection Issues

```javascript
// Test connection
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Test query
const { data, error } = await supabase
  .from('supervisors')
  .select('*')
  .limit(1)

if (error) console.error('Connection error:', error)
else console.log('Connection successful:', data)
```

## Development Tools

### VS Code Extensions

Recommended extensions for development:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "dsznajder.es7-react-js-snippets",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "naumovs.color-highlight",
    "christian-kohler.path-intellisense",
    "csstools.postcss",
    "mikestead.dotenv",
    "humao.rest-client"
  ]
}
```

### Browser Extensions

- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/)
- [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/)
- [Lighthouse](https://chrome.google.com/webstore/detail/lighthouse/)

### Debugging

#### VS Code Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome against localhost",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/frontend/src",
      "sourceMaps": true
    }
  ]
}
```

#### Chrome DevTools

```javascript
// Add debugger statements
debugger; // Execution will pause here

// Console debugging
console.log('State:', state);
console.table(data);
console.time('Operation');
// ... code ...
console.timeEnd('Operation');
```

## Performance Optimization

### Code Splitting

```javascript
// Lazy load components
const Dashboard = lazy(() => import('./Dashboard'));

// Use Suspense
<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

### Image Optimization

```bash
# Install image optimization tools
npm install --save-dev vite-plugin-imagemin

# Configure in vite.config.js
import viteImagemin from 'vite-plugin-imagemin'

plugins: [
  viteImagemin({
    gifsicle: { optimizationLevel: 3 },
    optipng: { optimizationLevel: 7 },
    mozjpeg: { quality: 80 },
    svgo: { plugins: [{ removeViewBox: false }] }
  })
]
```

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy

# Deploy to production
netlify deploy --prod
```

### Deploy to GitHub Pages

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"

# Deploy
npm run deploy
```

## Support and Resources

### Getting Help

- **Documentation**: Check `/docs` folder
- **Issues**: GitHub Issues page
- **Slack**: #breakdown-system-dev channel
- **Email**: support@gonortheast.co.uk

### Useful Links

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [MDN Web Docs](https://developer.mozilla.org)

### Learning Resources

- [React Tutorial](https://react.dev/learn)
- [JavaScript ES6+](https://javascript.info)
- [CSS Grid and Flexbox](https://css-tricks.com)
- [Web Performance](https://web.dev/learn)

---

*Last updated: January 2024*