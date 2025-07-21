# Themabinti Backend

Node.js/Express backend for the Themabinti Services Hub platform with MongoDB, PostgreSQL, and M-Pesa integration.

**Themabinti is inclusive: both men and women can provide or book services on the platform.**

## ✨ Features

- **User Authentication**: JWT-based, bcrypt password hashing
- **Seller Package Upgrades**: Upgrade seller tier anytime (M-Pesa STK Push)
- **M-Pesa Integration**: STK Push for registration and upgrades
- **Service Management**: CRUD for services
- **Appointment System**: Bookings and management
- **Admin Dashboard**: Full platform management
- **Payment Tracking**: PostgreSQL for M-Pesa payments

## 🛠️ Technology Stack

- Node.js + Express.js
- MongoDB (Mongoose)
- PostgreSQL
- JWT, bcryptjs
- M-Pesa STK Push API
- Axios

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB database
- PostgreSQL database
- M-Pesa developer account

### Setup
```bash
cd backend
npm install
cp .env.example .env # then edit .env with your config
npm run dev
```

### Environment Variables
See `.env.example` for all required variables:
- `MONGO_URI`, `DATABASE_URL`, `JWT_SECRET`, `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`, `MPESA_SHORTCODE`, `BASE_URL`, etc.

## 🔧 API Endpoints (Highlights)

- `POST /api/register` - User registration (with M-Pesa for sellers)
- `POST /api/upgrade-seller-package` - Initiate seller package upgrade (STK Push)
- `POST /api/complete-seller-upgrade` - Complete upgrade after payment
- `GET /api/payment-status/:checkoutRequestId` - Check payment status
- `POST /api/services` - Create new service (sellers)
- `POST /api/appointments` - Book appointment
- `POST /api/mpesa/initiate` - Initiate M-Pesa payment
- `POST /api/mpesa/callback` - M-Pesa callback handler
- `POST /api/admin/login` - Admin login

## 💳 M-Pesa Integration

- **STK Push** for seller registration and upgrades
- **Callback** for real-time payment status
- **Upgrade Flow**: Sellers can upgrade from Basic → Standard → Premium anytime

## 🛡️ Security

- JWT authentication
- Password hashing (bcryptjs)
- Input validation (Zod)
- SQL injection prevention
- CORS configuration
- Admin-only route protection

## 🏗️ Development Workflow

- `npm run dev` (with nodemon)
- `npm start` (production)
- PostgreSQL tables are auto-created on first run

## 🗄️ Database Schema

- **MongoDB**: Users, Services, Appointments, etc.
- **PostgreSQL**: `mpesa_payments` table for payment tracking

## 🧪 Testing
```bash
curl -X POST http://localhost:5000/api/mpesa/initiate \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "phoneNumber": "2547XXXXXXXX", "packageId": "basic", "packageName": "Basic Package"}'
```

## 🌐 Deployment

- **Render** (recommended)
- **Heroku**, **Railway**, **DigitalOcean**, **AWS**
- See [RENDER_DEPLOYMENT.md](../RENDER_DEPLOYMENT.md)

## 🤝 Contributing

1. Follow code structure and naming conventions
2. Add error handling and input validation
3. Write clear documentation
4. Test thoroughly before submitting
5. Open a Pull Request

## 📄 License

MIT License

## 📞 Support

Email: themabintionline@gmail.com or open an issue.