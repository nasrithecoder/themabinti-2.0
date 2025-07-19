import { useState, useEffect } from 'react';
import { Search, User, ChevronDown, Menu, X, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import LocationSelector from './LocationSelector';
import BookAppointmentButton from './BookAppointmentButton';
import { serviceCategories } from '@/data/serviceCategories';

const NavbarTop = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setIsSeller(false);
    setFirstName('');
  };

  // Check localStorage for token and user data on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        const userData = JSON.parse(user);
        setIsLoggedIn(true);
        setIsSeller(userData.accountType === 'seller');
        // Extract first name from userName (e.g., "John Doe" -> "John")
        setFirstName(userData.userName.split(' ')[0] || '');
      } catch (error) {
        console.error('Error parsing user data:', error);
        handleLogout(); // Clear invalid data
      }
    }
  }, []);

  // Handle scroll event to add shadow to navbar when scrolled
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // For demo purposes, toggle login state
  //const toggleLogin = () => {
  //  setIsLoggedIn(!isLoggedIn);
  //};

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery(''); // Clear search input
      setIsDrawerOpen(false); // Close drawer on mobile
    }
  };

  return (
    <div className={`sticky top-0 z-50 bg-white ${isScrolled ? 'shadow-md' : ''}`}>
      <div className="container mx-auto py-4">
        <div className="flex items-center justify-between">
          {/* Mobile Menu Button */}
          {isMobile && (
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DrawerTrigger>
              <DrawerContent className="h-[90vh]">
                <div className="px-4 py-6 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Menu</h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsDrawerOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  {/* Mobile Account/Sign in/Sign up */}
                  <div className="mb-6 flex flex-col space-y-2">
                    {isLoggedIn ? (
                      <>
                        <Link to="/account" className="text-purple-600 font-semibold" onClick={() => setIsDrawerOpen(false)}>My Account</Link>
                        {isSeller && (
                          <Link to="/post-service" className="text-purple-600" onClick={() => setIsDrawerOpen(false)}>Post a Service</Link>
                        )}
                        <Link to="/admin" className="text-purple-600" onClick={() => setIsDrawerOpen(false)}>Admin Dashboard</Link>
                        <button onClick={() => { handleLogout(); setIsDrawerOpen(false); }} className="text-red-500 text-left">Logout</button>
                      </>
                    ) : (
                      <>
                        <Link to="/signin" className="text-purple-600 font-semibold" onClick={() => setIsDrawerOpen(false)}>Sign in</Link>
                        <Link to="/signup-options" className="text-white bg-purple-500 rounded px-3 py-1 text-center" onClick={() => setIsDrawerOpen(false)}>Sign up</Link>
                        <Link to="/admin" className="text-purple-600" onClick={() => setIsDrawerOpen(false)}>Admin Dashboard</Link>
                      </>
                    )}
                  </div>
                  
                  {/* Mobile Search */}
                  <form onSubmit={handleSearch} className="mb-6">
                    <div className="relative">
                      <Input 
                        type="text" 
                        placeholder="Find services..." 
                        className="w-full pl-10 pr-4 py-2"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </form>
                  
                  {/* Mobile Location Selector */}
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-2">Select Location</p>
                    <LocationSelector />
                  </div>
                  
                  {/* Mobile Navigation Links */}
                  <nav className="flex flex-col space-y-4 mb-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center justify-between w-full text-gray-800 font-medium hover:text-purple-500">
                        Find Services
                        <ChevronRight className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="start" sideOffset={5}>
                        {serviceCategories.map((category) => (
                          <DropdownMenuSub key={category.id}>
                            <DropdownMenuSubTrigger className="text-gray-800">
                              {category.title}
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent className="w-56">
                                {category.links.map((link) => (
                                  <DropdownMenuItem key={link.path} asChild>
                                    <Link
                                      to={link.path}
                                      className="cursor-pointer"
                                      onClick={() => setIsDrawerOpen(false)}
                                    >
                                      {link.title}
                                    </Link>
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Link 
                      to="/blogs" 
                      className="text-gray-800 font-medium hover:text-purple-500"
                      onClick={() => setIsDrawerOpen(false)}
                    >
                      Blogs
                    </Link>
                    <Link 
                      to="/about" 
                      className="text-gray-800 font-medium hover:text-purple-500"
                      onClick={() => setIsDrawerOpen(false)}
                    >
                      About Us
                    </Link>
                    <Link 
                      to="/contact" 
                      className="text-gray-800 font-medium hover:text-purple-500"
                      onClick={() => setIsDrawerOpen(false)}
                    >
                      Contact Us
                    </Link>
                  </nav>
                  
                  {/* Mobile Book Appointment Button */}
                  <div className="mt-auto pb-6">
                    <BookAppointmentButton className="w-full" />
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          )}

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-purple-500">themabinti</span>
          </Link>

          {/* Location Selector - Hidden on Mobile */}
          <div className="hidden md:block ml-4">
            <LocationSelector />
          </div>

          {/* Search Bar - Hidden on Mobile */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4">
            <form onSubmit={handleSearch} className="relative w-full">
              <Input 
                type="text" 
                placeholder="Find services..." 
                className="w-full pl-10 pr-4 py-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
            </form>
          </div>

          {/* Account/Sign in/Sign up Buttons */}
          <div className="flex items-center space-x-2">
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center px-2 py-1 rounded-full hover:bg-gray-100">
                    <User className="h-5 w-5" />
                    {firstName && (
                      <span className="mx-1 text-sm font-medium">{firstName}</span>
                    )}
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem>
                    <Link to="/account" className="w-full">My Account</Link>
                  </DropdownMenuItem>
                  {isSeller && (
                    <DropdownMenuItem>
                      <Link to="/post-service" className="w-full">Post a Service</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>
                    <Link to="/admin" className="w-full">Admin Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/signin">
                  <Button variant="outline" size="sm" className="mr-2">Sign in</Button>
                </Link>
                <Link to="/signup-options">
                  <Button className="bg-purple-500 text-white hover:bg-purple-600" size="sm">
                    Sign up
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center px-2 py-1 rounded-full hover:bg-gray-100 ml-2">
                      <User className="h-5 w-5" />
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem>
                      <Link to="/admin" className="w-full">Admin Dashboard</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavbarTop;
