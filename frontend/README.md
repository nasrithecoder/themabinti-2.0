# Welcome to your Lovable project

# Themabinti Frontend

React-based frontend for the Themabinti Services Hub platform.

**Themabinti is inclusive: both men and women can provide or book services on the platform.**

## Project info

**URL**: https://lovable.dev/projects/ae5c546a-b40e-4008-9f44-7f9d0d420780

## ✨ Features

- **Service Discovery**: Browse/search by category, location, subcategory
- **User Authentication**: Login/register (buyer/seller)
- **Seller Package Upgrades**: Upgrade seller tier anytime (M-Pesa STK Push)
- **M-Pesa Integration**: Seamless payment for registration and upgrades
- **Admin Dashboard**: Full management interface
- **Appointment Booking**: Book with providers directly
- **Mobile-First Design**: Fully responsive, modern UI

## 🛠️ Technology Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- React Hook Form + Zod
- Axios
- Sonner (notifications)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Backend API running (see backend/README.md)

### Setup
```bash
# Clone the repo
cd frontend
npm install

# Start development server
npm run dev
```

### Environment Variables
- The frontend connects to the backend API.
- Update the API base URL in `src/config/api.ts` if needed.

## 🗂️ Key Components

- `SignInForm.tsx` / `SignUpForm.tsx` - Auth flows (with M-Pesa for sellers)
- `SellerAccountPage.tsx` - Seller dashboard, package upgrades
- `SellerPackages.tsx` - Package selection
- `ServiceCard.tsx` / `ServiceCategorySection.tsx` - Service display
- `PostServiceForm.tsx` - Create/edit services
- `AdminDashboard.tsx` - Admin management
- `BookAppointmentDialog.tsx` - Booking interface

## 🧭 Routing

- `/` - Homepage
- `/signin` - User login
- `/signup-options` - Account type selection
- `/signup` - User registration
- `/seller-packages` - Package selection
- `/account` - Seller account & upgrades
- `/post-service` - Create service (sellers)
- `/service/:id` - Service details
- `/admin` - Admin dashboard
- `/search` - Search results
- `/services/:category/:subcategory` - Category services

## 💳 Seller Upgrade Flow

- Sellers can upgrade from Basic → Standard → Premium anytime from `/account`
- Initiates M-Pesa STK Push for upgrade
- UI polls for payment and updates package on success

## 🛡️ Best Practices

- Fully responsive (mobile, tablet, desktop)
- Accessible, modern UI
- TypeScript for type safety
- Organized by feature/component

## 🏗️ Build & Deploy
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```
- Deploy the `dist` folder to your static hosting provider
- Ensure backend API is accessible from your domain

## 🤝 Contributing
1. Follow code structure and naming conventions
2. Use TypeScript
3. Test on multiple screen sizes
4. Ensure accessibility
5. Open a Pull Request

## 📄 License
MIT License

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/ae5c546a-b40e-4008-9f44-7f9d0d420780) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Environment Variables

The frontend connects to the backend API. Ensure the backend is running on the correct port and update the API base URL in `src/config/api.ts` if needed.

## Key Components

### Authentication
- `SignInForm.tsx` - User login
- `SignUpForm.tsx` - User registration with M-Pesa integration
- `AccountTypeSelection.tsx` - Choose between buyer/seller
- `SellerPackages.tsx` - Package selection for sellers

### Services
- `ServiceCard.tsx` - Individual service display
- `ServiceCategorySection.tsx` - Category-based service grouping
- `PostServiceForm.tsx` - Create new services (sellers only)

### Admin
- `AdminDashboard.tsx` - Complete admin management interface

### Booking
- `BookAppointmentDialog.tsx` - Appointment booking interface

## API Integration

The frontend communicates with the backend through:
- `src/config/api.ts` - Axios configuration
- RESTful API calls for all operations
- Real-time payment status checking for M-Pesa

## Routing

- `/` - Homepage with service categories
- `/signin` - User login
- `/signup-options` - Account type selection
- `/signup` - User registration
- `/seller-packages` - Package selection
- `/post-service` - Create service (sellers)
- `/service/:id` - Service details
- `/admin` - Admin dashboard
- `/search` - Search results
- `/services/:category/:subcategory` - Category services

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/ae5c546a-b40e-4008-9f44-7f9d0d420780) and click on Share -> Publish.

For production deployment:
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting provider
3. Ensure the backend API is accessible from your domain

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Contributing

1. Follow the existing code structure and naming conventions
2. Use TypeScript for type safety
3. Follow the component organization pattern
4. Test on multiple screen sizes
5. Ensure accessibility standards are met
