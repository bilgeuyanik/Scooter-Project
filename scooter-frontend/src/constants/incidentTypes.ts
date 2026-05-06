// 🇹🇷 Tüm Incident Tiplerine İlişkin Mapping'ler

export const INCIDENT_ICONS: Record<string, string> = {
  Crash: '🚨',
  Slowdown: '🚗',
  Construction: '🏗️',
  'Lane closure': '🚫',
  'Object on Road': '⚠️',
};

export const INCIDENT_COLORS: Record<string, string> = {
  Crash: '#FF3B30',
  Slowdown: '#FF9500',
  Construction: '#FFCC00',
  'Lane closure': '#FF3B30',
  'Object on Road': '#FF6B35',
};

// 🇹🇷 Türkçe Type Etiketleri (Display amacıyla)
export const INCIDENT_LABELS: Record<string, string> = {
  Crash: 'Kaza',
  Slowdown: 'Yavaşlama Alanı',
  Construction: 'İnşaat',
  'Lane closure': 'Şerit Kapatması',
  'Object on Road': 'Yolda Engel',
};

// Form'da Seçim için Type'lar (value: key, label: Türkçe + emoji)
export const INCIDENT_TYPES = [
  { value: 'Crash', label: '🚨 Kaza' },
  { value: 'Slowdown', label: '🚗 Yavaşlama Alanı' },
  { value: 'Construction', label: '🏗️ İnşaat' },
  { value: 'Lane closure', label: '🚫 Şerit Kapatması' },
  { value: 'Object on Road', label: '⚠️ Yolda Engel' },
];

// Helper Function - Type'ı Türkçe Label'a çevir
export const getIncidentTypeLabel = (type: string): string => {
  const mapping: { [key: string]: string } = {
    'Crash': 'Kaza',
    'Slowdown': 'Yavaşlama Alanı',
    'Construction': 'İnşaat',
    'Lane closure': 'Şerit Kapatması',
    'Object on Road': 'Yolda Engel',
    // Lowercase versiyonlar da ekle (eğer backend lowercase gönderirse)
    'crash': 'Kaza',
    'slowdown': 'Yavaşlama Alanı',
    'construction': 'İnşaat',
    'lane closure': 'Şerit Kapatması',
    'object on road': 'Yolda Engel',
  };

  return mapping[type] || type;
};

// Helper Function - Gradient Renk
export const getIncidentGradientColor = (type: string): string => {
  const gradients: Record<string, string> = {
    Crash: 'linear-gradient(135deg, #FF3B30 0%, #FF6B45 100%)',
    Slowdown: 'linear-gradient(135deg, #FF9500 0%, #FFB84D 100%)',
    Construction: 'linear-gradient(135deg, #FFCC00 0%, #FFD966 100%)',
    'Lane closure': 'linear-gradient(135deg, #FF3B30 0%, #FF6B45 100%)',
    'Object on Road': 'linear-gradient(135deg, #FF6B35 0%, #FF8E52 100%)',
  };
  return gradients[type] || 'linear-gradient(135deg, #007AFF 0%, #00A8FF 100%)';
};

// Helper Function - İcon
export const getIncidentIcon = (type: string): string => {
  return INCIDENT_ICONS[type] || '⚠️';
};

// Helper Function - Renk
export const getIncidentColor = (type: string): string => {
  return INCIDENT_COLORS[type] || '#999999';
};
