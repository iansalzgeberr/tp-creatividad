import * as THREE from 'three';
import gsap from 'gsap';

const PENALTY_SPOT = new THREE.Vector3(0, 0, 0);
const PLAYER_AREA_RADIUS = 9; 
const GRAVITY = 9.8;

class State {
    constructor(name, manager) {
        this.name = name;
        this.manager = manager;
    }
    enter(params) {}
    update(deltaTime) {}
    exit() {}
}

class IntroState extends State {
    enter() { this.manager.ui.showIntro(true); }
    exit() { this.manager.ui.showIntro(false); }
}

class PrePenalState extends State {
    enter() {
        console.log('Entering PRE_PENAL state');
        this.manager.audio.fade('heartbeat', 0.5, 2);
        this.manager.input.setMovementEnabled(true);
        console.log('Movement enabled:', this.manager.input.movementEnabled);
    }
    update(deltaTime) {
        const moveSpeed = this.manager.input.keys.shift ? 6.0 : 3.0;
        const moveDirection = new THREE.Vector3();

        if (this.manager.input.keys.w) moveDirection.z -= 1;
        if (this.manager.input.keys.s) moveDirection.z += 1;
        if (this.manager.input.keys.a) moveDirection.x -= 1;
        if (this.manager.input.keys.d) moveDirection.x += 1;

        if (moveDirection.length() > 0) {
            moveDirection.normalize().multiplyScalar(moveSpeed * deltaTime);
            const yRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, this.manager.camera.rotation.y, 0));
            moveDirection.applyQuaternion(yRotation);
            
            const nextPosition = this.manager.player.position.clone().add(moveDirection);
            
            if (nextPosition.distanceTo(PENALTY_SPOT) < PLAYER_AREA_RADIUS) {
                 this.manager.player.position.add(moveDirection);
            }
        }
        
        const playerPos2D = new THREE.Vector2(this.manager.player.position.x, this.manager.player.position.z);
        const ballPos2D = new THREE.Vector2(this.manager.ball.position.x, this.manager.ball.position.z);
        
        if (playerPos2D.distanceTo(ballPos2D) < 2.5) {
            this.manager.stateMachine.changeState('AIMING');
        }
    }
    exit() { this.manager.input.setMovementEnabled(false); }
}

class AimingState extends State {
    update(deltaTime) {
        const profileSpeed = 1.0;
        if (this.manager.input.keys.a) this.manager.player.position.x -= profileSpeed * deltaTime;
        if (this.manager.input.keys.d) this.manager.player.position.x += profileSpeed * deltaTime;
        
        this.manager.player.position.x = THREE.MathUtils.clamp(this.manager.player.position.x, -1.5, 1.5);
        this.manager.ui.updatePowerBar(this.manager.input.power);
    }
}

class KickState extends State {
    constructor(name, manager) {
        super(name, manager);
        this.hasCheckedOutcome = false;
    }

    enter(params) {
        this.hasCheckedOutcome = false;
        
        // ¡MONTIEL CUANDO SE PATEE!
        console.log('🎙️ About to play Montiel...');
        this.manager.audio.playMontiel();
        
        this.manager.ui.showHUD(false);
        this.manager.input.power = 0; 

        const pressure = this.manager.ui.getPressure();
        const shotData = this.manager.shotModel.calculateTrajectory(
            this.manager.camera.rotation, params.power, pressure
        );
        
        this.manager.ball.userData.velocity = shotData.initialVelocity;
        this.manager.ball.userData.targetPoint = shotData.targetPoint;

        this.manager.toBallFollowView(this.manager.ball);
        this.manager.goalkeeperAI.reactToShot(shotData.targetPoint);
        
        gsap.to(this.manager.camera.position, { z: this.manager.camera.position.z - 0.2, yoyo: true, repeat: 1, duration: 0.1 });
    }

    update(deltaTime) {
        if (!this.manager.ball.userData.velocity) return;

        this.manager.ball.position.add(this.manager.ball.userData.velocity.clone().multiplyScalar(deltaTime));
        this.manager.ball.userData.velocity.y -= GRAVITY * deltaTime;
        
        // Evitar que la pelota traspase el suelo
        if (this.manager.ball.position.y < 0.1) {
            this.manager.ball.position.y = 0.1;
            this.manager.ball.userData.velocity.y = 0; // Detener movimiento vertical
        }
        
        const GOAL_LINE_Z = -15; 
        if (this.manager.ball.position.z <= GOAL_LINE_Z && !this.hasCheckedOutcome) {
            this.checkOutcome();
        }
    }

    checkOutcome() {
        this.hasCheckedOutcome = true;
        const ballPos = this.manager.ball.position;

        // --- DIMENSIONES CORREGIDAS: Ajustadas al modelo 3D escalado (3x) ---
        // Aumentando considerablemente las dimensiones para que coincidan con el modelo visual
        const goalWidth = 20.0;  // Ancho de la portería (aún más generoso)
        const goalHeight = 8.0;  // Alto de la portería (aún más generoso)

        if (this.manager.goalkeeperAI.checkSave(ballPos)) {
            this.manager.stateMachine.changeState('OUTCOME', { result: 'save' });
        
        } else if (Math.abs(ballPos.x) > goalWidth / 2 || ballPos.y > goalHeight || ballPos.y < 0) {
            this.manager.stateMachine.changeState('OUTCOME', { result: 'post' });

        } else {
            this.manager.stateMachine.changeState('OUTCOME', { result: 'goal' });
        }
    }
    
    exit() {
        if(this.manager.ball.userData.velocity) this.manager.ball.userData.velocity.set(0,0,0);
    }
}

class OutcomeState extends State {
    enter(params) {
        switch(params.result) {
            case 'goal':
                // this.manager.audio.play('goal'); // Comentado - archivo no existe
                this.manager.toStadiumView();
                setTimeout(() => this.manager.stateMachine.changeState('EPILOGUE', { title: "¡GOOOOL!" }), 2000);
                break;
            case 'save':
                // this.manager.audio.play('fail'); // Comentado - archivo no existe
                gsap.to(this.manager.ball.position, { 
                    x: this.manager.ball.position.x * 1.1, y: this.manager.ball.position.y * 0.5,
                    z: this.manager.ball.position.z - 1, duration: 1
                });
                setTimeout(() => this.manager.stateMachine.changeState('EPILOGUE', { title: "¡Atajada!" }), 2000);
                break;
            case 'post':
                // this.manager.audio.play('fail'); // Comentado - archivo no existe
                gsap.to(this.manager.ball.position, { 
                    x: this.manager.ball.position.x * 1.1, y: this.manager.ball.position.y * 0.5,
                    z: this.manager.ball.position.z - 1, duration: 1
                });
                setTimeout(() => this.manager.stateMachine.changeState('EPILOGUE', { title: "¡Fallado!" }), 2000);
                break;
        }
    }
}

class EpilogueState extends State {
    enter(params) {
        this.manager.ui.showEpilogue(true, params.title);
        this.manager.controls.unlock();
    }
    exit() { this.manager.ui.showEpilogue(false); }
}


export default class StateMachine {
    constructor(manager) {
        this.manager = manager;
        this.states = {
            'INTRO': new IntroState('INTRO', manager),
            'PRE_PENAL': new PrePenalState('PRE_PENAL', manager),
            'AIMING': new AimingState('AIMING', manager),
            'KICK': new KickState('KICK', manager),
            'OUTCOME': new OutcomeState('OUTCOME', manager),
            'EPILOGUE': new EpilogueState('EPILOGUE', manager),
        };
        this.currentState = null;
    }

    changeState(name, params) {
        if (this.currentState) this.currentState.exit();
        this.currentState = this.states[name];
        this.currentState.enter(params);
    }

    update(deltaTime) {
        if (this.currentState) this.currentState.update(deltaTime);
    }
}