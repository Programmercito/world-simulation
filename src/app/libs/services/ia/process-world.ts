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
    const hungerThreshold = 20 - (individual.dna.resilience - 0.5) * 10;
    const energyThreshold = 60 - (individual.dna.resilience - 0.5) * 10;

    // Prioridad 1: Si tienes hambre, busca comida.
    if (individual.hunger > hungerThreshold) {
      // Si ya está explorando y tiene hambre, mantener el estado de exploración
      if (individual.currentState === 'exploring') {
        // Verificar si ahora puede ver comida
        const closestFood = this.findClosestFood(individual, world, effectiveVisionRange);
        if (closestFood) {
          individual.currentState = 'seekingFood';
          individual.targetId = closestFood.id;
          individual.explorationTarget = undefined;
        }
        // Si el hambre es extrema (>90), considerar cazar
        else if (individual.hunger > 90) {
          const prey = this.findWeakestPrey(individual, world, effectiveVisionRange);
          if (prey) {
            individual.currentState = 'hunting';
            individual.targetId = prey.id;
            individual.explorationTarget = undefined;
          }
        }
        // Sino, continuar explorando (no cambiar estado)
      }
      // Si está cazando, mantener el estado hasta completar
      else if (individual.currentState === 'hunting') {
        // Verificar si la presa sigue viva
        const prey = world.individuals.find(i => i.id === individual.targetId && i.isAlive);
        if (!prey) {
          // Presa perdida, volver a buscar comida o explorar
          const closestFood = this.findClosestFood(individual, world, effectiveVisionRange);
          if (closestFood) {
            individual.currentState = 'seekingFood';
            individual.targetId = closestFood.id;
          } else {
            individual.currentState = 'exploring';
            individual.targetId = undefined;
          }
        }
      }
      // Si está buscando comida pero perdió el objetivo
      else if (individual.currentState === 'seekingFood' && !individual.targetId) {
        const closestFood = this.findClosestFood(individual, world, effectiveVisionRange);
        if (closestFood) {
          individual.targetId = closestFood.id;
        } else {
          // No hay comida visible, cambiar a exploración
          individual.currentState = 'exploring';
          individual.targetId = undefined;
        }
      }
      // Si no está en ningún estado de búsqueda de comida, iniciarlo
      else if (individual.currentState !== 'seekingFood' && individual.currentState !== 'hunting') {
        const closestFood = this.findClosestFood(individual, world, effectiveVisionRange);
        if (closestFood) {
          individual.currentState = 'seekingFood';
          individual.targetId = closestFood.id;
        } else {
          // No hay comida visible, empezar a explorar
          individual.currentState = 'exploring';
          individual.targetId = undefined;
        }
      }
    } else if (individual.age > 3 && individual.energy > energyThreshold && individual.cooldownUntil < world.tick) {
      // Prioridad 2: Si tienes energía y edad, busca reproducirte.
      individual.currentState = 'seekingMate';
      individual.targetId = undefined; // Olvida la comida si ahora busca pareja
      individual.explorationTarget = undefined; // Olvida exploración
    } else {
      // Si no, deambula.
      individual.currentState = 'wandering';
      individual.targetId = undefined;
      individual.explorationTarget = undefined;
    }

    // Ya no necesitamos esta lógica duplicada porque se maneja arriba
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

  private findWeakestPrey(hunter: Individual, world: World, visionRange: number): Individual | null {
    const preys = world.individuals.filter(ind => 
      ind.isAlive &&
      ind.id !== hunter.id &&
      ind.civilizationId !== hunter.civilizationId && // Solo atacar otras civilizaciones
      ind.energy < hunter.energy * 0.8 && // Solo atacar más débiles
      Math.hypot(hunter.x - ind.x, hunter.y - ind.y) < visionRange
    );

    if (preys.length === 0) return null;

    // Ordenar por energía (más débil primero) y devolver el más cercano de los débiles
    preys.sort((a, b) => a.energy - b.energy);
    return preys[0];
  }
}