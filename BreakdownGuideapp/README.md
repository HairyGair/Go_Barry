# Go North East Breakdown Management System

![Go North East Logo](public/gne-logo-horizontal-colour.png)

## 🚌 Overview

The Go North East Breakdown Management System is a comprehensive web application designed to streamline the management of vehicle breakdowns, enhance supervisor response times, and ensure passenger safety through structured assessment and rapid response protocols.

## ✨ Features

### 🎯 Core Functionality
- **Real-time Breakdown Reporting** - Structured assessment wizard for consistent data collection
- **Live Dashboard** - Monitor active breakdowns across the fleet
- **SLA Management** - Track and prevent Service Level Agreement breaches
- **Fleet Intelligence** - Analytics and pattern detection for preventive maintenance
- **SDC Operations** - Control centre for dispatch and coordination

### 🔔 Modern Notification System
- **Smart Notifications** - Contextual alerts for supervisors
- **Priority Levels** - Critical, High, Medium, Low classifications
- **Real-time Updates** - Live notification badges and alerts
- **Action Buttons** - Quick actions directly from notifications
- **Filtering** - View by priority, unread status, or time

### 🎨 Modern UI/UX
- **Glassmorphism Design** - Modern, semi-transparent interface
- **Dark/Light Theme** - Toggle between themes
- **Responsive Layout** - Works on desktop, tablet, and mobile
- **Smart Header** - Auto-hide on scroll, command palette (Cmd+K)
- **Keyboard Shortcuts** - Quick navigation with Alt+1-5

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Supabase account (for backend)

### Installation

```bash
# Clone the repository
git clone https://github.com/gonortheast/breakdown-guide-app.git
cd BreakdownGuideapp

# Install dependencies
cd frontend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:5000
VITE_ENABLE_AUTH=true
```

## 📱 Application Structure

```
BreakdownGuideapp/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ModernAppHeader.jsx      # New modern header
│   │   │   ├── HeaderLogin.jsx          # Authentication
│   │   │   └── notifications/           # Notification system
│   │   ├── services/
│   │   │   ├── notificationService.js   # Notification logic
│   │   │   └── supabase-client.js       # Database connection
│   │   ├── breakdown-guide/             # Assessment wizard
│   │   ├── dashboards/                  # Dashboard views
│   │   └── App.jsx                      # Main application
│   └── public/                          # Static assets
└── backend/                              # API server
```

## 🎯 Key Components

### Modern App Header
The redesigned header features:
- **Compact Navigation** - Priority items with overflow menu
- **Live Status Bar** - System health, weather, fleet status
- **Smart Notifications** - Badge with active breakdown count
- **Command Palette** - Quick search with Cmd+K
- **Profile Management** - Supervisor details and stats

### Notification System
Advanced notification features:
- **Emergency Alerts** - Critical breakdowns with passenger safety concerns
- **SLA Warnings** - Proactive alerts before breaches
- **Assignment Updates** - New breakdowns assigned to supervisor
- **Fleet Intelligence** - Pattern detection and trend alerts
- **Weather Warnings** - Preparation for adverse conditions

### Breakdown Assessment
Structured wizard for consistent data collection:
- **Initial Assessment** - Location, vehicle, passenger count
- **Safety Check** - Immediate dangers, passenger needs
- **Technical Details** - Fault codes, symptoms, initial diagnosis
- **Action Plan** - Recovery, replacement, or repair decisions
- **Documentation** - Photos, notes, driver information

## 🛠️ Technologies Used

- **Frontend**
  - React 18
  - React Router v6
  - Vite
  - CSS3 with Glassmorphism
  
- **Backend**
  - Node.js
  - Express.js
  - Supabase (PostgreSQL)
  
- **Real-time**
  - WebSockets for live updates
  - Service Worker for offline capability

## 📊 Dashboard Features

### Live Dashboard
- Active breakdown map
- SLA countdown timers
- Response time metrics
- Fleet availability status

### SDC Operations
- Dispatch queue management
- Engineer assignment
- Priority routing
- Communication hub

### Fleet Intelligence
- Breakdown patterns analysis
- Preventive maintenance alerts
- Vehicle health scores
- Cost impact analysis

### Management Portal
- Executive KPI dashboard
- Custom report generation
- Trend analysis
- Budget impact tracking

## 🔐 Authentication

The system uses role-based authentication:
- **Supervisors** - Full system access
- **Engineers** - Technical features
- **Managers** - Analytics and reports
- **Admin** - System configuration

## 📱 Progressive Web App

The application works offline with:
- Service Worker caching
- Local data storage
- Background sync
- Push notifications

## 🎨 Theming

Supports both light and dark themes:
- Automatic system detection
- Manual toggle
- Persistent preference
- Reduced motion support

## ⌨️ Keyboard Shortcuts

- `Cmd/Ctrl + K` - Open command palette
- `Alt + 1` - Go to Breakdown Guide
- `Alt + 2` - Go to SDC Operations  
- `Alt + 3` - Go to Live Dashboard
- `Alt + 4` - Go to Fleet Intelligence
- `Alt + 5` - Go to Management
- `Alt + H` - Go to Home
- `ESC` - Close modals

## 📈 Performance

- **Lighthouse Score**: 95+
- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <3s
- **Bundle Size**: <500KB gzipped

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## 📦 Deployment

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker Deployment

```bash
# Build Docker image
docker build -t gne-breakdown-system .

# Run container
docker run -p 3000:3000 gne-breakdown-system
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software owned by Go North East Ltd.

## 👥 Team

- **Anthony Gair** - Lead Developer & System Architect
- **Barry Perryman** - Operations Manager
- **Go North East IT Team** - Support & Infrastructure

## 📞 Support

For support, please contact:
- **Email**: support@gonortheast.co.uk
- **Internal**: ext. 2150
- **Slack**: #breakdown-system-support

## 🔄 Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Voice command integration
- [ ] AI-powered fault diagnosis
- [ ] Integration with vehicle telematics
- [ ] Predictive maintenance ML model
- [ ] Multi-depot support
- [ ] Driver self-service portal

## 🏆 Acknowledgments

- Go North East Engineering Team
- All SDC Supervisors for feedback
- React and Vite communities
- Open source contributors

---

**Built with ❤️ by Go North East Digital Team**