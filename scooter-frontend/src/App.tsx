import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import Register from './pages/Register';
import Login from './pages/Login';
import UserPage from './pages/UserPage';
import OperatorDashboard from './pages/OperatorDashboard';
import { ScooterProvider } from './contexts/ScooterContext';
import { IncidentProvider } from './contexts/IncidentContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LocationProvider } from './contexts/LocationContext';
import NotificationDisplay from './components/NotificationDisplay';

// 🌙 Dark Mode Leaflet Popup Stili + Pointer Events Fix
const leafletDarkStyles = `
  .leaflet-map-container {
    pointer-events: auto !important;
  }
  
  .leaflet-container {
    pointer-events: auto !important;
  }
  
  .leaflet-top, .leaflet-bottom {
    pointer-events: auto !important;
    z-index: 1000 !important;
  }
  
  .leaflet-control {
    pointer-events: auto !important;
  }
  
  .leaflet-pane {
    pointer-events: auto !important;
  }
  
  .leaflet-marker-pane {
    pointer-events: auto !important;
  }
  
  .leaflet-marker-pane .leaflet-marker {
    pointer-events: auto !important;
  }
  
  .leaflet-popup-pane {
    pointer-events: auto !important;
  }
  
  .incident-icon {
    pointer-events: auto !important;
    cursor: pointer !important;
  }
  
  .incident-popup .leaflet-popup-content-wrapper {
    background-color: #2d2d2d !important;
    color: #e0e0e0 !important;
    border: 1px solid #444 !important;
    border-radius: 8px !important;
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.5) !important;
    pointer-events: auto !important;
  }
  
  .incident-popup .leaflet-popup-tip {
    background-color: #2d2d2d !important;
    border-top-color: #444 !important;
  }
  
  .incident-popup .leaflet-popup-content {
    margin: 0 !important;
    padding: 0 !important;
    pointer-events: auto !important;
  }
  
  .incident-popup button {
    pointer-events: auto !important;
    cursor: pointer !important;
  }
`;

// Role-based Route Wrapper
const ProtectedRoute = ({ element, requiredRole }: { element: React.ReactNode; requiredRole: string }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        const userRole = decoded.role;
        setIsAuthorized(userRole === requiredRole);
      } catch (err) {
        setIsAuthorized(false);
      }
    } else {
      setIsAuthorized(false);
    }
  }, [requiredRole]);

  if (isAuthorized === null) return <div>Yükleniyor...</div>;
  if (!isAuthorized) return <Navigate to="/login" replace />;

  return element;
};

function App() {
  // 🌙 Dark Mode Leaflet Popup Stilini DOM'a Ekle
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = leafletDarkStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <NotificationProvider>
      <LocationProvider>
        <ScooterProvider>
          <IncidentProvider>
            <NotificationDisplay />
            <Router>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/user" element={<ProtectedRoute element={<UserPage />} requiredRole="User" />} />
                <Route path="/operator" element={<ProtectedRoute element={<OperatorDashboard />} requiredRole="Operator" />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Router>
          </IncidentProvider>
        </ScooterProvider>
      </LocationProvider>
    </NotificationProvider>
  );
}

export default App;
