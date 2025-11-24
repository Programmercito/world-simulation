import { Civilization } from "../models/civilization";
import civilizationNames from '../../data/civilization-names.json';

export class CivilizationFactory {
    private usedNames: Map<string, number> = new Map();
    private availableNames: string[] = [...civilizationNames.names];

    create(): Civilization {
        let name = this.getUniqueName();
        
        return {
            id: crypto.randomUUID(),
            name: name,
            color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
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

    private getUniqueName(): string {
        if (this.availableNames.length === 0) {
            // Si se acabaron los nombres, reiniciamos la lista
            this.availableNames = [...civilizationNames.names];
        }

        // Seleccionar un nombre aleatorio de los disponibles
        const randomIndex = Math.floor(Math.random() * this.availableNames.length);
        const baseName = this.availableNames[randomIndex];
        this.availableNames.splice(randomIndex, 1);

        // Si ya se usó este nombre, agregar numeración romana
        const count = this.usedNames.get(baseName) || 0;
        this.usedNames.set(baseName, count + 1);

        if (count === 0) {
            return baseName;
        } else {
            return `${baseName} ${this.toRoman(count + 1)}`;
        }
    }

    private toRoman(num: number): string {
        const romanNumerals = [
            { value: 10, numeral: 'X' },
            { value: 9, numeral: 'IX' },
            { value: 5, numeral: 'V' },
            { value: 4, numeral: 'IV' },
            { value: 1, numeral: 'I' }
        ];
        
        let result = '';
        for (const { value, numeral } of romanNumerals) {
            while (num >= value) {
                result += numeral;
                num -= value;
            }
        }
        return result;
    }
}