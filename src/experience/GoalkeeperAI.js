import * as THREE from 'three';
import gsap from 'gsap';

export default class GoalkeeperAI {
    constructor(model) {
        this.model = model;
        this.initialPos = model.position.clone();
        this.state = 'IDLE'; // IDLE, ANTICIPATE, DIVE
        this.reactionTime = 0.25;

        // --- CAMBIO CLAVE: Zonas de atajada predefinidas ---
        // Estas son las "decisiones" que el arquero puede tomar.
        // Ajustadas para que coincidan con las dimensiones de detección de gol en States.js
        const goalWidth = 10.0;  // La mitad de 20.0 (goalWidth en States.js)
        const goalHeight = 4.0;  // La mitad de 8.0 (goalHeight en States.js)
        this.diveZones = [
            new THREE.Vector3(-goalWidth, goalHeight, this.initialPos.z), // Arriba izquierda
            new THREE.Vector3(0, goalHeight, this.initialPos.z),          // Arriba centro
            new THREE.Vector3(goalWidth, goalHeight, this.initialPos.z),  // Arriba derecha
            new THREE.Vector3(-goalWidth, 0.5, this.initialPos.z),       // Abajo izquierda
            new THREE.Vector3(goalWidth, 0.5, this.initialPos.z),        // Abajo derecha
            new THREE.Vector3(0, 0.5, this.initialPos.z),                // Abajo centro (quédate quieto)
        ];
        
        this.reset();
    }

    reset() {
        gsap.killTweensOf(this.model.position);
        gsap.killTweensOf(this.model.rotation);
        this.model.position.copy(this.initialPos);
        this.model.rotation.set(0, 0, 0); 
        this.state = 'IDLE';
        this.startIdleAnimation();
    }
    
    startIdleAnimation() {
        gsap.to(this.model.position, {
            x: this.initialPos.x + (Math.random() > 0.5 ? 0.3 : -0.3),
            duration: 1.5 + Math.random(),
            ease: 'power1.inOut',
            yoyo: true,
            repeat: -1
        });
    }

    /**
     * @param {THREE.Vector3} targetPoint - Ya no usamos este parámetro. El arquero adivina.
     */
    reactToShot(targetPoint) {
        this.state = 'ANTICIPATE';
        gsap.killTweensOf(this.model.position); 

        // --- LÓGICA COMPLETAMENTE NUEVA ---
        // El arquero elige aleatoriamente una zona a la que tirarse, ¡como en la vida real!
        const randomIndex = Math.floor(Math.random() * this.diveZones.length);
        const diveTarget = this.diveZones[randomIndex];
        
        setTimeout(() => this.dive(diveTarget), this.reactionTime * 1000);
    }
    
    dive(target) {
        this.state = 'DIVE';
        
        gsap.to(this.model.position, {
            x: target.x,
            y: target.y,
            duration: 0.4,
            ease: 'power2.out'
        });
        
        // No te tires si te quedas en el centro
        if (target.x !== 0 || target.y > 0.5) {
            const direction = target.x > this.initialPos.x ? -1 : 1;
            gsap.to(this.model.rotation, {
                z: direction * Math.PI / 4, 
                duration: 0.35,
                ease: 'power2.out'
            });
        }
    }
    
    checkSave(ballPosition) {
        if (this.state !== 'DIVE') return false;
        
        // Crear un hitbox más preciso basado en la posición actual del arquero
        const keeperPos = this.model.position;
        const saveRadius = 1.2; // Radio de alcance del arquero
        
        // Verificar si la pelota está dentro del alcance del arquero
        const distance = new THREE.Vector3(
            ballPosition.x - keeperPos.x,
            ballPosition.y - keeperPos.y,
            ballPosition.z - keeperPos.z
        ).length();
        
        return distance <= saveRadius;
    }
}