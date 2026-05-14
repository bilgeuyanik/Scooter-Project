import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import { useScooters } from '../contexts/ScooterContext';
import { INCIDENT_LABELS } from '../constants/incidentTypes';
import scooterImg from '../assets/scooters.png';
import batteryImg from '../assets/battery.png';
import ekleImg from '../assets/ekle.png';
import okImg from '../assets/ok.png';
import iptalImg from '../assets/iptal.png';
import duzenImg from '../assets/duzen.png';
import bakimImg from '../assets/bakim.png';
import analizImg from '../assets/analiz.png';
import kutuImg from '../assets/kutu.png';
import opfonImg from '../assets/opfon.png';
import robotImg from '../assets/robot.png';
import analizoperatorImg from '../assets/analizoperator.png';
import cuteImg from '../assets/cute.png';

const getScooterIcon = (battery: number) => {
  let color = '#27ae60';
  if (battery < 30) color = '#e74c3c';
  else if (battery < 70) color = '#f1c40f';

  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-pin',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });
};

const getIncidentIcon = (severity?: string) => {
  let color = '#f39c12';
  if (severity === 'Yüksek') color = '#e74c3c';
  else if (severity === 'Orta') color = '#f39c12';
  else if (severity === 'Düşük') color = '#3498db';

  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; color: white;">🚨</div>`,
    className: 'incident-pin',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
};

interface Incident {
  id: number;
  lat: number;
  lon: number;
  type: string;
  address?: string;
  description?: string;
  severity?: 'Düşük' | 'Orta' | 'Yüksek';
  operatorNotes?: string;
  briefExplanation?: string;
  report_count: number;
  createdAt: string;
  isResolved: boolean;
}

interface AnomalyAnalysisResult {
  anomalies: Array<{
    incidentIds: number[];
    pattern: string;
    severity: string;
    affectedAreas: string[];
    riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  }>;
  patterns: Array<{
    type: string;
    frequency: string;
    trend: string;
    locations: string[];
  }>;
  riskAssessment: {
    overall: 'Low' | 'Medium' | 'High' | 'Critical';
    focusAreas: string[];
    estimatedImpact: string;
  };
  recommendations: string[];
  analysisTimestamp: string;
  totalIncidentsAnalyzed: number;
}

const OperatorDashboard = () => {
  const { scooters, addScooter, deleteScooter, updateScooter } = useScooters();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingScooter, setEditingScooter] = useState<any>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'total' | 'available' | 'lowBattery' | 'maintenance' | null>(null);
  
  // Incident management states
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentFormData, setIncidentFormData] = useState({ severity: 'Orta', operatorNotes: '', briefExplanation: '' });
  const [formData, setFormData] = useState({
    unique_name: '',
    latitude: '',
    longitude: '',
    battery_status: 100,
    status: 'available',
  });
  
  // AI Analysis states
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnomalyAnalysisResult | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisDateRange, setAnalysisDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  
  const [scooterStats, setScooterStats] = useState({ total: 0, available: 0, lowBattery: 0, maintenance: 0 });

  // İstatistikleri hesapla
  useEffect(() => {
    const stats = {
      total: scooters.length,
      available: scooters.filter((s) => s.status === 'available').length,
      lowBattery: scooters.filter((s) => s.battery_status < 30).length,
      maintenance: scooters.filter((s) => s.status === 'maintenance').length,
    };
    setScooterStats(stats);
  }, [scooters]);

  // Fetch incidents from backend
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await axios.get('http://localhost:3000/incidents', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setIncidents(response.data);
      } catch (err) {
        console.error('Olaylar yüklenirken hata:', err);
      }
    };
    fetchIncidents();
  }, []);

  // Scooter ekle
  const handleAddScooter = async (e: any) => {
    e.preventDefault();
    try {
      addScooter({
        ...formData,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        battery_status: Number(formData.battery_status),
      });
      alert('✅ Scooter başarıyla eklendi!');
      setShowAddForm(false);
      setFormData({
        unique_name: '',
        latitude: '',
        longitude: '',
        battery_status: 100,
        status: 'available',
      });
    } catch (err: any) {
      alert(err.response?.status === 403 ? '❌ Yetkiniz yok! (403)' : '❌ Ekleme hatası!');
    }
  };

  // Scooter düzenle
  const handleEditScooter = (scooter: any) => {
    setEditingScooter(scooter);
    setFormData({
      unique_name: scooter.unique_name,
      latitude: scooter.latitude,
      longitude: scooter.longitude,
      battery_status: scooter.battery_status,
      status: scooter.status,
    });
    setShowEditForm(true);
  };

  // Scooter güncelleme işlemi
  const handleUpdateScooter = async (e: any) => {
    e.preventDefault();
    try {
      updateScooter({
        id: editingScooter.id,
        ...formData,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        battery_status: Number(formData.battery_status),
      });
      alert('✅ Scooter başarıyla güncellendi!');
      setShowEditForm(false);
      setEditingScooter(null);
      setFormData({
        unique_name: '',
        latitude: '',
        longitude: '',
        battery_status: 100,
        status: 'available',
      });
    } catch (err: any) {
      alert('❌ Güncelleme hatası!');
    }
  };

  // Scooter sil
  const handleDeleteScooter = (id: number) => {
    if (window.confirm('❓ Bu scooter\'ı silmek istediğinize emin misiniz?')) {
      deleteScooter(id);
      alert('✅ Scooter silindi!');
    }
  };

  // Filtrelenmiş scooterları al
  const getFilteredScooters = () => {
    if (selectedFilter === 'available') return scooters.filter((s) => s.status === 'available');
    if (selectedFilter === 'lowBattery') return scooters.filter((s) => s.battery_status < 30);
    if (selectedFilter === 'maintenance') return scooters.filter((s) => s.status === 'maintenance');
    return scooters;
  };

  const handleStatClick = (filter: 'total' | 'available' | 'lowBattery' | 'maintenance') => {
    setSelectedFilter(filter);
    setShowStatsModal(true);
  };

  // Incident handler'ları
  const handleSelectIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setIncidentFormData({
      severity: incident.severity || 'Orta',
      operatorNotes: incident.operatorNotes || '',
      briefExplanation: incident.briefExplanation || '',
    });
    setShowIncidentModal(true);
  };

  const handleUpdateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;

    try {
      const response = await axios.patch(
        `http://localhost:3000/incidents/${selectedIncident.id}`,
        incidentFormData,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      setIncidents(incidents.map(inc => inc.id === selectedIncident.id ? response.data : inc));
      alert('✅ Olay başarıyla güncellendi!');
      setShowIncidentModal(false);
      setSelectedIncident(null);
    } catch (err: any) {
      alert('❌ Güncelleme hatası!');
      console.error(err);
    }
  };

  const handleResolveIncident = async (incidentId: number) => {
    if (!window.confirm('Bu olayı çözüldü olarak işaretlemek istediğinize emin misiniz?')) return;

    try {
      await axios.patch(
        `http://localhost:3000/incidents/${incidentId}/resolve`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      // Incidents listesini güncelle - çözülen incident'ı kaldır
      setIncidents(incidents.filter(inc => inc.id !== incidentId));
      alert('✅ Olay çözüldü olarak işaretlendi!');
      setShowIncidentModal(false);
      setSelectedIncident(null);
    } catch (err) {
      alert('❌ İşlem hatası!');
      console.error(err);
    }
  };

  const handleAnalyzeIncidents = async () => {
    setAnalysisLoading(true);
    try {
      const response = await axios.post(
        `http://localhost:3000/ai-analysis/analyze?startDate=${analysisDateRange.startDate}&endDate=${analysisDateRange.endDate}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setAnalysisResults(response.data);
      setShowAnalysisModal(true);
    } catch (err: any) {
      alert('❌ Analiz hatası: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden', backgroundColor: '#ffb703' }}>
      {/* Header */}
      <header style={{ padding: '15px 40px', background: '#1e272e', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1001, position: 'relative', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
        <h2 style={{ margin: 0, fontWeight: '900', letterSpacing: '2px' }}>SCOOTER <span style={{ color: '#2ecc71' }}>GO</span></h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button onClick={() => setShowAddForm(true)} style={{ background: '#F5F1E8', color: '#004B49', border: 'none', padding: '8px 15px', borderRadius: '40px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <img src={ekleImg} alt="ekle" style={{ width: '20px', height: '20px' }} /> Yeni Ekle
          </button>
        </div>
      </header>

      {/* İstatistik Paneli */}
      <style>
        {`
          @keyframes countUp {
            0% { transform: scale(0.8); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          .leaflet-popup-content-wrapper {
            background-color: #f5f1e8b0!important;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            color: white;
          }
          .leaflet-popup-content-wrapper strong {
            color: white;
          }
          .stat-card {
            background: linear-gradient(135deg, #F5F1E8 0%, #F0F8FB 100%);
            padding: '15px', 
            borderRadius: '16px', 
            textAlign: 'center';
            border': '2px solid #e8f4f8';
            transition: all 0.3s ease;
            animation: countUp 0.6s ease-out;
          }
          .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 20px rgba(0, 75, 73, 0.15);
          }
          .stat-card h4 {
            margin: 0 0 10px 0;
            font-size: 13px;
            font-weight: 700;
            color: #565656;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .stat-card p {
            margin: 0;
            font-size: 28px;
            font-weight: 900;
            color: #004B49;
          }
        `}
      </style>
      {/* Ana Container */}
      <div style={{ display: 'flex', height: 'calc(100vh - 75px)', width: '100vw', position: 'relative' }}>
        {/* İstatistik Sidebar */}
        <div style={{ width: '280px', backgroundImage: `url(${opfonImg})`, backgroundSize: 'cover', backgroundPosition: 'center', padding: '30px 10px 15px 10px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <button onClick={() => handleStatClick('total')} style={{ background: 'linear-gradient(135deg, #F5F1E8 0%, #F0F8FB 100%)', padding: '8px 20px', borderRadius: '12px', textAlign: 'center', border: '2px solid #e8f4f8', cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 75, 73, 0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: 700, color: '#565656', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <img src={analizImg} alt="Toplam" style={{ width: '16px', height: '16px' }} />
              Toplam
            </h4>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#004B49' }}>{scooterStats.total}</p>
          </button>
          <button onClick={() => handleStatClick('available')} style={{ background: 'linear-gradient(135deg, #F5F1E8 0%, #F0F8FB 100%)', padding: '8px 20px', borderRadius: '12px', textAlign: 'center', border: '2px solid #e8f4f8', cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 75, 73, 0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: 700, color: '#565656', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <img src={okImg} alt="Müsait" style={{ width: '16px', height: '16px' }} />
              Müsait
            </h4>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#004B49' }}>{scooterStats.available}</p>
          </button>
          <button onClick={() => handleStatClick('lowBattery')} style={{ background: 'linear-gradient(135deg, #F5F1E8 0%, #F0F8FB 100%)', padding: '8px 20px', borderRadius: '12px', textAlign: 'center', border: '2px solid #e8f4f8', cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 75, 73, 0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: 700, color: '#565656', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <img src={batteryImg} alt="Düşük Pil" style={{ width: '16px', height: '16px' }} />
              Düşük Pil
            </h4>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#004B49' }}>{scooterStats.lowBattery}</p>
          </button>
          <button onClick={() => handleStatClick('maintenance')} style={{ background: 'linear-gradient(135deg, #F5F1E8 0%, #F0F8FB 100%)', padding: '8px 20px', borderRadius: '12px', textAlign: 'center', border: '2px solid #e8f4f8', cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 75, 73, 0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: 700, color: '#565656', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <img src={bakimImg} alt="Bakım" style={{ width: '16px', height: '16px' }} />
              Bakım
            </h4>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#004B49' }}>{scooterStats.maintenance}</p>
          </button>

          {/* AI Analysis Button */}
          <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <button 
              onClick={() => setShowAnalysisModal(true)}
              style={{ background: 'linear-gradient(135deg, #F5F1E8 0%, #F0F8FB 100%)', padding: '8px 20px', borderRadius: '12px', textAlign: 'center', border: '2px solid #e8f4f8', cursor: 'pointer', transition: 'all 0.3s ease', width: '100%', color: '#565656', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }} 
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 75, 73, 0.15)'; }} 
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <img src={cuteImg} alt="AI Analiz" style={{ width: '32px', height: '32px' }} />
              AI Analiz
            </button>
          </div>
        </div>

        {/* Harita */}
        <MapContainer center={[41.0054, 28.9758]} zoom={13} style={{ flex: 1, height: '100%', width: 'calc(100% - 280px)' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
        {scooters.map((scooter: any) => (
          <Marker key={scooter.id} position={[scooter.latitude, scooter.longitude]} icon={getScooterIcon(scooter.battery_status)}>
            <Popup>
              <div style={{ background: '#F5F1E8', padding: '10px', borderRadius: '12px', textAlign: 'center', minWidth: '160px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid rgba(196, 165, 123, 0.3)' }}>
                <strong style={{ fontSize: '14px', color: '#1e272e', display: 'block', marginBottom: '10px', fontWeight: '800' }}>{scooter.unique_name}</strong>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', margin: '10px 0 15px 0', fontSize: '12px', color: '#565656' }}>
                  <img src={batteryImg} alt="battery" style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontWeight: '600', color: scooter.battery_status < 30 ? '#e74c3c' : '#27ae60' }}>%{scooter.battery_status} Batarya</span>
                </div>

                <div style={{ margin: '10px 0 15px 0', fontSize: '13px', fontWeight: '600', color: '#004B49' }}>
                  {scooter.status === 'available' ? 'Müsait' : 'Meşgul'}
                </div>

                <div style={{ marginTop: '12px', display: 'flex', gap: '6px', justifyContent: 'center' }}>
                  <button onClick={() => handleEditScooter(scooter)} style={{ width: '40px', height: '40px', background: '#F5F1E8', border: '1px solid #C4A57B', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#E8E3D0'; e.currentTarget.style.transform = 'scale(1.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#F5F1E8'; e.currentTarget.style.transform = 'scale(1)'; }} title="Düzenle">
                    <img src={duzenImg} alt="Düzenle" style={{ width: '24px', height: '24px' }} />
                  </button>
                  <button onClick={() => handleDeleteScooter(scooter.id)} style={{ width: '40px', height: '40px', background: '#F5F1E8', border: '1px solid #e74c3c', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#E8E3D0'; e.currentTarget.style.transform = 'scale(1.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#F5F1E8'; e.currentTarget.style.transform = 'scale(1)'; }} title="Sil">
                    <img src={kutuImg} alt="Sil" style={{ width: '24px', height: '24px' }} />
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        {incidents.map((incident: Incident) => (
          <Marker key={`incident-${incident.id}`} position={[incident.lat, incident.lon]} icon={getIncidentIcon(incident.severity)}>
            <Popup>
              <div style={{ background: '#fff5f5', padding: '12px', borderRadius: '12px', minWidth: '180px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '2px solid #e74c3c' }}>
                <strong style={{ fontSize: '13px', color: '#e74c3c', display: 'block', marginBottom: '8px', fontWeight: '800' }}>🚨 {INCIDENT_LABELS[incident.type] || incident.type}</strong>
                
                <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#565656', fontWeight: '600' }}>Adres: {incident.address || 'Bilinmiyor'}</p>
                
                <div style={{ margin: '6px 0', fontSize: '11px', color: '#90a4ae' }}>
                  <span style={{ 
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: incident.severity === 'Yüksek' ? '#e74c3c' : incident.severity === 'Orta' ? '#f39c12' : '#3498db',
                    color: 'white',
                    fontWeight: 'bold',
                    marginRight: '6px'
                  }}>
                    {incident.severity || 'Orta'}
                  </span>
                  <span style={{ color: '#565656' }}>Rapor: {incident.report_count}</span>
                </div>

                {incident.operatorNotes && (
                  <p style={{ margin: '6px 0', fontSize: '11px', color: '#004B49', fontStyle: 'italic', backgroundColor: '#f0f8fb', padding: '6px', borderRadius: '6px' }}>
                    📝 {incident.operatorNotes}
                  </p>
                )}

                {incident.briefExplanation && (
                  <p style={{ margin: '6px 0', fontSize: '11px', color: '#004B49', backgroundColor: '#fffbf0', padding: '6px', borderRadius: '6px', borderLeft: '3px solid #f39c12' }}>
                    📄 {incident.briefExplanation}
                  </p>
                )}

                <div style={{ marginTop: '10px', display: 'flex', gap: '6px', justifyContent: 'center' }}>
                  <button 
                    onClick={() => handleSelectIncident(incident)} 
                    style={{ flex: 1, padding: '6px', background: '#004b48cd', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#003635'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#004b48cd'; }}
                  >
                    ✏️ Düzenle
                  </button>
                  <button 
                    onClick={() => handleResolveIncident(incident.id)} 
                    style={{ flex: 1, padding: '6px', background: '#1e272ed1', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#1e272e'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#1e272ed1'; }}
                  >
                     Çöz
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        </MapContainer>
      </div>

      {/* İstatistik Detay Modal */}
      {showStatsModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 4000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)' }}>
          <div style={{ position: 'relative', backgroundColor: '#F5F1E8', padding: '35px', borderRadius: '20px', width: '600px', maxHeight: '70vh', overflow: 'auto', boxShadow: '0 30px 60px rgba(0,0,0,0.3)', border: '1px solid rgba(255, 183, 3, 0.2)' }}>
            <button
              onClick={() => setShowStatsModal(false)}
              style={{
                position: 'absolute',
                top: '25px',
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
            <div style={{ marginBottom: '25px' }}>
              <h2 style={{ margin: 0, color: '#565656', fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {selectedFilter === 'total' && (<><img src={analizImg} alt="" style={{ width: '24px', height: '24px' }} /> Tüm Scooterlar</>)}
                {selectedFilter === 'available' && (<><img src={okImg} alt="" style={{ width: '24px', height: '24px' }} /> Müsait Scooterlar</>)}
                {selectedFilter === 'lowBattery' && (<><img src={batteryImg} alt="" style={{ width: '24px', height: '24px' }} /> Düşük Pil Scooterlar</>)}
                {selectedFilter === 'maintenance' && (<><img src={bakimImg} alt="" style={{ width: '24px', height: '24px' }} /> Bakım Scooterlar</>)}
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {getFilteredScooters().length > 0 ? (
                getFilteredScooters().map((scooter: any) => (
                  <div key={scooter.id} style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '2px solid #e8f4f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: '#565656', fontSize: '16px', fontWeight: 'bold' }}>{scooter.unique_name}</h4>
                      <p style={{ margin: '0 0 3px 0', color: '#90a4ae', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}><img src={analizImg} alt="" style={{ width: '14px', height: '14px' }} /> Lat: {scooter.latitude.toFixed(4)}, Lon: {scooter.longitude.toFixed(4)}</p>
                      <p style={{ margin: '0 0 3px 0', color: '#90a4ae', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}><img src={batteryImg} alt="" style={{ width: '14px', height: '14px' }} /> Batarya: {scooter.battery_status}%</p>
                      <p style={{ margin: 0, color: '#90a4ae', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {scooter.status === 'available' ? <><img src={okImg} alt="" style={{ width: '14px', height: '14px' }} /> Müsait</> : <><img src={bakimImg} alt="" style={{ width: '14px', height: '14px' }} /> Bakım</>}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button onClick={() => { handleEditScooter(scooter); setShowStatsModal(false); }} style={{ padding: 0, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}><img src={duzenImg} alt="Düzenle" style={{ width: '26px', height: '26px' }} /></button>
                      <button onClick={() => { handleDeleteScooter(scooter.id); setShowStatsModal(false); }} style={{ padding: 0, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}><img src={kutuImg} alt="Sil" style={{ width: '26px', height: '26px' }} /></button>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', color: '#90a4ae', padding: '20px' }}> Bu kategoride scooter bulunamadı</p>
              )}
            </div>
          </div>
        </div>
      )}

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
                width: 100%;
                box-sizing: border-box;
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
                <h2 style={{ margin: '0 0 5px 0', color: '#565656', fontSize: '24px', fontWeight: '800' }}>Yeni Scooter Ekle</h2>
                <p style={{ margin: 0, color: '#565656', fontSize: '13px' }}>Sisteme yeni cihaz ekleyin</p>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#565656', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>Cihaz Adı</label>
              <input 
                type="text"
                placeholder="Örn: Scooter-1" 
                value={formData.unique_name}
                onChange={(e) => setFormData({ ...formData, unique_name: e.target.value })}
                required
                style={{ width: '100%', border: 'none', borderBottom: '2px solid #e8f4f8', background: 'transparent', padding: '8px 0', fontSize: '15px', fontFamily: 'inherit', transition: 'all 0.3s ease', outline: 'none' }}
                onFocus={(e) => { e.currentTarget.style.borderBottomColor = '#00bcd4'; }}
                onBlur={(e) => { e.currentTarget.style.borderBottomColor = '#e8f4f8'; }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontWeight: '600', color: '#565656', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>📍 Enlem</div>
                <input 
                  type="number"
                  step="0.00001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="41.0054"
                  required
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '2px solid #e8f4f8', fontSize: '15px', fontFamily: 'inherit', transition: 'all 0.3s ease', background: '#f0f8fb', boxSizing: 'border-box' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#00bcd4'; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 188, 212, 0.1)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e8f4f8'; e.currentTarget.style.background = '#f0f8fb'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <div style={{ fontWeight: '600', color: '#565656', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>📍 Boylam</div>
                <input 
                  type="number"
                  step="0.00001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="28.9758"
                  required
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '2px solid #e8f4f8', fontSize: '15px', fontFamily: 'inherit', transition: 'all 0.3s ease', background: '#f0f8fb', boxSizing: 'border-box' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#00bcd4'; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 188, 212, 0.1)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e8f4f8'; e.currentTarget.style.background = '#f0f8fb'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            <div>
              <div style={{ fontWeight: '600', color: '#565656', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <img src={batteryImg} alt="battery" style={{ width: '16px', height: '16px' }} /> Batarya Seviyesi (%)
              </div>
              <input 
                type="number"
                min="0"
                max="100"
                value={formData.battery_status}
                onChange={(e) => setFormData({ ...formData, battery_status: Math.min(100, Math.max(0, Number(e.target.value))) })}
                required
                style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '2px solid #e8f4f8', fontSize: '15px', fontFamily: 'inherit', transition: 'all 0.3s ease', background: '#f0f8fb', boxSizing: 'border-box' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#00bcd4'; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 188, 212, 0.1)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e8f4f8'; e.currentTarget.style.background = '#f0f8fb'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            <div>
              <div style={{ fontWeight: '600', color: '#565656', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Durum</div>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '2px solid #e8f4f8', fontSize: '15px', fontFamily: 'inherit', transition: 'all 0.3s ease', background: '#f0f8fb', boxSizing: 'border-box' }}
              >
                <option value="available">Müsait</option>
                <option value="maintenance">Bakım</option>
              </select>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '15px' }}>
              <button type="submit" style={{ padding: '14px', background: '#004B49', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s ease', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 4px 15px rgba(0, 75, 73, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 75, 73, 0.4)'; e.currentTarget.style.background = '#003635'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 75, 73, 0.3)'; e.currentTarget.style.background = '#004B49'; }}>
                <img src={okImg} alt="ok" style={{ width: '20px', height: '20px' }} /> Kaydet
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} style={{ padding: '14px', background: '#565656', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s ease', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#3d3d3d'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#565656'; }}>
                <img src={iptalImg} alt="iptal" style={{ width: '20px', height: '20px' }} /> İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Scooter Güncelleme Formu */}
      {showEditForm && editingScooter && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 4000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)' }}>
          <form onSubmit={handleUpdateScooter} style={{ backgroundColor: '#F5F1E8', padding: '35px', borderRadius: '20px', width: '500px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 30px 60px rgba(0,0,0,0.3)', border: '1px solid rgba(255, 183, 3, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <img src={duzenImg} alt="Düzenle" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
              <div>
                <h2 style={{ margin: '0 0 5px 0', color: '#565656', fontSize: '24px', fontWeight: '800' }}>Scooter Düzenle</h2>
                <p style={{ margin: 0, color: '#565656', fontSize: '13px' }}>Cihaz bilgilerini güncelleyin</p>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#565656', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>Cihaz Adı</label>
              <input 
                type="text"
                placeholder="Örn: Scooter-1" 
                value={formData.unique_name}
                onChange={(e) => setFormData({ ...formData, unique_name: e.target.value })}
                required
                style={{ width: '100%', border: 'none', borderBottom: '2px solid #e8f4f8', background: 'transparent', padding: '8px 0', fontSize: '15px', fontFamily: 'inherit', transition: 'all 0.3s ease', outline: 'none' }}
                onFocus={(e) => { e.currentTarget.style.borderBottomColor = '#00bcd4'; }}
                onBlur={(e) => { e.currentTarget.style.borderBottomColor = '#e8f4f8'; }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontWeight: '600', color: '#565656', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>📍 Enlem</div>
                <input 
                  type="number"
                  step="0.00001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="41.0054"
                  required
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '2px solid #e8f4f8', fontSize: '15px', fontFamily: 'inherit', transition: 'all 0.3s ease', background: '#f0f8fb', boxSizing: 'border-box' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#00bcd4'; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 188, 212, 0.1)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e8f4f8'; e.currentTarget.style.background = '#f0f8fb'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <div style={{ fontWeight: '600', color: '#565656', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>📍 Boylam</div>
                <input 
                  type="number"
                  step="0.00001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="28.9758"
                  required
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '2px solid #e8f4f8', fontSize: '15px', fontFamily: 'inherit', transition: 'all 0.3s ease', background: '#f0f8fb', boxSizing: 'border-box' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#00bcd4'; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 188, 212, 0.1)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e8f4f8'; e.currentTarget.style.background = '#f0f8fb'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            <div>
              <div style={{ fontWeight: '600', color: '#565656', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <img src={batteryImg} alt="battery" style={{ width: '16px', height: '16px' }} /> Batarya Seviyesi (%)
              </div>
              <input 
                type="number"
                min="0"
                max="100"
                value={formData.battery_status}
                onChange={(e) => setFormData({ ...formData, battery_status: Math.min(100, Math.max(0, Number(e.target.value))) })}
                required
                style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '2px solid #e8f4f8', fontSize: '15px', fontFamily: 'inherit', transition: 'all 0.3s ease', background: '#f0f8fb', boxSizing: 'border-box' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#00bcd4'; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 188, 212, 0.1)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e8f4f8'; e.currentTarget.style.background = '#f0f8fb'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            <div>
              <div style={{ fontWeight: '600', color: '#565656', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Durum</div>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '2px solid #e8f4f8', fontSize: '15px', fontFamily: 'inherit', transition: 'all 0.3s ease', background: '#f0f8fb', boxSizing: 'border-box' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#00bcd4'; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 188, 212, 0.1)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e8f4f8'; e.currentTarget.style.background = '#f0f8fb'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <option value="available">Müsait</option>
                <option value="maintenance">Bakım</option>
              </select>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '15px' }}>
              <button type="submit" style={{ padding: '14px', background: '#004B49', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s ease', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 4px 15px rgba(0, 75, 73, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 75, 73, 0.4)'; e.currentTarget.style.background = '#003635'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 75, 73, 0.3)'; e.currentTarget.style.background = '#004B49'; }}>
                <img src={okImg} alt="ok" style={{ width: '20px', height: '20px' }} /> Güncelle
              </button>
              <button type="button" onClick={() => setShowEditForm(false)} style={{ padding: '14px', background: '#565656', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s ease', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#3d3d3d'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#565656'; }}>
                <img src={iptalImg} alt="iptal" style={{ width: '20px', height: '20px' }} /> İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Olay Zenginleştirme Modal */}
      {showIncidentModal && selectedIncident && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 4000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)' }}>
          <form onSubmit={handleUpdateIncident} style={{ position: 'relative', backgroundColor: '#F5F1E8', padding: '35px', borderRadius: '20px', width: '550px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 30px 60px rgba(0,0,0,0.3)', border: '1px solid rgba(255, 183, 3, 0.2)' }}>
            <button
              type="button"
              onClick={() => { setShowIncidentModal(false); setSelectedIncident(null); }}
              style={{
                position: 'absolute',
                top: '25px',
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
              onMouseEnter={(e) => { e.currentTarget.style.background = '#2c2c2c'; e.currentTarget.style.transform = 'rotate(90deg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#4a4a4a'; e.currentTarget.style.transform = 'rotate(0deg)'; }}
            >
              ✕
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{ fontSize: '40px' }}>🚨</div>
              <div>
                <h2 style={{ margin: '0 0 5px 0', color: '#565656', fontSize: '24px', fontWeight: '800' }}>Olay Düzenle</h2>
                <p style={{ margin: 0, color: '#565656', fontSize: '13px' }}>{INCIDENT_LABELS[selectedIncident.type] || selectedIncident.type} - {selectedIncident.address || 'Bilinmiyor'}</p>
              </div>
            </div>

            <div style={{ backgroundColor: '#f0f8fb', padding: '12px', borderRadius: '12px', borderLeft: '4px solid #00bcd4' }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: '600', color: '#00bcd4', textTransform: 'uppercase' }}>İstatistikler</p>
              <p style={{ margin: '0', fontSize: '13px', color: '#565656' }}>
                📊 Rapor Sayısı: <strong>{selectedIncident.report_count}</strong> | 
                📅 Tarih: <strong>{new Date(selectedIncident.createdAt).toLocaleDateString('tr-TR')}</strong>
              </p>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#565656', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>⚠️ Önem Seviyesi</label>
              <select
                value={incidentFormData.severity}
                onChange={(e) => setIncidentFormData({ ...incidentFormData, severity: e.target.value })}
                style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '2px solid #e8f4f8', fontSize: '15px', fontFamily: 'inherit', transition: 'all 0.3s ease', background: '#f0f8fb', boxSizing: 'border-box' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#00bcd4'; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 188, 212, 0.1)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e8f4f8'; e.currentTarget.style.background = '#f0f8fb'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <option value="Düşük">🟦 Düşük - Küçük Sorun</option>
                <option value="Orta">🟨 Orta - Dikkat Gerekli</option>
                <option value="Yüksek">🟥 Yüksek - Acil Müdahale</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#565656', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>📝 Operator Notları</label>
              <textarea
                placeholder="Örn: Kilitli scooter, ihtiyaç tespit, çevresel faktörler vb..."
                value={incidentFormData.operatorNotes}
                onChange={(e) => setIncidentFormData({ ...incidentFormData, operatorNotes: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e8f4f8', fontSize: '13px', fontFamily: 'inherit', transition: 'all 0.3s ease', background: '#f0f8fb', boxSizing: 'border-box', resize: 'vertical', minHeight: '100px' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#00bcd4'; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 188, 212, 0.1)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e8f4f8'; e.currentTarget.style.background = '#f0f8fb'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#90a4ae' }}>Bu notlar AI analizi için kullanılacak</p>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#565656', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>📄 Resmi Açıklama (AI için)</label>
              <textarea
                placeholder="Olayın resmi ve kısa açıklaması "
                value={incidentFormData.briefExplanation}
                onChange={(e) => setIncidentFormData({ ...incidentFormData, briefExplanation: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e8f4f8', fontSize: '13px', fontFamily: 'inherit', transition: 'all 0.3s ease', background: '#f0f8fb', boxSizing: 'border-box', resize: 'vertical', minHeight: '80px' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#00bcd4'; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 188, 212, 0.1)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e8f4f8'; e.currentTarget.style.background = '#f0f8fb'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#90a4ae' }}>Yapay zeka anomaly analizinde kullanılacak resmi açıklama</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '15px' }}>
              <button type="submit" style={{ padding: '14px', background: '#004b48', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s ease', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 4px 15px rgba(0, 75, 73, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 75, 73, 0.4)'; e.currentTarget.style.background = '#003635'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 75, 73, 0.3)'; e.currentTarget.style.background = '#004B49'; }}>
                <span>✏️</span> Güncelle
              </button>
              <button 
                type="button"
                onClick={() => handleResolveIncident(selectedIncident.id)}
                style={{ padding: '14px', background: '#ffb803', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s ease', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#003635'; }} 
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#004B49'; }}
              >
                <span>✔️</span> Çöz
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI Analiz Modal */}
      {showAnalysisModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 4000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)' }}>
          <div style={{ backgroundColor: '#F5F1E8', padding: '35px', borderRadius: '20px', width: '800px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 30px 60px rgba(0,0,0,0.3)', border: '1px solid rgba(255, 183, 3, 0.2)' }}>
            <button
              onClick={() => setShowAnalysisModal(false)}
              style={{
                position: 'absolute',
                top: '25px',
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

            {!analysisResults ? (
              <div>
                <h2 style={{ margin: '0 0 25px 0', color: '#565656', fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src={robotImg} alt="Robot" style={{ width: '32px', height: '32px' }} />
                  AI Anomali Analizi
                </h2>

                <div style={{ backgroundColor: 'rgba(0, 75, 73, 0.15)', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
                  <p style={{ margin: '0 0 15px 0', fontSize: '13px', fontWeight: '600', color: '#004B49', textTransform: 'uppercase' }}>Tarih Aralığını Seç</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#004B49', display: 'block', marginBottom: '6px' }}>📅 Başlangıç Tarihi</label>
                      <input
                        type="date"
                        value={analysisDateRange.startDate}
                        onChange={(e) => setAnalysisDateRange({ ...analysisDateRange, startDate: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #e8f4f8', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box', backgroundColor: 'white' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#004B49', display: 'block', marginBottom: '6px' }}>📅 Bitiş Tarihi</label>
                      <input
                        type="date"
                        value={analysisDateRange.endDate}
                        onChange={(e) => setAnalysisDateRange({ ...analysisDateRange, endDate: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #e8f4f8', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box', backgroundColor: 'white' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={handleAnalyzeIncidents}
                    disabled={analysisLoading}
                    style={{
                      padding: '12px 40px',
                      background: analysisLoading ? '#90a4ae' : 'rgba(255, 183, 3, 0.3)',
                      color: '#004B49',
                      border: '2px solid #ffb703',
                      borderRadius: '12px',
                      fontWeight: '700',
                      cursor: analysisLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: analysisLoading ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => !analysisLoading && (e.currentTarget.style.transform = 'translateY(-4px)', e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 183, 3, 0.3)')}
                    onMouseLeave={(e) => !analysisLoading && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = 'none')}
                  >
                    {analysisLoading ? '⏳ Analiz Yapılıyor...' : '▶ Analiz Başlat'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <h2 style={{ margin: '0 0 10px 0', color: '#565656', fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={analizoperatorImg} alt="Analiz" style={{ width: '48px', height: '48px', flexShrink: 0 }} />
                    Analiz Sonuçları
                  </h2>
                  <p style={{ margin: 0, fontSize: '12px', color: '#90a4ae' }}>
                    📈 {analysisResults.totalIncidentsAnalyzed} olay analiz edildi | ⏰ {new Date(analysisResults.analysisTimestamp).toLocaleString('tr-TR')}
                  </p>
                </div>

                {/* Risk Assessment */}
                <div style={{ backgroundColor: '#fff5f5', padding: '15px', borderRadius: '12px', marginBottom: '15px', borderLeft: '4px solid #e74c3c' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '700', color: '#e74c3c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ⚠️ RİSK DEĞERLENDİRMESİ
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <p style={{ margin: '0 0 5px 0', fontSize: '11px', fontWeight: '600', color: '#565656', textTransform: 'uppercase' }}>Genel Risk Seviyesi</p>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: analysisResults.riskAssessment.overall === 'Critical' ? '#e74c3c' : analysisResults.riskAssessment.overall === 'High' ? '#f39c12' : analysisResults.riskAssessment.overall === 'Medium' ? '#f1c40f' : '#27ae60' }}>
                        {analysisResults.riskAssessment.overall === 'Critical' ? '🔴 KRİTİK' : analysisResults.riskAssessment.overall === 'High' ? '🟠 YÜKSEK' : analysisResults.riskAssessment.overall === 'Medium' ? '🟡 ORTA' : '🟢 DÜŞÜK'}
                      </div>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 5px 0', fontSize: '11px', fontWeight: '600', color: '#565656', textTransform: 'uppercase' }}>Tahmini Etki</p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#565656', fontWeight: '600' }}>{analysisResults.riskAssessment.estimatedImpact}</p>
                    </div>
                  </div>
                  {analysisResults.riskAssessment.focusAreas.length > 0 && (
                    <div>
                      <p style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: '600', color: '#565656', textTransform: 'uppercase' }}>Dikkat Alanları</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {analysisResults.riskAssessment.focusAreas.map((area, idx) => (
                          <span key={idx} style={{ background: '#e74c3c', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>
                            📍 {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Anomalies */}
                {analysisResults.anomalies.length > 0 && (
                  <div style={{ backgroundColor: '#fffbf0', padding: '15px', borderRadius: '12px', marginBottom: '15px', borderLeft: '4px solid #f39c12' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#f39c12', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🚨 SAPTAMALAR ({analysisResults.anomalies.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {analysisResults.anomalies.map((anomaly, idx) => (
                        <div key={idx} style={{ background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e8f4f8' }}>
                          <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '700', color: '#565656' }}>
                            {anomaly.pattern}
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', color: '#90a4ae' }}>
                            <span>📊 Önem: <strong>{anomaly.severity}</strong></span>
                            <span>🎯 Risk: <strong>{anomaly.riskLevel}</strong></span>
                            {anomaly.affectedAreas.length > 0 && (
                              <div style={{ gridColumn: '1 / -1' }}>
                                <strong>Etkilenen Alanlar:</strong> {anomaly.affectedAreas.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Patterns */}
                {analysisResults.patterns.length > 0 && (
                  <div style={{ backgroundColor: '#f0f8fb', padding: '15px', borderRadius: '12px', marginBottom: '15px', borderLeft: '4px solid #00bcd4' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#00bcd4', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      📈 PATERNLER ({analysisResults.patterns.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {analysisResults.patterns.map((pattern, idx) => (
                        <div key={idx} style={{ background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e8f4f8' }}>
                          <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '700', color: '#565656' }}>
                            {pattern.type}
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', color: '#90a4ae' }}>
                            <span>🔄 Sıklık: <strong>{pattern.frequency}</strong></span>
                            <span>📊 Trend: <strong>{pattern.trend === 'increasing' ? '📈 Artıyor' : pattern.trend === 'decreasing' ? '📉 Azalıyor' : '➡️ Sabit'}</strong></span>
                            {pattern.locations.length > 0 && (
                              <div style={{ gridColumn: '1 / -1' }}>
                                <strong>Konumlar:</strong> {pattern.locations.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {analysisResults.recommendations.length > 0 && (
                  <div style={{ backgroundColor: '#f0fff4', padding: '15px', borderRadius: '12px', marginBottom: '15px', borderLeft: '4px solid #27ae60' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#27ae60', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ✅ TAVSİYELER ({analysisResults.recommendations.length})
                    </h3>
                    <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#565656', lineHeight: '1.6' }}>
                      {analysisResults.recommendations.map((rec, idx) => (
                        <li key={idx} style={{ marginBottom: '8px' }}>{rec}</li>
                      ))}
                    </ol>
                  </div>
                )}

                <button
                  onClick={() => setShowAnalysisModal(false)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#004B49',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontSize: '13px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#003635'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#004B49'}
                >
                  ✕ Kapat
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorDashboard;
