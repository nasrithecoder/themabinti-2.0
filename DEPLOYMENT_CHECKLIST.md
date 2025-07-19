# 🚀 Themabinti Deployment Checklist

## Pre-Deployment Setup

### 1. Database Setup
- [ ] **MongoDB Atlas**
  - [ ] Create free cluster
  - [ ] Create database user
  - [ ] Whitelist all IPs (0.0.0.0/0)
  - [ ] Get connection string
  
- [ ] **PostgreSQL on Render**
  - [ ] Create PostgreSQL service
  - [ ] Note the external database URL
  - [ ] Verify connection

### 2. M-Pesa Configuration
- [ ] **Safaricom Developer Account**
  - [ ] Register at developer.safaricom.co.ke
  - [ ] Create new app
  - [ ] Get Consumer Key and Secret
  - [ ] Note sandbox credentials

### 3. Environment Variables Preparation
- [ ] Generate strong JWT secret (32+ characters)
- [ ] Prepare all environment variables
- [ ] Test locally first

## Render Deployment Steps

### 1. Backend Deployment
- [ ] **Create Web Service**
  - [ ] Connect GitHub repository
  - [ ] Set root directory to `backend`
  - [ ] Configure build command: `npm install`
  - [ ] Configure start command: `npm start`

- [ ] **Environment Variables**
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

- [ ] **Deploy and Test**
  - [ ] Wait for successful deployment
  - [ ] Test health endpoint
  - [ ] Check logs for errors

### 2. Frontend Deployment
- [ ] **Update API Configuration**
  - [ ] Update `frontend/src/config/api.ts` with backend URL
  - [ ] Commit changes to GitHub

- [ ] **Create Static Site**
  - [ ] Connect same GitHub repository
  - [ ] Set root directory to `frontend`
  - [ ] Configure build command: `npm install && npm run build`
  - [ ] Set publish directory: `dist`

- [ ] **Deploy and Test**
  - [ ] Wait for successful deployment
  - [ ] Test frontend functionality
  - [ ] Verify API communication

### 3. Database Initialization
- [ ] **Create Admin User**
  ```bash
  curl -X POST https://your-backend.onrender.com/api/admin/create-initial \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@themabinti.com","password":"secure_password"}'
  ```

- [ ] **Verify Database Tables**
  - [ ] Check PostgreSQL tables created
  - [ ] Verify MongoDB collections
  - [ ] Test database connections

## Testing Checklist

### 1. User Registration
- [ ] **Buyer Registration**
  - [ ] Register as buyer
  - [ ] Verify login works
  - [ ] Check user data in database

- [ ] **Seller Registration**
  - [ ] Register as seller
  - [ ] Test M-Pesa STK Push
  - [ ] Verify payment completion
  - [ ] Check seller privileges

### 2. Core Functionality
- [ ] **Service Management**
  - [ ] Create service as seller
  - [ ] View services on homepage
  - [ ] Search functionality
  - [ ] Service detail pages

- [ ] **Appointment Booking**
  - [ ] Book appointment
  - [ ] Verify email/data capture
  - [ ] Check appointment in admin

- [ ] **Admin Dashboard**
  - [ ] Login to admin panel
  - [ ] View all statistics
  - [ ] Manage users and services
  - [ ] Monitor payments

### 3. Payment Flow
- [ ] **M-Pesa Integration**
  - [ ] Test STK Push initiation
  - [ ] Verify callback handling
  - [ ] Check payment status updates
  - [ ] Test timeout scenarios

## Production Readiness

### 1. Security
- [ ] **Environment Variables**
  - [ ] All secrets properly set
  - [ ] No hardcoded credentials
  - [ ] Strong JWT secret

- [ ] **Database Security**
  - [ ] SSL connections enabled
  - [ ] Proper user permissions
  - [ ] Regular backups configured

### 2. Performance
- [ ] **Database Optimization**
  - [ ] Indexes created
  - [ ] Connection pooling enabled
  - [ ] Query optimization

- [ ] **Monitoring**
  - [ ] Error logging configured
  - [ ] Performance monitoring
  - [ ] Uptime monitoring

### 3. M-Pesa Production
- [ ] **Production Credentials**
  - [ ] Apply for production access
  - [ ] Update environment variables
  - [ ] Test with real payments
  - [ ] Verify callback URLs

## Post-Deployment

### 1. Monitoring Setup
- [ ] **Application Monitoring**
  - [ ] Set up error tracking
  - [ ] Monitor response times
  - [ ] Track user activity

- [ ] **Database Monitoring**
  - [ ] Monitor connection counts
  - [ ] Track query performance
  - [ ] Set up alerts

### 2. Backup Strategy
- [ ] **Database Backups**
  - [ ] MongoDB Atlas automatic backups
  - [ ] PostgreSQL backup schedule
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