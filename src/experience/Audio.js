import * as THREE from 'three';
import gsap from 'gsap';

export default class AudioManager {
    constructor() {
        this.listener = null;
        this.sounds = {};
        // Solo incluir los archivos de audio que realmente existen
        this.audioSources = {
            crowd: '/audio/crowd.mp3',
            heartbeat: '/audio/heartbeat.mp3',
            // Comentamos los que no existen por ahora
            // goal: '/audio/goal.mp3',
            // fail: '/audio/fail.mp3',
            // whistle: '/audio/whistle.mp3',
        };
    }

    init() {
        // La creación del AudioContext debe estar tras un gesto del usuario
        this.listener = new THREE.AudioListener();
        const audioLoader = new THREE.AudioLoader();

        Object.entries(this.audioSources).forEach(([name, path]) => {
            const sound = new THREE.Audio(this.listener);
            this.sounds[name] = sound;
            audioLoader.load(path, (buffer) => {
                sound.setBuffer(buffer);
                sound.setVolume(0.5);
                
                // Configurar la multitud para que siempre suene en loop
                if (name === 'crowd') {
                    sound.setLoop(true);
                    sound.setVolume(0.3); // Volumen base más bajo
                }
            });
        });
    }

    play(name, loop = false) {
        const sound = this.sounds[name];
        if (sound && sound.buffer && !sound.isPlaying) {
            sound.setLoop(loop);
            try {
                sound.play();
            } catch (error) {
                console.warn(`Could not play sound: ${name}`, error);
            }
        } else if (!sound) {
            console.warn(`Sound not found: ${name}`);
        }
    }

    stop(name) {
        const sound = this.sounds[name];
        if (sound && sound.isPlaying) {
            sound.stop();
        }
    }

    fade(name, targetVolume, duration) {
        const sound = this.sounds[name];
        if (sound) {
            gsap.to(sound, { volume: targetVolume, duration: duration });
        }
    }

    ensureCrowdPlaying() {
        const crowd = this.sounds['crowd'];
        if (crowd && !crowd.isPlaying && crowd.buffer) {
            crowd.setLoop(true);
            crowd.setVolume(0.3);
            crowd.play();
        }
    }

    setCrowdVolume(volume) {
        const crowd = this.sounds['crowd'];
        if (crowd) {
            crowd.setVolume(volume);
        }
    }
}