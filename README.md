# 🍽️ AI-Powered Nutrition Tracker

A comprehensive React Native nutrition tracking application with AI-powered meal analysis, smart device integration, personalized meal planning, and detailed health insights.

## ✨ Features Overview

### 🤖 AI-Powered Meal Analysis
- **Smart Food Recognition**: Take photos of meals for instant AI nutrition analysis
- **Detailed Breakdown**: Get calories, protein, carbs, fat, fiber, and micronutrients
- **Meal Updates**: Add context to improve analysis accuracy
- **Fallback Support**: Works with mock data when OpenAI API is unavailable

### 📱 Smart Device Integration
- **Multi-Platform Support**: Apple Health (iOS), Google Fit (Android), Fitbit, Garmin, Whoop, Polar
- **Activity Tracking**: Steps, calories burned, heart rate, sleep data
- **Calorie Balance**: Real-time tracking of calories in vs calories out
- **Automatic Sync**: Background synchronization of health data

### 🗓️ Intelligent Calendar & Planning
- **Visual Progress Tracking**: Monthly calendar view with daily nutrition goals
- **AI Meal Planning**: Personalized weekly meal plans based on preferences and goals
- **Shopping Lists**: Auto-generated grocery lists from meal plans
- **Event Tracking**: Log special events that affect eating patterns

### 📊 Advanced Analytics
- **Comprehensive Statistics**: Weekly and monthly nutrition trends
- **Health Insights**: AI-generated personalized recommendations
- **Progress Monitoring**: Goal achievement tracking and streak counters
- **Export Reports**: Generate detailed nutrition reports

### 👤 Personalized Experience
- **User Profiles**: Age, weight, height, activity level, dietary preferences
- **Goal Setting**: Customizable calorie and macro targets
- **Meal History**: Rate meals, mark favorites, duplicate past meals
- **Preference Learning**: AI adapts recommendations based on user feedback

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Expo CLI**: `npm install -g @expo/cli`
- **PostgreSQL Database** (Supabase recommended)
- **OpenAI API Key** (optional - app works with mock data)
- **Mobile Device** or simulator for testing

### 🛠️ Setup Instructions

#### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd nutrition-tracker

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

#### 2. Database Setup

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Copy your database URL and direct URL from Settings > Database

2. **Set Up Database Schema**:
   ```bash
   cd server
   npx prisma generate
   npx prisma db push
   ```

#### 3. Environment Configuration

**Server Configuration** (`server/.env`):
```env
# Database (Required)
DATABASE_URL="your_supabase_database_url"
DIRECT_URL="your_supabase_direct_url"

# Authentication (Required)
JWT_SECRET="your-secure-jwt-secret"

# Server Configuration
PORT=5000
NODE_ENV=development
API_BASE_URL="http://YOUR_IP:5000/api"
CLIENT_URL="http://YOUR_IP:8081"

# OpenAI (Optional - app works without it)
OPENAI_API_KEY="your-openai-api-key"
```

**Client Configuration** (`client/.env`):
```env
EXPO_PUBLIC_API_URL=http://YOUR_IP:5000/api
```

> **Important**: Replace `YOUR_IP` with your actual local IP address:
> - **Windows**: Run `ipconfig` → look for IPv4 Address
> - **Mac/Linux**: Run `ifconfig` → look for inet address (usually 192.168.x.x)

#### 4. Generate JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 5. Start the Application

**Terminal 1 - Start Server**:
```bash
cd server
npm run dev
```

**Terminal 2 - Start Client**:
```bash
cd client
npm start
```

#### 6. Run on Device
- **iOS**: Press `i` for iOS simulator or scan QR code with Camera app
- **Android**: Press `a` for Android emulator or scan QR code with Expo Go app
- **Web**: Press `w` for web browser

## 📁 Project Structure

```
nutrition-tracker/
├── client/                     # React Native frontend
│   ├── app/                   # Expo Router pages
│   │   ├── (auth)/           # Authentication screens
│   │   ├── (tabs)/           # Main app screens
│   │   └── _layout.tsx       # Root layout
│   ├── components/           # Reusable UI components
│   ├── hooks/                # Custom hooks & React Query
│   ├── src/
│   │   ├── services/         # API services & device integrations
│   │   ├── store/            # Redux store & slices
│   │   └── types/            # TypeScript definitions
│   └── assets/               # Images & fonts
├── server/                    # Node.js backend
│   ├── src/
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Auth & error handling
│   │   └── types/            # TypeScript definitions
│   └── prisma/               # Database schema & migrations
└── scripts/                  # Utility scripts
```

## 🔧 Development Guide

### Key Technologies

**Frontend**:
- **React Native** with Expo for cross-platform mobile development
- **TypeScript** for type safety and better development experience
- **Redux Toolkit** for state management
- **React Query** for efficient data fetching and caching
- **Expo Router** for file-based navigation

**Backend**:
- **Express.js** with TypeScript for the REST API
- **Prisma** ORM for database management
- **JWT** for secure authentication
- **OpenAI API** for intelligent meal analysis
- **Zod** for request validation

**Database**:
- **PostgreSQL** via Supabase
- **Row Level Security** for data protection
- **Real-time subscriptions** for live updates

### Available Scripts

**Server**:
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:push      # Push database schema
npm run db:studio    # Open Prisma Studio
```

**Client**:
```bash
npm start           # Start Expo development server
npm run android     # Run on Android
npm run ios         # Run on iOS simulator
npm run web         # Run in web browser
```

### API Endpoints

**Authentication**:
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout

**Nutrition**:
- `POST /api/nutrition/analyze` - Analyze meal image
- `PUT /api/nutrition/update` - Update meal analysis
- `POST /api/nutrition/save` - Save analyzed meal
- `GET /api/nutrition/meals` - Get user meals
- `GET /api/nutrition/stats/:date` - Get daily nutrition stats

**Devices**:
- `GET /api/devices` - Get connected devices
- `POST /api/devices/connect` - Connect new device
- `POST /api/devices/:id/sync` - Sync device data

**Meal Plans**:
- `POST /api/meal-plans/create` - Create AI meal plan
- `GET /api/meal-plans/current` - Get current meal plan
- `PUT /api/meal-plans/:id/replace` - Replace meal with AI

## 🔌 Device Integration

### Supported Platforms

| Device | Platform | Status |
|--------|----------|--------|
| Apple Health | iOS | ✅ Full Support |
| Google Fit | Android | ✅ Full Support |
| Fitbit | Cross-platform | ✅ OAuth Integration |
| Garmin | Cross-platform | ⚠️ Requires OAuth 1.0a |
| Whoop | Cross-platform | ✅ API Integration |
| Polar | Cross-platform | ✅ API Integration |
| Samsung Health | Android | ⚠️ SDK Required |

### Integration Setup

1. **Apple Health** (iOS only):
   - Automatically requests permissions
   - No additional setup required

2. **Google Fit** (Android):
   - Add OAuth credentials to environment
   - Configure app in Google Cloud Console

3. **Third-party devices**:
   - Register app with device manufacturer
   - Add OAuth credentials to server environment

## 🧪 Testing

### Running Tests
```bash
# Server tests
cd server
npm test

# Client tests  
cd client
npm test
```

### Test Coverage
- Unit tests for utility functions
- Integration tests for API endpoints
- Component tests for React Native screens
- End-to-end tests for critical user flows

## 📱 Deployment

### Server Deployment
- Deploy to **Railway**, **Render**, or **Heroku**
- Set production environment variables
- Configure database connection
- Set up SSL certificates

### Client Deployment
- **iOS**: Build with EAS and deploy to App Store
- **Android**: Build APK/AAB and deploy to Google Play
- **Web**: Deploy static build to Netlify or Vercel

### Environment Setup
```bash
# Build for production
npm run build

# Deploy to EAS (mobile)
eas build --platform all
eas submit --platform all
```

## 🐛 Troubleshooting

### Common Issues

**Connection Errors**:
- Verify IP address in environment files matches your local network
- Ensure both devices are on the same network
- Check firewall settings

**Database Issues**:
- Confirm Supabase credentials are correct
- Run `npx prisma db push` to sync schema
- Check database connection in Supabase dashboard

**OpenAI API Issues**:
- Verify API key is valid and has credits
- App works with mock data if no API key provided
- Check API usage limits in OpenAI dashboard

**Build Errors**:
- Clear node_modules and reinstall dependencies
- Verify TypeScript configuration
- Check for peer dependency conflicts

### Performance Optimization
- Images are automatically optimized for analysis
- React Query provides intelligent caching
- Redux Persist maintains state across sessions
- Background sync keeps data fresh

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following the coding standards
4. Add tests for new functionality
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Submit a pull request

### Coding Standards
- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Add JSDoc comments for complex functions
- Maintain test coverage above 80%

### Code Review Process
- All PRs require review from maintainers
- Automated tests must pass
- Code must follow style guidelines
- Breaking changes require documentation updates

## 📋 Roadmap

### Phase 1 (Current)
- ✅ Core meal analysis and tracking
- ✅ Device integration framework
- ✅ Basic meal planning
- ✅ User authentication

### Phase 2 (Next)
- 🔄 Advanced AI recommendations
- 🔄 Social features and sharing
- 🔄 Nutritionist consultation integration
- 🔄 Advanced analytics dashboard

### Phase 3 (Future)
- 📋 Grocery delivery integration
- 📋 Restaurant menu analysis
- 📋 Supplement tracking
- 📋 AI coaching features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for powerful meal analysis capabilities
- **Supabase** for excellent database and authentication services
- **Expo** for streamlined React Native development
- **Prisma** for type-safe database operations
- **React Query** for excellent data synchronization

## 📞 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Submit bug reports via GitHub Issues
- **Discussions**: Join GitHub Discussions for questions
- **Email**: [your-email@domain.com](mailto:your-email@domain.com)

---

**Built with ❤️ using React Native, Node.js, and AI**