
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

const locations = [
  { id: 'all', name: 'All Locations' },
  { id: 'mombasa', name: 'Mombasa' },
  { id: 'kwale', name: 'Kwale' },
  { id: 'kilifi', name: 'Kilifi' },
  { id: 'tanariver', name: 'Tana River' },
  { id: 'lamu', name: 'Lamu' },
  { id: 'taitataveta', name: 'Taita‑Taveta' },
  { id: 'garissa', name: 'Garissa' },
  { id: 'wajir', name: 'Wajir' },
  { id: 'mandera', name: 'Mandera' },
  { id: 'marsabit', name: 'Marsabit' },
  { id: 'isiolo', name: 'Isiolo' },
  { id: 'meru', name: 'Meru' },
  { id: 'tharakanithi', name: 'Tharaka‑Nithi' },
  { id: 'embu', name: 'Embu' },
  { id: 'kitui', name: 'Kitui' },
  { id: 'machakos', name: 'Machakos' },
  { id: 'makueni', name: 'Makueni' },
  { id: 'nyandarua', name: 'Nyandarua' },
  { id: 'nyeri', name: 'Nyeri' },
  { id: 'kirinyaga', name: 'Kirinyaga' },
  { id: 'muranga', name: 'Murang’a' },
  { id: 'kiambu', name: 'Kiambu' },
  { id: 'turkana', name: 'Turkana' },
  { id: 'westpokot', name: 'West Pokot' },
  { id: 'samburu', name: 'Samburu' },
  { id: 'transnzoia', name: 'Trans‑Nzoia' },
  { id: 'uasin gishu'.replace(' ', ''), name: 'Uasin Gishu' }, // adjust as needed
  { id: 'elgeyo‑marakwet'.replace('‑', ''), name: 'Elgeyo‑Marakwet' },
  { id: 'nandi', name: 'Nandi' },
  { id: 'baringo', name: 'Baringo' },
  { id: 'laikipia', name: 'Laikipia' },
  { id: 'nakuru', name: 'Nakuru' },
  { id: 'narok', name: 'Narok' },
  { id: 'kajiado', name: 'Kajiado' },
  { id: 'kericho', name: 'Kericho' },
  { id: 'bomet', name: 'Bomet' },
  { id: 'kakamega', name: 'Kakamega' },
  { id: 'vihiga', name: 'Vihiga' },
  { id: 'bungoma', name: 'Bungoma' },
  { id: 'busia', name: 'Busia' },
  { id: 'siaya', name: 'Siaya' },
  { id: 'kisumu', name: 'Kisumu' },
  { id: 'homabay', name: 'Homa Bay' },
  { id: 'migori', name: 'Migori' },
  { id: 'kisii', name: 'Kisii' },
  { id: 'nyamira', name: 'Nyamira' },
  { id: 'nairobi', name: 'Nairobi' }
];


const LocationSelector = () => {
  const [selectedLocation, setSelectedLocation] = useState('all');
  const navigate = useNavigate();

  const handleLocationChange = (value: string) => {
    setSelectedLocation(value);
    const location = locations.find(loc => loc.id === value);
    console.log('Selected location:', location?.name, 'ID:', value);
    if (value === 'all') {
      navigate('/all-services');
    } else if (location) {
      navigate(`/services/location/${encodeURIComponent(location.name)}`);
    }
  };

  return (
    <div className="w-full max-w-[180px]">
      <Select value={selectedLocation} onValueChange={handleLocationChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select location" />
        </SelectTrigger>
        <SelectContent>
          {locations.map((location) => (
            <SelectItem key={location.id} value={location.id}>
              {location.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LocationSelector;
