import { useState } from 'react';
import api from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import './Register.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'User' | 'Operator'>('User');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', { username, password, role });
      alert('Kayıt Başarılı! Şimdi giriş yapabilirsiniz.');
      navigate('/login'); 
    } catch (err) {
      alert('Kayıt başarısız. Bu kullanıcı adı alınmış olabilir.');
    }
  };

  return (
    <div className="register-page">
      <header className="register-header">
        <h1 className="register-brand">
          SCOOTER <span>GO</span>
        </h1>
      </header>

      <div className="register-card">
        
        <div className="register-panel">
          <span className="register-badge">Yeni Hesap</span>
          <h2 className="register-title">Kayıt Ol</h2>
          <p className="register-subtitle">Hemen hesabını oluştur ve sürüşe başla.</p>

          <form onSubmit={handleRegister} className="register-form">
            <input
              type="text"
              placeholder="Kullanıcı Adı"
              onChange={(e) => setUsername(e.target.value)}
              className="register-input"
              required
            />
            <input
              type="password"
              placeholder="Şifre"
              onChange={(e) => setPassword(e.target.value)}
              className="register-input"
              required
            />
            <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
              <label style={{ flex: 1, cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="role" 
                  value="User" 
                  checked={role === 'User'}
                  onChange={() => setRole('User')}
                  style={{ marginRight: '5px' }}
                />
                User Girişi
              </label>
              <label style={{ flex: 1, cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="role" 
                  value="Operator" 
                  checked={role === 'Operator'}
                  onChange={() => setRole('Operator')}
                  style={{ marginRight: '5px' }}
                />
                Operatör Girişi
              </label>
            </div>
            <button type="submit" className="register-button">
              Kaydol
            </button>
          </form>

          <p className="register-login-text">
            Zaten hesabın var mı?{' '}
            <a href="/login" className="register-login-link">
              Giriş Yap
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;