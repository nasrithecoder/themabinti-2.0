# Themabinti Backend

Node.js/Express backend for the Themabinti Services Hub platform with MongoDB and M-Pesa integration.

## Features

- **User Authentication**: JWT-based auth with bcrypt password hashing
- **M-Pesa Integration**: STK Push for seller package payments
- **Service Management**: CRUD operations for services
- **Appointment System**: Booking and management
- **Admin Dashboard**: Complete platform management
- **File Upload**: Base64 image/video handling
- **Payment Tracking**: PostgreSQL database for payment records

## Technology Stack

- Node.js with Express.js
- MongoDB with Mongoose ODM
- PostgreSQL for payment tracking
- JWT for authentication
- bcryptjs for password hashing
- M-Pesa STK Push API
- Axios for external API calls

## Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Start production server
npm start
```

## Environment Variables

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
```

## API Endpoints

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
- `GET /api/service/:id` - Get single service
- `GET /api/subcategory` - Get services by subcategory

### Appointments
- `POST /api/appointments` - Book appointment
- `GET /api/appointments/user/:userId` - Get user appointments
- `GET /api/appointments/service/:serviceId` - Get service appointments
- `PATCH /api/appointments/:id/status` - Update appointment status

### M-Pesa Payments
- `POST /api/mpesa/initiate` - Initiate STK Push
- `POST /api/mpesa/callback` - M-Pesa callback handler
- `GET /api/mpesa/status/:packageId` - Check payment status

### Admin
- `POST /api/admin/login` - Admin login
- `POST /api/admin/create-initial` - Create initial admin
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/services` - Get all services
- `GET /api/admin/appointments` - Get all appointments
- `GET /api/admin/payments` - Get all payments
- `GET /api/admin/contacts` - Get all contacts
- `PATCH /api/admin/appointments/:id/status` - Update appointment status
- `DELETE /api/admin/services/:id` - Delete service
- `DELETE /api/admin/users/:id` - Delete user

### Contact & Blogs
- `POST /api/contact` - Submit contact form
- `GET /api/blogs` - Get all blogs
- `POST /api/blogs` - Create blog post
- `GET /api/blogs/:id` - Get single blog

## Database Schema

### MongoDB Collections

#### Users
```javascript
{
  userName: String,
  email: String (unique),
  password: String (hashed),
  phoneNumber: String,
  accountType: 'buyer' | 'seller',
  sellerPackage: {
    packageId: 'basic' | 'standard' | 'premium',
    photoUploads: Number,
    videoUploads: Number
  },
  createdAt: Date
}
```

#### Services
```javascript
{
  userId: ObjectId (ref: User),
  name: String,
  media: [{
    type: 'image' | 'video',
    data: String (base64)
  }],
  minPrice: Number,
  maxPrice: Number,
  location: String,
  phoneNumber: String,
  category: String,
  subcategory: String,
  description: String,
  createdAt: Date
}
```

#### Appointments
```javascript
{
  serviceId: ObjectId (ref: Service),
  userId: ObjectId (ref: User),
  name: String,
  email: String,
  date: Date,
  time: String,
  message: String,
  status: 'pending' | 'confirmed' | 'cancelled',
  createdAt: Date
}
```

### PostgreSQL Tables

#### mpesa_payments
```sql
CREATE TABLE mpesa_payments (
  id SERIAL PRIMARY KEY,
  checkout_request_id VARCHAR(255) NOT NULL UNIQUE,
  package_id VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  phone_number VARCHAR(15) NOT NULL,
  timestamp VARCHAR(14) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  mpesa_receipt_number VARCHAR(255),
  transaction_date VARCHAR(14),
  transaction_amount DECIMAL(10,2),
  user_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## M-Pesa Integration

### STK Push Flow
1. User selects seller package
2. Backend initiates STK Push request
3. User receives prompt on phone
4. User enters M-Pesa PIN
5. M-Pesa sends callback to backend
6. Backend updates payment status
7. Registration completes on successful payment

### Callback Handling
- Endpoint: `POST /api/mpesa/callback`
- Validates M-Pesa response
- Updates payment status in database
- Handles success/failure scenarios

## Security

- JWT tokens for authentication
- Password hashing with bcryptjs
- Input validation and sanitization
- CORS configuration
- Environment variable protection
- SQL injection prevention

## Error Handling

- Centralized error handling middleware
- Detailed error logging
- User-friendly error messages
- Proper HTTP status codes

## Development

```bash
# Start with nodemon for auto-restart
npm run dev

# Run in production mode
npm start

# Database initialization
# PostgreSQL tables are created automatically on first run
```

## Testing

```bash
# Test M-Pesa integration (sandbox)
curl -X POST http://localhost:5000/api/mpesa/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 800,
    "phoneNumber": "254712345678",
    "packageId": "basic",
    "packageName": "Basic Package"
  }'
```

## Deployment

### Environment Setup
1. Set up MongoDB database
2. Set up PostgreSQL database
3. Configure M-Pesa credentials
4. Set environment variables
5. Deploy to hosting platform

### Production Considerations
- Use production M-Pesa credentials
- Enable HTTPS
- Set up proper logging
- Configure database backups
- Set up monitoring
- Use PostgreSQL for better Render compatibility

## 🌐 Render Deployment

This backend is optimized for deployment on Render:

1. **PostgreSQL Integration**: Uses `pg` driver for better Render compatibility
2. **Environment Variables**: Configured for Render's environment
3. **Auto-scaling**: Supports Render's auto-scaling features
4. **Health Checks**: Built-in health endpoints for monitoring

See [RENDER_DEPLOYMENT.md](../RENDER_DEPLOYMENT.md) for complete deployment instructions.

## Contributing

1. Follow existing code structure
2. Add proper error handling
3. Include input validation
4. Write clear documentation
5. Test thoroughly before submitting

## Support

For issues or questions:
- Check the logs for detailed error messages
- Verify environment variables are set correctly
- Ensure databases are accessible
- Test M-Pesa credentials in sandbox first