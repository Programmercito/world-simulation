export class SoundService {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled = true;

  constructor() {
    this.loadSounds();
  }

  private loadSounds() {
    // Cargar archivos MP3 desde el directorio public/sounds/
    this.sounds.set('eat', new Audio('sounds/eat.mp3'));
    this.sounds.set('foodSpawn', new Audio('sounds/food-spawn.mp3'));
    this.sounds.set('kill', new Audio('sounds/kill.mp3'));
    this.sounds.set('reproduction', new Audio('sounds/reproduction.mp3'));
    this.sounds.set('victory', new Audio('sounds/victory.mp3'));

    // Precargar todos los sonidos
    this.sounds.forEach(audio => {
      audio.volume = 0.3;
      audio.load();
    });
  }

  play(soundName: string) {
    if (!this.enabled) return;
    
    const sound = this.sounds.get(soundName);
    if (sound) {
      // Clonar el audio para permitir múltiples reproducciones simultáneas
      const clone = sound.cloneNode() as HTMLAudioElement;
      clone.volume = 0.3;
      clone.play().catch(err => {
        // Ignorar errores de autoplay
        console.debug('Audio play prevented:', err);
      });
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
