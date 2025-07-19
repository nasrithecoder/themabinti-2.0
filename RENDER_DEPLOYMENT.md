# Deploying Themabinti to Render

This guide explains how to deploy the Themabinti Services Hub to Render with PostgreSQL for payment tracking.

## 🚀 Prerequisites

- GitHub repository with your code
- Render account (free tier available)
- M-Pesa developer account (for production)

## 📋 Step-by-Step Deployment

### 1. Database Setup

#### MongoDB Atlas (Free Tier)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist all IP addresses (0.0.0.0/0) for Render
5. Get your connection string

#### PostgreSQL on Render
1. In your Render dashboard, click "New +"
2. Select "PostgreSQL"
3. Choose a name (e.g., `themabinti-payments`)
4. Select the free tier
5. Click "Create Database"
6. Copy the "External Database URL" for later use

### 2. Backend Deployment

1. **Create Web Service**
   - In Render dashboard, click "New +"
   - Select "Web Service"
   - Connect your GitHub repository
   - Choose the repository containing your code

2. **Configure Build Settings**
   ```
   Name: themabinti-backend
   Environment: Node
   Region: Choose closest to your users
   Branch: main (or your default branch)
   Root Directory: backend
   Build Command: npm install
   Start Command: npm start
   ```

3. **Environment Variables**
   Add these in the "Environment" section:
   ```
   NODE_ENV=production
   PORT=10000
   
   # MongoDB (from Atlas)
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/themabinti
   
   # PostgreSQL (from Render PostgreSQL service)
   DATABASE_URL=postgresql://username:password@hostname:port/database_name
   
   # JWT Secret (generate a strong random string)
   JWT_SECRET=your_super_secure_jwt_secret_here
   
   # M-Pesa Configuration (get from Safaricom Developer Portal)
   MPESA_CONSUMER_KEY=your_mpesa_consumer_key
   MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
   MPESA_PASSKEY=your_mpesa_passkey
   MPESA_SHORTCODE=174379
   MPESA_ENVIRONMENT=sandbox
   
   # Base URL (will be your Render backend URL)
   BASE_URL=https://your-backend-service.onrender.com
   ```

4. **Deploy Backend**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note your backend URL (e.g., `https://themabinti-backend.onrender.com`)

### 3. Frontend Deployment

1. **Update API Configuration**
   Update `frontend/src/config/api.ts`:
   ```typescript
   const api = axios.create({
     baseURL: 'https://your-backend-service.onrender.com',
     headers: {
       'Content-Type': 'application/json',
     },
   });
   ```

2. **Create Frontend Web Service**
   - In Render dashboard, click "New +"
   - Select "Static Site"
   - Connect your GitHub repository
   - Choose the same repository

3. **Configure Build Settings**
   ```
   Name: themabinti-frontend
   Branch: main
   Root Directory: frontend
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

4. **Deploy Frontend**
   - Click "Create Static Site"
   - Wait for deployment to complete

### 4. M-Pesa Configuration

#### For Development/Testing (Sandbox)
1. Go to [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
2. Create an account and login
3. Create a new app
4. Get your Consumer Key and Consumer Secret
5. Use test credentials:
   - Shortcode: `174379`
   - Passkey: `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919`

#### For Production
1. Apply for M-Pesa API access through Safaricom
2. Get production credentials
3. Update environment variables with production values
4. Change `MPESA_ENVIRONMENT` to `production`

### 5. Database Initialization

#### Create Initial Admin User
After deployment, create the first admin user:

```bash
curl -X POST https://your-backend-service.onrender.com/api/admin/create-initial \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@themabinti.com","password":"your_secure_admin_password"}'
```

### 6. Custom Domain (Optional)

1. In your frontend service settings, go to "Settings"
2. Scroll to "Custom Domains"
3. Add your domain (e.g., `themabinti.com`)
4. Configure DNS records as instructed
5. SSL certificate will be automatically provisioned

## 🔧 Environment Variables Reference

### Backend Environment Variables

```env
# Required for Production
NODE_ENV=production
PORT=10000

# Database URLs
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/themabinti
DATABASE_URL=postgresql://username:password@hostname:port/database_name

# Security
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters

# M-Pesa Configuration
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_PASSKEY=your_mpesa_passkey
MPESA_SHORTCODE=174379
MPESA_ENVIRONMENT=sandbox

# Application URLs
BASE_URL=https://your-backend-service.onrender.com
```

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
   - Check PostgreSQL connection string format
   - Ensure database URLs are correctly formatted

2. **M-Pesa Integration Issues**
   - Verify all M-Pesa credentials are correct
   - Check callback URL is accessible
   - Ensure phone numbers are in correct format (254XXXXXXXXX)

3. **CORS Errors**
   - Update CORS configuration in backend if needed
   - Ensure frontend is making requests to correct backend URL

4. **Build Failures**
   - Check build logs in Render dashboard
   - Verify all dependencies are in package.json
   - Ensure Node.js version compatibility

### Monitoring and Logs

1. **Backend Logs**
   - Go to your backend service in Render
   - Click "Logs" tab to view real-time logs
   - Monitor for errors and performance issues

2. **Database Monitoring**
   - PostgreSQL metrics available in Render dashboard
   - MongoDB Atlas provides comprehensive monitoring

## 🔒 Security Considerations

1. **Environment Variables**
   - Never commit sensitive data to Git
   - Use strong, unique passwords
   - Rotate secrets regularly

2. **Database Security**
   - Use connection pooling
   - Enable SSL for database connections
   - Regular backups (automatic on Render)

3. **API Security**
   - Implement rate limiting if needed
   - Monitor for suspicious activity
   - Keep dependencies updated

## 📊 Performance Optimization

1. **Database Optimization**
   - Use indexes for frequently queried fields
   - Implement connection pooling
   - Monitor query performance

2. **Caching**
   - Consider Redis for session storage
   - Implement API response caching
   - Use CDN for static assets

3. **Monitoring**
   - Set up uptime monitoring
   - Monitor response times
   - Track error rates

## 💰 Cost Considerations

### Free Tier Limitations
- **Render Web Services**: 750 hours/month (enough for 1 service)
- **PostgreSQL**: 1GB storage, 1 million rows
- **MongoDB Atlas**: 512MB storage
- **Static Sites**: Unlimited

### Scaling Options
- Upgrade to paid plans for:
  - Multiple services
  - Larger databases
  - Custom domains
  - Better performance

## 🚀 Going Live Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] PostgreSQL database created and connected
- [ ] MongoDB Atlas configured
- [ ] M-Pesa credentials configured
- [ ] Admin user created
- [ ] Custom domain configured (optional)
- [ ] SSL certificates active
- [ ] Payment flow tested
- [ ] Admin dashboard accessible
- [ ] All environment variables set
- [ ] Monitoring set up

## 📞 Support

If you encounter issues:
1. Check Render service logs
2. Verify environment variables
3. Test database connections
4. Review M-Pesa integration logs
5. Contact Render support if needed

## 🔄 Continuous Deployment

Render automatically deploys when you push to your connected Git branch:
1. Push changes to GitHub
2. Render detects changes
3. Automatic build and deployment
4. Zero-downtime deployment

This setup provides a robust, scalable platform ready for production use!