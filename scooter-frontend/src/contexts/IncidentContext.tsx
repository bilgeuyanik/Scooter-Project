import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNotification } from './NotificationContext';

interface Incident {
  id: number;
  lat: number;
  lon: number;
  type: string;
  address?: string;
  description?: string;
  image?: string;
  report_count: number;
  createdAt: string;
  isResolved: boolean;
  reportedByUserId?: number;
}

interface IncidentContextType {
  incidents: Incident[];
  nearbyIncidents: Incident[];
  socket: Socket | null;
  isConnected: boolean;
  createIncident: (data: any) => void;
  reportIncident: (id: number) => void;
  resolveIncident: (id: number) => void;
  deleteIncident: (id: number) => void;
  getNearbyIncidents: (lat: number, lon: number) => void;
  isGloballyNotified: (incidentId: number) => boolean;
}

const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

export const IncidentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addNotification } = useNotification();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [nearbyIncidents, setNearbyIncidents] = useState<Incident[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const notifiedGlobalIncidentsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    // WebSocket bağlantısı kur
    const newSocket = io('http://localhost:3000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ Incident WebSocket bağlandı');
      setIsConnected(true);
      // Başlangıçta tüm olayları talep et
      newSocket.emit('incident:getAll');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Incident WebSocket bağlantısı kesildi');
      setIsConnected(false);
    });

    // Olay listesi (ilk yükleme)
    newSocket.on('incident:list', (data: Incident[]) => {
      console.log('📋 Olay listesi alındı:', data);
      setIncidents(data);
    });

    // Yeni olay eklendi
    newSocket.on('incident:created', (newIncident: Incident) => {
      console.log('🚨 Yeni olay eklendi (küresel broadcast):', newIncident);
      setIncidents((prev) => [newIncident, ...prev]);
      
      // Global incident notification'a ekle (sadece ilk defa)
      if (!notifiedGlobalIncidentsRef.current.has(newIncident.id)) {
        console.log('✅ Global incident notification geçmişine ekleniyor:', newIncident.id);
        addNotification(
          `${newIncident.address || 'Bilinmeyen konum'} • ${newIncident.description || ''}`.trim(),
          'incident',
          5000,
          `🌍 GLOBAL: ${newIncident.type} Olayı Bildirildi`
        );
        notifiedGlobalIncidentsRef.current.add(newIncident.id);
      }
      // nearbyIncidents'a ekleme - sadece getNearbyIncidents API response'ında update ol
    });

    // Olay güncellendi (report count)
    newSocket.on('incident:updated', (updatedIncident: Incident) => {
      console.log('🔄 Olay güncellendi:', updatedIncident);
      setIncidents((prev) =>
        prev.map((i) => (i.id === updatedIncident.id ? updatedIncident : i))
      );
      // nearbyIncidents'a değil, sadece global incidents'a güncelle
    });

    // Olay çözüldü
    newSocket.on('incident:resolved', (data: { id: number }) => {
      console.log('✅ Olay çözüldü:', data.id);
      setIncidents((prev) =>
        prev.map((i) =>
          i.id === data.id ? { ...i, isResolved: true } : i
        )
      );
      // nearbyIncidents'a değil, sadece global incidents'a güncelle
    });

    // Olay silindi
    newSocket.on('incident:deleted', (data: { id: number }) => {
      console.log('🗑️ Olay silindi:', data.id);
      setIncidents((prev) => prev.filter((i) => i.id !== data.id));
      // nearbyIncidents'a değil, sadece global incidents'a sil
    });

    // Yakındaki olaylar
    newSocket.on('incident:nearbyList', (data: Incident[]) => {
      console.log('📍 Yakındaki olaylar alındı:', data);
      setNearbyIncidents(data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [addNotification]);

  const createIncident = (data: any) => {
    socket?.emit('incident:create', data);
  };

  const reportIncident = (id: number) => {
    socket?.emit('incident:report', id);
  };

  const resolveIncident = (id: number) => {
    socket?.emit('incident:resolve', id);
  };

  const deleteIncident = (id: number) => {
    socket?.emit('incident:delete', id);
  };

  const getNearbyIncidents = (lat: number, lon: number) => {
    socket?.emit('incident:nearby', { lat, lon });
  };

  const isGloballyNotified = (incidentId: number): boolean => {
    return notifiedGlobalIncidentsRef.current.has(incidentId);
  };

  return (
    <IncidentContext.Provider
      value={{
        incidents,
        nearbyIncidents,
        socket,
        isConnected,
        createIncident,
        reportIncident,
        resolveIncident,
        deleteIncident,
        getNearbyIncidents,
        isGloballyNotified,
      }}
    >
      {children}
    </IncidentContext.Provider>
  );
};

export const useIncidents = () => {
  const context = useContext(IncidentContext);
  if (!context) {
    throw new Error('useIncidents must be used within IncidentProvider');
  }
  return context;
};
