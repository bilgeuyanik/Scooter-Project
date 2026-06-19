import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvent, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/axiosInstance';
import { jwtDecode } from 'jwt-decode';
import L from 'leaflet';
import { useScooters } from '../contexts/ScooterContext';
import { useIncidents } from '../contexts/IncidentContext';
import { useLocation } from '../contexts/LocationContext';
import { useNotification } from '../contexts/NotificationContext';
import { IncidentReportModal } from '../components/IncidentReportModal';
import { IncidentMarker } from '../components/IncidentMarker';
import { getIncidentTypeLabel } from '../constants/incidentTypes';



function MapClickHandler({ setModalLat, setModalLon, setShowIncidentModal }: any) {
  useMapEvent('click', (e: any) => {
    // Tıklanan element bir marker ikonu ise (leaflet-marker-icon sınıfına sahipse)
    // modalı açma, işlemi durdur ki popup açılabilsin!
    if (e.originalEvent.target.closest('.leaflet-marker-icon')) {
      return; 
    }

    const { lat, lng } = e.latlng;
    console.log('📍 Haritaya tıklandı:', lat, lng);
    setModalLat(lat);
    setModalLon(lng);
    setShowIncidentModal(true);
  });
  return null;
}

//  Harita Zoom Bölümü - Seçilen Konuma SetView
function MapFlyTo({ selectedLocation }: any) {
  const map = useMap();

  useEffect(() => {
    if (selectedLocation && map) {
      const targetLat = parseFloat(selectedLocation.lat);
      const targetLon = parseFloat(selectedLocation.lon);

      if (!isNaN(targetLat) && !isNaN(targetLon)) {
        
        map.setView([targetLat, targetLon], 16, {
          animate: false 
        });
      }
    }
  }, [selectedLocation, map]);

  return null;
}

import batteryImg from '../assets/battery.png';
import listImg from '../assets/list.png';
import cuzzdanImg from '../assets/cuzdan.png';
import medyaImg from '../assets/medya.png';
import paroleImg from '../assets/parola.png';
import telefonImg from '../assets/telefon.png';
import profileImg from '../assets/profile.png';

const getScooterIcon = (battery: number) => {
  let color = '#27ae60';
  if (battery < 30) color = '#e74c3c';
  else if (battery < 70) color = '#f1c40f';

 
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
   
    className: 'custom-pin leaflet-interactive',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

// Haversine formülü ile iki konum arasındaki mesafeyi hesapla (km cinsinden)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; 
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const UserPage = () => {
  const { scooters } = useScooters();
  const { incidents, nearbyIncidents, getNearbyIncidents, deleteIncident, isGloballyNotified } = useIncidents();
  const { userLocation, startTracking, stopTracking, isTracking } = useLocation();
  const { addNotification, unreadCount, showHistory, setShowHistory } = useNotification();
  const [userId, setUserId] = useState<number | null>(null);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [rideSeconds, setRideSeconds] = useState(0);
  const [currentRideBattery, setCurrentRideBattery] = useState<number | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [rideSummary, setRideSummary] = useState<any>(null);
  const [rideHistory, setRideHistory] = useState([]);
  const [showRideHistoryModal, setShowRideHistoryModal] = useState(false);
  const [showBalancePanel, setShowBalancePanel] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [modalLat, setModalLat] = useState(0);
  const [modalLon, setModalLon] = useState(0);
  const [reportingIncidentId, setReportingIncidentId] = useState<number | undefined>(undefined);
  const [pricePerMinute] = useState(2.0);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [userProfile, setUserProfile] = useState<any>({
    name: 'Kullanıcı',
    email: 'user@example.com',
    phone: '+90 555 XXX XXXX',
    joinDate: new Date().toLocaleDateString('tr-TR'),
    avatar: null
  });
  const notifiedIncidentsRef = useRef<Set<number>>(new Set());

  //  Arama Lokasyonu State'leri
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchRadius] = useState(10); // 10km
  const [showFilterSidebar, setShowFilterSidebar] = useState(true); // Sidebar başlangıçta açık

  // User verilerini yükle (email, phone, balance, avatar)
  const fetchUserData = async (id: number) => {
    try {
      const res = await api.get(`/users/${id}`);
      setUserBalance(res.data.balance);
      // Email, phone ve avatar'ı da yükle
      setUserProfile((prev: any) => ({
        ...prev,
        email: res.data.email || 'user@example.com',
        phone: res.data.phone || '+90 555 XXX XXXX',
        avatar: res.data.avatar || null // Database'den avatar yükle
      }));
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Kullanıcı bilgileri yüklenemedi';
      console.error('❌ Hata:', errorMsg);
      alert(errorMsg);
    }
  };

  // Sürüş geçmişi yükle
  const fetchRideHistory = async () => {
    if (!userId) return;
    try {
      const res = await api.get(`/rides/my-rides/${userId}`);
      setRideHistory(res.data);
      setShowRideHistoryModal(true);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Sürüş geçmişi yüklenemedi.';
      console.error('❌ Geçmiş yükleme hatası:', errorMsg);
      alert('❌ ' + errorMsg);
    }
  };

  // Konum Ara (Nominatim API)
  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      addNotification('Lütfen bir konum yazınız', 'warning');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=tr&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        
        setSelectedLocation({ lat, lon });
        getNearbyIncidents(lat, lon);

        console.log('🔍 Aranan konum:', {
          query: searchQuery,
          lat,
          lon,
          displayName: data[0].display_name,
        });
      } else {
        addNotification('Konum bulunamadı. Lütfen daha detaylı girin.', 'warning');
      }
    } catch (err) {
      console.error('❌ Arama hatası:', err);
      addNotification('Konum araması başarısız oldu', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  // Sürüş başlat
  const handleStartRide = async (scooterId: number) => {
    try {
      const res = await api.post('/rides/start', { scooterId, userId });
      if (res.status === 201) {
        setActiveRide(res.data);
        const selectedScooter = scooters.find((s: any) => s.id === scooterId);
        setCurrentRideBattery(selectedScooter?.battery_status || 100);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Sürüş başlatılamadı!';
      addNotification(errorMsg, 'error');
    }
  };

  // Sürüş bitir
  const handleEndRide = async () => {
    if (!activeRide?.id) return;
    try {
      const res = await api.patch(`/rides/${activeRide.id}/end`, {
        lastBattery: currentRideBattery,
      });
      if (res.status === 200) {
        setRideSummary(res.data);
        setUserBalance(res.data.remainingBalance);
        setShowSummary(true);
        setActiveRide(null);
        setCurrentRideBattery(null);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Sürüş sonlandırılamadı!';
      addNotification(errorMsg, 'error');
    }
  };

  // Bakiye ekle
  const handleAddBalance = async (amount: number) => {
    if (!userId) return;
    try {
      const res = await api.post('/users/add-balance', { userId, amount });
      if (res.status === 201 || res.status === 200) {
        setUserBalance(res.data.newBalance);
        setShowBalancePanel(false);
        addNotification(
          `Bakiyeniz ₺${amount} arttırıldı. Toplam: ₺${res.data.newBalance}`,
          'success'
        );
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Bakiye eklenirken hata oluştu!';
      addNotification(errorMsg, 'error');
    }
  };

  // Avatar Yükle - Backend'e Gönder
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
          // Canvas üzerinde resimi sıkıştır
          const canvas = document.createElement('canvas');
          const size = 200; // 200x200 boyutunda 
          canvas.width = size;
          canvas.height = size;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Resmi ortala ve doldur
            const sourceWidth = img.width;
            const sourceHeight = img.height;
            const sourceAspectRatio = sourceWidth / sourceHeight;
            const targetAspectRatio = 1;
            
            let drawWidth: number, drawHeight: number, drawX: number, drawY: number;
            
            if (sourceAspectRatio > targetAspectRatio) {
              drawHeight = sourceHeight;
              drawWidth = sourceHeight * targetAspectRatio;
              drawX = (sourceWidth - drawWidth) / 2;
              drawY = 0;
            } else {
              drawWidth = sourceWidth;
              drawHeight = sourceWidth / targetAspectRatio;
              drawX = 0;
              drawY = (sourceHeight - drawHeight) / 2;
            }
            
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight, 0, 0, size, size);
            const compressedData = canvas.toDataURL('image/jpeg', 0.65); 
            
            
            setUserProfile({ ...userProfile, avatar: compressedData });
            
           
            try {
              await api.patch('/users/update-avatar', {
                avatar: compressedData
              });
              addNotification('✓ Avatar başarıyla yüklendi!', 'success');
            } catch (err: any) {
              const errorMsg = err.response?.data?.message || 'Avatar yüklenemedi!';
              addNotification(errorMsg, 'error');
              // Başarısızlık durumunda state'i geri al
              setUserProfile({ ...userProfile, avatar: null });
            }
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Şifre değiştir
  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword || !currentPassword) {
      alert('Lütfen tüm alanları doldurunuz!');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Yeni şifreler eşleşmiyor!');
      return;
    }

    try {
      await api.patch('/users/change-password', {
        currentPassword,
        newPassword
      });
      alert('✓ Şifre başarıyla değiştirildi!');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Şifre değiştirilemedi!');
    }
  };

  // Telefon numarası güncelle
  const handleUpdatePhone = async () => {
    if (!newPhone) {
      alert('Lütfen telefon numarası giriniz!');
      return;
    }

    try {
      await api.patch('/users/update-phone', {
        phone: newPhone
      });
      alert('✓ Telefon numarası başarıyla güncellendi!');
      setUserProfile((prev: any) => ({ ...prev, phone: newPhone }));
      setShowPhoneModal(false);
      setNewPhone('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Telefon numarası güncellenemedi!';
      console.error('❌ Telefon güncelleme hatası:', errorMsg);
      alert('❌ ' + errorMsg);
    }
  };

  // Token'dan user info al ve component mount'ta çalış
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: any = jwtDecode(token);
      const id = decoded.id || decoded.sub;
      const name = decoded.name || decoded.username || 'Kullanıcı';
      console.log('🔐 Token decoded - UserId:', id, 'Username:', name);
      setUserId(id);
    }

    // Konum takibini başlat (sadece component mount'ta)
    startTracking();

    return () => {
      stopTracking();
    };
  }, []);

  // userId değiştiğinde profile'ı güncelle
  useEffect(() => {
    if (userId) {
      console.log('👤 UserId değişti. Profil bilgileri yükleniyor...', userId);
      
      // Tüm önceki user avatar'larını localStorage'dan temizle
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('userAvatar_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Profile'ı sıfırla ve yeni user'ın verilerini yükle
      const newProfile = {
        name: 'Kullanıcı',
        email: 'user@example.com',
        phone: '+90 555 XXX XXXX',
        joinDate: new Date().toLocaleDateString('tr-TR'),
        avatar: null as string | null
      };
      setUserProfile(newProfile);
      
      // Token'dan name'i al
      const token = localStorage.getItem('token');
      if (token) {
        const decoded: any = jwtDecode(token);
        const name = decoded.name || decoded.username || 'Kullanıcı';
        newProfile.name = name;
      }
      
      // Backend'den user bilgilerini yükle (email, phone, balance, avatar)
      fetchUserData(userId);
    }
  }, [userId]);

  // Konum değiştiğinde yakındaki olayları talep et
  // SADECE manuel arama (selectedLocation) yapılırsa getNearbyIncidents emit et
  useEffect(() => {
    console.log('🔄 useEffect 1 trigger - Konum değişti');
    console.log('   selectedLocation:', selectedLocation);
    if (selectedLocation) {
      console.log('📍 getNearbyIncidents socket emit - selectedLocation');
      getNearbyIncidents(selectedLocation.lat, selectedLocation.lon);
    } else {
      console.log('⚠️ selectedLocation null, API emit etme (userLocation ignored)');
    }
  }, [selectedLocation?.lat, selectedLocation?.lon]);

  
  useEffect(() => {
    console.log('🔄 useEffect 2 trigger - nearbyIncidents:', nearbyIncidents.length, 'items');
    
    // Arama yapılmadıysa çık
    if (!selectedLocation || nearbyIncidents.length === 0) {
      // Konum değiştiğinde  ref'i sıfırlama, olayların geçmişini tutmaya devam et
      return;
    }

    // Önce aktif olayları belirle 
    const activeNearbyIncidents = nearbyIncidents.filter((incident) => {
      if (incident.isResolved) return false;
      const distance = calculateDistance(
        selectedLocation.lat,
        selectedLocation.lon,
        incident.lat,
        incident.lon
      );
      return distance <= 10;
    });

    // Eğer bu konum için İLK defa olayları çekiyorsak, onları SESSİZCE ref'e kaydet 
    // Ref'in içi boşsa, demek ki sisteme yeni girdik veya harita yeni yüklendi
    if (notifiedIncidentsRef.current.size === 0) {
      console.log('🔇 İlk yükleme: Tüm mevcut olaylar sessizce kaydediliyor.');
      activeNearbyIncidents.forEach(incident => notifiedIncidentsRef.current.add(incident.id));
      return; 
    }

    //Sistem zaten çalışıyor ve ref'in içi doluysa, GELENLERİN "YENİ" OLUP OLMADIĞINA BAK
    activeNearbyIncidents.forEach((incident) => {
      const alreadyNotified = notifiedIncidentsRef.current.has(incident.id);
      
      // Eğer incident zaten socket:created event'ten GLOBAL notification olarak bildirilmişse → popup YOK
      // Çünkü IncidentContext'teki isGloballyNotified kontrol eder
      const isAlreadyGlobalNotified = isGloballyNotified(incident.id);
      
      // Eğer olay ref'te yoksa VE GLOBAL olarak kaydedilmemişse, bu GERÇEKTEN YENİ bir olaydır
      if (!alreadyNotified && !isAlreadyGlobalNotified) {
        const locationInfo = `📍 ${incident.address || 'Bilinmeyen konum'}`;
        const descInfo = incident.description ? ` • ${incident.description}` : '';
        const typeLabel = getIncidentTypeLabel(incident.type);
        const title = `🚨 YENİ: ${typeLabel} Olayı Bildirildi!`;
        
        addNotification(
          `${locationInfo}${descInfo}`,
          'incident',
          undefined,
          title
        );
        
        
        notifiedIncidentsRef.current.add(incident.id);
        console.log('✅ YENİ olay bildirimi gönderildi:', incident.id);
      } else if (isAlreadyGlobalNotified) {
        console.log('🔇 Bu incident zaten GLOBAL notification olarak bildirildi, popup gösterilmeyecek:', incident.id);
        notifiedIncidentsRef.current.add(incident.id);
      }
    });

    //Çözülen veya 10km dışına çıkan olayları ref'ten temizle 
    const currentActiveIds = new Set(activeNearbyIncidents.map(i => i.id));
    notifiedIncidentsRef.current = new Set(
      Array.from(notifiedIncidentsRef.current).filter(id => currentActiveIds.has(id))
    );

  }, [nearbyIncidents, selectedLocation?.lat, selectedLocation?.lon]);

  // Batarya tükendi kontrolü
  useEffect(() => {
    if (currentRideBattery === 0 && activeRide) {
      alert('⚠️ Batarya tükendi! Güvenliğiniz için sürüş otomatik olarak sonlandırılıyor.');
      handleEndRide();
    }
  }, [currentRideBattery]);

  // Sürüş timer
  useEffect(() => {
    let interval: any;
    if (activeRide) {
      interval = setInterval(() => {
        setRideSeconds((prev) => {
          const nextSeconds = prev + 1;
          if (nextSeconds % 150 === 0) {
            setCurrentRideBattery((prevBat) => (prevBat && prevBat > 0 ? prevBat - 1 : prevBat));
          }
          return nextSeconds;
        });
      }, 1000);
    } else {
      setRideSeconds(0);
      setCurrentRideBattery(null);
      if (interval) clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [activeRide]);

 

  // Mevcut scooterları filtrele (User: %20+ batarya ve available)
  const filteredScooters = scooters.filter((s: any) => {
    const isAvailable = s.battery_status >= 20 && s.status === 'available';
    
    // Seçilen konum varsa, o konuma yakın olanları göster (10km)
    if (selectedLocation) {
      const distance = calculateDistance(
        selectedLocation.lat,
        selectedLocation.lon,
        s.latitude,
        s.longitude
      );
      return isAvailable && distance <= searchRadius; // 10km içinde
    }
    
    // Seçilen konum yoksa tümünü göster
    return isAvailable;
  });

  const getPanelStatusStyle = () => {
    if (currentRideBattery !== null && currentRideBattery <= 10) {
      return {
        border: '2px solid #ff4757',
        boxShadow: '0 0 20px rgba(255, 71, 87, 0.6)',
        animation: 'pulse-red 1.5s infinite',
      };
    }
    return {};
  };

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden', backgroundColor: '#1e272e' }}>
      <style>
        {`
          @keyframes pulse-red {
            0% { box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.7); }
            70% { box-shadow: 0 0 0 15px rgba(255, 71, 87, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 71, 87, 0); }
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .ride-card {
            background: white;
            padding: 18px;
            border-radius: 16px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s ease;
            border-left: 4px solid #004B49;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }
          .ride-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 6px 16px rgba(0,0,0,0.15);
            border-left-color: #2ecc71;
          }
          .stat-card {
            flex: 1;
            background: linear-gradient(135deg, #F5F1E8 0%, #F0F8FB 100%);
            padding: 20px;
            border-radius: 14px;
            text-align: center;
            border: 2px solid #e8f4f8;
            transition: all 0.3s ease;
          }
          .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 20px rgba(0, 75, 73, 0.15);
          }
          .stat-value {
            font-size: 24px;
            font-weight: 900;
            color: #004B49;
            margin-top: 8px;
          }
          .stat-label {
            font-size: 12px;
            color: #565656;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
        `}
      </style>

      {/* Header */}
      <header style={{ padding: '15px 40px', background: '#1e272e', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1001, position: 'relative', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', gap: '20px' }}>
        <h2 style={{ margin: 0, fontWeight: '900', letterSpacing: '2px', flexShrink: 0 }}>SCOOTER <span style={{ color: '#2ecc71' }}>GO</span></h2>
        
        {/* Nominatim Arama Formu - Ortada */}
        <form onSubmit={handleSearchLocation} style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '500px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 Şehir, cadde, konum ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: '1px solid #444',
              borderRadius: '6px',
              fontSize: '13px',
              fontFamily: 'inherit',
              backgroundColor: '#3a3a3a',
              color: '#e0e0e0',
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor = '#666';
              (e.target as HTMLInputElement).style.backgroundColor = '#444';
              (e.target as HTMLInputElement).style.boxShadow = '0 0 10px rgba(0, 75, 73, 0.3)';
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor = '#444';
              (e.target as HTMLInputElement).style.backgroundColor = '#3a3a3a';
              (e.target as HTMLInputElement).style.boxShadow = 'none';
            }}
          />
          <button
            type="submit"
            disabled={isSearching}
            style={{
              padding: '10px 16px',
              backgroundColor: isSearching ? '#666' : '#004b49',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isSearching ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
            onMouseEnter={(e) => !isSearching && (e.currentTarget.style.backgroundColor = '#005d5b')}
            onMouseLeave={(e) => !isSearching && (e.currentTarget.style.backgroundColor = '#004b49')}
          >
            {isSearching ? '⏳' : 'Ara'}
          </button>
        </form>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexShrink: 0 }}>
          <button onClick={() => setShowUserSettings(true)} style={{ background: 'none', border: '2px solid #1e272e', borderRadius: '50%', width: '42px', height: '42px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundImage: userProfile.avatar ? `url(${userProfile.avatar})` : 'linear-gradient(135deg, #004B49, #2ecc71)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', transition: 'all 0.3s ease', boxShadow: '0 2px 8px rgba(0, 75, 73, 0.3)', WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 75, 73, 0.5)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 75, 73, 0.3)'; }} title="Hesabım">
            {!userProfile.avatar && <img src={profileImg} alt="profile" style={{ width: '20px', height: '20px' }} />}
          </button>

          {/* Bildirim Zili */}
          <button 
            onClick={() => setShowHistory(!showHistory)} 
            style={{ 
              position: 'relative',
              background: 'none', 
              border: '2px solid #2ecc71', 
              borderRadius: '50%', 
              width: '42px', 
              height: '42px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '20px',
              transition: 'all 0.3s ease', 
              boxShadow: '0 2px 8px rgba(46, 204, 113, 0.3)',
            }} 
            onMouseEnter={(e) => { 
              e.currentTarget.style.transform = 'scale(1.1)'; 
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(46, 204, 113, 0.6)';
              e.currentTarget.style.background = 'rgba(46, 204, 113, 0.1)';
            }} 
            onMouseLeave={(e) => { 
              e.currentTarget.style.transform = 'scale(1)'; 
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(46, 204, 113, 0.3)';
              e.currentTarget.style.background = 'none';
            }} 
            title={`${unreadCount} yeni bildirim`}
          >
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: '#e74c3c',
                color: 'white',
                borderRadius: '50%',
                width: '22px',
                height: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                border: '2px solid #1e272e',
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          <button onClick={() => setShowBalancePanel(true)} style={{ background: '#F5F1E8', color: '#333333', border: 'none', padding: '10px 16px', borderRadius: '40px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={cuzzdanImg} alt="wallet" style={{ width: '22px', height: '22px' }} />
            {userBalance} TL
          </button>
        </div>
      </header>

      {/* Filtre Sidebar - Yakın Scooterlar ve Olaylar + Arama */}
      <div style={{
        position: 'fixed',
        top: '80px',
        left: '0px',
        zIndex: 11,
        width: '300px',
        height: 'calc(100vh - 140px)',
        backgroundColor: '#2d2d2d',
        borderRadius: '0px 8px 8px 0px',
        boxShadow: '2px 2px 8px rgba(0,0,0,0.3)',
        fontFamily: 'inherit',
        border: '1px solid #444',
        borderLeft: 'none',
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'auto',
        overflow: 'hidden',
      }}>
          {/* Toggle Button */}
          {showFilterSidebar && (
            <div style={{
              padding: '8px 12px',
              borderBottom: '1px solid #444',
              display: 'flex',
              justifyContent: 'flex-end',
              flexShrink: 0,
            }}>
              <button
                onClick={() => setShowFilterSidebar(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#888',
                }}
              >
                ✕
              </button>
            </div>
          )}
          {!showFilterSidebar && (
            <div style={{
              padding: '8px 12px',
              borderBottom: '1px solid #444',
              display: 'flex',
              justifyContent: 'flex-end',
              flexShrink: 0,
              pointerEvents: 'auto',
            }}>
              <button
                onClick={() => setShowFilterSidebar(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#888',
                }}
              >
                ☰
              </button>
            </div>
          )}

          {/* Content Container - Scooterlar ve Olaylar */}
          {showFilterSidebar && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              pointerEvents: 'auto',
            }}>
              {/* Yakın Scooterlar */}
              <div style={{ 
                flex: 1, 
                padding: '12px 16px',
                borderBottom: '1px solid #444',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#e0e0e0',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  🚲 Scooterlar ({filteredScooters.length})
                </div>
                {filteredScooters.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filteredScooters.map((scooter: any) => {
                      if (!selectedLocation) return null;
                      const distance = calculateDistance(
                        selectedLocation.lat,
                        selectedLocation.lon,
                        scooter.latitude,
                        scooter.longitude
                      );
                      return (
                        <div
                          key={scooter.id}
                          onClick={() => {
                            // Scooter'a zoom
                            console.log('🚲 Scooter seçildi:', scooter.unique_name);
                          }}
                          style={{
                            padding: '8px',
                            backgroundColor: '#333',
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            border: '1px solid #444',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = '#3a3a3a';
                            (e.currentTarget as HTMLElement).style.borderColor = '#555';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = '#333';
                            (e.currentTarget as HTMLElement).style.borderColor = '#444';
                          }}
                        >
                          <div style={{ fontWeight: '600', color: '#e0e0e0' }}>
                            {scooter.unique_name}
                          </div>
                          <div style={{ color: '#b0b0b0', fontSize: '10px' }}>
                            🔋 {scooter.battery_status}% • 📏 {distance.toFixed(2)}km
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: '#888' }}>
                    Yakında scooter yok
                  </div>
                )}
              </div>

              {/* Yakın Olaylar */}
              <div style={{ 
                flex: 1, 
                padding: '12px 16px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#e0e0e0',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              🚨 Olaylar ({selectedLocation ? incidents.filter((i: any) => {
                if (i.isResolved) return false;
                const d = calculateDistance(selectedLocation.lat, selectedLocation.lon, i.lat, i.lon);
                return d <= searchRadius;
              }).length : 0})
            </div>
            {selectedLocation && incidents
              .filter((i: any) => {
                if (i.isResolved) return false;
                const d = calculateDistance(selectedLocation.lat, selectedLocation.lon, i.lat, i.lon);
                return d <= searchRadius;
              })
              .length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {incidents
                  .filter((i: any) => {
                    if (i.isResolved) return false;
                    if (!selectedLocation) return false;
                    const d = calculateDistance(selectedLocation.lat, selectedLocation.lon, i.lat, i.lon);
                    return d <= searchRadius;
                  })
                  .map((incident: any) => {
                    if (!selectedLocation) return null;
                    const distance = calculateDistance(
                      selectedLocation.lat,
                      selectedLocation.lon,
                      incident.lat,
                      incident.lon
                    );
                    const typeLabel = getIncidentTypeLabel(incident.type);
                    return (
                      <div
                        key={incident.id}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          console.log('🚨 Olay seçildi:', typeLabel);
                          // Incident'ı haritada ortala
                          setSelectedLocation({ lat: incident.lat, lon: incident.lon });
                          // Rapor modal'ını aç
                          setModalLat(incident.lat);
                          setModalLon(incident.lon);
                          setShowIncidentModal(true);
                        }}
                        style={{
                          padding: '8px',
                          backgroundColor: '#333',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          border: '1px solid #444',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = '#3a3a3a';
                          (e.currentTarget as HTMLElement).style.borderColor = '#555';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = '#333';
                          (e.currentTarget as HTMLElement).style.borderColor = '#444';
                        }}
                      >
                        <div style={{ fontWeight: '600', color: '#e0e0e0' }}>
                          🚨 {typeLabel}
                        </div>
                        <div style={{ color: '#b0b0b0', fontSize: '10px' }}>
                          📍 {incident.address?.substring(0, 30)}... • 📏 {distance.toFixed(2)}km
                        </div>
                      </div>
                    );
                  })
                  .filter((item: any) => item !== null)}
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: '#888' }}>
                {!selectedLocation ? 'Konum seçiniz' : 'Yakında olay yok'}
              </div>
            )}
              </div>
            </div>
          )}
        </div>

      {/* Harita Wrapper - Sidebar'ın 300px sol alanını koy */}
      <div style={{ 
        marginTop: '0',
        marginLeft: '300px',
        height: 'calc(100vh - 75px)',
        width: 'calc(100% - 300px)',
        position: 'relative',
        pointerEvents: 'auto'
      }}>
        <MapContainer 
        
  center={[userLocation?.lat || 41.0054, userLocation?.lon || 28.9758]} 
  zoom={13} 
  style={{ height: '100%', width: '100%', pointerEvents: 'auto' }}
  className="leaflet-map-container"
        >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
        
        {/* Harita tıklama handler - Olay bildirme modal açmak için */}
        <MapClickHandler setModalLat={setModalLat} setModalLon={setModalLon} setShowIncidentModal={setShowIncidentModal} />
        
        {/* Harita otomatik zoom - Seçilen konuma flyTo */}
        <MapFlyTo selectedLocation={selectedLocation} />
        
        {/* Kullanıcı Konumu Marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lon]} icon={L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          })}>
            <Popup>
              <div style={{ textAlign: 'center', fontSize: '12px' }}>
                <strong>📍 Konumunuz</strong>
                <br />
                Doğruluk: ±{(userLocation.accuracy || 0).toFixed(0)} m
                <br />
                {isTracking ? '✅ Takip Aktif' : '❌ Takip İnaktif'}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Seçilen Konum Marker */}
        {selectedLocation && (
          <Marker position={[selectedLocation.lat, selectedLocation.lon]} icon={L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          })}>
            <Popup>
              <div style={{ textAlign: 'center', fontSize: '12px' }}>
                <strong>🔍 Aranan Konum</strong>
                <br />
                Enlem: {selectedLocation.lat.toFixed(6)}
                <br />
                Boylam: {selectedLocation.lon.toFixed(6)}
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Scooter Markers */}
        {filteredScooters.map((scooter: any) => (
          <Marker 
            key={scooter.id} 
            position={[scooter.latitude, scooter.longitude]} 
            icon={getScooterIcon(scooter.battery_status)}
            zIndexOffset={1000} //scooterlar üstte durdun diye yeni eklendi
            /*eventHandlers={{
              click: (e: any) => {
                e.target.openPopup();
              }
            }}*/
          >
            <Popup>
              <div style={{ textAlign: 'center', fontSize: '12px', pointerEvents: 'auto' }}>
                <strong>{scooter.unique_name}</strong>
                <br />
                <img src={batteryImg} alt="battery" style={{ width: '16px' }} /> Batarya: {scooter.battery_status}%
                <br />
                {!activeRide ? (
                  <button onClick={() => handleStartRide(scooter.id)} style={{ marginTop: '8px', padding: '6px 12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', pointerEvents: 'auto' }}>
                    Sürüşe Başla
                  </button>
                ) : activeRide.scooterId === scooter.id ? (
                  <button onClick={handleEndRide} style={{ marginTop: '8px', padding: '6px 12px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', pointerEvents: 'auto' }}>
                    Sürüşü Bitir
                  </button>
                ) : null}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Incident Markers */}
        {incidents
          .filter((incident: any) => {
            if (!incident.isResolved) {
              // Seçilen konum varsa, o konuma yakın olanları göster
              if (selectedLocation) {
                const distance = calculateDistance(
                  selectedLocation.lat,
                  selectedLocation.lon,
                  incident.lat,
                  incident.lon
                );
                return distance <= searchRadius; 
              }
              return true; 
            }
            return false;
          })
          .map((incident: any) => (
            <IncidentMarker 
              key={incident.id} 
              incident={incident}
              onDeleteClick={(id: number) => {
                console.log('🗑️ Olay silindi:', id);
                deleteIncident(id);
              }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Aktif Sürüş Paneli */}
      {activeRide && (
        <div style={{ 
          ...getPanelStatusStyle(),
          position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', 
          zIndex: 2000, background: '#1e272e', color: 'white', padding: '20px 40px', 
          borderRadius: '60px', display: 'flex', alignItems: 'center', gap: '30px',
          transition: 'all 0.5s ease', boxShadow: '0 15px 45px rgba(0,0,0,0.4)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#2ecc71', fontWeight: 'bold', letterSpacing: '1px' }}>SÜRE</div>
            <div style={{ fontSize: '20px', fontWeight: '900' }}>{Math.floor(rideSeconds / 60)}:{(rideSeconds % 60).toString().padStart(2, '0')}</div>
          </div>
          
          <div style={{ width: '1px', height: '35px', background: 'rgba(255,255,255,0.1)' }}></div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#f1c40f', fontWeight: 'bold', letterSpacing: '1px' }}>ÜCRET</div>
            <div style={{ fontSize: '20px', fontWeight: '900' }}>{((rideSeconds / 60) * pricePerMinute).toFixed(2)} <span style={{fontSize: '12px'}}>TL</span></div>
          </div>

          <div style={{ width: '1px', height: '35px', background: 'rgba(255,255,255,0.1)' }}></div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#ff4757', fontWeight: 'bold', letterSpacing: '1px' }}>BATARYA</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: currentRideBattery && currentRideBattery <= 10 ? '#ff4757' : 'white' }}>%{currentRideBattery ?? 0}</div>
          </div>

          <button onClick={handleEndRide} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', marginLeft: '10px', boxShadow: '0 4px 15px rgba(231, 76, 60, 0.4)', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>BİTİR</button>
        </div>
      )}

      {/* Bakiye Paneli */}
      {showBalancePanel && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 4000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#F5F1E8', padding: '30px', borderRadius: '28px', width: '90%', maxWidth: '400px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', position: 'relative' }}>
            <button
              onClick={() => setShowBalancePanel(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: '#4a4a4a',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                padding: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2c2c2c';
                e.currentTarget.style.transform = 'rotate(90deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#4a4a4a';
                e.currentTarget.style.transform = 'rotate(0deg)';
              }}
            >
              ✕
            </button>
            <div style={{ fontSize: '11px', color: '#565656', fontWeight: '900', letterSpacing: '1px', marginBottom: '10px' }}>MEVCUT BAKİYE</div>
            <div style={{ fontSize: '42px', fontWeight: '900', color: '#565656', marginBottom: '20px' }}>{userBalance} <span style={{fontSize: '20px'}}>TL</span></div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button onClick={() => { handleAddBalance(50); setShowBalancePanel(false); }} style={{ flex: 1, padding: '14px', borderRadius: '16px', background: '#4a4a4a', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>+50₺</button>
              <button onClick={() => { handleAddBalance(100); setShowBalancePanel(false); }} style={{ flex: 1, padding: '14px', borderRadius: '16px', background: '#4a4a4a', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>+100₺</button>
            </div>
            <button onClick={fetchRideHistory} style={{ width: '100%', padding: '14px', borderRadius: '16px', background: '#004B49', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}><img src={listImg} alt="list" style={{width: '20px', height: '20px'}} /> Sürüş Geçmişim</button>
          </div>
        </div>
      )}

      {/* Sürüş Özeti */}
      {showSummary && rideSummary && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: '#1e272e', padding: '40px', borderRadius: '32px', textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.5)', width: '320px', border: '2px solid rgba(0, 75, 73, 0.3)' }}>
            <h2 style={{ margin: '0 0 10px 0', color: 'white' }}>Sürüş Bitti!</h2>
            <div style={{ background: 'rgba(0, 75, 73, 0.2)', padding: '20px', borderRadius: '20px', margin: '20px 0', border: '1px solid rgba(0, 212, 170, 0.3)' }}>
              <div style={{ color: '#8db8b5', fontSize: '14px' }}>TOPLAM ÜCRET</div>
              <div style={{ fontSize: '36px', fontWeight: '900', color: '#2ecc71' }}>{rideSummary.totalPrice ?? rideSummary.cost ?? 0} TL</div>
            </div>
            <button onClick={() => setShowSummary(false)} style={{ width: '100%', padding: '14px', background: '#004B49', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s ease', fontSize: '15px' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#00695f'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#004B49'; e.currentTarget.style.transform = 'translateY(0)'; }}>Tamam</button>
          </div>
        </div>
      )}

      {/* User Settings Panel  */}
      {showUserSettings && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 4500, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#F5F1E8', borderRadius: '20px', width: '80%', maxWidth: '380px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 30px 60px rgba(0,0,0,0.4)', overflow: 'hidden', position: 'relative' }}>
            
            {/* Close Button - Top Right */}
            <button
              onClick={() => setShowUserSettings(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.15)',
                color: '#1e272e',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                fontSize: '22px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                padding: 0,
                fontWeight: 'bold',
                zIndex: 1000
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.3)';
                e.currentTarget.style.transform = 'rotate(90deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.15)';
                e.currentTarget.style.transform = 'rotate(0deg)';
              }}
            >
              ✕
            </button>
            
            {/* Profil Header Section */}
            <div style={{ padding: '20px 16px', textAlign: 'center', borderBottom: '2px solid #e8f1f0' }}>
              {/* Avatar */}
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '30px' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: userProfile.avatar ? `url(${userProfile.avatar})` : 'linear-gradient(135deg, #004B49 0%, #2ecc71 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  fontWeight: '900',
                  color: 'white',
                  border: '2px solid #1e272e',
                  boxShadow: '0 8px 20px rgba(0, 75, 73, 0.25)',
                  WebkitBackfaceVisibility: 'hidden',
                  backfaceVisibility: 'hidden',
                  imageRendering: 'crisp-edges' as const
                }}>
                  {!userProfile.avatar && <img src={profileImg} alt="profile" style={{ width: '32px', height: '32px' }} />}
                </div>
                {/* Upload Button */}
                <label style={{
                  position: 'absolute',
                  bottom: '-35px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '26px',
                  height: '26px',
                  backgroundColor: 'rgba(0,0,0,0.15)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: '2px solid #1e272e',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(196, 165, 123, 0.4)'
                }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(-50%) scale(1.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(-50%)'; }}>
                  <img src={medyaImg} alt="media" style={{ width: '14px', height: '14px' }} />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                </label>
              </div>

              {/* User Info */}
              <h2 style={{ margin: '10px 0 3px 0', fontSize: '18px', color: '#1e272e', fontWeight: '900' }}>{userProfile.name}</h2>
              <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#565656' }}>{userProfile.email}</p>
              <div style={{ fontSize: '10px', color: '#808e9b', fontWeight: '600' }}>Üye olunma tarihi: {userProfile.joinDate}</div>
            </div>

            {/* Menu Sections */}
            <div style={{ padding: '12px' }}>
              
              {/* Hesap Bölümü */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', color: '#004B49', fontWeight: '900', letterSpacing: '0.5px', marginBottom: '6px', textTransform: 'uppercase' }}>Hesap Ayarları</div>
                <button style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'white',
                  border: '1px solid #e8f1f0',
                  borderLeft: '3px solid #004B49',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.3s ease',
                  marginBottom: '8px'
                }} onClick={() => setShowPasswordModal(true)} onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f8f7'; e.currentTarget.style.transform = 'translateX(4px)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={paroleImg} alt="password" style={{ width: '18px', height: '18px' }} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e272e' }}>Şifre Değiştir</div>
                      <div style={{ fontSize: '11px', color: '#808e9b' }}>Hesap güvenliğinizi güncelleyin</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '18px', color: '#004B49' }}>›</span>
                </button>

                <button style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'white',
                  border: '1px solid #e8f1f0',
                  borderLeft: '3px solid #004B49',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.3s ease',
                  marginBottom: '8px'
                }} onClick={() => { setShowPhoneModal(true); setNewPhone(userProfile.phone); }} onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f8f7'; e.currentTarget.style.transform = 'translateX(4px)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={telefonImg} alt="phone" style={{ width: '18px', height: '18px' }} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e272e' }}>İletişim Bilgileri</div>
                      <div style={{ fontSize: '11px', color: '#808e9b' }}>{userProfile.phone}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '18px', color: '#004B49' }}>›</span>
                </button>
              </div>

              {/* Logout Bölümü */}
              <div style={{ paddingTop: '12px', borderTop: '2px solid #e8f1f0' }}>
                <button onClick={() => { 
                  setShowUserSettings(false); 
                  setTimeout(() => { 
                    localStorage.removeItem('token');
                   
                    window.location.href = '/login'; 
                  }, 300); 
                }} style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: 'rgba(0, 75, 73, 0.08)',
                  border: '1px solid rgba(0, 75, 73, 0.3)',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  color: '#004B49',
                  fontWeight: '700',
                  fontSize: '13px'
                }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 75, 73, 0.15)'; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0, 75, 73, 0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                   Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sürüş Geçmişi Modal */}
      {showRideHistoryModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 5000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)' }}>
          <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '32px', width: '90%', maxWidth: '650px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 30px 60px rgba(0,0,0,0.4)' }}>
            
            {/* Header */}
            <h2 style={{ margin: '0 0 25px 0', fontSize: '26px', color: '#1e272e', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={listImg} alt="list" style={{width: '24px', height: '24px'}} /> 
              Sürüş Geçmişim
            </h2>

            {/* Stats */}
            {rideHistory.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '25px' }}>
                <div className="stat-card">
                  <div className="stat-label">TOPLAM SÜRÜŞ</div>
                  <div className="stat-value">{rideHistory.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">TOPLAM HARCAMA</div>
                  <div className="stat-value">{rideHistory.reduce((sum: number, ride: any) => sum + (ride.cost || ride.totalPrice || 0), 0)} ₺</div>
                </div>
              </div>
            )}

            {/* Rides List */}
            {rideHistory.length > 0 ? (
              <div style={{ marginBottom: '20px' }}>
                {rideHistory.map((ride: any, index: number) => (
                  <div key={ride.id} className="ride-card" style={{ animation: `fadeIn 0.3s ease ${index * 0.05}s backwards` }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ background: '#004B49', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>
                          {ride.scooter?.unique_name || `Scooter #${ride.scooterId}`}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#565656' }}>
                        📅 {ride.startTime ? new Date(ride.startTime).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Tarih yok'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: '#2ecc71' }}>{ride.cost || ride.totalPrice} ₺</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>🛴</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#565656', marginBottom: '8px' }}>Henüz sürüş geçmişi yok</div>
                <div style={{ fontSize: '13px', color: '#808e9b' }}>İlk sürüşünü başlatmak için haritaya dön</div>
              </div>
            )}

            {/* Close Button */}
            <button onClick={() => setShowRideHistoryModal(false)} style={{ width: '100%', padding: '14px', borderRadius: '16px', background: '#004B49', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s', fontSize: '15px', marginTop: '10px' }}>Kapat</button>
          </div>
        </div>
      )}

      {/* Şifre Değiştir Modal */}
      {showPasswordModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 5000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)' }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '450px', boxShadow: '0 30px 60px rgba(0,0,0,0.4)' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '22px', color: '#1e272e', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}><img src={paroleImg} alt="password" style={{ width: '24px', height: '24px' }} />Şifre Değiştir</h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: '#565656' }}>Mevcut Şifre</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '2px solid #e8f1f0', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'all 0.3s', background: 'rgba(0,0,0,0.05)' }} onFocus={(e) => e.target.style.borderColor = '#004B49'} onBlur={(e) => e.target.style.borderColor = '#e8f1f0'} placeholder="Mevcut şifrenizi giriniz" />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: '#565656' }}>Yeni Şifre</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '2px solid #e8f1f0', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'all 0.3s', background: 'rgba(0,0,0,0.05)' }} onFocus={(e) => e.target.style.borderColor = '#004B49'} onBlur={(e) => e.target.style.borderColor = '#e8f1f0'} placeholder="Yeni şifrenizi giriniz" />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: '#565656' }}>Yeni Şifre Tekrar</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '2px solid #e8f1f0', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'all 0.3s', background: 'rgba(0,0,0,0.05)' }} onFocus={(e) => e.target.style.borderColor = '#004B49'} onBlur={(e) => e.target.style.borderColor = '#e8f1f0'} placeholder="Yeni şifrenizi tekrar giriniz" />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleChangePassword} style={{ flex: 1, padding: '12px', background: '#004B49', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', transition: 'all 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#003a38'} onMouseLeave={(e) => e.currentTarget.style.background = '#004B49'}>Değiştir</button>
              <button onClick={() => { setShowPasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }} style={{ flex: 1, padding: '12px', background: '#e8f1f0', color: '#565656', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', transition: 'all 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#d0e4e2'} onMouseLeave={(e) => e.currentTarget.style.background = '#e8f1f0'}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* Telefon Güncelle Modal */}
      {showPhoneModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 5000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)' }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '450px', boxShadow: '0 30px 60px rgba(0,0,0,0.4)' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '22px', color: '#1e272e', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}><img src={telefonImg} alt="phone" style={{ width: '24px', height: '24px' }} />İletişim Bilgileri</h2>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: '#565656' }}>Telefon Numarası</label>
              <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '2px solid #e8f1f0', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'all 0.3s', background: 'rgba(0,0,0,0.05)' }} onFocus={(e) => e.target.style.borderColor = '#004B49'} onBlur={(e) => e.target.style.borderColor = '#e8f1f0'} placeholder="+90 5XX XXX XXXX" />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleUpdatePhone} style={{ flex: 1, padding: '12px', background: '#004B49', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', transition: 'all 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#003a38'} onMouseLeave={(e) => e.currentTarget.style.background = '#004B49'}>Güncelle</button>
              <button onClick={() => { setShowPhoneModal(false); setNewPhone(''); }} style={{ flex: 1, padding: '12px', background: '#e8f1f0', color: '#565656', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', transition: 'all 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#d0e4e2'} onMouseLeave={(e) => e.currentTarget.style.background = '#e8f1f0'}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* 📋 Olay Bildir Modal - Harita tıklaması sonra açılır */}
      <IncidentReportModal 
        isOpen={showIncidentModal}
        onClose={() => {
          setShowIncidentModal(false);
          setReportingIncidentId(undefined);
          setModalLat(0);
          setModalLon(0);
        }}
        initialLat={modalLat}
        initialLon={modalLon}
        incidentId={reportingIncidentId}
      />

    </div>
  );
};

export default UserPage;
