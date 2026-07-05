# Guía Rápida - API WebSocket iacanvas

## Inicio Rápido

### 1. Instalar Dependencias del Servidor

```bash
cd server
npm install
cd ..
```

### 2. Ejecutar Todo

```bash
npm run dev:all
```

O ejecutar por separado:

**Terminal 1 - Backend:**

```bash
cd server
npm start 
```

**Terminal 2 - Frontend:**

```bash
npm start
``` 

## Uso del API

### Añadir Comida Aleatoria

```bash
# Añadir 10 comidas
curl http://localhost:3000/api/food/add/10

# Añadir 50 comidas
curl http://localhost:3000/api/food/add/50

# Verificar servidor
curl http://localhost:3000/api/health
```

### Desde PowerShell

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/food/add/10"
```

## Endpoints

- `GET /api/health` - Estado del servidor
- `GET /api/food/add/:quantity` - Añadir comida (1-1000)

## WebSocket

- URL: `ws://localhost:3000`
- Conexión automática al iniciar simulación
- Reconexión automática si se pierde conexión

## Arquitectura

```
HTTP Request → Express Server → WebSocket Broadcast → Angular App → Canvas Update
```

## Verificación

1. Abre `http://localhost:4200`
2. Inicia la simulación
3. En otra terminal: `curl http://localhost:3000/api/food/add/20`
4. Observa cómo aparecen 20 comidas nuevas en el canvas

## Troubleshooting

**Error: EADDRINUSE**

- El puerto 3000 está ocupado
- Cambia el puerto en `server/src/server.ts`

**WebSocket no conecta**

- Verifica que el servidor backend esté corriendo
- Revisa la consola del navegador para errores

**No aparece comida**

- Asegúrate de haber iniciado la simulación primero
- Verifica que la cantidad esté entre 1 y 1000
