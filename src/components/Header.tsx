/**
 * Componente Cabecera (Header) de FIESTA MIX
 * Marca de la app, selector de pestañas inferiores, volumen general,
 * preescucha Master, modo claro/oscuro y parada de emergencia.
 */

import React from 'react';
import { APP_CONFIG } from '../config/appConfig';
import {
  Disc,
  Music,
  Sliders,
  Volume2,
  Headphones,
  Sun,
  Moon,
  Keyboard,
  Radio,
  Sparkles,
  ShieldAlert,
  Settings,
  Download,
  Laptop,
} from 'lucide-react';
import { DJLoveLogo } from './DJLoveLogo';

interface HeaderProps {
  currentTab: 'library' | 'soundboard' | 'autodj' | 'audio' | 'shortcuts';
  onSelectTab: (tab: 'library' | 'soundboard' | 'autodj' | 'audio' | 'shortcuts') => void;
  masterVolume: number;
  onSetMasterVolume: (val: number) => void;
  headphoneVolume: number;
  onSetHeadphoneVolume: (val: number) => void;
  headphoneCueMix: number;
  onSetHeadphoneCueMix: (val: number) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onEmergencySilence: () => void;
  isPartyModeActive: boolean;
  onOpenInstallModal: () => void;
  isInstalled?: boolean;
  isInstallable?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  masterVolume,
  onSetMasterVolume,
  headphoneVolume,
  onSetHeadphoneVolume,
  headphoneCueMix,
  onSetHeadphoneCueMix,
  theme,
  onToggleTheme,
  onEmergencySilence,
  isPartyModeActive,
  onOpenInstallModal,
  isInstalled = false,
  isInstallable = false,
}) => {
  return (
    <header className="relative flex items-center justify-between gap-4 px-4 py-2.5 bg-neutral-900/95 backdrop-blur-md border-b border-[#4EA8DE]/25 text-white select-none shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      {/* Línea ambiental celeste superior para unificar el diseño */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#4EA8DE]/70 to-transparent pointer-events-none" />

      {/* Zona 1: Logotipo Oficial DJLove y Marca */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="/"
          className="flex items-center gap-2 p-1 rounded-xl bg-neutral-950/80 border border-[#4EA8DE]/30 hover:border-[#4EA8DE]/70 shadow-md shadow-[#4EA8DE]/15 hover:shadow-[#4EA8DE]/25 transition duration-200 group"
          title="DJLove — Consola de DJ Offline"
        >
          <DJLoveLogo size={30} variant="horizontal" color={APP_CONFIG.brandColor} />
        </a>

        {/* Metadatos limpios y versión */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-semibold text-[#4EA8DE] bg-[#4EA8DE]/10 px-2 py-0.5 rounded border border-[#4EA8DE]/30 tracking-tight">
            v{APP_CONFIG.version}
          </span>
          <span className="text-[11px] text-neutral-400 hidden lg:inline tracking-tight font-medium">
            Consola DJ Offline · 100% Local
          </span>
        </div>
      </div>

      {/* Zona 2: Selector de Vistas de Trabajo */}
      <nav className="flex items-center gap-1 bg-neutral-950/90 p-1 rounded-xl border border-neutral-800/90 shadow-inner">
        <button
          onClick={() => onSelectTab('library')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
            currentTab === 'library'
              ? 'bg-[#4EA8DE]/15 text-[#4EA8DE] border border-[#4EA8DE]/40 shadow-sm shadow-[#4EA8DE]/20 font-bold'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent'
          }`}
        >
          <Music size={14} className={currentTab === 'library' ? 'text-[#4EA8DE]' : ''} />
          <span>Biblioteca</span>
        </button>

        <button
          onClick={() => onSelectTab('soundboard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
            currentTab === 'soundboard'
              ? 'bg-orange-500/15 text-orange-400 border border-orange-500/40 shadow-sm shadow-orange-500/20 font-bold'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent'
          }`}
        >
          <Sparkles size={14} className={currentTab === 'soundboard' ? 'text-orange-400' : ''} />
          <span>Soundboard</span>
        </button>

        <button
          onClick={() => onSelectTab('autodj')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
            currentTab === 'autodj'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20 font-bold'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent'
          }`}
        >
          <Radio size={14} className={isPartyModeActive ? 'animate-pulse text-emerald-400' : currentTab === 'autodj' ? 'text-emerald-400' : ''} />
          <span>Modo Fiesta</span>
        </button>

        <button
          onClick={() => onSelectTab('audio')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
            currentTab === 'audio'
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-sm shadow-amber-500/20 font-bold'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent'
          }`}
        >
          <Headphones size={14} className={currentTab === 'audio' ? 'text-amber-400' : ''} />
          <span>Auriculares</span>
        </button>

        <button
          onClick={() => onSelectTab('shortcuts')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
            currentTab === 'shortcuts'
              ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm font-bold'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent'
          }`}
        >
          <Keyboard size={14} />
          <span className="hidden md:inline">Atajos</span>
        </button>
      </nav>

      {/* Zona 3: Controles de Master, Auriculares, Instalación y Seguridad */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* BOTÓN DESTACADO: Instalar en PC (Offline) */}
        <button
          onClick={onOpenInstallModal}
          title={
            isInstalled
              ? 'DJLove está instalada en tu PC (Funciona 100% Offline)'
              : 'Instalar DJLove en el Escritorio de tu PC para usarla 100% Offline'
          }
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-md active:scale-95 cursor-pointer ${
            isInstalled
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-[#4EA8DE] hover:bg-[#38bdf8] text-black border border-[#4EA8DE] shadow-[#4EA8DE]/25 hover:shadow-[#4EA8DE]/40'
          }`}
        >
          {isInstalled ? (
            <>
              <Laptop size={14} className="text-emerald-300" />
              <span className="hidden sm:inline">Instalada en PC</span>
              <span className="sm:hidden">Instalada</span>
            </>
          ) : (
            <>
              <Download size={14} className="stroke-[2.5]" />
              <span>Instalar en PC</span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-black/30 text-black uppercase">
                Offline
              </span>
            </>
          )}
        </button>

        {/* Volumen Master con acento celeste */}
        <div className="hidden lg:flex items-center gap-2 bg-neutral-950/80 px-2.5 py-1.5 rounded-lg border border-[#4EA8DE]/25 shadow-sm">
          <Volume2 size={14} className="text-[#4EA8DE]" />
          <span className="text-[10px] font-mono font-bold text-[#4EA8DE]">MASTER</span>
          <input
            type="range"
            min={0}
            max={1.2}
            step={0.02}
            value={masterVolume}
            onChange={(e) => onSetMasterVolume(parseFloat(e.target.value))}
            className="w-16 h-1.5 accent-[#4EA8DE] cursor-pointer"
            title="Volumen General Master"
          />
        </div>

        {/* Volumen Auriculares */}
        <div className="hidden xl:flex items-center gap-2 bg-neutral-950/80 px-2.5 py-1.5 rounded-lg border border-neutral-800">
          <Headphones size={14} className="text-amber-400" />
          <span className="text-[10px] font-mono text-neutral-400">AURIC</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={headphoneVolume}
            onChange={(e) => onSetHeadphoneVolume(parseFloat(e.target.value))}
            className="w-16 h-1.5 accent-amber-400 cursor-pointer"
            title="Volumen de Auriculares (CUE)"
          />
        </div>

        {/* Botón Silencio de Emergencia */}
        <button
          onClick={onEmergencySilence}
          title="CORTE DE EMERGENCIA: Baja el volumen suavemente y detiene todo (tecla Esc)"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600 hover:text-white transition active:scale-95 shadow-sm"
        >
          <ShieldAlert size={14} />
          <span className="hidden sm:inline">EMERGENCIA</span>
        </button>

        {/* Modo Claro / Oscuro */}
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 transition"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
};
