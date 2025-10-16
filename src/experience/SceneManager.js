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
import KickGestureManager from './KickGestureManager';
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
        this.gesture = new KickGestureManager();
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
        
        this.aimMarker = null;
        this.aimMarkerVisible = false;
        
        this.gestureControlActive = false;

        this.init();
    }

    init() {
        console.log('🚀 SceneManager init() called');
        this.setupScene();
        this.bindEventListeners();
        
        console.log('🎵 Initializing audio immediately...');
        this.audio.init(this.camera);
        
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
        
        this.gesture.on('error', (error) => {
            console.error('❌ Gesture control error:', error);
            alert('Error al inicializar control por gestos. Verifica que tu cámara esté conectada.');
        });
    }

    setupScene() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const spotLight = new THREE.SpotLight(0xffffff, 1.2, 100, Math.PI * 0.2, 0.5);
        spotLight.position.set(0, 15, 0); 
        spotLight.castShadow = true;
        this.scene.add(spotLight);

        const stadiumLights = [
            { pos: [-20, 12, -10], color: 0xffffee, intensity: 0.8 },
            { pos: [20, 12, -10], color: 0xffffee, intensity: 0.8 },
            { pos: [-20, 12, 10], color: 0xffffee, intensity: 0.8 },
            { pos: [20, 12, 10], color: 0xffffee, intensity: 0.8 },
            { pos: [0, 20, -20], color: 0xffffff, intensity: 1.0 },
            { pos: [0, 8, 15], color: 0xffffff, intensity: 0.6 }
        ];

        stadiumLights.forEach(lightConfig => {
            const light = new THREE.DirectionalLight(lightConfig.color, lightConfig.intensity);
            light.position.set(lightConfig.pos[0], lightConfig.pos[1], lightConfig.pos[2]);
            light.target.position.set(0, 0, -7);
            light.castShadow = false;
            this.scene.add(light);
            this.scene.add(light.target);
        });

        const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x2F4F4F, 0.4);
        this.scene.add(hemisphereLight);

        const topLight = new THREE.DirectionalLight(0xffffff, 1.0);
        topLight.position.set(0, 30, -10);
        topLight.target.position.set(0, 0, -7);
        topLight.castShadow = false;
        this.scene.add(topLight);
        this.scene.add(topLight.target);

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

        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const spotGeometry = new THREE.CircleGeometry(0.1, 32);
        const penaltySpot = new THREE.Mesh(spotGeometry, lineMaterial);
        penaltySpot.rotation.x = -Math.PI / 2;
        penaltySpot.position.y = 0.01; 
        this.scene.add(penaltySpot);

        this.stadium = new Stadium(this.scene);
        this.stadium.createWorldCupFinalAtmosphere();
        
        setTimeout(() => {
            this.stadium.optimizeForPerformance();
        }, 2000);
        
        console.log('🏟️ Estadio creado con ambiente de final del mundo');
    }
    
    buildWorld() {
        console.log('🎯 Construyendo elementos principales del juego con alta calidad...');
        
        const goalModel = this.assets.get('arco');
        this.goal = goalModel.scene;
        this.goal.position.set(0, 0, -15);
        this.goal.scale.set(3, 3, 3);
        this.goal.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        this.scene.add(this.goal);

        const ballModel = this.assets.get('pelota');
        
        if (!ballModel) {
            console.error('❌ ERROR: Modelo de pelota no encontrado');
            const fallbackBall = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 32, 32),
                new THREE.MeshStandardMaterial({ 
                    color: 0xffffff,
                    roughness: 0.5,
                    metalness: 0.1
                })
            );
            this.ball = fallbackBall;
        } else {
            this.ball = ballModel.scene;
        }
        
        this.ball.scale.set(0.1, 0.1, 0.1);
        this.ball.position.set(0, 0.1, 0);
        this.ball.userData.velocity = new THREE.Vector3(0, 0, 0);
        
        this.ball.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material.needsUpdate = true;
                }
            }
        });
        
        this.scene.add(this.ball);
        console.log('⚽ Pelota añadida a la escena');
        
        const keeperModel = this.assets.get('arquero');
        this.goalkeeper = keeperModel.scene;
        this.goalkeeper.position.set(0, 0, -14.8);
        this.goalkeeper.scale.set(1.5, 1.5, 1.5);
        
        this.goalkeeperAnimations = keeperModel.animations || [];
        this.goalkeeperMixer = null;
        
        if (this.goalkeeperAnimations.length > 0) {
            console.log(`🎭 Arquero ElShenawy tiene ${this.goalkeeperAnimations.length} animaciones:`, 
                this.goalkeeperAnimations.map(anim => anim.name));
            
            this.goalkeeperMixer = new THREE.AnimationMixer(this.goalkeeper);
            
            this.goalkeeperClips = {};
            this.goalkeeperAnimations.forEach(animation => {
                const action = this.goalkeeperMixer.clipAction(animation);
                this.goalkeeperClips[animation.name] = action;
                console.log(`✅ Animación preparada: ${animation.name} (duración: ${animation.duration.toFixed(2)}s)`);
            });
        } else {
            console.log('ℹ️ El arquero ElShenawy no tiene animaciones incluidas');
        }
        
        this.goalkeeper.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material.needsUpdate = true;
                }
            }
        });
        this.scene.add(this.goalkeeper);
        this.goalkeeperAI = new GoalkeeperAI(this.goalkeeper, this.goalkeeperMixer, this.goalkeeperClips);

        this.createAimMarker();

        this.player.add(this.camera);
        this.scene.add(this.player);
        
        console.log('✅ Elementos principales del juego construidos con máxima calidad');
    }

    createAimMarker() {
        const markerGroup = new THREE.Group();
        
        const outerRing = new THREE.Mesh(
            new THREE.RingGeometry(0.3, 0.35, 32),
            new THREE.MeshBasicMaterial({ 
                color: 0x00ff00,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            })
        );
        
        const innerCircle = new THREE.Mesh(
            new THREE.CircleGeometry(0.3, 32),
            new THREE.MeshBasicMaterial({ 
                color: 0x00ff00,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            })
        );
        
        const crossGeometry = new THREE.BufferGeometry();
        const crossVertices = new Float32Array([
            -0.15, 0, 0,  0.15, 0, 0,
            0, -0.15, 0,  0, 0.15, 0
        ]);
        crossGeometry.setAttribute('position', new THREE.BufferAttribute(crossVertices, 3));
        
        const crossLines = new THREE.LineSegments(
            crossGeometry,
            new THREE.LineBasicMaterial({ 
                color: 0xffff00,
                linewidth: 2
            })
        );
        
        markerGroup.add(outerRing);
        markerGroup.add(innerCircle);
        markerGroup.add(crossLines);
        
        markerGroup.position.set(0, 1.5, -14.95);
        markerGroup.visible = false;
        
        this.scene.add(markerGroup);
        this.aimMarker = markerGroup;
        
        gsap.to(outerRing.scale, {
            x: 1.2,
            y: 1.2,
            z: 1.2,
            duration: 0.8,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1
        });
        
        console.log('🎯 Marcador de apuntado creado');
    }

    hideAimMarker() {
        if (this.aimMarker && this.aimMarkerVisible) {
            this.aimMarker.visible = false;
            this.aimMarkerVisible = false;
            console.log('🎯 Marcador de apuntado OCULTO');
        }
    }

    showAimMarker() {
        if (this.aimMarker && !this.aimMarkerVisible) {
            this.aimMarker.visible = true;
            this.aimMarkerVisible = true;
            console.log('🎯 Marcador de apuntado VISIBLE');
        }
    }

    handleGestureAim(target) {
        if (this.aimMarker && !this.aimMarkerVisible) {
            this.showAimMarker();
        }
        
        const goalWidth = 7.32;
        const goalHeight = 2.44;
        const goalZ = -14.95;
        
        const aimX = (1 - target.x - 0.5) * goalWidth * 0.9;
        const aimY = (1 - target.y) * goalHeight * 0.9 + 0.3;
        
        if (this.aimMarker) {
            gsap.to(this.aimMarker.position, {
                x: aimX,
                y: aimY,
                z: goalZ,
                duration: 0.15,
                ease: 'power2.out'
            });
        }
        
        const targetYaw = (target.x - 0.5) * Math.PI / 6;
        const targetPitch = -(target.y - 0.5) * Math.PI / 9;
        
        gsap.to(this.camera.rotation, {
            y: targetYaw,
            x: targetPitch,
            duration: 0.2,
            ease: 'power2.out'
        });
    }

    async activateGesturesOnStart() {
        console.log('🦶 Auto-activando control con pie (PERMANENTE)...');
        
        try {
            const success = await this.gesture.init();
            
            if (success) {
                this.gestureControlActive = true;
                this.gesture.enable();
                console.log('✅ Control con pie activado automáticamente');
            } else {
                console.log('❌ Control con pie falló, usando teclado de respaldo');
            }
        } catch (error) {
            console.error('Error activating gesture control:', error);
        }
    }

    resetScene() {
        this.player.position.set(0, 1.7, 10);
        this.camera.rotation.set(0, 0, 0);
        
        this.hideAimMarker();
        
        if (!this.player.children.includes(this.camera)) this.player.add(this.camera);
        this.toPlayerView();
        
        if (this.ball) {
            this.ball.position.set(0, 0.1, 0);
            this.ball.userData.velocity = new THREE.Vector3(0, 0, 0);
            console.log('⚽ Pelota reiniciada en posición:', this.ball.position);
        } else {
            console.warn('⚠️ ADVERTENCIA: No hay pelota en la escena');
        }
        
        if (this.goalkeeperAI) this.goalkeeperAI.reset();
        this.ui.reset();
        
        this.input.power = 0;
        this.input.charging = false;
        
        this.stateMachine.changeState('PRE_PENAL');
    }

    bindEventListeners() {
        console.log('📡 Binding event listeners...');
        
        this.ui.on('start', () => {
            console.log('🎮 Start button pressed - initializing audio and gestures');
            this.audio.init(this.camera);
            this.audio.activateAudioContext();
            
            setTimeout(() => {
                this.audio.playStadiumAmbient();
            }, 500);
            
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

        this.input.on('kick', (power) => {
            if(this.stateMachine.currentState && this.stateMachine.currentState.name === 'AIMING') {
                if (this.stadium) {
                    this.stadium.intensifyAtmosphere();
                }
                
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

        // LISTENERS PARA KICK GESTURE MANAGER
        this.gesture.on('pointing', (target) => {
            console.log('🎯 EVENTO POINTING DEL GESTO:', target);
            
            if (this.gestureControlActive && this.stateMachine.currentState?.name === 'AIMING') {
                this.handleGestureAim(target);
            }
        });
        
        this.gesture.on('charge-start', () => {
            console.log('⚡ EVENTO CHARGE-START DEL GESTO');
            
            if (this.gestureControlActive && this.stateMachine.currentState?.name === 'AIMING') {
                if (!this.input.charging) {
                    this.input.charging = true;
                    this.input.power = 0;
                    gsap.to(this.input, { 
                        power: 1, 
                        duration: 1.5, 
                        ease: 'power1.in',
                        onUpdate: () => {
                            this.ui.updatePowerBar(this.input.power);
                        }
                    });
                }
            }
        });
        
        this.gesture.on('charging', (power) => {
            if (this.gestureControlActive && this.stateMachine.currentState?.name === 'AIMING') {
                this.input.power = power;
                this.ui.updatePowerBar(power * 100);
            }
        });
        
        this.gesture.on('shoot', (shotData) => {
            console.log('⚽ EVENTO SHOOT DEL GESTO:', shotData);
            
            if (this.gestureControlActive && this.stateMachine.currentState?.name === 'AIMING') {
                gsap.killTweensOf(this.input);
                
                const kickPower = shotData.power || this.input.power;
                
                console.log(`⚽ Disparando con potencia: ${(kickPower * 100).toFixed(0)}%`);
                
                this.hideAimMarker();
                this.input.charging = false;
                this.input.power = 0;
                
                if (this.stateMachine.currentState && this.stateMachine.currentState.name === 'AIMING') {
                    if (this.stadium) {
                        this.stadium.intensifyAtmosphere();
                    }
                    
                    this.audio.intensifyStadiumAudio();
                    
                    this.stateMachine.changeState('KICK', { power: kickPower });
                }
            }
        });

        this.controls.addEventListener('lock', () => this.ui.showHUD(true));
        this.controls.addEventListener('unlock', () => this.ui.showHUD(false));
    }

    update(deltaTime) {
        if(this.stateMachine.currentState) {
            this.stateMachine.currentState.update(deltaTime);
        }
        
        if (this.goalkeeperMixer) {
            this.goalkeeperMixer.update(deltaTime);
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