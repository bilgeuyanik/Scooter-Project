import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface UserLocation {
  lat: number;
  lon: number;
  accuracy: number;
  timestamp: number;
}

interface LocationContextType {
  userLocation: UserLocation | null;
  isTracking: boolean;
  error: string | null;
  startTracking: () => void;
  stopTracking: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const startTracking = useCallback(() => {
    if ('geolocation' in navigator) {
      setIsTracking(true);
      setError(null);

      const id = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
          setError(null);
        },
        (err) => {
          let errorMsg = 'Konum alınamadı';
          if (err.code === 1) {
            errorMsg = 'Konum izni reddedildi. Ayarlardan izin veriniz.';
          } else if (err.code === 2) {
            errorMsg = 'Konum bilgisi kullanılamıyor';
          } else if (err.code === 3) {
            errorMsg = 'Konum isteği zaman aşımına uğradı';
          }
          setError(errorMsg);
          setIsTracking(false);
          console.error('🌍 Konum hatası:', errorMsg);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000,
        }
      );

      setWatchId(id);
      console.log('🌍 Konum takibi başladı');
    } else {
      const errorMsg = 'Bu tarayıcı konum hizmetlerini desteklemez';
      setError(errorMsg);
      setIsTracking(false);
    }
  }, []);

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsTracking(false);
      console.log('🌍 Konum takibi durduruldu');
    }
  }, [watchId]);

  // Sayfa kapatıldığında takiyi durdur
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        isTracking,
        error,
        startTracking,
        stopTracking,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};
