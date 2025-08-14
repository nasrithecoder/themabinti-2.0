import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

export interface ServiceProps {
  id: string;
  name: string;
  minPrice: number;
  maxPrice: number;
  location: string;
  image: string;
  images?: string[]; // Add optional images array
  whatsapp?: string;
  category: string;
  subcategory: string;
  description?: string; // Added for compatibility
}

interface ServiceCardProps {
  service: ServiceProps;
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  const { 
    id, 
    name, 
    minPrice, 
    maxPrice, 
    location, 
    image,
    whatsapp
  } = service;

  const handleBookClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!whatsapp) {
      alert('Phone number not available for this service.');
      return;
    }

    // Format phone number: remove any spaces, dashes, or other non-digit characters
    const formattedNumber = whatsapp.replace(/\D/g, '');
    
    // Create a default message
    const message = encodeURIComponent(
      `Hello! I'm interested in your service "${name}" (${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()} Ksh). ` +
      `Could you please provide more information?`
    );

    // Open WhatsApp with the formatted number and message
    window.open(`https://wa.me/${formattedNumber}?text=${message}`, '_blank');
  };

  return (
    <Link to={`/service/${id}`}>
      <Card className="service-card overflow-hidden h-full flex flex-col hover:shadow-xl transition-all duration-300 border-0 shadow-md">
        <div className="relative h-48 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10"></div>
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500"
            onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300'; }}
          />
          <div className="absolute top-3 right-3 z-20">
            <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-purple-700">
              {category}
            </div>
          </div>
        </div>
        <CardContent className="flex-grow p-5">
          <h3 className="font-bold text-lg mb-3 line-clamp-2 text-gray-900 leading-tight">{name}</h3>
          <div className="mb-3">
            <span className="text-lg font-bold text-purple-700">
              Ksh {minPrice ? minPrice.toLocaleString() : 0} - {maxPrice ? maxPrice.toLocaleString() : 0}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {location}
          </div>
        </CardContent>
        <CardFooter className="p-5 pt-0">
          <Button 
            onClick={handleBookClick} 
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
            disabled={!whatsapp}
          >
            {whatsapp ? (
              <>
                Contact Provider
                <ExternalLink className="ml-2 h-4 w-4" />
              </>
            ) : (
              'Contact Unavailable'
            )}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ServiceCard;
