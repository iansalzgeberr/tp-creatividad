import * as THREE from 'three';
import gsap from 'gsap';

export default class Stadium {
    constructor(scene) {
        this.scene = scene;
        this.crowd = [];
        this.flags = [];
        this.lights = [];
        this.createStadium();
    }

    createStadium() {
        console.log('🏟️ Construyendo estadio...');
        
        // Inicializar todos los materiales compartidos primero
        this.initializeSharedMaterials();
        
        // Crear las gradas
        this.createStands();
        
        // Crear la multitud
        this.createCrowd();
        
        // Crear banderas y decoración
        this.createFlags();
        
        // Crear iluminación del estadio
        this.createStadiumLights();
        
        // Crear iluminación adicional para las gradas
        this.createStandLighting();
        
        // Crear el campo con líneas
        this.createField();
        
        // Crear elementos adicionales
        this.createExtraElements();
        
        console.log('✅ Estadio construido completamente');
    }

    initializeSharedMaterials() {
        console.log('🎨 Inicializando materiales compartidos...');
        
        // Materiales básicos para personas
        if (!Stadium.sharedMaterials) {
            Stadium.sharedMaterials = {
                skin: new THREE.MeshLambertMaterial({ color: 0xffdbac }),
                pants: new THREE.MeshLambertMaterial({ color: 0x1a1a1a }),
                hair: new THREE.MeshLambertMaterial({ color: 0x2d1810 }),
                hat: new THREE.MeshLambertMaterial({ color: 0x333333 })
            };
        }
        
        // Materiales de equipos
        if (!Stadium.teamMaterials) {
            Stadium.teamMaterials = {
                argentina: [
                    new THREE.MeshLambertMaterial({ color: 0x87CEEB }), // Celeste clásico
                    new THREE.MeshLambertMaterial({ color: 0x6FB7D3 }), // Celeste claro
                    new THREE.MeshLambertMaterial({ color: 0xFFFFFF }), // Blanco
                ],
                france: [
                    new THREE.MeshLambertMaterial({ color: 0x002395 }), // Azul Francia
                    new THREE.MeshLambertMaterial({ color: 0xFF0000 }), // Rojo Francia
                    new THREE.MeshLambertMaterial({ color: 0xFFFFFF }), // Blanco Francia
                ]
            };
        }
        
        // Materiales de gradas
        if (!Stadium.standMaterials) {
            Stadium.standMaterials = {
                base: new THREE.MeshLambertMaterial({ color: 0x666666 }),
                mainSeat: new THREE.MeshLambertMaterial({ color: 0x1f4e79 }),
                sideSeat: new THREE.MeshLambertMaterial({ color: 0x2d5aa0 }),
                structure: new THREE.MeshLambertMaterial({ color: 0x555555 })
            };
        }
        
        // Otros materiales compartidos
        if (!Stadium.railingMaterial) {
            Stadium.railingMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        }
        
        if (!Stadium.screenMaterials) {
            Stadium.screenMaterials = {
                support: new THREE.MeshLambertMaterial({ color: 0x333333 }),
                frame: new THREE.MeshLambertMaterial({ color: 0x111111 }),
                screen: new THREE.MeshBasicMaterial({ 
                    color: 0x001122,
                    emissive: 0x002244,
                    emissiveIntensity: 0.3
                })
            };
        }
        
        if (!Stadium.tunnelMaterials) {
            Stadium.tunnelMaterials = {
                tunnel: new THREE.MeshLambertMaterial({ color: 0x444444 }),
                entrance: new THREE.MeshLambertMaterial({ color: 0x222222 }),
                sign: new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
            };
        }
        
        if (!Stadium.adMaterials) {
            Stadium.adMaterials = {
                support: new THREE.MeshLambertMaterial({ color: 0x666666 }),
                boards: [
                    new THREE.MeshBasicMaterial({ color: 0xFF0000 }), // Rojo
                    new THREE.MeshBasicMaterial({ color: 0x0066FF }), // Azul
                    new THREE.MeshBasicMaterial({ color: 0x00AA00 }), // Verde
                    new THREE.MeshBasicMaterial({ color: 0xFF6600 }), // Naranja
                    new THREE.MeshBasicMaterial({ color: 0x9900CC })  // Morado
                ]
            };
        }
        
        if (!Stadium.towerMaterials) {
            Stadium.towerMaterials = {
                base: new THREE.MeshLambertMaterial({ color: 0x444444 }),
                tower: new THREE.MeshLambertMaterial({ color: 0x555555 }),
                platform: new THREE.MeshLambertMaterial({ color: 0x666666 }),
                spot: new THREE.MeshBasicMaterial({ color: 0x888888 }),
                halo: new THREE.MeshBasicMaterial({ 
                    color: 0xffffdd,
                    emissive: 0xffffdd,
                    emissiveIntensity: 0.7
                })
            };
        }
        
        if (!Stadium.confettiMaterials) {
            const confettiGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.02);
            Stadium.confettiMaterials = {
                geometry: confettiGeometry,
                materials: [
                    new THREE.MeshBasicMaterial({ color: 0x87CEEB }),
                    new THREE.MeshBasicMaterial({ color: 0x0055AA }),
                    new THREE.MeshBasicMaterial({ color: 0xFFD700 }),
                    new THREE.MeshBasicMaterial({ color: 0xFF0000 }),
                    new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
                ]
            };
        }
        
        console.log('✅ Materiales compartidos inicializados');
    }

    createStands() {
        console.log('🏗️ Creando gradas realistas...');
        
        // Crear gradería principal detrás del arco (más alta y realista)
        this.createRealisticStand(0, 0, -28, 35, 12, 8, 'main');
        
        // Gradas laterales (más bajas)
        this.createRealisticStand(-25, 0, -5, 8, 8, 40, 'side');
        this.createRealisticStand(25, 0, -5, 8, 8, 40, 'side');
        
        // Gradería detrás del jugador (más pequeña)
        this.createRealisticStand(0, 0, 22, 30, 6, 6, 'back');
        
        console.log('✅ Gradas realistas creadas');
    }

    createRealisticStand(x, y, z, width, height, depth, type) {
        const standGroup = new THREE.Group();
        
        // Reutilizar materiales de gradas
        if (!Stadium.standMaterials) {
            Stadium.standMaterials = {
                base: new THREE.MeshLambertMaterial({ color: 0x666666 }),
                mainSeat: new THREE.MeshLambertMaterial({ color: 0x1f4e79 }),
                sideSeat: new THREE.MeshLambertMaterial({ color: 0x2d5aa0 }),
                structure: new THREE.MeshLambertMaterial({ color: 0x555555 })
            };
        }
        
        // Estructura base de concreto
        const baseGeometry = new THREE.BoxGeometry(width, 1, depth);
        const base = new THREE.Mesh(baseGeometry, Stadium.standMaterials.base);
        base.position.y = 0.5;
        standGroup.add(base);
        
        // Simplificar asientos - menos filas y asientos más grandes
        const rows = Math.floor(height / 2.4); // Menos filas para mejor rendimiento
        const seatWidth = 0.8; // Asientos más grandes
        const seatDepth = 0.8;
        const seatHeight = 0.6;
        const rowSpacing = 2.4;
        
        const seatMaterial = type === 'main' ? Stadium.standMaterials.mainSeat : Stadium.standMaterials.sideSeat;
        
        for (let row = 0; row < rows; row++) {
            const rowY = 1 + row * rowSpacing;
            const rowZ = (row * 1.6) - (depth / 2) + 1;
            
            // Menos asientos por fila para mejor rendimiento
            const seatsInRow = Math.floor(width / (seatWidth + 0.2));
            
            // Crear una fila como un bloque para mejor rendimiento
            const rowSeatsGeometry = new THREE.BoxGeometry(width * 0.9, seatHeight * 0.4, seatDepth);
            const rowSeats = new THREE.Mesh(rowSeatsGeometry, seatMaterial);
            rowSeats.position.set(0, rowY, rowZ);
            standGroup.add(rowSeats);
            
            // Respaldos como un bloque
            const rowBackrestGeometry = new THREE.BoxGeometry(width * 0.9, seatHeight * 0.6, 0.1);
            const rowBackrest = new THREE.Mesh(rowBackrestGeometry, seatMaterial);
            rowBackrest.position.set(0, rowY + seatHeight * 0.2, rowZ - seatDepth/2);
            standGroup.add(rowBackrest);
            
            // Estructura de la fila simplificada
            const rowStructure = new THREE.BoxGeometry(width, 0.3, 1.5);
            const rowMesh = new THREE.Mesh(rowStructure, Stadium.standMaterials.structure);
            rowMesh.position.set(0, rowY - 0.4, rowZ);
            standGroup.add(rowMesh);
        }
        
        // Barandas simplificadas
        this.addSimplifiedRailings(standGroup, width, height, depth, rows);
        
        standGroup.position.set(x, y, z);
        this.scene.add(standGroup);
    }

    addSimplifiedRailings(standGroup, width, height, depth, rows) {
        if (!Stadium.railingMaterial) {
            Stadium.railingMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        }
        
        // Barandas frontales simplificadas - solo una por gradería
        const railingGeometry = new THREE.BoxGeometry(width, 0.1, 0.1);
        const railing = new THREE.Mesh(railingGeometry, Stadium.railingMaterial);
        railing.position.set(0, height * 0.7, -depth/2 + 1);
        standGroup.add(railing);
        
        // Solo 2 postes principales para mejor rendimiento
        const postPositions = [-width/4, width/4];
        postPositions.forEach(postX => {
            const postGeometry = new THREE.BoxGeometry(0.1, height * 0.8, 0.1);
            const post = new THREE.Mesh(postGeometry, Stadium.railingMaterial);
            post.position.set(postX, height/2 + 1, -depth/2);
            standGroup.add(post);
        });
    }

    createCrowd() {
        console.log('👥 Creando multitud realista...');
        
        // Crear personas más realistas en las gradas existentes
        this.createRealisticCrowdInStand(0, 1, -28, 35, 12, 8, 'main');
        this.createRealisticCrowdInStand(-25, 1, -5, 8, 8, 40, 'side');
        this.createRealisticCrowdInStand(25, 1, -5, 8, 8, 40, 'side');
        this.createRealisticCrowdInStand(0, 1, 22, 30, 6, 6, 'back');
        
        console.log(`✅ ${this.crowd.length} personas realistas creadas en las gradas`);
        
        // Animación de la multitud
        this.animateCrowd();
    }

    createRealisticCrowdInStand(x, y, z, width, height, depth, standType) {
        const crowdGroup = new THREE.Group();
        
        // Asegurar que todos los materiales estén inicializados
        this.initializeSharedMaterials();
        
        const argentinaMaterials = Stadium.teamMaterials.argentina;
        const franceMaterials = Stadium.teamMaterials.france;
        
        // Reducir densidad de multitud para mejor rendimiento
        const rows = Math.floor(height / 2.4); // Menos filas
        const rowSpacing = 2.4;
        
        for (let row = 0; row < rows; row++) {
            const rowY = y + row * rowSpacing;
            const rowZ = z + (row * 1.6) - (depth / 2) + 1;
            
            const peopleInRow = Math.floor(width / 1.0); // Menos personas por fila
            
            for (let person = 0; person < peopleInRow; person++) {
                if (Math.random() < 0.6) { // 60% ocupación para mejor rendimiento
                    const personX = x + (person - peopleInRow/2) * 1.0 + (Math.random() - 0.5) * 0.4;
                    
                    // Crear persona simplificada para mejor rendimiento
                    const personGroup = this.createSimplifiedPerson();
                    
                    // Asignar equipo según la posición
                    const isArgentinaSide = standType === 'main' ? personX < 0 : Math.random() < 0.5;
                    const materials = isArgentinaSide ? argentinaMaterials : franceMaterials;
                    const chosenMaterial = materials[Math.floor(Math.random() * materials.length)];
                    
                    // Aplicar material a la camiseta
                    if (personGroup.children[0]) { // Cuerpo principal
                        personGroup.children[0].material = chosenMaterial;
                    }
                    
                    personGroup.position.set(
                        personX,
                        rowY + 0.6,
                        rowZ + (Math.random() - 0.5) * 0.6
                    );
                    
                    // Rotación aleatoria para más naturalidad
                    personGroup.rotation.y = (Math.random() - 0.5) * 0.8;
                    
                    crowdGroup.add(personGroup);
                    this.crowd.push(personGroup);
                }
            }
        }
        
        this.scene.add(crowdGroup);
    }

    createRealisticPerson() {
        const personGroup = new THREE.Group();
        
        // Los materiales ya están inicializados en initializeSharedMaterials()
        const skinMaterial = Stadium.sharedMaterials.skin;
        const pantsMaterial = Stadium.sharedMaterials.pants;
        const hairMaterial = Stadium.sharedMaterials.hair;
        
        // Cabeza
        const headGeometry = new THREE.SphereGeometry(0.12, 8, 6);
        const head = new THREE.Mesh(headGeometry, skinMaterial);
        head.position.y = 0.75;
        personGroup.add(head);
        
        // Torso (camiseta del equipo - se asignará después)
        const torsoGeometry = new THREE.CylinderGeometry(0.15, 0.18, 0.4, 8);
        const torso = new THREE.Mesh(torsoGeometry, new THREE.MeshLambertMaterial({ color: 0x87CEEB }));
        torso.position.y = 0.4;
        personGroup.add(torso);
        
        // Brazos
        const armGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 6);
        
        const leftArm = new THREE.Mesh(armGeometry, skinMaterial);
        leftArm.position.set(-0.2, 0.45, 0);
        leftArm.rotation.z = Math.PI / 6 + (Math.random() - 0.5) * 0.5;
        personGroup.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, skinMaterial);
        rightArm.position.set(0.2, 0.45, 0);
        rightArm.rotation.z = -Math.PI / 6 + (Math.random() - 0.5) * 0.5;
        personGroup.add(rightArm);
        
        // Piernas
        const legGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 6);
        
        const leftLeg = new THREE.Mesh(legGeometry, pantsMaterial);
        leftLeg.position.set(-0.08, 0.05, 0);
        personGroup.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, pantsMaterial);
        rightLeg.position.set(0.08, 0.05, 0);
        personGroup.add(rightLeg);
        
        // Pelo (aleatorio)
        if (Math.random() < 0.8) {
            const hairGeometry = new THREE.SphereGeometry(0.13, 8, 6);
            const hair = new THREE.Mesh(hairGeometry, hairMaterial);
            hair.position.y = 0.78;
            hair.scale.y = 0.6;
            personGroup.add(hair);
        }
        
        // Accesorios aleatorios (sombreros, banderas pequeñas, etc.)
        if (Math.random() < 0.3) {
            const hatGeometry = new THREE.CylinderGeometry(0.14, 0.14, 0.05, 8);
            const hat = new THREE.Mesh(hatGeometry, Stadium.sharedMaterials.hat);
            hat.position.y = 0.85;
            personGroup.add(hat);
        }
        
        return personGroup;
    }

    createSimplifiedPerson() {
        const personGroup = new THREE.Group();
        
        // Los materiales ya están inicializados en initializeSharedMaterials()
        // Persona muy simplificada para mejor rendimiento
        // Solo un cilindro para el cuerpo y una esfera para la cabeza
        
        // Cuerpo (camiseta del equipo - se asignará después)
        const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.18, 0.8, 6); // Menos segmentos
        const body = new THREE.Mesh(bodyGeometry, Stadium.sharedMaterials.skin);
        body.position.y = 0.4;
        personGroup.add(body);
        
        // Cabeza simplificada
        const headGeometry = new THREE.SphereGeometry(0.12, 6, 4); // Menos segmentos
        const head = new THREE.Mesh(headGeometry, Stadium.sharedMaterials.skin);
        head.position.y = 0.9;
        personGroup.add(head);
        
        return personGroup;
    }

    createCrowdSection(centerX, centerY, centerZ, width, depth, materials) {
        const crowdGroup = new THREE.Group();
        const personGeometry = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8);
        
        // Densidad de personas
        const spacing = 1.2;
        const rowsX = Math.floor(width / spacing);
        const rowsZ = Math.floor(depth / spacing);
        
        for (let x = 0; x < rowsX; x++) {
            for (let z = 0; z < rowsZ; z++) {
                // Añadir algo de aleatoriedad para que no se vea tan perfecto
                if (Math.random() < 0.85) { // 85% probabilidad de que haya una persona
                    const material = materials[Math.floor(Math.random() * materials.length)];
                    const person = new THREE.Mesh(personGeometry, material);
                    
                    person.position.set(
                        centerX + (x - rowsX/2) * spacing + (Math.random() - 0.5) * 0.3,
                        centerY + Math.random() * 0.5,
                        centerZ + (z - rowsZ/2) * spacing + (Math.random() - 0.5) * 0.3
                    );
                    
                    // Rotación aleatoria para más realismo
                    person.rotation.y = (Math.random() - 0.5) * 0.5;
                    
                    crowdGroup.add(person);
                    this.crowd.push(person);
                }
            }
        }
        
        this.scene.add(crowdGroup);
    }

    animateCrowd() {
        console.log('🎊 Animando multitud...');
        
        this.crowd.forEach((person, index) => {
            // Animación de salto aleatorio
            gsap.to(person.position, {
                y: person.position.y + 0.2 + Math.random() * 0.3,
                duration: 0.5 + Math.random() * 0.5,
                ease: 'power2.out',
                yoyo: true,
                repeat: -1,
                delay: Math.random() * 2,
                repeatDelay: 1 + Math.random() * 3
            });
            
            // Movimiento lateral sutil
            gsap.to(person.position, {
                x: person.position.x + (Math.random() - 0.5) * 0.2,
                duration: 2 + Math.random() * 2,
                ease: 'sine.inOut',
                yoyo: true,
                repeat: -1,
                delay: Math.random() * 4
            });
        });
    }

    createFlags() {
        console.log('🏳️ Creando banderas de Argentina y Francia...');
        
        // Banderas argentinas (lado izquierdo)
        this.createArgentinaFlag(-15, 15, -25);
        this.createArgentinaFlag(-8, 13, -25);
        this.createArgentinaFlag(-22, 10, -10);
        this.createArgentinaFlag(-12, 8, 20);
        
        // Banderas francesas (lado derecho)
        this.createFranceFlag(15, 15, -25);
        this.createFranceFlag(8, 13, -25);
        this.createFranceFlag(22, 10, -10);
        this.createFranceFlag(12, 8, 20);
        
        // Banderas gigantes en la gradería principal
        this.createGiantArgentinaFlag(-20, 18, -30);
        this.createGiantFranceFlag(20, 18, -30);
        
        console.log('✅ Banderas de Argentina y Francia creadas');
    }

    createArgentinaFlag(x, y, z) {
        const flagGroup = new THREE.Group();
        
        // Mástil
        const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 4);
        const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = 2;
        flagGroup.add(pole);
        
        // Bandera argentina (3 franjas)
        const flagWidth = 2.5;
        const flagHeight = 1.5;
        
        // Franja celeste superior
        const topStripe = new THREE.PlaneGeometry(flagWidth, flagHeight / 3);
        const celesteMaterial = new THREE.MeshLambertMaterial({ color: 0x87CEEB, side: THREE.DoubleSide });
        const topFlag = new THREE.Mesh(topStripe, celesteMaterial);
        topFlag.position.set(flagWidth/2, 3.5, 0);
        flagGroup.add(topFlag);
        
        // Franja blanca central
        const middleStripe = new THREE.PlaneGeometry(flagWidth, flagHeight / 3);
        const whiteMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
        const middleFlag = new THREE.Mesh(middleStripe, whiteMaterial);
        middleFlag.position.set(flagWidth/2, 3.2, 0);
        flagGroup.add(middleFlag);
        
        // Sol de Mayo (círculo amarillo en el centro)
        const sunGeometry = new THREE.CircleGeometry(0.15, 16);
        const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xFFD700, side: THREE.DoubleSide });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.position.set(flagWidth/2, 3.2, 0.01);
        flagGroup.add(sun);
        
        // Franja celeste inferior
        const bottomStripe = new THREE.PlaneGeometry(flagWidth, flagHeight / 3);
        const bottomFlag = new THREE.Mesh(bottomStripe, celesteMaterial);
        bottomFlag.position.set(flagWidth/2, 2.9, 0);
        flagGroup.add(bottomFlag);
        
        flagGroup.position.set(x, y, z);
        this.scene.add(flagGroup);
        this.flags.push(flagGroup);
        
        // Animación de ondeo
        [topFlag, middleFlag, bottomFlag].forEach((flag, index) => {
            gsap.to(flag.rotation, {
                z: 0.1 + Math.random() * 0.05,
                duration: 1.5 + Math.random() * 0.5,
                ease: 'sine.inOut',
                yoyo: true,
                repeat: -1,
                delay: index * 0.1
            });
        });
    }

    createFranceFlag(x, y, z) {
        const flagGroup = new THREE.Group();
        
        // Mástil
        const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 4);
        const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = 2;
        flagGroup.add(pole);
        
        // Bandera francesa (3 franjas verticales)
        const flagWidth = 2.5;
        const flagHeight = 1.5;
        const stripeWidth = flagWidth / 3;
        
        // Franja azul
        const blueStripe = new THREE.PlaneGeometry(stripeWidth, flagHeight);
        const blueMaterial = new THREE.MeshLambertMaterial({ color: 0x002395, side: THREE.DoubleSide });
        const blueFlag = new THREE.Mesh(blueStripe, blueMaterial);
        blueFlag.position.set(stripeWidth/2, 3.2, 0);
        flagGroup.add(blueFlag);
        
        // Franja blanca
        const whiteStripe = new THREE.PlaneGeometry(stripeWidth, flagHeight);
        const whiteMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
        const whiteFlag = new THREE.Mesh(whiteStripe, whiteMaterial);
        whiteFlag.position.set(stripeWidth * 1.5, 3.2, 0);
        flagGroup.add(whiteFlag);
        
        // Franja roja
        const redStripe = new THREE.PlaneGeometry(stripeWidth, flagHeight);
        const redMaterial = new THREE.MeshLambertMaterial({ color: 0xED2939, side: THREE.DoubleSide });
        const redFlag = new THREE.Mesh(redStripe, redMaterial);
        redFlag.position.set(stripeWidth * 2.5, 3.2, 0);
        flagGroup.add(redFlag);
        
        flagGroup.position.set(x, y, z);
        this.scene.add(flagGroup);
        this.flags.push(flagGroup);
        
        // Animación de ondeo
        [blueFlag, whiteFlag, redFlag].forEach((flag, index) => {
            gsap.to(flag.rotation, {
                z: 0.1 + Math.random() * 0.05,
                duration: 1.3 + Math.random() * 0.4,
                ease: 'sine.inOut',
                yoyo: true,
                repeat: -1,
                delay: index * 0.1
            });
        });
    }

    createGiantArgentinaFlag(x, y, z) {
        const flagGroup = new THREE.Group();
        
        // Usar colores simples sin texturas para reducir uso de GPU
        const flagWidth = 8;
        const flagHeight = 4;
        
        // Franja celeste superior
        const topGeometry = new THREE.PlaneGeometry(flagWidth, flagHeight / 3);
        const celesteMaterial = new THREE.MeshLambertMaterial({ color: 0x87CEEB, side: THREE.DoubleSide });
        const topFlag = new THREE.Mesh(topGeometry, celesteMaterial);
        topFlag.position.y = flagHeight / 3;
        flagGroup.add(topFlag);
        
        // Franja blanca central
        const middleGeometry = new THREE.PlaneGeometry(flagWidth, flagHeight / 3);
        const whiteMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
        const middleFlag = new THREE.Mesh(middleGeometry, whiteMaterial);
        middleFlag.position.y = 0;
        flagGroup.add(middleFlag);
        
        // Sol simple
        const sunGeometry = new THREE.CircleGeometry(0.3, 16);
        const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xFFD700, side: THREE.DoubleSide });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.position.set(0, 0, 0.01);
        flagGroup.add(sun);
        
        // Franja celeste inferior
        const bottomGeometry = new THREE.PlaneGeometry(flagWidth, flagHeight / 3);
        const bottomFlag = new THREE.Mesh(bottomGeometry, celesteMaterial);
        bottomFlag.position.y = -flagHeight / 3;
        flagGroup.add(bottomFlag);
        
        flagGroup.position.set(x, y, z);
        this.scene.add(flagGroup);
        this.flags.push(flagGroup);
        
        // Animación simple
        gsap.to(flagGroup.rotation, {
            z: 0.05,
            duration: 2,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }

    createGiantFranceFlag(x, y, z) {
        const flagGroup = new THREE.Group();
        
        // Usar colores simples sin texturas
        const flagWidth = 8;
        const flagHeight = 4;
        
        // Franja azul
        const blueGeometry = new THREE.PlaneGeometry(flagWidth / 3, flagHeight);
        const blueMaterial = new THREE.MeshLambertMaterial({ color: 0x002395, side: THREE.DoubleSide });
        const blueFlag = new THREE.Mesh(blueGeometry, blueMaterial);
        blueFlag.position.x = -flagWidth / 3;
        flagGroup.add(blueFlag);
        
        // Franja blanca
        const whiteGeometry = new THREE.PlaneGeometry(flagWidth / 3, flagHeight);
        const whiteMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
        const whiteFlag = new THREE.Mesh(whiteGeometry, whiteMaterial);
        whiteFlag.position.x = 0;
        flagGroup.add(whiteFlag);
        
        // Franja roja
        const redGeometry = new THREE.PlaneGeometry(flagWidth / 3, flagHeight);
        const redMaterial = new THREE.MeshLambertMaterial({ color: 0xED2939, side: THREE.DoubleSide });
        const redFlag = new THREE.Mesh(redGeometry, redMaterial);
        redFlag.position.x = flagWidth / 3;
        flagGroup.add(redFlag);
        
        flagGroup.position.set(x, y, z);
        this.scene.add(flagGroup);
        this.flags.push(flagGroup);
        
        // Animación simple
        gsap.to(flagGroup.rotation, {
            z: 0.05,
            duration: 2.2,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }

    createFlag(x, y, z, color1, color2) {
        const flagGroup = new THREE.Group();
        
        // Mástil
        const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3);
        const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = 1.5;
        flagGroup.add(pole);
        
        // Bandera (dos colores)
        const flagGeometry = new THREE.PlaneGeometry(2, 1);
        const flagMaterial1 = new THREE.MeshLambertMaterial({ color: color1, side: THREE.DoubleSide });
        const flagMaterial2 = new THREE.MeshLambertMaterial({ color: color2, side: THREE.DoubleSide });
        
        const flag1 = new THREE.Mesh(flagGeometry, flagMaterial1);
        flag1.position.set(1, 2.5, 0);
        flag1.scale.y = 0.5;
        flagGroup.add(flag1);
        
        const flag2 = new THREE.Mesh(flagGeometry, flagMaterial2);
        flag2.position.set(1, 2, 0);
        flag2.scale.y = 0.5;
        flagGroup.add(flag2);
        
        flagGroup.position.set(x, y, z);
        this.scene.add(flagGroup);
        this.flags.push(flagGroup);
        
        // Animación de ondeo
        gsap.to(flag1.rotation, {
            z: 0.1,
            duration: 1 + Math.random(),
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1
        });
        
        gsap.to(flag2.rotation, {
            z: 0.15,
            duration: 1.2 + Math.random(),
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }

    createStadiumLights() {
        console.log('💡 Creando iluminación profesional del estadio...');
        
        // Torres de iluminación más realistas y altas
        const towerPositions = [
            [-30, 25, -15],
            [30, 25, -15],
            [-30, 25, 5],
            [30, 25, 5]
        ];
        
        towerPositions.forEach((pos, index) => {
            this.createLightTower(pos[0], pos[1], pos[2], index);
        });
        
        // Iluminación perimetral adicional
        this.createPerimeterLighting();
        
        console.log('✅ Iluminación profesional del estadio creada');
    }

    createStandLighting() {
        console.log('💡 Creando iluminación específica para las gradas...');
        
        // Luces para iluminar las gradas principales
        const standLightPositions = [
            // Gradería principal detrás del arco
            { pos: [-12, 15, -30], target: [-10, 6, -25], intensity: 0.7 },
            { pos: [0, 18, -35], target: [0, 8, -25], intensity: 0.8 },
            { pos: [12, 15, -30], target: [10, 6, -25], intensity: 0.7 },
            
            // Gradas laterales
            { pos: [-30, 12, -10], target: [-25, 6, -5], intensity: 0.6 },
            { pos: [-30, 12, 5], target: [-25, 6, 0], intensity: 0.6 },
            { pos: [30, 12, -10], target: [25, 6, -5], intensity: 0.6 },
            { pos: [30, 12, 5], target: [25, 6, 0], intensity: 0.6 },
            
            // Gradería detrás del jugador
            { pos: [-8, 10, 25], target: [-5, 4, 20], intensity: 0.5 },
            { pos: [8, 10, 25], target: [5, 4, 20], intensity: 0.5 }
        ];
        
        standLightPositions.forEach(lightConfig => {
            // Luz direccional para iluminar las gradas
            const standLight = new THREE.DirectionalLight(0xffffee, lightConfig.intensity);
            standLight.position.set(lightConfig.pos[0], lightConfig.pos[1], lightConfig.pos[2]);
            standLight.target.position.set(lightConfig.target[0], lightConfig.target[1], lightConfig.target[2]);
            standLight.castShadow = false;
            
            this.scene.add(standLight);
            this.scene.add(standLight.target);
            this.lights.push(standLight);
        });
        
        // Luces ambiente adicionales para mejor visibilidad general
        const ambientPositions = [
            [0, 25, -20], [0, 25, 0], [0, 25, 15],
            [-20, 20, -10], [20, 20, -10]
        ];
        
        ambientPositions.forEach(pos => {
            const ambientLight = new THREE.PointLight(0xffffff, 0.4, 50);
            ambientLight.position.set(pos[0], pos[1], pos[2]);
            this.scene.add(ambientLight);
            this.lights.push(ambientLight);
        });
        
        console.log('✅ Iluminación de gradas creada');
    }

    createLightTower(x, y, z, index) {
        const towerGroup = new THREE.Group();
        
        // Reutilizar materiales de torres
        if (!Stadium.towerMaterials) {
            Stadium.towerMaterials = {
                base: new THREE.MeshLambertMaterial({ color: 0x444444 }),
                tower: new THREE.MeshLambertMaterial({ color: 0x555555 }),
                platform: new THREE.MeshLambertMaterial({ color: 0x666666 }),
                spot: new THREE.MeshBasicMaterial({ color: 0x888888 }),
                halo: new THREE.MeshBasicMaterial({ 
                    color: 0xffffdd,
                    emissive: 0xffffdd,
                    emissiveIntensity: 0.7
                })
            };
        }
        
        // Base de la torre (simplificada)
        const baseGeometry = new THREE.BoxGeometry(3, 3, 3); // Box en lugar de cilindro
        const base = new THREE.Mesh(baseGeometry, Stadium.towerMaterials.base);
        base.position.y = 1.5;
        towerGroup.add(base);
        
        // Torre principal (simplificada)
        const towerGeometry = new THREE.BoxGeometry(0.8, 20, 0.8); // Box en lugar de cilindro
        const tower = new THREE.Mesh(towerGeometry, Stadium.towerMaterials.tower);
        tower.position.y = 13;
        towerGroup.add(tower);
        
        // Plataforma de luces (simplificada)
        const platformGeometry = new THREE.BoxGeometry(4, 1, 4); // Box en lugar de cilindro
        const platform = new THREE.Mesh(platformGeometry, Stadium.towerMaterials.platform);
        platform.position.y = 23.5;
        towerGroup.add(platform);
        
        // Solo 3 focos principales para mejor rendimiento
        const lightPositions = [
            [0, 0], [1.5, 0], [-1.5, 0]
        ];
        
        lightPositions.forEach((lightPos, lightIndex) => {
            // Foco visual simplificado
            const spotGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.6); // Box en lugar de cilindro
            const spotMesh = new THREE.Mesh(spotGeometry, Stadium.towerMaterials.spot);
            spotMesh.position.set(lightPos[0], 24, lightPos[1]);
            towerGroup.add(spotMesh);
            
            // Luz real más intensa para mejor iluminación
            const spotlight = new THREE.SpotLight(0xffffee, 0.8, 60, Math.PI/4, 0.3);
            spotlight.position.set(x + lightPos[0], y, z + lightPos[1]);
            spotlight.target.position.set(0, 0, -7);
            spotlight.castShadow = false; // Desactivar sombras para mejor rendimiento
            
            this.scene.add(spotlight);
            this.scene.add(spotlight.target);
            this.lights.push(spotlight);
            
            // Halo de luz simplificado
            const haloGeometry = new THREE.SphereGeometry(0.2, 8, 6); // Menos segmentos
            const halo = new THREE.Mesh(haloGeometry, Stadium.towerMaterials.halo);
            halo.position.set(lightPos[0], 24, lightPos[1]);
            towerGroup.add(halo);
        });
        
        towerGroup.position.set(x, 0, z);
        this.scene.add(towerGroup);
    }

    createPerimeterLighting() {
        // Luces perimetrales más intensas alrededor del campo
        const perimeterPositions = [
            [-15, 12, -25], [0, 12, -25], [15, 12, -25], // Detrás del arco
            [-25, 10, 0], [25, 10, 0], // Laterales
            [-10, 8, 20], [10, 8, 20] // Detrás del jugador
        ];
        
        perimeterPositions.forEach(pos => {
            // Poste de luz más alto
            const poleGeometry = new THREE.CylinderGeometry(0.15, 0.18, 12);
            const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.set(pos[0], pos[1]/2, pos[2]);
            this.scene.add(pole);
            
            // Luz punto más intensa
            const light = new THREE.PointLight(0xffffee, 0.8, 40);
            light.position.set(pos[0], pos[1], pos[2]);
            this.scene.add(light);
            this.lights.push(light);
            
            // Luminaria más brillante
            const lampGeometry = new THREE.SphereGeometry(0.3);
            const lampMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xffffdd,
                emissive: 0xffffdd,
                emissiveIntensity: 0.8
            });
            const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
            lamp.position.set(pos[0], pos[1], pos[2]);
            this.scene.add(lamp);
            
            // Añadir reflector adicional apuntando al campo
            const spotlight = new THREE.SpotLight(0xffffff, 0.6, 35, Math.PI/3, 0.5);
            spotlight.position.set(pos[0], pos[1], pos[2]);
            spotlight.target.position.set(0, 0, -7);
            this.scene.add(spotlight);
            this.scene.add(spotlight.target);
            this.lights.push(spotlight);
        });
    }

    createField() {
        console.log('⚽ Creando campo de juego profesional...');
        
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const lineWidth = 0.12;
        
        // Líneas laterales del campo completo
        this.createFieldLine(-34, 0, 0, lineWidth, 68, 'vertical'); // Izquierda
        this.createFieldLine(34, 0, 0, lineWidth, 68, 'vertical');  // Derecha
        this.createFieldLine(0, 0, -34, 68, lineWidth, 'horizontal'); // Fondo
        this.createFieldLine(0, 0, 34, 68, lineWidth, 'horizontal');  // Frente
        
        // Línea central
        this.createFieldLine(0, 0, 0, lineWidth, 68, 'vertical');
        
        // Círculo central
        const circleGeometry = new THREE.RingGeometry(9.15, 9.15 + lineWidth, 64);
        const circle = new THREE.Mesh(circleGeometry, lineMaterial);
        circle.rotation.x = -Math.PI / 2;
        circle.position.y = 0.01;
        this.scene.add(circle);
        
        // Punto central
        const centerSpotGeometry = new THREE.CircleGeometry(0.2, 16);
        const centerSpot = new THREE.Mesh(centerSpotGeometry, lineMaterial);
        centerSpot.rotation.x = -Math.PI / 2;
        centerSpot.position.y = 0.01;
        this.scene.add(centerSpot);
        
        // Área grande (área de 18 yardas)
        this.createPenaltyArea(-18, 0, -34, 40.3, 16.5, lineMaterial);
        
        // Área pequeña (área de 6 yardas)
        this.createGoalArea(-5.5, 0, -34, 18.3, 5.5, lineMaterial);
        
        // Arco penal
        const penaltyArcGeometry = new THREE.RingGeometry(9.15, 9.15 + lineWidth, 32, 1, 0, Math.PI);
        const penaltyArc = new THREE.Mesh(penaltyArcGeometry, lineMaterial);
        penaltyArc.rotation.x = -Math.PI / 2;
        penaltyArc.position.set(0, 0.01, -23);
        this.scene.add(penaltyArc);
        
        // Punto de penal (ya existe en SceneManager, pero lo mejoramos)
        const penaltySpotGeometry = new THREE.CircleGeometry(0.2, 16);
        const penaltySpot = new THREE.Mesh(penaltySpotGeometry, lineMaterial);
        penaltySpot.rotation.x = -Math.PI / 2;
        penaltySpot.position.set(0, 0.01, -11);
        this.scene.add(penaltySpot);
        
        // Esquinas (cuartos de círculo en las esquinas)
        this.createCornerArcs(lineMaterial);
        
        // Patrón de césped más realista
        this.createGrassPattern();
        
        console.log('✅ Campo profesional creado');
    }

    createFieldLine(x, y, z, width, length, orientation) {
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        let geometry;
        if (orientation === 'horizontal') {
            geometry = new THREE.PlaneGeometry(length, width);
        } else {
            geometry = new THREE.PlaneGeometry(width, length);
        }
        
        const line = new THREE.Mesh(geometry, lineMaterial);
        line.rotation.x = -Math.PI / 2;
        line.position.set(x, y + 0.01, z);
        this.scene.add(line);
    }

    createPenaltyArea(x, y, z, width, depth, material) {
        // Línea superior del área
        this.createFieldLine(x, y, z, width, 0.12, 'horizontal');
        
        // Líneas laterales del área
        this.createFieldLine(x - width/2, y, z + depth/2, 0.12, depth, 'vertical');
        this.createFieldLine(x + width/2, y, z + depth/2, 0.12, depth, 'vertical');
    }

    createGoalArea(x, y, z, width, depth, material) {
        // Línea superior del área pequeña
        this.createFieldLine(x, y, z, width, 0.12, 'horizontal');
        
        // Líneas laterales del área pequeña
        this.createFieldLine(x - width/2, y, z + depth/2, 0.12, depth, 'vertical');
        this.createFieldLine(x + width/2, y, z + depth/2, 0.12, depth, 'vertical');
    }

    createCornerArcs(material) {
        const cornerPositions = [
            [-34, 34],   // Esquina superior izquierda
            [34, 34],    // Esquina superior derecha
            [-34, -34],  // Esquina inferior izquierda
            [34, -34]    // Esquina inferior derecha
        ];
        
        cornerPositions.forEach(pos => {
            const arcGeometry = new THREE.RingGeometry(0.9, 1.02, 16, 1, 0, Math.PI/2);
            const arc = new THREE.Mesh(arcGeometry, material);
            arc.rotation.x = -Math.PI / 2;
            arc.position.set(pos[0], 0.01, pos[1]);
            
            // Ajustar rotación según la esquina
            if (pos[0] > 0 && pos[1] > 0) arc.rotation.z = -Math.PI/2; // Superior derecha
            else if (pos[0] < 0 && pos[1] > 0) arc.rotation.z = 0;     // Superior izquierda
            else if (pos[0] < 0 && pos[1] < 0) arc.rotation.z = Math.PI/2; // Inferior izquierda
            else arc.rotation.z = Math.PI; // Inferior derecha
            
            this.scene.add(arc);
        });
    }

    createGrassPattern() {
        // Crear patrón de césped con franjas más oscuras y claras
        const grassGroup = new THREE.Group();
        
        for (let i = -35; i < 35; i += 4) {
            const stripeGeometry = new THREE.PlaneGeometry(4, 70);
            const isEven = Math.floor((i + 35) / 4) % 2 === 0;
            const grassColor = isEven ? 0x2d6a2b : 0x256322;
            
            const stripeMaterial = new THREE.MeshLambertMaterial({ 
                color: grassColor,
                transparent: true,
                opacity: 0.7
            });
            
            const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
            stripe.rotation.x = -Math.PI / 2;
            stripe.position.set(i + 2, 0.005, 0); // Ligeramente por encima del suelo base
            grassGroup.add(stripe);
        }
        
        this.scene.add(grassGroup);
    }

    createExtraElements() {
        console.log('🎪 Creando elementos adicionales del estadio...');
        
        // Pantallas gigantes más realistas
        this.createLEDScreen(-18, 18, -32, 'ARGENTINA vs FRANCIA');
        this.createLEDScreen(18, 18, -32, 'FINAL MUNDIAL 2022');
        
        // Túnel de jugadores más elaborado
        this.createPlayerTunnel();
        
        // Bancos de suplentes profesionales
        this.createProfessionalBenches();
        
        // Área técnica
        this.createTechnicalArea();
        
        // Publicidad perimetral
        this.createPerimeterAdvertising();
        
        // Cámaras de TV
        this.createTVCameras();
        
        console.log('✅ Elementos adicionales del estadio creados');
    }

    createLEDScreen(x, y, z, text) {
        const screenGroup = new THREE.Group();
        
        // Reutilizar materiales básicos
        if (!Stadium.screenMaterials) {
            Stadium.screenMaterials = {
                support: new THREE.MeshLambertMaterial({ color: 0x333333 }),
                frame: new THREE.MeshLambertMaterial({ color: 0x111111 }),
                screen: new THREE.MeshBasicMaterial({ 
                    color: 0x001122,
                    emissive: 0x002244,
                    emissiveIntensity: 0.3
                })
            };
        }
        
        // Estructura de soporte
        const supportGeometry = new THREE.BoxGeometry(0.5, 8, 0.5);
        
        const leftSupport = new THREE.Mesh(supportGeometry, Stadium.screenMaterials.support);
        leftSupport.position.set(-5, 4, 0);
        screenGroup.add(leftSupport);
        
        const rightSupport = new THREE.Mesh(supportGeometry, Stadium.screenMaterials.support);
        rightSupport.position.set(5, 4, 0);
        screenGroup.add(rightSupport);
        
        // Marco de la pantalla
        const frameGeometry = new THREE.BoxGeometry(12, 6, 0.3);
        const frame = new THREE.Mesh(frameGeometry, Stadium.screenMaterials.frame);
        frame.position.y = 4;
        screenGroup.add(frame);
        
        // Pantalla LED simple sin textura
        const screenGeometry = new THREE.PlaneGeometry(11, 5);
        const screen = new THREE.Mesh(screenGeometry, Stadium.screenMaterials.screen);
        screen.position.set(0, 4, 0.16);
        screenGroup.add(screen);
        
        screenGroup.position.set(x, y, z);
        this.scene.add(screenGroup);
        
        // Animación de parpadeo optimizada
        gsap.to(Stadium.screenMaterials.screen, {
            emissiveIntensity: 0.5,
            duration: 3,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }

    createPlayerTunnel() {
        const tunnelGroup = new THREE.Group();
        
        // Reutilizar materiales básicos
        if (!Stadium.tunnelMaterials) {
            Stadium.tunnelMaterials = {
                tunnel: new THREE.MeshLambertMaterial({ color: 0x444444 }),
                entrance: new THREE.MeshLambertMaterial({ color: 0x222222 }),
                sign: new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
            };
        }
        
        // Estructura del túnel
        const tunnelGeometry = new THREE.BoxGeometry(6, 4, 12);
        const tunnel = new THREE.Mesh(tunnelGeometry, Stadium.tunnelMaterials.tunnel);
        tunnel.position.set(0, 2, 28);
        tunnelGroup.add(tunnel);
        
        // Entrada del túnel
        const entranceGeometry = new THREE.BoxGeometry(4, 3, 0.2);
        const entrance = new THREE.Mesh(entranceGeometry, Stadium.tunnelMaterials.entrance);
        entrance.position.set(0, 1.5, 22);
        tunnelGroup.add(entrance);
        
        // Letrero simple sin textura
        const signGeometry = new THREE.PlaneGeometry(3, 0.5);
        const sign = new THREE.Mesh(signGeometry, Stadium.tunnelMaterials.sign);
        sign.position.set(0, 3.5, 22.1);
        tunnelGroup.add(sign);
        
        this.scene.add(tunnelGroup);
    }

    createProfessionalBenches() {
        const benchPositions = [
            { x: -15, z: 15, team: 'Argentina' },
            { x: 15, z: 15, team: 'Francia' }
        ];
        
        benchPositions.forEach(pos => {
            const benchGroup = new THREE.Group();
            
            // Banco principal
            const benchGeometry = new THREE.BoxGeometry(10, 0.6, 2);
            const benchMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const bench = new THREE.Mesh(benchGeometry, benchMaterial);
            bench.position.y = 0.3;
            benchGroup.add(bench);
            
            // Respaldos
            const backrestGeometry = new THREE.BoxGeometry(10, 1.5, 0.2);
            const backrest = new THREE.Mesh(backrestGeometry, benchMaterial);
            backrest.position.set(0, 1.05, -0.9);
            benchGroup.add(backrest);
            
            // Techo del banco
            const roofGeometry = new THREE.BoxGeometry(12, 0.2, 4);
            const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.set(0, 3, 0);
            benchGroup.add(roof);
            
            // Postes de soporte
            const postGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3);
            const postMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
            
            [-5, 0, 5].forEach(postX => {
                const post = new THREE.Mesh(postGeometry, postMaterial);
                post.position.set(postX, 1.5, -1.5);
                benchGroup.add(post);
            });
            
            // Letrero del equipo simple sin textura
            const teamSignGeometry = new THREE.PlaneGeometry(8, 1);
            const teamColor = pos.team === 'Argentina' ? 0x87CEEB : 0x002395;
            const teamSignMaterial = new THREE.MeshBasicMaterial({ color: teamColor });
            const teamSign = new THREE.Mesh(teamSignGeometry, teamSignMaterial);
            teamSign.position.set(0, 2, -1.1);
            benchGroup.add(teamSign);
            
            benchGroup.position.set(pos.x, 0, pos.z);
            this.scene.add(benchGroup);
        });
    }

    createTechnicalArea() {
        // Área técnica marcada en el suelo
        const technicalAreaGeometry = new THREE.PlaneGeometry(20, 8);
        const technicalAreaMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.1
        });
        
        const technicalArea = new THREE.Mesh(technicalAreaGeometry, technicalAreaMaterial);
        technicalArea.rotation.x = -Math.PI / 2;
        technicalArea.position.set(0, 0.01, 12);
        this.scene.add(technicalArea);
        
        // Líneas del área técnica
        this.createFieldLine(-10, 0, 8, 0.1, 8, 'vertical');
        this.createFieldLine(10, 0, 8, 0.1, 8, 'vertical');
        this.createFieldLine(0, 0, 16, 20, 0.1, 'horizontal');
    }

    createPerimeterAdvertising() {
        const ads = [
            'COCA-COLA', 'ADIDAS', 'VISA', 'MASTERCARD', 
            'QATAR 2022', 'FIFA', 'NIKE', 'PEPSI'
        ];
        
        // Publicidad detrás del arco
        for (let i = 0; i < 6; i++) {
            this.createAdvertisingBoard(-15 + i * 5, 0.5, -20, ads[i % ads.length]);
        }
        
        // Publicidad lateral
        for (let i = 0; i < 4; i++) {
            this.createAdvertisingBoard(-25, 0.5, -10 + i * 5, ads[(i + 2) % ads.length]);
            this.createAdvertisingBoard(25, 0.5, -10 + i * 5, ads[(i + 4) % ads.length]);
        }
    }

    createAdvertisingBoard(x, y, z, text) {
        const boardGroup = new THREE.Group();
        
        // Reutilizar materiales de publicidad
        if (!Stadium.adMaterials) {
            Stadium.adMaterials = {
                support: new THREE.MeshLambertMaterial({ color: 0x666666 }),
                boards: [
                    new THREE.MeshBasicMaterial({ color: 0xFF0000 }), // Rojo
                    new THREE.MeshBasicMaterial({ color: 0x0066FF }), // Azul
                    new THREE.MeshBasicMaterial({ color: 0x00AA00 }), // Verde
                    new THREE.MeshBasicMaterial({ color: 0xFF6600 }), // Naranja
                    new THREE.MeshBasicMaterial({ color: 0x9900CC })  // Morado
                ]
            };
        }
        
        // Soporte
        const supportGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
        const support = new THREE.Mesh(supportGeometry, Stadium.adMaterials.support);
        support.position.y = 0.5;
        boardGroup.add(support);
        
        // Tablero publicitario simple con color
        const boardGeometry = new THREE.PlaneGeometry(4, 0.8);
        const randomMaterial = Stadium.adMaterials.boards[Math.floor(Math.random() * Stadium.adMaterials.boards.length)];
        const board = new THREE.Mesh(boardGeometry, randomMaterial);
        board.position.y = 1;
        boardGroup.add(board);
        
        boardGroup.position.set(x, y, z);
        this.scene.add(boardGroup);
    }

    createTVCameras() {
        const cameraPositions = [
            { x: 0, y: 8, z: -25, target: [0, 2, -10] },
            { x: -20, y: 6, z: 0, target: [0, 2, -10] },
            { x: 20, y: 6, z: 0, target: [0, 2, -10] },
        ];
        
        cameraPositions.forEach(pos => {
            const cameraGroup = new THREE.Group();
            
            // Base de la cámara
            const baseGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.5);
            const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
            const base = new THREE.Mesh(baseGeometry, baseMaterial);
            cameraGroup.add(base);
            
            // Cámara
            const cameraGeometry = new THREE.BoxGeometry(0.8, 0.4, 1.2);
            const cameraMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
            const camera = new THREE.Mesh(cameraGeometry, cameraMaterial);
            camera.position.y = 0.5;
            cameraGroup.add(camera);
            
            // Lente
            const lensGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.3);
            const lensMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const lens = new THREE.Mesh(lensGeometry, lensMaterial);
            lens.rotation.x = Math.PI / 2;
            lens.position.set(0, 0.5, 0.75);
            cameraGroup.add(lens);
            
            cameraGroup.position.set(pos.x, pos.y, pos.z);
            
            // Rotar la cámara hacia su objetivo
            cameraGroup.lookAt(pos.target[0], pos.target[1], pos.target[2]);
            
            this.scene.add(cameraGroup);
        });
    }

    createScreen(x, y, z) {
        const screenGroup = new THREE.Group();
        
        // Marco de la pantalla
        const frameGeometry = new THREE.BoxGeometry(8, 4.5, 0.2);
        const frameMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        screenGroup.add(frame);
        
        // Pantalla
        const screenGeometry = new THREE.PlaneGeometry(7.5, 4);
        const screenMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x001122,
            emissive: 0x001122,
            emissiveIntensity: 0.3
        });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.z = 0.11;
        screenGroup.add(screen);
        
        screenGroup.position.set(x, y, z);
        this.scene.add(screenGroup);
        
        // Animación de parpadeo de la pantalla
        gsap.to(screenMaterial, {
            emissiveIntensity: 0.6,
            duration: 2 + Math.random(),
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }

    createTunnel() {
        const tunnelGeometry = new THREE.BoxGeometry(4, 3, 8);
        const tunnelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
        tunnel.position.set(0, 1.5, 25);
        this.scene.add(tunnel);
    }

    createBenches() {
        // Banco local
        const benchGeometry = new THREE.BoxGeometry(8, 0.5, 1);
        const benchMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        
        const homeBench = new THREE.Mesh(benchGeometry, benchMaterial);
        homeBench.position.set(-10, 0.25, 8);
        this.scene.add(homeBench);
        
        // Banco visitante
        const awayBench = new THREE.Mesh(benchGeometry, benchMaterial);
        awayBench.position.set(10, 0.25, 8);
        this.scene.add(awayBench);
    }

    // Método para crear ambiente de final del mundo
    createWorldCupFinalAtmosphere() {
        console.log('🏆 Creando ambiente de final del mundo...');
        
        // Efectos de luces adicionales
        this.createAtmosphericLights();
        
        // Confeti en el aire
        this.createConfetti();
        
        // Humo de bengalas
        this.createSmoke();
        
        console.log('✅ Ambiente de final creado');
    }

    createAtmosphericLights() {
        // Luces de colores para ambiente
        const colors = [0x87CEEB, 0x0055AA, 0xFFFFFF];
        
        for (let i = 0; i < 6; i++) {
            const light = new THREE.PointLight(colors[i % colors.length], 0.5, 30);
            light.position.set(
                (Math.random() - 0.5) * 60,
                8 + Math.random() * 5,
                -20 + Math.random() * 40
            );
            this.scene.add(light);
            
            // Animación de intensidad
            gsap.to(light, {
                intensity: 1.0,
                duration: 1 + Math.random(),
                ease: 'sine.inOut',
                yoyo: true,
                repeat: -1
            });
        }
    }

    createConfetti() {
        const confettiGroup = new THREE.Group();
        
        // Reutilizar geometría y materiales para confeti
        if (!Stadium.confettiMaterials) {
            const confettiGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.02);
            Stadium.confettiMaterials = {
                geometry: confettiGeometry,
                materials: [
                    new THREE.MeshBasicMaterial({ color: 0x87CEEB }),
                    new THREE.MeshBasicMaterial({ color: 0x0055AA }),
                    new THREE.MeshBasicMaterial({ color: 0xFFD700 }),
                    new THREE.MeshBasicMaterial({ color: 0xFF0000 }),
                    new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
                ]
            };
        }
        
        // Reducir cantidad de confeti para mejor rendimiento
        for (let i = 0; i < 50; i++) {
            const material = Stadium.confettiMaterials.materials[Math.floor(Math.random() * Stadium.confettiMaterials.materials.length)];
            const confetti = new THREE.Mesh(Stadium.confettiMaterials.geometry, material);
            
            confetti.position.set(
                (Math.random() - 0.5) * 80,
                15 + Math.random() * 10,
                (Math.random() - 0.5) * 60
            );
            
            confettiGroup.add(confetti);
            
            // Animación de caída optimizada
            gsap.to(confetti.position, {
                y: -2,
                duration: 8 + Math.random() * 4,
                ease: 'none',
                repeat: -1,
                delay: Math.random() * 5
            });
            
            gsap.to(confetti.rotation, {
                z: Math.PI * 2,
                duration: 2 + Math.random(),
                ease: 'none',
                repeat: -1
            });
        }
        
        this.scene.add(confettiGroup);
    }

    createSmoke() {
        // Humo simple usando partículas
        const smokeGroup = new THREE.Group();
        const smokeGeometry = new THREE.SphereGeometry(0.5);
        const smokeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x666666, 
            transparent: true, 
            opacity: 0.3 
        });
        
        // Humo en las gradas
        for (let i = 0; i < 20; i++) {
            const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
            smoke.position.set(
                (Math.random() - 0.5) * 40,
                8 + Math.random() * 3,
                -22 + Math.random() * 5
            );
            
            smokeGroup.add(smoke);
            
            // Animación de dispersión
            gsap.to(smoke.position, {
                y: smoke.position.y + 5,
                duration: 3 + Math.random() * 2,
                ease: 'power1.out',
                repeat: -1,
                yoyo: true
            });
            
            gsap.to(smoke.material, {
                opacity: 0.1,
                duration: 2 + Math.random(),
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true
            });
        }
        
        this.scene.add(smokeGroup);
    }

    // Método para aumentar la intensidad durante momentos clave
    intensifyAtmosphere() {
        console.log('🔥 Intensificando ambiente del estadio...');
        
        // Acelerar animaciones de multitud (limitado para rendimiento)
        const crowdSample = this.crowd.slice(0, Math.min(this.crowd.length, 100));
        crowdSample.forEach(person => {
            gsap.to(person.position, {
                y: person.position.y + 0.5,
                duration: 0.3,
                ease: 'power2.out',
                yoyo: true,
                repeat: 5
            });
        });
        
        // Intensificar luces principales solamente
        const mainLights = this.lights.slice(0, 4);
        mainLights.forEach(light => {
            gsap.to(light, {
                intensity: 1.5,
                duration: 0.5,
                ease: 'power2.out',
                yoyo: true,
                repeat: 3
            });
        });
    }

    // Método para optimizar el rendimiento si es necesario
    optimizeForPerformance() {
        console.log('🔧 Optimizando rendimiento del estadio (preservando calidad del juego)...');
        
        // Reducir multitud más agresivamente - solo elementos del estadio
        if (this.crowd.length > 200) {
            const excessCrowd = this.crowd.splice(200);
            excessCrowd.forEach(person => {
                person.parent?.remove(person);
            });
            console.log(`Reducidas ${excessCrowd.length} personas para mejorar rendimiento`);
        }
        
        // Reducir luces del estadio (NO afecta arco, arquero, pelota)
        if (this.lights.length > 6) {
            const excessLights = this.lights.splice(6);
            excessLights.forEach(light => {
                this.scene.remove(light);
                if (light.target) this.scene.remove(light.target);
            });
            console.log(`Reducidas ${excessLights.length} luces para mejorar rendimiento`);
        }
        
        // Reducir banderas si hay demasiadas
        if (this.flags.length > 6) {
            const excessFlags = this.flags.splice(6);
            excessFlags.forEach(flag => {
                this.scene.remove(flag);
            });
            console.log(`Reducidas ${excessFlags.length} banderas para mejorar rendimiento`);
        }
        
        // Configurar nivel de detalle más bajo para elementos lejanos
        this.setLowDetailForDistantElements();
        
        console.log('✅ Optimización del estadio completada (elementos del juego preservados)');
    }

    setLowDetailForDistantElements() {
        // Reducir la frecuencia de animaciones de multitud
        const crowdAnimationSample = this.crowd.filter((_, index) => index % 3 === 0); // Solo 1 de cada 3
        
        crowdAnimationSample.forEach(person => {
            // Pausar animaciones de personas lejanas
            gsap.killTweensOf(person.position);
            gsap.killTweensOf(person.rotation);
        });
        
        console.log(`Optimizadas animaciones de ${this.crowd.length - crowdAnimationSample.length} personas lejanas`);
    }
}
