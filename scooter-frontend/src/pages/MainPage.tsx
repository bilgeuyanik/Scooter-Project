import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/axiosInstance';
import { jwtDecode } from 'jwt-decode';
import L from 'leaflet';
import scooterImg from '../assets/scooters.png';
import okImg from '../assets/ok.png';
import batteryImg from '../assets/battery.png';
import cuzzdanImg from '../assets/cuzdan.png';
import listImg from '../assets/list.png';
import iptalImg from '../assets/iptal.png';
import ekleImg from '../assets/ekle.png';


const getScooterIcon = (battery: number) => {
  let color = '#27ae60';
  if (battery < 30) color = '#e74c3c';
  else if (battery < 70) color = '#f1c40f';

  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-pin',
    iconSize: [24, 24],
    iconAnchor: [12, 24]
  });
};

const MainPage = () => {
  const [scooters, setScooters] = useState<any[]>([]);
  const [userRole, setUserRole] = useState('');
  const [activeRide, setActiveRide] = useState<any>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [showSummary, setShowSummary] = useState(false);
  const [rideSummary, setRideSummary] = useState<any>(null);
  const [rideHistory, setRideHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showBalancePanel, setShowBalancePanel] = useState(false);
  const [rideSeconds, setRideSeconds] = useState(0);
  const [pricePerMinute] = useState(2.0);
  const [currentRideBattery, setCurrentRideBattery] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newScooter, setNewScooter] = useState({ 
    unique_name: '', latitude: '', longitude: '', battery_status: 100 
  });

  const fetchUserData = async (id: number) => {
    try {
      const res = await api.get(`/users/${id}`);
      setUserBalance(res.data.balance);
    } catch (err) { console.error(err); }
  };

  const fetchScooters = async (role: string) => {
    try {
      const res = await api.get('/scooters');
      let data = res.data;
      
      //  User %20 altını göremez, Operator görsün.
      if (role === 'User') {
        data = data.filter((s: any) => s.battery_status >= 20 && s.status === 'available');
      }
      setScooters(data);
    } catch (err) { console.error(err); }
  };

  // Scooter ekleme
  const handleAddScooter = async (e: any) => {
    e.preventDefault();
    try {
      const res = await api.post('/scooters', {
        ...newScooter,
        latitude: Number(newScooter.latitude),
        longitude: Number(newScooter.longitude),
        battery_status: Number(newScooter.battery_status)
      });
      if (res.status === 201) {
        alert("Yeni scooter başarıyla eklendi!");
        setShowAddForm(false);
        setNewScooter({ unique_name: '', latitude: '', longitude: '', battery_status: 100 });
        fetchScooters(userRole);
      }
    } catch (err: any) {
      alert(err.response?.status === 403 ? "Yetkiniz yok! (403)" : "Ekleme hatası!");
    }
  };

  const fetchRideHistory = async () => {
    if (!userId) return;
    try {
      const res = await api.get(`/rides/my-rides/${userId}`);
      setRideHistory(res.data);
      setShowHistory(true);
    } catch (err) { alert("Sürüş geçmişi yüklenemedi."); }
  };

  useEffect(() => {
    if (currentRideBattery === 0 && activeRide) {
      alert("⚠️ Batarya tükendi! Güvenliğiniz için sürüş otomatik olarak sonlandırılıyor.");
      handleEndRide();
    }
  }, [currentRideBattery]);

  useEffect(() => {
    let interval: any;
    if (activeRide) {
      interval = setInterval(() => {
        setRideSeconds((prev) => {
          const nextSeconds = prev + 1;
          if (nextSeconds % 20 === 0) {
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

  const getPanelStatusStyle = () => {
    if (currentRideBattery !== null && currentRideBattery <= 10) {
      return {
        border: '2px solid #ff4757',
        boxShadow: '0 0 20px rgba(255, 71, 87, 0.6)',
        animation: 'pulse-red 1.5s infinite'
      };
    }
    return { border: '1px solid rgba(255,255,255,0.1)' };
  };

  const handleStartRide = async (scooterId: number) => {
    try {
      const res = await api.post('/rides/start', { scooterId, userId });
      if (res.status === 201) {
        setActiveRide(res.data);
        const selectedScooter = scooters.find((s: any) => s.id === scooterId);
        setCurrentRideBattery(selectedScooter?.battery_status || 100);
        fetchScooters(userRole);
      }
    } catch (err: any) { alert(err.response?.data?.message || 'Hata!'); }
  };

  const handleEndRide = async () => {
    if (!activeRide?.id) return;
    try {
      const res = await api.patch(`/rides/${activeRide.id}/end`, {
        lastBattery: currentRideBattery
      });
      if (res.status === 200) {
        setRideSummary(res.data);
        setUserBalance(res.data.remainingBalance);
        setShowSummary(true);
        setActiveRide(null);
        setCurrentRideBattery(null);
        fetchScooters(userRole);
      }
    } catch (err) { alert("Sürüş sonlandırılamadı!"); }
  };

  const handleAddBalance = async (amount: number) => {
    if (!userId) return;
    try {
      const res = await api.post('/users/add-balance', { userId, amount });
      if (res.status === 201 || res.status === 200) {
        setUserBalance(res.data.newBalance);
      }
    } catch (err) { alert("Hata!"); }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: any = jwtDecode(token);
      const id = decoded.id || decoded.sub;
      setUserRole(decoded.role);
      setUserId(id);
      fetchUserData(id);
    }
    fetchScooters(userRole);
  }, [userRole]);

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden', backgroundColor: '#ffb703' }}>
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
        `}
      </style>
      
      <header style={{ padding: '15px 40px', background: '#1e272e', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1001, position: 'relative', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
        <h2 style={{ margin: 0, fontWeight: '900', letterSpacing: '2px' }}>SCOOTER <span style={{color: '#2ecc71'}}>GO</span></h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 20px', borderRadius: '40px', fontSize: '13px', fontWeight: 'bold' }}>{userRole} MODU</span>
          
          {/* User Bakiye Butonu */}
          {userRole === 'User' && (
            <button 
              onClick={() => setShowBalancePanel(true)}
              style={{ 
                background: '#F5F1E8',
                color: '#333333',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '40px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <img src={cuzzdanImg} alt="wallet" style={{ width: '22px', height: '22px' }} />
              {userBalance} TL
            </button>
          )}
          
          {/* Operatör Butonu  */}
          {userRole === 'Operator' && (
            <button 
              onClick={() => setShowAddForm(true)}
              style={{ background: '#F1F5E8', color: 'dark-gray', border: 'none', padding: '10px 20px', borderRadius: '40px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <img src={ekleImg} alt="ekle" style={{width: '26px', height: '26px'}} /> Yeni Ekle
            </button>
          )}
        </div>
      </header>

      {/* Scooter Ekleme Formu */}
      {showAddForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 4000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)' }}>
          <style>
            {`
              .scooter-input {
                padding: 14px 16px;
                border-radius: 14px;
                border: 2px solid #e8f4f8;
                font-size: 15px;
                font-family: inherit;
                transition: all 0.3s ease;
                background: #f0f8fb;
              }
              .scooter-input:focus {
                outline: none;
                border-color: #00bcd4;
                background: white;
                box-shadow: 0 0 0 4px rgba(0, 188, 212, 0.1);
              }
              .scooter-input::placeholder {
                color: #90a4ae;
              }
              .form-group {
                display: flex;
                flex-direction: column;
                gap: 6px;
              }
              .form-label {
                font-size: 13px;
                font-weight: 600;
                color: #565656;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .submit-btn {
                padding: 14px;
                background: #004B49;
                color: white;
                border: none;
                border-radius: 14px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 15px;
                text-transform: uppercase;
                letter-spacing: 1px;
                box-shadow: 0 4px 15px rgba(0, 75, 73, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
              }
              .submit-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0, 75, 73, 0.4);
                background: #003635;
              }
              .submit-btn:active {
                transform: translateY(0);
              }
              .cancel-btn {
                padding: 14px;
                background: #565656;
                color: white;
                border: none;
                border-radius: 14px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 15px;
                text-transform: uppercase;
                letter-spacing: 1px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
              }
              .cancel-btn:hover {
                background: #3d3d3d;
                transform: translateY(-2px);
              }
            `}
          </style>
          <form onSubmit={handleAddScooter} style={{ backgroundColor: '#F5F1E8', padding: '35px', borderRadius: '20px', width: '500px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 30px 60px rgba(0,0,0,0.3)', border: '1px solid rgba(255, 183, 3, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '10px' }}>
              <img src={scooterImg} alt="Scooter" style={{ width: '150px', height: '150px', objectFit: 'contain', borderRadius: '12px' }} />
              <div>
                <h2 style={{ margin: '0 0 5px 0', color: '#565656', fontSize: '24px', fontWeight: '800' }}>Yeni Scooter Kaydı</h2>
                <p style={{ margin: 0, color: '#565656', fontSize: '13px' }}>Sisteme yeni cihaz ekleyin</p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label"> Cihaz Adı</label>
              <input 
                className="scooter-input"
                placeholder="Örn: Scooter-1,Scooter.." 
                value={newScooter.unique_name} 
                onChange={e => setNewScooter({...newScooter, unique_name: e.target.value})} 
                required 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">📍 Enlem</label>
                <input 
                  className="scooter-input"
                  placeholder="39.8143" 
                  type="number" 
                  step="any" 
                  value={newScooter.latitude} 
                  onChange={e => setNewScooter({...newScooter, latitude: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">📍 Boylam</label>
                <input 
                  className="scooter-input"
                  placeholder="32.8122" 
                  type="number" 
                  step="any" 
                  value={newScooter.longitude} 
                  onChange={e => setNewScooter({...newScooter, longitude: e.target.value})} 
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{display: 'flex', alignItems: 'center', gap: '6px'}}><img src={batteryImg} alt="battery" style={{width: '16px', height: '16px'}} /> Batarya Seviyesi (%)</label>
              <input 
                className="scooter-input"
                placeholder="100" 
                type="number" 
                min="0"
                max="100"
                value={newScooter.battery_status} 
                onChange={e => setNewScooter({
                  ...newScooter, 
                  battery_status: Math.min(100, Math.max(0, Number(e.target.value)))
                })} 
                required 
              />
              
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '15px' }}>
              <button type="submit" className="submit-btn"><img src={okImg} alt="ok" style={{width: '20px', height: '20px'}} /> Kaydet</button>
              <button type="button" onClick={() => setShowAddForm(false)} className="cancel-btn"><img src={iptalImg} alt="iptal" style={{width: '20px', height: '20px'}} /> İptal</button>
            </div>
          </form>
        </div>
      )}

      {showBalancePanel && userRole === 'User' && (
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
            <button onClick={fetchRideHistory} style={{ width: '100%', padding: '14px', borderRadius: '16px', background: '#004B49', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><img src={listImg} alt="list" style={{width: '20px', height: '20px'}} /> Sürüş Geçmişim</button>
          </div>
        </div>
      )}

      {showHistory && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 5000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)' }}>
          <style>
            {`
              .ride-card {
                background: white;
                padding: 18px;
                borderRadius: 16px;
                marginBottom: 12px;
                display: flex;
                justifyContent: space-between;
                alignItems: center;
                transition: all 0.3s ease;
                border-left: 4px solid #C4A57B;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
              }
              .ride-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 6px 16px rgba(0,0,0,0.15);
              }
              .stat-card {
                flex: 1;
                background: linear-gradient(135deg, #FAFAD2, #F5F1E8);
                padding: 20px;
                borderRadius: 14px;
                textAlign: center;
                marginRight: 12px;
                border: 1px solid rgba(196, 165, 123, 0.2);
              }
              .stat-card:last-child {
                marginRight: 0;
              }
              .stat-value {
                fontSize: 24px;
                fontWeight: 900;
                color: #C4A57B;
                marginTop: 8px;
              }
              .stat-label {
                fontSize: 12px;
                color: #565656;
                fontWeight: 600;
                letterSpacing: 0.5px;
              }
            `}
          </style>
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
                  <div className="stat-value">{rideHistory.reduce((sum: number, ride: any) => sum + ride.totalPrice, 0)} ₺</div>
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
                        <span style={{ background: '#C4A57B', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>Scooter #{ride.scooterId}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#565656' }}>📅 {new Date(ride.startTime).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: '#2ecc71' }}>{ride.totalPrice} ₺</div>
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
            <button onClick={() => setShowHistory(false)} style={{ width: '100%', padding: '14px', borderRadius: '16px', background: '#C4A57B', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s', fontSize: '15px', marginTop: '10px' }}>Kapat</button>
          </div>
        </div>
      )}

      <MapContainer center={[39.8143, 32.8122]} zoom={13} style={{ height: 'calc(100% - 65px)', width: '100%', zIndex: 1 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {scooters.map((scooter: any) => (
          <Marker 
            key={scooter.id} 
            position={[scooter.latitude, scooter.longitude]} 
            icon={getScooterIcon(scooter.battery_status)}
          >
            <Popup>
              <div style={{ textAlign: 'center', padding: '5px' }}>
                <strong style={{ fontSize: '14px' }}>{scooter.unique_name}</strong><br/>
                
                <span style={{ 
                  color: scooter.battery_status < 30 ? '#e74c3c' : '#27ae60', 
                  fontWeight: 'bold' 
                }}>
                  ⚡ %{scooter.battery_status} Batarya
                </span>

                {userRole === 'User' && !activeRide && (
                  <button onClick={() => handleStartRide(scooter.id)} style={{ width: '100%', marginTop: '10px', padding: '8px', borderRadius: '10px', background: '#2ecc71', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>BAŞLAT</button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

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
            <div style={{ fontSize: '20px', fontWeight: '900', color: currentRideBattery && currentRideBattery <= 10 ? '#ff4757' : 'white' }}>%{currentRideBattery}</div>
          </div>

          <button onClick={handleEndRide} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', marginLeft: '10px', boxShadow: '0 4px 15px rgba(231, 76, 60, 0.4)' }}>BİTİR</button>
        </div>
      )}
      
      {showSummary && rideSummary && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '32px', textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', width: '320px' }}>
            <div style={{ fontSize: '60px', marginBottom: '10px' }}>✅</div>
            <h2 style={{ margin: '0 0 10px 0', color: '#1e272e' }}>Sürüş Bitti!</h2>
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '20px', margin: '20px 0' }}>
              <div style={{ color: '#808e9b', fontSize: '14px' }}>TOPLAM ÜCRET</div>
              <div style={{ fontSize: '36px', fontWeight: '900', color: '#2ecc71' }}>{rideSummary.totalPrice} TL</div>
            </div>
            <button onClick={() => setShowSummary(false)} style={{ width: '100%', padding: '14px', background: '#3498db', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Tamam</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainPage;