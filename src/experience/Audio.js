import * as THREE from 'three';
import gsap from 'gsap';

export default class AudioManager {
    constructor() {
        this.listener = null;
        this.sounds = {};
        // Audio de penal y estadio
        this.audioSources = {
            montiel: [
                './audio/montiel.weba',
                '/audio/montiel.weba',
                'audio/montiel.weba',
                './public/audio/montiel.weba',
                '/public/audio/montiel.weba'
            ]
        };
        
        // Crear sonidos sintéticos para el estadio
        this.crowdAudio = null;
        this.ambientAudio = null;
        
        // Inicializar audio automáticamente
        console.log('🎵 AudioManager constructor - auto-initializing...');
        this.autoInit();
    }

    autoInit() {
        try {
            this.listener = new THREE.AudioListener();
            console.log('AudioListener created automatically');
            
            // Intentar cargar audios inmediatamente
            Object.entries(this.audioSources).forEach(([name, paths]) => {
                const sound = new THREE.Audio(this.listener);
                this.sounds[name] = sound;
                
                console.log(`Auto-loading audio: ${name}`);
                this.tryLoadAudio(name, paths, 0, sound);
            });
            
            // Crear sonidos sintéticos del estadio
            this.createSyntheticStadiumAudio();
        } catch (error) {
            console.error('Error in auto-init:', error);
        }
    }

    init(camera = null) {
        console.log('🎵 AudioManager.init() called');
        console.log('Camera provided:', !!camera);
        
        // La creación del AudioContext debe estar tras un gesto del usuario
        this.listener = new THREE.AudioListener();
        console.log('AudioListener created:', this.listener);
        
        // Si se proporciona una cámara, añadir el listener a ella
        if (camera) {
            camera.add(this.listener);
            console.log('AudioListener added to camera');
        }
        
        const audioLoader = new THREE.AudioLoader();
        console.log('AudioLoader created:', audioLoader);
        console.log('Audio sources to load:', this.audioSources);

        Object.entries(this.audioSources).forEach(([name, paths]) => {
            const sound = new THREE.Audio(this.listener);
            this.sounds[name] = sound;
            
            console.log(`Attempting to load audio: ${name}`);
            console.log(`Available paths:`, paths);
            
            // Intentar cargar desde la primera ruta
            this.tryLoadAudio(name, paths, 0, sound);
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

    ensureMontielReady() {
        const montiel = this.sounds['montiel'];
        console.log('🔊 Checking montiel audio...', !!montiel, !!montiel?.buffer);
        
        if (montiel && montiel.buffer) {
            console.log('✅ Montiel audio is ready!');
            return true;
        } else {
            console.warn('⚠️ Montiel audio not ready yet');
            return false;
        }
    }

    // Activar audio context después de interacción del usuario
    activateAudioContext() {
        const montiel = this.sounds['montiel'];
        if (montiel && montiel.buffer) {
            // Reproducir y pausar inmediatamente para activar el contexto
            try {
                montiel.setVolume(0); // Volumen 0 para que no se escuche
                montiel.play();
                setTimeout(() => {
                    montiel.stop();
                    montiel.setVolume(0.8); // Restaurar volumen para uso posterior
                    console.log('🎵 Audio context activated! Montiel ready to play.');
                }, 100);
            } catch (error) {
                console.error('Error activating audio context:', error);
            }
        }
    }

    playMontiel() {
        const montiel = this.sounds['montiel'];
        console.log('🎙️ Attempting to play Montiel...', !!montiel, !!montiel?.buffer);
        
        if (montiel && montiel.buffer) {
            if (montiel.isPlaying) {
                montiel.stop(); // Detener si ya está sonando
                console.log('🔄 Stopped previous Montiel playback');
            }
            
            montiel.setVolume(0.8); // Volumen alto para Montiel
            
            try {
                montiel.play();
                console.log('🎙️ ¡MONTIEL SUENA! Volume:', montiel.volume);
            } catch (error) {
                console.error('❌ Error playing Montiel audio:', error);
                // Intentar después de un pequeño delay
                setTimeout(() => {
                    try {
                        montiel.play();
                        console.log('🎙️ ¡MONTIEL SUENA EN RETRY!');
                    } catch (e) {
                        console.error('❌ Retry failed:', e);
                    }
                }, 500);
            }
        } else {
            console.warn('⚠️ Montiel audio not ready yet');
        }
    }

    // Método de diagnóstico
    getAudioStatus() {
        const status = {};
        Object.entries(this.sounds).forEach(([name, sound]) => {
            status[name] = {
                loaded: !!sound.buffer,
                playing: sound.isPlaying,
                volume: sound.volume,
                context: sound.context?.state || 'unknown'
            };
        });
        console.log('📊 Audio Status Details:', status);
        return status;
    }

    createSyntheticStadiumAudio() {
        if (!this.listener) return;
        
        console.log('🎵 Creating synthetic stadium audio...');
        
        // Crear audio de multitud usando Web Audio API
        const audioContext = this.listener.context;
        
        if (audioContext) {
            this.createCrowdNoise(audioContext);
            this.createAmbientNoise(audioContext);
        }
    }

    createCrowdNoise(audioContext) {
        try {
            // Crear un buffer para ruido de multitud
            const bufferSize = audioContext.sampleRate * 2; // 2 segundos
            const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            // Generar ruido rosa filtrado que simula una multitud
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                const pink = white * (0.02 + 0.98 * Math.sin(i * 0.001)); // Filtro simple
                data[i] = pink * 0.3; // Volumen moderado
            }
            
            // Crear el audio usando Three.js
            this.crowdAudio = new THREE.Audio(this.listener);
            this.crowdAudio.setBuffer(buffer);
            this.crowdAudio.setLoop(true);
            this.crowdAudio.setVolume(0.2);
            
            console.log('✅ Crowd noise created');
        } catch (error) {
            console.error('Error creating crowd noise:', error);
        }
    }

    createAmbientNoise(audioContext) {
        try {
            // Crear ambiente del estadio (viento, eco, etc.)
            const bufferSize = audioContext.sampleRate * 3; // 3 segundos
            const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            // Generar ruido ambiente muy suave
            for (let i = 0; i < bufferSize; i++) {
                const ambient = (Math.random() * 2 - 1) * 0.05; // Muy suave
                const echo = Math.sin(i * 0.0001) * 0.02; // Efecto de eco
                data[i] = ambient + echo;
            }
            
            this.ambientAudio = new THREE.Audio(this.listener);
            this.ambientAudio.setBuffer(buffer);
            this.ambientAudio.setLoop(true);
            this.ambientAudio.setVolume(0.1);
            
            console.log('✅ Ambient noise created');
        } catch (error) {
            console.error('Error creating ambient noise:', error);
        }
    }

    playStadiumAmbient() {
        console.log('🏟️ Playing stadium ambient sounds...');
        
        if (this.crowdAudio && !this.crowdAudio.isPlaying) {
            try {
                this.crowdAudio.play();
                console.log('✅ Crowd noise playing');
            } catch (error) {
                console.error('Error playing crowd noise:', error);
            }
        }
        
        if (this.ambientAudio && !this.ambientAudio.isPlaying) {
            try {
                this.ambientAudio.play();
                console.log('✅ Ambient noise playing');
            } catch (error) {
                console.error('Error playing ambient noise:', error);
            }
        }
    }

    stopStadiumAmbient() {
        if (this.crowdAudio && this.crowdAudio.isPlaying) {
            this.crowdAudio.stop();
        }
        if (this.ambientAudio && this.ambientAudio.isPlaying) {
            this.ambientAudio.stop();
        }
    }

    intensifyStadiumAudio() {
        console.log('🔥 Intensifying stadium audio...');
        
        if (this.crowdAudio) {
            gsap.to(this.crowdAudio, {
                volume: 0.4,
                duration: 0.5,
                ease: 'power2.out',
                yoyo: true,
                repeat: 3,
                onComplete: () => {
                    this.crowdAudio.setVolume(0.2);
                }
            });
        }
    }

    tryLoadAudio(name, paths, pathIndex, sound) {
        if (pathIndex >= paths.length) {
            console.error(`❌ All paths failed for audio: ${name}`);
            return;
        }

        const path = paths[pathIndex];
        const audioLoader = new THREE.AudioLoader();
        
        console.log(`🔄 Trying path ${pathIndex + 1}/${paths.length}: ${path}`);
        
        audioLoader.load(path,
            // Success callback
            (buffer) => {
                sound.setBuffer(buffer);
                sound.setVolume(0.5);
                
                if (name === 'crowd') {
                    sound.setLoop(true);
                    sound.setVolume(0.3);
                    console.log('✅ Crowd audio loaded and configured successfully');
                }
                console.log(`✅ Audio ${name} loaded successfully from: ${path}`);
            },
            // Progress callback
            (progress) => {
                if (progress.total > 0) {
                    const percent = Math.round(progress.loaded / progress.total * 100);
                    console.log(`⏳ Loading ${name}: ${percent}%`);
                }
            },
            // Error callback
            (error) => {
                console.warn(`❌ Failed to load ${name} from: ${path}`);
                console.log(`Trying next path...`);
                
                // Intentar con la siguiente ruta
                this.tryLoadAudio(name, paths, pathIndex + 1, sound);
            }
        );
    }

    loadAudioWithAlternatePath(name, alternatePath, sound) {
        const audioLoader = new THREE.AudioLoader();
        console.log(`🔄 Trying to load ${name} from alternate path: ${alternatePath}`);
        
        audioLoader.load(alternatePath,
            // Success callback
            (buffer) => {
                sound.setBuffer(buffer);
                sound.setVolume(0.5);
                
                if (name === 'crowd') {
                    sound.setLoop(true);
                    sound.setVolume(0.3);
                    console.log('✅ Crowd audio loaded successfully from alternate path');
                }
                console.log(`✅ Audio ${name} loaded from alternate path`);
            },
            // Progress callback
            (progress) => {
                if (progress.total > 0) {
                    const percent = Math.round(progress.loaded / progress.total * 100);
                    console.log(`⏳ Loading ${name} (alternate): ${percent}%`);
                }
            },
            // Error callback
            (error) => {
                console.error(`❌ Failed to load ${name} from alternate path too:`, error);
                console.log(`❌ Audio ${name} completely failed to load. Check if file exists.`);
            }
        );
    }
}