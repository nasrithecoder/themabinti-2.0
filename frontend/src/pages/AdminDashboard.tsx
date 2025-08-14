import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Users, 
  Store, 
  Calendar, 
  DollarSign, 
  Mail, 
  TrendingUp,
  LogOut,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Menu,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { Tooltip } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface DashboardStats {
  totalUsers: number;
  totalSellers: number;
  totalServices: number;
  totalAppointments: number;
  pendingAppointments: number;
  totalContacts: number;
  totalPayments: number;
  successfulPayments: number;
  totalRevenue: number;
}

const sidebarLinks = [
  { label: 'Dashboard', icon: <TrendingUp />, value: 'overview' },
  { label: 'Users', icon: <Users />, value: 'users' },
  { label: 'Services', icon: <Store />, value: 'services' },
  { label: 'Appointments', icon: <Calendar />, value: 'appointments' },
  { label: 'Payments', icon: <DollarSign />, value: 'payments' },
  { label: 'Contacts', icon: <Mail />, value: 'contacts' },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [contacts, setContacts] = useState([]);
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const API_BASE = 'https://themabinti-main-d4az.onrender.com/api/admin';

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
      fetchDashboardData();
    } else {
      setIsLoading(false);
    }
  }, []);

  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [servicesPage, setServicesPage] = useState(1);
  const [servicesTotalPages, setServicesTotalPages] = useState(1);
  const [appointmentsPage, setAppointmentsPage] = useState(1);
  const [appointmentsTotalPages, setAppointmentsTotalPages] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsTotalPages, setPaymentsTotalPages] = useState(1);
  const [contactsPage, setContactsPage] = useState(1);
  const [contactsTotalPages, setContactsTotalPages] = useState(1);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, usersRes, servicesRes, appointmentsRes, paymentsRes, contactsRes] = await Promise.all([
        axios.get(`${API_BASE}/dashboard/stats`, { headers }),
        axios.get(`${API_BASE}/users?page=${usersPage}&limit=10`, { headers }),
        axios.get(`${API_BASE}/services?page=${servicesPage}&limit=10`, { headers }),
        axios.get(`${API_BASE}/appointments?page=${appointmentsPage}&limit=10`, { headers }),
        axios.get(`${API_BASE}/payments?page=${paymentsPage}&limit=10`, { headers }),
        axios.get(`${API_BASE}/contacts?page=${contactsPage}&limit=10`, { headers })
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data.users);
      setUsersTotalPages(usersRes.data.totalPages || 1);
      setServices(servicesRes.data.services);
      setServicesTotalPages(servicesRes.data.totalPages || 1);
      setAppointments(appointmentsRes.data.appointments);
      setAppointmentsTotalPages(appointmentsRes.data.totalPages || 1);
      setPayments(paymentsRes.data.payments);
      setPaymentsTotalPages(paymentsRes.data.totalPages || 1);
      setContacts(contactsRes.data.contacts);
      setContactsTotalPages(contactsRes.data.totalPages || 1);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/login`, { email, password });
      localStorage.setItem('adminToken', response.data.token);
      setIsAuthenticated(true);
      toast.success('Login successful');
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setEmail('');
    setPassword('');
    toast.success('Logged out successfully');
  };

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(
        `${API_BASE}/appointments/${appointmentId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Appointment status updated');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to update appointment status');
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_BASE}/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Service deleted successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to delete service');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This will also delete all their services.')) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_BASE}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User deleted successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  // Responsive sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get admin email from token (if available)
  const adminEmail = (() => {
    const token = localStorage.getItem('adminToken');
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.email || '';
    } catch {
      return '';
    }
  })();

  const [activeTab, setActiveTab] = useState('overview');

  // Refetch data when page changes
  useEffect(() => { fetchDashboardData(); }, [usersPage, servicesPage, appointmentsPage, paymentsPage, contactsPage]);

  // Pagination component
  const Pagination = ({ page, totalPages, setPage }: { page: number, totalPages: number, setPage: (p: number) => void }) => (
    <div className="flex items-center justify-center gap-2 mt-4">
      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
      {Array.from({ length: totalPages }, (_, i) => (
        <Button key={i} variant={page === i + 1 ? 'default' : 'outline'} size="sm" onClick={() => setPage(i + 1)}>{i + 1}</Button>
      ))}
      <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Enter your credentials to access the admin dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed md:static z-40 top-0 left-0 h-full bg-white shadow-lg flex flex-col transition-all duration-200 ${sidebarOpen ? 'w-56' : 'w-16'} md:w-56`}>
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <span className="text-2xl font-bold text-purple-500">{sidebarOpen || window.innerWidth >= 768 ? 'Admin' : 'A'}</span>
          <button className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        <nav className="flex-1 flex flex-col gap-2 mt-4">
          {sidebarLinks.map(link => (
            <button
              key={link.value}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors w-full text-left ${activeTab === link.value ? 'bg-purple-100 text-purple-700 font-semibold' : 'hover:bg-gray-100 text-gray-700'}`}
              onClick={() => { setActiveTab(link.value); setSidebarOpen(false); }}
            >
              <span className="h-5 w-5">{link.icon}</span>
              <span className={`${sidebarOpen || window.innerWidth >= 768 ? 'block' : 'hidden'} transition-all`}>{link.label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto px-4 py-4 border-t">
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:text-red-700 w-full">
            <LogOut className="h-5 w-5" />
            <span className={`${sidebarOpen || window.innerWidth >= 768 ? 'block' : 'hidden'}`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen ml-0 md:ml-56">
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 bg-white shadow flex items-center justify-between px-6 py-4 border-b">
          <h1 className="text-xl font-bold text-gray-900">{sidebarLinks.find(l => l.value === activeTab)?.label || 'Dashboard'}</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{adminEmail}</span>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="flex-1 p-6">
          {/* Tabs logic replaced with sidebar navigation */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                    <p className="text-xs text-gray-500">{stats?.totalSellers || 0} sellers</p>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Services</CardTitle>
                    <Store className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalServices || 0}</div>
                    <p className="text-xs text-gray-500">Active listings</p>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalAppointments || 0}</div>
                    <p className="text-xs text-gray-500">{stats?.pendingAppointments || 0} pending</p>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Ksh {stats?.totalRevenue?.toLocaleString() || 0}</div>
                    <p className="text-xs text-gray-500">{stats?.successfulPayments || 0} successful payments</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Recent Activity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>Recent Users</CardTitle>
                    <CardDescription>Latest user registrations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {users.slice(0, 5).map((user: any) => (
                        <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{user.userName}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                          <Badge 
                            variant={user.accountType === 'seller' ? 'default' : 'secondary'}
                            className={user.accountType === 'seller' ? 'bg-purple-100 text-purple-800' : ''}
                          >
                            {user.accountType}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>Recent Payments</CardTitle>
                    <CardDescription>Latest payment transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {payments.slice(0, 5).map((payment: any) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">Ksh {parseFloat(payment.amount).toLocaleString()}</p>
                            <p className="text-sm text-gray-500">{payment.phone_number}</p>
                          </div>
                          <Badge 
                            variant={payment.status === 'success' ? 'default' : payment.status === 'pending' ? 'secondary' : 'destructive'}
                            className={
                              payment.status === 'success' ? 'bg-green-100 text-green-800' :
                              payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {payment.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          {activeTab === 'users' && (
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Users Management</CardTitle>
                <CardDescription>Manage all platform users</CardDescription>
                <div className="flex gap-2">
                  <Input placeholder="Search users..." className="w-48" />
                  {/* Pagination controls can go here */}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Avatar</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Package</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user: any) => (
                        <TableRow key={user._id} className="hover:bg-gray-50">
                          <TableCell>
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{user.userName?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell>{user.userName}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.accountType === 'seller' ? 'default' : 'secondary'}>
                              {user.accountType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.sellerPackage?.packageId || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Tooltip content="Delete User">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this user? This will also delete all their services.')) deleteUser(user._id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Pagination page={usersPage} totalPages={usersTotalPages} setPage={setUsersPage} />
              </CardContent>
            </Card>
          )}
          {activeTab === 'services' && (
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Services Management</CardTitle>
                <CardDescription>Monitor all services on the platform</CardDescription>
                <div className="flex gap-2">
                  <Input placeholder="Search services..." className="w-48" />
                  {/* Pagination controls can go here */}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service Name</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price Range</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((service: any) => (
                        <TableRow key={service._id} className="hover:bg-gray-50">
                          <TableCell>{service.name}</TableCell>
                          <TableCell>{service.userId?.userName || 'Unknown'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{service.category}</Badge>
                          </TableCell>
                          <TableCell>
                            Ksh {service.minPrice?.toLocaleString()} - {service.maxPrice?.toLocaleString()}
                          </TableCell>
                          <TableCell>{service.location}</TableCell>
                          <TableCell>
                            <Tooltip content="Delete Service">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this service?')) deleteService(service._id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Pagination page={servicesPage} totalPages={servicesTotalPages} setPage={setServicesPage} />
              </CardContent>
            </Card>
          )}
          {activeTab === 'appointments' && (
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Appointments Management</CardTitle>
                <CardDescription>Track and manage all appointments</CardDescription>
                <div className="flex gap-2">
                  <Input placeholder="Search appointments..." className="w-48" />
                  {/* Pagination controls can go here */}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.map((appointment: any) => (
                        <TableRow key={appointment._id} className="hover:bg-gray-50">
                          <TableCell>{appointment.name}</TableCell>
                          <TableCell>{appointment.email}</TableCell>
                          <TableCell>
                            {new Date(appointment.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{appointment.time}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                appointment.status === 'confirmed' ? 'default' :
                                appointment.status === 'pending' ? 'secondary' : 'destructive'
                              }
                            >
                              {appointment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="flex gap-2">
                            <Tooltip content="Confirm Appointment">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateAppointmentStatus(appointment._id, 'confirmed')}
                                disabled={appointment.status === 'confirmed'}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            </Tooltip>
                            <Tooltip content="Mark as Pending">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateAppointmentStatus(appointment._id, 'pending')}
                                disabled={appointment.status === 'pending'}
                              >
                                <Clock className="h-4 w-4 text-yellow-600" />
                              </Button>
                            </Tooltip>
                            <Tooltip content="Cancel Appointment">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                                disabled={appointment.status === 'cancelled'}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Pagination page={appointmentsPage} totalPages={appointmentsTotalPages} setPage={setAppointmentsPage} />
              </CardContent>
            </Card>
          )}
          {activeTab === 'payments' && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Payments Management</CardTitle>
                <CardDescription>View and manage all payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Package</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Receipt</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment: any) => (
                        <TableRow key={payment.id} className="hover:bg-gray-50">
                          <TableCell>{payment.package_id}</TableCell>
                          <TableCell className="font-semibold">Ksh {parseFloat(payment.amount).toLocaleString()}</TableCell>
                          <TableCell>{payment.phone_number}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                payment.status === 'success' ? 'default' :
                                payment.status === 'pending' ? 'secondary' : 'destructive'
                              }
                              className={`px-2 py-1 rounded-full text-xs ${payment.status === 'success' ? 'bg-green-100 text-green-700' : payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}
                            >
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{payment.mpesa_receipt_number || 'N/A'}</TableCell>
                          <TableCell>
                            {new Date(payment.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Pagination page={paymentsPage} totalPages={paymentsTotalPages} setPage={setPaymentsPage} />
              </CardContent>
            </Card>
          )}
          {activeTab === 'contacts' && (
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Contact Messages</CardTitle>
                <CardDescription>Customer inquiries and feedback</CardDescription>
                <div className="flex gap-2">
                  <Input placeholder="Search contacts..." className="w-48" />
                  {/* Pagination controls can go here */}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((contact: any) => (
                        <TableRow key={contact._id} className="hover:bg-gray-50">
                          <TableCell>{contact.name}</TableCell>
                          <TableCell>{contact.email}</TableCell>
                          <TableCell>{contact.phone}</TableCell>
                          <TableCell>{contact.subject}</TableCell>
                          <TableCell>
                            {new Date(contact.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Tooltip content="View Message">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Pagination page={contactsPage} totalPages={contactsTotalPages} setPage={setContactsPage} />
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;