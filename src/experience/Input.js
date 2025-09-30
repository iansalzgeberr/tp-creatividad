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
        
        // Control por gestos
        this.gestureMode = false;
        this.gestureAimTarget = { x: 0.5, y: 0.5 };

        document.addEventListener('keydown', (e) => this.onKey(e.code, true));
        document.addEventListener('keyup', (e) => this.onKey(e.code, false));
    }
    
    enableGestureMode() {
        this.gestureMode = true;
        console.log('🖐️ Gesture mode enabled');
    }
    
    disableGestureMode() {
        this.gestureMode = false;
        console.log('⌨️ Keyboard mode enabled');
    }
    
    isGestureMode() {
        return this.gestureMode;
    }
    
    updateGestureAim(target) {
        // target es {x, y} normalizado (0-1)
        // Convertir a coordenadas útiles para la cámara
        this.gestureAimTarget = target;
        this.emit('gesture-aim', target);
    }
    
    startGestureCharge() {
        if (!this.charging) {
            this.charging = true;
            this.power = 0;
            gsap.to(this, { power: 1, duration: 1.5, ease: 'power1.in' });
            this.emit('charge-start');
        }
    }
    
    gestureShoot() {
        if (this.charging) {
            this.charging = false;
            gsap.killTweensOf(this);
            this.emit('kick', this.power);
            this.power = 0;
        }
    }
    
    setMovementEnabled(enabled) {
        this.movementEnabled = enabled;
    }

    onKey(code, isPressed) {
        console.log(`Key Event -> Code: ${code}, Pressed: ${isPressed}, Movement Enabled: ${this.movementEnabled}`);

        switch(code) {
            case 'KeyW':
            case 'ArrowUp':
                if (this.movementEnabled) this.keys.w = isPressed;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.a = isPressed;
                break;
            case 'KeyS':
            case 'ArrowDown':
                if (this.movementEnabled) this.keys.s = isPressed;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.d = isPressed;
                break;
            case 'ShiftLeft':
                this.keys.shift = isPressed;
                break;
            case 'KeyT':
                if (isPressed) {
                    this.emit('test-audio');
                }
                break;
            case 'KeyG': // Toggle gesture mode
                if (isPressed) {
                    this.emit('toggle-gesture');
                }
                break;
            case 'Space':
                if (!this.gestureMode) { // Solo si no estamos en modo gesture
                    this.handleSpace(isPressed);
                }
                break;
        }
    }

    handleSpace(isPressed) {
        if (isPressed && !this.charging) {
            this.charging = true;
            this.power = 0;
            gsap.to(this, { power: 1, duration: 1.5, ease: 'power1.in' });
        } else if (!isPressed && this.charging) {
            this.charging = false;
            gsap.killTweensOf(this);
            this.emit('kick', this.power);
            this.power = 0;
        }
    }
}