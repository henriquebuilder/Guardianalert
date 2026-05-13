import { MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '@/react-app/components/ui/card';

interface LocationDisplayProps {
  location: { lat: number; lng: number } | null;
  error: string | null;
}

export default function LocationDisplay({ location, error }: LocationDisplayProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
          location ? 'bg-green-100' : 'bg-gray-100'
        }`}>
          <MapPin className={`w-6 h-6 ${location ? 'text-green-600' : 'text-gray-400'}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            Sua Localização
            {location && <CheckCircle className="w-4 h-4 text-green-600" />}
          </h3>
          
          {location ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">Latitude:</span>
                <code className="px-2 py-1 bg-gray-100 rounded text-xs">
                  {location.lat.toFixed(6)}
                </code>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">Longitude:</span>
                <code className="px-2 py-1 bg-gray-100 rounded text-xs">
                  {location.lng.toFixed(6)}
                </code>
              </div>
              <p className="text-xs text-green-600 mt-2">
                ✓ Localização ativa e pronta para envio em emergências
              </p>
            </div>
          ) : error ? (
            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Obtendo sua localização...</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
