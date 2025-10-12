export class IndividualFactory {

    createIndividual(civilizationId: string, race: string, color: string, generation: number = 0): Individual {
        const canvasWidth = 2000;
        const canvasHeight = 2000;

        return {
            id:crypto.randomUUID(),
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

            // Capacidades físicas
            speed: 1 + Math.random() * 2, // entre 1 y 3
            visionRange: 50 + Math.random() * 100, // entre 50 y 150
            strength: 10 + Math.random() * 20, // entre 10 y 30
            fertility: true,

            // Genética y evolución
            dna: {
                aggression: Math.random(),       // 0 a 1
                curiosity: Math.random(),        // 0 a 1
                resilience: Math.random(),       // 0 a 1
                mutationRate: 0.01 + Math.random() * 0.04 // entre 0.01 y 0.05
            },

            // Ciclo de reproducción
            cooldownUntil: 0,
            offspringCount: 0,
            generation,

            // IA
            currentState: "idle",
            targetId: undefined,
            path: [],

            // Visualización
            color,
            size: 5 + Math.random() * 5 // entre 5 y 10 px
        };
    }
}