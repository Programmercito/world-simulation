import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { WebSocketMessage } from './types';

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.initialize();
  }

  private initialize(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket client connected');
      this.clients.add(ws);

      ws.on('message', (message: string) => {
        console.log('Received message:', message.toString());
      });

      ws.on('close', () => {
        console.log('Client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      // Send welcome message
      this.sendToClient(ws, {
        type: 'CONNECTED',
        data: { message: 'Connected to iacanvas WebSocket server' },
        timestamp: Date.now(),
      });
    });

    console.log('WebSocket server initialized');
  }

  public broadcast(message: WebSocketMessage): void {
    const messageStr = JSON.stringify(message);
    let successCount = 0;

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
        successCount++;
      }
    });

    console.log(`Broadcasted message to ${successCount} client(s):`, message.type);
  }

  public sendToClient(client: WebSocket, message: WebSocketMessage): void {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  public getClientCount(): number {
    return this.clients.size;
  }
}
