import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phoneNumber: z.string().min(10, 'Please enter a valid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
  paymentPhone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const SignUpForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'initiated' | 'checking' | 'completed' | 'failed'>('idle');
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [pendingSellerData, setPendingSellerData] = useState<any>(null);
  
  // Get account type and package from URL params
  const searchParams = new URLSearchParams(location.search);
  const accountType = searchParams.get('type') || 'buyer';
  const packageId = searchParams.get('package') || '';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      paymentPhone: '',
    },
  });

  // Poll payment status for sellers
  const pollPaymentStatus = async (checkoutId: string, sellerData: any) => {
    setPaymentStatus('checking');
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const response = await axios.get(`https://themabinti-main-d4az.onrender.com/api/payment-status/${checkoutId}`);
        
        if (response.data.status === 'success') {
          // Complete registration
          const completeResponse = await axios.post('https://themabinti-main-d4az.onrender.com/api/complete-seller-registration', {
            ...sellerData,
            checkoutRequestId: checkoutId,
            packageId
          });

          setPaymentStatus('completed');
          toast.success('Payment successful! Registration completed.');
          navigate('/signin');
          return;
        } else if (response.data.status === 'failed') {
          setPaymentStatus('failed');
          toast.error('Payment failed. Please try again.');
          return;
        }

        // Continue polling if still pending
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000); // Check every 10 seconds
        } else {
          setPaymentStatus('failed');
          toast.error('Payment timeout. Please try again.');
        }
      } catch (error) {
        console.error('Payment status check error:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000);
        } else {
          setPaymentStatus('failed');
          toast.error('Payment verification failed. Please contact support.');
        }
      }
    };

    checkStatus();
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      // Combine firstName and lastName into userName
      const userName = `${values.firstName} ${values.lastName}`;
      
      // Clean phoneNumber: add leading '+' if missing and remove non-digits
      let cleanedPhoneNumber = values.phoneNumber.replace(/[^\d+]/g, '');
      if (!cleanedPhoneNumber.startsWith('+')) {
        cleanedPhoneNumber = `+${cleanedPhoneNumber}`; // Assume international format
      }

      // Validate cleaned phoneNumber
      if (!/^\+?\d{10,15}$/.test(cleanedPhoneNumber)) {
        throw new Error('Invalid phone number format after cleaning');
      }

      // Prepare data for backend
      const userData = {
        userName,
        email: values.email,
        phoneNumber: cleanedPhoneNumber,
        password: values.password,
        accountType,
        ...(accountType === 'seller' && { 
          packageId,
          paymentPhone: values.paymentPhone || cleanedPhoneNumber 
        }),
      };

      console.log('Sending register request:', userData); // Debug log

      // Send POST request to backend
      const response = await axios.post('https://themabinti-main-d4az.onrender.com/api/register', userData);
      console.log('Registration response:', response.data); // Debug log
      if (response.data.paymentInitiated) {
        // For sellers, handle payment flow
        setPaymentStatus('initiated');
        setCheckoutRequestId(response.data.checkoutRequestId);
        // Store all user data needed for completion
        setPendingSellerData({
          userName: response.data.userData.userName,
          email: response.data.userData.email,
          password: response.data.userData.password, // hashed password from backend
          phoneNumber: response.data.userData.phoneNumber,
          packageId: response.data.packageId
        });
        
        toast.success('Payment request sent to your phone. Please complete the payment.');
        
        // Start polling payment status
        pollPaymentStatus(response.data.checkoutRequestId, {
          userName: response.data.userData.userName,
          email: response.data.userData.email,
          password: response.data.userData.password, // hashed password from backend
          phoneNumber: response.data.userData.phoneNumber,
          packageId: response.data.packageId
        });
      } else {
        // For buyers, registration is complete
        toast.success('Account created successfully! Please log in to continue.');
        navigate('/signin');
      }

    } catch (error: any) {
      console.error('Signup error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to create account. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubmitButtonText = () => {
    if (paymentStatus === 'initiated') return 'Payment Sent to Phone...';
    if (paymentStatus === 'checking') return 'Verifying Payment...';
    if (isSubmitting) return 'Creating Account...';
    return 'Create Account';
  };

  const isFormDisabled = isSubmitting || paymentStatus === 'initiated' || paymentStatus === 'checking';

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Card className="border shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create your account</CardTitle>
          <CardDescription className="text-center">
            {accountType === 'seller' 
              ? `Register as a seller with the ${packageId} package` 
              : 'Enter your details to create a buyer account'}
          </CardDescription>
          {paymentStatus === 'initiated' && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-4">
              <p className="text-blue-800 text-sm">
                📱 Check your phone for the M-Pesa payment request and enter your PIN to complete registration.
              </p>
            </div>
          )}
          {paymentStatus === 'checking' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-4">
              <p className="text-yellow-800 text-sm">
                ⏳ Verifying your payment... This may take a few moments.
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} disabled={isFormDisabled} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} disabled={isFormDisabled} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john.doe@example.com" type="email" {...field} disabled={isFormDisabled} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="0712345678" {...field} disabled={isFormDisabled} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {accountType === 'seller' && (
                <FormField
                  control={form.control}
                  name="paymentPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="0712345678 (if different from above)" {...field} disabled={isFormDisabled} />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-gray-500">
                        Leave blank to use the same number as above for M-Pesa payment
                      </p>
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input placeholder="********" type="password" {...field} disabled={isFormDisabled} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input placeholder="********" type="password" {...field} disabled={isFormDisabled} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full bg-purple-500 hover:bg-purple-600" disabled={isFormDisabled}>
                {(paymentStatus === 'checking' || paymentStatus === 'initiated') && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {getSubmitButtonText()}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            By signing up, you agree to our{' '}
            <a href="/terms" className="text-purple-600 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-purple-600 hover:underline">
              Privacy Policy
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignUpForm;