import EventEmitter from 'eventemitter3';
import * as THREE from 'three';

export default class KickGestureManager extends EventEmitter {
    constructor() {
        super();
        this.pose = null;
        this.camera = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.canvasCtx = null;
        
        this.gestureState = 'IDLE'; 
        this.kickPower = 0;

        this.KNEE_FLEX_START_ANGLE = 150; 
        this.KNEE_KICK_TRIGGER_ANGLE = 160;

        this.isBodyVisible = false;
        
        this.shotCooldown = false;
        this.COOLDOWN_TIME = 1500;
        
        this.enabled = false;
        
        this.MediaPipePose = null;
        this.MediaPipeCamera = null;
        this.MediaPipeDrawing = null;

        // [!code focus:start]
        // Variable para debug visual del apuntado
        this.debugAimPoint = { x: 0, y: 0 };
        // [!code focus:end]
    }

    async init() {
        console.log('🦶 Initializing KICK-TO-AIM Gesture Manager (Aiming Fixed)...');
        this.createVideoElements();
        try {
            await this.loadAllMediaPipeLibraries();
            await this.startCamera();
            console.log('✅ KickGestureManager initialized successfully');
            this.emit('ready');
            return true;
        } catch (error) {
            console.error('❌ Error initializing KickGestureManager:', error);
            this.emit('error', error);
            this.updateStatus('❌ Error: ' + error.message);
            return false;
        }
    }

    createVideoElements() { /* ... (Sin cambios aquí) ... */ 
        const existing = document.getElementById('kick-camera-container');
        if (existing) { existing.remove(); }
        const container = document.createElement('div');
        container.id = 'kick-camera-container';
        container.style.cssText = `position: fixed; top: 10px; left: 10px; width: 480px; height: 360px; border: 3px solid #00ff00; border-radius: 8px; overflow: hidden; z-index: 1000; background: #000; box-shadow: 0 0 20px rgba(0,255,0,0.5);`;
        this.videoElement = document.createElement('video');
        this.videoElement.style.cssText = `width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1);`;
        this.videoElement.autoplay = true; this.videoElement.playsInline = true; this.videoElement.muted = true; this.videoElement.setAttribute('muted', '');
        this.canvasElement = document.createElement('canvas');
        this.canvasElement.width = 480; this.canvasElement.height = 360;
        this.canvasElement.style.cssText = `position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform: scaleX(-1); pointer-events: none;`;
        this.canvasCtx = this.canvasElement.getContext('2d');
        const statusDiv = document.createElement('div');
        statusDiv.id = 'kick-status';
        statusDiv.style.cssText = `position: absolute; bottom: 5px; left: 5px; right: 5px; background: rgba(0,0,0,0.7); color: #0f0; padding: 8px; font-size: 14px; font-weight: bold; border-radius: 4px; text-align: center; font-family: 'Courier New', monospace; text-shadow: 0 0 5px #0f0;`;
        statusDiv.textContent = 'Inicializando...';
        const powerBar = document.createElement('div');
        powerBar.id = 'kick-power-bar';
        powerBar.style.cssText = `position: absolute; top: 10px; right: 10px; width: 20px; height: 120px; background: rgba(255,255,255,0.06); border: 2px solid rgba(0,255,0,0.2); border-radius: 6px; overflow: hidden;`;
        const powerFill = document.createElement('div');
        powerFill.id = 'kick-power-fill';
        powerFill.style.cssText = `position: absolute; bottom: 0; left: 0; width: 100%; height: 0%; background: linear-gradient(180deg, #0f0, #ff0); transition: height 120ms linear;`;
        const powerLabel = document.createElement('div');
        powerLabel.id = 'kick-power-label';
        powerLabel.style.cssText = `position: absolute; top: -22px; left: -10px; width: 60px; text-align: center; color: #0f0; font-family: 'Courier New', monospace; font-size: 12px;`;
        powerLabel.textContent = '0%';
        powerBar.appendChild(powerFill); powerBar.appendChild(powerLabel);
        const movementIndicator = document.createElement('div');
        movementIndicator.id = 'movement-indicator';
        movementIndicator.style.cssText = `position: absolute; top: 270px; right: 10px; width: 120px; padding: 12px; background: rgba(0,0,0,0.8); border: 3px solid #0f0; border-radius: 8px; color: #0f0; font-family: 'Courier New', monospace; font-size: 14px; font-weight: bold; text-align: center; box-shadow: 0 0 10px rgba(0,255,0,0.3); pointer-events: none;`;
        movementIndicator.innerHTML = '🥅<br>LISTO';
        container.appendChild(this.videoElement); container.appendChild(this.canvasElement); container.appendChild(statusDiv); container.appendChild(powerBar); container.appendChild(movementIndicator);
        document.body.appendChild(container);
        this.statusDiv = statusDiv; this.powerFill = powerFill; this.powerLabel = powerLabel; this.movementIndicator = movementIndicator;
    }
    async loadAllMediaPipeLibraries() { /* ... (Sin cambios aquí) ... */ 
        console.log('📦 Loading MediaPipe Pose libraries...');
        await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
        await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');
        if (typeof window.Pose === 'undefined') { throw new Error('MediaPipe Pose no se cargó correctamente'); }
        if (typeof window.Camera === 'undefined') { throw new Error('MediaPipe Camera no se cargó correctamente'); }
        console.log('✅ All MediaPipe Pose libraries loaded');
        this.MediaPipePose = window.Pose; this.MediaPipeCamera = window.Camera;
        this.MediaPipeDrawing = { drawConnectors: window.drawConnectors, drawLandmarks: window.drawLandmarks, POSE_CONNECTIONS: window.POSE_CONNECTIONS };
        this.initMediaPipe();
    }
    loadScript(src) { /* ... (Sin cambios aquí) ... */ 
        return new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) { console.log(`Script ya existe: ${src}`); resolve(); return; }
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => { console.log(`✅ Loaded: ${src}`); resolve(); };
            script.onerror = () => { console.error(`❌ Failed to load: ${src}`); reject(new Error(`Failed to load ${src}`)); };
            document.head.appendChild(script);
        });
    }
    initMediaPipe() { /* ... (Sin cambios aquí) ... */ 
        console.log('🔧 Initializing MediaPipe Pose...');
        this.pose = new this.MediaPipePose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
        this.pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, enableSegmentation: false, smoothSegmentation: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
        this.pose.onResults((results) => this.onResults(results));
        console.log('✅ MediaPipe Pose initialized');
    }
    async startCamera() { /* ... (Sin cambios aquí) ... */ 
        console.log('📹 Starting camera...');
        this.updateStatus('📹 Solicitando cámara...');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
            console.log('✅ Camera permission granted');
            this.videoElement.srcObject = stream;
            await new Promise((resolve) => { this.videoElement.onloadedmetadata = () => { console.log('✅ Video metadata loaded'); resolve(); }; });
            this.camera = new this.MediaPipeCamera(this.videoElement, { onFrame: async () => { if (this.enabled && this.pose) { await this.pose.send({ image: this.videoElement }); } }, width: 640, height: 480 });
            this.camera.start();
            console.log('✅ Camera started');
            this.updateStatus('✅ Flexiona la pierna atrás para cargar. ¡Patea para disparar!');
        } catch (error) {
            console.error('❌ Camera error:', error);
            this.updateStatus('❌ No se pudo acceder a la cámara');
            throw error;
        }
    }

    onResults(results) {
        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        
        if (results.poseLandmarks) {
            this.isBodyVisible = true;
            const landmarks = results.poseLandmarks;
            this.MediaPipeDrawing.drawConnectors(this.canvasCtx, landmarks, this.MediaPipeDrawing.POSE_CONNECTIONS, {color: '#00FF00', lineWidth: 2});
            this.MediaPipeDrawing.drawLandmarks(this.canvasCtx, landmarks, {color: '#FF0000', lineWidth: 1, radius: 3});
            this.highlightKickingLeg(landmarks);
            
            const kickData = this.detectKickData(landmarks);
            if (kickData) {
                this.handleKickGesture(kickData);
                // [!code focus:start]
                // Dibuja el punto de mira para debug
                this.drawDebugAimPoint();
                // [!code focus:end]
            }
        } else if (this.isBodyVisible) {
            this.isBodyVisible = false;
            this.updateStatus('❌ No se detecta cuerpo');
            this.changeGestureState('IDLE');
        }
        
        this.canvasCtx.restore();
    }

    highlightKickingLeg(landmarks) { /* ... (Sin cambios aquí) ... */ 
        const RIGHT_HIP = 24, RIGHT_KNEE = 26, RIGHT_ANKLE = 28;
        const hip = landmarks[RIGHT_HIP], knee = landmarks[RIGHT_KNEE], ankle = landmarks[RIGHT_ANKLE];
        if(!hip || !knee || !ankle) return;
        let legColor = '#00FFFF';
        if (this.gestureState === 'CHARGING') legColor = '#FFFF00';
        if (this.gestureState === 'COOLDOWN') legColor = '#FF0000';
        this.canvasCtx.strokeStyle = legColor; this.canvasCtx.lineWidth = 6; this.canvasCtx.beginPath();
        this.canvasCtx.moveTo(hip.x * this.canvasElement.width, hip.y * this.canvasElement.height);
        this.canvasCtx.lineTo(knee.x * this.canvasElement.width, knee.y * this.canvasElement.height);
        this.canvasCtx.lineTo(ankle.x * this.canvasElement.width, ankle.y * this.canvasElement.height);
        this.canvasCtx.stroke();
    }
    
    calculateAngle(a, b, c) { /* ... (Sin cambios aquí) ... */ 
        const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        const deg = Math.abs(rad * (180.0 / Math.PI));
        return deg > 180 ? 360 - deg : deg;
    }

    // [!code focus:start]
    detectKickData(landmarks) {
        const RIGHT_HIP = 24, RIGHT_KNEE = 26, RIGHT_ANKLE = 28, LEFT_HIP = 23;
        const hip = landmarks[RIGHT_HIP], knee = landmarks[RIGHT_KNEE], ankle = landmarks[RIGHT_ANKLE], leftHip = landmarks[LEFT_HIP];
        
        if (!hip || !knee || !ankle || !leftHip || ankle.visibility < 0.7 || knee.visibility < 0.7) return null;

        const kneeAngle = this.calculateAngle(hip, knee, ankle);
        
        const bodyCenterX = (hip.x + leftHip.x) / 2.0;
        const horizontalOffset = ankle.x - bodyCenterX;
        
        // --- CAMBIO CLAVE 1: RANGO MÁS SENSIBLE ---
        // Ahora un movimiento de 0.4 unidades (20cm a cada lado aprox) es el máximo.
        const normalizedAimX = THREE.MathUtils.clamp((horizontalOffset + 0.2) / 0.4, 0, 1);

        // --- CAMBIO CLAVE 2: EXAGERACIÓN DEL RESULTADO ---
        // Mapeamos de 0->1 a -0.2->1.2. Esto fuerza los tiros a los lados.
        const exaggeratedAimX = THREE.MathUtils.mapLinear(normalizedAimX, 0, 1, -0.2, 1.2);

        // Guardamos el punto para debug visual
        this.debugAimPoint = { x: ankle.x, y: ankle.y };

        // Devolvemos el valor exagerado para que el disparo sea más claro
        return { kneeAngle, finalAimX: exaggeratedAimX };
    }

    handleKickGesture(data) {
        if (this.gestureState === 'COOLDOWN') return;

        const { kneeAngle, finalAimX } = data; // Usamos finalAimX

        if (this.gestureState === 'IDLE') {
            if (kneeAngle < this.KNEE_FLEX_START_ANGLE) {
                this.changeGestureState('CHARGING');
            }
        }
        else if (this.gestureState === 'CHARGING') {
            const powerRatio = (this.KNEE_FLEX_START_ANGLE - kneeAngle) / (this.KNEE_FLEX_START_ANGLE - 80);
            this.kickPower = THREE.MathUtils.clamp(powerRatio, 0, 1);
            this.updatePowerBar(this.kickPower * 100);

            if (kneeAngle > this.KNEE_KICK_TRIGGER_ANGLE) {
                this.triggerShoot(finalAimX); // Pasamos el apuntado exagerado
                this.changeGestureState('COOLDOWN');
            }
        }
    }

    changeGestureState(newState) {
        if (this.gestureState === newState) return;
        
        console.log(`State Change: ${this.gestureState} -> ${newState}`);
        this.gestureState = newState;

        switch (newState) {
            case 'IDLE':
                this.updateStatus('Flexiona la pierna atrás para cargar');
                this.movementIndicator.innerHTML = '🥅<br>LISTO';
                this.movementIndicator.style.borderColor = '#0f0';
                this.resetPower();
                break;
            case 'CHARGING':
                this.emit('charge-start');
                this.updateStatus('¡PATEA HACIA ADELANTE!');
                this.movementIndicator.innerHTML = '⚡<br>CARGANDO';
                this.movementIndicator.style.borderColor = '#ffff00';
                break;
            case 'COOLDOWN':
                this.movementIndicator.innerHTML = '⚽<br>¡DISPARO!';
                this.movementIndicator.style.borderColor = '#ff0000';
                setTimeout(() => {
                    this.changeGestureState('IDLE');
                }, this.COOLDOWN_TIME);
                break;
        }
    }

    triggerShoot(aimX) { // Recibe el valor ya exagerado
        const finalPower = Math.max(0.3, this.kickPower);
        // El apuntado se invierte por el modo espejo, y CLAMP para evitar que se vaya demasiado lejos
        const finalTargetX = THREE.MathUtils.clamp(1.0 - aimX, 0, 1);
        const finalTarget = { x: finalTargetX, y: 0.5 };

        console.log(`⚽⚽⚽ ¡DISPARO! Potencia: ${(finalPower * 100).toFixed(0)}% Apuntado Final: ${(finalTarget.x * 100).toFixed(0)}% (Original exagerado: ${aimX.toFixed(2)})`);
        this.emit('shoot', { power: finalPower, target: finalTarget });
        this.updateStatus('⚽🔥 ¡¡¡GOOOOOL!!!');
    }
    
    // --- CAMBIO CLAVE 3: FEEDBACK VISUAL ---
    drawDebugAimPoint() {
        if (!this.isBodyVisible) return;
        
        this.canvasCtx.fillStyle = 'cyan';
        this.canvasCtx.beginPath();
        this.canvasCtx.arc(
            this.debugAimPoint.x * this.canvasElement.width,
            this.debugAimPoint.y * this.canvasElement.height,
            10, // Círculo más grande para que se vea bien
            0,
            2 * Math.PI
        );
        this.canvasCtx.fill();
    }
    // [!code focus:end]

    resetPower() {
        this.kickPower = 0;
        this.updatePowerBar(0);
    }
    
    updatePowerBar(percentage) {
        if (this.powerFill) { this.powerFill.style.height = `${percentage}%`; }
        if (this.powerLabel) { this.powerLabel.textContent = `${Math.floor(percentage)}%`; }
    }

    updateStatus(text) {
        if (this.statusDiv) { this.statusDiv.textContent = text; }
    }

    enable() {
        this.enabled = true;
        this.changeGestureState('IDLE');
        console.log('🦶✅ Kick control ENABLED');
    }

    disable() {
        this.enabled = false;
        console.log('🦶❌ Kick control DISABLED');
    }

    getKickTarget() { return {x:0.5, y:0.5}; }

    destroy() {
        if (this.camera) { this.camera.stop(); }
        if (this.videoElement?.srcObject) {
            this.videoElement.srcObject.getTracks().forEach(track => track.stop());
        }
        const container = document.getElementById('kick-camera-container');
        if (container) { container.remove(); }
    }
}