import React, { useRef, useState, useEffect } from 'react';
import { useIncidents } from '../contexts/IncidentContext';
import { INCIDENT_TYPES } from '../constants/incidentTypes';

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLat?: number;
  initialLon?: number;
  incidentId?: number; // Mevcut incident'i report etmek için
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
  isOpen,
  onClose,
  initialLat,
  initialLon,
  incidentId,
}) => {
  const { socket } = useIncidents();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);

  const [formData, setFormData] = useState({
    type: 'Crash',
    description: '',
    address: '',
    image: null as string | null,
    lat: initialLat || 0,
    lon: initialLon || 0,
  });

  // Modal açıldığında reverse geocoding yap
  useEffect(() => {
    if (isOpen && initialLat && initialLon) {
      fetchAddress(initialLat, initialLon);
    }
  }, [isOpen, initialLat, initialLon]);

  // Backend'den adres getir
  const fetchAddress = async (lat: number, lon: number) => {
    setAddressLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/geocoding/reverse?lat=${lat}&lon=${lon}`
      );
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Ters coğrafi kodlama başarılı:', data.address);
        setFormData((prev) => ({
          ...prev,
          address: data.address,
          lat,
          lon,
        }));
      } else {
        console.warn('❌ Adres getirilemedi');
        setFormData((prev) => ({
          ...prev,
          address: `📍 ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
          lat,
          lon,
        }));
      }
    } catch (err) {
      console.error('❌ Reverse geocoding hatası:', err);
      setFormData((prev) => ({
        ...prev,
        address: `📍 ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        lat,
        lon,
      }));
    } finally {
      setAddressLoading(false);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setFormData((prev) => ({ ...prev, image: compressed }));
      } catch (err) {
        alert('❌ Resim sıkıştırılamadı');
        console.error(err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type || !formData.description.trim()) {
      alert('❌ Lütfen olay türü ve açıklamayı doldurunuz');
      return;
    }

    setLoading(true);
    try {
      if (!socket) {
        alert('❌ WebSocket bağlantısı kurulamadı');
        setLoading(false);
        return;
      }

      // Eğer incidentId varsa, mevcut incident'i report et
      if (incidentId) {
        console.log('📢 Reporting incident:', incidentId);
        socket.emit('incident:report', incidentId);
      } else {
        // Yeni incident oluştur
        const incidentData = {
          lat: initialLat || formData.lat,
          lon: initialLon || formData.lon,
          address: formData.address || undefined,
          type: formData.type,
          description: formData.description,
          image: formData.image || undefined,
        };

        console.log('🚨 Creating new incident:', incidentData);
        socket.emit('incident:create', incidentData);
      }

      // Başarı mesajı göster ve modal kapat
      alert('✅ Olay başarıyla rapor edildi!');

      // Form sıfırla
      setFormData({
        type: 'Crash',
        description: '',
        address: '',
        image: null,
        lat: 0,
        lon: 0,
      });

      onClose();
    } catch (err) {
      console.error(err);
      alert('❌ Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#2d2d2d',
          borderRadius: '20px',
          padding: '32px',
          maxWidth: '550px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
          border: '2px solid #444',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: '24px', color: '#e0e0e0', fontSize: '28px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}>🚨 Olay Bildir</h2>

        <form onSubmit={handleSubmit}>
          {/* Konum Bilgisi */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '10px',
                fontWeight: '700',
                color: '#e0e0e0',
                fontSize: '14px',
              }}
            >
              📍 Konum
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
              placeholder={
                addressLoading ? '📡 Adres getiriliyor...' : 'Adres otomatik doldurulacak'
              }
              disabled={addressLoading}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '2px solid #444',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: 'inherit',
                backgroundColor: addressLoading ? '#1f1f1f' : '#1f1f1f',
                color: '#e0e0e0',
                transition: 'all 0.3s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#004B49'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#444'}
            />
            {addressLoading && (
              <p style={{ marginTop: '8px', fontSize: '12px', color: '#C4A57B' }}>
                🌐 OpenStreetMap API'den adres çekiliyor...
              </p>
            )}
          </div>

          {/* Olay Türü Seç */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '10px',
                fontWeight: '700',
                color: '#e0e0e0',
                fontSize: '14px',
              }}
            >
              🏷️ Olay Türü *
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, type: e.target.value }))
              }
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '2px solid #444',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: 'inherit',
                backgroundColor: '#1f1f1f',
                color: '#e0e0e0',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#004B49'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#444'}
            >
              {INCIDENT_TYPES.map((type) => (
                <option key={type.value} value={type.value} style={{ backgroundColor: '#2d2d2d', color: '#e0e0e0' }}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Açıklama */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '10px',
                fontWeight: '700',
                color: '#e0e0e0',
                fontSize: '14px',
              }}
            >
              💬 Açıklama *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Olayı detaylı açıklayınız..."
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '2px solid #444',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: 'inherit',
                minHeight: '100px',
                resize: 'vertical',
                backgroundColor: '#1f1f1f',
                color: '#e0e0e0',
                transition: 'all 0.3s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#004B49'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#444'}
            />
          </div>

          {/* Resim Yükle */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '10px',
                fontWeight: '700',
                color: '#e0e0e0',
                fontSize: '14px',
              }}
            >
              📸 Resim (Opsiyonel)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px dashed #C4A57B',
                borderRadius: '12px',
                backgroundColor: 'rgba(196, 165, 123, 0.1)',
                color: '#C4A57B',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(196, 165, 123, 0.2)';
                e.currentTarget.style.borderColor = '#D4B596';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(196, 165, 123, 0.1)';
                e.currentTarget.style.borderColor = '#C4A57B';
              }}
            >
              {formData.image ? '✅ Resim Yüklendi' : '📤 Resim Seç'}
            </button>
            {formData.image && (
              <img
                src={formData.image}
                alt="Preview"
                style={{
                  marginTop: '12px',
                  maxWidth: '100%',
                  maxHeight: '200px',
                  borderRadius: '12px',
                  border: '2px solid #444',
                }}
              />
            )}
          </div>

          {/* Butonlar */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '14px',
                border: '2px solid #444',
                borderRadius: '12px',
                backgroundColor: 'transparent',
                color: '#e0e0e0',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '15px',
                transition: 'all 0.3s',
              }}
              disabled={loading}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1f1f1f';
                e.currentTarget.style.borderColor = '#666';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#444';
              }}
            >
              İptal
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '14px',
                border: 'none',
                borderRadius: '12px',
                backgroundColor: '#004B49',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '15px',
                transition: 'all 0.3s',
              }}
              disabled={loading}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#003a38';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 75, 73, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#004B49';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {loading ? '⏳ Rapor Ediliyor...' : '✅ Rapor Et'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
