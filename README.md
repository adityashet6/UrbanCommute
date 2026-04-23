# Urban Commute Frontend

A complete working frontend that connects to the backend API for bus route finding, tracking, and recommendations.

## Features

- ✅ **Route Search**: Find bus routes from start to destination
- ✅ **Live Bus Tracking**: Real-time bus location updates
- ✅ **AI Recommendations**: Get AI-powered travel suggestions
- ✅ **Fallback Options**: Alternative transport options (Moto, Auto, Cab)
- ✅ **Last-Mile Support**: Walking, auto, and bike share options
- ✅ **SOS/Emergency**: Quick access to emergency contacts
- ✅ **Interactive Map**: Live map with Leaflet.js (falls back to Google Maps iframe)
- ✅ **Voice Search**: Speak your start and destination

## Setup

1. Make sure the backend is running on `http://localhost:5000`
2. Open `index.html` in a browser
3. Enter start and destination locations
4. Click "Find Route"

## Backend Integration

The frontend connects to these backend endpoints:

- `POST /route` - Get bus routes
- `GET /busLocation?busId=...` - Track bus location
- `POST /ai` - AI recommendations
- `POST /fallback` - Alternative transport options
- `POST /lastmile` - Last-mile information
- `GET /sos` - Emergency contacts

## Usage

1. Enter your starting point and destination
2. Click "Find Route" to search for buses
3. Click "Track Bus" on any route to see live location
4. View AI recommendations, fallback options, and last-mile info in the sidebar
5. Use the SOS button for emergency contacts

## Dependencies

- Leaflet.js (for maps) - loaded from CDN
- Modern browser with fetch API support
- Speech Recognition API (optional, for voice search)
