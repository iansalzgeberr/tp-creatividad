import EventEmitter from 'eventemitter3';

export default class KickGestureManager extends EventEmitter {
    constructor() {
        super();
        this.pose = null;
        this.camera = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.canvasCtx = null;
        
        // Estados del pateo
        this.isKicking = false;
        this.isChargingKick = false;
        this.wasChargingPower = false;
        
        // Tracking de movimiento
        this.kickTarget = { x: 0.5, y: 0.5 };
        this.previousAnklePos = null;
        this.kickPower = 0;
        this.maxKickPower = 0;
        
        // Estados SIMPLIFICADOS (solo usa eje Y - altura)
        this.isLegLifted = false;       // Pierna levantada
        this.maxFootHeight = 0;         // Altura máxima alcanzada
        this.kickTarget = { x: 0.5, y: 0.5 };
        
        // Control de cooldown
        this.shotCooldown = false;
        this.COOLDOWN_TIME = 2000;      // 2 segundos entre disparos
        
        // Umbrales SIMPLES (solo altura Y - super confiable)
        this.HORIZONTAL_MOVE_THRESHOLD = 0.02;  // Movimiento horizontal para apuntar
        this.LIFT_THRESHOLD = 0.15;             // Levantar 15cm para empezar a cargar
        this.KICK_VELOCITY_THRESHOLD = 0.03;    // Velocidad de bajada para disparar
        this.MAX_LIFT_HEIGHT = 0.4;             // 40cm = 100% potencia
        
        // Tracking simple
        this.previousAnklePos = null;
        this.ankleHistory = [];
        this.historySize = 5;
        
        this.enabled = false;
        
        // Referencias a MediaPipe
        this.MediaPipePose = null;
        this.MediaPipeCamera = null;
        this.MediaPipeDrawing = null;
        
        // Histórico de posiciones para calcular velocidad
        this.ankleHistory = [];
        this.historySize = 5;
    }

    async init() {
        console.log('🦶 Initializing KickGestureManager...');
        
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

    createVideoElements() {
        const container = document.createElement('div');
        container.id = 'kick-camera-container';
        container.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            width: 480px;
            height: 360px;
            border: 2px solid #00ff00;
            border-radius: 8px;
            overflow: hidden;
            z-index: 1000;
            background: #000;
            pointer-events: none;
            display: none;
        `;
        
        console.log('📹 Creating video container (hidden initially)...');
        
        this.videoElement = document.createElement('video');
        this.videoElement.style.cssText = `
            width: 100%;
            height: 100%;
            transform: scaleX(-1);
        `;
        this.videoElement.autoplay = true;
        this.videoElement.playsInline = true;
        
        this.canvasElement = document.createElement('canvas');
        this.canvasElement.width = 480;
        this.canvasElement.height = 360;
        this.canvasElement.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            transform: scaleX(-1);
        `;
        this.canvasCtx = this.canvasElement.getContext('2d');
        
        const statusDiv = document.createElement('div');
        statusDiv.id = 'kick-status';
        statusDiv.style.cssText = `
            position: absolute;
            bottom: 5px;
            left: 5px;
            right: 5px;
            background: rgba(0,0,0,0.8);
            color: #0f0;
            padding: 8px;
            font-size: 14px;
            font-weight: bold;
            border-radius: 4px;
            text-align: center;
            font-family: monospace;
        `;
        statusDiv.textContent = 'Inicializando...';
        
        // Barra de potencia
        const powerBar = document.createElement('div');
        powerBar.id = 'power-bar-container';
        powerBar.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            width: 30px;
            height: 200px;
            background: rgba(0,0,0,0.7);
            border: 2px solid #0f0;
            border-radius: 5px;
            overflow: hidden;
        `;
        
        const powerFill = document.createElement('div');
        powerFill.id = 'power-fill';
        powerFill.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 0%;
            background: linear-gradient(to top, #0f0, #ff0, #f00);
            transition: height 0.1s ease-out;
        `;
        
        powerBar.appendChild(powerFill);
        
        // Indicador de estado de movimiento
        const movementIndicator = document.createElement('div');
        movementIndicator.id = 'movement-indicator';
        movementIndicator.style.cssText = `
            position: absolute;
            top: 220px;
            right: 10px;
            width: 100px;
            padding: 10px;
            background: rgba(0,0,0,0.8);
            border: 2px solid #0f0;
            border-radius: 5px;
            color: #0f0;
            font-family: monospace;
            font-size: 12px;
            text-align: center;
        `;
        movementIndicator.innerHTML = '⏸️<br>LISTO';
        
        container.appendChild(this.videoElement);
        container.appendChild(this.canvasElement);
        container.appendChild(statusDiv);
        container.appendChild(powerBar);
        container.appendChild(movementIndicator);
        document.body.appendChild(container);
        
        this.statusDiv = statusDiv;
        this.powerFill = powerFill;
        this.movementIndicator = movementIndicator;
    }

    async loadAllMediaPipeLibraries() {
        console.log('📦 Loading MediaPipe Pose libraries...');
        
        await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
        await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');
        
        if (typeof window.Pose === 'undefined') {
            throw new Error('MediaPipe Pose no se cargó correctamente');
        }
        if (typeof window.Camera === 'undefined') {
            throw new Error('MediaPipe Camera no se cargó correctamente');
        }
        
        console.log('✅ All MediaPipe Pose libraries loaded');
        
        this.MediaPipePose = window.Pose;
        this.MediaPipeCamera = window.Camera;
        this.MediaPipeDrawing = {
            drawConnectors: window.drawConnectors,
            drawLandmarks: window.drawLandmarks,
            POSE_CONNECTIONS: window.POSE_CONNECTIONS
        };
        
        this.initMediaPipe();
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                console.log(`Script ya existe: ${src}`);
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                console.log(`✅ Loaded: ${src}`);
                resolve();
            };
            script.onerror = () => {
                console.error(`❌ Failed to load: ${src}`);
                reject(new Error(`Failed to load ${src}`));
            };
            document.head.appendChild(script);
        });
    }

    initMediaPipe() {
        console.log('🔧 Initializing MediaPipe Pose...');
        
        this.pose = new this.MediaPipePose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            }
        });
        
        this.pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        
        this.pose.onResults((results) => this.onResults(results));
        
        console.log('✅ MediaPipe Pose initialized');
    }

    async startCamera() {
        console.log('📹 Starting camera...');
        this.updateStatus('📹 Solicitando cámara...');
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: 480, 
                    height: 360,
                    facingMode: 'user'
                }
            });
            
            console.log('✅ Camera permission granted');
            this.videoElement.srcObject = stream;
            
            await new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    console.log('✅ Video metadata loaded');
                    resolve();
                };
            });
            
            this.camera = new this.MediaPipeCamera(this.videoElement, {
                onFrame: async () => {
                    if (this.enabled && this.pose) {
                        await this.pose.send({ image: this.videoElement });
                    }
                },
                width: 480,
                height: 360
            });
            
            this.camera.start();
            console.log('✅ Camera started');
            this.updateStatus('✅ Párate de cuerpo completo frente a la cámara');
            
            // Mostrar el contenedor ahora que la cámara está activa
            const container = document.getElementById('kick-camera-container');
            if (container) {
                container.style.display = 'block';
                console.log('📹 Camera container now visible');
            }
            
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
            const landmarks = results.poseLandmarks;
            
            // DEBUG: Log cada 120 frames
            if (!this._poseDebugCounter) this._poseDebugCounter = 0;
            this._poseDebugCounter++;
            if (this._poseDebugCounter % 120 === 0) {
                console.log('📹 Pose detectada - Enabled:', this.enabled);
            }
            
            // Dibujar el esqueleto completo
            if (this.MediaPipeDrawing.drawConnectors) {
                this.MediaPipeDrawing.drawConnectors(
                    this.canvasCtx, 
                    landmarks, 
                    this.MediaPipeDrawing.POSE_CONNECTIONS, 
                    {color: '#00FF00', lineWidth: 2}
                );
                this.MediaPipeDrawing.drawLandmarks(
                    this.canvasCtx, 
                    landmarks, 
                    {color: '#FF0000', lineWidth: 1, radius: 3}
                );
            }
            
            // Destacar la pierna derecha (la que patea)
            this.highlightKickingLeg(landmarks);
            
            // Detectar y procesar el gesto de pateo
            const kickData = this.detectKick(landmarks);
            this.handleKick(kickData, landmarks);
        } else {
            this.updateStatus('❌ No se detecta cuerpo - Aléjate un poco');
            this.resetKickState();
        }
        
        this.canvasCtx.restore();
    }

    highlightKickingLeg(landmarks) {
        // Índices MediaPipe Pose para pierna derecha
        const RIGHT_HIP = 24;
        const RIGHT_KNEE = 26;
        const RIGHT_ANKLE = 28;
        const RIGHT_FOOT = 32;
        
        const hip = landmarks[RIGHT_HIP];
        const knee = landmarks[RIGHT_KNEE];
        const ankle = landmarks[RIGHT_ANKLE];
        const foot = landmarks[RIGHT_FOOT];
        
        // Dibujar líneas destacadas para la pierna que patea
        this.canvasCtx.strokeStyle = '#00FFFF';
        this.canvasCtx.lineWidth = 4;
        this.canvasCtx.beginPath();
        
        // Cadera -> Rodilla
        this.canvasCtx.moveTo(hip.x * this.canvasElement.width, hip.y * this.canvasElement.height);
        this.canvasCtx.lineTo(knee.x * this.canvasElement.width, knee.y * this.canvasElement.height);
        
        // Rodilla -> Tobillo
        this.canvasCtx.lineTo(ankle.x * this.canvasElement.width, ankle.y * this.canvasElement.height);
        
        // Tobillo -> Pie
        this.canvasCtx.lineTo(foot.x * this.canvasElement.width, foot.y * this.canvasElement.height);
        
        this.canvasCtx.stroke();
        
        // Círculo grande en el tobillo (punto de tracking principal)
        this.canvasCtx.fillStyle = '#FFFF00';
        this.canvasCtx.beginPath();
        this.canvasCtx.arc(
            ankle.x * this.canvasElement.width, 
            ankle.y * this.canvasElement.height, 
            8, 0, 2 * Math.PI
        );
        this.canvasCtx.fill();
    }

    detectKick(landmarks) {
        const RIGHT_ANKLE = 28;
        const RIGHT_KNEE = 26;
        const RIGHT_HIP = 24;
        
        const ankle = landmarks[RIGHT_ANKLE];
        const knee = landmarks[RIGHT_KNEE];
        const hip = landmarks[RIGHT_HIP];
        
        // ⚠️ VALIDACIÓN: Verificar visibilidad
        if (!ankle.visibility || ankle.visibility < 0.5) {
            this.previousAnklePos = null;
            return {
                isLegLifted: false,
                isMovingFast: false,
                footLift: 0,
                anklePos: ankle,
                notVisible: true
            };
        }
        
        // Calcular altura del pie relativa a la cadera (baseline)
        const footLift = hip.y - ankle.y; // Y invertido: cadera arriba = menor Y
        
        // Detectar si la pierna está levantada
        const isLegLifted = footLift > this.LIFT_THRESHOLD;
        
        // Calcular velocidad de bajada
        let velocity = { x: 0, y: 0, magnitude: 0 };
        let isMovingFast = false;
        
        if (this.previousAnklePos) {
            const deltaY = ankle.y - this.previousAnklePos.y; // Positivo = bajando
            const deltaX = ankle.x - this.previousAnklePos.x;
            
            velocity = {
                x: deltaX,
                y: deltaY,
                magnitude: Math.sqrt(deltaX * deltaX + deltaY * deltaY)
            };
            
            // Detectar bajada rápida (disparo)
            isMovingFast = deltaY > this.KICK_VELOCITY_THRESHOLD;
        }
        
        this.previousAnklePos = { x: ankle.x, y: ankle.y };
        
        return {
            isLegLifted,
            isMovingFast,
            footLift,
            anklePos: ankle,
            velocity,
            notVisible: false
        };
    }

    handleKick(kickData, landmarks) {
        if (!this.enabled) {
            return;
        }
        
        const { isLegLifted, isMovingFast, footLift, anklePos, velocity, notVisible } = kickData;
        
        // Si no es visible o en cooldown, no hacer nada
        if (notVisible || this.shotCooldown) {
            return;
        }
        
        // ============================================
        // FASE 1: PIERNA EN SUELO - APUNTAR
        // ============================================
        if (!isLegLifted && !this.isLegLifted) {
            // Calcular apuntado basado en posición horizontal del pie
            this.kickTarget = this.calculateKickTarget({ anklePos });
            this.emit('pointing', this.kickTarget);
            
            if (this.movementIndicator) {
                this.movementIndicator.innerHTML = '🎯<br>APUNTAR';
                this.movementIndicator.style.borderColor = '#00ff00';
            }
            
            this.updateStatus('🎯 Mueve pie izq/der para apuntar | Levanta para cargar');
        }
        
        // ============================================
        // FASE 2: PIERNA LEVANTADA - CARGAR
        // ============================================
        else if (isLegLifted) {
            this.isLegLifted = true;
            
            // Calcular potencia basada en altura
            this.kickPower = Math.min(1.0, footLift / this.MAX_LIFT_HEIGHT);
            this.maxFootHeight = Math.max(this.maxFootHeight, footLift);
            
            // Actualizar barra de potencia
            this.updatePowerBar(this.kickPower * 100);
            
            // Mantener apuntado
            this.emit('pointing', this.kickTarget);
            
            if (this.movementIndicator) {
                this.movementIndicator.innerHTML = '⬆️<br>CARGAR';
                this.movementIndicator.style.borderColor = '#ffff00';
            }
            
            const powerPercent = Math.floor(this.kickPower * 100);
            this.updateStatus(`⚡ POTENCIA: ${powerPercent}% | Baja rápido para disparar!`);
        }
        
        // ============================================
        // FASE 3: BAJADA RÁPIDA - DISPARAR
        // ============================================
        else if (!isLegLifted && this.isLegLifted && isMovingFast) {
            const finalPower = Math.max(0.3, this.kickPower);
            
            console.log(`⚽⚽⚽ DISPARO! Potencia: ${(finalPower * 100).toFixed(0)}%`);
            
            this.emit('shoot', {
                power: finalPower,
                target: this.kickTarget
            });
            
            if (this.movementIndicator) {
                this.movementIndicator.innerHTML = '⚽<br>DISPARO!';
                this.movementIndicator.style.borderColor = '#ff0000';
            }
            
            this.updateStatus('⚽💥 ¡¡¡DISPARO!!!');
            
            // Activar cooldown
            this.shotCooldown = true;
            this.isLegLifted = false;
            this.kickPower = 0;
            this.maxFootHeight = 0;
            this.updatePowerBar(0);
            
            setTimeout(() => {
                this.shotCooldown = false;
                this.updateStatus('✅ Listo para siguiente tiro');
                if (this.movementIndicator) {
                    this.movementIndicator.innerHTML = '⏸️<br>LISTO';
                    this.movementIndicator.style.borderColor = '#0f0';
                }
            }, this.COOLDOWN_TIME);
        }
        
        // FASE 4: Pierna bajó pero no rápido (cancelar)
        else if (!isLegLifted && this.isLegLifted && !isMovingFast) {
            this.isLegLifted = false;
            this.kickPower = 0;
            this.maxFootHeight = 0;
            this.updatePowerBar(0);
            this.updateStatus('❌ Cancelado - Baja más rápido para disparar');
        }
    }

    calculateKickTarget(kickData) {
        const { anklePos } = kickData;
        if (!anklePos) {
            return this.kickTarget || { x: 0.5, y: 0.5 };
        }
        
        // Mapear posición del tobillo (0-1) a coordenadas del arco
        // anklePos.x: 0=izquierda, 1=derecha -> usar directo
        // anklePos.y: 0=arriba, 1=abajo -> invertir
        
        const targetX = Math.max(0, Math.min(1, anklePos.x));
        const targetY = Math.max(0.2, Math.min(0.8, 1.0 - anklePos.y));
        
        return { x: targetX, y: targetY };
    }

    updatePowerBar(percentage) {
        if (this.powerFill) {
            this.powerFill.style.height = `${percentage}%`;
        }
    }

    updateStatus(text) {
        if (this.statusDiv) {
            this.statusDiv.textContent = text;
        }
    }

    enable() {
        this.enabled = true;
        this.resetKickState();
        console.log('🦶✅ Kick control ENABLED - Sistema activo para detectar movimientos');
        console.log('📹 Asegúrate de estar frente a la cámara con cuerpo completo visible');
    }

    disable() {
        this.enabled = false;
        this.resetKickState();
        console.log('🦶❌ Kick control DISABLED');
    }

    getKickTarget() {
        return this.kickTarget;
    }

    destroy() {
        if (this.camera) {
            this.camera.stop();
        }
        
        if (this.videoElement && this.videoElement.srcObject) {
            const tracks = this.videoElement.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
        
        const container = document.getElementById('kick-camera-container');
        if (container) {
            container.remove();
        }
    }
}
