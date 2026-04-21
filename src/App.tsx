import React, { useState, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { ArcLayer, TextLayer } from 'deck.gl';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Globe, Droplets } from 'lucide-react';
import { TEAM_ASSIGNMENTS } from './team_config';

// --- GLOBAL STRATEGIC COORDS (BBL Standard) ---

const LOCATIONS: Record<string, [number, number]> = {
  'Spain Hub': [-3.7, 40.4],
  'Netherlands Hub': [4.9, 52.4],
  'Oman': [58.4, 23.6],
  'India': [77.2, 28.6],
  'Canada': [-96.8, 49.8],
  'Malaysia': [101.7, 3.1],
  'Singapore': [103.8, 1.35],
  'Thailand': [100.5, 13.7],
  'Israel': [34.8, 31.0],
  'Australia': [133.8, -25.3],
  'Belgium': [4.5, 50.5],
  'France': [2.2, 46.2],
  'Germany': [10.5, 51.2],
  'Indonesia': [113.9, -0.8],
  'Italy': [12.6, 41.9],
  'Nigeria': [8.7, 9.1],
  'Norway': [8.5, 60.5],
  'Pakistan': [69.3, 30.4],
  'United Kingdom': [-3.4, 55.4],
  'Vietnam': [108.3, 14.1],
  'Turkey': [35.2, 39.0],
  'Algeria': [1.7, 28.0],
  'Argentina': [-63.6, -38.4],
  'Saudi Arabia': [45.1, 23.9],
  'Kuwait': [48.0, 29.4],
  'UAE': [53.8, 23.4],
  'Russia Kozmino': [132.9, 42.7],
};

const HUB_COORDS: Record<string, [number, number]> = {
  'Japan': [138.0, 36.5],
  'South Korea': [128.0, 36.5],
  'Mainland China': [121.5, 31.0],
  'Taiwan Hub': [121.0, 23.7],
  'Brazil Hub': [-43.2, -22.9],
  'Iran Hub': [50.3, 29.2],
  'USA Hub': [-98.5, 31.5]
};

const VIEW_STATES = {
  global: {
    longitude: 20.0,
    latitude: 25.0,
    zoom: 1.8,
    pitch: 0,
    bearing: 0,
  }
};

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const COLOR_CRIMSON: [number, number, number] = [188, 0, 45];

const App: React.FC = () => {
  const [viewState] = useState<any>(VIEW_STATES.global);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const globalEdges = useMemo(() => {
    const list: any[] = [];
    const BBL_CONV = 6.2898;
    
    // BRAZIL EXPORTS (Converted KL to BBL)
    list.push({ source: 'Brazil Hub', target: 'Mainland China', id: 'g-br-cn', volume: 49376633 * BBL_CONV });
    list.push({ source: 'Brazil Hub', target: 'Spain Hub', id: 'g-br-es', volume: 11628197 * BBL_CONV });
    list.push({ source: 'Brazil Hub', target: 'Netherlands Hub', id: 'g-br-nl', volume: 8023702 * BBL_CONV });
    list.push({ source: 'Brazil Hub', target: 'USA Hub', id: 'g-br-us', volume: 14442665 * BBL_CONV });
    list.push({ source: 'Brazil Hub', target: 'South Korea', id: 'g-br-sk', volume: 3160104 * BBL_CONV });

    // IRAN EXPORTS (Already in BBL)
    list.push({ source: 'Iran Hub', target: 'Mainland China', id: 'g-ir-cn', volume: 4530000 });
    list.push({ source: 'Iran Hub', target: 'UAE', id: 'g-ir-ae', volume: 27670000 });
    list.push({ source: 'Iran Hub', target: 'Oman', id: 'g-ir-om', volume: 2900000 });
    list.push({ source: 'Iran Hub', target: 'Pakistan', id: 'g-ir-pk', volume: 1240000 });

    // USA EXPORTS (The Truth - Converted KL to BBL)
    list.push({ source: 'USA Hub', target: 'South Korea', id: 'g-us-sk', volume: 176208062 * BBL_CONV });
    list.push({ source: 'USA Hub', target: 'Mainland China', id: 'g-us-cn', volume: 8148860 * BBL_CONV });
    list.push({ source: 'USA Hub', target: 'Canada', id: 'g-us-ca', volume: 92472582 * BBL_CONV });
    list.push({ source: 'USA Hub', target: 'Netherlands Hub', id: 'g-us-nl', volume: 306952849 * BBL_CONV });
    list.push({ source: 'USA Hub', target: 'Taiwan Hub', id: 'g-us-tw', volume: 76045198 * BBL_CONV });
    list.push({ source: 'USA Hub', target: 'United Kingdom', id: 'g-us-uk', volume: 63507363 * BBL_CONV });
    list.push({ source: 'USA Hub', target: 'Japan', id: 'g-us-jp', volume: 36954828 * BBL_CONV });
    list.push({ source: 'USA Hub', target: 'India', id: 'g-us-in', volume: 112546350 * BBL_CONV });
    list.push({ source: 'USA Hub', target: 'Germany', id: 'g-us-de', volume: 38322400 * BBL_CONV });

    // STRATEGIC ARTERIES (Converted KL to BBL)
    list.push({ source: 'Saudi Arabia', target: 'Japan', id: 'g-sa-jp', volume: 6000375 * BBL_CONV });
    list.push({ source: 'UAE', target: 'Japan', id: 'g-uae-jp', volume: 1415982 * BBL_CONV });
    list.push({ source: 'Kuwait', target: 'South Korea', id: 'g-ku-sk', volume: 1200000 * BBL_CONV });
    list.push({ source: 'Russia Kozmino', target: 'Mainland China', id: 'g-ru-cn', volume: 1200800 * BBL_CONV });

    return list;
  }, []);

  const globalNodes = useMemo(() => {
    const list: any[] = [];
    const allRefs = { ...HUB_COORDS, ...LOCATIONS };
    Object.entries(allRefs).forEach(([name, coordinates]) => {
      list.push({ name, coordinates, isHub: !!HUB_COORDS[name] });
    });
    return list;
  }, []);

  const layers = [
    new ArcLayer({
      id: 'global-arcs',
      data: globalEdges,
      getSourcePosition: (d: any) => HUB_COORDS[d.source] || LOCATIONS[d.source] || [0,0],
      getTargetPosition: (d: any) => HUB_COORDS[d.target] || LOCATIONS[d.target] || [0,0],
      getSourceColor: (d: any) => {
        const active = !hoveredNode || d.source === hoveredNode || d.target === hoveredNode;
        const base = d.source === 'Brazil Hub' ? [0, 155, 72] : d.source === 'Iran Hub' ? [0, 100, 255] : d.source === 'USA Hub' ? [0, 82, 155] : COLOR_CRIMSON;
        return [...base, active ? 180 : 20];
      },
      getTargetColor: (d: any) => {
        const active = !hoveredNode || d.source === hoveredNode || d.target === hoveredNode;
        const base = d.source === 'Brazil Hub' ? [0, 155, 72] : d.source === 'Iran Hub' ? [0, 100, 255] : d.source === 'USA Hub' ? [0, 82, 155] : COLOR_CRIMSON;
        return [...base, active ? 80 : 10];
      },
      getWidth: (d: any) => Math.max(1, Math.log10(d.volume) - 5) * 3,
    }),
    new TextLayer({
      id: 'global-labels',
      data: globalNodes,
      getPosition: (d: any) => d.coordinates,
      getText: (d: any) => d.name,
      getSize: (d: any) => d.isHub ? 16 : 10,
      getColor: [255, 255, 255, 180],
      getAlignmentBaseline: 'bottom',
      onHover: (info: any) => setHoveredNode(info.object?.name || null),
      pickable: true
    })
  ];

  const totalStrategicVolume = useMemo(() => {
    return globalEdges.reduce((sum, e) => sum + e.volume, 0);
  }, [globalEdges]);

  return (
    <div className="h-screen w-full bg-[#050505] text-white font-sans selection:bg-[#BC002D]/30 overflow-hidden relative">
      <DeckGL initialViewState={viewState} controller={true} layers={layers}>
        <Map mapStyle={MAP_STYLE} />
      </DeckGL>

      {/* MISSION CONTROL SIDEBAR */}
      <div className="absolute top-0 left-0 h-full w-[300px] bg-black/60 border-r border-white/10 p-8 flex flex-col z-10 backdrop-blur-3xl">
        <div className="mb-12">
          <h1 className="text-xl font-black tracking-[4px] text-white leading-none mb-2">HINOMARU COMMAND</h1>
          <div className="text-[9px] text-white/30 uppercase tracking-[2px] border-l border-[#BC002D] pl-2">GLOBAL_STRATEGIC_INTERFACE</div>
        </div>

        <div className="flex-1 space-y-10">
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-[#BC002D]/10 flex items-center justify-center border border-[#BC002D]/20">
                <Globe className="w-4 h-4 text-[#BC002D]" />
              </div>
              <div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Total Strategic Flux</div>
                <div className="text-lg font-black font-mono">{(totalStrategicVolume / 1000000).toFixed(1)}M <span className="text-xs text-white/30 font-normal uppercase">BBL</span></div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
             <div className="text-[10px] uppercase tracking-[3px] text-white/20 font-black">Active Theaters</div>
             {Object.entries(TEAM_ASSIGNMENTS).map(([continent, data], idx) => (
               <div key={idx} className="flex items-center justify-between group cursor-help">
                 <div className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: `rgb(${data.color.join(',')})` }} />
                   <span className="text-[11px] uppercase tracking-wider text-white/50 group-hover:text-white transition-colors">{continent}</span>
                 </div>
                 <span className="text-[9px] font-mono text-white/20 uppercase">{data.assignee}</span>
               </div>
             ))}
          </section>
        </div>

        <div className="mt-auto pt-8 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-4 bg-[#BC002D]/5 p-4 border border-[#BC002D]/20 rounded-sm">
             <div className="text-[9px] uppercase tracking-widest text-[#BC002D] font-black animate-pulse">Unit Locked: Barrels (BBL)</div>
          </div>
        </div>
      </div>

      {/* TOP STATUS */}
      <div className="absolute top-6 right-6 z-10">
        <div className="flex items-center gap-4 bg-black/40 backdrop-blur-xl px-5 py-2.5 border border-white/10 rounded-sm">
           <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-[#BC002D] rounded-full animate-ping" />
             <span className="text-[10px] font-black tracking-[2px] uppercase">Mission Live</span>
           </div>
           <div className="w-px h-3 bg-white/20" />
           <span className="text-[10px] font-mono text-white/40 uppercase">UTC+9 / GLOBAL_MONITOR</span>
        </div>
      </div>

      {/* LEGEND overlay */}
      <div className="absolute bottom-8 right-8 z-10 flex gap-8 bg-black/20 backdrop-blur-md p-6 border border-white/5 rounded-sm">
         <div className="flex items-center gap-2">
           <div className="w-4 h-0.5 bg-[#00529B] shadow-[0_0_8px_#00529B]" />
           <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">USA Channels</span>
         </div>
         <div className="flex items-center gap-2">
           <div className="w-4 h-0.5 bg-[#009B48] shadow-[0_0_8px_#009B48]" />
           <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Brazil Channels</span>
         </div>
         <div className="flex items-center gap-2">
           <div className="w-4 h-0.5 bg-[#BC002D] shadow-[0_0_8px_#BC002D]" />
           <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Pacific Strategic Flux</span>
         </div>
      </div>
    </div>
  );
};

export default App;
