/**
 * Configuración centralizada de FIESTA MIX
 * Permite cambiar el nombre, datos y valores predeterminados desde un único lugar.
 */

export const APP_CONFIG = {
  name: 'DJLove',
  tagline: 'Consola de DJ Offline para Notebooks y Fiestas',
  version: '1.0.0',
  author: 'DJLove Audio Team',
  website: 'https://djlove.local',
  brandColor: '#4EA8DE', // Color celeste oficial del logo DJLove
  license: 'MIT',
  offlineReady: true,
  defaultBpmRange: 16 as const,
  supportedFormats: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/x-m4a', 'audio/aac'],
  supportedExtensions: ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac'],
  hotCueColors: [
    '#EF4444', // 1: Rojo
    '#F97316', // 2: Naranja
    '#F59E0B', // 3: Ámbar
    '#10B981', // 4: Esmeralda
    '#06B6D4', // 5: Cian
    '#3B82F6', // 6: Azul
    '#8B5CF6', // 7: Violeta
    '#EC4899', // 8: Rosa
  ],
  defaultSoundboard: [
    { id: 'sfx_horn', name: 'Bocina Reggae', category: 'party', hotkey: '1', volume: 0.9, color: '#EF4444', soundType: 'airhorn' },
    { id: 'sfx_applause', name: 'Aplausos & Fiesta', category: 'crowd', hotkey: '2', volume: 0.85, color: '#10B981', soundType: 'applause' },
    { id: 'sfx_drumroll', name: 'Redoble Tambores', category: 'rhythm', hotkey: '3', volume: 0.9, color: '#F59E0B', soundType: 'drumroll' },
    { id: 'sfx_crash', name: 'Plato / Remate', category: 'rhythm', hotkey: '4', volume: 0.85, color: '#3B82F6', soundType: 'crash' },
    { id: 'sfx_whistle', name: 'Silbato Carnaval', category: 'party', hotkey: '5', volume: 0.8, color: '#EC4899', soundType: 'whistle' },
    { id: 'sfx_countdown', name: 'Cuenta 3-2-1', category: 'party', hotkey: '6', volume: 0.9, color: '#8B5CF6', soundType: 'countdown' },
    { id: 'sfx_siren', name: 'Sirena Riser', category: 'party', hotkey: '7', volume: 0.85, color: '#06B6D4', soundType: 'siren' },
    { id: 'sfx_scratch', name: 'Scratch Vinilo', category: 'rhythm', hotkey: '8', volume: 0.85, color: '#F97316', soundType: 'scratch' },
    { id: 'sfx_boing', name: 'Efecto Cómico', category: 'comic', hotkey: '9', volume: 0.8, color: '#14B8A6', soundType: 'boing' },
    { id: 'sfx_subdrop', name: 'Sub Drop 808', category: 'party', hotkey: '0', volume: 0.95, color: '#6366F1', soundType: 'subdrop' },
  ],
  keyboardShortcuts: [
    { key: 'Espacio', action: 'Reproducir / Pausar el Deck activo' },
    { key: 'A', action: 'Seleccionar Deck A como activo' },
    { key: 'B', action: 'Seleccionar Deck B como activo' },
    { key: 'C', action: 'Alternar Preescucha (CUE) de auriculares del deck activo' },
    { key: 'S', action: 'SYNC: Sincronizar BPM del deck activo con el opuesto' },
    { key: 'M', action: 'MEZCLAR AHORA: Iniciar transición automática' },
    { key: 'F', action: 'FIN SUAVE: Salida progresiva sin corte' },
    { key: 'Q', action: 'CUE: Saltar al punto de inicio / mantener para tocar' },
    { key: '1 al 8', action: 'Saltar a Hot Cue 1-8 del deck activo (Shift + Num para borrar)' },
    { key: 'Flechas Izq / Der', action: 'Nudge / Empuje suave del beat (+/- tempo momentáneo)' },
    { key: 'Shift + Flechas', action: 'Salto rápido 5 segundos en la canción' },
    { key: 'Esc', action: 'Silencio de Emergencia (detiene soundboard y baja música)' },
  ],
};
