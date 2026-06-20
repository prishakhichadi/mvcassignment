import React from 'react';

export const colors = {
  bgDark: '#15172a',
  bgCard: '#1f2138',
  bgCardRaised: '#272a47',
  border: '#363a5c',
  textMain: '#e8e8f0',
  textDim: '#8a8caa',
  purple: '#5b4fcf',
  purpleLight: '#a78bfa',
  gold: '#e8b339',
  goldDim: '#7a6228',
  elixir: '#b06fe0',
  elixirDim: '#5a3870',
  danger: '#e8615c',
  dangerDim: '#3d1f1f',
  success: '#5cd97a',
  successDim: '#1a3d22',
  grass: '#5c8a45',
  grassDark: '#517b3d',
  grassPath: '#6f9456',
  buildingFill: '#7d6a4a',
  hpBg: '#2a1414',
  hpFill: '#5cd97a',
  hpFillLow: '#e8615c',
};

export function IconGold({ size = 16, color = colors.gold }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <ellipse cx="12" cy="7" rx="8" ry="4" fill={color} opacity="0.5" />
      <path d="M4 7v5c0 2.2 3.6 4 8 4s8-1.8 8-4V7" fill={color} opacity="0.7" />
      <path d="M4 12v5c0 2.2 3.6 4 8 4s8-1.8 8-4v-5" fill={color} />
      <ellipse cx="12" cy="7" rx="8" ry="4" stroke={color} strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export function IconElixir({ size = 16, color = colors.elixir }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M9 2h6v4.2c0 .5.2 1 .55 1.35l4.1 4.3A6 6 0 0 1 15.5 22h-7a6 6 0 0 1-4.15-10.15l4.1-4.3c.35-.35.55-.85.55-1.35V2Z"
        fill={color}
        opacity="0.85"
      />
      <path d="M5.2 15.5a6 6 0 0 0 13.6 0c-2 1.4-4.2 1-6.8 1s-4.8.4-6.8-1Z" fill="#fff" opacity="0.18" />
      <path d="M9 2h6" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconShield({ size = 16, color = colors.textMain }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2.5 19.5 5.5V11c0 5-3.2 8.7-7.5 10.5C7.7 19.7 4.5 16 4.5 11V5.5L12 2.5Z" fill={color} opacity="0.85" />
      <path d="M12 2.5 19.5 5.5V11c0 5-3.2 8.7-7.5 10.5" fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
    </svg>
  );
}

export function IconTrophy({ size = 16, color = colors.gold }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7 3h10v6a5 5 0 0 1-10 0V3Z" fill={color} />
      <path d="M7 4H4v2a4 4 0 0 0 3.6 4" fill="none" stroke={color} strokeWidth="1.3" />
      <path d="M17 4h3v2a4 4 0 0 1-3.6 4" fill="none" stroke={color} strokeWidth="1.3" />
      <rect x="10" y="14" width="4" height="3" fill={color} />
      <rect x="7" y="18" width="10" height="2.4" rx="1" fill={color} />
    </svg>
  );
}

export function IconStar({ size = 16, color = colors.gold, filled = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2.5 14.9 9 22 9.6 16.6 14 18.3 21 12 17.2 5.7 21 7.4 14 2 9.6 9.1 9Z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth="1.3"
      />
    </svg>
  );
}

export function IconCrosshair({ size = 16, color = colors.danger }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.4" fill={color} />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconScroll({ size = 16, color = colors.textMain }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="5" width="16" height="14" rx="2" fill={color} opacity="0.85" />
      <rect x="6.5" y="8" width="11" height="1.4" fill={colors.bgDark} opacity="0.4" />
      <rect x="6.5" y="11" width="11" height="1.4" fill={colors.bgDark} opacity="0.4" />
      <rect x="6.5" y="14" width="7" height="1.4" fill={colors.bgDark} opacity="0.4" />
    </svg>
  );
}

export function IconHouse({ size = 16, color = colors.textMain }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 11 12 4l8 7" stroke={color} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
      <path d="M6 10v9h12v-9" fill={color} opacity="0.85" />
    </svg>
  );
}

export function IconSwords({ size = 16, color = colors.textMain }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 21 11 13M21 3l-8 8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3 3l4 1 1 4-2 2-4-1Z" fill={color} />
      <path d="M21 21l-4-1-1-4 2-2 4 1Z" fill={color} />
    </svg>
  );
}



export const BUILDING_DEFS = [
  {
    key: 'Cannon', label: 'Cannon', icon: 'cannon', townLevelRequired: 1,
    levels: [
      { level: 1, hp: 400, dps: 9, cost: 250 },
      { level: 2, hp: 450, dps: 11, cost: 500 },
      { level: 3, hp: 500, dps: 15, cost: 1000 },
      { level: 4, hp: 570, dps: 19, cost: 2000 },
    ],
  },
  {
    key: 'Archer Tower', label: 'Archer Tower', icon: 'archerTower', townLevelRequired: 2,
    levels: [
      { level: 1, hp: 380, dps: 11, cost: 1000 },
      { level: 2, hp: 420, dps: 14, cost: 2000 },
      { level: 3, hp: 460, dps: 17, cost: 4000 },
      { level: 4, hp: 510, dps: 20, cost: 8000 },
    ],
  },
  {
    key: 'Air Defense', label: 'Air Defense', icon: 'airDefense', townLevelRequired: 3,
    levels: [
      { level: 1, hp: 800, dps: 20, cost: 4000 },
      { level: 2, hp: 900, dps: 30, cost: 8000 },
      { level: 3, hp: 1000, dps: 40, cost: 16000 },
      { level: 4, hp: 1100, dps: 50, cost: 32000 },
    ],
  },
];

export const TOWN_HALL_LEVELS = [
  { level: 1, hp: 1500, capacityGold: 1000 },
  { level: 2, hp: 1600, capacityGold: 2500 },
  { level: 3, hp: 1850, capacityGold: 5000 },
  { level: 4, hp: 2100, capacityGold: 10000 },
];

export const TROOP_DEFS = [
  {
    key: 'Barbarian', label: 'Barbarian', icon: 'barbarian', space: 1,
    levels: [
      { level: 1, hp: 45, dps: 8, cost: 25 },
      { level: 2, hp: 54, dps: 11, cost: 40 },
      { level: 3, hp: 65, dps: 14, cost: 60 },
      { level: 4, hp: 78, dps: 18, cost: 100 },
    ],
  },
  {
    key: 'Archer', label: 'Archer', icon: 'archer', space: 1,
    levels: [
      { level: 1, hp: 20, dps: 7, cost: 50 },
      { level: 2, hp: 23, dps: 9, cost: 80 },
      { level: 3, hp: 28, dps: 12, cost: 120 },
      { level: 4, hp: 33, dps: 16, cost: 200 },
    ],
  },
  {
    key: 'Goblin', label: 'Goblin', icon: 'goblin', space: 1,
    levels: [
      { level: 1, hp: 25, dps: 11, cost: 25 },
      { level: 2, hp: 30, dps: 14, cost: 40 },
      { level: 3, hp: 36, dps: 19, cost: 70 },
      { level: 4, hp: 43, dps: 24, cost: 120 },
    ],
  },
  {
    key: 'Giant', label: 'Giant', icon: 'giant', space: 5,
    levels: [
      { level: 1, hp: 300, dps: 11, cost: 250 },
      { level: 2, hp: 360, dps: 14, cost: 350 },
      { level: 3, hp: 430, dps: 19, cost: 500 },
      { level: 4, hp: 520, dps: 24, cost: 750 },
    ],
  },
  {
    key: 'Wall Breaker', label: 'Wall Breaker', icon: 'wallBreaker', space: 2,
    levels: [
      { level: 1, hp: 20, dps: 12, cost: 1000 },
      { level: 2, hp: 24, dps: 16, cost: 1500 },
      { level: 3, hp: 29, dps: 24, cost: 2000 },
      { level: 4, hp: 35, dps: 32, cost: 2500 },
    ],
  },
];



export function level1Cost(def) {
  return def.levels[0].cost;
}

function BuildingGlyph({ kind, size = 20, color = '#fff' }) {
  const s = size;
  const common = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none' };
  if (kind === 'townHall') {
    return (
      <svg {...common}>
        <rect x="4" y="11" width="16" height="9" fill={color} opacity="0.9" />
        <path d="M2 11 12 4l10 7" stroke={color} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
        <rect x="10" y="14" width="4" height="6" fill={colors.bgDark} opacity="0.5" />
      </svg>
    );
  }
  if (kind === 'cannon') {
    return (
      <svg {...common}>
        <circle cx="12" cy="16" r="6" fill={color} opacity="0.9" />
        <rect x="11" y="3" width="4" height="13" rx="1.5" fill={color} />
      </svg>
    );
  }
  if (kind === 'archerTower') {
    return (
      <svg {...common}>
        <rect x="8" y="9" width="8" height="12" fill={color} opacity="0.9" />
        <path d="M6 9h12l-2-6h-8Z" fill={color} />
        <rect x="10.5" y="13" width="3" height="4" fill={colors.bgDark} opacity="0.5" />
      </svg>
    );
  }
  if (kind === 'airDefense') {
    return (
      <svg {...common}>
        <rect x="6" y="14" width="12" height="7" fill={color} opacity="0.9" />
        <rect x="11" y="3" width="2.4" height="13" rx="1" fill={color} transform="rotate(-20 12 9)" />
        <circle cx="12" cy="14" r="2.4" fill={colors.bgDark} opacity="0.5" />
      </svg>
    );
  }
  if (kind === 'barracks') {
    return (
      <svg {...common}>
        <rect x="4" y="10" width="16" height="10" fill={color} opacity="0.9" />
        <path d="M3 10 12 4l9 6" stroke={color} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === 'resource') {
    return (
      <svg {...common}>
        <rect x="5" y="9" width="14" height="11" fill={color} opacity="0.9" />
        <path d="M4 9 12 4l8 5" stroke={color} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="5" y="7" width="14" height="13" fill={color} opacity="0.85" />
    </svg>
  );
}

function TroopGlyph({ kind, size = 18, color = '#fff' }) {
  const s = size;
  const common = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none' };
  if (kind === 'barbarian') {
    return (
      <svg {...common}>
        <circle cx="12" cy="6" r="3" fill={color} />
        <path d="M7 21v-5a5 5 0 0 1 10 0v5" fill={color} opacity="0.9" />
        <path d="M16 10l5-4-1.5-1.5L15 9Z" fill={color} />
      </svg>
    );
  }
  if (kind === 'archer') {
    return (
      <svg {...common}>
        <circle cx="12" cy="6" r="3" fill={color} />
        <path d="M7 21v-5a5 5 0 0 1 10 0v5" fill={color} opacity="0.9" />
        <path d="M16 8a5 5 0 0 1 0 7" stroke={color} strokeWidth="1.4" fill="none" />
      </svg>
    );
  }
  if (kind === 'goblin') {
    return (
      <svg {...common}>
        <circle cx="12" cy="7" r="3.2" fill={color} />
        <path d="M9.5 5.5 8 3M14.5 5.5 16 3" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
        <path d="M8 21v-4.5a4.5 4.5 0 0 1 8 0V21" fill={color} opacity="0.9" />
      </svg>
    );
  }
  if (kind === 'giant') {
    return (
      <svg {...common}>
        <circle cx="12" cy="5.5" r="3" fill={color} />
        <path d="M5 21v-6a7 7 0 0 1 14 0v6" fill={color} opacity="0.9" />
      </svg>
    );
  }
  if (kind === 'wallBreaker') {
    return (
      <svg {...common}>
        <circle cx="11" cy="7" r="2.6" fill={color} />
        <path d="M7 21v-5a4.5 4.5 0 0 1 8 0v2" fill={color} opacity="0.9" />
        <circle cx="17" cy="16" r="3.4" fill={color} opacity="0.95" />
        <path d="M17 13.2v5.6M14.4 16h5.2" stroke={colors.bgDark} strokeWidth="1" opacity="0.5" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="6" fill={color} opacity="0.85" />
    </svg>
  );
}

export function BuildingIcon({ name, size, color }) {
  const def = BUILDING_DEFS.find(function (d) { return d.key === name; });
  const kind = name === 'TownHall' || name === 'Town Hall' ? 'townHall'
    : name === 'Barracks' ? 'barracks'
    : def ? def.icon : 'generic';
  return <BuildingGlyph kind={kind} size={size} color={color} />;
}

export function TroopIcon({ name, size, color }) {
  const def = TROOP_DEFS.find(function (d) { return d.key === name; });
  return <TroopGlyph kind={def ? def.icon : 'generic'} size={size} color={color} />;
}

export const buildingNames = BUILDING_DEFS.map(function (d) { return d.key; });
export const troopNames = TROOP_DEFS.map(function (d) { return d.key; });