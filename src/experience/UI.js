import EventEmitter from 'eventemitter3';

export default class UIManager extends EventEmitter {
    constructor() {
        super();
        this.introOverlay = document.getElementById('intro-overlay');
        this.epilogueOverlay = document.getElementById('epilogue-overlay');
        this.hud = document.getElementById('hud');
        this.powerBar = document.getElementById('power-bar');
        this.pressureSlider = document.getElementById('pressure-slider');
        
        // --- CAMBIO CLAVE AQUÍ ---
        // Añadimos el evento 'e' para poder acceder al botón que fue clickeado.
        document.getElementById('start-button').addEventListener('click', (e) => {
            console.log('🎮 START BUTTON CLICKED - About to emit start event');
            this.emit('start');
            console.log('✅ Start event emitted');
            e.target.blur(); // Le quitamos el foco al botón para que no intercepte la barra espaciadora.
        });
        
        document.getElementById('retry-button').addEventListener('click', (e) => {
            this.emit('retry');
            e.target.blur(); // Hacemos lo mismo para el botón de reintentar.
        });
        
        // TODO: Lógica para el botón 'view-toggle-button'
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
        return parseFloat(this.pressureSlider.value);
    }
    
    reset() {
        this.showHUD(true);
        this.showEpilogue(false);
    }
}