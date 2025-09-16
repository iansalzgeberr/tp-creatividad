import * as THREE from 'three';
import gsap from 'gsap';

export default class AudioManager {
    constructor() {
        this.listener = null;
        this.sounds = {};
        this.audioSources = {
            crowd: '/audio/crowd.mp3',
            heartbeat: '/audio/heartbeat.mp3',
            goal: '/audio/goal.mp3',
            fail: '/audio/fail.mp3',
            whistle: '/audio/whistle.mp3',
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
            });
        });
    }

    play(name, loop = false) {
        const sound = this.sounds[name];
        if (sound && !sound.isPlaying) {
            sound.setLoop(loop);
            sound.play();
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
}