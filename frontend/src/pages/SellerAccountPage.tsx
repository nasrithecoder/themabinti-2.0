import { useEffect, useState } from 'react';
import NavbarTop from '@/components/NavbarTop';
import NavbarBottom from '@/components/NavbarBottom';
import SellerDashboard from '@/components/seller/SellerDashboard';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const SellerAccountPage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!token) {
      toast.error('Please sign in to access your account');
      navigate('/signin');
      return;
    }
    
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        
        if (userData.accountType !== 'seller') {
          toast.error('Seller access required');
          navigate('/');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        toast.error('Invalid user data');
        navigate('/signin');
      }
    } else {
      toast.error('User data not found');
      navigate('/signin');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <NavbarTop />
      <NavbarBottom />
      
      <div className="flex-grow bg-gray-50">
        {user && user.accountType === 'seller' ? (
          <SellerDashboard />
        ) : (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Loading...</h2>
              <p className="text-gray-600">Please wait while we load your dashboard</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerAccountPage;