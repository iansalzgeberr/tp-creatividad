import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';

import Assets from './Assets';
import StateMachine from './States';
import InputManager from './Input';
import AudioManager from './Audio';
import UIManager from './UI';
import GoalkeeperAI from './GoalkeeperAI';
import ShotModel from './ShotModel';

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
        this.stateMachine = new StateMachine(this);
        this.shotModel = new ShotModel();

        this.player = new THREE.Group();
        this.ball = null;
        this.goalkeeper = null;
        this.goal = null;
        this.cameraLookTarget = new THREE.Vector3(); 

        this.controls = new PointerLockControls(this.camera, document.body);
        this.goalkeeperAI = null;

        this.init();
    }

    init() {
        console.log('🚀 SceneManager init() called');
        this.setupScene();
        this.bindEventListeners();
        
        // Inicializar audio inmediatamente
        console.log('🎵 Initializing audio immediately...');
        this.audio.init(this.camera);
        
        this.assets.on('loaded', () => {
            this.buildWorld();
            console.log('✅ Assets loaded, checking montiel audio...');
            // Verificar que Montiel esté listo
            setTimeout(() => {
                this.audio.ensureMontielReady();
            }, 500);
            this.stateMachine.changeState('INTRO');
        });
    }

    setupScene() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const spotLight = new THREE.SpotLight(0xffffff, 1, 100, Math.PI * 0.2, 0.5);
        spotLight.position.set(0, 15, 0); 
        spotLight.castShadow = true;
        this.scene.add(spotLight);

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100),
            new THREE.MeshStandardMaterial({ color: 0x2d6a2b }) 
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
    }
    
    buildWorld() {
        const goalModel = this.assets.get('arco');
        this.goal = goalModel.scene;
        this.goal.position.set(0, 0, -15);
        this.goal.scale.set(3, 3, 3);
        this.scene.add(this.goal);

        const ballModel = this.assets.get('pelota');
        this.ball = ballModel.scene;
        this.ball.scale.set(0.1, 0.1, 0.1);
        this.ball.castShadow = true;
        this.scene.add(this.ball);
        
        const keeperModel = this.assets.get('arquero');
        this.goalkeeper = keeperModel.scene;
        this.goalkeeper.position.set(0, 0, -14.8);
        this.goalkeeper.scale.set(1.5, 1.5, 1.5);
        this.scene.add(this.goalkeeper);
        this.goalkeeperAI = new GoalkeeperAI(this.goalkeeper);

        this.player.add(this.camera);
        this.scene.add(this.player);
    }

    resetScene() {
        this.player.position.set(0, 1.7, 8);
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
        // --- CAMBIO CLAVE AQUÍ: Se eliminó el parámetro (e) para que coincida con el emit() de UI.js ---
        console.log('🔗 Binding event listeners...');
        this.ui.on('start', () => {
            console.log('🎮 Start button pressed - initializing audio');
            console.log('Camera object:', this.camera);
            this.audio.init(this.camera); // Inicializar audio con la cámara
            
            // Activar contexto de audio después de la interacción del usuario
            console.log('🎵 Activating audio context...');
            this.audio.activateAudioContext();
            
            console.log('Audio init completed, setting timeout for crowd...');
            setTimeout(() => {
                console.log('⏰ Timeout triggered - trying to ensure crowd playing');
                this.audio.ensureMontielReady();
            }, 1000); // Aumentar el delay para dar más tiempo a cargar el audio
            this.controls.lock();
            this.resetScene(); 
        });
        
        this.ui.on('retry', () => {
            this.resetScene();
            this.controls.lock();
        });

        this.input.on('kick', (power) => {
            if(this.stateMachine.currentState && this.stateMachine.currentState.name === 'AIMING') {
                this.stateMachine.changeState('KICK', { power });
            }
        });

        this.input.on('test-audio', () => {
            console.log('Testing audio system...');
            console.log('Audio status:', this.audio.getAudioStatus());
            
            // ¡ACTIVAR AUDIO CONTEXT AHORA!
            console.log('🔥 ACTIVATING AUDIO CONTEXT WITH T KEY...');
            this.audio.activateAudioContext();
            
            // Probar Montiel inmediatamente
            setTimeout(() => {
                console.log('🎙️ Testing Montiel playback...');
                this.audio.playMontiel();
            }, 500);
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