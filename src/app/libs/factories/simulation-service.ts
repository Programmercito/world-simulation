import { WorldFactory } from '../factories/world-factory';
import { IndividualFactory } from '../factories/individual-factory';
import { FoodFactory } from '../factories/food-factory';
import { World } from '../models/world';
import { Individual } from '../models/individual';
import { Food } from '../models/food';
import { ProcessWorld } from '../services/ia/process-world';

export class SimulationService {
    public onStats?: (stats: { population: number; food: number; seekingMate: number; tick: number }) => void;
    public getStats() {
        const seeking = this.world.individuals.filter(i => i.currentState === 'seekingMate').length;
        return { population: this.world.individuals.length, food: this.world.foodSources.length, seekingMate: seeking, tick: this.world.tick };
    }
    private world: World;
    private ctx: CanvasRenderingContext2D;
    private worldFactory = new WorldFactory();
    private individualFactory = new IndividualFactory();
    private foodFactory = new FoodFactory();
    private processWorld = new ProcessWorld();
    private lastTimestamp = 0;
    private isRunning = false;

    constructor(canvasContext: CanvasRenderingContext2D) {
        this.ctx = canvasContext;
        // Inicializamos el mundo al crear el servicio
        this.world = this.worldFactory.create(3, 20, 400);
    }

    public start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTimestamp = 0; // Reset timestamp
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

        // Actualizar atributos básicos
        individual.age += 0.005; // La edad avanza en cada tick
        individual.energy -= 0.05; // Cuesta energía existir
        individual.hunger += 0.08;            // Lógica de estado (IA simple)
            this.processWorld.processIndividual(individual, this.world);

            // Mover al individuo
            this.moveIndividual(individual);

            // Lógica de comer
            this.handleEating(individual);

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

        // Generar nueva comida (solo si no hay demasiada)
        if (this.world.foodSources.length < 2000 && Math.random() < this.world.foodSpawnRate) {
            this.world.foodSources.push(this.foodFactory.createRandomFood(this.world.width, this.world.height));
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

        // No draw stats in canvas anymore; stats are displayed in the HTML UI
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

        if (individual.currentState === 'seekingFood' && individual.targetId) {
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
                // Comer la comida
                targetFood.isConsumed = true;
                individual.hunger = Math.max(0, individual.hunger - 50); // Reduce el hambre
                individual.energy = Math.min(100, individual.energy + 20); // Gana energía

                // Olvidar el objetivo y volver a evaluar estado en el próximo ciclo
                individual.targetId = undefined;
                individual.currentState = 'idle';
            }
        }
    }

    /**
     * Gestiona la creación de nuevos individuos.
     */
    private handleReproduction() {
        const readyToMate = this.world.individuals.filter(
            ind => ind.isAlive && ind.currentState === 'seekingMate'
        );

        for (let i = 0; i < readyToMate.length; i++) {
            for (let j = i + 1; j < readyToMate.length; j++) {
                const ind1 = readyToMate[i];
                const ind2 = readyToMate[j];

                // Deben ser de la misma civilización y estar cerca
                if (ind1.civilizationId !== ind2.civilizationId) continue;

                const distance = Math.hypot(ind1.x - ind2.x, ind1.y - ind2.y);
                if (distance < (ind1.size + ind2.size) * 2) {
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

        // Poner a los padres en "cooldown" para que no se reproduzcan instantáneamente de nuevo
        const cooldownTicks = 50;
        parent1.cooldownUntil = this.world.tick + cooldownTicks;
        parent2.cooldownUntil = this.world.tick + cooldownTicks;
        parent1.offspringCount++;
        parent2.offspringCount++;
        parent1.currentState = 'idle';
        parent2.currentState = 'idle';
        parent1.energy -= 10;
        parent2.energy -= 10;
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