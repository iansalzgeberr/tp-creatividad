# Three.js - Penal de la Final del Mundo

Este proyecto es una simulación completa de un penal decisivo en una final del mundo, desarrollado con Three.js y Vite. La experiencia incluye movimiento en primera persona, una IA para el arquero, múltiples desenlaces y un arco narrativo.

## Requisitos

- Node.js (v16 o superior)
- npm

## Instalación y Ejecución

1.  **Clonar el repositorio:**
    ```bash
    git clone https://...
    cd final-penalty-kick
    ```

2.  **Colocar los assets (OBLIGATORIO):**
    Descarga los modelos 3D y los archivos de audio y colócalos en la carpeta `public/` siguiendo esta estructura:
    
    ```
    public/
    ├── models/
    │   ├── arco.glb
    │   ├── pelota.glb
    │   ├── jugador.glb
    │   └── arquero.glb
    └── audio/
        ├── crowd.mp3
        ├── heartbeat.mp3
        ├── goal.mp3
        ├── fail.mp3
        └── whistle.mp3
    ```

3.  **Instalar dependencias:**
    ```bash
    npm install
    ```

4.  **Iniciar el servidor de desarrollo:**
    ```bash
    npm run dev
    ```
    Abre la URL que aparece en la consola (generalmente `http://localhost:5173`).

## Controles

-   **WASD:** Mover al jugador en la fase de `PRE_PENAL`.
-   **Mouse:** Apuntar la dirección del tiro.
-   **A/D:** Perfilar el tiro (movimiento lateral sutil) en la fase de `AIMING`.
-   **Mantener ESPACIO:** Cargar la barra de fuerza.
-   **Soltar ESPACIO:** Patear la pelota.
-   **SHIFT (Opcional):** Correr en la fase de `PRE_PENAL`.

## Opciones en Pantalla

-   **Slider "Presión":** Aumenta la imprecisión del tiro. Un valor más alto hace más difícil anotar.
-   **Botón "Vista Fija / WASD":** (Funcionalidad por implementar) Permitiría alternar entre el movimiento libre y una cámara estática.

## Stack Tecnológico

-   **Motor 3D:** Three.js (r150+)
-   **Bundler:** Vite
-   **Animación:** GSAP
-   **Módulos de Three.js:** `GLTFLoader`, `PointerLockControls`
-   **Audio:** WebAudio API (gestionada a través de Three.js Audio)