# Client Widget Manager

A modern web application for managing chat widgets with flexible pricing plans. Built with Node.js, Express, and vanilla JavaScript.

## Features

- **User Authentication**: Secure registration and login system
- **Pricing Plans**: Flexible pricing with Free, Basic, and Pro tiers
- **Modern UI**: Clean, responsive design with separate pages
- **Dashboard**: User dashboard with plan information and statistics
- **Database Integration**: PostgreSQL database with proper schema

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Frontend**: Vanilla JavaScript + HTML/CSS
- **Authentication**: JWT tokens
- **Styling**: Custom CSS with modern design

## Project Structure

```
client-widget-manager/
├── server.js                 # Main Express server with all routes and logic
├── package.json              # Dependencies
├── setup-db.js              # Database setup script
├── run.sh                   # Startup script
├── database/
│   └── migrations/          # Database migration files
│       └── 001_create_tables.sql
└── views/                   # HTML pages
    ├── index.html          # Home page
    ├── demo.html           # Demo page
    └── pages/              # Individual pages
        ├── login.html      # Login page
        ├── register.html   # Registration page
        ├── dashboard.html  # User dashboard
        ├── pricing.html    # Pricing plans page
        └── widgets.html    # Widgets management page
```

## Pages

### 1. Home Page (`/`)
- Landing page with hero section
- Features overview
- Pricing preview
- Navigation to other pages

### 2. Login Page (`/login`)
- User authentication form
- JWT token generation
- Redirect to dashboard on success

### 3. Register Page (`/register`)
- User registration form
- Account creation
- Automatic login after registration

### 4. Dashboard (`/dashboard`)
- User profile information
- Current plan details
- Statistics overview
- Quick actions

### 5. Pricing Page (`/pricing`)
- All available pricing plans
- Plan comparison
- Registration links

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)

### Pricing
- `GET /api/pricing/plans` - Get all pricing plans

## Database Schema

### Tables
- `clients` - User accounts
- `pricing_plans` - Available pricing plans
- `widgets` - User widgets (for future use)

### Sample Data
The system comes with 3 default pricing plans:
- **Free**: $0/month, 1 widget
- **Basic**: $9.99/month, 3 widgets
- **Pro**: $29.99/month, 10 widgets

## Setup Instructions

### 1. Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn

### 2. Installation
```bash
# Clone the repository
git clone <repository-url>
cd client-widget-manager

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
nano .env
```

### 3. Database Setup
```bash
# Run database migration
node setup-db.js

# Or manually run the SQL migration
psql -U postgres -d client_widget_manager -f database/migrations/001_create_tables.sql
```

### 4. Environment Variables
Create a `.env` file with:
```env
PORT=3003
DATABASE_URL=postgresql://username:password@localhost:5432/client_widget_manager
JWT_SECRET=your-secret-key
```

### 5. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Usage

1. **Visit Home Page**: Navigate to `http://localhost:3003`
2. **Register Account**: Click "Get Started" to create an account
3. **Login**: Use your credentials to access the dashboard
4. **View Pricing**: Check available plans and upgrade options
5. **Manage Account**: Access your dashboard for account management

## Features Overview

### Authentication System
- Secure password hashing with bcrypt
- JWT token-based authentication
- Protected routes and middleware
- Session management

### Pricing System
- Flexible plan structure
- Easy plan upgrades
- Widget limits per plan
- Feature-based pricing

### User Interface
- Responsive design for all devices
- Modern CSS with gradients and animations
- Clean typography and spacing
- Intuitive navigation

### Database Integration
- PostgreSQL with connection pooling
- Proper error handling
- Migration system
- Data validation

## Development

### Adding New Features
1. Create new routes in `app/routes/`
2. Add controllers in `app/controllers/`
3. Update database schema if needed
4. Add frontend pages in `views/`

### Database Changes
1. Create migration files in `database/migrations/`
2. Update models in `app/models/`
3. Test with sample data

### Styling
- All styles are in individual HTML files
- Uses CSS custom properties for theming
- Responsive design with mobile-first approach
- Modern UI components and animations

## Troubleshooting

### Common Issues
1. **Database Connection**: Check PostgreSQL is running and credentials are correct
2. **Port Conflicts**: Change PORT in .env if 3003 is occupied
3. **JWT Errors**: Ensure JWT_SECRET is set in .env
4. **Missing Dependencies**: Run `npm install` to install all packages

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev
```

## License

This project is licensed under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation
