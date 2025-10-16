import * as THREE from 'three';
import gsap from 'gsap';

// Clase para movimientos orgánicos del arquero
class OrganicMovement {
    static createNaturalPath(startPos, endPos, movementType) {
        const path = new THREE.CurvePath();
        
        // Calcular puntos de control para una curva natural
        const distance = startPos.distanceTo(endPos);
        const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
        
        switch(movementType) {
            case 'step':
                // Para pasos: curva suave lateral
                const stepControl = midPoint.clone();
                stepControl.y += 0.1; // Pequeña elevación natural
                stepControl.x += (endPos.x - startPos.x) * 0.3; // Anticipación
                
                const stepCurve = new THREE.QuadraticBezierCurve3(startPos, stepControl, endPos);
                path.add(stepCurve);
                break;
                
            case 'dive':
                // Para zambullidas: curva parabólica realista
                const diveControl1 = startPos.clone();
                diveControl1.y += 0.2; // Impulso inicial hacia arriba
                diveControl1.x += (endPos.x - startPos.x) * 0.2;
                
                const diveControl2 = midPoint.clone();
                diveControl2.y += Math.max(0.1, distance * 0.15); // Arco de vuelo
                
                const diveCurve = new THREE.CubicBezierCurve3(startPos, diveControl1, diveControl2, endPos);
                path.add(diveCurve);
                break;
                
            case 'desperate':
                // Para intentos desesperados: movimiento exagerado
                const desperateControl1 = startPos.clone();
                desperateControl1.y += 0.3;
                desperateControl1.x += (endPos.x - startPos.x) * 0.1;
                
                const desperateControl2 = midPoint.clone();
                desperateControl2.y += 0.4;
                desperateControl2.x += (endPos.x - startPos.x) * 0.8;
                
                const desperateCurve = new THREE.CubicBezierCurve3(startPos, desperateControl1, desperateControl2, endPos);
                path.add(desperateCurve);
                break;
                
            default:
                // Movimiento lineal simple
                const linearCurve = new THREE.LineCurve3(startPos, endPos);
                path.add(linearCurve);
        }
        
        return path;
    }
    
    static animateAlongPath(object, path, duration, rotation = null) {
        const points = path.getPoints(50); // 50 puntos para suavidad
        
        const timeline = gsap.timeline();
        
        // Animar posición a lo largo del path
        timeline.to({}, {
            duration: duration,
            ease: "power2.out",
            onUpdate: function() {
                const progress = this.progress();
                const targetIndex = Math.floor(progress * (points.length - 1));
                
                if (targetIndex < points.length) {
                    object.position.copy(points[targetIndex]);
                    
                    // Rotación natural basada en la dirección del movimiento
                    if (rotation && targetIndex > 0) {
                        const direction = new THREE.Vector3()
                            .subVectors(points[targetIndex], points[targetIndex - 1])
                            .normalize();
                        
                        if (direction.length() > 0) {
                            const angle = Math.atan2(direction.x, direction.z);
                            object.rotation.y = angle * rotation.intensity;
                        }
                    }
                }
            }
        });
        
        return timeline;
    }
}

export default class GoalkeeperAI {
    constructor(model, mixer = null, clips = null) {
        this.model = model;
        this.mixer = mixer;
        this.clips = clips || {};
        this.currentAction = null;
        this.initialPos = model.position.clone();
        this.state = 'IDLE';
        this.reactionTime = 0.2 + Math.random() * 0.15; // 0.2-0.35s más realista
        
        // Características del arquero (aleatorias para variabilidad)
        this.skills = {
            reflexes: 0.6 + Math.random() * 0.3,    // 0.6-0.9 (reflejos)
            positioning: 0.5 + Math.random() * 0.4, // 0.5-0.9 (posicionamiento)
            reach: 0.7 + Math.random() * 0.2        // 0.7-0.9 (alcance)
        };
        
        // Log de animaciones disponibles y construcción de índice para matching flexible
        if (this.mixer && Object.keys(this.clips).length > 0) {
            this.availableClipNames = Object.keys(this.clips);
            console.log('🎭 GoalkeeperAI ElShenawy: Animaciones disponibles:', this.availableClipNames);
            this._buildClipIndex();
        } else {
            this.availableClipNames = [];
            console.log('ℹ️ GoalkeeperAI ElShenawy: Sin animaciones, usando movimiento por código');
        }
        
        // Límites del arco ULTRA AMPLIOS para movimiento extremo
        this.goalLimits = {
            minX: -5.0,  // EXTREMADAMENTE amplio
            maxX: 5.0,   // EXTREMADAMENTE amplio
            minY: this.initialPos.y,   
            maxY: this.initialPos.y + 2.0,   // También más alto
            minZ: this.initialPos.z, // Sin movimiento adelante/atrás
            maxZ: this.initialPos.z   
        };
        
        // Sistema de huesos para poses realistas
        this.bones = {};
        this.initialBoneRotations = {};
        this._findBones();
        
        this.reset();
    }

    // Métodos para manejar animaciones del modelo ElShenawy
    playAnimation(animationName, options = {}) {
        if (!this.mixer || Object.keys(this.clips).length === 0) {
            console.log(`⚠️ Animación '${animationName}' no disponible (no hay mixer/clips)`);
            return false;
        }

        // Resolver nombre a una clave de clip existente (case-insensitive / parcial)
        const resolvedKey = this._resolveClipKey(animationName);
        if (!resolvedKey) {
            console.log(`⚠️ No se encontró clip para '${animationName}'`);
            return false;
        }

        const { loop = false, fadeIn = 0.2, fadeOut = 0.2, timeScale = 1.0 } = options;

        // Detener animación actual si existe
        if (this.currentAction) {
            try { this.currentAction.fadeOut(fadeOut); } catch (e) { /* ignore */ }
        }

        // Reproducir nueva animación
        const action = this.clips[resolvedKey];
        this.currentAction = action;
        this.currentAction
            .reset()
            .setEffectiveTimeScale(timeScale)
            .setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce)
            .fadeIn(fadeIn)
            .play();

        console.log(`🎭 Reproduciendo animación ElShenawy: ${animationName}`);
        return true;
    }

    stopAnimation() {
        if (this.currentAction) {
            this.currentAction.fadeOut(0.2);
            this.currentAction = null;
        }
    }

    // Intentar usar animaciones específicas para acciones del arquero
    playIdleAnimation() {
        // Buscar animaciones de idle/reposo comunes en modelos de arqueros
        const idleAnimations = [
            'idle', 'stand', 'wait', 'ready', 'goalkeeper_idle', 
            'keeper_stand', 'neutral', 'default'
        ];
        for (const animName of idleAnimations) {
            const key = this._resolveClipKey(animName);
            if (key) {
                this.playAnimation(key, { loop: true });
                return true;
            }
        }

        // fallback: if there are clips, use the first available looping
        if (this.availableClipNames && this.availableClipNames.length > 0) {
            const first = this.availableClipNames[0];
            console.log('ℹ️ No se encontró idle por nombre; usando primer clip disponible:', first);
            this.playAnimation(first, { loop: true });
            return true;
        }
        return false;
    }

    playDiveAnimation(direction = 'center') {
        // Buscar animaciones de zambullida según dirección
        const diveAnimations = [
            `dive_${direction}`, `dive${direction}`, `save_${direction}`,
            'dive', 'save', 'catch', 'block', 'jump', 'goalkeeper_dive',
            'keeper_save', 'reaction'
        ];
        for (const animName of diveAnimations) {
            const key = this._resolveClipKey(animName);
            if (key) {
                this.playAnimation(key, { loop: false, timeScale: 1.2 });
                return true;
            }
        }
        return false;
    }

    playReactionAnimation() {
        // Buscar animaciones de reacción y preparación
        const reactionAnimations = [
            'react', 'alert', 'focus', 'prepare', 'goalkeeper_react',
            'keeper_ready', 'anticipate', 'tense'
        ];
        for (const animName of reactionAnimations) {
            const key = this._resolveClipKey(animName);
            if (key) {
                this.playAnimation(key, { loop: false });
                return true;
            }
        }
        return false;
    }

    // Construye un índice simple (lowercase) para búsqueda flexible
    _buildClipIndex() {
        this._clipIndex = this.availableClipNames.map(n => n.toLowerCase());
    }

    // Resuelve un nombre a una clave de clip existente usando coincidencias flexibles
    _resolveClipKey(nameOrKey) {
        if (!nameOrKey) return null;
        // Si ya es una clave exacta
        if (this.clips[nameOrKey]) return nameOrKey;

        const name = String(nameOrKey).toLowerCase();

        // Exact match lowercase
        for (const key of Object.keys(this.clips)) {
            if (key.toLowerCase() === name) return key;
        }

        // Substring match
        for (const key of Object.keys(this.clips)) {
            if (key.toLowerCase().includes(name)) return key;
        }

        // Try splitting name and matching any part
        const parts = name.split(/[_\-\s]/).filter(Boolean);
        for (const part of parts) {
            for (const key of Object.keys(this.clips)) {
                if (key.toLowerCase().includes(part)) return key;
            }
        }

        return null;
    }

    // ========== SISTEMA DE MANIPULACIÓN DE HUESOS PARA POSES REALISTAS ==========
    
    _findBones() {
        console.log('🦴 Buscando huesos en el esqueleto del arquero...');
        
        // Nombres comunes de huesos en modelos humanoides
        const boneNames = {
            spine: ['spine', 'torso', 'chest', 'upper_body'],
            leftShoulder: ['leftshoulder', 'shoulder.l', 'l_shoulder', 'arm_l', 'leftarm'],
            rightShoulder: ['rightshoulder', 'shoulder.r', 'r_shoulder', 'arm_r', 'rightarm'],
            leftArm: ['leftarm', 'arm.l', 'l_arm', 'upperarm.l', 'leftupperarm'],
            rightArm: ['rightarm', 'arm.r', 'r_arm', 'upperarm.r', 'rightupperarm'],
            leftForearm: ['leftforearm', 'forearm.l', 'l_forearm', 'lowerarm.l'],
            rightForearm: ['rightforearm', 'forearm.r', 'r_forearm', 'lowerarm.r'],
            leftHand: ['lefthand', 'hand.l', 'l_hand'],
            rightHand: ['righthand', 'hand.r', 'r_hand'],
            hips: ['hips', 'pelvis', 'hip', 'lower_body'],
            leftLeg: ['leftupperleg', 'leftthigh', 'leg.l', 'l_leg', 'thigh.l'],
            rightLeg: ['rightupperleg', 'rightthigh', 'leg.r', 'r_leg', 'thigh.r'],
            neck: ['neck', 'head']
        };
        
        this.model.traverse((child) => {
            if (child.isBone || child.type === 'Bone') {
                const boneName = child.name.toLowerCase();
                
                // Buscar coincidencias para cada tipo de hueso
                for (const [key, patterns] of Object.entries(boneNames)) {
                    for (const pattern of patterns) {
                        if (boneName.includes(pattern)) {
                            if (!this.bones[key]) { // Solo asignar el primero encontrado
                                this.bones[key] = child;
                                // Guardar rotación inicial para reset
                                this.initialBoneRotations[key] = {
                                    x: child.rotation.x,
                                    y: child.rotation.y,
                                    z: child.rotation.z
                                };
                                console.log(`  ✅ Encontrado ${key}: ${child.name}`);
                            }
                            break;
                        }
                    }
                }
            }
        });
        
        const foundCount = Object.keys(this.bones).length;
        console.log(`🦴 Se encontraron ${foundCount} huesos clave para manipulación`);
        
        if (foundCount === 0) {
            console.log('⚠️ No se encontraron huesos - El modelo podría no tener esqueleto o usar nombres no estándar');
        }
    }
    
    _resetBonePoses() {
        // Restaurar todas las rotaciones de huesos a su estado inicial
        for (const [key, bone] of Object.entries(this.bones)) {
            if (this.initialBoneRotations[key]) {
                const initial = this.initialBoneRotations[key];
                gsap.set(bone.rotation, { x: initial.x, y: initial.y, z: initial.z });
            }
        }
    }
    
    _applyDivePose(direction = 'right', intensity = 1.0) {
        // Generar pose de zambullida realista manipulando huesos
        const dirMult = direction === 'right' ? 1 : -1;
        
        console.log(`🦴 Aplicando pose de zambullida ${direction} (intensidad: ${intensity})`);
        
        // Torso: inclinarse hacia el lado del tiro
        if (this.bones.spine) {
            gsap.to(this.bones.spine.rotation, {
                z: dirMult * 0.6 * intensity, // Inclinación lateral pronunciada
                x: 0.3 * intensity, // Ligera inclinación hacia adelante
                duration: 0.3,
                ease: 'power2.out'
            });
        }
        
        // Brazo del lado del tiro: extender hacia la pelota
        const targetArm = direction === 'right' ? this.bones.rightArm : this.bones.leftArm;
        const targetShoulder = direction === 'right' ? this.bones.rightShoulder : this.bones.leftShoulder;
        const targetForearm = direction === 'right' ? this.bones.rightForearm : this.bones.leftForearm;
        const targetHand = direction === 'right' ? this.bones.rightHand : this.bones.leftHand;
        
        if (targetShoulder) {
            gsap.to(targetShoulder.rotation, {
                z: dirMult * 1.2 * intensity, // Levantar brazo
                x: 0.5 * intensity, // Hacia adelante
                duration: 0.25,
                ease: 'power2.out'
            });
        }
        
        if (targetArm) {
            gsap.to(targetArm.rotation, {
                z: dirMult * 0.8 * intensity,
                x: -0.3 * intensity,
                duration: 0.25,
                ease: 'power2.out'
            });
        }
        
        if (targetForearm) {
            gsap.to(targetForearm.rotation, {
                z: dirMult * 0.4 * intensity, // Extender antebrazo
                duration: 0.25,
                ease: 'power2.out'
            });
        }
        
        if (targetHand) {
            gsap.to(targetHand.rotation, {
                x: 0.3 * intensity, // Abrir mano
                duration: 0.2,
                ease: 'power2.out'
            });
        }
        
        // Brazo opuesto: balance natural
        const otherArm = direction === 'right' ? this.bones.leftArm : this.bones.rightArm;
        const otherShoulder = direction === 'right' ? this.bones.leftShoulder : this.bones.rightShoulder;
        
        if (otherShoulder) {
            gsap.to(otherShoulder.rotation, {
                z: dirMult * -0.5 * intensity, // Bajar brazo opuesto
                x: -0.3 * intensity,
                duration: 0.25,
                ease: 'power2.out'
            });
        }
        
        if (otherArm) {
            gsap.to(otherArm.rotation, {
                z: dirMult * -0.3 * intensity,
                duration: 0.25,
                ease: 'power2.out'
            });
        }
        
        // Piernas: preparar impulso
        if (this.bones.hips) {
            gsap.to(this.bones.hips.rotation, {
                z: dirMult * 0.2 * intensity,
                duration: 0.3,
                ease: 'power2.out'
            });
        }
        
        const targetLeg = direction === 'right' ? this.bones.rightLeg : this.bones.leftLeg;
        const otherLeg = direction === 'right' ? this.bones.leftLeg : this.bones.rightLeg;
        
        if (targetLeg) {
            gsap.to(targetLeg.rotation, {
                x: 0.4 * intensity, // Flexionar pierna del lado del tiro
                duration: 0.3,
                ease: 'power2.out'
            });
        }
        
        if (otherLeg) {
            gsap.to(otherLeg.rotation, {
                x: -0.2 * intensity, // Extender pierna opuesta (impulso)
                duration: 0.3,
                ease: 'power2.out'
            });
        }
        
        // Cuello: mirar hacia la pelota
        if (this.bones.neck) {
            gsap.to(this.bones.neck.rotation, {
                y: dirMult * 0.3 * intensity,
                x: -0.2 * intensity,
                duration: 0.2,
                ease: 'power2.out'
            });
        }
    }
    
    _applyReadyPose() {
        // Pose de arquero listo: brazos ligeramente abiertos, rodillas flexionadas
        console.log('🦴 Aplicando pose de listo');
        
        if (this.bones.leftShoulder) {
            gsap.to(this.bones.leftShoulder.rotation, {
                z: 0.5, // Brazos ligeramente levantados
                x: 0.3,
                duration: 0.4,
                ease: 'power2.inOut'
            });
        }
        
        if (this.bones.rightShoulder) {
            gsap.to(this.bones.rightShoulder.rotation, {
                z: -0.5,
                x: 0.3,
                duration: 0.4,
                ease: 'power2.inOut'
            });
        }
        
        if (this.bones.leftArm) {
            gsap.to(this.bones.leftArm.rotation, {
                z: 0.3,
                duration: 0.4,
                ease: 'power2.inOut'
            });
        }
        
        if (this.bones.rightArm) {
            gsap.to(this.bones.rightArm.rotation, {
                z: -0.3,
                duration: 0.4,
                ease: 'power2.inOut'
            });
        }
        
        if (this.bones.spine) {
            gsap.to(this.bones.spine.rotation, {
                x: 0.2, // Ligera inclinación hacia adelante
                duration: 0.4,
                ease: 'power2.inOut'
            });
        }
        
        if (this.bones.leftLeg) {
            gsap.to(this.bones.leftLeg.rotation, {
                x: 0.1, // Rodillas ligeramente flexionadas
                duration: 0.4,
                ease: 'power2.inOut'
            });
        }
        
        if (this.bones.rightLeg) {
            gsap.to(this.bones.rightLeg.rotation, {
                x: 0.1,
                duration: 0.4,
                ease: 'power2.inOut'
            });
        }
    }
    
    _applyStretchPose(direction = 'right', reachHigh = false) {
        // Pose de estiramiento para alcanzar pelotas altas o a los lados
        const dirMult = direction === 'right' ? 1 : -1;
        
        console.log(`🦴 Aplicando pose de estiramiento ${direction}${reachHigh ? ' (alto)' : ''}`);
        
        if (this.bones.spine) {
            gsap.to(this.bones.spine.rotation, {
                z: dirMult * 0.4,
                x: reachHigh ? -0.2 : 0.1, // Arquear hacia atrás si es alto
                duration: 0.35,
                ease: 'power2.out'
            });
        }
        
        // Brazo del lado target: extender completamente hacia arriba
        const targetArm = direction === 'right' ? this.bones.rightArm : this.bones.leftArm;
        const targetShoulder = direction === 'right' ? this.bones.rightShoulder : this.bones.leftShoulder;
        const targetForearm = direction === 'right' ? this.bones.rightForearm : this.bones.leftForearm;
        
        if (targetShoulder) {
            gsap.to(targetShoulder.rotation, {
                z: dirMult * (reachHigh ? 1.5 : 1.0), // Brazo completamente extendido
                x: reachHigh ? 0.8 : 0.4,
                duration: 0.3,
                ease: 'power2.out'
            });
        }
        
        if (targetArm) {
            gsap.to(targetArm.rotation, {
                z: dirMult * 0.5,
                x: reachHigh ? -0.5 : -0.2,
                duration: 0.3,
                ease: 'power2.out'
            });
        }
        
        if (targetForearm) {
            gsap.to(targetForearm.rotation, {
                z: dirMult * 0.2,
                duration: 0.3,
                ease: 'power2.out'
            });
        }
        
        // Brazo opuesto: extender también pero menos
        const otherShoulder = direction === 'right' ? this.bones.leftShoulder : this.bones.rightShoulder;
        
        if (otherShoulder) {
            gsap.to(otherShoulder.rotation, {
                z: dirMult * -0.6,
                x: 0.3,
                duration: 0.3,
                ease: 'power2.out'
            });
        }
        
        // Pierna del lado target: levantar ligeramente
        const targetLeg = direction === 'right' ? this.bones.rightLeg : this.bones.leftLeg;
        
        if (targetLeg) {
            gsap.to(targetLeg.rotation, {
                x: 0.3,
                y: dirMult * 0.2,
                duration: 0.35,
                ease: 'power2.out'
            });
        }
    }

    reset() {
        console.log('🔄 Reseteando arquero...');
        
        gsap.killTweensOf(this.model.position);
        gsap.killTweensOf(this.model.rotation);
        this.model.position.copy(this.initialPos);
        this.model.rotation.set(0, 0, 0);
        this.state = 'IDLE';
        this.reactionTime = 0.2 + Math.random() * 0.15;
        
        // Resetear poses de huesos a posición inicial
        this._resetBonePoses();
        
        // Generar nuevas habilidades para variabilidad
        this.skills = {
            reflexes: 0.6 + Math.random() * 0.3,
            positioning: 0.5 + Math.random() * 0.4,
            reach: 0.7 + Math.random() * 0.2
        };
        
        console.log(`🧤 Nuevo arquero - R:${(this.skills.reflexes*100).toFixed(0)} P:${(this.skills.positioning*100).toFixed(0)} A:${(this.skills.reach*100).toFixed(0)}`);
        
        // Iniciar inmediatamente el movimiento en línea
        this.startIdleAnimation();
    }
    
    normalizeRotation() {
        // Función para asegurar que la rotación vuelva a neutral
        gsap.set(this.model.rotation, { x: 0, y: 0, z: 0 });
        
        // Si hay animaciones activas, cancelarlas
        gsap.killTweensOf(this.model.rotation);
    }
    
    startIdleAnimation() {
        // Intentar usar animación idle del modelo ElShenawy primero
        if (!this.playIdleAnimation()) {
            // Si no hay animaciones, usar movimiento por código
            this.startGoalLineMovement();
        }
    }
    
    startGoalLineMovement() {
        console.log('🥅 Iniciando movimiento en línea de arco...');
        
        // Movimiento lateral constante en la línea del arco
        const movePattern = Math.random(); // Patrón aleatorio de movimiento
        
        if (movePattern < 0.33) {
            // Patrón 1: ULTRA RÁPIDO Y EXTREMO
            this.createMovementSequence([
                { x: -3.5, duration: 0.8 },  // MÁS extremo y MÁS rápido
                { x: 0, duration: 0.5 },     // MÁS rápido
                { x: 3.5, duration: 0.8 },   // MÁS extremo y MÁS rápido
                { x: 0, duration: 0.5 },     // MÁS rápido
                { x: -1.5, duration: 0.4 },  // Movimiento extra
                { x: 1.5, duration: 0.4 }    // Movimiento extra
            ]);
        } else if (movePattern < 0.66) {
            // Patrón 2: ULTRA RÁPIDO Y EXTREMO (opuesto)
            this.createMovementSequence([
                { x: 3.5, duration: 0.8 },   // MÁS extremo y MÁS rápido
                { x: 0, duration: 0.5 },     // MÁS rápido
                { x: -3.5, duration: 0.8 },  // MÁS extremo y MÁS rápido
                { x: 0, duration: 0.5 },     // MÁS rápido
                { x: 1.5, duration: 0.4 },   // Movimiento extra
                { x: -1.5, duration: 0.4 }   // Movimiento extra
            ]);
        } else {
            // Patrón 3: MOVIMIENTO CAÓTICO SÚPER RÁPIDO
            this.createMovementSequence([
                { x: -2.5, duration: 0.4 },  // SÚPER rápido
                { x: 2.5, duration: 0.4 },   // SÚPER rápido
                { x: -3.0, duration: 0.5 },  // MÁS extremo
                { x: 3.0, duration: 0.5 },   // MÁS extremo
                { x: -1.0, duration: 0.3 },  // ULTRA rápido
                { x: 1.0, duration: 0.3 },   // ULTRA rápido
                { x: 0, duration: 0.3 }      // Centro rápido
            ]);
        }
        
        // Variaciones en Y SÚPER PRONUNCIADAS y MÁS RÁPIDAS
        gsap.to(this.model.position, {
            y: this.initialPos.y + 0.3, // SÚPER visible
            duration: 0.5 + Math.random() * 0.3, // MÁS RÁPIDO
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1
        });
        
        // Rotación corporal SÚPER VISIBLE y MÁS RÁPIDA
        gsap.to(this.model.rotation, {
            y: 0.5, // MÁS pronunciado
            duration: 1.5, // MÁS RÁPIDO
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }
    
    createMovementSequence(positions) {
        const timeline = gsap.timeline({ repeat: -1 });
        
        positions.forEach((pos, index) => {
            timeline.to(this.model.position, {
                x: this.initialPos.x + pos.x,
                duration: pos.duration,
                ease: this.state === 'AIMING_ACTIVE' ? 'sine.inOut' : (index % 2 === 0 ? 'power1.inOut' : 'power2.inOut')
            });
            
            // Durante apuntado: pausas más cortas y predecibles
            if (this.state === 'AIMING_ACTIVE') {
                timeline.to({}, { duration: 0.3 }); // Pausa fija
            } else {
                // Comportamiento normal: pausas aleatorias
                if (Math.random() < 0.3) {
                    timeline.to({}, { duration: 0.2 + Math.random() * 0.3 });
                }
            }
        });
        
        const movementType = this.state === 'AIMING_ACTIVE' ? 'LENTO (apuntado)' : 'NORMAL (pre-penal)';
        console.log(`🎯 Secuencia ${movementType} de ${positions.length} movimientos creada`);
    }

    /**
     * @param {THREE.Vector3} targetPoint - Punto donde se predice que llegará la pelota
     */
    reactToShot(targetPoint) {
        this.state = 'REACTING';
        
        // AHORA SÍ DETENER el movimiento - solo cuando se patee
        this.stopGoalLineMovement();
        
        console.log(`🥅 ¡PENAL PATEADO! Arquero reaccionando desde posición: ${this.model.position.x.toFixed(2)}`);
        console.log(`🛑 Movimiento en línea detenido - Habilidades: R${(this.skills.reflexes*100).toFixed(0)} P${(this.skills.positioning*100).toFixed(0)} A${(this.skills.reach*100).toFixed(0)}`);
        
        // Intentar animación de reacción primero
        if (!this.playReactionAnimation()) {
            // Si no hay animaciones, usar movimiento por código
            this.showTension();
        }
        
        // Luego decidir la acción según habilidades
        setTimeout(() => this.makeRealisticDecision(targetPoint), this.reactionTime * 1000);
    }
    
    // Nuevo método: continuar movimiento durante el apuntado
    continueDuringAiming() {
        if (this.state === 'IDLE') {
            console.log('🎯 Continuando movimiento durante apuntado...');
            // El movimiento ya está activo, no hacer nada extra
            // Solo cambiar el estado para tracking
            this.state = 'AIMING_ACTIVE';
        }
    }
    
    // Nuevo método: transición suave cuando se empieza a apuntar
    onAimingStart() {
        console.log('🎯 Jugador empezó a apuntar - Cambiando a movimiento de apuntado');
        this.state = 'AIMING_ACTIVE';
        
        // Cambiar a un patrón de movimiento más lento y predecible durante el apuntado
        this.startAimingMovement();
    }
    
    startAimingMovement() {
        // Detener el movimiento rápido anterior
        gsap.killTweensOf(this.model.position);
        gsap.killTweensOf(this.model.rotation);
        
        console.log('🚀 MOVIMIENTO EXTREMO Y RÁPIDO durante apuntado - MÁS RANGO!');
        
        // Movimiento SÚPER EXTREMO y MÁS RÁPIDO
        const ultraExtremeSequence = [
            { x: -4.5, duration: 1.5 },   // EXTREMO EXTREMO IZQUIERDO (más rápido)
            { x: -2.0, duration: 0.8 },   // Paso intermedio (más rápido)
            { x: 0, duration: 0.6 },      // Centro (más rápido)
            { x: 2.0, duration: 0.8 },    // Paso intermedio (más rápido)
            { x: 4.5, duration: 1.5 },    // EXTREMO EXTREMO DERECHO (más rápido)
            { x: 2.5, duration: 0.8 },    // Vuelta intermedia (más rápido)
            { x: 0, duration: 0.6 },      // Centro otra vez (más rápido)
            { x: -2.5, duration: 0.8 },   // Preparar siguiente ciclo (más rápido)
            { x: -1.0, duration: 0.6 },   // Extra movimiento
            { x: 1.0, duration: 0.6 },    // Extra movimiento
            { x: 3.0, duration: 1.0 },    // Extra extremo
            { x: -3.0, duration: 1.0 }    // Extra extremo
        ];
        
        this.createMovementSequence(ultraExtremeSequence);
        
        // Movimiento vertical MÁS RÁPIDO y MÁS PRONUNCIADO
        gsap.to(this.model.position, {
            y: this.initialPos.y + 0.25, // AÚN más visible
            duration: 1.0, // MÁS RÁPIDO
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1
        });
        
        // Rotación corporal MÁS RÁPIDA y MÁS VISIBLE
        gsap.to(this.model.rotation, {
            y: 0.4, // MÁS pronunciado
            duration: 2.0, // MÁS RÁPIDO
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1
        });
        
        console.log('🎯 Rango de movimiento: -4.5 a +4.5 unidades (ULTRA EXTREMO)');
        console.log('⚡ Velocidad aumentada: 0.6-1.5s por movimiento');
    }
    
    stopGoalLineMovement() {
        // Detener TODAS las animaciones de movimiento previas
        gsap.killTweensOf(this.model.position);
        gsap.killTweensOf(this.model.rotation);
        
        // Detener animaciones del modelo si existen
        this.stopAnimation();
        
        console.log('🚫 Movimiento en línea de arco detenido');
        
        // Pequeña pausa de "congelamiento" realista (0.1s)
        gsap.set(this.model.position, {
            x: this.model.position.x, // Mantener posición actual
            y: this.initialPos.y,     // Volver a altura normal
            z: this.initialPos.z      // Mantener profundidad
        });
        
        gsap.set(this.model.rotation, {
            x: 0,
            y: 0, 
            z: 0  // Resetear rotación para evitar la "T"
        });
    }
    
    showTension() {
        // Reacción de tensión más orgánica
        const tensionTimeline = gsap.timeline();
        
        // Momento de shock - congelarse brevemente
        tensionTimeline.to(this.model.position, {
            y: this.initialPos.y + 0.02,
            duration: 0.05,
            ease: 'power2.out'
        });
        
        // Reacción corporal - agacharse y prepararse
        tensionTimeline.to(this.model.position, {
            y: this.initialPos.y - 0.08,
            duration: 0.15,
            ease: 'back.out(1.7)'
        });
        
        // Tensión muscular (rotaciones sutiles)
        tensionTimeline.to(this.model.rotation, {
            x: -0.08,
            z: (Math.random() - 0.5) * 0.05, // Variación aleatoria
            duration: 0.1,
            ease: 'power2.out'
        }, 0.05);
        
        // Micro-temblor de nervios
        tensionTimeline.to(this.model.position, {
            x: this.initialPos.x + (Math.random() - 0.5) * 0.02,
            duration: 0.05,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: 3
        }, 0.1);
    }
    
    makeRealisticDecision(targetPoint) {
        if (!targetPoint) {
            this.stayReady();
            return;
        }
        
        const distanceFromCenter = Math.abs(targetPoint.x);
        const shotHeight = targetPoint.y;
        const shotSpeed = Math.sqrt(targetPoint.x * targetPoint.x + targetPoint.y * targetPoint.y);
        
        // Factores humanos realistas
        const canReach = distanceFromCenter <= (this.skills.reach * 2.5);
        const hasTime = shotSpeed < (3.0 + this.skills.reflexes * 2.0);
        const rightPosition = this.skills.positioning > 0.6;
        
        console.log(`🧠 Evaluando: Dist=${distanceFromCenter.toFixed(1)} Alt=${shotHeight.toFixed(1)} Alcance=${canReach} Tiempo=${hasTime}`);
        
        // Decisiones más humanas con intentos de usar animaciones
        if (distanceFromCenter < 0.8 && shotHeight < 1.0) {
            // Tiro muy central - quedarse firme
            this.stayReady();
            console.log('💪 Decisión: Quedarse firme');
            
        } else if (distanceFromCenter < 1.5 && hasTime && rightPosition) {
            // Tiro alcanzable - paso lateral
            this.takeSmartStep(targetPoint);
            console.log('👟 Decisión: Paso lateral');
            
        } else if (canReach && hasTime && this.skills.reflexes > 0.7) {
            // Arquero hábil con tiempo - zambullida
            this.diveSmart(targetPoint);
            console.log('🤸‍♂️ Decisión: Zambullida');
            
        } else if (Math.random() < 0.3) {
            // 30% de probabilidad de intentar lo imposible (corazón)
            this.desperateAttempt(targetPoint);
            console.log('💔 Decisión: Intento desesperado');
            
        } else {
            // Resignarse - no puede hacer nada
            this.watchItGo(targetPoint);
            console.log('😔 Decisión: Solo mirar');
        }
        
        // IMPORTANTE: Programar recuperación automática después de cualquier acción
        this.scheduleRecovery();
    }
    
    scheduleRecovery() {
        // Después de 2-3 segundos, volver automáticamente a posición neutral
        setTimeout(() => {
            if (this.state !== 'IDLE') {
                console.log('🔄 Recuperando posición neutral...');
                this.returnToNeutral();
            }
        }, 2000 + Math.random() * 1000);
    }
    
    returnToNeutral() {
        this.state = 'RECOVERING';
        gsap.killTweensOf(this.model.position);
        gsap.killTweensOf(this.model.rotation);
        
        // Detener cualquier animación activa
        this.stopAnimation();
        
        // Resetear poses de huesos gradualmente
        for (const [key, bone] of Object.entries(this.bones)) {
            if (this.initialBoneRotations[key]) {
                const initial = this.initialBoneRotations[key];
                gsap.to(bone.rotation, {
                    x: initial.x,
                    y: initial.y,
                    z: initial.z,
                    duration: 1.0,
                    ease: 'power2.inOut'
                });
            }
        }
        
        // Animación suave de vuelta a la posición inicial
        gsap.to(this.model.position, {
            x: this.initialPos.x,
            y: this.initialPos.y,
            z: this.initialPos.z,
            duration: 1.0,
            ease: 'power2.inOut',
            onComplete: () => {
                // Cuando termine la recuperación, volver a idle
                this.state = 'IDLE';
                this.startIdleAnimation();
            }
        });
        
        // CLAVE: Resetear TODAS las rotaciones gradualmente
        gsap.to(this.model.rotation, {
            x: 0,
            y: 0,
            z: 0,
            duration: 1.0,
            ease: 'power2.inOut'
        });
    }
    
    stayReady() {
        this.state = 'READY';
        console.log('💪 Arquero se queda en posición - Aplicando pose de listo');
        
        // Intentar animación primero
        const hasAnimation = this.playAnimation('ready') || this.playAnimation('idle');
        
        if (!hasAnimation) {
            // Si no hay animaciones, usar movimiento por código CON poses de huesos
            gsap.to(this.model.position, {
                y: this.initialPos.y - 0.1, // Agacharse ligeramente
                duration: 0.3,
                ease: 'power2.out'
            });
            
            // Aplicar pose de arquero listo
            this._applyReadyPose();
        }
        
        // Mantener rotación neutral
        gsap.set(this.model.rotation, { x: 0, y: 0, z: 0 });
    }
    
    takeSmartStep(targetPoint) {
        this.state = 'STEPPING';
        const direction = targetPoint.x > 0 ? 'right' : 'left';
        const stepSize = Math.min(1.0, Math.abs(targetPoint.x) * 0.7) * this.skills.positioning;
        const directionMultiplier = targetPoint.x > 0 ? 1 : -1;
        
        console.log(`👟 Paso lateral hacia ${direction} - Distancia: ${stepSize.toFixed(2)}`);
        
        // Intentar animación de paso lateral primero
        const hasAnimation = this.playAnimation(`step_${direction}`) || this.playAnimation('step');
        
        if (!hasAnimation) {
            // Si no hay animaciones, usar movimiento por código CON poses de huesos
            gsap.to(this.model.position, {
                x: this.model.position.x + stepSize * directionMultiplier,
                y: this.initialPos.y - 0.05,
                duration: 0.3,
                ease: 'power2.out'
            });
            
            // Aplicar pose de estiramiento moderado
            const reachHigh = targetPoint.y > 1.2;
            this._applyStretchPose(direction, reachHigh);
        }
        
        // Mantener rotación del modelo neutral
        gsap.set(this.model.rotation, { x: 0, y: 0, z: 0 });
    }
    
    diveSmart(targetPoint) {
        this.state = 'DIVING';
        const reachFactor = this.skills.reach;
        const direction = targetPoint.x > 0 ? 'right' : 'left';
        const directionMultiplier = targetPoint.x > 0 ? 1 : -1;
        
        const diveX = Math.min(this.goalLimits.maxX, Math.abs(targetPoint.x) * reachFactor) * directionMultiplier;
        const diveY = Math.min(this.goalLimits.maxY, Math.max(0.2, targetPoint.y * 0.8));
        
        console.log(`🤸‍♂️ Zambullida hacia ${direction} - X:${diveX.toFixed(2)} Y:${diveY.toFixed(2)}`);
        
        // Intentar animación de zambullida primero
        const hasAnimation = this.playDiveAnimation(direction) || this.playAnimation('dive');
        
        if (!hasAnimation) {
            // Si no hay animaciones, usar movimiento por código CON poses de huesos
            gsap.to(this.model.position, {
                x: this.model.position.x + diveX,
                y: diveY,
                duration: 0.4,
                ease: 'power2.out'
            });
            
            // Aplicar pose de zambullida realista con huesos
            const intensity = Math.min(1.0, Math.abs(targetPoint.x) * 0.8);
            this._applyDivePose(direction, intensity);
        }
        
        // Mantener rotación del modelo neutral (los huesos hacen el trabajo)
        gsap.set(this.model.rotation, { x: 0, y: 0, z: 0 });
    }
    
    desperateAttempt(targetPoint) {
        this.state = 'DESPERATE';
        const direction = targetPoint.x > 0 ? 'right' : 'left';
        const directionMultiplier = targetPoint.x > 0 ? 1 : -1;
        
        console.log(`💔 Intento desesperado hacia ${direction}`);
        
        // Intentar animación desesperada primero
        const hasAnimation = this.playAnimation('desperate') || this.playDiveAnimation(direction);
        
        if (!hasAnimation) {
            // Si no hay animaciones, usar movimiento por código CON poses de huesos
            gsap.to(this.model.position, {
                x: this.model.position.x + directionMultiplier * 1.5,
                y: this.initialPos.y + 0.3,
                duration: 0.5,
                ease: 'power2.out'
            });
            
            // Aplicar pose de zambullida extrema (intensidad máxima)
            this._applyDivePose(direction, 1.2); // Intensidad > 1.0 para movimiento exagerado
        }
        
        // Mantener rotación del modelo neutral
        gsap.set(this.model.rotation, { x: 0, y: 0, z: 0 });
    }
    
    watchItGo(targetPoint) {
        this.state = 'WATCHING';
        const direction = targetPoint.x > 0 ? 'right' : 'left';
        const directionMultiplier = targetPoint.x > 0 ? 1 : -1;
        
        console.log(`👀 Solo mirando hacia ${direction}`);
        
        // Intentar animación de observación primero
        if (!this.playAnimation('watch') && !this.playAnimation('disappointed')) {
            // Si no hay animaciones, usar movimiento por código
            gsap.to(this.model.position, {
                x: this.model.position.x + directionMultiplier * 0.3,
                y: this.initialPos.y - 0.05, // Ligero agachamiento
                duration: 0.4,
                ease: 'sine.out'
            });
        }
        
        // SIN rotaciones - mantener neutral
        gsap.set(this.model.rotation, { x: 0, y: 0, z: 0 });
    }
    
    checkSave(ballPosition) {
        // Solo puede atajar si está en una acción activa
        if (this.state === 'IDLE' || this.state === 'WATCHING') return false;
        
        const keeperPos = this.model.position;
        const distance = new THREE.Vector3(
            ballPosition.x - keeperPos.x,
            ballPosition.y - keeperPos.y,
            0 // Ignorar profundidad para cálculo más realista
        ).length();
        
        // Cálculo de atajada basado en habilidades reales
        let saveChance = 0;
        
        // Radio efectivo basado en el estado y habilidades
        let effectiveReach;
        switch(this.state) {
            case 'READY':
                effectiveReach = 0.8 * this.skills.reach;
                saveChance = 0.7; // Alta probabilidad para tiros centrales
                break;
            case 'STEPPING':
                effectiveReach = 1.3 * this.skills.reach;
                saveChance = 0.5 * this.skills.positioning;
                break;
            case 'DIVING':
                effectiveReach = 1.8 * this.skills.reach;
                saveChance = 0.4 * this.skills.reflexes;
                break;
            case 'DESPERATE':
                effectiveReach = 2.0 * this.skills.reach;
                saveChance = 0.15; // Baja probabilidad en intentos desesperados
                break;
            default:
                effectiveReach = 1.0;
                saveChance = 0.3;
        }
        
        // Solo puede atajar si está dentro del alcance
        if (distance > effectiveReach) {
            return false;
        }
        
        // Modificadores realistas
        if (ballPosition.y > 1.8) saveChance *= 0.7; // Más difícil arriba
        if (ballPosition.y < 0.5) saveChance *= 1.2; // Más fácil abajo
        if (Math.abs(ballPosition.x) > 1.5) saveChance *= 0.8; // Más difícil en extremos
        
        // Factor de suerte/concentración
        const concentration = 0.8 + Math.random() * 0.4; // 0.8-1.2
        saveChance *= concentration;
        
        // Limitar probabilidad
        saveChance = Math.max(0, Math.min(0.85, saveChance));
        
        const isSaved = Math.random() < saveChance;
        
        console.log(`🥅 ${isSaved ? 'ATAJADA' : 'GOL'} - Dist: ${distance.toFixed(1)}m, Estado: ${this.state}, Prob: ${(saveChance*100).toFixed(0)}%`);
        
        return isSaved;
    }
}