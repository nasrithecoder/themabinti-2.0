import { useEffect, useState } from 'react';
import NavbarTop from '@/components/NavbarTop';
import NavbarBottom from '@/components/NavbarBottom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const packages = [
  {
    id: 'basic',
    name: 'Basic',
    price: 1000,
    features: [
      '1 Photo Upload',
      'Book Appointment Feature',
      'Basic Visibility',
      'Mabinti Community Access'
    ],
    photoUploads: 1,
    videoUploads: 0
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 1500,
    features: [
      '2 Photo Uploads',
      'Book Appointment Feature',
      'Enhanced Visibility',
      'Mabinti Community Access'
    ],
    photoUploads: 2,
    videoUploads: 0
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 2500,
    features: [
      '3 Photo Uploads',
      'Book Appointment Feature',
      'Premium Visibility',
      'Featured Listing',
      'Mabinti Community Access'
    ],
    photoUploads: 3,
    videoUploads: 1
  }
];

const SellerAccountPage = () => {
  const [user, setUser] = useState<any>(null);
  const [upgradeStatus, setUpgradeStatus] = useState<'idle'|'initiated'|'checking'|'completed'|'failed'>('idle');
  const [checkoutRequestId, setCheckoutRequestId] = useState<string|null>(null);
  const [pendingUpgrade, setPendingUpgrade] = useState<string|null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const currentPackage = user?.sellerPackage?.packageId || 'basic';
  const currentIdx = packages.findIndex(pkg => pkg.id === currentPackage);
  const availableUpgrades = packages.slice(currentIdx + 1);

  const handleUpgrade = async (newPackageId: string) => {
    setUpgradeStatus('initiated');
    setPendingUpgrade(newPackageId);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'https://themabinti-main-d4az.onrender.com/api/upgrade-seller-package',
        { newPackageId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCheckoutRequestId(response.data.checkoutRequestId);
      toast.success('Payment request sent to your phone. Please complete the payment.');
      setUpgradeStatus('checking');
      pollUpgradeStatus(response.data.checkoutRequestId, newPackageId);
    } catch (error: any) {
      setUpgradeStatus('failed');
      toast.error(error.response?.data?.message || 'Failed to initiate upgrade.');
    }
  };

  const pollUpgradeStatus = async (checkoutId: string, newPackageId: string) => {
    let attempts = 0;
    const maxAttempts = 30;
    const checkStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const paymentRes = await axios.get(`https://themabinti-main-d4az.onrender.com/api/payment-status/${checkoutId}`);
        if (paymentRes.data.status === 'success') {
          // Complete upgrade
          await axios.post(
            'https://themabinti-main-d4az.onrender.com/api/complete-seller-upgrade',
            { newPackageId, checkoutRequestId: checkoutId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          toast.success('Upgrade successful!');
          // Update user in localStorage
          const updatedUser = { ...user, sellerPackage: packages.find(pkg => pkg.id === newPackageId) };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUpgradeStatus('completed');
          setCheckoutRequestId(null);
          setPendingUpgrade(null);
          return;
        } else if (paymentRes.data.status === 'failed') {
          setUpgradeStatus('failed');
          toast.error('Payment failed. Please try again.');
          return;
        }
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000);
        } else {
          setUpgradeStatus('failed');
          toast.error('Payment timeout. Please try again.');
        }
      } catch (error) {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000);
        } else {
          setUpgradeStatus('failed');
          toast.error('Payment verification failed. Please contact support.');
        }
      }
    };
    checkStatus();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavbarTop />
      <div className="flex-grow py-8 bg-gray-50">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">My Seller Account</h1>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Current Package: <span className="text-purple-600">{packages.find(pkg => pkg.id === currentPackage)?.name}</span></CardTitle>
              <CardDescription>
                <span className="text-gray-600">Features:</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-1">
                {packages.find(pkg => pkg.id === currentPackage)?.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {availableUpgrades.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-center">Upgrade Your Package</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableUpgrades.map(pkg => (
                  <Card key={pkg.id} className="flex flex-col justify-between">
                    <CardHeader>
                      <CardTitle>{pkg.name}</CardTitle>
                      <CardDescription>
                        <span className="text-2xl font-bold">Ksh {pkg.price}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-1">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx}>{feature}</li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                        disabled={upgradeStatus === 'initiated' || upgradeStatus === 'checking' || pendingUpgrade === pkg.id}
                        onClick={() => handleUpgrade(pkg.id)}
                      >
                        {upgradeStatus === 'checking' && pendingUpgrade === pkg.id
                          ? 'Processing Payment...'
                          : 'Upgrade to ' + pkg.name}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              {upgradeStatus === 'initiated' && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-6 text-center">
                  <p className="text-blue-800 text-sm">
                    📱 Check your phone for the M-Pesa payment request and enter your PIN to complete the upgrade.
                  </p>
                </div>
              )}
              {upgradeStatus === 'checking' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-6 text-center">
                  <p className="text-yellow-800 text-sm">
                    ⏳ Verifying your payment... This may take a few moments.
                  </p>
                </div>
              )}
              {upgradeStatus === 'completed' && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-6 text-center">
                  <p className="text-green-800 text-sm">
                    🎉 Upgrade successful! Enjoy your new package features.
                  </p>
                </div>
              )}
              {upgradeStatus === 'failed' && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-6 text-center">
                  <p className="text-red-800 text-sm">
                    ❌ Upgrade failed. Please try again or contact support.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <NavbarBottom />
    </div>
  );
};

export default SellerAccountPage; 