import { Individual } from '../models/individual';

export class IndividualFactory {
  createIndividual(
    civilizationId: string,
    race: string,
    color: string,
    generation: number = 0,
  ): Individual {
    const canvasWidth = 2000;
    const canvasHeight = 2000;

    return {
      id: crypto.randomUUID(),
      name: `Ind-${Math.floor(Math.random() * 10000)}`,
      race,
      civilizationId,

      // Posición aleatoria en el canvas
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,

      // Estado vital
      age: 0,
      maxAge: 100 + Math.floor(Math.random() * 100), // entre 100 y 200
      energy: 100,
      hunger: 0,
      health: 100,
      isAlive: true,

      // Capacidades físicas (optimizadas para mayor duración)
      speed: 3 + Math.random() * 3, // entre 3 y 6 (más lento = menos gasto)
      visionRange: 200 + Math.random() * 400, // entre 200 y 600
      strength: 10 + Math.random() * 20, // entre 10 y 30
      fertility: true,

      // Genética y evolución
      dna: {
        aggression: Math.random(), // 0 a 1
        curiosity: Math.random(), // 0 a 1
        resilience: Math.random(), // 0 a 1
        mutationRate: 0.01 + Math.random() * 0.04, // entre 0.01 y 0.05
      },

      // Ciclo de reproducción
      cooldownUntil: 0,
      offspringCount: 0,
      generation,

      // IA
      currentState: 'seekingFood',
      targetId: undefined,
      path: [],

      // Visualización
      color,
      size: 10 + Math.random() * 10, // entre 10 y 20 px
      shape: this.getRandomShape() as 'circle' | 'square' | 'triangle' | 'diamond',
    };
  }

  private getRandomShape(): string {
    const shapes = ['circle', 'square', 'triangle', 'diamond'];
    return shapes[Math.floor(Math.random() * shapes.length)];
  }
}
