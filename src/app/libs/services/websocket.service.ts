import { Injectable } from '@angular/core';
import { Observable, Subject, timer } from 'rxjs';

export interface FoodEvent {
  type: 'ADD_FOOD' | 'REMOVE_FOOD';
  quantity: number;
  timestamp: number;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private foodEvents$ = new Subject<FoodEvent>();
  private connectionStatus$ = new Subject<boolean>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  constructor() {}

  public connect(url: string = 'ws://localhost:3000'): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        console.log('✅ WebSocket connected to server');
        this.reconnectAttempts = 0;
        this.connectionStatus$.next(true);
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', message);

          if (message.type === 'ADD_FOOD' || message.type === 'REMOVE_FOOD') {
            this.foodEvents$.next(message.data as FoodEvent);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      this.socket.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.connectionStatus$.next(false);
        this.attemptReconnect(url);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.attemptReconnect(url);
    }
  }

  private attemptReconnect(url: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
      );

      timer(this.reconnectDelay).subscribe(() => {
        this.connect(url);
      });
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  public onFoodEvent(): Observable<FoodEvent> {
    return this.foodEvents$.asObservable();
  }

  public onConnectionStatus(): Observable<boolean> {
    return this.connectionStatus$.asObservable();
  }

  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}
