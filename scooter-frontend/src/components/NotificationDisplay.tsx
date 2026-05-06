import React from 'react';
import { useNotification } from '../contexts/NotificationContext';
import '../styles/notifications.css';

export const NotificationDisplay: React.FC = () => {
  const { notifications, notificationHistory, removeNotification, removeFromHistory, markAsRead, unreadCount, showHistory, setShowHistory } = useNotification();

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };

  const getIcon = (type: string): string => {
    const icons: Record<string, string> = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      incident: '🚨',
    };
    return icons[type] || 'ℹ️';
  };

  return (
    <>
      {/* Notification Display */}
      <div className="notification-container">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification notification-${notification.type} ${
              notification.read ? 'read' : ''
            }`}
            onClick={() => handleNotificationClick(notification.id)}
          >
            <div className="notification-content">
              <span className="notification-icon">
                {notification.icon || getIcon(notification.type)}
              </span>
              <div className="notification-text">
                {notification.title && (
                  <div className="notification-title">{notification.title}</div>
                )}
                <span className="notification-message">{notification.message}</span>
              </div>
            </div>
            <button
              className="notification-close"
              onClick={(e) => {
                e.stopPropagation();
                removeNotification(notification.id);
              }}
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* History Button */}
      <button
        className="notification-history-btn"
        onClick={() => setShowHistory(!showHistory)}
        title={`${unreadCount} yeni olay bildirimi`}
      >
        🔔
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {/* History Modal */}
      {showHistory && (
        <div className="notification-history-modal">
          <div className="modal-header">
            <h3>📋 Bildirim Geçmişi (Olaylar)</h3>
            <button
              className="close-btn"
              onClick={() => setShowHistory(false)}
            >
              ✕
            </button>
          </div>
          <div className="modal-content">
            {notificationHistory.filter((n) => n.type === 'incident' && n.title?.includes('GLOBAL')).length === 0 ? (
              <p className="empty-message">
                Bildirim yok {notificationHistory.length > 0 && `(Toplam: ${notificationHistory.length})`}
              </p>
            ) : (
              notificationHistory
                .filter((n) => n.type === 'incident' && n.title?.includes('GLOBAL'))
                .map((notification) => (
                  <div
                    key={notification.id}
                    className={`history-item notification-${notification.type}`}
                  >
                    <div className="history-icon">{getIcon(notification.type)}</div>
                    <div className="history-text">
                      {notification.title && (
                        <div className="history-title">{notification.title}</div>
                      )}
                      <div className="history-message">{notification.message}</div>
                      <div className="history-time">
                        {new Date(notification.timestamp).toLocaleTimeString('tr-TR')}
                      </div>
                    </div>
                    <button
                      className="history-remove"
                      onClick={() => removeFromHistory(notification.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationDisplay;
