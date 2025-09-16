import * as THREE from 'three';

export default class ShotModel {
    constructor() {
        this.maxPowerSpeed = 50;
        this.liftFactor = 0.25; // Podemos darle un buen efecto de elevación
    }

    calculateTrajectory(cameraRotation, power, pressure) {
        // --- LÓGICA DE FÍSICA COMPLETAMENTE REESCRITA (Y SIMPLIFICADA) ---

        // 1. Definimos la elevación del disparo basado en la potencia.
        const liftAmount = power * this.liftFactor;
        
        // 2. Creamos un vector de dirección base EN ESPACIO DE CÁMARA.
        // Ya está apuntando hacia adelante (-Z) y hacia arriba (+Y).
        let direction = new THREE.Vector3(0, liftAmount, -1);
        
        // 3. NORMALIZAMOS el vector. ¡Este paso es CRUCIAL!
        // Asegura que el vector tiene una longitud de 1, para que la velocidad sea consistente.
        direction.normalize();

        // 4. AHORA rotamos este vector perfecto al espacio del mundo, según donde mira el jugador.
        direction.applyEuler(cameraRotation);
        
        // 5. Añadimos la imprecisión por presión (esto no cambia)
        const noiseX = (Math.random() - 0.5) * pressure * 0.2;
        const noiseY = (Math.random() - 0.5) * pressure * 0.15;
        direction.x += noiseX;
        direction.y += noiseY;
        
        // 6. Calculamos la velocidad final
        const initialSpeed = this.maxPowerSpeed * power;
        const initialVelocity = direction.clone().multiplyScalar(initialSpeed);

        // El resto es para la IA, no afecta la trayectoria real
        const distanceToGoal = 15;
        const timeToGoal = Math.abs(distanceToGoal / initialVelocity.z);
        const targetPoint = new THREE.Vector3(
            initialVelocity.x * timeToGoal,
            0.1 + initialVelocity.y * timeToGoal - 0.5 * 9.8 * timeToGoal * timeToGoal,
            -distanceToGoal
        );

        return { initialVelocity, targetPoint };
    }
}