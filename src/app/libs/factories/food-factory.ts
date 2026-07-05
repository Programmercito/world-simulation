import { Food } from '../models/food';

export class FoodFactory {
  createRandomFood(worldWidth: number = 2000, worldHeight: number = 2000): Food {
    return {
      id: crypto.randomUUID(),
      x: Math.random() * worldWidth,
      y: Math.random() * worldHeight,
      energyValue: 20 + Math.random() * 80,
      isConsumed: false,
      // Propiedades de movimiento - comida se mueve como un bichito
      speed: 0.3 + Math.random() * 0.7, // Velocidad lenta (0.3-1.0)
      angle: Math.random() * Math.PI * 2, // Dirección inicial aleatoria
      wiggleOffset: Math.random() * Math.PI * 2, // Offset inicial aleatorio para animación
    };
  }
}
