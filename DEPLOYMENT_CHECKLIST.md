# 🚀 Themabinti Deployment Checklist

## Pre-Deployment Setup

### 1. Database Setup
- [x] **MongoDB Atlas**
  - [x] Create free cluster
  - [x] Create database user
  - [x] Whitelist all IPs (0.0.0.0/0)
  - [x] Get connection string
  
- [x] **PostgreSQL on Render**
  - [x] Create PostgreSQL service
  - [x] Note the external database URL
  - [x] Verify connection

### 2. M-Pesa Configuration
- [x] **Safaricom Developer Account**
  - [x] Register at developer.safaricom.co.ke
  - [x] Create new app
  - [x] Get Consumer Key and Secret
  - [x] Note sandbox credentials

### 3. Environment Variables Preparation
- [x] Generate strong JWT secret (32+ characters)
- [x] Prepare all environment variables
- [x] Test locally first

## Render Deployment Steps

### 1. Backend Deployment
- [ ] **Create Web Service**
  - [x] Connect GitHub repository
  - [x] Set root directory to `backend`
  - [x] Configure build command: `npm install`
  - [x] Configure start command: `npm start`

- [x] **Environment Variables**
  ```
  NODE_ENV=production
  PORT=10000
  MONGO_URI=mongodb+srv://...
  DATABASE_URL=postgresql://...
  JWT_SECRET=your_jwt_secret
  MPESA_CONSUMER_KEY=your_key
  MPESA_CONSUMER_SECRET=your_secret
  MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
  MPESA_SHORTCODE=174379
  MPESA_ENVIRONMENT=sandbox
  BASE_URL=https://your-backend.onrender.com
  ```

- [x] **Deploy and Test**
  - [x] Wait for successful deployment
  - [x] Test health endpoint
  - [x] Check logs for errors

### 2. Frontend Deployment
- [x] **Update API Configuration**
  - [x] Update `frontend/src/config/api.ts` with backend URL
  - [x] Commit changes to GitHub

- [x] **Create Static Site**
  - [x] Connect same GitHub repository
  - [x] Set root directory to `frontend`
  - [x] Configure build command: `npm install && npm run build`
  - [x] Set publish directory: `dist`

- [x] **Deploy and Test**
  - [x] Wait for successful deployment
  - [x] Test frontend functionality
  - [x] Verify API communication

### 3. Database Initialization
- [x] **Create Admin User**
  ```bash
  curl -X POST https://your-backend.onrender.com/api/admin/create-initial \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@themabinti.com","password":"secure_password"}'
  ```

- [x] **Verify Database Tables**
  - [x] Check PostgreSQL tables created
  - [x] Verify MongoDB collections
  - [x] Test database connections

## Testing Checklist

### 1. User Registration
- [x] **Buyer Registration**
  - [x] Register as buyer
  - [x] Verify login works
  - [x] Check user data in database

- [x] **Seller Registration**
  - [x] Register as seller
  - [x] Test M-Pesa STK Push
  - [x] Verify payment completion
  - [x] Check seller privileges

### 2. Core Functionality
- [x] **Service Management**
  - [x] Create service as seller
  - [x] View services on homepage
  - [x] Search functionality
  - [x] Service detail pages

- [x] **Appointment Booking**
  - [x] Book appointment
  - [ ] Verify email/data capture
  - [x] Check appointment in admin

- [ ] **Admin Dashboard**
  - [x] Login to admin panel
  - [x] View all statistics
  - [] Manage users and services
  - [x] Monitor payments

### 3. Payment Flow
- [x] **M-Pesa Integration**
  - [x] Test STK Push initiation
  - [x] Verify callback handling
  - [x] Check payment status updates
  - [x] Test timeout scenarios

## Production Readiness

### 1. Security
- [ ] **Environment Variables**
  - [x] All secrets properly set
  - [x] No hardcoded credentials
  - [x] Strong JWT secret

- [x] **Database Security**
  - [x] SSL connections enabled
  - [x] Proper user permissions
  - [x] Regular backups configured

### 2. Performance
- [ ] **Database Optimization**
  - [ ] Indexes created
  - [ ] Connection pooling enabled
  - [ ] Query optimization

- [x] **Monitoring**
  - [x] Error logging configured
  - [x] Performance monitoring
  - [x] Uptime monitoring

### 3. M-Pesa Production
- [x] **Production Credentials**
  - [x] Apply for production access
  - [x] Update environment variables
  - [x] Test with real payments
  - [x] Verify callback URLs

## Post-Deployment

### 1. Monitoring Setup
- [x] **Application Monitoring**
  - [x] Set up error tracking
  - [x] Monitor response times
  - [x] Track user activity

- [ ] **Database Monitoring**
  - [x] Monitor connection counts
  - [ ] Track query performance
  - [ ] Set up alerts

### 2. Backup Strategy
- [ ] **Database Backups**
  - [x] MongoDB Atlas automatic backups
  - [x] PostgreSQL backup schedule
  - [ ] Test restore procedures

### 3. Maintenance
- [ ] **Regular Updates**
  - [ ] Keep dependencies updated
  - [ ] Monitor security advisories
  - [ ] Regular health checks

## Troubleshooting Guide

### Common Issues
1. **Database Connection Errors**
   - Check connection strings
   - Verify network access
   - Check credentials

2. **M-Pesa Integration Issues**
   - Verify callback URL accessibility
   - Check phone number format
   - Validate credentials

3. **CORS Errors**
   - Update CORS configuration
   - Check frontend API URLs
   - Verify environment variables

### Debug Commands
```bash
# Check backend health
curl https://your-backend.onrender.com/api/health

# Test M-Pesa initiation
curl -X POST https://your-backend.onrender.com/api/mpesa/initiate \
  -H "Content-Type: application/json" \
  -d '{"amount":800,"phoneNumber":"254712345678","packageId":"basic","packageName":"Basic Package"}'

# Check database connection
# (Access through Render dashboard or psql)
```

## Success Criteria
- [ ] All services deployed successfully
- [ ] Frontend and backend communicating
- [ ] Database connections working
- [ ] M-Pesa payments processing
- [ ] Admin dashboard accessible
- [ ] User registration flow complete
- [ ] No critical errors in logs
- [ ] Performance within acceptable limits

## Go-Live Checklist
- [ ] All tests passing
- [ ] Production environment variables set
- [ ] M-Pesa production credentials configured
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificates active
- [ ] Monitoring and alerts configured
- [ ] Backup procedures tested
- [ ] Team trained on admin dashboard
- [ ] Support procedures documented

🎉 **Deployment Complete!** Your Themabinti platform is now live and ready for users!