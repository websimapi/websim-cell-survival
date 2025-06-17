export class AudioManager {
    constructor() {
        this.sounds = {};
        this.volume = 0.5;
        this.muted = false;
        
        // Preload sounds
        this.preloadSounds();
    }
    
    preloadSounds() {
        this.loadSound('cellEaten', 'assets/cell-eaten.wav');
        this.loadSound('cellSplit', 'assets/cell-split.wav');
    }
    
    loadSound(name, url) {
        const audio = new Audio(url);
        audio.volume = this.volume;
        this.sounds[name] = audio;
    }
    
    play(soundName) {
        if (this.muted) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            // Create a new audio object each time to allow overlapping sounds
            const soundClone = sound.cloneNode();
            soundClone.volume = this.volume;
            soundClone.play();
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        // Update volume for all sounds
        for (const sound in this.sounds) {
            this.sounds[sound].volume = this.volume;
        }
    }
    
    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }
}