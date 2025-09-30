import EventEmitter from 'eventemitter3';

export default class UIManager extends EventEmitter {
    constructor() {
        super();
        this.introOverlay = document.getElementById('intro-overlay');
        this.epilogueOverlay = document.getElementById('epilogue-overlay');
        this.hud = document.getElementById('hud');
        this.powerBar = document.getElementById('power-bar');
        this.pressureSlider = document.getElementById('pressure-slider');
        
        document.getElementById('start-button').addEventListener('click', (e) => {
            console.log('Start button clicked');
            this.emit('start');
            e.target.blur();
        });
        
        document.getElementById('retry-button').addEventListener('click', (e) => {
            this.emit('retry');
            e.target.blur();
        });
        
        // Crear botón para activar/desactivar control por gestos
        this.createGestureToggle();
    }

    createGestureToggle() {
        const gestureButton = document.createElement('button');
        gestureButton.id = 'gesture-toggle-button';
        gestureButton.textContent = 'Activar Control por Gestos';
        gestureButton.style.display = 'none'; // Oculto hasta que el sistema esté listo
        
        gestureButton.addEventListener('click', () => {
            this.emit('toggle-gesture');
        });
        
        const optionsPanel = document.getElementById('options-panel');
        optionsPanel.appendChild(gestureButton);
        
        // Agregar indicador de estado
        const statusDiv = document.createElement('div');
        statusDiv.id = 'gesture-status-indicator';
        statusDiv.style.cssText = `
            margin-top: 10px;
            padding: 5px;
            background: rgba(0,0,0,0.7);
            border-radius: 3px;
            font-size: 12px;
            text-align: center;
        `;
        statusDiv.textContent = 'Control: Teclado';
        optionsPanel.appendChild(statusDiv);
        
        this.gestureButton = gestureButton;
        this.gestureStatusDiv = statusDiv;
    }

    showGestureButton() {
        if (this.gestureButton) {
            this.gestureButton.style.display = 'block';
        }
    }

    updateGestureStatus(text) {
        if (this.gestureStatusDiv) {
            this.gestureStatusDiv.textContent = text;
        }
        
        // Actualizar texto del botón
        if (this.gestureButton) {
            if (text.includes('ACTIVADO')) {
                this.gestureButton.textContent = 'Desactivar Gestos';
            } else {
                this.gestureButton.textContent = 'Activar Control por Gestos';
            }
        }
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