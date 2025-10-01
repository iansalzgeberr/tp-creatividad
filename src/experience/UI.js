import EventEmitter from 'eventemitter3';

export default class UIManager extends EventEmitter {
    constructor() {
        super();
        this.introOverlay = document.getElementById('intro-overlay');
        this.epilogueOverlay = document.getElementById('epilogue-overlay');
        this.hud = document.getElementById('hud');
        this.powerBar = document.getElementById('power-bar');
        
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
        gestureButton.style.cssText = `
            display: block;
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.3s;
        `;
        
        gestureButton.addEventListener('click', () => {
            this.emit('toggle-gesture');
        });
        
        gestureButton.addEventListener('mouseenter', () => {
            gestureButton.style.background = '#45a049';
        });
        
        gestureButton.addEventListener('mouseleave', () => {
            if (!gestureButton.textContent.includes('Desactivar')) {
                gestureButton.style.background = '#4CAF50';
            }
        });
        
        const optionsPanel = document.getElementById('options-panel');
        optionsPanel.appendChild(gestureButton);
        
        // Agregar indicador de estado
        const statusDiv = document.createElement('div');
        statusDiv.id = 'gesture-status-indicator';
        statusDiv.style.cssText = `
            padding: 8px;
            background: rgba(0,0,0,0.7);
            border-radius: 5px;
            font-size: 13px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.2);
        `;
        statusDiv.textContent = 'Control: Teclado';
        optionsPanel.appendChild(statusDiv);
        
        this.gestureButton = gestureButton;
        this.gestureStatusDiv = statusDiv;
    }

    updateGestureStatus(text) {
        if (this.gestureStatusDiv) {
            this.gestureStatusDiv.textContent = text;
        }
        
        // Actualizar texto y estilo del botón
        if (this.gestureButton) {
            if (text.includes('ACTIVADO')) {
                this.gestureButton.textContent = 'Desactivar Gestos';
                this.gestureButton.style.background = '#f44336';
            } else {
                this.gestureButton.textContent = 'Activar Control por Gestos';
                this.gestureButton.style.background = '#4CAF50';
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
        return 0.3; // Valor fijo de presión moderada
    }
    
    reset() {
        this.showHUD(true);
        this.showEpilogue(false);
    }
}