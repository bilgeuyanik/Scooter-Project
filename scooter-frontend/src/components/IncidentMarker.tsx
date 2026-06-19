import React, {  useRef,  } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useIncidents } from '../contexts/IncidentContext';
import {
  INCIDENT_ICONS,
  INCIDENT_COLORS,
  getIncidentGradientColor,
  getIncidentTypeLabel,
} from '../constants/incidentTypes';

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
}

interface IncidentMarkerProps {
  incident: Incident;
  onDeleteClick?: (id: number, incident: Incident) => void;
}

export const IncidentMarker: React.FC<IncidentMarkerProps> = ({
  incident,
  onDeleteClick,
}) => {
  const { socket } = useIncidents();
  const markerRef = useRef<L.Marker>(null);
  const popupRef = useRef<L.Popup>(null);

  // Report button'a tıklandığında - direkt emit et
  const handleReport = () => {
    console.log('📢 Reporting incident:', incident.id);
    
    if (!socket) {
      alert('❌ WebSocket bağlantısı kurulamadı');
      return;
    }
    
    
    if (markerRef.current) {
      markerRef.current.closePopup();
    }
    
    // Direkt report event emit et
    socket.emit('incident:report', incident.id);
    console.log('✅ Report sent for incident:', incident.id);
  };

  
  const handleDelete = () => {
    console.log('🗑️ Delete button clicked for incident:', incident.id);
    if (confirm('Bu olayı silmek istediğinize emin misiniz? Tüm kullanıcılar için silinecektir.')) {
      if (markerRef.current) {
        markerRef.current.closePopup();
      }
      setTimeout(() => {
        onDeleteClick?.(incident.id, incident);
      }, 100);
    }
  };

  
const htmlIcon = L.divIcon({
    html: `
      <div style="
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        line-height: 1;
        filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));
      ">
        ${INCIDENT_ICONS[incident.type] || '⚠️'}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
   
    className: 'incident-icon leaflet-interactive', 
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffMinutes < 1) return 'Az önce';
    if (diffMinutes < 60) return `${diffMinutes} dk`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}s`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}g`;
  };

  // Gradient arka planı incident türüne göre belirle
  const gradient = getIncidentGradientColor(incident.type);

  
  const typeLabel = getIncidentTypeLabel(incident.type);

  // Dark mode renkleri
  const isDarkMode = true;
  const darkBg = isDarkMode ? '#2d2d2d' : '#fff';
  const darkText = isDarkMode ? '#e0e0e0' : '#333';
  const darkCard = isDarkMode ? '#3a3a3a' : '#f9f9f9';
  const darkBorder = isDarkMode ? '#444' : '#e0e0e0';

  return (
   
   <Marker
      ref={markerRef}
      position={[parseFloat(incident.lat.toString()), parseFloat(incident.lon.toString())]}
      icon={htmlIcon}
      
      // React-Leaflet aşağıdaki Popup'ı gördüğü an tıklamayı otomatik bağlar.
    >
      <Popup
        ref={popupRef}
        maxWidth={260}
        minWidth={240}
        className="incident-popup"
      >
          <div style={{ 
            padding: '0',
            margin: '-8px',
            backgroundColor: darkBg,
            borderRadius: '10px',
            overflow: 'hidden',
            pointerEvents: 'auto',
          }}>
            {/* Başlık Bölümü - Gradient Arka Plan */}
            <div
              style={{
                background: gradient,
                color: 'white',
                padding: '10px 10px',
                borderRadius: '0',
                pointerEvents: 'auto',
              }}
            >
              <div style={{
                fontSize: '14px',
                fontWeight: '700',
                marginBottom: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span style={{ fontSize: '18px' }}>{INCIDENT_ICONS[incident.type]}</span>
                {typeLabel}
              </div>
              <div style={{
                fontSize: '10px',
                opacity: 0.9,
                fontWeight: '500',
              }}>
                #{incident.id} • {formatDate(incident.createdAt)}
              </div>
            </div>

            <div style={{ padding: '10px 10px', pointerEvents: 'auto' }}>
              {/* Açıklama */}
              {incident.description && (
                <div style={{
                  marginBottom: '8px',
                  color: darkText,
                  fontSize: '11px',
                  lineHeight: '1.4',
                  padding: '6px 8px',
                  backgroundColor: darkCard,
                  borderRadius: '5px',
                  borderLeft: `2px solid ${INCIDENT_COLORS[incident.type]}`,
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '2px', color: INCIDENT_COLORS[incident.type], fontSize: '10px' }}>
                    📝 Açıklama
                  </div>
                  {incident.description}
                </div>
              )}

              {/* Adres */}
              {incident.address && (
                <div
                  style={{
                    marginBottom: '8px',
                    color: darkText,
                    fontSize: '11px',
                    padding: '6px 8px',
                    backgroundColor: darkCard,
                    borderRadius: '5px',
                    borderLeft: '2px solid #007AFF',
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '2px', color: '#007AFF', fontSize: '10px' }}>
                    📍 Konum
                  </div>
                  {incident.address}
                </div>
              )}

              {/* Resim */}
              {incident.image && (
                <div style={{
                  marginBottom: '8px',
                  overflow: 'hidden',
                  borderRadius: '6px',
                  border: `1px solid ${darkBorder}`,
                }}>
                  <img
                    src={incident.image}
                    alt="Incident"
                    style={{
                      width: '100%',
                      height: '110px',
                      objectFit: 'cover',
                    }}
                  />
                </div>
              )}

              {/* İstatistikler */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{
                    padding: '5px 8px',
                    backgroundColor: isDarkMode ? 'rgba(255, 59, 48, 0.15)' : '#FFE8E8',
                    borderRadius: '5px',
                    textAlign: 'center',
                    fontSize: '10px',
                    fontWeight: '600',
                    color: '#FF3B30',
                  }}
                >
                  📢 {incident.report_count}
                </div>
                <div
                  style={{
                    padding: '5px 8px',
                    backgroundColor: isDarkMode ? 'rgba(0, 122, 255, 0.15)' : '#E8F4FF',
                    borderRadius: '5px',
                    textAlign: 'center',
                    fontSize: '10px',
                    fontWeight: '600',
                    color: '#007AFF',
                  }}
                >
                  ⏱️ {formatDate(incident.createdAt)}
                </div>
              </div>

              {/* Butonlar */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
                pointerEvents: 'auto',
              }}>
                {/* Report Button */}
                {!incident.isResolved && (
                  <button
                    onClick={handleReport}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#0066DD';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#007AFF';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    style={{
                      padding: '7px 10px',
                      backgroundColor: '#007AFF',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '11px',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 2px 4px rgba(0, 122, 255, 0.2)',
                      pointerEvents: 'auto',
                    }}
                  >
                    👍 Bildir
                  </button>
                )}

                {/* Delete Button */}
                {onDeleteClick && (
                  <button
                    onClick={handleDelete}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#E63028';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#FF3B30';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    style={{
                      padding: '7px 10px',
                      backgroundColor: '#FF3B30',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '11px',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 2px 4px rgba(255, 59, 48, 0.2)',
                      pointerEvents: 'auto',
                    }}
                  >
                    🗑️ Sil
                  </button>
                )}
              </div>

              {/* Resolved Badge */}
              {incident.isResolved && (
                <div
                  style={{
                    padding: '7px 10px',
                    background: 'linear-gradient(135deg, #34C759 0%, #5AC77E 100%)',
                    color: 'white',
                    borderRadius: '6px',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '11px',
                    marginTop: '8px',
                    boxShadow: '0 2px 4px rgba(52, 199, 89, 0.2)',
                  }}
                >
                  ✅ Çözülmüş
                </div>
              )}
            </div>
          </div>
        </Popup>
    </Marker>
  );
};
