import { Civilization } from "../models/civilization";

export class CivilizationFactory {
    create(): Civilization {
        return {
            id: crypto.randomUUID(),
            name: 'Civilización',
            color: '#' + Math.floor(Math.random() * 16777215).toString(16),
            foundingGeneration: Math.floor(Math.random() * 10),
            reproductionRules: {
                minAge: Math.floor(Math.random() * 5) + 1,
                energyThreshold: 30 + Math.random() * 70,
                maxOffspring: Math.floor(Math.random() * 3) + 1
            },
            mutationBias: {
                aggression: (Math.random() - 0.5) * 0.1,
                curiosity: (Math.random() - 0.5) * 0.1,
                resilience: (Math.random() - 0.5) * 0.1
            },
            population: Math.floor(Math.random() * 100),
            totalDeaths: 0,
            totalBirths: 0
        };
    }


}