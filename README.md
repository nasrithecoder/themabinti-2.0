# Themabinti Services Hub

A modern, inclusive platform connecting people in Kenya with quality beauty, health, and lifestyle services. Built with React, Node.js, MongoDB, PostgreSQL, and integrated with M-Pesa for seamless payments and seller upgrades.

**Themabinti welcomes both men and women—anyone can provide or book a service on the platform.**

## 🌟 Features

### For Users
- **Service Discovery**: Browse and search by category, location, and subcategory
- **Appointment Booking**: Book appointments directly with providers
- **Mobile-First Design**: Fully responsive for all devices

### For Sellers
- **Tiered Seller Packages**: Basic, Standard, Premium (upgrade anytime)
- **M-Pesa Integration**: Secure STK Push for registration and upgrades
- **Service Management**: Create, edit, and manage listings
- **Media Upload**: Upload photos/videos based on package

### For Admins
- **Admin Dashboard**: Manage users, services, payments, and appointments
- **Payment Tracking**: Real-time M-Pesa payment status
- **Contact & Blog Management**: Handle inquiries and content

## 🚀 Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, React Hook Form, Axios
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), PostgreSQL, JWT, bcryptjs, M-Pesa STK Push API

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB database
- PostgreSQL database
- M-Pesa developer account

### Environment Variables
Create a `.env` file in the backend directory:
```env
MONGO_URI=your_mongo_uri
DATABASE_URL=your_postgres_url
JWT_SECRET=your_jwt_secret
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_PASSKEY=your_mpesa_passkey
MPESA_SHORTCODE=your_shortcode
MPESA_ENVIRONMENT=sandbox
BASE_URL=http://localhost:5000
PORT=5000
NODE_ENV=development
```

### Installation Steps
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd themabinti-2.0
   ```
2. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```
3. **Set up databases**
   - Create MongoDB and PostgreSQL databases
   - Update environment variables
4. **Create initial admin user**
   ```bash
   curl -X POST http://localhost:5000/api/admin/create-initial \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@themabinti.com","password":"admin123"}'
   ```
5. **Start the application**
   ```bash
   npm run dev:backend  # Terminal 1
   npm run dev:frontend # Terminal 2
   ```

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

## 📱 Mobile Responsiveness
- Fully responsive UI (mobile, tablet, desktop)
- Modern, accessible design

## 🛠️ Development Workflow
- **Frontend**: `cd frontend && npm run dev`
- **Backend**: `cd backend && npm run dev`
- **Build for Production**: `cd frontend && npm run build`

## 📊 Admin Dashboard
- `/admin` route for full management
- View stats, users, services, payments, appointments

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push and open a Pull Request

## 📄 License
MIT License - see the [LICENSE](LICENSE) file.

## 📞 Support
Email: themabintionline@gmail.com or open an issue.

## 🌐 Deployment
- **Render** (recommended)
- **Heroku**, **Vercel** (frontend), **Railway** (backend), **DigitalOcean**, **AWS**
- See [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) and [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

## 🔮 Future Enhancements
- Real-time notifications
- Advanced analytics
- Multi-language support
- Mobile app
- More payment providers
- Review/rating system
- Automated email notifications