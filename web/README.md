# Smart Waste Management - Next.js Frontend

Modern, production-ready frontend for the Smart Waste Management AI system.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **React Server Components**
- **Recharts** for analytics visualization
- **Google Maps JavaScript SDK** for driver navigation

## Features

### User App
- 📸 Camera-first waste capture (back camera on mobile)
- 🤖 AI classification with confidence-aware UI
- 📊 Real-time status tracking via WebSocket/SSE
- 📈 Personal environmental impact dashboard

### Driver App
- 🗺️ Google Maps integration with navigation
- 🔔 Real-time pickup notifications
- 📷 Collection verification with proof photos
- 📍 Live location tracking

### Analytics Dashboard
- 📊 Waste category distribution charts
- 🌍 SDG alignment indicators (11, 12, 13)
- ♻️ Recycling rate metrics
- 💚 CO₂ and energy savings

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Running backend server

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local with your configuration
# - NEXT_PUBLIC_API_URL: Backend API URL
# - NEXT_PUBLIC_WS_URL: WebSocket URL  
# - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: Google Maps API key

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `ws://localhost:8000` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API Key | - |

## Project Structure

```
web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Protected routes
│   │   │   ├── dashboard/      # User dashboard
│   │   │   ├── capture/        # Camera capture
│   │   │   ├── history/        # Submission history
│   │   │   ├── driver/         # Driver interface
│   │   │   ├── analytics/      # Analytics dashboard
│   │   │   └── profile/        # User profile
│   │   ├── login/              # Login page
│   │   ├── signup/             # Signup page
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   ├── layout/             # Navigation, ProtectedRoute
│   │   ├── map/                # Google Maps component
│   │   └── ui/                 # Reusable UI components
│   ├── context/                # React contexts
│   ├── hooks/                  # Custom hooks (camera, geolocation, realtime)
│   └── lib/                    # Utils, API client, types
├── public/                     # Static assets
├── tailwind.config.ts          # Tailwind configuration
└── next.config.js              # Next.js configuration
```

## Design System

### Colors

- **Background**: `#0f1419` (dark)
- **Surface**: `#1e2730` (cards)
- **Primary/Eco**: `#0d9488` (teal)
- **Accent Green**: `#22c55e`

### Components

All components are designed with:
- Dark theme with eco-green accents
- Rounded corners (2xl for cards)
- Subtle shadows and hover states
- Mobile-first responsive design

## API Integration

The frontend connects to the FastAPI backend:

- **REST API** for CRUD operations
- **WebSocket** for real-time updates
- **SSE** as WebSocket fallback

## Browser APIs Used

- **MediaDevices API** for camera access
- **Geolocation API** for location tracking
- **Notification API** for driver alerts

## Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

## License

MIT
