import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface Scooter {
  id: number;
  unique_name: string;
  latitude: number;
  longitude: number;
  battery_status: number;
  status: string;
}

interface ScooterContextType {
  scooters: Scooter[];
  socket: Socket | null;
  isConnected: boolean;
  addScooter: (scooter: any) => void;
  deleteScooter: (id: number) => void;
  updateScooter: (data: any) => void;
}

const ScooterContext = createContext<ScooterContextType | undefined>(undefined);

export const ScooterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // WebSocket bağlantısı kur
    const newSocket = io('http://localhost:3000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ WebSocket bağlandı');
      setIsConnected(true);
      // Başlangıçta tüm scooterları talep et
      newSocket.emit('scooter:getAll');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket bağlantısı kesildi');
      setIsConnected(false);
    });

    // Scooter listesi (ilk yükleme)
    newSocket.on('scooter:list', (data: Scooter[]) => {
      console.log('📋 Scooter listesi alındı:', data);
      setScooters(data);
    });

    // Yeni scooter eklendi
    newSocket.on('scooter:added', (newScooter: Scooter) => {
      console.log('➕ Yeni scooter eklendi:', newScooter);
      setScooters((prev) => [...prev, newScooter]);
    });

    // Scooter silindi
    newSocket.on('scooter:deleted', (data: { id: number }) => {
      console.log('🗑️ Scooter silindi:', data.id);
      setScooters((prev) => prev.filter((s) => s.id !== data.id));
    });

    // Scooter güncellendi
    newSocket.on('scooter:updated', (updatedScooter: Scooter) => {
      console.log('🔄 Scooter güncellendi:', updatedScooter);
      setScooters((prev) =>
        prev.map((s) => (s.id === updatedScooter.id ? updatedScooter : s))
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const addScooter = (scooter: any) => {
    socket?.emit('scooter:add', scooter);
  };

  const deleteScooter = (id: number) => {
    socket?.emit('scooter:delete', id);
  };

  const updateScooter = (data: any) => {
    socket?.emit('scooter:update', data);
  };

  return (
    <ScooterContext.Provider value={{ scooters, socket, isConnected, addScooter, deleteScooter, updateScooter }}>
      {children}
    </ScooterContext.Provider>
  );
};

export const useScooters = () => {
  const context = useContext(ScooterContext);
  if (!context) {
    throw new Error('useScooters must be used within ScooterProvider');
  }
  return context;
};
