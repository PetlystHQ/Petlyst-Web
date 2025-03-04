import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ClinicFormData } from '../../../types/clinic';
import { ErrorBoundary } from '../../common/ErrorBoundary';
// Heroicons kütüphanesi yüklü değil, SVG ikonlarını manuel olarak tanımlayalım

// Define interface for the Google Maps API
declare global {
  interface Window {
    google: any;
    initMap?: () => void;
  }
}

// Define types for Google Maps geocoding results
interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GeocodingResult {
  address_components: AddressComponent[];
  formatted_address: string;
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
}

// İlk olarak LatLng tipi için interface'i ekleyelim
interface LatLng {
  lat: number;
  lng: number;
}

// Tip güvenliği için bu metodu ekleyelim

// Try multiple ways to access the API key
const getApiKey = (): string => {
  // For debugging
  console.log('[DEBUG] Environment variables check:');
  console.log('import.meta.env available:', typeof import.meta.env !== 'undefined');
  console.log('VITE_GOOGLE_MAPS_API_KEY via import.meta:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
  
  // Try different methods to get API key
  const viaImportMeta = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  // Return the API key or a hardcoded fallback for development ONLY
  return viaImportMeta || 
    // ONLY FOR FIXING THIS ISSUE - REMOVE IN PRODUCTION!
    'AIzaSyBfwsT8rVE-PIZ8kNbute9tom_JSy17Rww';
};

// Get API key using our more robust method
const GOOGLE_MAPS_API_KEY = getApiKey();

interface MapComponentProps {
  formData: ClinicFormData;
  updateField: (name: string, value: any) => void;
  hasExistingClinic: boolean;
  loading: boolean;
}

// ClinicFormData interface'ini genişletelim
interface ExtendedClinicFormData extends ClinicFormData {
  detailedAddress?: string;
}

// SVG ikonu bileşenleri
const ExclamationTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={props.className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
);

const ArrowPathIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={props.className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

// Google Maps yükleme ve yönetme mantığını ayrı bir bileşene taşıyalım
const MapContainer = ({
  formData,
  updateField,
  hasExistingClinic,
  loading,
  onError
}: {
  formData: ExtendedClinicFormData,
  updateField: (name: string, value: any) => void,
  hasExistingClinic: boolean,
  loading: boolean,
  onError: (error: string) => void
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [, setMapReady] = useState(false);
  const mapReadyRef = useRef(false);
  const mapInstance = useRef<any>(null);
  const marker = useRef<any>(null);
  const geocoder = useRef<any>(null);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  
  // Default coordinates for Turkey
  const defaultCenter = { lat: 39.9334, lng: 32.8597 };
  
  // Function to load Google Maps script
  const loadGoogleMapsScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Google Maps zaten yüklendi mi kontrol et
      if (window.google?.maps?.Map) {
        console.log('[DEBUG] Google Maps already loaded');
        resolve();
        return;
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api"]');
      if (existingScript) {
        console.log('[DEBUG] Google Maps script is already loading, waiting...');
        // Wait for existing script to load
        const checkInterval = setInterval(() => {
          if (window.google?.maps?.Map) {
            clearInterval(checkInterval);
            console.log('[DEBUG] Google Maps loaded via interval check');
            resolve();
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkInterval);
          console.log('[DEBUG] Google Maps script load timeout');
          reject(new Error('Google Maps script load timeout'));
        }, 10000);
        
        return;
      }

      // Create a new script element
      const script = document.createElement('script');
      
      // Format API key for debugging
      const displayKey = GOOGLE_MAPS_API_KEY ? 
        GOOGLE_MAPS_API_KEY.substring(0, 5) + '...' + GOOGLE_MAPS_API_KEY.substring(GOOGLE_MAPS_API_KEY.length - 5) : 
        'MISSING';
      
      console.log(`[DEBUG] Loading Google Maps with API key: ${displayKey}`);
      
      // Callback function adını global pencerede tanımla
      const callbackName = 'googleMapsInitCallback' + Date.now();
      (window as any)[callbackName] = () => {
        console.log('[DEBUG] Google Maps script loaded via callback');
        delete (window as any)[callbackName];
        resolve();
      };
      
      // Create the full script URL - asynchronous loading without loading=async
      const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&libraries=places,marker&v=beta&callback=${callbackName}`;
      console.log(`[DEBUG] Full script URL being used: ${scriptUrl.replace(GOOGLE_MAPS_API_KEY, '[API-KEY-HIDDEN]')}`);
      
      script.src = scriptUrl;
      script.async = true;
      script.defer = true;
      
      // Handle errors
      script.onerror = (error) => {
        console.error('[DEBUG] Google Maps script failed to load:', error);
        reject(new Error('Failed to load Google Maps script'));
      };
      
      // Add to document
      document.head.appendChild(script);
      console.log('[DEBUG] Google Maps script added to document.head');
      
      // Set timeout for script loading
      setTimeout(() => {
        if (!window.google?.maps?.Map) {
          console.error('[DEBUG] Google Maps script load timeout after 10s');
          reject(new Error('Google Maps script load timeout'));
        }
      }, 10000);
    });
  };
  
  // Function to perform reverse geocoding
  const performReverseGeocoding = async (lat: number, lng: number) => {
    if (!geocoder.current) {
      console.log('[DEBUG] Geocoder not available for reverse geocoding');
      return;
    }
    
    setIsAddressLoading(true);

    try {
      console.log('[DEBUG] Starting reverse geocoding for:', lat, lng);
      const results = await new Promise<GeocodingResult[]>((resolve, reject) => {
        geocoder.current.geocode(
          { location: { lat, lng } },
          (
            results: GeocodingResult[],
            status: string
          ) => {
            if (status === "OK" && results && results.length > 0) {
              resolve(results);
            } else {
              reject(new Error(`Geocoding failed with status: ${status}`));
            }
          }
        );
      });

      console.log('[DEBUG] Geocoding results received:', results);
      const result = results[0];
      const addressComponents = result.address_components;
      const formattedAddress = result.formatted_address;

      if (addressComponents) {
        let province = "";
        let district = "";

        for (const component of addressComponents) {
          const types = component.types;
          if (types.includes("administrative_area_level_1")) {
            province = component.long_name;
          } else if (types.includes("administrative_area_level_2")) {
            district = component.long_name;
          }
        }

        console.log('[DEBUG] Extracted address data:', { province, district, formattedAddress });

        if (province) {
          updateField("province", province);
          // DOM güncelleme - doğrudan il alanını güncelle
          const provinceInput = document.getElementById("province") as HTMLInputElement;
          if (provinceInput) provinceInput.value = province;
        }

        if (district) {
          updateField("district", district);
          // DOM güncelleme - doğrudan ilçe alanını güncelle
          const districtInput = document.getElementById("district") as HTMLInputElement;
          if (districtInput) districtInput.value = district;
        }
        
        // Detaylı adres güncellemesi
        if (formattedAddress) {
          updateField("detailedAddress", formattedAddress);
          // DOM güncelleme - doğrudan detaylı adres alanını güncelle
          const detailedAddressInput = document.getElementById("detailedAddress") as HTMLTextAreaElement;
          if (detailedAddressInput) detailedAddressInput.value = formattedAddress;
        }
      }
    } catch (error) {
      console.error("[DEBUG] Error during reverse geocoding:", error);
    } finally {
      setIsAddressLoading(false);
    }
  };
  
  // Harita DOM hazır ve API yüklendikten sonra haritayı başlat
  const initializeMap = async () => {
    if (mapReadyRef.current || !mapContainerRef.current) {
      return;
    }
    
    console.log('[DEBUG] Starting map initialization');
    console.log('[DEBUG] API Key:', GOOGLE_MAPS_API_KEY ? 
      (GOOGLE_MAPS_API_KEY.substring(0, 5) + '...' + GOOGLE_MAPS_API_KEY.substring(GOOGLE_MAPS_API_KEY.length - 5)) : 
      'MISSING');
    
    try {
      // Wait for Google Maps script to load
      console.log('[DEBUG] Loading Google Maps script...');
      await loadGoogleMapsScript();
      console.log('[DEBUG] Google Maps script loaded successfully');
      
      if (!mapContainerRef.current) {
        console.error('[DEBUG] Map container ref is null after script load');
        onError('Harita container bulunamadı. Lütfen sayfayı yenileyin.');
        return;
      }
      
      console.log('[DEBUG] Map container ref:', mapContainerRef.current);
      console.log('[DEBUG] Creating map instance...');
      
      // Create map instance
      const center = formData.coordinates || defaultCenter;
      const google = window.google;
      
      mapInstance.current = new google.maps.Map(mapContainerRef.current, {
        zoom: 15,
        center,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });
      
      console.log('[DEBUG] Map instance created successfully');
      
      // Create geocoder
      geocoder.current = new google.maps.Geocoder();
      
      console.log('[DEBUG] Creating marker...');
      // Try to use the standard Marker first (more reliable)
      try {
        marker.current = new google.maps.Marker({
          position: center,
          map: mapInstance.current,
          draggable: !hasExistingClinic && !loading,
          title: "Clinic Location"
        });
        
        console.log('[DEBUG] Standard marker created successfully');
        
        // Add marker drag end event
        marker.current.addListener("dragend", () => {
          const position = marker.current.getPosition();
          const newLat = position.lat();
          const newLng = position.lng();
          
          console.log('[DEBUG] Marker dragend - updating coordinates to:', { lat: newLat, lng: newLng });
          
          updateField("coordinates", { lat: newLat, lng: newLng });
          performReverseGeocoding(newLat, newLng);
        });
      } catch (e) {
        console.warn('[DEBUG] Standard Marker failed, trying AdvancedMarkerElement', e);
        // Try to use AdvancedMarkerElement as fallback
        try {
          marker.current = new google.maps.marker.AdvancedMarkerElement({
            position: center,
            map: mapInstance.current,
            draggable: !hasExistingClinic && !loading,
            title: "Clinic Location"
          });
          
          console.log('[DEBUG] Advanced marker created successfully');
          
          // Add marker drag end event
          marker.current.addListener("dragend", () => {
            const position = marker.current.position;
            const newLat = position.lat;
            const newLng = position.lng;
            
            console.log('[DEBUG] Marker dragend - updating coordinates to:', { lat: newLat, lng: newLng });
            
            updateField("coordinates", { lat: newLat, lng: newLng });
            performReverseGeocoding(newLat, newLng);
          });
        } catch (markerError) {
          console.error('[DEBUG] Failed to create any marker type', markerError);
          onError('Failed to create map marker. Please check your browser console for more details.');
        }
      }
      
      // Add map click event
      if (!hasExistingClinic) {
        console.log('[DEBUG] Adding map click event listener');
        mapInstance.current.addListener('click', (e: any) => {
          const newLat = e.latLng.lat();
          const newLng = e.latLng.lng();
          
          if (marker.current) {
            if (marker.current.position) {
              marker.current.position = e.latLng;
            } else if (marker.current.setPosition) {
              marker.current.setPosition(e.latLng);
            }
          }
          
          console.log('[DEBUG] Map click - updating coordinates to:', { lat: newLat, lng: newLng });
          
          updateField("coordinates", { lat: newLat, lng: newLng });
          performReverseGeocoding(newLat, newLng);
        });
      }
      
      // İlklendirme tamamlandı
      console.log('[DEBUG] Map initialization completed successfully');
      mapReadyRef.current = true;
      setMapReady(true);
    } catch (err) {
      console.error('[DEBUG] Error initializing map:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const detailedError = 
        `Harita yüklenirken bir hata oluştu: ${errorMessage}\n\n` +
        'Olası çözümler:\n' +
        '1. API anahtarınızın geçerli olduğundan emin olun\n' +
        '2. Google Cloud Console\'da Maps JavaScript API\'nin etkin olduğunu kontrol edin\n' +
        '3. Tarayıcı konsolunu kontrol edin ve olası hataları Google\'da aratın\n';
      
      onError(detailedError);
    }
  };
  
  // Component mount edildiğinde ve ref hazır olduğunda haritayı başlat
  useEffect(() => {
    // DOM oluşumunun tamamlanması için bir anlık bekle
    const timer = setTimeout(() => {
      if (mapContainerRef.current && !mapReadyRef.current) {
        console.log('[DEBUG] Map container ref is ready, initializing map');
        initializeMap();
      }
    }, 500);
    
    return () => {
      clearTimeout(timer);
      
      // Cleanup
      if (marker.current) {
        try {
          if (marker.current.setMap) {
            marker.current.setMap(null);
          }
          marker.current = null;
        } catch (e) {
          console.warn('[DEBUG] Error cleaning up marker:', e);
        }
      }
      
      if (mapInstance.current) {
        try {
          if (window.google?.maps?.event) {
            window.google.maps.event.clearInstanceListeners(mapInstance.current);
          }
          mapInstance.current = null;
        } catch (e) {
          console.warn('[DEBUG] Error cleaning up map instance:', e);
        }
      }
    };
  }, []);
  
  // Update map when coordinates change
  useEffect(() => {
    if (!mapInstance.current || !formData.coordinates || !mapReadyRef.current) return;
    
    try {
      mapInstance.current.setCenter(formData.coordinates);
      
      if (marker.current) {
        if (marker.current.position) {
          marker.current.position = formData.coordinates;
        } else if (marker.current.setPosition) {
          marker.current.setPosition(formData.coordinates);
        }
      }
    } catch (e) {
      console.warn('[DEBUG] Error updating map position:', e);
    }
  }, [formData.coordinates]);
  
  return (
    <>
      <div 
        ref={mapContainerRef} 
        style={{ height: '320px', width: '100%' }}
        className={`rounded-lg border border-gray-300 ${hasExistingClinic || loading ? 'opacity-75 pointer-events-none' : ''}`}
      ></div>
      
      {formData.coordinates && (
        <div className="flex flex-col gap-2 p-4 border border-gray-300 rounded-lg bg-gray-50">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-md text-gray-700">Seçilen Konum Detayları</h3>
            {!hasExistingClinic && !loading && (
              <button
                type="button"
                onClick={() => {
                  setIsAddressLoading(true);
                  performReverseGeocoding(
                    formData.coordinates?.lat || 0,
                    formData.coordinates?.lng || 0
                  );
                }}
                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ArrowPathIcon className="-ml-0.5 mr-1 h-4 w-4" aria-hidden="true" />
                Adresi Yenile
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium text-gray-500">Enlem (Lat):</span> {formData.coordinates.lat.toFixed(6)}
            </div>
            <div>
              <span className="font-medium text-gray-500">Boylam (Lng):</span> {formData.coordinates.lng.toFixed(6)}
            </div>
          </div>
          
          {isAddressLoading ? (
            <div className="flex items-center space-x-2 mt-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              <span>Adres bilgileri alınıyor...</span>
            </div>
          ) : formData.province || formData.district || (formData as ExtendedClinicFormData).detailedAddress ? (
            <div className="mt-2 text-sm text-gray-600">
              {formData.province && <div><span className="font-medium text-gray-500">İl:</span> {formData.province}</div>}
              {formData.district && <div><span className="font-medium text-gray-500">İlçe:</span> {formData.district}</div>}
              {(formData as ExtendedClinicFormData).detailedAddress && (
                <div>
                  <span className="font-medium text-gray-500">Adres:</span> 
                  <div className="mt-1">{(formData as ExtendedClinicFormData).detailedAddress}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-2 text-sm text-gray-500">
              Adres bilgisi bulunamadı.
            </div>
          )}
        </div>
      )}
    </>
  );
};

export const MapComponent: React.FC<MapComponentProps> = ({
  formData,
  updateField,
  hasExistingClinic,
  loading
}) => {
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // useRef ile görünür/gizli durumunu takip etmek için
  const loadingTimerRef = useRef<number | null>(null);

  // Debug bilgisi - gösterilip gösterilmeyeceği
  const [showDebug, setShowDebug] = useState(false);
  
  // FormData'daki coordinates nesnesini güvenli bir şekilde alalım
  const safeCoordinates = useMemo(() => {
    console.log('[DEBUG] Computing safe coordinates from:', formData.coordinates);
    const coords = formData.coordinates;
    if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
      return coords as LatLng;
    }
    return null;
  }, [formData.coordinates]);
  
  // Effect to simulate loading and show the map after a delay
  useEffect(() => {
    console.log('[DEBUG] Starting loading simulation');
    
    // API key available check
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === '') {
      const errorMsg = 
        'API anahtarı eksik veya geçersiz. Lütfen aşağıdakileri kontrol edin:\n\n' +
        '1. .env dosyasında VITE_GOOGLE_MAPS_API_KEY değişkeni var mı?\n' +
        '2. Projeyi yeniden başlattınız mı?\n' +
        '3. Google Cloud Console\'da API Anahtarınız etkin mi?\n\n';
      
      setMapError(errorMsg);
      setIsLoading(false);
      console.error('[DEBUG] Missing/Invalid Google Maps API Key');
      return;
    }
    
    // Yükleme süresini azaltalım - hemen gösterelim
    loadingTimerRef.current = window.setTimeout(() => {
      console.log('[DEBUG] Loading timer completed, showing map');
      setIsLoading(false);
    }, 1000);
    
    return () => {
      if (loadingTimerRef.current !== null) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);
  
  // Handle map errors
  const handleMapError = (error: string) => {
    console.error('[DEBUG] Map error received:', error);
    setMapError(error);
  };

  return (
    <ErrorBoundary>
      <div className="w-full">
        {/* Alt+D ile gösterilen debug bilgisi */}
        {showDebug && (
          <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-100 rounded">
            <p>Debug - Koordinatlar: {safeCoordinates ? `${safeCoordinates.lat.toFixed(6)}, ${safeCoordinates.lng.toFixed(6)}` : 'Yok'}</p>
            <p>API Key: {GOOGLE_MAPS_API_KEY ? (GOOGLE_MAPS_API_KEY.substring(0, 5) + '...' + GOOGLE_MAPS_API_KEY.substring(GOOGLE_MAPS_API_KEY.length - 5)) : 'MISSING'}</p>
            <button 
              onClick={() => setShowDebug(false)}
              className="mt-1 text-xs text-red-500 hover:text-red-700"
            >
              Debug Gizle
            </button>
          </div>
        )}
        
        {/* Alt+D tuş kombinasyonu ile debug göster/gizle */}
        <div className="hidden">
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="text-xs text-gray-500"
          >
            Debug Göster/Gizle
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-10 border border-gray-300 rounded-lg bg-gray-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-sm text-gray-500">Harita yükleniyor...</p>
          </div>
        ) : mapError ? (
          <div className="flex flex-col gap-4">
            <div className="p-4 border border-red-300 rounded-lg bg-red-50">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Harita Yüklenemedi</h3>
                  <div className="mt-2 text-sm text-red-700 whitespace-pre-line">
                    {mapError}
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <ArrowPathIcon className="-ml-0.5 mr-1 h-4 w-4" aria-hidden="true" />
                      Sayfayı Yenile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Map Container çağrısı */}
            <MapContainer 
              formData={formData}
              updateField={updateField}
              hasExistingClinic={hasExistingClinic}
              loading={loading}
              onError={handleMapError}
            />
            
            {/* Konum bilgilerinin kısa özeti - sadece seçim yapıldıysa göster */}
            {formData.coordinates && (
              <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">Seçilen Konum: </span>
                  <span className="text-sm font-medium">
                    {formData.province || 'İl bilgisi yok'}, {formData.district || 'İlçe bilgisi yok'}
                  </span>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => updateField("coordinates", null)}
                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Seçimi Temizle
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}; 