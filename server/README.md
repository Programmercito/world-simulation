# iacanvas WebSocket API Server

Backend server for the iacanvas simulation that provides REST API endpoints and WebSocket communication for real-time updates.

## Features

- **REST API**: HTTP endpoints to trigger simulation events
- **WebSocket**: Real-time bidirectional communication with clients
- **CORS enabled**: Allows connections from Angular frontend

## Installation

```bash
cd server
npm install
```

## Running the Server

```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Health Check

```
GET /api/health
```

Response:

```json
{
  "success": true,
  "message": "Server is running",
  "data": {
    "clients": 1,
    "timestamp": 1702345678901
  }
}
```

### Add Food

```
GET /api/food/add/:quantity
```

Parameters:

- `quantity` (number): Amount of food items to add (1-1000)

Example:

```bash
curl http://localhost:3000/api/food/add/10
```

Response:

```json
{
  "success": true,
  "message": "Successfully added 10 food items",
  "data": {
    "quantity": 10,
    "clients": 1
  }
}
```

## WebSocket Messages

### Client → Server

Clients connect to `ws://localhost:3000`

### Server → Client

#### Connection Confirmation

```json
{
  "type": "CONNECTED",
  "data": {
    "message": "Connected to iacanvas WebSocket server"
  },
  "timestamp": 1702345678901
}
```

#### Add Food Event

```json
{
  "type": "ADD_FOOD",
  "data": {
    "type": "ADD_FOOD",
    "quantity": 10,
    "timestamp": 1702345678901
  },
  "timestamp": 1702345678901
}
```

## Architecture

- **Express**: HTTP server and REST API
- **ws**: WebSocket server for real-time communication
- **TypeScript**: Type-safe development
- **CORS**: Cross-origin resource sharing enabled

## Development

```bash
npm run dev
```
