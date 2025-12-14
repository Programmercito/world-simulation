import { WorldFactory } from '../factories/world-factory';
import { IndividualFactory } from '../factories/individual-factory';
import { FoodFactory } from '../factories/food-factory';
import { World } from '../models/world';
import { Individual } from '../models/individual';
import { Food } from '../models/food';
import { ProcessWorld } from '../services/ia/process-world';
import { SoundService } from '../services/sound-service';

export class SimulationService {
    public onStats?: (stats: { population: number; food: number; seekingMate: number; tick: number }) => void;
    public getStats() {
        const seeking = this.world.individuals.filter(i => i.currentState === 'seekingMate').length;
        return { population: this.world.individuals.length, food: this.world.foodSources.length, seekingMate: seeking, tick: this.world.tick };
    }

    public addFood() {
        this.world.foodSources.push(this.foodFactory.createRandomFood(this.world.width, this.world.height));
    }

    public addFoodBatch(quantity: number) {
        for (let i = 0; i < quantity; i++) {
            this.world.foodSources.push(this.foodFactory.createRandomFood(this.world.width, this.world.height));
        }
        console.log(`Added ${quantity} food items to the world`);
    }

    public playVictorySound() {
        this.soundService.play('victory');
    }

    public getCivilizations() {
        return this.world.civilizations.map(civ => {
            const population = this.world.individuals.filter(ind => ind.isAlive && ind.civilizationId === civ.id).length;
            const kills = civ.totalKills || 0;
            return { name: civ.name, color: civ.color, population, kills };
        });
    }

    private world: World;
    private ctx: CanvasRenderingContext2D;
    private worldFactory = new WorldFactory();
    private individualFactory = new IndividualFactory();
    private foodFactory = new FoodFactory();
    private processWorld = new ProcessWorld();
    private soundService = new SoundService();
    private lastTimestamp = 0;
    private isRunning = false;
    private simulationStartTime = 0; // Timestamp de inicio para escasez progresiva

    constructor(canvasContext: CanvasRenderingContext2D, civilizations?: number, individuals?: number, food?: number, width?: number, height?: number, foodSpawnIntervalSeconds?: number) {
        this.ctx = canvasContext;
        // Inicializamos el mundo al crear el servicio (usa valores por defecto del factory o los proporcionados)
        this.world = this.worldFactory.create(civilizations, individuals, food, width, height, foodSpawnIntervalSeconds);
    }

    public start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTimestamp = 0; // Reset timestamp
        this.simulationStartTime = Date.now(); // Guardar tiempo de inicio
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    public stop() {
        this.isRunning = false;
    }

    private gameLoop(timestamp: number) {
        if (!this.isRunning) return;

        // Controlamos el tiempo para que la simulación corra a una velocidad constante
        if (!this.lastTimestamp) {
            this.lastTimestamp = timestamp;
        }

        const elapsed = timestamp - this.lastTimestamp;

        // Solo actualizamos el mundo si ha pasado el tiempo de un ciclo (tick)
        if (elapsed >= this.world.cycleDurationMs) {
            this.update();
            this.lastTimestamp = timestamp;
        }

        this.render();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    /**
     * Actualiza el estado de todas las entidades del mundo.
     */
    private update() {
        this.world.tick++;

        // Actualizar cada individuo
        this.world.individuals.forEach(individual => {
            if (!individual.isAlive) return;

            // Actualizar atributos básicos (optimizado para mayor duración)
            individual.age += 0.003; // Envejecen más lento
            // Consumo de energía depende del estado (reducido)
            const energyCost = individual.currentState === 'hunting' || individual.currentState === 'fleeing' ? 0.03 :
                individual.currentState === 'exploring' ? 0.02 : 0.015;
            individual.energy -= energyCost;
            // Hambre aumenta más despacio
            const hungerIncrease = individual.currentState === 'hunting' || individual.currentState === 'fleeing' ? 0.04 : 0.025;
            individual.hunger += hungerIncrease;            // Lógica de estado (IA simple)
            this.processWorld.processIndividual(individual, this.world);

            // Mover al individuo
            this.moveIndividual(individual);

            // Lógica de comer
            this.handleEating(individual);

            // Lógica de caza
            this.handleHunting(individual);

            // Comprobar si muere
            if (individual.age >= individual.maxAge) {
                individual.isAlive = false;
            }
        });

        // Lógica de reproducción
        this.handleReproduction();

        // Eliminar individuos muertos y comida consumida
        this.world.individuals = this.world.individuals.filter(ind => ind.isAlive);
        this.world.foodSources = this.world.foodSources.filter(food => !food.isConsumed);

        // SISTEMA DE ESCASEZ PROGRESIVA
        // Calcular tiempo transcurrido en minutos
        const elapsedMinutes = (Date.now() - this.simulationStartTime) / 60000;

        // Ajustar tasa de aparición de comida según tiempo transcurrido
        let adjustedFoodSpawnRate = this.world.foodSpawnRate;

        if (elapsedMinutes >= 15 && elapsedMinutes < 30) {
            // 15-30 min: reducir a la mitad (equivalente a duplicar intervalo)
            adjustedFoodSpawnRate = this.world.foodSpawnRate * 0.5;
        } else if (elapsedMinutes >= 30 && elapsedMinutes < 60) {
            // 30-60 min: reducir a 1/3 (equivalente a triplicar intervalo)
            adjustedFoodSpawnRate = this.world.foodSpawnRate * 0.33;
        } else if (elapsedMinutes >= 60) {
            // 60+ min: reducir a 1/4 (equivalente a cuadruplicar intervalo)
            adjustedFoodSpawnRate = this.world.foodSpawnRate * 0.25;
        }

        // Generar nueva comida (solo si no hay demasiada) con tasa ajustada
        if (this.world.foodSources.length < 2000 && Math.random() < adjustedFoodSpawnRate) {
            this.world.foodSources.push(this.foodFactory.createRandomFood(this.world.width, this.world.height));
            this.soundService.play('foodSpawn');
        }

        // Enviar estadísticas al callback si está registrado
        const seeking = this.world.individuals.filter(i => i.currentState === 'seekingMate').length;
        this.onStats?.({ population: this.world.individuals.length, food: this.world.foodSources.length, seekingMate: seeking, tick: this.world.tick });
    }

    /**
     * Dibuja el estado actual del mundo en el canvas.
     */
    private render() {
        // Limpiar el canvas
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Dibujar comida
        this.world.foodSources.forEach(food => {
            this.ctx.fillStyle = 'lightgreen';
            this.ctx.beginPath();
            this.ctx.arc(food.x, food.y, 5, 0, 2 * Math.PI);
            this.ctx.fill();
        });

        // Dibujar individuos
        this.world.individuals.forEach(individual => {
            this.ctx.fillStyle = individual.color;
            this.drawShape(individual);
        });

        // Dibujar texto estático y número de habitantes en el canvas
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('Send gifts to feed them', 10, 10);

        const population = this.world.individuals.length;
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText(`Population: ${population}`, 10, 40);

        const food = this.world.foodSources.length;
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText(`Food: ${food}`, 10, 70);
    }

    /**
     * IA simple: decide qué hacer a continuación.
     */
    private evaluateState(individual: Individual) {
        // Si el objetivo de comida ya no existe, lo olvidamos.
        if (individual.targetId && !this.world.foodSources.find(f => f.id === individual.targetId)) {
            individual.targetId = undefined;
            individual.currentState = 'wandering';
        }

        // Prioridad 1: Si tienes hambre, busca comida.
        if (individual.hunger > 60) {
            individual.currentState = 'seekingFood';
        } else if (individual.age > 18 && individual.energy > 60 && individual.cooldownUntil < this.world.tick) {
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
            // Si no tiene un objetivo, busca el más cercano
            if (!individual.targetId) {
                const closestFood = this.findClosestFood(individual);
                if (closestFood) {
                    individual.targetId = closestFood.id;
                }
            }
        }
        // ... otros estados
    }

    /**
     * Mueve al individuo hacia su objetivo o deambula.
     */
    private moveIndividual(individual: Individual) {
        let moveX = 0;
        let moveY = 0;

        if (individual.currentState === 'fleeing') {
            // Huir en dirección opuesta a las amenazas
            const threats = this.world.individuals.filter(other =>
                other.isAlive &&
                other.civilizationId !== individual.civilizationId &&
                Math.hypot(individual.x - other.x, individual.y - other.y) < individual.visionRange
            );

            if (threats.length > 0) {
                // Calcular dirección promedio de las amenazas
                let avgThreatX = 0, avgThreatY = 0;
                threats.forEach(threat => {
                    avgThreatX += threat.x;
                    avgThreatY += threat.y;
                });
                avgThreatX /= threats.length;
                avgThreatY /= threats.length;

                // Huir en dirección opuesta
                const dx = individual.x - avgThreatX;
                const dy = individual.y - avgThreatY;
                const distance = Math.hypot(dx, dy);

                if (distance > 0) {
                    moveX = (dx / distance) * individual.speed * 1.8; // Huir rápido
                    moveY = (dy / distance) * individual.speed * 1.8;
                }
            } else {
                // Ya no hay amenazas visibles
                moveX = (Math.random() - 0.5) * individual.speed;
                moveY = (Math.random() - 0.5) * individual.speed;
            }
        } else if (individual.currentState === 'following' && individual.targetId) {
            // Seguir a otro individuo (comportamiento social)
            const target = this.world.individuals.find(i => i.id === individual.targetId && i.isAlive);
            if (target) {
                const dx = target.x - individual.x;
                const dy = target.y - individual.y;
                const distance = Math.hypot(dx, dy);

                // Mantener cierta distancia (no pegarse demasiado)
                if (distance > individual.size * 3) {
                    moveX = (dx / distance) * individual.speed * 0.8;
                    moveY = (dy / distance) * individual.speed * 0.8;
                }
            }
        } else if (individual.currentState === 'seekingFood' && individual.targetId) {
            const targetFood = this.world.foodSources.find(f => f.id === individual.targetId);
            if (targetFood) {
                const dx = targetFood.x - individual.x;
                const dy = targetFood.y - individual.y;
                const distance = Math.hypot(dx, dy);

                // Moverse hacia el objetivo
                if (distance > 1) {
                    moveX = (dx / distance) * individual.speed;
                    moveY = (dy / distance) * individual.speed;
                }
            }
        } else if (individual.currentState === 'exploring') {
            // Movimiento de exploración: más direccional y persistente
            if (!individual.explorationTarget) {
                // Crear un punto objetivo aleatorio en el mundo
                individual.explorationTarget = {
                    x: Math.random() * this.world.width,
                    y: Math.random() * this.world.height
                };
            }

            const dx = individual.explorationTarget.x - individual.x;
            const dy = individual.explorationTarget.y - individual.y;
            const distance = Math.hypot(dx, dy);

            // Si llegó al objetivo, crear uno nuevo
            if (distance < 50) {
                individual.explorationTarget = {
                    x: Math.random() * this.world.width,
                    y: Math.random() * this.world.height
                };
            } else {
                // Moverse hacia el punto de exploración
                moveX = (dx / distance) * individual.speed * 1.2; // Un poco más rápido al explorar
                moveY = (dy / distance) * individual.speed * 1.2;
            }
        } else if (individual.currentState === 'hunting' && individual.targetId) {
            const prey = this.world.individuals.find(i => i.id === individual.targetId && i.isAlive);
            if (prey) {
                const dx = prey.x - individual.x;
                const dy = prey.y - individual.y;
                const distance = Math.hypot(dx, dy);

                // Moverse hacia la presa (más rápido por adrenalina)
                if (distance > 1) {
                    moveX = (dx / distance) * individual.speed * 1.5;
                    moveY = (dy / distance) * individual.speed * 1.5;
                }
            } else {
                // Presa murió o desapareció
                individual.targetId = undefined;
                individual.currentState = 'wandering';
            }
        } else {
            // Movimiento aleatorio para 'wandering'
            moveX = (Math.random() - 0.5) * individual.speed;
            moveY = (Math.random() - 0.5) * individual.speed;
        }

        individual.x = Math.max(0, Math.min(this.world.width, individual.x + moveX));
        individual.y = Math.max(0, Math.min(this.world.height, individual.y + moveY));
    }

    private findClosestFood(individual: Individual): Food | null {
        let closestFood: Food | null = null;
        let minDistance = individual.visionRange;

        for (const food of this.world.foodSources) {
            if (food.isConsumed) continue;

            const distance = Math.hypot(individual.x - food.x, individual.y - food.y);
            if (distance < minDistance) {
                minDistance = distance;
                closestFood = food;
            }
        }
        return closestFood;
    }

    private handleEating(individual: Individual) {
        if (individual.currentState !== 'seekingFood' || !individual.targetId) return;

        const targetFood = this.world.foodSources.find(f => f.id === individual.targetId && !f.isConsumed);

        if (targetFood) {
            const distance = Math.hypot(individual.x - targetFood.x, individual.y - targetFood.y);
            if (distance < individual.size) {
                // Comer la comida (mayor beneficio)
                targetFood.isConsumed = true;
                individual.hunger = Math.max(0, individual.hunger - 60);
                individual.energy = Math.min(100, individual.energy + 35);
                this.soundService.play('eat');

                // Olvidar el objetivo y volver a evaluar estado en el próximo ciclo
                individual.targetId = undefined;
                individual.currentState = 'idle';
            }
        }
    }

    private handleHunting(individual: Individual) {
        if (individual.currentState !== 'hunting' || !individual.targetId) return;

        const prey = this.world.individuals.find(i => i.id === individual.targetId && i.isAlive);

        if (!prey) {
            individual.targetId = undefined;
            individual.currentState = 'wandering';
            return;
        }

        const distance = Math.hypot(individual.x - prey.x, individual.y - prey.y);
        if (distance < individual.size + prey.size) {
            // Combate
            const hunterPower = individual.strength + individual.energy + (individual.dna.aggression * 50);
            const preyPower = prey.strength + prey.energy + (prey.dna.aggression * 50);

            if (hunterPower > preyPower * 1.2) { // Necesita superioridad clara
                // Victoria - el cazador consume a la presa
                prey.isAlive = false;
                individual.hunger = Math.max(0, individual.hunger - 80);
                individual.energy = Math.min(100, individual.energy + prey.energy * 0.5);
                this.soundService.play('kill');
                individual.targetId = undefined;
                individual.currentState = 'idle';
                // Aumentar miedo en individuos cercanos de la civilización de la presa
                this.world.individuals.filter(other =>
                    other.isAlive &&
                    other.civilizationId === prey.civilizationId &&
                    Math.hypot(other.x - prey.x, other.y - prey.y) < 200
                ).forEach(scared => {
                    if (!scared.fearLevel) scared.fearLevel = 0;
                    scared.fearLevel = Math.min(1, scared.fearLevel + 0.5);
                });

                // Actualizar stats de civilización
                const hunterCiv = this.world.civilizations.find(c => c.id === individual.civilizationId);
                if (hunterCiv && hunterCiv.totalKills !== undefined) {
                    hunterCiv.totalKills++;
                }
            } else {
                // La presa es más fuerte de lo esperado - huir
                individual.currentState = 'wandering';
                individual.targetId = undefined;
                individual.energy -= 5; // Perdió energía en el intento
            }
        }
    }

    /**
     * Gestiona la creación de nuevos individuos.
     */
    private handleReproduction() {
        const readyToMate = this.world.individuals.filter(
            ind => ind.isAlive &&
                ind.currentState === 'seekingMate' &&
                ind.energy > 50 && // Menos exigente
                ind.hunger < 50 // Menos exigente
        );

        for (let i = 0; i < readyToMate.length; i++) {
            const ind1 = readyToMate[i];

            // Si tiene un targetId específico (pareja seleccionada), solo reproducirse con ese
            if (ind1.targetId) {
                const ind2 = readyToMate.find(other => other.id === ind1.targetId);
                if (ind2 && ind1.civilizationId === ind2.civilizationId) {
                    const distance = Math.hypot(ind1.x - ind2.x, ind1.y - ind2.y);
                    if (distance < (ind1.size + ind2.size) * 2.5) {
                        this.reproduce(ind1, ind2);
                        continue;
                    }
                }
            }

            // Buscar pareja cercana compatible
            for (let j = i + 1; j < readyToMate.length; j++) {
                const ind2 = readyToMate[j];
                if (ind1.civilizationId !== ind2.civilizationId) continue;

                const distance = Math.hypot(ind1.x - ind2.x, ind1.y - ind2.y);
                if (distance < (ind1.size + ind2.size) * 2.5) {
                    this.reproduce(ind1, ind2);
                    break;
                }
            }
        }
    }

    private reproduce(parent1: Individual, parent2: Individual) {
        // Crear un nuevo individuo
        const newIndividual = this.individualFactory.createIndividual(
            parent1.civilizationId,
            parent1.race,
            parent1.color,
            Math.max(parent1.generation, parent2.generation) + 1
        );

        // Mezclar ADN (simple promedio)
        newIndividual.dna.aggression = (parent1.dna.aggression + parent2.dna.aggression) / 2;
        newIndividual.dna.curiosity = (parent1.dna.curiosity + parent2.dna.curiosity) / 2;
        newIndividual.dna.resilience = (parent1.dna.resilience + parent2.dna.resilience) / 2;

        // Aplicar una pequeña mutación
        if (Math.random() < newIndividual.dna.mutationRate) {
            newIndividual.dna.aggression += (Math.random() - 0.5) * 0.1;
        }

        // Posicionar al bebé cerca de los padres
        newIndividual.x = parent1.x;
        newIndividual.y = parent1.y;
        newIndividual.energy = 80;
        newIndividual.hunger = 10;

        // Añadir al mundo
        this.world.individuals.push(newIndividual);
        this.soundService.play('reproduction');

        // Poner a los padres en "cooldown" para que no se reproduzcan instantáneamente de nuevo
        const cooldownTicks = 80; // Cooldown más largo
        parent1.cooldownUntil = this.world.tick + cooldownTicks;
        parent2.cooldownUntil = this.world.tick + cooldownTicks;
        parent1.offspringCount++;
        parent2.offspringCount++;
        parent1.currentState = 'idle';
        parent2.currentState = 'idle';
        parent1.energy -= 8; // Menos costo energético
        parent2.energy -= 8;
    }

    private drawShape(individual: Individual) {
        const x = individual.x;
        const y = individual.y;
        const size = individual.size;

        this.ctx.beginPath();

        switch (individual.shape) {
            case 'circle':
                this.ctx.arc(x, y, size, 0, 2 * Math.PI);
                break;

            case 'square':
                this.ctx.rect(x - size, y - size, size * 2, size * 2);
                break;

            case 'triangle':
                this.ctx.moveTo(x, y - size);
                this.ctx.lineTo(x + size, y + size);
                this.ctx.lineTo(x - size, y + size);
                this.ctx.closePath();
                break;

            case 'diamond':
                this.ctx.moveTo(x, y - size);
                this.ctx.lineTo(x + size, y);
                this.ctx.lineTo(x, y + size);
                this.ctx.lineTo(x - size, y);
                this.ctx.closePath();
                break;
        }

        this.ctx.fill();
    }
}