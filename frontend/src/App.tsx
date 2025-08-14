import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { Suspense } from 'react';

const Index = React.lazy(() => import("./pages/Index"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const SignInPage = React.lazy(() => import("./pages/SignInPage"));
const SignUpOptionsPage = React.lazy(() => import("./pages/SignUpOptionsPage"));
const SignUpPage = React.lazy(() => import("./pages/SignUpPage"));
const SellerPackagesPage = React.lazy(() => import("./pages/SellerPackagesPage"));
const PostServicePage = React.lazy(() => import("./pages/PostServicePage"));
const ServiceDetail = React.lazy(() => import("./pages/ServiceDetail"));
const BlogsPage = React.lazy(() => import("./pages/BlogsPage"));
const AboutUsPage = React.lazy(() => import("./pages/AboutUsPage"));
const ContactUsPage = React.lazy(() => import("./pages/ContactUsPage"));
const AllServicesPage = React.lazy(() => import("./pages/AllServicesPage"));
const SearchResults = React.lazy(() => import("./pages/SearchResults"));
const LocationServices = React.lazy(() => import("./pages/LocationServices"));
const SubcategoryServices = React.lazy(() => import("./pages/SubcategoryServices"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const SellerAccountPage = React.lazy(() => import('./pages/SellerAccountPage'));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup-options" element={<SignUpOptionsPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/seller-packages" element={<SellerPackagesPage />} />
            <Route path="/post-service" element={<PostServicePage />} />
            <Route path="/service/:id" element={<ServiceDetail />} />
            <Route path="/blogs" element={<BlogsPage />} />
            <Route path="/about" element={<AboutUsPage />} />
            <Route path="/contact" element={<ContactUsPage />} />
            <Route path="/all-services" element={<AllServicesPage />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/services/location/:location" element={<LocationServices />} />
            <Route path="/services/:category/:subcategory" element={<SubcategoryServices />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/account" element={<SellerAccountPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
