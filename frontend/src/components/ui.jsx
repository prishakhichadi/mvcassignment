import React from 'react';

export const tokens = {
  ink: '#14170f',
  panel: '#232a1b',
  panelRaised: '#2e3722',
  panelSunken: '#1a2013',

  line: '#495a34',
  lineSoft: '#37421f',
  lineStrong: '#6d8149',

  text: '#ece4c8',
  textDim: '#a6a184',
  textFaint: '#6f7358',

  brass: '#c99a3f',
  brassDim: '#6b4f22',
  brassSoft: 'rgba(201, 154, 63, 0.14)',

  clay: '#a35c34',
  clayDark: '#7d4426',
  clayHover: '#b76a3d',

  moss: '#5c7a3f',
  mossDark: '#3f5629',
  mossSoft: 'rgba(92, 122, 63, 0.16)',

  berry: '#8a4a5f',
  berryDim: '#4a2530',
  berrySoft: 'rgba(138, 74, 95, 0.18)',

  rust: '#a8402f',
  rustDim: '#3c1f19',
  rustSoft: 'rgba(168, 64, 47, 0.16)',

  fontDisplay: "'Cinzel', Georgia, serif",
  fontBody: "'Karla', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontMono: "'JetBrains Mono', ui-monospace, Consolas, monospace",

  radiusSm: '3px',
  radiusMd: '5px',
  radiusLg: '8px',
  shadowPanel: '0 6px 20px rgba(0, 0, 0, 0.35)',
  shadowInset: 'inset 0 2px 6px rgba(0, 0, 0, 0.35)',
};


export const colors = {
  bgDark: tokens.ink,
  bgCard: tokens.panel,
  bgCardRaised: tokens.panelRaised,
  bgSunken: tokens.panelSunken,
  border: tokens.line,
  borderSoft: tokens.lineSoft,
  borderStrong: tokens.lineStrong,
  textMain: tokens.text,
  textDim: tokens.textDim,
  textFaint: tokens.textFaint,

  purple: tokens.clay,         
  purpleLight: tokens.brass,    

  gold: tokens.brass,
  goldDim: tokens.brassDim,
  elixir: tokens.berry,
  elixirDim: tokens.berryDim,
  danger: tokens.rust,
  dangerDim: tokens.rustDim,
  success: tokens.moss,
  successDim: tokens.mossSoft,

  grass: '#3c4d28',
  grassDark: '#2f3d1f',
  grassPath: '#4a5c32',
  buildingFill: '#7d6a4a',
  hpBg: '#2a1414',
  hpFill: tokens.moss,
  hpFillLow: tokens.rust,
};

/* ============================================================
   Card / Panel
   ============================================================ */
export function Card({ children, style, padding = 20, raised = false }) {
  return (
    <div
      style={{
        backgroundColor: raised ? tokens.panelRaised : tokens.panel,
        border: '1px solid ' + tokens.line,
        borderRadius: tokens.radiusLg,
        boxShadow: tokens.shadowPanel,
        padding: padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}


export function Button({ variant = 'primary', disabled = false, fullWidth = false, style, children, ...rest }) {
  const variants = {
    primary: {
      backgroundColor: disabled ? tokens.lineSoft : tokens.clay,
      color: '#fbf3e2',
      border: '1px solid ' + (disabled ? tokens.line : tokens.clayDark),
    },
    secondary: {
      backgroundColor: 'transparent',
      color: tokens.text,
      border: '1px solid ' + tokens.line,
    },
    danger: {
      backgroundColor: disabled ? tokens.lineSoft : 'transparent',
      color: tokens.rust,
      border: '1px solid ' + tokens.rust,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: tokens.textDim,
      border: '1px solid transparent',
    },
  };

  return (
    <button
      disabled={disabled}
      style={{
        fontFamily: tokens.fontBody,
        fontWeight: 700,
        fontSize: '13px',
        letterSpacing: '0.03em',
        padding: '11px 18px',
        borderRadius: tokens.radiusMd,
        cursor: disabled ? 'not-allowed' : 'pointer',
        width: fullWidth ? '100%' : 'auto',
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
        ...variants[variant],
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}


export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      {label ? (
        <label style={{
          display: 'block',
          fontFamily: tokens.fontBody,
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: tokens.textDim,
          marginBottom: '7px',
        }}>
          {label}
        </label>
      ) : null}
      {children}
    </div>
  );
}

const inputBase = {
  width: '100%',
  padding: '11px 13px',
  backgroundColor: tokens.panelSunken,
  border: '1px solid ' + tokens.line,
  borderRadius: tokens.radiusMd,
  color: tokens.text,
  fontFamily: tokens.fontBody,
  fontSize: '14px',
  boxSizing: 'border-box',
};

export function TextInput(props) {
  return <input {...props} style={{ ...inputBase, ...(props.style || {}) }} />;
}

export function Select({ children, ...rest }) {
  return <select {...rest} style={{ ...inputBase, ...(rest.style || {}) }}>{children}</select>;
}


export function Badge({ children, tone = 'brass', style }) {
  const tones = {
    brass: { color: tokens.brass, border: tokens.brassDim, bg: tokens.brassSoft },
    berry: { color: tokens.berry, border: tokens.berryDim, bg: tokens.berrySoft },
    moss: { color: tokens.moss, border: tokens.mossDark, bg: tokens.mossSoft },
    rust: { color: tokens.rust, border: tokens.rustDim, bg: tokens.rustSoft },
    dim: { color: tokens.textDim, border: tokens.line, bg: 'transparent' },
  };
  const t = tones[tone] || tones.brass;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: tokens.radiusMd,
      border: '1px solid ' + t.border,
      backgroundColor: t.bg,
      color: t.color,
      fontWeight: 700,
      fontSize: '13px',
      ...style,
    }}>
      {children}
    </span>
  );
}


export function PageHeading({ eyebrow, title, subtitle }) {
  return (
    <div style={{ marginBottom: '22px' }}>
      {eyebrow ? (
        <div style={{
          fontFamily: tokens.fontBody,
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: tokens.brass,
          marginBottom: '6px',
        }}>
          {eyebrow}
        </div>
      ) : null}
      <h2 style={{ fontFamily: tokens.fontDisplay, fontSize: '22px', margin: 0, color: tokens.text }}>
        {title}
      </h2>
      {subtitle ? (
        <p style={{ color: tokens.textDim, fontSize: '13px', marginTop: '6px' }}>{subtitle}</p>
      ) : null}
    </div>
  );
}

/* ============================================================
   Callout — status/error/success message strip, one shared shape
   ============================================================ */
export function Callout({ tone = 'rust', children }) {
  const tones = {
    rust: { bg: tokens.rustDim, border: tokens.rust, color: '#f0b3a6' },
    moss: { bg: tokens.mossSoft, border: tokens.moss, color: '#cfe0b8' },
    brass: { bg: tokens.brassSoft, border: tokens.brass, color: '#f0d9a3' },
  };
  const t = tones[tone] || tones.rust;
  return (
    <div style={{
      backgroundColor: t.bg,
      border: '1px solid ' + t.border,
      color: t.color,
      padding: '11px 14px',
      borderRadius: tokens.radiusMd,
      fontSize: '13px',
      marginBottom: '16px',
    }}>
      {children}
    </div>
  );
}


export const TILE_COLORS = {
  empty: { bg: '#2a3320', border: '#3d4a2a' },
  Cannon: { bg: '#4a2620', border: '#6e392f' },
  TownHall: { bg: '#2c3a26', border: '#496338' },
  Barracks: { bg: '#3a3320', border: '#5c5030' },
  building: { bg: '#7d6a4a', border: 'rgba(0,0,0,0.35)' },
  troop: { bg: tokens.clay, border: tokens.clayHover },
};

export function tileColorFor(name) {
  return TILE_COLORS[name] || TILE_COLORS.building;
}

export function Tile({ size = 52, filled = false, colorKey = 'empty', selectable = false, onClick, title, children }) {
  const c = tileColorFor(colorKey);
  return (
    <div
      title={title}
      onClick={onClick}
      style={{
        width: size + 'px',
        height: size + 'px',
        backgroundColor: filled ? c.bg : TILE_COLORS.empty.bg,
        border: '1px solid ' + (filled ? c.border : TILE_COLORS.empty.border),
        borderRadius: tokens.radiusSm,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: selectable ? 'pointer' : 'default',
        userSelect: 'none',
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
      }}
    >
      {children}
    </div>
  );
}


const TROOP_PORTRAITS = {
  Barbarian: new URL('../assets/troops/barbarian.jpg', import.meta.url).href,
  Archer: new URL('../assets/troops/archer.jpg', import.meta.url).href,
  Goblin: new URL('../assets/troops/goblin.jpg', import.meta.url).href,
  'Wall Breaker': new URL('../assets/troops/wallbreaker.jpg', import.meta.url).href,
};

export function TroopPortrait({ name, size = 40, fallback }) {
  const src = TROOP_PORTRAITS[name];
  if (!src) {
    return (
      <div style={{
        width: size, height: size, borderRadius: tokens.radiusSm,
        backgroundColor: tokens.panelSunken, border: '1px solid ' + tokens.line,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {fallback}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      style={{
        width: size, height: size, objectFit: 'cover', objectPosition: 'top center',
        borderRadius: tokens.radiusSm, border: '1px solid ' + tokens.line, flexShrink: 0,
        backgroundColor: tokens.panelSunken,
      }}
    />
  );
}
