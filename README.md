# Themabinti Services Hub 

A comprehensive platform connecting Kenyan women with quality beauty, health, and lifestyle services. Built with React, Node.js, MongoDB, and integrated with M-Pesa for seamless payments.

## 🌟 Features

### For Users
- **Service Discovery**: Browse services by category, location, and subcategory
- **Appointment Booking**: Book appointments directly with service providers
- **Search & Filter**: Advanced search and filtering capabilities
- **Responsive Design**: Optimized for mobile and desktop

### For Service Providers
- **Seller Registration**: Register with different package tiers (Basic, Standard, Premium)
- **M-Pesa Integration**: Secure payment processing for seller packages
- **Service Management**: Create and manage service listings
- **Media Upload**: Upload photos and videos based on package tier

### For Administrators
- **Admin Dashboard**: Comprehensive management interface
- **User Management**: View, manage, and delete users
- **Service Oversight**: Monitor and manage all services
- **Payment Tracking**: Track all M-Pesa transactions
- **Appointment Management**: Oversee booking system
- **Contact Management**: Handle customer inquiries

## 🚀 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Router** for navigation
- **React Hook Form** with Zod validation
- **Axios** for API communication

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **PostgreSQL** for payment tracking
- **JWT** for authentication
- **bcryptjs** for password hashing
- **M-Pesa STK Push API** for payments

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB database
- PostgreSQL database (for payments)
- M-Pesa developer account

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/themabinti
DATABASE_URL=postgresql://username:password@hostname:port/database_name

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# M-Pesa Configuration
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_PASSKEY=your_mpesa_passkey
MPESA_SHORTCODE=174379
MPESA_ENVIRONMENT=sandbox
BASE_URL=http://localhost:5000

# Server Configuration
PORT=5000
NODE_ENV=development

# Admin Configuration
ADMIN_EMAIL=admin@themabinti.com
ADMIN_PASSWORD=admin123
```

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd themabinti-services-hub
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Set up databases**
   - Create MongoDB database
   - Create PostgreSQL database for payments
   - Update environment variables

4. **Create initial admin user**
   ```bash
   # Make a POST request to create the first admin
   curl -X POST http://localhost:5000/api/admin/create-initial \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@themabinti.com","password":"admin123"}'
   ```

5. **Start the application**
   ```bash
   # Development mode (from root directory)
   npm run dev:backend  # Terminal 1
   npm run dev:frontend # Terminal 2
   
   # Or start both with concurrently
   npm run dev
   ```

## 🔧 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/complete-seller-registration` - Complete seller registration after payment
- `GET /api/payment-status/:checkoutRequestId` - Check payment status

### Services
- `GET /api/services` - Get all services
- `POST /api/services` - Create new service (authenticated sellers)
- `GET /api/services/:category` - Get services by category
- `GET /api/services/search` - Search services

### Appointments
- `POST /api/appointments` - Book appointment
- `GET /api/appointments/user/:userId` - Get user appointments
- `PATCH /api/appointments/:id/status` - Update appointment status

### M-Pesa Payments
- `POST /api/mpesa/initiate` - Initiate STK Push
- `POST /api/mpesa/callback` - M-Pesa callback handler
- `GET /api/mpesa/status/:packageId` - Check payment status

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/services` - Get all services
- `GET /api/admin/appointments` - Get all appointments
- `GET /api/admin/payments` - Get all payments

## 💳 M-Pesa Integration

The platform integrates M-Pesa STK Push for seller package payments:

### Payment Flow
1. User selects seller package during registration
2. System initiates M-Pesa STK Push to user's phone
3. User enters M-Pesa PIN to complete payment
4. System verifies payment and completes registration
5. Seller gains access to platform features

### Package Pricing
- **Basic**: Ksh 800/month (1 photo upload)
- **Standard**: Ksh 1,500/month (2 photo uploads)
- **Premium**: Ksh 2,500/month (3 photos + 1 video)

## 🛡️ Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Input validation with Zod
- SQL injection prevention
- CORS configuration
- Admin-only routes protection

## 📱 Mobile Responsiveness

The platform is fully responsive and optimized for:
- Mobile phones (320px+)
- Tablets (768px+)
- Desktop computers (1024px+)

## 🔄 Development Workflow

### Frontend Development
```bash
cd frontend
npm run dev
```

### Backend Development
```bash
cd backend
npm run dev
```

### Building for Production
```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd ../backend
npm start
```

## 📊 Admin Dashboard

Access the admin dashboard at `/admin` with the following features:

- **Dashboard Overview**: Key metrics and statistics
- **User Management**: View, edit, and delete users
- **Service Management**: Monitor and manage all services
- **Appointment Management**: Track and update appointments
- **Payment Management**: Monitor M-Pesa transactions
- **Contact Management**: Handle customer inquiries

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email themabintionline@gmail.com or create an issue in the repository.

## 🚀 Deployment

### Production Environment Variables
Ensure all environment variables are properly set in your production environment, especially:
- MongoDB connection string
- M-Pesa production credentials
- JWT secret
- MySQL database credentials

### Deployment Platforms
The application can be deployed on:
- **Render** (recommended - with MongoDB Atlas and PostgreSQL)
- **Heroku** (with MongoDB Atlas and PostgreSQL)
- **Vercel** (frontend) + **Railway** (backend)
- **DigitalOcean** App Platform
- **AWS** EC2 with RDS

## 🌐 Render Deployment

For detailed deployment instructions to Render, see [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md).

### Quick Deployment Steps:
1. **Database Setup**: MongoDB Atlas + Render PostgreSQL
2. **Backend**: Deploy as Web Service on Render
3. **Frontend**: Deploy as Static Site on Render
4. **Configuration**: Set environment variables
5. **Testing**: Verify M-Pesa integration and admin dashboard

See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for a complete deployment checklist.

## 🔮 Future Enhancements

- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app development
- [ ] Integration with more payment providers
- [ ] Advanced booking calendar
- [ ] Review and rating system
- [ ] Automated email notifications