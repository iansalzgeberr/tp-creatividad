# 🦶⚽ Control con Detección de Pie - Instrucciones

## 🎯 ¿Qué cambió?

Ahora el juego usa **MediaPipe Pose** para detectar el movimiento de tu **pierna y pie** en lugar de las manos.

---

## 📋 Cómo usar el control con pie

### 1️⃣ **Preparación**
- Colócate de **cuerpo completo** frente a la cámara
- Aléjate lo suficiente para que se vea desde tu cadera hasta tus pies
- Asegúrate de tener buena iluminación
- La cámara debe estar a la altura de tu cintura/cadera (no muy arriba)

### 2️⃣ **Activar el Control**
- Haz clic en el botón **"🦶 Activar Control con Pie"**
- Acepta los permisos de la cámara
- Verás tu imagen con el esqueleto detectado
- La **pierna derecha estará destacada en color cyan**
- El **tobillo tendrá un círculo amarillo** (punto de tracking principal)

### 3️⃣ **Apuntar y Cargar Potencia**
1. **Levanta tu pierna derecha**
2. Mientras la mantienes levantada:
   - **Altura del pie** = **Potencia** (más alto = más potencia)
   - **Posición horizontal del pie** = **Dirección** del tiro
   - Verás una **barra de potencia** en la esquina superior derecha
3. Ajusta la dirección moviendo tu pie a izquierda/derecha
4. Levanta más o menos el pie para ajustar la potencia

### 4️⃣ **Disparar**
- Con la pierna levantada, **patea hacia adelante rápidamente**
- El sistema detecta la **velocidad del movimiento** del tobillo
- Cuanto más rápido patees, más potencia adicional

---

## 🎮 Controles

| Acción | Cómo hacerlo |
|--------|--------------|
| **Apuntar** | Mover el pie izquierda/derecha mientras está levantado |
| **Ajustar altura** | Mover el pie arriba/abajo mientras está levantado |
| **Cargar potencia** | Levantar la pierna y mantenerla |
| **Disparar** | Patear hacia adelante rápidamente |
| **Cancelar** | Bajar la pierna sin patear |

---

## 📊 Indicadores Visuales

### En la cámara verás:
- ✅ **Esqueleto verde**: Tu cuerpo está siendo detectado
- 🔵 **Pierna cyan destacada**: Tu pierna derecha (la que patea)
- 🟡 **Círculo amarillo**: Tu tobillo (punto principal de tracking)
- 📊 **Barra de potencia**: Nivel de potencia actual (derecha)
- 💬 **Mensajes de estado**: Instrucciones en tiempo real (abajo)

### Estados del sistema:
- `✅ Levanta tu pierna derecha para apuntar` - Listo para comenzar
- `🦵 Levanta más la pierna para más potencia...` - Cargando
- `⚡ POTENCIA: XX% | 🎯 Ajusta dirección` - Apuntando
- `⚽💥 ¡¡¡DISPARO!!!` - Tiro ejecutado
- `❌ Pateo cancelado` - Se bajó la pierna sin disparar
- `❌ No se detecta cuerpo - Aléjate un poco` - Muy cerca de la cámara

---

## 🔧 Solución de Problemas

### ❌ "No se detecta cuerpo"
- **Solución**: Aléjate más de la cámara
- Asegúrate de que se vea desde tu cadera hasta tus pies

### ❌ El sistema no responde
- Verifica que la cámara muestre el esqueleto en color verde
- Asegúrate de estar usando la **pierna derecha**
- Levanta la pierna más alto (mínimo 10cm del suelo)

### ❌ No detecta el disparo
- Patea más **rápido y con más fuerza** hacia adelante
- El movimiento debe ser hacia la cámara (como patear la pelota)

### ❌ La dirección no es precisa
- Ajusta la posición horizontal de tu pie mientras está levantado
- Recuerda que la cámara está espejada (tu izquierda = derecha del juego)

---

## 🎓 Consejos Pro

1. **Practica el movimiento**:
   - Primero levanta la pierna lentamente
   - Ajusta la posición
   - Luego patea rápido hacia adelante

2. **Máxima potencia**:
   - Levanta la pierna lo más alto posible
   - Mantén estable 1-2 segundos
   - Patea con máxima velocidad

3. **Precisión**:
   - Movimientos pequeños del pie = cambios sutiles de dirección
   - Practica primero con el sistema de teclado para entender las zonas

4. **Iluminación**:
   - Más luz = mejor detección
   - Evita contraluces (ventanas detrás tuyo)
   - Luz frontal o lateral funciona mejor

---

## 🆚 Comparación: Mano vs Pie

| Aspecto | Control con Mano (Anterior) | Control con Pie (Nuevo) |
|---------|----------------------------|-------------------------|
| **Gesto de apuntar** | Dedo índice extendido | Pierna levantada |
| **Cargar potencia** | Puño cerrado | Altura del pie |
| **Disparar** | Abrir la mano | Patear hacia adelante |
| **Precisión** | Alta (dedos precisos) | Media (pierna menos precisa) |
| **Inmersión** | Media | **Alta** ⚽ |
| **Espacio requerido** | Poco | Más espacio |
| **Dificultad** | Fácil | Media |

---

## 🔄 Volver al Control con Manos

Si quieres volver al sistema anterior con las manos:

1. En `SceneManager.js`, línea 12, cambia:
   ```javascript
   import KickGestureManager from './KickGestureManager';
   ```
   por:
   ```javascript
   import GestureManager from './GestureManager';
   ```

2. En línea 33, cambia:
   ```javascript
   this.gesture = new KickGestureManager();
   ```
   por:
   ```javascript
   this.gesture = new GestureManager();
   ```

---

## 📱 Requisitos del Sistema

- ✅ Navegador moderno (Chrome, Edge, Firefox)
- ✅ Cámara web funcional
- ✅ Conexión a internet (para cargar MediaPipe)
- ✅ Espacio frente a la cámara (~1.5 metros)
- ⚠️ **Mayor procesamiento** que el control con manos

---

## 🚀 ¡A Jugar!

1. Presiona el botón de inicio
2. Activa el control con pie
3. Párate frente a la cámara
4. ¡Marca goles con tus patadas reales! ⚽🔥

---

**Creado con MediaPipe Pose** 🎮
**Versión**: 2.0 - Control con Pie
