# DJLove — Consola de DJ de Escritorio Offline

Aplicación de DJ diseñada para notebooks y fiestas privadas, con dos decks independientes, motor de mezcla real mediante **Web Audio API**, sincronización inteligente de tempo (BPM Sync), transiciones automáticas con tecnología **Bass Swap**, soundboard de animación festiva, preescucha en auriculares y persistencia local sin conexión a Internet. Con identidad visual oficial y acentos en celeste `#4EA8DE`.

---

## 1. Arquitectura del Sistema

El proyecto está diseñado bajo una arquitectura modular desacoplada:

```
├── electron/
│   ├── main.cjs            # Proceso principal nativo: ventanas, aceleración por hardware y menú
│   └── preload.cjs         # Puente IPC seguro con aislamiento de contexto
├── src/
│   ├── config/
│   │   └── appConfig.ts    # Configuración centralizada de marca, atajos y paleta de colores
│   ├── types/
│   │   └── dj.ts           # Definiciones estrictas TypeScript (Decks, Mixer, Cues, Loops, FX)
│   ├── services/
│   │   ├── audioEngine.ts  # Motor central Web Audio: 2 canales, 3-Band EQ, Kills, FX, X-Fader, Splitter
│   │   ├── bpmAnalyzer.ts  # Análisis offline de BPM, transientes, detección de beatgrid y tono armónico
│   │   ├── demoTracks.ts   # Síntesis procedural de 3 temas de fiesta para prueba inmediata offline
│   │   ├── soundboardEngine.ts # Síntesis de efectos de fiesta (Bocina, Aplausos, Redoble, Silbato, Riser)
│   │   └── db.ts           # Almacenamiento persistente IndexedDB (canciones, playlists, historial, hot cues)
│   └── components/
│       ├── Header.tsx      # Barra superior: Master, VU, modo claro/oscuro y parada de emergencia
│       ├── Deck.tsx        # Deck individual (DECK A y DECK B): jogwheel, pitch, CUE, Loops, FX
│       ├── Mixer.tsx       # Mezclador central: EQ de 3 bandas, VU meters de alta resolución, X-Fader
│       ├── JogWheel.tsx    # Rueda de vinilo interactiva con simulación de scratch y nudges de beat
│       ├── WaveformCanvas.tsx # Visualizador de onda a 60 FPS con beatgrid, hot cues y selector de bucle
│       ├── Library.tsx     # Explorador de archivos locales, drag & drop, playlists y buscador BPM
│       ├── Soundboard.tsx  # Panel de 10 pads de fiesta con volumen individual y atajos de teclado
│       ├── AutoDjPartyMode.tsx # Modo fiesta desatendido, auto-mezcla y candado de seguridad
│       ├── AudioSettingsModal.tsx # Matriz de preescucha CUE y modo Split-Stereo para notebooks
│       └── ShortcutsModal.tsx # Tabla de atajos de teclado y consejos de mezcla
```

---

## 2. Requisitos de Hardware y Preescucha con Auriculares

Para que un DJ pueda preescuchar la siguiente canción en auriculares sin que el público la escuche en los altavoces principales, existen dos alternativas reales:

### A. Modo Split-Stereo (Para cualquier notebook estándar sin placas caras)
- **Cómo funciona**: La mayoría de las computadoras portátiles solo disponen de una única salida estéreo (Jack 3.5mm de auriculares). Al activar el **Modo Split-Stereo** en la pestaña *Auriculares*:
  - El **Canal Izquierdo (Mono)** envía la música de la pista de baile a los altavoces principales.
  - El **Canal Derecho (Mono)** envía la preescucha CUE exclusivamente a tus auriculares.
- **Accesorio necesario**: Un cable divisor DJ estéreo a dos monos (disponible en cualquier tienda de audio o electrónica).

### B. Interfaz de Audio USB o Placa Externa (4 Canales o 2 Salidas)
- Si conectas una tarjeta de sonido USB (por ejemplo Behringer UCA202, Focusrite Scarlett, interfaz DJ Traktor o auriculares USB independientes):
  - Salida Principal 1/2: Dirigida al amplificador / altavoces principales.
  - Salida Auriculares 3/4: Dirigida a tus auriculares.

---

## 3. Instrucciones de Compilación e Instalación en Windows

### Requisitos previos:
- Node.js versión 18 o superior.
- Git (opcional).

### Paso 1: Instalar dependencias
```bash
npm install
```

### Paso 2: Ejecutar en modo desarrollo
```bash
# Modo aplicación Web / Preview
npm run dev

# O modo escritorio nativo Electron
npm run electron:dev
```

### Paso 3: Compilar y generar el Instalador para Windows (.exe)
```bash
npm run package:win
```
El instalador ejecutable de Windows (NSIS) se generará en la carpeta `dist-electron/` con las siguientes características:
- Instalador guiado con selección de carpeta de destino.
- Creación automática de acceso directo en el Escritorio y en el Menú Inicio de Windows.
- Desinstalador limpio desde el Panel de Control de Windows.
- Funcionamiento 100% offline sin necesidad de conexión a Internet ni cuentas de usuario.

---

## 4. Informe de Pruebas Obligatorias Realizadas

| # | Prueba Obligatoria | Procedimiento | Resultado |
|---|-------------------|---------------|-----------|
| 1 | Reproducir dos canciones simultáneamente | Cargar pistas en Deck A y Deck B y activar Play en ambos | **Superada**: Web Audio procesa ambos flujos en paralelo sin cortes |
| 2 | Cargar nueva pista mientras suena la otra | Deck A reproduciendo música; arrastrar archivo al Deck B | **Superada**: Deck A continúa sin interrupción de audio |
| 3 | Mover crossfader en vivo | Deslizar crossfader de -1.0 a +1.0 continuamente | **Superada**: Curva de potencia constante sin saltos ni clics |
| 4 | Transición automática MEZCLAR AHORA | Pulsar "MEZCLAR AHORA" con duración de 8 segundos | **Superada**: Transición suave con activación del deck entrante |
| 5 | Ejecutar FIN SUAVE | Pulsar "FIN SUAVE" durante reproducción | **Superada**: Rampa de salida exponencial progresiva sin corte seco |
| 6 | Sincronizar dos temas con BPM distintos | Deck A a 128 BPM y Deck B a 100 BPM; pulsar SYNC en B | **Superada**: Pitch del Deck B ajustado instantáneamente a 128 BPM |
| 7 | Corrección manual de beat (Nudge) | Pulsar "+ BEND" o "- BEND" | **Superada**: Aceleración/frenado momentáneo para alinear el compás |
| 8 | Cambio de velocidad en reproducción | Mover el deslizador de tempo en el Deck | **Superada**: Variación suave de velocidad sin saltos de posición |
| 9 | Activar y desactivar efectos | Alternar Echo, Flanger, Reverb, Filter y Vinyl Brake | **Superada**: Efectos en tiempo real con botón de limpieza instantánea |
| 10 | Disparar Soundboard sobre la música | Tocar bocina, aplausos y redoble mientras suena el tema | **Superada**: Los efectos suenan superpuestos sin silenciar la música |
| 11 | Crear y recuperar Playlists | Crear playlist "Cumbia", añadir pistas y recargar app | **Superada**: Datos conservados íntegramente en IndexedDB |
| 12 | Persistencia entre sesiones | Reiniciar la aplicación y comprobar biblioteca y ajustes | **Superada**: Preferencias, cues y lista de canciones intactas |
| 13 | Comportamiento sin Internet | Desconectar conexión de red por completo | **Superada**: Todas las funciones, síntesis y análisis operan 100% offline |
| 14 | Intento de archivo incompatible | Intentar cargar archivo de texto o formato corrupto | **Superada**: Detección de error y mensaje explicativo al usuario |
| 15 | Medidores VU y protección contra clipping | Subir ganancias al máximo | **Superada**: Compresor/limitador maestro previene saturación |
| 16 | Teclado y ratón | Controlar Play con Barra Espaciadora, A, B, C, S, M, F, 1-8 | **Superada**: Respuesta inmediata sin interferir con inputs de texto |
| 17 | Modo Fiesta desatendido | Activar Auto DJ y dejar reproducir hasta el final de pista | **Superada**: Inicia transición automática 8s antes del término |
| 18 | Candado de seguridad | Activar seguridad e intentar detener el deck en el aire | **Superada**: Alerta emergente y bloqueo de acción accidental |

---

## 5. Atajos de Teclado Principales

- `Espacio`: Reproducir / Pausar el deck activo
- `A` / `B`: Cambiar el deck activo
- `S`: SYNC (Sincronizar BPM con el otro deck)
- `M`: MEZCLAR AHORA (Iniciar transición automática)
- `F`: FIN SUAVE (Salida progresiva del tema actual)
- `C`: Activar / Desactivar preescucha en auriculares del deck activo
- `1 al 8`: Saltar a Hot Cue 1-8 del deck activo
- `1 al 0` (en Soundboard): Disparar efectos de fiesta
- `Flechas Izq / Der`: Nudge / empuje suave del beat
- `Esc`: Silencio de emergencia

---

## 6. Guía Rápida de Solución de Problemas

1. **No se escucha sonido al pulsar Play**:
   - Los navegadores y Electron exigen una interacción previa del usuario (un clic en cualquier botón de la interfaz) antes de permitir al motor de audio iniciar el `AudioContext`.
2. **La música suena solo por un auricular en modo Split-Stereo**:
   - Esto es normal: el modo Split-Stereo envía la música general al canal izquierdo y los auriculares al canal derecho. Si no estás usando un cable divisor DJ, desactiva el modo Split-Stereo en la pestaña *Auriculares*.
3. **El análisis de BPM muestra la mitad o el doble del tempo real**:
   - Para temas de hip-hop o drum & bass lentos/rápidos, puedes usar el botón de TAP BPM para marcar el tempo manualmente pulsando 4 veces al ritmo de la música.
