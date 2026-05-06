import { useState } from 'react';
import api from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './Login.css';
import operatorImg from '../assets/operator.png';
import userImg from '../assets/user.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginMode, setLoginMode] = useState<'user' | 'operator' | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const role = loginMode === 'user' ? 'User' : 'Operator';
      const res = await api.post('/auth/login', { username, password, role });
      localStorage.setItem('token', res.data.access_token);
      
      // Debug: Token decode et ve role kontrol et
      const decoded: any = jwtDecode(res.data.access_token);
      console.log('✅ Token decoded:', decoded);
      console.log('🔑 Role:', decoded.role);
      
      alert('Giriş Başarılı!');
      // Role-based yönlendirme
      const route = loginMode === 'user' ? '/user' : '/operator';
      console.log('🚀 Redirecting to:', route);
      navigate(route);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Hatalı giriş bilgileri!';
      console.error('❌ Login error:', errorMsg);
      alert(errorMsg);
    }
  };


  return (
    <div className="login-page">
      <header className="login-header">
        <h1 className="login-brand">
          SCOOTER <span>GO</span>
        </h1>
      </header>

      <div className="login-card">
        {/* Giriş Tipi Seçimi */}
        {!loginMode && (
          <div className="login-panel">
            <span className="login-badge">Giriş Seç</span>
            <h2 className="login-title">Hoş Geldin</h2>
            <p className="login-subtitle">Giriş türünü seç.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '30px' }}>
              <button
                onClick={() => setLoginMode('user')}
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  background: '#2ecc71',
                  color: 'white',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <img src={userImg} alt="user" style={{ width: '24px', height: '24px' }} />
                User Girişi
              </button>
              <button
                onClick={() => setLoginMode('operator')}
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  background: '#004B49',
                  color: 'white',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <img src={operatorImg} alt="operator" style={{ width: '24px', height: '24px' }} />
                Operatör Girişi
              </button>
            </div>

            <p className="login-register-text" style={{ marginTop: '30px' }}>
              Hesabın yok mu?{' '}
              <a href="/register" className="login-register-link">
                Kayıt Ol
              </a>
            </p>
          </div>
        )}

        {/* User Login Form */}
        {loginMode === 'user' && (
          <div className="login-panel">
            <span className="login-badge">User Girişi</span>
            <h2 className="login-title">Hoş Geldin</h2>
            <p className="login-subtitle">Sürüşe devam etmek için hesabına giriş yap.</p>

            <form onSubmit={handleLogin} className="login-form">
              <input
                type="text"
                placeholder="Kullanıcı Adı"
                onChange={(e) => setUsername(e.target.value)}
                className="login-input"
                required
              />
              <input
                type="password"
                placeholder="Şifre"
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                required
              />
              <button type="submit" className="login-button">
                Giriş Yap
              </button>
            </form>

            <button
              onClick={() => setLoginMode(null)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Geri Dön
            </button>
          </div>
        )}

        {/* Operator Login Form */}
        {loginMode === 'operator' && (
          <div className="login-panel">
            <span className="login-badge">Operatör Girişi</span>
            <h2 className="login-title">Operatör Giriş</h2>
            <p className="login-subtitle">Scooter yönetimi için giriş yap.</p>

            <form onSubmit={handleLogin} className="login-form">
              <input
                type="text"
                placeholder="Kullanıcı Adı"
                onChange={(e) => setUsername(e.target.value)}
                className="login-input"
                required
              />
              <input
                type="password"
                placeholder="Şifre"
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                required
              />
              <button type="submit" className="login-button" style={{ background: '#004B49' }}>
                Giriş Yap
              </button>
            </form>

            <button
              onClick={() => setLoginMode(null)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Geri Dön
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;