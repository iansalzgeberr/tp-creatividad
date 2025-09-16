import * as THREE from 'three';
import SceneManager from './experience/SceneManager';

const canvas = document.querySelector('#webgl');
const sceneManager = new SceneManager(canvas);

const clock = new THREE.Clock();

function animate() {
    const deltaTime = clock.getDelta();
    sceneManager.update(deltaTime);
    requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => sceneManager.onResize());