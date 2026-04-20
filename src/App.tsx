import React, { useState, useMemo, useCallback } from 'react';
import DeckGL from '@deck.gl/react';
import { ArcLayer, TextLayer, PathLayer, IconLayer, ScatterplotLayer, FlyToInterpolator } from 'deck.gl';
import { PathStyleExtension } from '@deck.gl/extensions';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Activity, ShieldAlert, Anchor, Zap, Ship, Truck, Globe, Droplets, LogOut, ArrowLeft } from 'lucide-react';
import { TEAM_ASSIGNMENTS } from './team_config';

// --- DATA DEFINITIONS ---

const LOCATIONS: Record<string, [number, number]> = {
  // JAPAN
  Chiba: [140.12, 35.60],
  Kawasaki: [139.75, 35.53],
  Negishi: [139.63, 35.41],
  Sakai: [135.45, 34.58],
  Aichi: [136.93, 34.87],
  Mizushima: [133.74, 34.48],
  Hakodate: [140.73, 41.77],
  Sendai: [141.02, 38.27],
  Niigata: [139.12, 37.95],
  Hachinohe: [141.53, 40.53],
  Matsuyama: [132.71, 33.86],
  Fukuoka: [130.39, 33.61],
  Kagoshima: [130.56, 31.57],
  Okinawa: [127.75, 26.23],
  Miyako: [125.28, 24.80],
  
  // SOUTH KOREA
  Ulsan: [129.35, 35.54],
  Yeosu: [127.73, 34.75],
  Onsan: [129.34, 35.43],
  Daesan: [126.42, 36.97],
  Incheon: [126.60, 37.47],

  // MAINLAND CHINA
  Shanghai: [121.47, 31.23],
  Ningbo: [121.85, 29.89],
  Tianjin: [117.20, 39.13],
  Huizhou: [114.41, 23.11],

  // TAIWAN
  Kaohsiung: [120.35, 22.53],
  Taoyuan: [121.31, 25.03],
  Mailiao: [120.19, 23.79],

  // NORTH KOREA
  Nampo: [125.40, 38.73],
  Sinuiju: [124.39, 40.10],
  Wonsan: [127.44, 39.15],
};

const IMPORT_SOURCES: Record<string, [number, number]> = {
  'Saudi Arabia': [49.0, 26.0], 
  'UAE': [56.3, 25.3],
  'Kuwait': [48.0, 29.4],
  'USA Houston': [-95.0, 29.7],
  'Russia Kozmino': [132.9, 42.7],
};

const EXPORT_DESTINATIONS: Record<string, [number, number]> = {
  'Hong Kong': [114.17, 22.28],
  'Shanghai': [121.47, 31.23],
  'Port of Melbourne': [144.93, -37.81],
  'Incheon': [126.63, 37.45],
};

const JP_REFINERIES = ['Chiba', 'Kawasaki', 'Negishi', 'Sakai', 'Aichi', 'Mizushima', 'Niigata'];
const SK_REFINERIES = ['Ulsan', 'Yeosu', 'Onsan', 'Daesan'];
const CN_REFINERIES = ['Ningbo', 'Tianjin', 'Huizhou'];
const TW_REFINERIES = ['Kaohsiung', 'Taoyuan', 'Mailiao'];
const NK_REFINERIES = ['Nampo'];
const REFINERIES = [...JP_REFINERIES, ...SK_REFINERIES, ...CN_REFINERIES, ...TW_REFINERIES, ...NK_REFINERIES];
const NODE_COMPANIES: Record<string, string> = {
  // JAPAN
  Negishi: 'ENEOS',
  Kawasaki: 'ENEOS',
  Chiba: 'ENEOS',
  Mizushima: 'Idemitsu',
  Sakai: 'Cosmo',
  Aichi: 'Cosmo',
  Niigata: 'ENEOS',
  
  // SOUTH KOREA
  Ulsan: 'SK Energy',
  Yeosu: 'GS Caltex',
  Onsan: 'S-Oil',
  Daesan: 'HD Hyundai',
  Incheon: 'SK Energy',

  // MAINLAND CHINA
  Ningbo: 'Sinopec',
  Shanghai: 'Sinopec',
  Tianjin: 'PetroChina',
  Huizhou: 'CNOOC',

  // TAIWAN
  Kaohsiung: 'CPC Corporation',
  Taoyuan: 'CPC Corporation',
  Mailiao: 'Formosa Petro',

  // NORTH KOREA
  Nampo: 'KPC State',
  Sinuiju: 'KPC State',
  Wonsan: 'KPC State',
};

const COMPANY_COLORS: Record<string, [number, number, number]> = {
  // JAPAN PALETTE
  ENEOS: [188, 0, 45],     // Strategic Crimson
  Idemitsu: [0, 201, 167],  // Operational Teal
  Cosmo: [255, 184, 0],    // Logic Amber
  
  // KOREA PALETTE (NEO SEOUL)
  'SK Energy': [157, 0, 255], // Electric Violet
  'GS Caltex': [0, 242, 255], // Cyber Turquoise
  'S-Oil': [0, 255, 157],     // Neon Emerald
  'HD Hyundai': [77, 109, 255], // Neon Cobalt

  // CHINA PALETTE
  Sinopec: [255, 30, 30],      // Power Red
  PetroChina: [255, 200, 0],   // China Gold
  CNOOC: [0, 80, 255],         // Marine Blue

  // TAIWAN PALETTE
  'CPC Corporation': [0, 162, 232], // Sea Blue
  'Formosa Petro': [210, 10, 10],   // Deep Red

  // NORTH KOREA PALETTE
  'KPC State': [160, 160, 160], // Industrial Gray
  
  User: [255, 255, 255]
};

const REFINERY_SVG = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><path d="M64 0 L128 64 L64 128 L0 64 Z" fill="white"/></svg>')}`;
const TERMINAL_SVG = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><circle cx="64" cy="64" r="60" fill="white"/></svg>')}`;

interface Edge {
  id: string;
  source: string;
  target: string;
  weight: number;
}

const JP_INITIAL_EDGES: Edge[] = [
  { id: 'jp-1', source: 'Negishi', target: 'Hakodate', weight: 4 },
  { id: 'jp-2', source: 'Negishi', target: 'Sendai', weight: 5 },
  { id: 'jp-3', source: 'Negishi', target: 'Hachinohe', weight: 3 },
  { id: 'jp-4', source: 'Kawasaki', target: 'Sendai', weight: 4 },
  { id: 'jp-5', source: 'Kawasaki', target: 'Niigata', weight: 2 },
  { id: 'jp-6', source: 'Chiba', target: 'Hakodate', weight: 3 },
  { id: 'jp-7', source: 'Chiba', target: 'Niigata', weight: 4 },
  { id: 'jp-8', source: 'Aichi', target: 'Fukuoka', weight: 5 },
  { id: 'jp-9', source: 'Aichi', target: 'Matsuyama', weight: 3 },
  { id: 'jp-10', source: 'Sakai', target: 'Fukuoka', weight: 4 },
  { id: 'jp-11', source: 'Sakai', target: 'Kagoshima', weight: 3 },
  { id: 'jp-12', source: 'Sakai', target: 'Okinawa', weight: 2 },
  { id: 'jp-13', source: 'Mizushima', target: 'Matsuyama', weight: 5 },
  { id: 'jp-14', source: 'Mizushima', target: 'Fukuoka', weight: 4 },
  { id: 'jp-15', source: 'Mizushima', target: 'Kagoshima', weight: 4 },
];

const SK_INITIAL_EDGES: Edge[] = [
  { id: 'sk-1', source: 'Yeosu', target: 'Ulsan', weight: 4 },
  { id: 'sk-2', source: 'Yeosu', target: 'Busan', weight: 3 },
  { id: 'sk-3', source: 'Ulsan', target: 'Incheon', weight: 5 },
  { id: 'sk-4', source: 'Daesan', target: 'Incheon', weight: 4 },
  { id: 'sk-5', source: 'Onsan', target: 'Busan', weight: 2 },
];

const JP_IMPORT_EDGES = [
  { id: 'jp-i1', source: 'Saudi Arabia', target: 'Chiba', weight: 5 },
  { id: 'jp-i2', source: 'UAE', target: 'Negishi', weight: 4 },
  { id: 'jp-i3', source: 'Kuwait', target: 'Kawasaki', weight: 4 },
];

const SK_IMPORT_EDGES = [
  { id: 'sk-i1', source: 'Saudi Arabia', target: 'Yeosu', weight: 5 },
  { id: 'sk-i2', source: 'UAE', target: 'Ulsan', weight: 4 },
  { id: 'sk-i3', source: 'Kuwait', target: 'Daesan', weight: 4 },
];

const CN_IMPORT_EDGES = [
  { id: 'cn-i1', source: 'Saudi Arabia', target: 'Ningbo', weight: 5 },
  { id: 'cn-i2', source: 'UAE', target: 'Huizhou', weight: 4 },
  { id: 'cn-i3', source: 'Russia Kozmino', target: 'Tianjin', weight: 4 },
];

const TW_IMPORT_EDGES = [
  { id: 'tw-i1', source: 'Saudi Arabia', target: 'Kaohsiung', weight: 5 },
  { id: 'tw-i2', source: 'Kuwait', target: 'Taoyuan', weight: 4 },
];

const TW_DOMESTIC_EDGES: Edge[] = [
  { id: 'tw-1', source: 'Kaohsiung', target: 'Taoyuan', weight: 3 },
  { id: 'tw-2', source: 'Mailiao', target: 'Kaohsiung', weight: 4 },
];

const NK_DOMESTIC_EDGES: Edge[] = [
  { id: 'nk-1', source: 'Nampo', target: 'Sinuiju', weight: 3 },
  { id: 'nk-2', source: 'Nampo', target: 'Wonsan', weight: 2 },
];

const EXPORT_EDGES = [
  { id: 'exp-1', source: 'Chiba', target: 'Hong Kong', weight: 4 },
  { id: 'exp-2', source: 'Chiba', target: 'Shanghai', weight: 3 },
  { id: 'exp-3', source: 'Incheon', target: 'Niigata', weight: 3 }, 
  { id: 'exp-4', source: 'Ulsan', target: 'Fukuoka', weight: 4 },   
  { id: 'exp-5', source: 'Ningbo', target: 'Kawasaki', weight: 3 }, 
  { id: 'exp-6', source: 'Shanghai', target: 'Sakai', weight: 2 },  
  { id: 'exp-7', source: 'Kaohsiung', target: 'Okinawa', weight: 3 }, // Taiwan-Japan Corridor
  { id: 'exp-8', source: 'Kaohsiung', target: 'Negishi', weight: 2 }, // Strategic Swap
  { id: 'exp-9', source: 'Sinuiju', target: 'Tianjin', weight: 2 },   // Cross-Border
];

const MACRO_JAPAN: [number, number] = [137.0, 36.0];
const MACRO_KOREA: [number, number] = [128.0, 36.5];
const MACRO_CHINA: [number, number] = [121.5, 31.0];
const MACRO_TAIWAN: [number, number] = [121.0, 23.7];
const MACRO_NORTH_KOREA: [number, number] = [126.5, 40.0];

const HUB_COORDS: Record<string, [number, number]> = {
  'Japan': MACRO_JAPAN,
  'South Korea': MACRO_KOREA,
  'Mainland China': MACRO_CHINA,
  'Taiwan Hub': MACRO_TAIWAN,
  'North Korea Hub': MACRO_NORTH_KOREA
};

const VIEW_STATES = {
  global: {
    longitude: 90.0,
    latitude: 25.0,
    zoom: 1.8,
    pitch: 0,
    bearing: 0,
  },
  japan: {
    longitude: 137.0,
    latitude: 35.0,
    zoom: 5.8,
    pitch: 0,
    bearing: 0,
  },
  korea: {
    longitude: 128.0,
    latitude: 36.5,
    zoom: 6.8,
    pitch: 0,
    bearing: 0,
  },
  china: {
    longitude: 121.5,
    latitude: 31.0,
    zoom: 5.5,
    pitch: 0,
    bearing: 0,
  },
  taiwan: {
    longitude: 121.0,
    latitude: 23.7,
    zoom: 7.2,
    pitch: 0,
    bearing: 0,
  },
  northkorea: {
    longitude: 126.5,
    latitude: 39.5,
    zoom: 6.5,
    pitch: 0,
    bearing: 0,
  }
};

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const COLOR_CRIMSON: [number, number, number] = [188, 0, 45];
const COLOR_WHITE: [number, number, number] = [255, 255, 255];
const COLOR_MUTED: [number, number, number] = [80, 80, 80];

const CENTRALITY: Record<string, { 
  degree: number; 
  betweenness: number; 
  eigenvector: number;
  closeness: number;
}> = {
  // JAPAN
  Chiba:           { degree: 5, betweenness: 4.0, eigenvector: 0.049, closeness: 1.0 },
  Negishi:         { degree: 5, betweenness: 4.0, eigenvector: 0.049, closeness: 1.0 },
  Sakai:           { degree: 5, betweenness: 4.0, eigenvector: 0.049, closeness: 1.0 },
  Mizushima:       { degree: 5, betweenness: 1.0, eigenvector: 0.0,   closeness: 1.0 },
  Kawasaki:        { degree: 3, betweenness: 2.0, eigenvector: 0.049, closeness: 1.0 },
  Niigata:         { degree: 3, betweenness: 0.0, eigenvector: 1.0,   closeness: 0.0 },
  
  // KOREA
  Ulsan:           { degree: 5, betweenness: 3.5, eigenvector: 0.82,  closeness: 0.9 },
  Yeosu:           { degree: 4, betweenness: 2.8, eigenvector: 0.75,  closeness: 0.8 },
  Onsan:           { degree: 3, betweenness: 1.5, eigenvector: 0.40,  closeness: 0.5 },
  Daesan:          { degree: 3, betweenness: 1.2, eigenvector: 0.35,  closeness: 0.4 },

  // CHINA
  Ningbo:          { degree: 6, betweenness: 5.0, eigenvector: 0.95,  closeness: 1.0 },
  Shanghai:        { degree: 5, betweenness: 4.2, eigenvector: 0.88,  closeness: 0.9 },
  Tianjin:         { degree: 4, betweenness: 3.0, eigenvector: 0.70,  closeness: 0.7 },
  Huizhou:         { degree: 4, betweenness: 2.5, eigenvector: 0.65,  closeness: 0.7 },

  // TAIWAN
  Kaohsiung:       { degree: 5, betweenness: 3.8, eigenvector: 0.85,  closeness: 0.9 },
  Taoyuan:         { degree: 3, betweenness: 1.5, eigenvector: 0.40,  closeness: 0.5 },

  // NORTH KOREA
  Nampo:           { degree: 4, betweenness: 2.0, eigenvector: 0.50,  closeness: 0.6 },
};

// --- UTILS ---
function generateArcPath(source: [number, number], target: [number, number], segments = 50) {
  const path: [number, number][] = [];
  const dx = target[0] - source[0];
  const dy = target[1] - source[1];
  const nx = dy * 0.2;
  const ny = -dx * 0.2;
  const cx = source[0] + dx / 2 + nx;
  const cy = source[1] + dy / 2 + ny;
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = Math.pow(1 - t, 2) * source[0] + 2 * (1 - t) * t * cx + Math.pow(t, 2) * target[0];
    const y = Math.pow(1 - t, 2) * source[1] + 2 * (1 - t) * t * cy + Math.pow(t, 2) * target[1];
    path.push([x, y]);
  }
  return path;
}

// --- HUD UTILITIES ---

const HUDBox = ({ children, className = "", title = "" }: { children: React.ReactNode, className?: string, title?: string }) => (
  <div className={`relative hud-glass p-5 rounded-[2px] glossy-gradient overflow-hidden ${className}`}>
    <div className="hud-bracket-tl" />
    <div className="hud-bracket-tr" />
    <div className="hud-bracket-bl" />
    <div className="hud-bracket-br" />
    {title && (
      <div className="text-[9px] uppercase tracking-[2px] text-white/40 mb-4 pb-1 border-b border-white/5 flex items-center justify-between pointer-events-none">
        <span>── {title}</span>
        <div className="w-1 h-1 rounded-full bg-white/20" />
      </div>
    )}
    {children}
  </div>
);

const CRTOverlay = () => (
  <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden opacity-[0.03]">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] bg-[length:100%_2px,3px_100%]" />
    <div className="absolute inset-0 animate-scanline bg-gradient-to-b from-transparent via-white/10 to-transparent h-1" />
  </div>
);

export default function App() {
  const [viewMode, setViewMode] = useState<'global' | 'japan' | 'korea' | 'china' | 'taiwan' | 'northkorea'>('global');
  const [viewState, setViewState] = useState<any>(VIEW_STATES.global);
  const [edges, setEdges] = useState<Edge[]>(JP_INITIAL_EDGES);
  const [transportMode, setTransportMode] = useState<'ship' | 'truck'>('ship');
  const [hoverInfo, setHoverInfo] = useState<{name: string, x: number, y: number} | null>(null);
  const hoveredNode = hoverInfo?.name || null;
  const [draggingSource, setDraggingSource] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<[number, number] | null>(null);

  const currentImports = useMemo(() => {
      return viewMode === 'japan' ? JP_IMPORT_EDGES : 
             viewMode === 'korea' ? SK_IMPORT_EDGES : 
             viewMode === 'china' ? CN_IMPORT_EDGES : 
             viewMode === 'taiwan' ? TW_IMPORT_EDGES : [];
  }, [viewMode]);

  const goToHub = (hub: 'japan' | 'korea' | 'china' | 'taiwan' | 'northkorea') => {
    setViewMode(hub);
    setHoverInfo(null);
    if (hub === 'japan') setEdges(JP_INITIAL_EDGES);
    else if (hub === 'korea') setEdges(SK_INITIAL_EDGES);
    else if (hub === 'taiwan') setEdges(TW_DOMESTIC_EDGES);
    else if (hub === 'northkorea') setEdges(NK_DOMESTIC_EDGES);
    else setEdges([]); 
    
    setViewState({
      ...VIEW_STATES[hub],
      transitionDuration: 1500,
      transitionInterpolator: new FlyToInterpolator(),
    });
  };

  const goToGlobalView = () => {
    setViewMode('global');
    setHoverInfo(null);
    setViewState({
      ...VIEW_STATES.global,
      transitionDuration: 1500,
      transitionInterpolator: new FlyToInterpolator(),
    });
  };

  const nodes = useMemo(() => {
    // Filter nodes by active hub refineries and logistics
    let relevantNodes: string[] = [];
    if (viewMode === 'japan') {
        relevantNodes = Object.keys(LOCATIONS).filter(name => JP_REFINERIES.includes(name) || ['Hakodate', 'Sendai', 'Hachinohe', 'Matsuyama', 'Fukuoka', 'Kagoshima', 'Okinawa', 'Miyako'].includes(name));
    } else if (viewMode === 'korea') {
        relevantNodes = Object.keys(LOCATIONS).filter(name => SK_REFINERIES.includes(name) || ['Incheon', 'Busan'].includes(name));
    } else if (viewMode === 'china') {
        relevantNodes = Object.keys(LOCATIONS).filter(name => CN_REFINERIES.includes(name) || ['Shanghai'].includes(name));
    } else if (viewMode === 'taiwan') {
        relevantNodes = Object.keys(LOCATIONS).filter(name => TW_REFINERIES.includes(name));
    } else if (viewMode === 'northkorea') {
        relevantNodes = Object.keys(LOCATIONS).filter(name => NK_REFINERIES.includes(name) || ['Sinuiju', 'Wonsan'].includes(name));
    }

    return relevantNodes.map(name => ({
      name,
      coordinates: LOCATIONS[name],
      isRefinery: REFINERIES.includes(name),
    }));
  }, [viewMode]);

  const globalNodes = useMemo(() => {
    const list: any[] = [];
    list.push({ name: 'Japan', coordinates: MACRO_JAPAN, isRefinery: false, isHub: true });
    list.push({ name: 'South Korea', coordinates: MACRO_KOREA, isRefinery: false, isHub: true });
    list.push({ name: 'Mainland China', coordinates: MACRO_CHINA, isRefinery: false, isHub: true });
    list.push({ name: 'Taiwan Hub', coordinates: MACRO_TAIWAN, isRefinery: false, isHub: true });
    list.push({ name: 'North Korea Hub', coordinates: MACRO_NORTH_KOREA, isRefinery: false, isHub: true });
    Object.entries(IMPORT_SOURCES).forEach(([name, coordinates]) => {
      list.push({ name, coordinates, isRefinery: false, isSource: true });
    });
    Object.entries(EXPORT_DESTINATIONS).forEach(([name, coordinates]) => {
      list.push({ name, coordinates, isRefinery: false, isDest: true });
    });
    return list;
  }, []);

  const globalEdges = useMemo(() => {
    const list: any[] = [];
    JP_IMPORT_EDGES.forEach(e => {
        list.push({ source: e.source, target: 'Japan', weight: e.weight, id: `g-${e.id}`, type: 'import' });
    });
    SK_IMPORT_EDGES.forEach(e => {
        list.push({ source: e.source, target: 'South Korea', weight: e.weight, id: `g-${e.id}`, type: 'import' });
    });
    CN_IMPORT_EDGES.forEach(e => {
        list.push({ source: e.source, target: 'Mainland China', weight: e.weight, id: `g-${e.id}`, type: 'import' });
    });
    TW_IMPORT_EDGES.forEach(e => {
        list.push({ source: e.source, target: 'Taiwan Hub', weight: e.weight, id: `g-${e.id}`, type: 'import' });
    });
    EXPORT_EDGES.forEach(e => {
        let sourceHub = 'Japan';
        if (['Incheon', 'Ulsan'].includes(e.source)) sourceHub = 'South Korea';
        if (['Ningbo', 'Shanghai'].includes(e.source)) sourceHub = 'Mainland China';
        if (['Kaohsiung', 'Taoyuan'].includes(e.source)) sourceHub = 'Taiwan Hub';
        if (['Nampo', 'Sinuiju'].includes(e.source)) sourceHub = 'North Korea Hub';
        
        list.push({ source: sourceHub, target: e.target, weight: e.weight, id: `g-${e.id}`, type: 'export' });
    });
    return list;
  }, []);

  const teamNodes = useMemo(() => {
    return Object.entries(TEAM_ASSIGNMENTS).map(([continent, data]) => ({
      continent,
      assignee: data.assignee,
      color: data.color as [number, number, number],
      coordinates: data.centroid as [number, number],
      radius: data.radius
    }));
  }, []);

  const handleDragStart = useCallback((info: any) => {
    if (info.object && REFINERIES.includes(info.object.name)) {
      setDraggingSource(info.object.name);
      setMousePos(info.coordinate);
      return true;
    }
    return false;
  }, []);

  const handleDrag = useCallback((info: any) => {
    if (draggingSource) {
      setMousePos(info.coordinate);
    }
  }, [draggingSource]);

  const handleDragEnd = useCallback((info: any) => {
    if (draggingSource) {
      let target = info.object && !REFINERIES.includes(info.object.name) ? info.object.name : null;
      
      if (!target && mousePos) {
        const threshold = 0.15;
        let minDist = threshold;
        Object.entries(LOCATIONS).forEach(([name, coords]) => {
          if (!REFINERIES.includes(name)) {
            const dist = Math.hypot(coords[0] - mousePos[0], coords[1] - mousePos[1]);
            if (dist < minDist) {
              minDist = dist;
              target = name;
            }
          }
        });
      }

      if (target) {
        const exists = edges.some(e => e.source === draggingSource && e.target === target);
        if (!exists) {
          setEdges(prev => [...prev, {
            id: `user-${Date.now()}`,
            source: draggingSource,
            target: target,
            weight: 1
          }]);
        }
      }
    }
    setDraggingSource(null);
    setMousePos(null);
  }, [draggingSource, edges, mousePos]);

  const activeEdges = useMemo(() => {
    if (!hoveredNode) return edges;
    return edges.filter((e) => e.source === hoveredNode || e.target === hoveredNode);
  }, [hoveredNode, edges]);

  const activeNodes = useMemo(() => {
    if (viewMode === 'global') {
       if (!hoveredNode) return new Set(globalNodes.map(n => n.name));
       const connected = new Set<string>([hoveredNode]);
       globalEdges.forEach(e => {
         if (e.source === hoveredNode) connected.add(e.target);
         if (e.target === hoveredNode) connected.add(e.source);
       });
       return connected;
    }

    if (!hoveredNode) return new Set(nodes.map((n) => n.name));
    const connected = new Set<string>();
    connected.add(hoveredNode);
    edges.forEach((e) => {
      if (e.source === hoveredNode) connected.add(e.target);
      if (e.target === hoveredNode) connected.add(e.source);
    });
    currentImports.forEach((e) => {
      if (e.target === hoveredNode) connected.add(e.source);
    });
    EXPORT_EDGES.forEach((e) => {
      if (e.source === hoveredNode) connected.add(e.target);
    });
    return connected;
  }, [hoveredNode, nodes, edges, viewMode, globalNodes, globalEdges, currentImports]);

  // Pre-compute geometric paths for internal routes
  const internalPaths = useMemo(() => {
    return edges.map(edge => ({
      ...edge,
      path: transportMode === 'ship' 
        ? generateArcPath(LOCATIONS[edge.source], LOCATIONS[edge.target])
        : [LOCATIONS[edge.source], LOCATIONS[edge.target]]
    }));
  }, [edges, transportMode]);

  // Directional markers (Chevrons) for internal routes
  const chevrons = useMemo(() => {
    const markers: any[] = [];
    edges.forEach(edge => {
      const s = LOCATIONS[edge.source];
      const t = LOCATIONS[edge.target];
      if (!s || !t) return;

      const angle = (Math.atan2(t[1] - s[1], t[0] - s[0]) * 180) / Math.PI;
      
      [0.33, 0.66].forEach(p => {
        markers.push({
          position: [s[0] + (t[0] - s[0]) * p, s[1] + (t[1] - s[1]) * p],
          angle: -angle,
          color: COMPANY_COLORS[NODE_COMPANIES[edge.source] || 'User'],
          edge
        });
      });
    });
    return markers;
  }, [edges]);

  // Maritime markers for export routes
  const exportMarkers = useMemo(() => {
    return EXPORT_EDGES.map(edge => {
      const s = LOCATIONS[edge.source];
      const t = EXPORT_DESTINATIONS[edge.target] || LOCATIONS[edge.target] || [0,0];
      if (!s) return null;
      return {
        position: [s[0] + (t[0] - s[0]) * 0.5, s[1] + (t[1] - s[1]) * 0.5],
        edge
      };
    }).filter(Boolean);
  }, []);

  const layers = [
    // ----- GLOBAL LAYERS -----
    new ArcLayer({
      id: 'global-arcs',
      data: globalEdges,
      getSourcePosition: (d: any) => d.type === 'import' ? (IMPORT_SOURCES[d.source] || [0,0]) : (HUB_COORDS[d.source] || MACRO_JAPAN),
      getTargetPosition: (d: any) => d.type === 'import' ? (HUB_COORDS[d.target] || MACRO_JAPAN) : (EXPORT_DESTINATIONS[d.target] || LOCATIONS[d.target] || [0,0]),
      getSourceColor: (d: any) => {
         const isActive = !hoveredNode || d.source === hoveredNode || d.target === hoveredNode;
         if (!isActive) return [COLOR_CRIMSON[0], COLOR_CRIMSON[1], COLOR_CRIMSON[2], 20];
         return [COLOR_CRIMSON[0], COLOR_CRIMSON[1], COLOR_CRIMSON[2], d.type === 'import' ? 180 : 80];
      },
      getTargetColor: (d: any) => {
         const isActive = !hoveredNode || d.source === hoveredNode || d.target === hoveredNode;
         if (!isActive) return [COLOR_CRIMSON[0], COLOR_CRIMSON[1], COLOR_CRIMSON[2], 20];
         return [COLOR_CRIMSON[0], COLOR_CRIMSON[1], COLOR_CRIMSON[2], d.type === 'import' ? 80 : 180];
      },
      getWidth: (d: any) => d.weight * 1.5,
      visible: viewMode === 'global',
      updateTriggers: {
        getSourceColor: [hoveredNode],
        getTargetColor: [hoveredNode],
      }
    }),
    new ScatterplotLayer({
      id: 'team-radar-zones',
      data: teamNodes,
      getPosition: (d: any) => d.coordinates,
      getFillColor: (d: any) => [...d.color, 40],
      getLineColor: (d: any) => [...d.color, 150],
      getLineWidth: 2,
      lineWidthMinPixels: 2,
      getRadius: (d: any) => d.radius,
      stroked: true,
      pickable: false, // Disabled to prevent blocking underlying layers
      visible: viewMode === 'global',
    }),
    new TextLayer({
      id: 'team-labels',
      data: teamNodes,
      getPosition: (d: any) => d.coordinates,
      getText: (d: any) => d.assignee !== 'UNASSIGNED' ? d.assignee : '',
      getSize: 24,
      getColor: (d: any) => [...d.color, 255],
      getPixelOffset: [0, 0],
      fontWeight: 'bold',
      fontFamily: 'JetBrains Mono, monospace',
      visible: viewMode === 'global',
    }),
    new ScatterplotLayer({
      id: 'global-nodes',
      data: globalNodes,
      getPosition: (d: any) => d.coordinates,
      getFillColor: (d: any) => {
        const isActive = activeNodes.has(d.name);
        if (!isActive) return COLOR_MUTED;
        return d.isHub ? COLOR_CRIMSON : COLOR_WHITE;
      },
      getLineColor: COLOR_WHITE,
      getLineWidth: 1,
      getRadius: (d: any) => d.isHub ? 120000 : 70000,
      pickable: true,
      visible: viewMode === 'global',
      onClick: (info: any) => {
        if (info.object?.name === 'Japan') {
          goToCountryView();
        }
      },
      onHover: (info: any) => {
        if (info.object) {
          setHoverInfo({ name: info.object.name, x: info.x, y: info.y });
        } else {
          setHoverInfo(null);
        }
      },
      updateTriggers: {
        getFillColor: [activeNodes],
      },
    }),
    new TextLayer({
      id: 'global-labels',
      data: globalNodes,
      getPosition: (d: any) => d.coordinates,
      getText: (d: any) => d.name,
      getSize: 16,
      getColor: (d: any) => (activeNodes.has(d.name) ? COLOR_WHITE : COLOR_MUTED),
      getPixelOffset: [0, 20],
      fontFamily: 'JetBrains Mono, monospace',
      visible: viewMode === 'global',
      updateTriggers: {
        getColor: [activeNodes],
      },
    }),

    // ----- DOMESTIC LAYERS -----
    // LAYER 1: IMPORT RIVERS (Bottom — Background context)
    new ArcLayer({
      id: 'import-rivers',
      data: currentImports,
      getSourcePosition: (d: any) => IMPORT_SOURCES[d.source],
      getTargetPosition: (d: any) => LOCATIONS[d.target],
      getSourceColor: [139, 0, 0, 50],
      getTargetColor: [139, 0, 0, 50],
      getWidth: (d: any) => d.weight * 2,
      opacity: hoveredNode ? 0.1 : 0.4,
      visible: viewMode === 'country',
      updateTriggers: {
        opacity: [hoveredNode]
      },
      getFilterValue: (d: any) => (hoveredNode && d.target !== hoveredNode ? 0 : 1),
    }),
    
    // LAYER 2: IMPORT RIVERS HIGHLIGHT
    new ArcLayer({
      id: 'import-rivers-highlight',
      data: currentImports.filter((d: any) => d.target === hoveredNode),
      getSourcePosition: (d: any) => IMPORT_SOURCES[d.source],
      getTargetPosition: (d: any) => LOCATIONS[d.target],
      getSourceColor: [139, 0, 0, 180],
      getTargetColor: [139, 0, 0, 180],
      getWidth: (d: any) => d.weight * 2,
      visible: viewMode === 'country' && !!hoveredNode
    }),

    // LAYER 3: EXPORT ROUTES (Dashed lines)
    new PathLayer({
      id: 'export-routes',
      data: EXPORT_EDGES.map(e => ({
        ...e,
        path: [LOCATIONS[e.source], EXPORT_DESTINATIONS[e.target]]
      })),
      getPath: (d: any) => d.path,
      getColor: (d: any) => [255, 255, 255, (!hoveredNode || d.source === hoveredNode) ? 80 : 20],
      getWidth: (d: any) => d.weight * 1.5,
      widthMinPixels: 1,
      getDashArray: [8, 4],
      dashJustified: true,
      extensions: [new PathStyleExtension({dash: true})],
      visible: viewMode === 'country',
      updateTriggers: {
        getColor: [hoveredNode]
      }
    }),

    // LAYER 4: EXPORT SHIP ICONS
    new TextLayer({
      id: 'export-icons',
      data: exportMarkers,
      getPosition: (d: any) => d.position,
      getText: (d: any) => '⛴',
      getSize: 18,
      getColor: (d: any) => [255, 255, 255, (!hoveredNode || d.edge.source === hoveredNode) ? 255 : 50],
      visible: viewMode === 'country',
      updateTriggers: {
        getColor: [hoveredNode]
      }
    }),

    // LAYER 5: PIPELINE NETWORK (Internal — THE STAR)
    new PathLayer({
      id: 'internal-pipelines',
      data: internalPaths,
      getPath: (d: any) => d.path,
      getColor: (d: any) => {
        const company = NODE_COMPANIES[d.source] || 'User';
        const color = COMPANY_COLORS[company];
        const isActive = !hoveredNode || d.source === hoveredNode || d.target === hoveredNode;
        return [...color, isActive ? 255 : 25] as [number, number, number, number];
      },
      getWidth: (d: any) => d.weight * 3,
      widthMinPixels: 2,
      visible: viewMode === 'country',
      updateTriggers: {
        getColor: [hoveredNode]
      }
    }),

    // LAYER 6: INTERNAL CHEVRONS (Direction markers)
    new TextLayer({
      id: 'internal-chevrons',
      data: chevrons,
      getPosition: (d: any) => d.position,
      getText: (d: any) => '▶',
      getSize: 12,
      getAngle: (d: any) => d.angle,
      getColor: (d: any) => {
        const isActive = !hoveredNode || d.edge.source === hoveredNode || d.edge.target === hoveredNode;
        return [...d.color, isActive ? 200 : 25] as [number, number, number, number];
      },
      visible: viewMode === 'country',
      updateTriggers: {
        getColor: [hoveredNode]
      }
    }),
    
    // LAYER 7: DRAGGING LINE
    draggingSource && mousePos && new PathLayer({
      id: 'dragging-line',
      data: [{
        path: transportMode === 'ship' 
          ? generateArcPath(LOCATIONS[draggingSource as never], mousePos)
          : [LOCATIONS[draggingSource as never], mousePos]
      }],
      getPath: (d: any) => d.path,
      getColor: [255, 255, 255, 180],
      getWidth: 2,
      visible: viewMode === 'country',
    }),

    // LAYER 8: NODE ICONS (Topmost data layer)
    new IconLayer({
      id: 'nodes',
      data: nodes,
      getIcon: (d) => ({
        url: d.isRefinery ? REFINERY_SVG : TERMINAL_SVG,
        width: 128,
        height: 128,
        mask: true
      }),
      getPosition: (d: any) => d.coordinates,
      getColor: (d: any) => {
        const isActive = activeNodes.has(d.name);
        if (!isActive) return COLOR_MUTED;
        return d.isRefinery ? COLOR_CRIMSON : COLOR_WHITE;
      },
      getSize: (d: any) => {
        const stats = CENTRALITY[d.name];
        if (!stats) return 12;
        return d.isRefinery 
          ? 16 + (stats.betweenness * 6)
          : 10 + (stats.degree * 3);
      },
      sizeScale: 1,
      pickable: true,
      visible: viewMode === 'country',
      onHover: (info: any) => {
        if (info.object) {
          setHoverInfo({ name: info.object.name, x: info.x, y: info.y });
        } else {
          setHoverInfo(null);
        }
      },
      updateTriggers: {
        getColor: [activeNodes],
      },
    }),

    // LAYER 9: NODE LABELS (Very top)
    new TextLayer({
      id: 'node-labels',
      data: nodes,
      getPosition: (d: any) => d.coordinates,
      getText: (d: any) => d.name,
      getSize: 12,
      getColor: (d: any) => (activeNodes.has(d.name) ? COLOR_WHITE : COLOR_MUTED),
      getPixelOffset: [0, 15],
      fontFamily: 'JetBrains Mono, monospace',
      visible: viewMode === 'country',
      updateTriggers: {
        getColor: [activeNodes],
      },
    }),
  ].filter(Boolean);

  return (
    <div className="relative w-full h-screen bg-[#050505] text-white overflow-hidden font-mono tracking-wider selection:bg-[#BC002D]/30">
      {/* CRT EFFECT */}
      <CRTOverlay />

      {/* MAP CONTAINER */}
      <div className="absolute inset-0">
        <DeckGL
          viewState={viewState}
          onViewStateChange={({ viewState }) => setViewState(viewState)}
          controller={{ dragPan: draggingSource === null }}
          layers={layers}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          onClick={(info: any) => {
            if (viewMode === 'global' && info.object && info.object.isHub) {
              if (info.object.name === 'Japan') goToHub('japan');
              if (info.object.name === 'South Korea') goToHub('korea');
              if (info.object.name === 'Mainland China') goToHub('china');
              if (info.object.name === 'Taiwan Hub') goToHub('taiwan');
              if (info.object.name === 'North Korea Hub') goToHub('northkorea');
            }
          }}
          getCursor={({ isHovering, isDragging }) => 
            viewMode === 'global' ? (isHovering ? 'pointer' : 'grab') : (isDragging ? 'grabbing' : isHovering ? 'pointer' : 'crosshair')
          }
        >
          <Map mapStyle={MAP_STYLE} reuseMaps />
        </DeckGL>
      </div>

      {/* SIDEBAR / MISSION CONTROL PANEL */}
      <div className="absolute top-0 left-0 h-full w-[280px] bg-black/60 border-r border-white/10 p-6 flex flex-col z-10 backdrop-blur-2xl">
        {viewMode !== 'global' && (
          <button 
            onClick={goToGlobalView}
            className="text-white/60 hover:text-white text-[9px] uppercase flex items-center gap-2 mb-8 border border-white/10 bg-white/5 px-3 py-1.5 rounded cursor-pointer transition-colors w-fit"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Global
          </button>
        )}

        <div className="mb-10">
          <h1 className="text-[15px] tracking-[0.25em] font-black uppercase text-[#BC002D] flex items-center gap-2">
            <Activity className="w-4 h-4 animate-pulse" />
            HINOMARU COMMAND
          </h1>
          <div className="mt-2 text-[9px] text-white/30 uppercase tracking-[2px] border-l border-[#BC002D] pl-2">
            HUB: {viewMode === 'global' ? 'GLOBAL_COORD' : 
                  viewMode === 'japan' ? 'JAPAN_SECTOR' : 
                  viewMode === 'korea' ? 'KOREA_SECTOR' : 
                  viewMode === 'china' ? 'CHINA_SECTOR' : 
                  viewMode === 'taiwan' ? 'TAIWAN_SECTOR' : 'DPRK_SECTOR'}
          </div>
        </div>

        <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {/* FLOW MONITOR */}
          <div className="flex-1 space-y-8">
            {/* IMPORTS */}
            <div>
              <div className="flex items-center justify-between mb-3 pb-1 border-b border-white/5">
                <span className="text-[9px] uppercase tracking-[2px] text-white/40">IMPORTS</span>
                <Globe className="w-3 h-3 text-[#BC002D]" />
              </div>
              <div className="space-y-1">
                {(viewMode === 'japan' ? JP_IMPORT_EDGES : 
                  viewMode === 'korea' ? SK_IMPORT_EDGES : 
                  viewMode === 'china' ? CN_IMPORT_EDGES : 
                  viewMode === 'taiwan' ? TW_IMPORT_EDGES : []).filter(e => !hoveredNode || e.target === hoveredNode).map((edge, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 px-1 hover:bg-white/5 rounded transition-colors group">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-white/50 group-hover:text-white/80 transition-colors truncate max-w-[80px]">{edge.source}</span>
                      <span className="text-[#BC002D]/40">→</span>
                      <span className="text-white/80 group-hover:text-white transition-colors">{edge.target}</span>
                    </div>
                    <div className="text-[9px] text-[#BC002D] font-bold">LV.{edge.weight}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* DISTRIBUTION */}
            <div>
              <div className="flex items-center justify-between mb-3 pb-1 border-b border-white/5">
                <span className="text-[9px] uppercase tracking-[2px] text-white/40">DISTRIBUTION</span>
                <Droplets className="w-3 h-3 text-[#BC002D]" />
              </div>
              <div className="space-y-1">
                {activeEdges.slice(0, 6).map((edge, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 px-1 hover:bg-white/5 rounded transition-colors group">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-white/70 group-hover:text-white transition-colors">{edge.source}</span>
                      <span className="text-white/20">→</span>
                      <span className="text-white/70 group-hover:text-white transition-colors">{edge.target}</span>
                    </div>
                    <div className="text-[9px] text-white/40">LV.{edge.weight}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* EXPORTS */}
            <div>
              <div className="flex items-center justify-between mb-3 pb-1 border-b border-white/5">
                <span className="text-[9px] uppercase tracking-[2px] text-white/40">EXPORTS</span>
                <LogOut className="w-3 h-3 text-white/40" />
              </div>
              <div className="space-y-1">
                {EXPORT_EDGES.filter(e => {
                    if (viewMode === 'japan') return JP_REFINERIES.includes(e.source);
                    if (viewMode === 'korea') return SK_REFINERIES.includes(e.source);
                    if (viewMode === 'china') return CN_REFINERIES.includes(e.source);
                    if (viewMode === 'taiwan') return TW_REFINERIES.includes(e.source);
                    if (viewMode === 'northkorea') return NK_REFINERIES.includes(e.source);
                    return false;
                }).filter(e => !hoveredNode || e.source === hoveredNode).map((edge, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 px-1 hover:bg-white/5 rounded transition-colors group">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-white/80 group-hover:text-white transition-colors">{edge.source}</span>
                      <span className="text-white/20">→</span>
                      <span className="text-white/50 group-hover:text-white/80 transition-colors truncate max-w-[80px]">{edge.target}</span>
                    </div>
                    <div className="text-[9px] text-white/30">LV.{edge.weight}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* TRANSPORT MODE SELECTOR */}
        <div className="mt-6 pt-6 border-t border-white/5">
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setTransportMode('ship')}
              className={`flex items-center justify-center gap-2 py-3 rounded-[2px] border transition-all ${
                transportMode === 'ship' 
                ? 'bg-[#BC002D] border-[#BC002D] text-white shadow-[0_0_15px_rgba(188,0,45,0.4)]' 
                : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10'
              }`}
            >
              <Ship className="w-3.5 h-3.5" />
              <span className="text-[9px] font-bold tracking-widest uppercase">Sea</span>
            </button>
            <button 
              onClick={() => setTransportMode('truck')}
              className={`flex items-center justify-center gap-2 py-3 rounded-[2px] border transition-all ${
                transportMode === 'truck' 
                ? 'bg-[#BC002D] border-[#BC002D] text-white shadow-[0_0_15px_rgba(188,0,45,0.4)]' 
                : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span className="text-[9px] font-bold tracking-widest uppercase">Land</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* STATUS BAR (Top Right) */}
      <div className="absolute top-6 right-6 z-10">
        <div className="flex items-center gap-3 hud-glass px-4 py-2 rounded-[2px] glossy-gradient text-[10px] uppercase font-bold tracking-[2.5px]">
          <div className="w-2 h-2 bg-[#BC002D] rounded-full animate-pulse shadow-[0_0_10px_#BC002D]" />
          <span>MISSION LIVE</span>
        </div>
      </div>

      {/* MINIMALIST LEGEND STRIP (Bottom Center) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hud-glass px-6 py-2 rounded-[2px] flex items-center gap-8 glossy-gradient border border-white/5 shadow-2xl">
        {viewMode === 'global' ? (
          <div className="flex items-center gap-6">
            {teamNodes.map((team, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ 
                    backgroundColor: team.assignee !== 'UNASSIGNED' ? `rgb(${team.color.join(',')})` : '#333',
                    boxShadow: team.assignee !== 'UNASSIGNED' ? `0 0 8px rgba(${team.color.join(',')}, 0.5)` : 'none'
                  }} 
                />
                <span className="text-[9px] uppercase tracking-[1px] text-white/50">
                  {team.continent}: <span className={team.assignee !== 'UNASSIGNED' ? 'text-white' : 'text-white/20'}>{team.assignee}</span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-6 border-r border-white/10 pr-6">
                {Object.entries(COMPANY_COLORS).filter(([name]) => {
                    if (viewMode === 'japan') return ['ENEOS', 'Idemitsu', 'Cosmo'].includes(name);
                    if (viewMode === 'korea') return ['SK Energy', 'GS Caltex', 'S-Oil', 'HD Hyundai'].includes(name);
                    if (viewMode === 'china') return ['Sinopec', 'PetroChina', 'CNOOC'].includes(name);
                    if (viewMode === 'taiwan') return ['CPC Corporation', 'Formosa Petro'].includes(name);
                    if (viewMode === 'northkorea') return ['KPC State'].includes(name);
                    return false;
                }).map(([name, color], idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <div className="w-4 h-0.5" style={{ backgroundColor: `rgb(${color.join(',')})`, boxShadow: `0 0 8px rgba(${color.join(',')}, 0.5)` }} />
                        <span className="text-[9px] uppercase tracking-[1px] text-white/60">{name}</span>
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 border border-white/40 rotate-45" />
                  <span className="text-[9px] uppercase tracking-[1px] text-white/40">Refinery</span>
              </div>
              <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 border border-white/40 rounded-full" />
                  <span className="text-[9px] uppercase tracking-[1px] text-white/40">Terminal</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* NODE TELEMETRY HUD (Top Left Overlay) */}
      {hoverInfo && (
        <HUDBox className="absolute top-6 left-[304px] z-10 w-[280px]" title="TELEMETRY">
          <div className="animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="flex items-baseline justify-between mb-1">
              <div className="font-black text-[18px] uppercase tracking-[2px] text-white">
                {hoverInfo.name}
              </div>
              <div className="text-[10px] text-[#BC002D] font-bold px-1.5 py-0.5 bg-[#BC002D]/10 border border-[#BC002D]/30">LIVE</div>
            </div>

            {CENTRALITY[hoverInfo.name] ? (
              <>
                <div className="text-[9px] text-[#BC002D]/80 font-bold uppercase tracking-[1.5px] mb-5 border-l-2 border-[#BC002D] pl-2">
                  {REFINERIES.includes(hoverInfo.name) ? 'STRATEGIC REFINERY' : 'DISTRIBUTION HUB'}
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center text-[10px] mb-2 uppercase tracking-[1px]">
                      <span className="text-white/40">Network Capacity</span>
                      <span className="text-white font-black">{CENTRALITY[hoverInfo.name].degree} UNIT / NET</span>
                    </div>
                    <div className="h-1 bg-white/5 w-full rounded-full overflow-hidden">
                      <div className="h-full bg-white/20 w-[60%]" />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center text-[10px] mb-2 uppercase tracking-[1px]">
                      <span className="text-white/40">Influence Index</span>
                      <span className="text-white font-black">{CENTRALITY[hoverInfo.name].betweenness.toFixed(1)}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 w-full rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-gradient-to-r from-[#BC002D]/40 to-[#BC002D] shadow-[0_0_8px_#BC002D] transition-all duration-700 ease-out" 
                        style={{ width: `${(CENTRALITY[hoverInfo.name].betweenness / 4) * 100}%` }} 
                      />
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-white/5">
                    <div className="flex justify-between items-center text-[10px] uppercase tracking-[1px]">
                      <span className="text-white/40">Eigen Influence</span>
                      <span className="text-[#00C9A7] font-black">{(CENTRALITY[hoverInfo.name].eigenvector * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </>
            ) : hoverInfo.name === 'Japan' ? (
              <div className="mt-4">
                <div className="text-[10px] text-white/50 uppercase tracking-[1.5px] mb-6 leading-relaxed">
                  Imperial Operations Center. Global import/export coordination active.
                </div>
                <div className="flex items-center gap-3 bg-[#BC002D]/10 px-4 py-3 border border-[#BC002D]/30 border-l-4">
                   <div className="w-2 h-2 bg-[#BC002D] animate-ping rounded-full" />
                   <span className="text-[10px] font-black uppercase tracking-[2px] text-white">Focus Target Lock [Available]</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="text-[10px] text-white/60 uppercase tracking-[1.5px] border-l-2 border-[#00C9A7] pl-3 py-1">
                  {IMPORT_SOURCES[hoverInfo.name] ? 'INTERNATIONAL SOURCE' : 'MARITIME DESTINATION'}
                </div>
                <div className="bg-white/5 p-3 rounded-[2px] border border-white/5">
                  <div className="flex justify-between items-center text-[9px] uppercase tracking-[1px] mb-1">
                    <span className="text-white/30">Transfer Volume</span>
                    <span className="text-white font-bold">LV. {
                      IMPORT_SOURCES[hoverInfo.name] 
                        ? currentImports.find((e: any) => e.source === hoverInfo.name)?.weight 
                        : EXPORT_EDGES.find((e: any) => e.target === hoverInfo.name)?.weight
                    }</span>
                  </div>
                  <div className="h-0.5 bg-white/10 w-full" />
                </div>
              </div>
            )}
          </div>
        </HUDBox>
      )}
    </div>
  );
}
