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

export interface ApiResponse {
    success: boolean;
    message: string;
    data?: any;
}
