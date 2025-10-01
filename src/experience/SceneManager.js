import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import gsap from 'gsap';

import Assets from './Assets';
import StateMachine from './States';
import InputManager from './Input';
import AudioManager from './Audio';
import UIManager from './UI';
import GoalkeeperAI from './GoalkeeperAI';
import ShotModel from './ShotModel';
import GestureManager from './GestureManager';
import Stadium from './Stadium';

export default class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.sizes = { width: window.innerWidth, height: window.innerHeight };
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.sizes.width / this.sizes.height, 0.1, 100);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;

        this.assets = new Assets();
        this.input = new InputManager();
        this.ui = new UIManager();
        this.audio = new AudioManager();
        this.gesture = new GestureManager();
        this.stateMachine = new StateMachine(this);
        this.shotModel = new ShotModel();

        this.player = new THREE.Group();
        this.ball = null;
        this.goalkeeper = null;
        this.goal = null;
        this.cameraLookTarget = new THREE.Vector3(); 

        this.controls = new PointerLockControls(this.camera, document.body);
        this.goalkeeperAI = null;
        this.stadium = null;
        
        // Estado de control por gestos
        this.gestureControlActive = false;

        this.init();
    }

    init() {
        console.log('🚀 SceneManager init() called');
        this.setupScene();
        this.bindEventListeners();
        
        console.log('🎵 Initializing audio immediately...');
        this.audio.init(this.camera);
        
        // Inicializar gestos
        this.initGestureControl();
        
        this.assets.on('loaded', () => {
            this.buildWorld();
            console.log('✅ Assets loaded, checking montiel audio...');
            setTimeout(() => {
                this.audio.ensureMontielReady();
            }, 500);
            this.stateMachine.changeState('INTRO');
        });
    }

    async initGestureControl() {
        console.log('🖐️ Initializing gesture control...');
        
        this.gesture.on('ready', () => {
            console.log('✅ Gesture control ready!');
        });
        
        this.gesture.on('pointing', (target) => {
            if (this.gestureControlActive && this.stateMachine.currentState?.name === 'AIMING') {
                this.handleGestureAim(target);
            }
        });
        
        this.gesture.on('charge-start', () => {
            if (this.gestureControlActive && this.stateMachine.currentState?.name === 'AIMING') {
                this.input.startGestureCharge();
            }
        });
        
        this.gesture.on('shoot', () => {
            if (this.gestureControlActive && this.stateMachine.currentState?.name === 'AIMING') {
                this.input.gestureShoot();
            }
        });
        
        this.gesture.on('error', (error) => {
            console.error('❌ Gesture control error:', error);
            alert('Error al inicializar control por gestos. Verifica que tu cámara esté conectada.');
        });
        
        // No iniciar automáticamente, esperar que el usuario lo active
    }

    handleGestureAim(target) {
        // target es {x: 0-1, y: 0-1} desde la cámara
        // Convertir a rotación de cámara
        
        // Invertir X porque la imagen está espejada
        const normalizedX = 1 - target.x;
        const normalizedY = target.y;
        
        // Mapear a ángulos de cámara
        // X: -30° a +30° (horizontal)
        // Y: -20° a +20° (vertical)
        const targetYaw = (normalizedX - 0.5) * Math.PI / 3; // ±30°
        const targetPitch = -(normalizedY - 0.5) * Math.PI / 4.5; // ±20°
        
        // Aplicar rotación suavemente
        gsap.to(this.camera.rotation, {
            y: targetYaw,
            x: targetPitch,
            duration: 0.2,
            ease: 'power2.out'
        });
    }

    activateGesturesOnStart() {
        console.log('🖐️ Auto-activating gesture control on game start...');
        this.gesture.init().then(success => {
            if (success) {
                this.gestureControlActive = true;
                this.gesture.enable();
                this.input.enableGestureMode();
                this.ui.updateGestureStatus('🖐️ Control por gestos ACTIVADO');
                console.log('✅ Gesture control auto-activated');
            } else {
                console.log('❌ Gesture control auto-activation failed, using keyboard');
                this.ui.updateGestureStatus('⌨️ Control por teclado (gestos fallaron)');
            }
        });
    }

    toggleGestureControl() {
        if (!this.gestureControlActive) {
            // Activar control por gestos
            this.gesture.init().then(success => {
                if (success) {
                    this.gestureControlActive = true;
                    this.gesture.enable();
                    this.input.enableGestureMode();
                    this.ui.updateGestureStatus('🖐️ Control por gestos ACTIVADO');
                    console.log('🖐️ Gesture control activated');
                }
            });
        } else {
            // Desactivar control por gestos
            this.gestureControlActive = false;
            this.gesture.disable();
            this.input.disableGestureMode();
            this.ui.updateGestureStatus('⌨️ Control por teclado');
            console.log('⌨️ Gesture control deactivated');
        }
    }

    setupScene() {
        // Luz ambiente más intensa para mejor visibilidad del estadio
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Luz principal del campo más intensa
        const spotLight = new THREE.SpotLight(0xffffff, 1.2, 100, Math.PI * 0.2, 0.5);
        spotLight.position.set(0, 15, 0); 
        spotLight.castShadow = true;
        this.scene.add(spotLight);

        // Luces adicionales para iluminar mejor el estadio
        const stadiumLights = [
            { pos: [-20, 12, -10], color: 0xffffee, intensity: 0.8 },
            { pos: [20, 12, -10], color: 0xffffee, intensity: 0.8 },
            { pos: [-20, 12, 10], color: 0xffffee, intensity: 0.8 },
            { pos: [20, 12, 10], color: 0xffffee, intensity: 0.8 },
            { pos: [0, 20, -20], color: 0xffffff, intensity: 1.0 }, // Luz detrás del arco
            { pos: [0, 8, 15], color: 0xffffff, intensity: 0.6 }    // Luz detrás del jugador
        ];

        stadiumLights.forEach(lightConfig => {
            const light = new THREE.DirectionalLight(lightConfig.color, lightConfig.intensity);
            light.position.set(lightConfig.pos[0], lightConfig.pos[1], lightConfig.pos[2]);
            light.target.position.set(0, 0, -7); // Apuntar hacia el centro del campo
            light.castShadow = false; // Sin sombras para mejor rendimiento
            this.scene.add(light);
            this.scene.add(light.target);
        });

        // Luz hemisférica para simular luz del cielo
        const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x2F4F4F, 0.4);
        this.scene.add(hemisphereLight);

        // Luz cenital muy intensa para simular reflectores de estadio
        const topLight = new THREE.DirectionalLight(0xffffff, 1.0);
        topLight.position.set(0, 30, -10);
        topLight.target.position.set(0, 0, -7);
        topLight.castShadow = false;
        this.scene.add(topLight);
        this.scene.add(topLight.target);

        // Luces de relleno para eliminar sombras muy marcadas
        const fillLights = [
            new THREE.DirectionalLight(0xffffee, 0.3),
            new THREE.DirectionalLight(0xffffee, 0.3),
            new THREE.DirectionalLight(0xffffee, 0.3),
            new THREE.DirectionalLight(0xffffee, 0.3)
        ];

        fillLights[0].position.set(-15, 20, -5);
        fillLights[1].position.set(15, 20, -5);
        fillLights[2].position.set(-15, 20, 5);
        fillLights[3].position.set(15, 20, 5);

        fillLights.forEach(light => {
            light.target.position.set(0, 0, -7);
            this.scene.add(light);
            this.scene.add(light.target);
        });

        // Campo de césped mejorado
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100),
            new THREE.MeshStandardMaterial({ 
                color: 0x2d6a2b,
                roughness: 0.8,
                metalness: 0.1
            }) 
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Punto de penal
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const spotGeometry = new THREE.CircleGeometry(0.1, 32);
        const penaltySpot = new THREE.Mesh(spotGeometry, lineMaterial);
        penaltySpot.rotation.x = -Math.PI / 2;
        penaltySpot.position.y = 0.01; 
        this.scene.add(penaltySpot);

        // Crear el estadio completo
        this.stadium = new Stadium(this.scene);
        this.stadium.createWorldCupFinalAtmosphere();
        
        // Optimizar automáticamente para evitar problemas de rendimiento
        setTimeout(() => {
            this.stadium.optimizeForPerformance();
        }, 2000);
        
        console.log('🏟️ Estadio creado con ambiente de final del mundo');
    }
    
    buildWorld() {
        // ELEMENTOS PRINCIPALES DEL JUEGO - MANTENER ALTA CALIDAD
        console.log('🎯 Construyendo elementos principales del juego con alta calidad...');
        
        // Arco - ALTA CALIDAD
        const goalModel = this.assets.get('arco');
        this.goal = goalModel.scene;
        this.goal.position.set(0, 0, -15);
        this.goal.scale.set(3, 3, 3);
        // Asegurar que el arco tenga sombras y detalles
        this.goal.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        this.scene.add(this.goal);

        // Pelota - ALTA CALIDAD
        const ballModel = this.assets.get('pelota');
        this.ball = ballModel.scene;
        this.ball.scale.set(0.1, 0.1, 0.1);
        // Asegurar que la pelota tenga la mejor calidad visual
        this.ball.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                // Mantener materiales originales de alta calidad
                if (child.material) {
                    child.material.needsUpdate = true;
                }
            }
        });
        this.scene.add(this.ball);
        
        // Arquero - ALTA CALIDAD
        const keeperModel = this.assets.get('arquero');
        this.goalkeeper = keeperModel.scene;
        this.goalkeeper.position.set(0, 0, -14.8);
        this.goalkeeper.scale.set(1.5, 1.5, 1.5);
        // Asegurar que el arquero tenga la mejor calidad visual
        this.goalkeeper.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                // Mantener materiales originales de alta calidad
                if (child.material) {
                    child.material.needsUpdate = true;
                }
            }
        });
        this.scene.add(this.goalkeeper);
        this.goalkeeperAI = new GoalkeeperAI(this.goalkeeper);

        this.player.add(this.camera);
        this.scene.add(this.player);
        
        console.log('✅ Elementos principales del juego construidos con máxima calidad');
    }

    resetScene() {
        // Posición inicial más alejada para mostrar mejor el movimiento automático
        this.player.position.set(0, 1.7, 10);
        this.camera.rotation.set(0, 0, 0);
        
        if (!this.player.children.includes(this.camera)) this.player.add(this.camera);
        this.toPlayerView();
        
        if (this.ball) {
            this.ball.position.set(0, 0.1, 0); 
            if (this.ball.userData.velocity) this.ball.userData.velocity.set(0,0,0);
        }
        
        if (this.goalkeeperAI) this.goalkeeperAI.reset();
        this.ui.reset();
        this.stateMachine.changeState('PRE_PENAL');
    }

    bindEventListeners() {
        console.log('🔗 Binding event listeners...');
        
        this.ui.on('start', () => {
            console.log('🎮 Start button pressed - initializing audio and gestures');
            this.audio.init(this.camera);
            this.audio.activateAudioContext();
            
            // Activar audio ambiente del estadio
            setTimeout(() => {
                this.audio.playStadiumAmbient();
            }, 500);
            
            // Activar automáticamente el control por gestos
            if (!this.gestureControlActive) {
                this.activateGesturesOnStart();
            }
            
            setTimeout(() => {
                this.audio.ensureMontielReady();
            }, 1000);
            
            this.controls.lock();
            this.resetScene(); 
        });
        
        this.ui.on('retry', () => {
            this.resetScene();
            this.controls.lock();
        });
        
        this.ui.on('toggle-gesture', () => {
            this.toggleGestureControl();
        });

        this.input.on('kick', (power) => {
            if(this.stateMachine.currentState && this.stateMachine.currentState.name === 'AIMING') {
                // Intensificar ambiente del estadio en el momento del tiro
                if (this.stadium) {
                    this.stadium.intensifyAtmosphere();
                }
                
                // Intensificar audio del estadio
                this.audio.intensifyStadiumAudio();
                
                this.stateMachine.changeState('KICK', { power });
            }
        });

        this.input.on('test-audio', () => {
            console.log('Testing audio system...');
            this.audio.activateAudioContext();
            
            setTimeout(() => {
                this.audio.playMontiel();
            }, 500);
        });
        
        this.input.on('toggle-gesture', () => {
            this.toggleGestureControl();
        });

        this.controls.addEventListener('lock', () => this.ui.showHUD(true));
        this.controls.addEventListener('unlock', () => this.ui.showHUD(false));
    }

    update(deltaTime) {
        if(this.stateMachine.currentState) {
            this.stateMachine.currentState.update(deltaTime);
        }
        
        if (this.stateMachine.currentState && (this.stateMachine.currentState.name === 'KICK' || this.stateMachine.currentState.name === 'OUTCOME')) {
            this.camera.lookAt(this.cameraLookTarget);
        }

        this.renderer.render(this.scene, this.camera);
    }
    
    toPlayerView() {
        gsap.to(this.camera.position, { x: 0, y: 0, z: 0, duration: 0.5 });
        this.camera.lookAt(0, 1, -15);
    }

    toBallFollowView(ball) {
        const startPos = new THREE.Vector3();
        this.camera.getWorldPosition(startPos);
        
        this.player.remove(this.camera);
        this.scene.add(this.camera);
        this.camera.position.copy(startPos);

        this.cameraLookTarget.copy(ball.position);

        gsap.to(this.camera.position, {
            x: startPos.x, y: startPos.y + 1, z: startPos.z + 2,
            duration: 1.5
        });
        
        gsap.to(this.cameraLookTarget, {
            x: () => ball.position.x,
            y: () => Math.max(ball.position.y, 0.5),
            z: () => ball.position.z,
            duration: 3, 
            ease: "power2.out"
        });
    }

    toStadiumView() {
        gsap.to(this.camera.position, { x: 15, y: 10, z: -5, duration: 1 });
        gsap.to(this.cameraLookTarget, {
            x: this.goal.position.x,
            y: this.goal.position.y + 1,
            z: this.goal.position.z,
            duration: 1
        });
    }

    onResize() {
        this.sizes.width = window.innerWidth;
        this.sizes.height = window.innerHeight;
        this.camera.aspect = this.sizes.width / this.sizes.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
}