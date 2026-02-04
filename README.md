# Music ConnectZ v5.5d

A production-ready platform for music industry professionals featuring Google Maps integration, Stripe payment processing, and comprehensive accessibility features.

## Features

### Core Features
- 🎵 User profile management with GPS location support
- 👥 Multiple personas (Indie Artist, Beat Producer, Mix Engineer, Designer, Videographer)
- 🎨 Skills management and work examples upload
- 🤝 Collaboration board with advanced filtering
- 💰 Wallet management and income tracking
- 🌓 Dark/Light theme toggle
- 📱 Fully responsive mobile design

### New Integrations
- 🗺️ **Google Maps API**: Address autocomplete, reverse geocoding, collaboration map view
- 💳 **Stripe Payments**: Secure payment processing, transaction history, webhook handling
- ♿ **WCAG 2.1 AA Accessibility**: Full keyboard navigation, screen reader support, high contrast mode
- ✅ **Enhanced Validation**: Real-time form validation with user-friendly error messages
- 🔒 **Security**: Input sanitization, rate limiting, HTTPS enforcement, secure API key management

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Stripe Account (for payment processing)
- Google Cloud Account (for Maps API)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ctkoth/music-connectz-frontend.git
   cd music-connectz-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   - **Stripe Keys**: Get from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
   - **Google Maps API Key**: Get from [Google Cloud Console](https://console.cloud.google.com/)

4. **Start the development server**
   ```bash
   npm run dev
   ```
   
   Or for production:
   ```bash
   npm start
   ```

5. **Access the application**
   ```
   http://localhost:3000
   ```

## API Configuration

### Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create credentials (API Key)
5. Restrict your API key:
   - HTTP referrers for frontend
   - IP addresses for backend
6. Add the API key to `.env` file

### Stripe Setup

1. Create a [Stripe Account](https://dashboard.stripe.com/register)
2. Get your API keys from the Dashboard
3. For webhooks:
   - Install Stripe CLI: `stripe login`
   - Forward webhooks: `stripe listen --forward-to localhost:3000/api/payments/webhook`
   - Copy the webhook signing secret to `.env`
4. For production, configure webhooks in Stripe Dashboard

## API Endpoints

### Payment Endpoints
- `POST /api/payments/create-checkout-session` - Initialize Stripe checkout
- `POST /api/payments/webhook` - Handle Stripe webhook events
- `GET /api/payments/transaction-history` - Retrieve user transactions

### Location Endpoints
- `GET /api/locations/autocomplete` - Google Places autocomplete
- `POST /api/locations/reverse-geocode` - Convert coordinates to addresses
- `GET /api/collaborations/nearby` - Find collaborations by location proximity

## Project Structure

```
music-connectz-frontend/
├── public/
│   ├── css/
│   │   ├── style.css              # Main styles
│   │   └── accessibility.css      # Accessibility-specific styles
│   ├── js/
│   │   ├── maps.js               # Google Maps utilities
│   │   ├── payments.js           # Stripe payment handling
│   │   └── validation.js         # Form validation utilities
│   └── uploads/                  # User uploaded files (gitignored)
├── server.js                     # Express backend
├── index.html                    # Main application
├── package.json                  # Dependencies
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
└── README.md                     # This file
```

## Security Features

- 🔒 Input sanitization to prevent XSS attacks
- 🔒 File upload validation (type, size, content)
- 🔒 CORS configuration with whitelist
- 🔒 Rate limiting to prevent abuse
- 🔒 Helmet.js for secure HTTP headers
- 🔒 Environment variables for sensitive data
- 🔒 HTTPS enforcement in production

## Accessibility Features

- ♿ WCAG 2.1 AA compliance
- ♿ Full keyboard navigation (Tab, Enter, Escape)
- ♿ Screen reader support with ARIA labels
- ♿ High contrast mode toggle
- ♿ Focus management with visual indicators
- ♿ Color blindness support

## Deployment

### Environment Variables for Production

Ensure all environment variables in `.env` are set:
- Change `NODE_ENV` to `production`
- Use production Stripe keys
- Configure production webhook URL
- Set secure `SESSION_SECRET`
- Update `FRONTEND_URL` to your domain

### Deploy to Azure

1. Create an Azure Web App
2. Configure environment variables in Application Settings
3. Enable HTTPS Only
4. Deploy using GitHub Actions (workflow included)

### Deploy to Other Platforms

- **Heroku**: Use Heroku CLI or GitHub integration
- **AWS**: Use Elastic Beanstalk or EC2
- **DigitalOcean**: Use App Platform
- **Vercel/Netlify**: For frontend only (separate backend deployment needed)

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses nodemon for auto-restart on file changes.

### Testing Stripe Webhooks Locally

```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/payments/webhook

# Test a payment
stripe trigger payment_intent.succeeded
```

### Testing Google Maps

Ensure your API key has the following APIs enabled:
- Maps JavaScript API
- Places API  
- Geocoding API

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review API documentation (Stripe, Google Maps)

## Changelog

### v5.5.0 (2026-02-04)
- ✅ Added Google Maps API integration
- ✅ Added Stripe payment processing
- ✅ Enhanced accessibility (WCAG 2.1 AA)
- ✅ Improved validation and error handling
- ✅ Security enhancements
- ✅ Backend API with Express
- ✅ Enhanced UI/UX with dark mode refinements

### v5.5d (Base)
- Initial Music ConnectZ application
- User profiles and personas
- Collaboration board
- LocalStorage persistence
- Dark/Light theme

## Acknowledgments

- Stripe for payment processing
- Google Maps Platform for location services
- Express.js community
- Open source contributors
