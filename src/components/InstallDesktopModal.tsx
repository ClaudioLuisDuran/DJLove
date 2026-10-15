/**
 * Modal de Instalación en el Escritorio de la PC (Windows / Mac / Linux)
 * Permite instalar DJLove como aplicación de escritorio nativa PWA para uso 100% offline,
 * y ofrece instrucciones detalladas tanto para instalación en 1 clic como instalador de Windows.
 */

import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { DJLoveLogo } from './DJLoveLogo';
import {
  Monitor,
  Download,
  WifiOff,
  CheckCircle2,
  X,
  ExternalLink,
  Laptop,
  Layers,
  ArrowRight,
  ShieldCheck,
  HardDrive,
  Sparkles,
} from 'lucide-react';

interface InstallDesktopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallDesktopModal: React.FC<InstallDesktopModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isInIframe, isWindows, install } = usePWAInstall();
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setInstallSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    }
  };

  const handleOpenTopWindow = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-[#4EA8DE]/50 rounded-2xl shadow-2xl shadow-[#4EA8DE]/20 overflow-hidden text-neutral-100 max-h-[90vh] flex flex-col">
        {/* Cabecera con Logo DJLove y botón de cierre */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-lg bg-neutral-900 border border-[#4EA8DE]/40">
              <DJLoveLogo size={30} variant="icon" color="#4EA8DE" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Instalar DJLove en tu PC de Escritorio
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#4EA8DE]/20 text-[#4EA8DE] border border-[#4EA8DE]/40">
                  OFFLINE
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                Usa la consola como aplicación de escritorio nativa, sin conexión a Internet
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            title="Cerrar ventana"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Tarjeta de Ventajas Offline */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 text-center">
            <div className="flex flex-col items-center gap-1">
              <div className="p-2 rounded-lg bg-[#4EA8DE]/15 text-[#4EA8DE]">
                <WifiOff size={18} />
              </div>
              <span className="text-xs font-bold text-neutral-200">100% Offline</span>
              <span className="text-[10px] text-neutral-400 leading-tight">Funciona en cualquier fiesta sin WiFi ni datos</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="p-2 rounded-lg bg-[#4EA8DE]/15 text-[#4EA8DE]">
                <Monitor size={18} />
              </div>
              <span className="text-xs font-bold text-neutral-200">Icono en PC</span>
              <span className="text-[10px] text-neutral-400 leading-tight">Acceso directo en Escritorio y Barra de tareas</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="p-2 rounded-lg bg-[#4EA8DE]/15 text-[#4EA8DE]">
                <HardDrive size={18} />
              </div>
              <span className="text-xs font-bold text-neutral-200">Música Local</span>
              <span className="text-[10px] text-neutral-400 leading-tight">Carga tus archivos MP3, WAV y FLAC de tu disco</span>
            </div>
          </div>

          {/* Estado: Ya instalada */}
          {isInstalled && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
              <CheckCircle2 size={24} className="shrink-0 text-emerald-400" />
              <div className="text-xs">
                <strong className="block font-bold text-emerald-200">¡DJLove ya está instalada en tu equipo!</strong>
                <span className="text-[11px] text-neutral-300">
                  Ya puedes abrirla directamente desde el menú Inicio o el icono de tu escritorio de Windows cuando vayas a mezclar.
                </span>
              </div>
            </div>
          )}

          {/* Opción 1: Instalación Directa con 1 Clic (si el navegador emitió el evento) */}
          {isInstallable && !isInstalled && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#4EA8DE]/25 via-neutral-900 to-neutral-950 border-2 border-[#4EA8DE] flex flex-col gap-3 shadow-lg shadow-[#4EA8DE]/15">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Laptop size={16} className="text-[#4EA8DE]" />
                    Instalación Automática en 1 Clic
                  </h4>
                  <p className="text-[11px] text-neutral-300 mt-0.5">
                    Tu navegador está listo para instalar DJLove en tu PC ahora mismo:
                  </p>
                </div>
              </div>

              <button
                onClick={handleDirectInstall}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs bg-[#4EA8DE] hover:bg-[#38bdf8] text-black shadow-lg shadow-[#4EA8DE]/40 transition active:scale-95 cursor-pointer"
              >
                {installSuccess ? (
                  <>
                    <CheckCircle2 size={18} />
                    <span>¡Instalada con éxito! Abriendo en el escritorio...</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Instalar DJLove en el Escritorio de mi PC</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Aviso si está en iframe (previsualizador) */}
          {isInIframe && !isInstalled && (
            <div className="p-3.5 rounded-xl bg-[#4EA8DE]/10 border border-[#4EA8DE]/30 flex items-center justify-between gap-3">
              <div className="text-xs">
                <span className="font-bold text-[#4EA8DE] block flex items-center gap-1.5">
                  <Sparkles size={14} /> Para instalar en 1 clic desde tu navegador:
                </span>
                <span className="text-[11px] text-neutral-300">
                  Abre DJLove en una pestaña completa para que Windows o tu navegador muestre el botón de instalación oficial.
                </span>
              </div>
              <button
                onClick={handleOpenTopWindow}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#4EA8DE] hover:bg-[#38bdf8] text-black font-bold text-xs shrink-0 transition"
              >
                <span>Abrir en Pestaña</span>
                <ExternalLink size={14} />
              </button>
            </div>
          )}

          {/* Guía para Google Chrome, Microsoft Edge y Brave */}
          {!isInstalled && (
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs flex flex-col gap-2.5">
              <h4 className="font-bold text-neutral-200 flex items-center gap-2 text-xs">
                <Monitor size={15} className="text-[#4EA8DE]" />
                ¿Cómo instalarla desde tu navegador web en Windows?
              </h4>

              <div className="space-y-2 text-[11px] text-neutral-300">
                <div className="p-2.5 rounded-lg bg-neutral-900/90 border border-neutral-800 flex items-start gap-2.5">
                  <div className="p-1 rounded bg-[#4EA8DE]/15 text-[#4EA8DE] shrink-0 mt-0.5">
                    <Download size={14} />
                  </div>
                  <div>
                    <strong className="text-white block mb-0.5">En Google Chrome / Brave:</strong>
                    En la barra de direcciones superior a la derecha, haz clic en el icono <strong>Instalar DJLove</strong> (icono de monitor con flecha) o en el menú <strong>⋮</strong> &gt; <em>Guardar y compartir</em> &gt; <strong>Instalar aplicación DJLove</strong>.
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-neutral-900/90 border border-neutral-800 flex items-start gap-2.5">
                  <div className="p-1 rounded bg-sky-500/15 text-sky-400 shrink-0 mt-0.5">
                    <Monitor size={14} />
                  </div>
                  <div>
                    <strong className="text-white block mb-0.5">En Microsoft Edge:</strong>
                    Haz clic en el icono de <strong>Aplicación disponible (Instalar DJLove)</strong> en la barra de direcciones o en el menú <strong>...</strong> &gt; <em>Aplicaciones</em> &gt; <strong>Instalar este sitio como una aplicación</strong>.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Información del Instalador Electron para Windows (.exe) */}
          <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 text-[11px] text-neutral-300 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-neutral-200">
                <ShieldCheck size={16} className="text-[#4EA8DE]" />
                <span>Instalador nativo para Windows (.exe con Electron)</span>
              </div>
              <span className="text-[10px] font-mono text-[#4EA8DE] bg-[#4EA8DE]/10 px-2 py-0.5 rounded border border-[#4EA8DE]/30">
                Opcional
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              DJLove también incluye los archivos y configuración completa de Electron para empaquetar un instalador <strong>DJLove Setup.exe</strong> ejecutable en Windows.
            </p>
            <div className="flex items-center gap-2 bg-neutral-900 px-2.5 py-1.5 rounded-lg border border-neutral-800 font-mono text-[10px] text-neutral-300">
              <span className="text-neutral-500">$</span>
              <span>npm run package:win</span>
            </div>
          </div>
        </div>

        {/* Pie del modal */}
        <div className="flex items-center justify-between p-3.5 border-t border-neutral-800 bg-neutral-950/90 shrink-0">
          <span className="text-[10px] text-neutral-400">
            Una vez instalada, abre DJLove en cualquier momento sin internet.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
