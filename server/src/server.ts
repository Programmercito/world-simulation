import express, { Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { WebSocketManager } from './websocket-manager';
import { FoodEvent, ApiResponse } from './types';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket manager
const wsManager = new WebSocketManager(server);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Server is running',
        data: {
            clients: wsManager.getClientCount(),
            timestamp: Date.now()
        }
    } as ApiResponse);
});

// Add food endpoint
app.get('/api/food/add/:quantity', (req: Request, res: Response) => {
    const quantity = parseInt(req.params.quantity, 10);

    // Validate quantity
    if (isNaN(quantity) || quantity <= 0 || quantity > 1000) {
        return res.status(400).json({
            success: false,
            message: 'Invalid quantity. Must be a number between 1 and 1000'
        } as ApiResponse);
    }

    // Create food event
    const foodEvent: FoodEvent = {
        type: 'ADD_FOOD',
        quantity,
        timestamp: Date.now()
    };

    // Broadcast to all connected clients
    wsManager.broadcast({
        type: 'ADD_FOOD',
        data: foodEvent,
        timestamp: Date.now()
    });

    console.log(`Food add request: ${quantity} items`);

    res.json({
        success: true,
        message: `Successfully added ${quantity} food items`,
        data: {
            quantity,
            clients: wsManager.getClientCount()
        }
    } as ApiResponse);
});

// Start server
server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║   🚀 iacanvas WebSocket API Server           ║
╟───────────────────────────────────────────────╢
║   Port: ${PORT}                              ║
║   WebSocket: ws://localhost:${PORT}          ║
║   API: http://localhost:${PORT}/api          ║
╚═══════════════════════════════════════════════╝
  `);
    console.log('Available endpoints:');
    console.log('  GET /api/health');
    console.log('  GET /api/food/add/:quantity');
    console.log('');
});
