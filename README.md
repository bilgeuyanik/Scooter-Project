# Fullstack Scooter Project

Elektrikli scooter kiralama platformu için fullstack uygulama. Mobil app, web uygulaması ve backend servisleri içerir.

## 📁 Proje Yapısı

```
fullstack-kopya/
├── scooter-backend/          # NestJS REST API ve WebSocket sunucusu
├── scooter-frontend/         # React + Vite Admin/Dashboard paneli
├── mobile-app/               # Expo + React Native mobil uygulaması
├── web-app/                  # React web uygulaması
├── backend/                  # Express.js API (opsiyonel)
└── src/                      # Paylaşılan utilities/components
```

## 🚀 Proje Özellikleri

### Scooter Backend (NestJS)
- **Auth Modülü**: JWT tabanlı kimlik doğrulama ve rol yönetimi
- **Rides Modülü**: Yolculuk yönetimi ve geçmişi
- **Scooters Modülü**: Scooter konumları ve durumu (WebSocket ile gerçek zamanlı)
- **Geocoding**: Harita ve konum hizmetleri
- **Incidents**: Olay/sorun raporlama sistemi
- **AI Analysis**: Google Gemini API ile olay analizi

### Scooter Frontend (React + Vite)
- Admin paneli ve dashboard
- Scooter konumlarını harita üzerinde gösterme (Leaflet)
- Yolculuk yönetimi
- Olay takibi

### Mobile App (Expo)
- Scooter kiralama ve bırakma
- Harita üzerinde yakındaki scooterları görme
- Aktif yolculuk takibi
- Kullanıcı profili

### Web App (React)
- Ek web uygulaması
- Yanıt verme tasarımı

## 🛠️ Teknoloji Stack

### Backend
- **Runtime**: Node.js
- **Framework**: NestJS
- **ORM**: TypeORM
- **Database**: PostgreSQL (varsayılan)
- **Authentication**: JWT
- **Real-time**: Socket.IO (WebSocket)
- **AI**: Google Gemini API

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Maps**: Leaflet + React-Leaflet
- **HTTP Client**: Axios
- **Routing**: React Router v7
- **Real-time**: Socket.IO Client

### Mobile
- **Framework**: Expo
- **Language**: TypeScript
- **Components**: React Native

## 📋 Kurulum & Çalıştırma

### Ön Gereksinimler
- Node.js 18+
- npm veya yarn
- PostgreSQL (backend için)

### Backend Kurulumu

```bash
cd scooter-backend
npm install
npm run start:dev
```

**Ortam Değişkenleri** (.env dosyasını oluştur):
```
DATABASE_URL=postgresql://user:password@localhost:5432/scooter_db
JWT_SECRET=your_jwt_secret
GOOGLE_GENAI_API_KEY=your_google_api_key
```

### Frontend Kurulumu

```bash
cd scooter-frontend
npm install
npm run dev
```

Tarayıcıda açıl: http://localhost:5173

### Mobile App Kurulumu

```bash
cd mobile-app
npm install
npx expo start
```

### Web App Kurulumu

```bash
cd web-app
npm install
npm start
```

## 📚 API Endpoints

### Authentication
- `POST /auth/register` - Kullanıcı kaydı
- `POST /auth/login` - Kullanıcı girişi
- `GET /auth/profile` - Profil bilgisi

### Scooters
- `GET /scooters` - Tüm scooterları listele
- `GET /scooters/:id` - Scooter detayları
- `POST /scooters/:id/book` - Scooter rezerv et

### Rides
- `GET /rides` - Yolculuk geçmişi
- `POST /rides/:id/end` - Yolculuğu bitir
- `GET /rides/:id` - Yolculuk detayları

### Incidents
- `GET /incidents` - Tüm olaylar
- `POST /incidents` - Olay bildir
- `GET /incidents/:id` - Olay detayları

## 🔗 WebSocket Events

- `scooters:update` - Scooter konumları ve durumu
- `incidents:new` - Yeni olay bildirimi
- `rides:status` - Yolculuk durum güncellemeleri

## 📝 Geliştirme Notları

### Git Commit Mesajları
```
feat: Yeni özellik ekleme
fix: Bug düzeltme
docs: Dokümantasyon güncellemeleri
style: Kod formatı (fonksiyonelliği etkilemeyen)
refactor: Kod yeniden yapılandırması
test: Test ekleme/güncellemeleri
chore: Yapı/bağımlılık güncellemeleri
```

### .gitignore
Proje kök dizinindeki `.gitignore` dosyası aşağıdaları otomatik olarak hariç tutar:
- `node_modules/`
- `.env` dosyaları
- `dist/` ve `build/` klasörleri
- IDE ayarları (`.vscode/`, `.idea/`)
- IDE cache dosyaları

## 📄 Lisans

Bu proje MIT lisansı altında yayımlanmıştır.

## 👥 Katkıda Bulunma

1. Repository'yi fork et
2. Feature branch oluştur (`git checkout -b feature/amazing-feature`)
3. Değişiklikleri commit et (`git commit -m 'Add amazing feature'`)
4. Branch'e push et (`git push origin feature/amazing-feature`)
5. Pull Request aç

---

**Son Güncelleme**: 2026-06-19
