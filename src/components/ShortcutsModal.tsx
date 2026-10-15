/**
 * Componente de Atajos de Teclado & Guía Rápida para FIESTA MIX
 * Proporciona la referencia completa de teclas rápidas y consejos para pinchar en fiestas.
 */

import React from 'react';
import { APP_CONFIG } from '../config/appConfig';
import { Keyboard, HelpCircle, Lightbulb, Music } from 'lucide-react';

export const ShortcutsModal: React.FC = () => {
  return (
    <div className="flex flex-col h-72 bg-neutral-900 border border-neutral-800 rounded-xl p-3 shadow-xl overflow-y-auto text-neutral-200">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-blue-500/20 text-blue-400">
            <Keyboard size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Atajos de Teclado & Guía de Fiesta
            </h3>
            <p className="text-[10px] text-neutral-400">
              Controla la consola de DJ rápidamente sin necesidad de tocar el ratón
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Tabla de atajos */}
        <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
          <span className="text-[10px] font-mono text-neutral-400 uppercase block mb-2">
            TECLAS RÁPIDAS
          </span>
          <div className="space-y-1.5">
            {APP_CONFIG.keyboardShortcuts.map((sc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-1 px-2 rounded bg-neutral-900/60 border border-neutral-800/60"
              >
                <span className="text-neutral-300">{sc.action}</span>
                <kbd className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-800 text-[#4EA8DE] border border-neutral-700">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Consejos para animar la fiesta */}
        <div className="flex flex-col gap-3 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
          <span className="text-[10px] font-mono text-neutral-400 uppercase">
            CONSEJOS DE MEZCLA PARA PRINCIPIANTES
          </span>

          <div className="flex items-start gap-2 text-xs text-neutral-300">
            <Lightbulb size={16} className="text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block">Transición Limpia (Bass Swap):</strong>
              Nunca dejes los graves (LOW) de ambas canciones al 100% a la vez para evitar saturación. Usa el botón "MEZCLAR AHORA" con modo Bass Swap o corta los graves de la canción saliente.
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-neutral-300">
            <Music size={16} className="text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block">Sincronización Inteligente (SYNC):</strong>
              Pulsa SYNC en el deck entrante para igualar automáticamente los BPM al tema que está bailando la gente.
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-neutral-300">
            <HelpCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block">Terminar sin cortes bruscos:</strong>
              Si la fiesta necesita un cambio de ritmo o vas a hablar por micrófono, pulsa "FIN SUAVE" para que la música baje con una rampa elegante.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
