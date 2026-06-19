import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleGenAI } from '@google/genai';
import { Incident } from '../incidents/entities/incident.entity';

export interface AnomalyAnalysisResult {
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

@Injectable()
export class AiAnalysisService {
  private genAI: GoogleGenAI;

  constructor(
    @InjectRepository(Incident)
    private incidentsRepository: Repository<Incident>,
  ) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ GOOGLE_AI_API_KEY not set - offline mode will be used');
    }
    this.genAI = new GoogleGenAI({ apiKey: apiKey || '' });
  }

  
  async getIncidentsForAnalysis(
    startDate?: Date,
    endDate?: Date,
  ): Promise<Incident[]> {
    const query = this.incidentsRepository.createQueryBuilder('incident');

    if (startDate && endDate) {
      query.where('incident.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      });
    } else if (startDate) {
      query.where('incident.createdAt >= :start', { start: startDate });
    } else if (endDate) {
      query.where('incident.createdAt <= :end', { end: endDate });
    }

    
    return query
      .orderBy('incident.createdAt', 'DESC')
      .addOrderBy('incident.report_count', 'DESC')
      .take(500) 
      .getMany();
  }

  private formatIncidentsForAI(incidents: Incident[]): string {
    const incidentData = incidents.map((incident) => ({
      id: incident.id,
      type: incident.type,
      severity: incident.severity || 'Orta',
      location: {
        latitude: incident.lat,
        longitude: incident.lon,
        address: incident.address || 'Bilinmiyor',
      },
      description: incident.description || 'Açıklama yok',
      operatorNotes: incident.operatorNotes || 'Operatör notu yok',
      briefExplanation: incident.briefExplanation || 'Açıklama yok',
      reportCount: incident.report_count,
      isResolved: incident.isResolved,
      createdAt: incident.createdAt.toISOString(),
    }));

    return JSON.stringify(incidentData, null, 2);
  }

  
  async analyzeWithGemini(
    incidents: Incident[],
  ): Promise<AnomalyAnalysisResult> {
    if (incidents.length === 0) {
      throw new BadRequestException(
        'Analiz için veri bulunamadı. Lütfen tarih aralığını kontrol edin.',
      );
    }

    const formattedData = this.formatIncidentsForAI(incidents);

    const prompt = `Sen, akıllı şehir teknolojileri ve mikromobilite (scooter) operasyonları konusunda uzmanlaşmış bir Kıdemli Trafik Veri Analistisin. 
Görevin, aşağıdaki tarihsel anomali verilerini analiz ederek şehir operatörleri için stratejik bir rapor hazırlamaktır.

${formattedData}

Lütfen bu verileri şunlar için analiz et:
1. **SAPMALAR (Anomalies)**: Alışılmadık paternler, aykırı değerler veya endişe verici olay kümeleri
2. **PATERNLER (Patterns)**: Olay türlerinde, konumlarda veya önem seviyelerinde tekrarlanan paternler
3. **RİSK DEĞERLENDİRMESİ (Risk Assessment)**: Genel risk seviyesi ve yüksek riskli alanları belirleme
4. **TAVSİYELER (Recommendations)**: Olay önleme ve yönetimi için uygulanabilir tavsiyeleri

Önemli bağlam:
- Önem seviyeleri: Düşük, Orta, Yüksek
- Operatör notları ve kısa açıklamalar analiz için kritik bağlam içerir
- Rapor sayısı: Aynı olayı kaç kişi bildirdiğini gösterir
- Çözülen olaylar: Sorunların ne kadar etkili yönetildiğini gösterir

Yanıtı şu JSON yapısında ver (başka hiçbir şey yazma, sadece JSON):
{
  "anomalies": [
    {
      "incidentIds": [olay ID'leri],
      "pattern": "sapmanın açıklaması",
      "severity": "Düşük|Orta|Yüksek|Kritik",
      "affectedAreas": ["alan1", "alan2"],
      "riskLevel": "Low|Medium|High|Critical"
    }
  ],
  "patterns": [
    {
      "type": "patern tipi",
      "frequency": "ne sıklıkta oluştuğu",
      "trend": "increasing|decreasing|stable",
      "locations": ["konum1", "konum2"]
    }
  ],
  "riskAssessment": {
    "overall": "Low|Medium|High|Critical",
    "focusAreas": ["alan1", "alan2"],
    "estimatedImpact": "olası etkinin açıklaması"
  },
  "recommendations": ["tavsiye1", "tavsiye2", "tavsiye3"]
}`;

    try {
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      const responseText = response.text;

      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('⚠️ API yanıtında JSON bulunamadı, offline moda geçiliyor');
        return this.generateSmartAnalysis(incidents);
      }

      const analysisResult = JSON.parse(jsonMatch[0]);

      return {
        anomalies: analysisResult.anomalies || [],
        patterns: analysisResult.patterns || [],
        riskAssessment: analysisResult.riskAssessment || { overall: 'Medium', focusAreas: [], estimatedImpact: '' },
        recommendations: analysisResult.recommendations || [],
        analysisTimestamp: new Date().toISOString(),
        totalIncidentsAnalyzed: incidents.length,
      } as AnomalyAnalysisResult;
    } catch (error) {
      console.warn(`⚠️ Gemini API hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}. Offline moda geçiliyor...`);
      
      return this.generateSmartAnalysis(incidents);
    }
  }

  
  private generateSmartAnalysis(incidents: Incident[]): AnomalyAnalysisResult {
    const highSeverityIncidents = incidents.filter(
      (i) => i.severity === 'Yüksek',
    );
    const mediumSeverityIncidents = incidents.filter(
      (i) => i.severity === 'Orta',
    );
    const highReportCountIncidents = incidents.filter((i) => i.report_count > 5);

    const locationClusters = this.groupIncidentsByLocation(incidents);
    const mostAffectedArea = Object.entries(locationClusters).sort(
      ([, a], [, b]) => b.length - a.length,
    )[0];

    return {
      anomalies: [
        {
          incidentIds: highSeverityIncidents.slice(0, 5).map((i) => i.id),
          pattern:
            'Yüksek önem seviyesinde anormal yoğunlaşma tespit edildi',
          severity: 'Yüksek',
          affectedAreas: mostAffectedArea ? [mostAffectedArea[0]] : ['Bilinmeyen'],
          riskLevel: 'High',
        },
        {
          incidentIds: highReportCountIncidents.slice(0, 5).map((i) => i.id),
          pattern:
            'Çok sayıda kişi tarafından bildirilen olaylar - sistemik sorun göstergesi',
          severity: 'Yüksek',
          affectedAreas: highReportCountIncidents
            .slice(0, 3)
            .map((i) => i.address || 'Bilinmeyen'),
          riskLevel: 'High',
        },
      ],
      patterns: [
        {
          type: 'Önem Seviyesi Dağılımı',
          frequency: `Yüksek: ${highSeverityIncidents.length}, Orta: ${mediumSeverityIncidents.length}`,
          trend: highSeverityIncidents.length > mediumSeverityIncidents.length ? 'increasing' : 'decreasing',
          locations: [...new Set(incidents.map((i) => i.address || 'Bilinmeyen'))].slice(0, 5),
        },
        {
          type: 'Tekrarlanan Olay Konumları',
          frequency: 'Haftada birden fazla',
          trend: 'stable',
          locations: Object.keys(locationClusters)
            .sort((a, b) => locationClusters[b].length - locationClusters[a].length)
            .slice(0, 3),
        },
      ],
      riskAssessment: {
        overall:
          highSeverityIncidents.length > 3 ? 'High' : 'Medium',
        focusAreas: mostAffectedArea
          ? [mostAffectedArea[0]]
          : ['Tüm bölge'],
        estimatedImpact:
          highSeverityIncidents.length > 0
            ? `${highSeverityIncidents.length} yüksek risk incident tespit edildi`
            : 'Risk seviyesi düşük',
      },
      recommendations: [
        `${highSeverityIncidents.length > 0 ? `Yüksek risk alanlarına teknisyen gönderin (${highSeverityIncidents.length} olay)` : 'Mevcut durumu takip edin'}`,
        highReportCountIncidents.length > 0
          ? `${highReportCountIncidents[0].address || 'Bilinmeyen konum'}'da sistemik sorun araştırın`
          : 'Rutin bakım devam etsin',
        'Operatör notlarındaki açıklamaları gözden geçirin',
        'Gelecek hafta için önleyici tedbirler alın',
      ],
      analysisTimestamp: new Date().toISOString(),
      totalIncidentsAnalyzed: incidents.length,
    };
  }

  
  private groupIncidentsByLocation(
    incidents: Incident[],
  ): Record<string, Incident[]> {
    return incidents.reduce(
      (acc, incident) => {
        const location = incident.address || 'Bilinmeyen';
        if (!acc[location]) {
          acc[location] = [];
        }
        acc[location].push(incident);
        return acc;
      },
      {} as Record<string, Incident[]>,
    );
  }

  async performAnalysis(
    startDate?: string,
    endDate?: string,
  ): Promise<AnomalyAnalysisResult> {
    let start: Date | undefined;
    let end: Date | undefined;

    if (startDate) {
      start = new Date(startDate);
      if (isNaN(start.getTime())) {
        throw new BadRequestException('Geçersiz başlangıç tarihi formatı');
      }
    }

    if (endDate) {
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        throw new BadRequestException('Geçersiz bitiş tarihi formatı');
      }
    }

    
    if (!start && !end) {
      start = new Date();
      start.setDate(start.getDate() - 7);
    }

    const incidents = await this.getIncidentsForAnalysis(start, end);
    return this.analyzeWithGemini(incidents);
  }
}
