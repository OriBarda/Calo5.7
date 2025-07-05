# Nutrition Tracker App

A comprehensive React Native nutrition tracking application with AI-powered meal analysis, device integration, meal planning, and detailed statistics.

## Features

### 🍽️ Meal Analysis
- AI-powered food image analysis using OpenAI GPT-4 Vision
- Detailed nutritional breakdown (calories, protein, carbs, fat, fiber, etc.)
- Meal update functionality with additional context
- Meal history with ratings and favorites

### 📱 Device Integration
- Apple Health integration (iOS)
- Google Fit support (Android)
- Fitbit, Garmin, Whoop, Polar device connections
- Activity data synchronization
- Daily calorie balance tracking

### 🗓️ Meal Planning
- AI-generated personalized meal plans
- Weekly meal schedules
- Shopping list generation
- Meal replacement suggestions
- Dietary preference customization

### 📊 Statistics & Analytics
- Comprehensive nutrition statistics
- Weekly and monthly trends
- Health insights and recommendations
- Calendar view with progress tracking
- Goal achievement monitoring

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Expo CLI (`npm install -g @expo/cli`)
- PostgreSQL database (Supabase recommended)
- OpenAI API key

### 1. Environment Configuration

Create `.env` files in both client and server directories:

**client/.env:**
```
EXPO_PUBLIC_API_URL=http://YOUR_IP:5000/api
```

**server/.env:**
```
DATABASE_URL=your_supabase_database_url
DIRECT_URL=your_supabase_direct_url
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_secure_jwt_secret
PORT=5000
NODE_ENV=development
API_BASE_URL=http://YOUR_IP:5000/api
CLIENT_URL=http://YOUR_IP:8081
```

### 2. Database Setup

1. Create a Supabase project at https://supabase.com
2. Get your database URL and direct URL from the project settings
3. Run database migrations:

```bash
cd server
npm install
npx prisma generate
npx prisma db push
```

### 3. Server Setup

```bash
cd server
npm install
npm run dev
```

The server will start on port 5000.

### 4. Client Setup

```bash
cd client
npm install
npm start
```

Choose your preferred platform:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web browser

### 5. OpenAI Configuration

1. Get an API key from https://platform.openai.com
2. Add it to your server `.env` file
3. The app will use mock data if no API key is provided

## Project Structure

```
├── client/                 # React Native app
│   ├── app/               # Expo Router pages
│   ├── components/        # Reusable components
│   ├── hooks/            # Custom hooks and React Query
│   ├── src/              # Core application logic
│   │   ├── services/     # API services
│   │   ├── store/        # Redux store and slices
│   │   └── types/        # TypeScript types
│   └── assets/           # Images and fonts
├── server/               # Node.js backend
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Auth and error handling
│   │   └── types/        # TypeScript types
│   └── prisma/           # Database schema and migrations
└── scripts/              # Utility scripts
```

## Key Technologies

### Frontend
- **React Native** with Expo
- **TypeScript** for type safety
- **Redux Toolkit** for state management
- **React Query** for data fetching
- **Expo Router** for navigation
- **React Native Reanimated** for animations

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Prisma** ORM with PostgreSQL
- **OpenAI API** for meal analysis
- **JWT** authentication
- **Zod** for validation

### Database
- **PostgreSQL** (via Supabase)
- **Prisma** for schema management
- **Row Level Security** for data protection

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `GET /api/auth/me` - Get current user

### Nutrition
- `POST /api/nutrition/analyze` - Analyze meal image
- `PUT /api/nutrition/update` - Update meal analysis
- `POST /api/nutrition/save` - Save meal
- `GET /api/nutrition/meals` - Get user meals
- `GET /api/nutrition/stats/:date` - Get daily stats

### Devices
- `GET /api/devices` - Get connected devices
- `POST /api/devices/connect` - Connect device
- `DELETE /api/devices/:id` - Disconnect device
- `POST /api/devices/:id/sync` - Sync device data

### Meal Plans
- `POST /api/meal-plans/create` - Create AI meal plan
- `GET /api/meal-plans/current` - Get current meal plan
- `PUT /api/meal-plans/:id/replace` - Replace meal with AI

## Development Tips

### Running on Physical Device
1. Make sure your computer and phone are on the same network
2. Update the IP address in the environment files
3. Use the Expo Go app to scan the QR code

### Debugging
- Use React Native Debugger for Redux state inspection
- Check server logs for API issues
- Use Expo development build for native debugging

### Database Changes
1. Modify the Prisma schema in `server/prisma/schema.prisma`
2. Run `npx prisma db push` to apply changes
3. Run `npx prisma generate` to update the client

## Troubleshooting

### Common Issues

1. **Network Connection Errors**
   - Verify IP addresses in environment files
   - Check firewall settings
   - Ensure server is running on correct port

2. **Database Connection Issues**
   - Verify Supabase credentials
   - Check database URL format
   - Ensure database is accessible

3. **OpenAI API Errors**
   - Verify API key is correct
   - Check API usage limits
   - App will use mock data if API fails

4. **Build Errors**
   - Clear node_modules and reinstall
   - Check for TypeScript errors
   - Verify all dependencies are installed

### Performance Optimization
- Images are automatically optimized for analysis
- React Query provides intelligent caching
- Redux Persist maintains state across app restarts
- Background sync keeps data fresh

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.