import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ScootersService } from './scooters.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class ScootersGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(private scootersService: ScootersService) {}

  handleConnection(client: Socket) {
    console.log(`✅ Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Client disconnected: ${client.id}`);
  }

  // Scooter ekleme - Tüm clientlara bildir
  @SubscribeMessage('scooter:add')
  async handleAddScooter(client: Socket, data: any) {
    console.log('📍 Yeni scooter eklendi:', data);
    const newScooter = await this.scootersService.create(data);
    // Tüm clientlara broadcast et
    this.server.emit('scooter:added', newScooter);
  }

  // Scooter silme - Tüm clientlara bildir
  @SubscribeMessage('scooter:delete')
  async handleDeleteScooter(client: Socket, scooterId: number) {
    console.log('🗑️ Scooter silindi:', scooterId);
    await this.scootersService.remove(scooterId);
    this.server.emit('scooter:deleted', { id: scooterId });
  }

  // Scooter güncelleme (pil, konum, vs) - Tüm clientlara bildir
  @SubscribeMessage('scooter:update')
  async handleUpdateScooter(client: Socket, data: any) {
    console.log('🔄 Scooter güncellendi:', data);
    const updated = await this.scootersService.update(data.id, data);
    this.server.emit('scooter:updated', updated);
  }

  // Tüm scooterları al
  @SubscribeMessage('scooter:getAll')
  async handleGetAllScooters(client: Socket) {
    try {
      const scooters = await this.scootersService.findAll();
      client.emit('scooter:list', scooters);
    } catch (err) {
      console.error(err);
    }
  }

  // Broadcast tüm scooterları güncelle (başlangıçta)
  emitAllScooters() {
    this.scootersService.findAll().then((scooters) => {
      this.server.emit('scooter:list', scooters);
    });
  }
}
