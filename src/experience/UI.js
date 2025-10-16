import EventEmitter from 'eventemitter3';

export default class UIManager extends EventEmitter {
    constructor() {
        super();
        this.introOverlay = document.getElementById('intro-overlay');
        this.epilogueOverlay = document.getElementById('epilogue-overlay');
        this.hud = document.getElementById('hud');
        this.powerBar = document.getElementById('power-bar');
        
        document.getElementById('start-button').addEventListener('click', (e) => {
            console.log('🎮 START BUTTON CLICKED!');
            console.log('Event target:', e.target);
            console.log('Button element:', document.getElementById('start-button'));
            this.emit('start');
            e.target.blur();
        });
        
        document.getElementById('retry-button').addEventListener('click', (e) => {
            this.emit('retry');
            e.target.blur();
        });
        
        // NO crear botón de toggle - control con pie siempre activo
    }

    showIntro(visible) {
        this.introOverlay.classList.toggle('hidden', !visible);
        this.introOverlay.classList.toggle('active', visible);
    }
    
    showHUD(visible) {
        this.hud.classList.toggle('hidden', !visible);
    }

    showEpilogue(visible, title = "") {
        document.getElementById('epilogue-title').innerText = title;
        this.epilogueOverlay.classList.toggle('hidden', !visible);
        this.epilogueOverlay.classList.toggle('active', visible);
    }

    updatePowerBar(power) {
        this.powerBar.style.width = `${power * 100}%`;
    }

    getPressure() {
        return 0.3; // Valor fijo de presión moderada
    }
    
    reset() {
        this.showHUD(true);
        this.showEpilogue(false);
    }
}