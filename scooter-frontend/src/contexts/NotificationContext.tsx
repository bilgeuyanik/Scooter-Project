import React, { createContext, useContext, useCallback, useState, useRef } from 'react';
import type { ReactNode } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'incident';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number; // milliseconds, undefined = permanent
  title?: string;
  icon?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
  timestamp: number;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  notificationHistory: Notification[];
  addNotification: (message: string, type?: NotificationType, duration?: number, title?: string) => void;
  removeNotification: (id: string) => void;
  removeFromHistory: (id: string) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  clearHistory: () => void;
  unreadCount: number;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<Notification[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const soundRef = useRef<HTMLAudioElement | null>(null);

  // sessionStorage'dan history'yi yükle (sayfa refresh'lendikçe silinir)
  React.useEffect(() => {
    console.log('ℹ️ Notification history sessionStorage\'dan yükleniyor');
    try {
      const saved = sessionStorage.getItem('notificationHistory');
      if (saved) {
        const parsed = JSON.parse(saved);
        setNotificationHistory(parsed);
        console.log('📊 Mevcut history:', parsed.length, 'item');
      }
    } catch (e) {
      console.error('Error loading history from sessionStorage:', e);
    }
  }, []);

  // Notification history'yi sessionStorage'a kaydet (runtime'da değişince)
  React.useEffect(() => {
    try {
      sessionStorage.setItem('notificationHistory', JSON.stringify(notificationHistory));
    } catch (e) {
      console.error('Error saving history to sessionStorage:', e);
    }
  }, [notificationHistory]);

  // Bildirim sesini oynat
  const playSound = useCallback(() => {
    try {
      // Data URL olarak basit bir beep sesi oluştur
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.error('Sound play error:', e);
    }
  }, []);

  const addNotification = useCallback(
    (message: string, type: NotificationType = 'info', duration = 4000, title?: string) => {
      // Ensure message is a string
      const msgStr = typeof message === 'string' ? message : String(message || 'Unknown error');
      
      const id = `${Date.now()}-${Math.random()}`;
      const notification: Notification = {
        id,
        message: msgStr,
        type,
        duration,
        title,
        timestamp: Date.now(),
        read: false,
      };

      // Ekrana ekle
      setNotifications((prev) => [notification, ...prev]);

      // Geçmişe ekle (max 50) - sessionStorage'a kaydet (sayfa refresh'lendikçe silinir)
      setNotificationHistory((prev) => {
        const updated = [notification, ...prev].slice(0, 50);
        try {
          sessionStorage.setItem('notificationHistory', JSON.stringify(updated));
        } catch (e) {
          console.error('Error saving to sessionStorage:', e);
        }
        const msgPreview = typeof message === 'string' ? message.substring(0, 40) : String(message).substring(0, 40);
        console.log('✨ Notification added:', { type, message: msgPreview + '...' });
        console.log('📊 Total in history:', updated.length);
        return updated;
      });

      // Incident bildirimleri için ses çal
      if (type === 'incident' || type === 'warning') {
        playSound();
      }

      // Otomatik kaybolma
      if (duration) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }
    },
    [playSound]
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setNotificationHistory((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      try {
        sessionStorage.setItem('notificationHistory', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving to sessionStorage:', e);
      }
      return updated;
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setNotificationHistory((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      try {
        sessionStorage.setItem('notificationHistory', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving to sessionStorage:', e);
      }
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const clearHistory = useCallback(() => {
    setNotificationHistory([]);
    try {
      sessionStorage.removeItem('notificationHistory');
    } catch (e) {
      console.error('Error removing from sessionStorage:', e);
    }
  }, []);

  const unreadCount = notificationHistory
    .filter((n) => !n.read && n.type === 'incident')
    .length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        notificationHistory,
        addNotification,
        removeNotification,
        removeFromHistory,
        markAsRead,
        clearAll,
        clearHistory,
        unreadCount,
        showHistory,
        setShowHistory,
      }}
    >
      {console.log('📦 NotificationProvider rendering with history:', notificationHistory.length)}
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
