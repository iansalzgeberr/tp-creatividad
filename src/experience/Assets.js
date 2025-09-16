import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import EventEmitter from 'eventemitter3';

export default class Assets extends EventEmitter {
    constructor() {
        super();
        this.manager = new THREE.LoadingManager(
            () => this.emit('loaded'),
            (url, itemsLoaded, itemsTotal) => {
                const progress = itemsLoaded / itemsTotal;
                this.emit('progress', progress);
            }
        );
        this.gltfLoader = new GLTFLoader(this.manager);
        this.items = {};

        this.load();
    }

    load() {
        const modelsToLoad = [
            { name: 'arco', path: '/models/arco.glb' },
            { name: 'pelota', path: '/models/pelota.glb' },
            { name: 'jugador', path: '/models/jugador.glb' },
            { name: 'arquero', path: '/models/arquero.glb' },
            
        ];

        for (const model of modelsToLoad) {
            this.gltfLoader.load(model.path, (gltf) => {
                this.items[model.name] = gltf;
            });
        }
    }

    get(name) {
        return this.items[name];
    }
}