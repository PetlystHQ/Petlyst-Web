/**
 * Google Maps için yönlendirme URL'i oluşturan yardımcı fonksiyonlar
 */

/**
 * Kullanıcının mevcut konumundan belirtilen hedef konuma Google Maps yönlendirmesi oluşturur
 * @param targetLatitude Hedef konumun enlem değeri
 * @param targetLongitude Hedef konumun boylam değeri
 * @param userLatitude Kullanıcının konumunun enlem değeri (isteğe bağlı)
 * @param userLongitude Kullanıcının konumunun boylam değeri (isteğe bağlı)
 * @param travelMode Seyahat modu (driving, walking, bicycling, transit)
 * @returns Google Maps yönlendirme URL'i
 */
export const createGoogleMapsDirectionsUrl = (
  targetLatitude: number,
  targetLongitude: number,
  userLatitude?: number,
  userLongitude?: number,
  travelMode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
): string => {
  // Eğer kullanıcı konumu verilmişse, origin parametresini ekle
  const originParam = userLatitude && userLongitude
    ? `&origin=${userLatitude},${userLongitude}`
    : ''; // Kullanıcı konumu verilmemişse, Google Maps kullanıcının mevcut konumunu kullanır

  // Google Maps yönlendirme URL'i oluştur
  return `https://www.google.com/maps/dir/?api=1${originParam}&destination=${targetLatitude},${targetLongitude}&travelmode=${travelMode}`;
};

/**
 * Kullanıcının mevcut konumundan belirtilen adrese Google Maps yönlendirmesi oluşturur
 * @param address Hedef adres
 * @param travelMode Seyahat modu (driving, walking, bicycling, transit)
 * @returns Google Maps yönlendirme URL'i
 */
export const createGoogleMapsDirectionsByAddress = (
  address: string,
  travelMode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
): string => {
  // Adresi URL için uygun formata dönüştür
  const encodedAddress = encodeURIComponent(address);
  
  // Google Maps yönlendirme URL'i oluştur
  return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=${travelMode}`;
};

/**
 * Yeni bir tarayıcı sekmesinde Google Maps yönlendirmesini açar
 * @param url Google Maps yönlendirme URL'i
 */
export const openGoogleMapsDirections = (url: string): void => {
  window.open(url, '_blank', 'noopener,noreferrer');
};
