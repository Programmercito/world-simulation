import { Injectable } from '@angular/core';
import { Individual } from '../../models/individual';
import { World } from '../../models/world';
import { Food } from '../../models/food';

@Injectable({
  providedIn: 'root'
})
export class ProcessWorld {

  /**
   * Procesa la IA de un individuo basado en su ADN y el estado del mundo.
   */
  public processIndividual(individual: Individual, world: World): void {
    // Si el objetivo de comida ya no existe, lo olvidamos.
    if (individual.targetId && !world.foodSources.find(f => f.id === individual.targetId)) {
      individual.targetId = undefined;
      individual.currentState = 'wandering';
    }

    // Usar curiosidad para ajustar el rango de visión
    const visionMultiplier = 1 + (individual.dna.curiosity - 0.5) * 0.5; // Curiosidad alta aumenta visión
    const effectiveVisionRange = individual.visionRange * visionMultiplier;

    // Usar resiliencia para decidir umbrales de hambre y energía
    const hungerThreshold = 60 - (individual.dna.resilience - 0.5) * 20; // Resiliente tiene hambre más tarde
    const energyThreshold = 60 - (individual.dna.resilience - 0.5) * 20; // Resiliente busca reproducir con menos energía

    // Prioridad 1: Si tienes hambre, busca comida.
    if (individual.hunger > hungerThreshold) {
      individual.currentState = 'seekingFood';
    } else if (individual.age > 18 && individual.energy > energyThreshold && individual.cooldownUntil < world.tick) {
      // Prioridad 2: Si tienes energía y edad, busca reproducirte.
      individual.currentState = 'seekingMate';
      individual.targetId = undefined; // Olvida la comida si ahora busca pareja
    } else {
      // Si no, deambula.
      individual.currentState = 'wandering';
      individual.targetId = undefined;
    }

    // Lógica de acción basada en el estado
    if (individual.currentState === 'seekingFood') {
      // Si no tiene un objetivo, busca el más cercano dentro del rango efectivo
      if (!individual.targetId) {
        const closestFood = this.findClosestFood(individual, world, effectiveVisionRange);
        if (closestFood) {
          individual.targetId = closestFood.id;
        }
      }
    } else if (individual.currentState === 'seekingMate') {
      // Usar agresión para decidir si buscar pareja agresivamente (más cerca)
      const mateRange = individual.visionRange * (1 + (individual.dna.aggression - 0.5) * 0.3);
      // Para simplicidad, no implementamos búsqueda de pareja específica aquí, se hace en handleReproduction
    }
    // ... otros estados
  }

  private findClosestFood(individual: Individual, world: World, visionRange: number): Food | null {
    let closestFood: Food | null = null;
    let minDistance = visionRange;

    for (const food of world.foodSources) {
      if (food.isConsumed) continue;

      const distance = Math.hypot(individual.x - food.x, individual.y - food.y);
      if (distance < minDistance) {
        minDistance = distance;
        closestFood = food;
      }
    }
    return closestFood;
  }
}