import axiosInstance from '../../utils/axiosConfig';
import { createGoogleMapsDirectionsUrl } from './mapUtils';

// Telefon numarası için arayüz
interface PhoneNumber {
  phone_number: string;
  phone_type: string;
}

// Veteriner operatör için arayüz
interface Operator {
  user_name: string;
  user_surname: string;
}

// Klinik tipi için arayüz - genişletilmiş
interface Clinic {
  location_id: number;
  clinic_id: number;
  province: string;
  district: string;
  clinic_address: string;
  latitude: number;
  longitude: number;
  clinic_name: string;
  clinic_operator_id: number;
  slug: string;
  distance: number;
  phones: PhoneNumber[];
  operator: Operator | null;
}

// En yakın klinik yanıtı için arayüz
interface NearestClinicResponse {
  success: boolean;
  message: string;
  clinics: Clinic[];
}

/**
 * Kullanıcının konumunu Geolocation API'yi kullanarak alır
 * @returns Kullanıcının konum bilgisi (latitude, longitude)
 */
export const getUserLocation = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Tarayıcınız konum hizmetlerini desteklemiyor.'));
      return;
    }
    
    // Konum izni iste ve konum bilgisini al
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({ latitude, longitude });
      },
      (error) => {
        let errorMessage = 'Konum alınırken bir hata oluştu.';
        
        // Hata türüne göre özel mesaj oluştur
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Konum izni reddedildi.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Konum bilgisi mevcut değil.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Konum isteği zaman aşımına uğradı.';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true, // Daha yüksek doğruluk
        timeout: 10000,           // 10 saniye zaman aşımı
        maximumAge: 0             // Her zaman güncel konum
      }
    );
  });
};

/**
 * Kullanıcının konumuna en yakın klinikleri bulur
 * @param latitude Kullanıcının enlem değeri
 * @param longitude Kullanıcının boylam değeri
 * @returns En yakın klinikler listesi
 */
export const findNearestClinics = async (
  latitude: number,
  longitude: number
): Promise<Clinic[]> => {
  try {
    // Backend API'ye istek gönder
    const response = await axiosInstance.get<NearestClinicResponse>(`/emergency/nearest-clinic`, {
      params: { latitude, longitude }
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Klinik bulunamadı');
    }
    
    return response.data.clinics;
  } catch (error) {
    console.error('En yakın klinik bulma hatası:', error);
    throw error;
  }
};

/**
 * Kullanıcının konumunu alır ve en yakın klinikleri bulur
 * @returns En yakın klinikler ve kullanıcı konumu
 */
export const getEmergencyData = async (): Promise<{
  clinics: Clinic[];
  userLocation: { latitude: number; longitude: number };
}> => {
  // Kullanıcının konumunu al
  const userLocation = await getUserLocation();
  
  // En yakın klinikleri bul
  const nearestClinics = await findNearestClinics(userLocation.latitude, userLocation.longitude);
  
  if (nearestClinics.length === 0) {
    throw new Error('Yakınınızda klinik bulunamadı.');
  }
  
  return {
    clinics: nearestClinics,
    userLocation
  };
};

/**
 * Google Maps yönlendirme URL'si oluşturur
 * @param clinic Klinik bilgileri
 * @param userLocation Kullanıcı konum bilgileri
 * @returns Google Maps yönlendirme URL'si
 */
export const createDirectionsUrl = (
  clinic: Clinic,
  userLocation: { latitude: number; longitude: number }
): string => {
  return createGoogleMapsDirectionsUrl(
    clinic.latitude,
    clinic.longitude,
    userLocation.latitude,
    userLocation.longitude
  );
};
