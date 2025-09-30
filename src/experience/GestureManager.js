import EventEmitter from 'eventemitter3';

export default class GestureManager extends EventEmitter {
    constructor() {
        super();
        this.hands = null;
        this.camera = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.canvasCtx = null;
        
        this.isPointing = false;
        this.isFistClosed = false;
        this.wasChargingPower = false;
        
        this.pointingTarget = { x: 0.5, y: 0.5 };
        this.enabled = false;
        
        // Referencias a las librerías MediaPipe
        this.MediaPipeHands = null;
        this.MediaPipeCamera = null;
        this.MediaPipeDrawing = null;
    }

    async init() {
        console.log('🖐️ Initializing GestureManager...');
        
        this.createVideoElements();
        
        try {
            // Cargar TODAS las librerías antes de continuar
            await this.loadAllMediaPipeLibraries();
            
            // Iniciar cámara
            await this.startCamera();
            
            console.log('✅ GestureManager initialized successfully');
            this.emit('ready');
            return true;
        } catch (error) {
            console.error('❌ Error initializing GestureManager:', error);
            this.emit('error', error);
            this.updateStatus('❌ Error: ' + error.message);
            return false;
        }
    }

    createVideoElements() {
        const container = document.createElement('div');
        container.id = 'gesture-camera-container';
        container.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            width: 320px;
            height: 240px;
            border: 2px solid #fff;
            border-radius: 8px;
            overflow: hidden;
            z-index: 1000;
            background: #000;
        `;
        
        this.videoElement = document.createElement('video');
        this.videoElement.style.cssText = `
            width: 100%;
            height: 100%;
            transform: scaleX(-1);
        `;
        this.videoElement.autoplay = true;
        this.videoElement.playsInline = true;
        
        this.canvasElement = document.createElement('canvas');
        this.canvasElement.width = 320;
        this.canvasElement.height = 240;
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
        statusDiv.id = 'gesture-status';
        statusDiv.style.cssText = `
            position: absolute;
            bottom: 5px;
            left: 5px;
            right: 5px;
            background: rgba(0,0,0,0.7);
            color: #fff;
            padding: 5px;
            font-size: 12px;
            border-radius: 4px;
            text-align: center;
        `;
        statusDiv.textContent = 'Inicializando...';
        
        container.appendChild(this.videoElement);
        container.appendChild(this.canvasElement);
        container.appendChild(statusDiv);
        document.body.appendChild(container);
        
        this.statusDiv = statusDiv;
    }

    async loadAllMediaPipeLibraries() {
        console.log('📦 Loading MediaPipe libraries...');
        
        // Cargar scripts en orden y esperar a que cada uno termine
        await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
        await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
        
        // Verificar que las librerías se cargaron
        if (typeof window.Hands === 'undefined') {
            throw new Error('MediaPipe Hands no se cargó correctamente');
        }
        if (typeof window.Camera === 'undefined') {
            throw new Error('MediaPipe Camera no se cargó correctamente');
        }
        
        console.log('✅ All MediaPipe libraries loaded');
        
        // Guardar referencias
        this.MediaPipeHands = window.Hands;
        this.MediaPipeCamera = window.Camera;
        this.MediaPipeDrawing = {
            drawConnectors: window.drawConnectors,
            drawLandmarks: window.drawLandmarks,
            HAND_CONNECTIONS: window.HAND_CONNECTIONS
        };
        
        // Ahora inicializar MediaPipe Hands
        this.initMediaPipe();
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            // Verificar si ya está cargado
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
        console.log('🔧 Initializing MediaPipe Hands...');
        
        this.hands = new this.MediaPipeHands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });
        
        this.hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        
        this.hands.onResults((results) => this.onResults(results));
        
        console.log('✅ MediaPipe Hands initialized');
    }

    async startCamera() {
        console.log('📹 Starting camera...');
        this.updateStatus('📹 Solicitando cámara...');
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: 320, 
                    height: 240,
                    facingMode: 'user'
                }
            });
            
            console.log('✅ Camera permission granted');
            this.videoElement.srcObject = stream;
            
            // Esperar a que el video esté listo
            await new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    console.log('✅ Video metadata loaded');
                    resolve();
                };
            });
            
            this.camera = new this.MediaPipeCamera(this.videoElement, {
                onFrame: async () => {
                    if (this.enabled && this.hands) {
                        await this.hands.send({ image: this.videoElement });
                    }
                },
                width: 320,
                height: 240
            });
            
            this.camera.start();
            console.log('✅ Camera started');
            this.updateStatus('✅ Cámara activa');
            
        } catch (error) {
            console.error('❌ Camera error:', error);
            this.updateStatus('❌ No se pudo acceder a la cámara');
            throw error;
        }
    }

    onResults(results) {
        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            
            // Dibujar conexiones y landmarks
            if (this.MediaPipeDrawing.drawConnectors) {
                this.MediaPipeDrawing.drawConnectors(
                    this.canvasCtx, 
                    landmarks, 
                    this.MediaPipeDrawing.HAND_CONNECTIONS, 
                    {color: '#00FF00', lineWidth: 2}
                );
                this.MediaPipeDrawing.drawLandmarks(
                    this.canvasCtx, 
                    landmarks, 
                    {color: '#FF0000', lineWidth: 1, radius: 2}
                );
            }
            
            const gesture = this.detectGesture(landmarks);
            this.handleGesture(gesture, landmarks);
        } else {
            this.updateStatus('❌ No se detecta mano');
        }
        
        this.canvasCtx.restore();
    }

    detectGesture(landmarks) {
        const indexTip = landmarks[8];
        const indexPip = landmarks[6];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];
        
        const indexExtended = indexTip.y < indexPip.y;
        const middleClosed = middleTip.y > landmarks[10].y;
        const ringClosed = ringTip.y > landmarks[14].y;
        const pinkyClosed = pinkyTip.y > landmarks[18].y;
        
        const indexClosed = indexTip.y > indexPip.y;
        const allFingersClosed = indexClosed && middleClosed && ringClosed && pinkyClosed;
        
        if (indexExtended && middleClosed && ringClosed && pinkyClosed) {
            return {
                type: 'POINTING',
                target: { x: indexTip.x, y: indexTip.y }
            };
        } else if (allFingersClosed) {
            return { type: 'FIST' };
        } else {
            return { type: 'OPEN' };
        }
    }

    handleGesture(gesture, landmarks) {
        const prevFist = this.isFistClosed;
        
        this.isPointing = gesture.type === 'POINTING';
        this.isFistClosed = gesture.type === 'FIST';
        
        if (this.isPointing) {
            this.pointingTarget = gesture.target;
            this.emit('pointing', this.pointingTarget);
            this.updateStatus('👆 Apuntando');
        } else if (this.isFistClosed) {
            if (!prevFist && !this.wasChargingPower) {
                this.wasChargingPower = true;
                this.emit('charge-start');
                this.updateStatus('👊 Cargando potencia...');
            } else if (this.wasChargingPower) {
                this.emit('charging');
            }
        } else {
            if (this.wasChargingPower) {
                this.wasChargingPower = false;
                this.emit('shoot');
                this.updateStatus('⚽ ¡DISPARO!');
            } else {
                this.updateStatus('✋ Mano detectada');
            }
        }
    }

    updateStatus(text) {
        if (this.statusDiv) {
            this.statusDiv.textContent = text;
        }
    }

    enable() {
        this.enabled = true;
        console.log('🖐️ Gesture control enabled');
    }

    disable() {
        this.enabled = false;
        this.isPointing = false;
        this.isFistClosed = false;
        this.wasChargingPower = false;
        console.log('🖐️ Gesture control disabled');
    }

    getPointingTarget() {
        return this.pointingTarget;
    }

    destroy() {
        if (this.camera) {
            this.camera.stop();
        }
        
        if (this.videoElement && this.videoElement.srcObject) {
            const tracks = this.videoElement.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
        
        const container = document.getElementById('gesture-camera-container');
        if (container) {
            container.remove();
        }
    }
}