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
    public onVictory?: (civilizationName: string) => void;
    public getStats() {
        const seeking = this.world.individuals.filter(i => i.currentState === 'seekingMate').length;
        return { population: this.world.individuals.length, food: this.world.foodSources.length, seekingMate: seeking, tick: this.world.tick };
    }

    public addFood() {
        this.world.foodSources.push(this.foodFactory.createRandomFood(this.world.width, this.world.height));
        this.soundService.play('foodSpawn');
        this.addEvent('🍔 Comida agregada');
    }

    public addFoodBatch(quantity: number) {
        for (let i = 0; i < quantity; i++) {
            this.world.foodSources.push(this.foodFactory.createRandomFood(this.world.width, this.world.height));
        }
        this.soundService.play('foodSpawn');
        this.addEvent(`🍔 +${quantity} comida agregada`);

        // Crear notificación GIGANTE temporal (dura ~3 segundos = 60 ticks aprox)
        this.donationNotification = {
            message: `💎 ¡DONACIÓN! +${quantity} COMIDA 🍔`,
            ticksRemaining: 60
        };

        console.log(`Added ${quantity} food items to the world`);
    }

    public removeFoodBatch(quantity: number) {
        // Remove food items (for testing)
        const itemsToRemove = Math.min(quantity, this.world.foodSources.length);
        this.world.foodSources.splice(0, itemsToRemove);

        console.log(`Removed ${itemsToRemove} food items from the world (requested: ${quantity})`);
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
    private eventLog: string[] = []; // Log de eventos recientes (max 5)
    private winnerCivilization: string | null = null; // Nombre de la civilización ganadora
    private foodSpawnTickCounter = 0; // Contador de ticks para spawn de comida
    private ticksPerFoodSpawn = 0; // Ticks necesarios para spawn de comida
    private donationNotification: { message: string; ticksRemaining: number } | null = null; // Notificación temporal de donación

    constructor(canvasContext: CanvasRenderingContext2D, civilizations?: number, individuals?: number, food?: number, width?: number, height?: number, foodSpawnIntervalSeconds?: number) {
        this.ctx = canvasContext;
        // Inicializamos el mundo al crear el servicio (usa valores por defecto del factory o los proporcionados)
        this.world = this.worldFactory.create(civilizations, individuals, food, width, height, foodSpawnIntervalSeconds);

        // Calcular ticks necesarios para spawn de comida (intervalo fijo)
        if (foodSpawnIntervalSeconds && foodSpawnIntervalSeconds > 0) {
            this.ticksPerFoodSpawn = Math.floor((foodSpawnIntervalSeconds * 1000) / this.world.cycleDurationMs);
        }
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

    public setFoodSpawnInterval(intervalSeconds: number) {
        if (intervalSeconds > 0) {
            this.ticksPerFoodSpawn = Math.floor((intervalSeconds * 1000) / this.world.cycleDurationMs);
            console.log(`Intervalo de spawn de comida actualizado: ${intervalSeconds}s (${this.ticksPerFoodSpawn} ticks)`);
        } else {
            this.ticksPerFoodSpawn = 0; // Desactivar spawn automático
            console.log('Spawn automático de comida desactivado');
        }
    }

    private addEvent(message: string) {
        this.eventLog.unshift(message); // Agregar al inicio
        if (this.eventLog.length > 5) {
            this.eventLog.pop(); // Mantener solo los últimos 5
        }
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

        // Actualizar notificación de donación
        if (this.donationNotification) {
            this.donationNotification.ticksRemaining--;
            if (this.donationNotification.ticksRemaining <= 0) {
                this.donationNotification = null;
            }
        }

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
                this.addEvent('💀 Murió de vejez');
            }
            // Muerte por hambre extrema
            if (individual.hunger >= 100) {
                individual.isAlive = false;
                const civ = this.world.civilizations.find(c => c.id === individual.civilizationId);
                this.addEvent(`💀 ${civ?.name || 'Alguien'} murió de hambre`);
            }
            // Muerte por agotamiento de energía
            if (individual.energy <= 0) {
                individual.isAlive = false;
                const civ = this.world.civilizations.find(c => c.id === individual.civilizationId);
                this.addEvent(`💀 ${civ?.name || 'Alguien'} murió de agotamiento`);
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

        // Ajustar intervalo de spawn según tiempo transcurrido (multiplicador de ticks)
        let spawnIntervalMultiplier = 1;

        if (elapsedMinutes >= 15 && elapsedMinutes < 30) {
            // 15-30 min: duplicar intervalo
            spawnIntervalMultiplier = 2;
        } else if (elapsedMinutes >= 30 && elapsedMinutes < 60) {
            // 30-60 min: triplicar intervalo
            spawnIntervalMultiplier = 3;
        } else if (elapsedMinutes >= 60) {
            // 60+ min: cuadruplicar intervalo
            spawnIntervalMultiplier = 4;
        }

        // Generar nueva comida cada X ticks (intervalo fijo)
        if (this.ticksPerFoodSpawn > 0 && this.world.foodSources.length < 2000) {
            this.foodSpawnTickCounter++;
            const adjustedTicksPerSpawn = this.ticksPerFoodSpawn * spawnIntervalMultiplier;

            if (this.foodSpawnTickCounter >= adjustedTicksPerSpawn) {
                this.world.foodSources.push(this.foodFactory.createRandomFood(this.world.width, this.world.height));
                this.soundService.play('foodSpawn');
                this.addEvent('🌱 Comida apareció naturalmente');
                this.foodSpawnTickCounter = 0; // Resetear contador
                console.log(`Food spawned! Interval: ${(adjustedTicksPerSpawn * this.world.cycleDurationMs / 1000).toFixed(2)}s (multiplier: ${spawnIntervalMultiplier}x)`);
            }
        }

        // Enviar estadísticas al callback si está registrado
        const seeking = this.world.individuals.filter(i => i.currentState === 'seekingMate').length;
        this.onStats?.({ population: this.world.individuals.length, food: this.world.foodSources.length, seekingMate: seeking, tick: this.world.tick });

        // Detectar victoria (solo una civilización con población)
        if (!this.winnerCivilization) {
            const civilizationsAlive = this.world.civilizations.filter(civ => {
                const population = this.world.individuals.filter(ind => ind.isAlive && ind.civilizationId === civ.id).length;
                return population > 0;
            });

            if (civilizationsAlive.length === 1) {
                this.winnerCivilization = civilizationsAlive[0].name;
                this.soundService.play('victory');
                this.addEvent(`🏆 ${this.winnerCivilization} ha ganado!`);
                this.stop();
                this.onVictory?.(this.winnerCivilization); // Notificar victoria
            }
        }
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

        // Dibujar estadísticas centradas verticalmente en el canvas
        const centerY = this.ctx.canvas.height / 2;

        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 33px Arial'; // Aumentado para móvil
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';

        // Título
        this.ctx.fillText('Simulation IA world v1.5', 10, centerY - 100);

        // Estadísticas
        const population = this.world.individuals.length;
        this.ctx.fillText(`Population: ${population}`, 10, centerY - 50);

        const food = this.world.foodSources.length;
        this.ctx.fillText(`Food: ${food}`, 10, centerY);

        // ========== INDICADORES DE URGENCIA ==========

        // Calcular métricas de urgencia
        const starvingIndividuals = this.world.individuals.filter(i => i.hunger > 70).length;
        const averageHunger = this.world.individuals.reduce((sum, i) => sum + i.hunger, 0) / Math.max(1, population);
        const foodPerCreature = food / Math.max(1, population);

        // CONTADOR DE CRIATURAS MURIENDO
        const urgencyY = 80; // Posición superior
        if (starvingIndividuals > 0) {
            this.ctx.font = 'bold 42px Arial';
            this.ctx.fillStyle = '#FF3333'; // Rojo brillante
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 3;
            const starvingText = `💀 ${starvingIndividuals} MURIENDO DE HAMBRE`;
            this.ctx.strokeText(starvingText, 10, urgencyY);
            this.ctx.fillText(starvingText, 10, urgencyY);

            // Efecto pulsante
            if (Math.floor(this.world.tick / 10) % 2 === 0) {
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                this.ctx.fillRect(0, urgencyY - 30, this.ctx.canvas.width, 60);
            }
        }

        // BARRA DE HAMBRE GLOBAL
        const barY = urgencyY + 60;
        const barWidth = this.ctx.canvas.width * 0.6;
        const barHeight = 40;
        const barX = 10;

        // Fondo de la barra
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        // Barra de hambre (rojo = más hambre)
        // Limitar entre 0 y 1 para evitar desbordamiento
        const hungerPercent = Math.min(1, Math.max(0, averageHunger / 100));
        const hungerColor = hungerPercent > 0.7 ? '#FF3333' :
            hungerPercent > 0.4 ? '#FFA500' : '#00FF00';
        this.ctx.fillStyle = hungerColor;
        this.ctx.fillRect(barX, barY, barWidth * hungerPercent, barHeight);

        // Borde de la barra
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Texto de la barra
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 28px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 2;
        // Limitar el valor mostrado entre 0 y 100
        const displayHunger = Math.min(100, Math.max(0, Math.round(averageHunger)));
        const hungerText = `HAMBRE GLOBAL: ${displayHunger}%`;
        this.ctx.strokeText(hungerText, barX + barWidth / 2, barY + barHeight / 2);
        this.ctx.fillText(hungerText, barX + barWidth / 2, barY + barHeight / 2);

        // TIMER HASTA EXTINCIÓN
        const timerY = barY + 60;
        this.ctx.textAlign = 'left';

        // Calcular tiempo estimado hasta extinción (muy simplificado)
        let extinctionWarning = '';
        let extinctionColor = '#00FF00';

        if (foodPerCreature < 0.1) {
            extinctionWarning = '⏰ EXTINCIÓN INMINENTE - ¡DONA AHORA!';
            extinctionColor = '#FF0000';
            // Efecto de parpadeo rápido
            if (Math.floor(this.world.tick / 5) % 2 === 0) {
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
                this.ctx.fillRect(0, timerY - 25, this.ctx.canvas.width, 50);
            }
        } else if (foodPerCreature < 0.3) {
            extinctionWarning = '⚠️ CRISIS ALIMENTARIA - Se necesita comida';
            extinctionColor = '#FFA500';
        } else if (foodPerCreature < 0.5) {
            extinctionWarning = '⚡ Comida escasa';
            extinctionColor = '#FFFF00';
        }

        if (extinctionWarning) {
            this.ctx.font = 'bold 38px Arial';
            this.ctx.fillStyle = extinctionColor;
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(extinctionWarning, 10, timerY);
            this.ctx.fillText(extinctionWarning, 10, timerY);
        }

        // Resetear alineación para el resto del texto
        this.ctx.textAlign = 'left';

        // Log de eventos (debajo de las estadísticas)
        this.ctx.font = 'bold 36px Arial'; // MUCHO MÁS GRANDE para visibilidad
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.lineWidth = 3;
        let eventY = centerY + 50;
        this.eventLog.forEach((event, index) => {
            // Dibujar borde negro para mejor contraste
            this.ctx.strokeText(event, 10, eventY + (index * 45));
            this.ctx.fillText(event, 10, eventY + (index * 45));
        });

        // NOTIFICACIÓN GIGANTE DE DONACIÓN
        if (this.donationNotification) {
            // Calcular opacidad basada en tiempo restante (fade out en los últimos 15 ticks)
            const opacity = this.donationNotification.ticksRemaining < 15
                ? this.donationNotification.ticksRemaining / 15
                : 1;

            // Fondo semi-transparente pulsante
            const pulseIntensity = Math.sin(this.world.tick * 0.3) * 0.1 + 0.3;
            this.ctx.fillStyle = `rgba(255, 215, 0, ${pulseIntensity * opacity})`; // Dorado pulsante

            const notifY = this.ctx.canvas.height / 3;
            const notifWidth = this.ctx.canvas.width * 0.9;
            const notifHeight = 150;
            const notifX = (this.ctx.canvas.width - notifWidth) / 2;

            // Dibujar rectángulo con bordes redondeados
            this.ctx.beginPath();
            const radius = 20;
            this.ctx.moveTo(notifX + radius, notifY);
            this.ctx.lineTo(notifX + notifWidth - radius, notifY);
            this.ctx.quadraticCurveTo(notifX + notifWidth, notifY, notifX + notifWidth, notifY + radius);
            this.ctx.lineTo(notifX + notifWidth, notifY + notifHeight - radius);
            this.ctx.quadraticCurveTo(notifX + notifWidth, notifY + notifHeight, notifX + notifWidth - radius, notifY + notifHeight);
            this.ctx.lineTo(notifX + radius, notifY + notifHeight);
            this.ctx.quadraticCurveTo(notifX, notifY + notifHeight, notifX, notifY + notifHeight - radius);
            this.ctx.lineTo(notifX, notifY + radius);
            this.ctx.quadraticCurveTo(notifX, notifY, notifX + radius, notifY);
            this.ctx.closePath();
            this.ctx.fill();

            // Borde brillante
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * opacity})`;
            this.ctx.lineWidth = 5;
            this.ctx.stroke();

            // Texto GIGANTE
            this.ctx.font = 'bold 72px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // Sombra del texto
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetX = 4;
            this.ctx.shadowOffsetY = 4;

            // Texto con gradiente
            const gradient = this.ctx.createLinearGradient(0, notifY, 0, notifY + notifHeight);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
            gradient.addColorStop(1, `rgba(255, 200, 0, ${opacity})`);
            this.ctx.fillStyle = gradient;

            this.ctx.fillText(
                this.donationNotification.message,
                this.ctx.canvas.width / 2,
                notifY + notifHeight / 2
            );

            // Resetear sombra
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
        }

        // Mensaje de victoria (si hay ganador)
        if (this.winnerCivilization) {
            // Fondo semi-transparente
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

            // Texto de victoria
            this.ctx.fillStyle = '#FFD700'; // Dorado
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            const victoryY = this.ctx.canvas.height / 2;
            this.ctx.fillText('🏆 VICTORIA 🏆', this.ctx.canvas.width / 2, victoryY - 40);

            this.ctx.font = 'bold 36px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(this.winnerCivilization, this.ctx.canvas.width / 2, victoryY + 20);

            this.ctx.font = '24px Arial';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fillText('ha conquistado el mundo', this.ctx.canvas.width / 2, victoryY + 60);
        }
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

            if (hunterPower > preyPower * 1.1) { // RELAJADO: Solo necesita 10% de superioridad (antes 20%)
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
                const preyCiv = this.world.civilizations.find(c => c.id === prey.civilizationId);
                if (hunterCiv && hunterCiv.totalKills !== undefined) {
                    hunterCiv.totalKills++;
                }
                // Agregar evento
                this.addEvent(`💀 ${hunterCiv?.name || 'Alguien'} eliminó a ${preyCiv?.name || 'alguien'}`);
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

        // Agregar evento
        const civ = this.world.civilizations.find(c => c.id === newIndividual.civilizationId);
        const creatureType = newIndividual.race === 'circle' ? 'Bestia' :
            newIndividual.race === 'square' ? 'Titán' :
                newIndividual.race === 'triangle' ? 'Depredador' : 'Criatura';
        this.addEvent(`👶 Nació ${creatureType} de ${civ?.name || 'desconocido'}`);

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

        this.ctx.save();

        switch (individual.shape) {
            case 'circle':
                // Bestia redonda con cuerpo y ojos
                this.ctx.fillStyle = individual.color;
                this.ctx.beginPath();
                this.ctx.arc(x, y, size, 0, 2 * Math.PI);
                this.ctx.fill();

                // Ojos
                this.ctx.fillStyle = 'white';
                this.ctx.beginPath();
                this.ctx.arc(x - size * 0.3, y - size * 0.2, size * 0.25, 0, 2 * Math.PI);
                this.ctx.arc(x + size * 0.3, y - size * 0.2, size * 0.25, 0, 2 * Math.PI);
                this.ctx.fill();

                // Pupilas
                this.ctx.fillStyle = 'black';
                this.ctx.beginPath();
                this.ctx.arc(x - size * 0.3, y - size * 0.2, size * 0.12, 0, 2 * Math.PI);
                this.ctx.arc(x + size * 0.3, y - size * 0.2, size * 0.12, 0, 2 * Math.PI);
                this.ctx.fill();

                // Boca
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.lineWidth = 1.5;
                this.ctx.beginPath();
                this.ctx.arc(x, y + size * 0.2, size * 0.4, 0.2, Math.PI - 0.2);
                this.ctx.stroke();
                break;

            case 'square':
                // Titán cuadrado robusto
                this.ctx.fillStyle = individual.color;
                this.ctx.fillRect(x - size, y - size, size * 2, size * 2);

                // Borde más oscuro para dar profundidad
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(x - size, y - size, size * 2, size * 2);

                // Ojos cuadrados
                this.ctx.fillStyle = 'white';
                this.ctx.fillRect(x - size * 0.5, y - size * 0.5, size * 0.4, size * 0.4);
                this.ctx.fillRect(x + size * 0.1, y - size * 0.5, size * 0.4, size * 0.4);

                // Pupilas
                this.ctx.fillStyle = 'black';
                this.ctx.fillRect(x - size * 0.4, y - size * 0.4, size * 0.2, size * 0.2);
                this.ctx.fillRect(x + size * 0.2, y - size * 0.4, size * 0.2, size * 0.2);

                // Líneas de armadura
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(x - size, y);
                this.ctx.lineTo(x + size, y);
                this.ctx.stroke();
                break;

            case 'triangle':
                // Depredador triangular afilado
                this.ctx.fillStyle = individual.color;
                this.ctx.beginPath();
                this.ctx.moveTo(x, y - size);
                this.ctx.lineTo(x + size, y + size);
                this.ctx.lineTo(x - size, y + size);
                this.ctx.closePath();
                this.ctx.fill();

                // Borde afilado
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();

                // Ojos amenazantes
                this.ctx.fillStyle = 'red';
                this.ctx.beginPath();
                this.ctx.arc(x - size * 0.25, y - size * 0.2, size * 0.2, 0, 2 * Math.PI);
                this.ctx.arc(x + size * 0.25, y - size * 0.2, size * 0.2, 0, 2 * Math.PI);
                this.ctx.fill();

                // Pupilas
                this.ctx.fillStyle = 'black';
                this.ctx.beginPath();
                this.ctx.arc(x - size * 0.25, y - size * 0.2, size * 0.1, 0, 2 * Math.PI);
                this.ctx.arc(x + size * 0.25, y - size * 0.2, size * 0.1, 0, 2 * Math.PI);
                this.ctx.fill();

                // Colmillos
                this.ctx.fillStyle = 'white';
                this.ctx.beginPath();
                this.ctx.moveTo(x - size * 0.15, y + size * 0.3);
                this.ctx.lineTo(x - size * 0.05, y + size * 0.6);
                this.ctx.lineTo(x - size * 0.25, y + size * 0.6);
                this.ctx.closePath();
                this.ctx.moveTo(x + size * 0.15, y + size * 0.3);
                this.ctx.lineTo(x + size * 0.05, y + size * 0.6);
                this.ctx.lineTo(x + size * 0.25, y + size * 0.6);
                this.ctx.closePath();
                this.ctx.fill();
                break;

            case 'diamond':
                // Criatura de diamante mística
                this.ctx.fillStyle = individual.color;
                this.ctx.beginPath();
                this.ctx.moveTo(x, y - size);
                this.ctx.lineTo(x + size, y);
                this.ctx.lineTo(x, y + size);
                this.ctx.lineTo(x - size, y);
                this.ctx.closePath();
                this.ctx.fill();

                // Brillo cristalino
                const gradient = this.ctx.createLinearGradient(x - size, y - size, x + size, y + size);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                this.ctx.fillStyle = gradient;
                this.ctx.fill();

                // Borde brillante
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();

                // Ojos místicos
                this.ctx.fillStyle = 'cyan';
                this.ctx.beginPath();
                this.ctx.arc(x - size * 0.3, y - size * 0.1, size * 0.2, 0, 2 * Math.PI);
                this.ctx.arc(x + size * 0.3, y - size * 0.1, size * 0.2, 0, 2 * Math.PI);
                this.ctx.fill();

                // Pupilas brillantes
                this.ctx.fillStyle = 'white';
                this.ctx.beginPath();
                this.ctx.arc(x - size * 0.3, y - size * 0.1, size * 0.08, 0, 2 * Math.PI);
                this.ctx.arc(x + size * 0.3, y - size * 0.1, size * 0.08, 0, 2 * Math.PI);
                this.ctx.fill();

                // Patrón interno
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(x, y - size * 0.5);
                this.ctx.lineTo(x, y + size * 0.5);
                this.ctx.moveTo(x - size * 0.5, y);
                this.ctx.lineTo(x + size * 0.5, y);
                this.ctx.stroke();
                break;
        }

        this.ctx.restore();
    }
}