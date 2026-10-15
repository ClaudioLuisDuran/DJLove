/**
 * Componente oficial de logotipo DJLove
 * Vectorización fiel al diseño original del usuario:
 * Vinilos dobles entrelazados con surcos de movimiento y centro celeste (#4EA8DE),
 * aro central de unión y tipografía DJLove.
 */

import React from 'react';

interface DJLoveLogoProps {
  className?: string;
  size?: number; // Altura o tamaño base
  variant?: 'full' | 'icon' | 'horizontal';
  color?: string;
}

export const DJLoveLogo: React.FC<DJLoveLogoProps> = ({
  className = '',
  size = 40,
  variant = 'horizontal',
  color = '#4EA8DE',
}) => {
  // Solo el icono de los dos vinilos
  if (variant === 'icon') {
    return (
      <svg
        width={size * 1.5}
        height={size}
        viewBox="90 95 320 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        {/* Vinilo Izquierdo */}
        <circle cx="175" cy="185" r="75" stroke={color} strokeWidth="8" />
        <path d="M 120 120 C 138 112 165 110 185 110" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M 125 132 C 142 125 168 123 185 123" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M 135 145 C 150 140 170 138 185 138" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M 112 250 C 135 264 165 272 195 272" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M 108 262 C 130 276 160 284 190 284" stroke={color} strokeWidth="4.5" strokeLinecap="round" />

        {/* Vinilo Derecho */}
        <circle cx="325" cy="185" r="75" stroke={color} strokeWidth="8" />
        <path d="M 315 110 C 335 110 362 112 380 120" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M 315 123 C 332 123 358 125 375 132" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M 315 138 C 330 138 350 140 365 145" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M 305 272 C 335 272 365 264 388 250" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M 310 284 C 340 284 370 276 392 262" stroke={color} strokeWidth="4.5" strokeLinecap="round" />

        {/* Centro de vinilo izquierdo */}
        <circle cx="175" cy="185" r="28" fill={color} />
        <circle cx="175" cy="185" r="5" fill="#FFFFFF" />

        {/* Centro de vinilo derecho */}
        <circle cx="325" cy="185" r="28" fill={color} />
        <circle cx="325" cy="185" r="5" fill="#FFFFFF" />

        {/* Aro Central Enlazado (Love) */}
        <circle cx="250" cy="185" r="37" fill="#0A0E17" />
        <circle cx="250" cy="185" r="37" stroke={color} strokeWidth="8" />
      </svg>
    );
  }

  // Completo vertical (gráfico + texto)
  if (variant === 'full') {
    return (
      <div className={`inline-flex flex-col items-center select-none ${className}`}>
        <svg
          width={size * 1.3}
          height={size * 1.3}
          viewBox="0 0 500 440"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Vinilo Izquierdo */}
          <circle cx="175" cy="185" r="75" stroke={color} strokeWidth="9" />
          <path d="M 120 120 C 138 112 165 110 185 110" stroke={color} strokeWidth="5" strokeLinecap="round" />
          <path d="M 125 132 C 142 125 168 123 185 123" stroke={color} strokeWidth="5" strokeLinecap="round" />
          <path d="M 135 145 C 150 140 170 138 185 138" stroke={color} strokeWidth="5" strokeLinecap="round" />
          <path d="M 112 250 C 135 264 165 272 195 272" stroke={color} strokeWidth="5" strokeLinecap="round" />
          <path d="M 108 262 C 130 276 160 284 190 284" stroke={color} strokeWidth="5" strokeLinecap="round" />

          {/* Vinilo Derecho */}
          <circle cx="325" cy="185" r="75" stroke={color} strokeWidth="9" />
          <path d="M 315 110 C 335 110 362 112 380 120" stroke={color} strokeWidth="5" strokeLinecap="round" />
          <path d="M 315 123 C 332 123 358 125 375 132" stroke={color} strokeWidth="5" strokeLinecap="round" />
          <path d="M 315 138 C 330 138 350 140 365 145" stroke={color} strokeWidth="5" strokeLinecap="round" />
          <path d="M 305 272 C 335 272 365 264 388 250" stroke={color} strokeWidth="5" strokeLinecap="round" />
          <path d="M 310 284 C 340 284 370 276 392 262" stroke={color} strokeWidth="5" strokeLinecap="round" />

          {/* Centro izquierdo */}
          <circle cx="175" cy="185" r="28" fill={color} />
          <circle cx="175" cy="185" r="5" fill="#FFFFFF" />

          {/* Centro derecho */}
          <circle cx="325" cy="185" r="28" fill={color} />
          <circle cx="325" cy="185" r="5" fill="#FFFFFF" />

          {/* Aro Central */}
          <circle cx="250" cy="185" r="37" fill="#0A0E17" />
          <circle cx="250" cy="185" r="37" stroke={color} strokeWidth="9" />

          {/* Texto DJLove */}
          <text
            x="250"
            y="370"
            textAnchor="middle"
            fill={color}
            fontSize="80"
            fontWeight="500"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="-1.5px"
          >
            DJLove
          </text>
        </svg>
      </div>
    );
  }

  // Variante horizontal: icono vinilos + tipografía DJLove
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={size * 1.55}
        height={size}
        viewBox="90 95 320 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-[0_0_8px_rgba(78,168,222,0.3)]"
      >
        {/* Vinilo Izquierdo */}
        <circle cx="175" cy="185" r="75" stroke={color} strokeWidth="8" />
        <path d="M 120 120 C 138 112 165 110 185 110" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M 125 132 C 142 125 168 123 185 123" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M 135 145 C 150 140 170 138 185 138" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M 112 250 C 135 264 165 272 195 272" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M 108 262 C 130 276 160 284 190 284" stroke={color} strokeWidth="4.5" strokeLinecap="round" />

        {/* Vinilo Derecho */}
        <circle cx="325" cy="185" r="75" stroke={color} strokeWidth="8" />
        <path d="M 315 110 C 335 110 362 112 380 120" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M 315 123 C 332 123 358 125 375 132" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M 315 138 C 330 138 350 140 365 145" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M 305 272 C 335 272 365 264 388 250" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M 310 284 C 340 284 370 276 392 262" stroke={color} strokeWidth="4.5" strokeLinecap="round" />

        {/* Centro de vinilo izquierdo */}
        <circle cx="175" cy="185" r="28" fill={color} />
        <circle cx="175" cy="185" r="5" fill="#FFFFFF" />

        {/* Centro de vinilo derecho */}
        <circle cx="325" cy="185" r="28" fill={color} />
        <circle cx="325" cy="185" r="5" fill="#FFFFFF" />

        {/* Aro Central Enlazado (Love) */}
        <circle cx="250" cy="185" r="37" fill="#0A0E17" />
        <circle cx="250" cy="185" r="37" stroke={color} strokeWidth="8" />
      </svg>

      <div className="flex items-baseline">
        <span
          className="text-xl font-bold tracking-tight"
          style={{
            color,
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            letterSpacing: '-0.5px',
          }}
        >
          DJ<span className="font-light text-white">Love</span>
        </span>
      </div>
    </div>
  );
};
