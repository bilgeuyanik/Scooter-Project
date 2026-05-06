import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { IncidentsService } from './incidents.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class IncidentsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private incidentsService: IncidentsService) {}

  handleConnection(client: Socket) {
    console.log(`✅ Incident Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Incident Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('incident:create')
  async handleCreateIncident(client: Socket, data: any) {
    console.log('🚨 Yeni olay oluşturuldu:', data);
    try {
      const newIncident = await this.incidentsService.create(data);
      // Tüm clientlara broadcast et
      this.server.emit('incident:created', newIncident);
    } catch (err) {
      console.error('❌ Olay oluşturma hatası:', err);
    }
  }

  @SubscribeMessage('incident:report')
  async handleReportIncident(client: Socket, id: number) {
    console.log('📢 Olay bildirildi:', id);
    try {
      const updated = await this.incidentsService.incrementReportCount(id);
      this.server.emit('incident:updated', updated);
    } catch (err) {
      console.error('❌ Bildir hatası:', err);
    }
  }

  @SubscribeMessage('incident:resolve')
  async handleResolveIncident(client: Socket, id: number) {
    console.log('✅ Olay çözüldü:', id);
    try {
      await this.incidentsService.resolveIncident(id);
      this.server.emit('incident:resolved', { id });
    } catch (err) {
      console.error('❌ Çöz hatası:', err);
    }
  }

  @SubscribeMessage('incident:getAll')
  async handleGetAllIncidents(client: Socket) {
    try {
      const incidents = await this.incidentsService.findAll();
      client.emit('incident:list', incidents);
    } catch (err) {
      console.error('❌ Liste hatası:', err);
    }
  }

  @SubscribeMessage('incident:nearby')
  async handleGetNearbyIncidents(
    client: Socket,
    data: { lat: number; lon: number },
  ) {
    try {
      const incidents = await this.incidentsService.findNearby(
        data.lat,
        data.lon,
        10,
      );
      client.emit('incident:nearbyList', incidents);
    } catch (err) {
      console.error('❌ Yakın olay hatası:', err);
    }
  }

  @SubscribeMessage('incident:delete')
  async handleDeleteIncident(client: Socket, id: number) {
    console.log('🗑️ Olay silindi:', id);
    try {
      await this.incidentsService.remove(id);
      // Tüm clientlara broadcast et
      this.server.emit('incident:deleted', { id });
    } catch (err) {
      console.error('❌ Silme hatası:', err);
    }
  }
}
