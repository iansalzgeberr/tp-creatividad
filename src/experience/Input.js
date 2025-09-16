import EventEmitter from 'eventemitter3';
import gsap from 'gsap';

export default class InputManager extends EventEmitter {
    constructor() {
        super();
        this.keys = {
            w: false, a: false, s: false, d: false,
            shift: false, space: false
        };
        this.power = 0;
        this.charging = false;
        this.movementEnabled = false;

        // --- CAMBIO CRUCIAL AQUÍ ---
        // Cambiamos 'window' por 'document' para asegurar que los eventos se capturen
        // incluso cuando el puntero del mouse está bloqueado.
        document.addEventListener('keydown', (e) => this.onKey(e.code, true));
        document.addEventListener('keyup', (e) => this.onKey(e.code, false));
    }
    
    setMovementEnabled(enabled) {
        this.movementEnabled = enabled;
    }

    onKey(code, isPressed) {
        // Para depuración, puedes descomentar la siguiente línea:
        // console.log(`Key Event -> Code: ${code}, Pressed: ${isPressed}`);

        switch(code) {
            case 'KeyW':
            case 'ArrowUp':
                if (this.movementEnabled) this.keys.w = isPressed;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                // La 'A' y 'D' deben funcionar tanto para moverse como para perfilarse
                this.keys.a = isPressed;
                break;
            case 'KeyS':
            case 'ArrowDown':
                if (this.movementEnabled) this.keys.s = isPressed;
                break;
            case 'KeyD':
            case 'ArrowRight':
                // La 'A' y 'D' deben funcionar tanto para moverse como para perfilarse
                this.keys.d = isPressed;
                break;
            case 'ShiftLeft':
                this.keys.shift = isPressed;
                break;
            case 'Space':
                this.handleSpace(isPressed);
                break;
        }
    }

    handleSpace(isPressed) {
        if (isPressed && !this.charging) {
            // Iniciar carga solo si estamos en el estado de apuntado (AIMING)
            // Esto lo controlará la máquina de estados, aquí solo registramos la pulsación.
            this.charging = true;
            this.power = 0;
            gsap.to(this, { power: 1, duration: 1.5, ease: 'power1.in' });
        } else if (!isPressed && this.charging) {
            // Soltar y patear
            this.charging = false;
            gsap.killTweensOf(this); // Detiene la animación de carga
            this.emit('kick', this.power);
            this.power = 0;
        }
    }
}