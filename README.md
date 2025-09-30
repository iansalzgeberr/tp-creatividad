# Three.js - Penal de la Final del Mundo 🎮🖐️

Este proyecto es una simulación completa de un penal decisivo en una final del mundo, desarrollado con Three.js y Vite. La experiencia incluye movimiento en primera persona, una IA para el arquero, múltiples desenlaces, un arco narrativo y **control por gestos usando MediaPipe**.

## ✨ Novedades: Control por Gestos

¡Ahora puedes jugar usando gestos de mano en tiempo real! El sistema detecta:

- **👆 Dedo índice extendido**: Apunta hacia donde quieres disparar
- **👊 Puño cerrado**: Comienza a cargar la potencia del tiro
- **✋ Abrir la mano**: ¡Dispara la pelota!

## Requisitos

- Node.js (v16 o superior)
- npm
- **Cámara web** (para control por gestos)
- Navegador moderno con soporte para MediaPipe

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
        └── montiel.weba (audio del penal)
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

## 🎮 Controles

### Modo Clásico (Teclado + Mouse)

-   **WASD:** Mover al jugador en la fase de `PRE_PENAL`.
-   **Mouse:** Apuntar la dirección del tiro.
-   **A/D:** Perfilar el tiro (movimiento lateral sutil) en la fase de `AIMING`.
-   **Mantener ESPACIO:** Cargar la barra de fuerza.
-   **Soltar ESPACIO:** Patear la pelota.
-   **SHIFT:** Correr en la fase de `PRE_PENAL`.
-   **G:** Activar/desactivar control por gestos.

### Modo Gestos (Experimental) 🖐️

1. **Activar el modo**: Haz clic en "Activar Control por Gestos" en el panel de opciones
2. **Permitir acceso a la cámara** cuando el navegador lo solicite
3. **Posiciona tu mano** frente a la cámara (aparecerá un preview en la esquina superior izquierda)
4. **Gestos disponibles**:
   - 👆 **Apuntar**: Extiende solo tu dedo índice (otros dedos cerrados)
   - 👊 **Cargar**: Cierra el puño completamente
   - ✋ **Disparar**: Abre la mano después de haber cargado

**Consejos para mejor detección:**
- Mantén tu mano a 30-50cm de la cámara
- Asegúrate de tener buena iluminación
- Fondo simple sin muchas distracciones
- Haz gestos claros y deliberados

## Opciones en Pantalla

-   **Slider "Presión":** Aumenta la imprecisión del tiro. Un valor más alto hace más difícil anotar.
-   **Botón "Activar Control por Gestos":** Activa/desactiva el modo de control por gestos con cámara.

## Stack Tecnológico

-   **Motor 3D:** Three.js (r180)
-   **Bundler:** Vite
-   **Animación:** GSAP
-   **Detección de Gestos:** MediaPipe Hands (Google)
-   **Módulos de Three.js:** `GLTFLoader`, `PointerLockControls`
-   **Audio:** WebAudio API (gestionada a través de Three.js Audio)
-   **Eventos:** EventEmitter3

## Estructura del Proyecto

```
src/
├── experience/
│   ├── Assets.js          # Carga de modelos 3D
│   ├── Audio.js           # Sistema de audio
│   ├── GoalkeeperAI.js    # IA del arquero
│   ├── Input.js           # Gestión de controles (teclado + gestos)
│   ├── GestureManager.js  # 🆕 Detección de gestos con MediaPipe
│   ├── SceneManager.js    # Coordinador principal
│   ├── ShotModel.js       # Física del tiro
│   ├── States.js          # Máquina de estados del juego
│   └── UI.js              # Interfaz de usuario
└── main.js                # Punto de entrada
```

## Arquitectura del Sistema de Gestos

El sistema de gestos utiliza **MediaPipe Hands** para detectar y clasificar gestos en tiempo real:

1. **Captura de Video**: Accede a la cámara web del usuario
2. **Detección de Landmarks**: MediaPipe identifica 21 puntos clave de la mano
3. **Clasificación de Gestos**: Algoritmo personalizado interpreta los landmarks
4. **Emisión de Eventos**: Los gestos detectados disparan eventos que el juego escucha
5. **Integración con Input Manager**: Los eventos de gestos se integran con los controles tradicionales

## Troubleshooting

### La cámara no funciona
- Verifica que tu navegador tenga permisos para acceder a la cámara
- Asegúrate de estar usando HTTPS (o localhost)
- Revisa la consola del navegador para errores

### Los gestos no se detectan correctamente
- Mejora la iluminación de tu espacio
- Acerca o aleja tu mano de la cámara
- Evita fondos muy ocupados o con muchos colores
- Asegúrate de que toda tu mano esté visible en el cuadro

### El juego va lento con gestos activados
- MediaPipe es computacionalmente intensivo
- Cierra otras pestañas del navegador
- Considera usar el modo de teclado si tu PC es más antigua

## Futuras Mejoras

- [ ] Calibración personalizada de gestos
- [ ] Soporte para múltiples gestos personalizados
- [ ] Feedback visual mejorado para reconocimiento de gestos
- [ ] Modo de entrenamiento de gestos
- [ ] Soporte para control de voz adicional

## Créditos

- **Motor 3D**: Three.js
- **Detección de Gestos**: Google MediaPipe
- **Audio del penal**: Transmisión original

---

**¡Disfruta del penal más inmersivo de tu vida! ⚽🔥**