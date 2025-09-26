import * as THREE from 'three';
import gsap from 'gsap';

export default class GoalkeeperAI {
    constructor(model) {
        this.model = model;
        this.initialPos = model.position.clone();
        this.state = 'IDLE'; // IDLE, ANTICIPATE, DIVE
        this.reactionTime = 0.2; // Tiempo de reacción balanceado

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
     * @param {THREE.Vector3} targetPoint - Punto donde se predice que llegará la pelota
     */
    reactToShot(targetPoint) {
        this.state = 'ANTICIPATE';
        gsap.killTweensOf(this.model.position); 

        // Mejorar la lógica del arquero: combinar intuición con predicción
        let diveTarget;
        
        // 40% de probabilidad de ir hacia el targetPoint, 60% de adivinar mal
        if (Math.random() < 0.4 && targetPoint) {
            // Ir hacia donde realmente va la pelota (con más error)
            const errorX = (Math.random() - 0.5) * 4; // Error de ±2 unidades (más error)
            const errorY = (Math.random() - 0.5) * 2; // Error de ±1 unidad (más error)
            
            diveTarget = new THREE.Vector3(
                Math.max(-10, Math.min(10, targetPoint.x + errorX)), // Limitar al ancho del arco
                Math.max(0.5, Math.min(4, targetPoint.y + errorY)), // Limitar a la altura del arco
                this.initialPos.z
            );
        } else {
            // Adivinar mal: elegir una zona aleatoria
            const randomIndex = Math.floor(Math.random() * this.diveZones.length);
            diveTarget = this.diveZones[randomIndex];
        }
        
        setTimeout(() => this.dive(diveTarget), this.reactionTime * 1000);
    }
    
    dive(target) {
        this.state = 'DIVE';
        
        // Movimiento más rápido y agresivo del arquero
        gsap.to(this.model.position, {
            x: target.x,
            y: target.y,
            duration: 0.3, // Más rápido
            ease: 'power3.out' // Easing más agresivo
        });
        
        // Rotación más dramática cuando se tira a los lados
        if (Math.abs(target.x) > 1 || target.y > 1) {
            const direction = target.x > this.initialPos.x ? -1 : 1;
            gsap.to(this.model.rotation, {
                z: direction * Math.PI / 3, // Rotación más dramática
                duration: 0.25,
                ease: 'power3.out'
            });
        }
    }
    
    checkSave(ballPosition) {
        if (this.state !== 'DIVE') return false;
        
        // Crear un hitbox más generoso basado en la posición actual del arquero
        const keeperPos = this.model.position;
        const saveRadius = 2.0; // Radio de alcance del arquero (reducido un poco)
        
        // Verificar si la pelota está dentro del alcance del arquero
        const distance = new THREE.Vector3(
            ballPosition.x - keeperPos.x,
            ballPosition.y - keeperPos.y,
            ballPosition.z - keeperPos.z
        ).length();
        
        // Factor de suerte más realista para hacer las atajadas menos frecuentes
        const luckFactor = Math.random() < 0.5; // 50% de probabilidad de atajar si está en rango
        
        return distance <= saveRadius && luckFactor;
    }
}