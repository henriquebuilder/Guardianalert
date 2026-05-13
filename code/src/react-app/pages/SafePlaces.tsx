import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Shield, ChevronLeft, MapPin, Phone, Clock, Filter, Navigation, List, Map as MapIcon } from 'lucide-react';
import { Button } from '@/react-app/components/ui/button';
import { Card } from '@/react-app/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/react-app/components/ui/dropdown-menu';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface SafePlace {
  id: number;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  address: string;
  phone: string | null;
  hours: string | null;
  description: string | null;
}

const placeTypes = {
  deam: { label: 'Delegacia da Mulher', color: '#1e40af', icon: '👮‍♀️' },
  shelter: { label: 'Abrigo', color: '#c026d3', icon: '🏠' },
  pharmacy: { label: 'Farmácia 24h', color: '#16a34a', icon: '💊' },
  hospital: { label: 'Hospital', color: '#dc2626', icon: '🏥' },
  police: { label: 'Posto Policial', color: '#0891b2', icon: '🚔' },
  ngo: { label: 'ONG', color: '#ea580c', icon: '🤝' },
};

function createCustomIcon(type: string) {
  const config = placeTypes[type as keyof typeof placeTypes];
  const iconHtml = `
    <div style="
      width: 36px;
      height: 36px;
      background: ${config.color};
      border: 3px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">
      ${config.icon}
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

// Component to center map on user's location
function LocationMarker() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const map = useMap();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setPosition(newPos);
        map.setView(newPos, 13);
      },
      () => {
        // Default to São Paulo center if geolocation fails
        const defaultPos: [number, number] = [-23.5505, -46.6333];
        map.setView(defaultPos, 12);
      }
    );
  }, [map]);

  if (!position) return null;

  const userIcon = L.divIcon({
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      "></div>
    `,
    className: 'user-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return (
    <Marker position={position} icon={userIcon}>
      <Popup>Você está aqui</Popup>
    </Marker>
  );
}

export default function SafePlaces() {
  const navigate = useNavigate();
  const [places, setPlaces] = useState<SafePlace[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<SafePlace[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    fetchPlaces();
    // Get user location for distance calculation
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    );
  }, []);

  useEffect(() => {
    if (selectedType) {
      setFilteredPlaces(places.filter((p) => p.type === selectedType));
    } else {
      setFilteredPlaces(places);
    }
  }, [selectedType, places]);

  const fetchPlaces = async () => {
    try {
      const response = await fetch('/api/safe-places');
      const data = await response.json();
      setPlaces(data);
      setFilteredPlaces(data);
    } catch (error) {
      console.error('Error fetching safe places:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDirections = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  // Calculate distance between two points in km
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Sort places by distance from user
  const sortedPlaces = userLocation
    ? [...filteredPlaces].sort((a, b) => {
        const distA = calculateDistance(userLocation[0], userLocation[1], a.latitude, a.longitude);
        const distB = calculateDistance(userLocation[0], userLocation[1], b.latitude, b.longitude);
        return distA - distB;
      })
    : filteredPlaces;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-purple-700 font-medium">Carregando locais seguros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-[1000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/app')}
                className="p-1 sm:p-2"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-purple-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  Locais Seguros
                </h1>
                <p className="text-xs sm:text-sm text-purple-600">
                  {filteredPlaces.length} {filteredPlaces.length === 1 ? 'local disponível' : 'locais disponíveis'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="w-4 h-4" />
                    <span className="hidden sm:inline">Filtrar</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setSelectedType(null)}>
                    <span className="font-medium">Todos os locais</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {Object.entries(placeTypes).map(([key, config]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => setSelectedType(key)}
                      className={selectedType === key ? 'bg-purple-50' : ''}
                    >
                      <span className="mr-2">{config.icon}</span>
                      {config.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
                className="gap-2"
              >
                {viewMode === 'map' ? (
                  <>
                    <List className="w-4 h-4" />
                    <span className="hidden sm:inline">Lista</span>
                  </>
                ) : (
                  <>
                    <MapIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Mapa</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="h-[calc(100vh-120px)] sm:h-[calc(100vh-130px)]">
          <MapContainer
            center={[-23.5505, -46.6333]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <LocationMarker />

            {filteredPlaces.map((place) => (
              <Marker
                key={place.id}
                position={[place.latitude, place.longitude]}
                icon={createCustomIcon(place.type)}
              >
                <Popup maxWidth={300} className="custom-popup">
                  <div className="p-2">
                    <div className="flex items-start gap-2 mb-3">
                      <span className="text-2xl">
                        {placeTypes[place.type as keyof typeof placeTypes].icon}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-base leading-tight">
                          {place.name}
                        </h3>
                        <p className="text-xs text-purple-600 font-medium mt-1">
                          {placeTypes[place.type as keyof typeof placeTypes].label}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-xs">{place.address}</span>
                      </div>

                      {place.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <a
                            href={`tel:${place.phone}`}
                            className="text-purple-600 hover:text-purple-700 font-medium text-xs"
                          >
                            {place.phone}
                          </a>
                        </div>
                      )}

                      {place.hours && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-700 text-xs">{place.hours}</span>
                        </div>
                      )}
                    </div>

                    {place.description && (
                      <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                        {place.description}
                      </p>
                    )}

                    <Button
                      onClick={() => getDirections(place.latitude, place.longitude)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm"
                      size="sm"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Como Chegar
                    </Button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Legend - only on map view */}
          <div className="fixed bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000] max-w-xs">
            <h4 className="font-bold text-gray-900 mb-2 text-sm">Legenda</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(placeTypes).map(([key, config]) => (
                <div key={key} className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                    style={{ background: config.color }}
                  >
                    {config.icon}
                  </div>
                  <span className="text-xs text-gray-700">{config.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
          <div className="space-y-3">
            {sortedPlaces.map((place) => {
              const distance = userLocation 
                ? calculateDistance(userLocation[0], userLocation[1], place.latitude, place.longitude)
                : null;
              
              return (
                <Card key={place.id} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: placeTypes[place.type as keyof typeof placeTypes].color }}
                    >
                      {placeTypes[place.type as keyof typeof placeTypes].icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                            {place.name}
                          </h3>
                          <p className="text-xs text-purple-600 font-medium">
                            {placeTypes[place.type as keyof typeof placeTypes].label}
                          </p>
                        </div>
                        {distance !== null && (
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
                            {distance < 1 
                              ? `${Math.round(distance * 1000)}m` 
                              : `${distance.toFixed(1)}km`}
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-2 space-y-1">
                        <div className="flex items-start gap-2 text-xs text-gray-600">
                          <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{place.address}</span>
                        </div>
                        
                        {place.phone && (
                          <div className="flex items-center gap-2 text-xs">
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            <a
                              href={`tel:${place.phone}`}
                              className="text-purple-600 font-medium"
                            >
                              {place.phone}
                            </a>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        onClick={() => getDirections(place.latitude, place.longitude)}
                        className="mt-3 w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                        size="sm"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Como Chegar
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          
          {sortedPlaces.length === 0 && (
            <Card className="p-8 text-center">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">Nenhum local encontrado para o filtro selecionado</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
