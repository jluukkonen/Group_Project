import React, { useState, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { ArcLayer, TextLayer } from 'deck.gl';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Globe, Droplets, Ship } from 'lucide-react';
import { TEAM_ASSIGNMENTS } from './team_config';

// --- STRATEGIC COORDINATE REGISTRY ---

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
  'Chile': [-71.5, -35.7],
  'Colombia': [-74.3, 4.6],
  'Denmark': [9.5, 56.3],
  'Finland': [25.7, 61.9],
  'France': [2.2, 46.2],
  'Germany': [10.5, 51.2],
  'Indonesia': [113.9, -0.8],
  'Ireland': [-8.2, 53.4],
  'Italy': [12.6, 41.9],
  'Lithuania': [23.9, 55.2],
  'Nicaragua': [-85.2, 12.9],
  'Nigeria': [8.7, 9.1],
  'Norway': [8.5, 60.5],
  'Pakistan': [69.3, 30.4],
  'Panama': [-80.8, 8.5],
  'Peru': [-75.0, -9.2],
  'Poland': [19.1, 51.9],
  'Portugal': [-8.2, 39.4],
  'South Africa': [22.9, -30.6],
  'Sweden': [18.6, 60.1],
  'Switzerland': [8.2, 46.8],
  'United Kingdom': [-3.4, 55.4],
  'Uruguay': [-55.8, -32.5],
  'Vietnam': [108.3, 14.1],
  'Turkey': [35.2, 39.0],
  'Dominican Republic': [-70.2, 18.7],
  'Cayman Islands': [-80.7, 19.3],
  'Honduras': [-86.2, 15.2],
  'Algeria': [1.7, 28.0],
  'Argentina': [-63.6, -38.4],
  'Aruba': [-70.0, 12.5],
  'Bahamas': [-77.4, 25.0],
  'Belarus': [28.0, 53.7],
  'Bermuda': [-64.8, 32.3],
  'Croatia': [15.2, 45.1],
  'Curacao': [-69.0, 12.2],
  'El Salvador': [-88.9, 13.8],
  'Greece': [21.8, 39.1],
  'Jamaica': [-77.3, 18.1],
  'Liberia': [-9.4, 6.4],
  'Martinique': [-61.0, 14.6],
  'New Zealand': [174.9, -40.9],
  'Papua New Guinea': [144.0, -6.3],
  'St Lucia': [-61.0, 13.9],
  'Ukraine': [31.2, 48.4],
  'Afghanistan': [67.7, 33.9],
  'Iraq': [43.7, 33.2],
  'Qatar': [51.2, 25.4],
  'UAE': [53.8, 23.4],
  'Saudi Arabia': [45.1, 23.9],
  'Kuwait': [48.0, 29.4],
};

const HUB_COORDS: Record<string, [number, number]> = {
  'Japan': [137.0, 36.0],
  'South Korea': [128.0, 36.5],
  'Mainland China': [121.5, 31.0],
  'Taiwan Hub': [121.0, 23.7],
  'Brazil Hub': [-43.2, -22.9],
  'Iran Hub': [50.3, 29.2],
  'USA Hub': [-95.4, 29.8]
};

const VIEW_STATES = {
  global: {
    longitude: 30.0,
    latitude: 25.0,
    zoom: 1.8,
    pitch: 0,
    bearing: 0,
    transitionDuration: 1500
  }
};

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const COLOR_CRIMSON: [number, number, number] = [188, 0, 45];

const App: React.FC = () => {
  const [viewState] = useState<any>(VIEW_STATES.global);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const globalEdges = useMemo(() => {
    const list: any[] = [];
    
    // BRAZIL EXPORTS
    list.push({ source: 'Brazil Hub', target: 'Mainland China', weight: 5, id: 'g-br-cn', volume: 49376633 });
    list.push({ source: 'Brazil Hub', target: 'Spain Hub', weight: 3, id: 'g-br-es', volume: 11628197 });
    list.push({ source: 'Brazil Hub', target: 'Netherlands Hub', weight: 2, id: 'g-br-nl', volume: 8023702 });
    list.push({ source: 'Brazil Hub', target: 'USA Hub', weight: 4, id: 'g-br-us', volume: 14442665 });
    list.push({ source: 'Brazil Hub', target: 'South Korea', weight: 3, id: 'g-br-sk', volume: 3160104 });
    list.push({ source: 'Brazil Hub', target: 'UAE', weight: 1, id: 'g-br-ae', volume: 201209 });

    // IRAN EXPORTS
    list.push({ source: 'Iran Hub', target: 'Mainland China', weight: 4, id: 'g-ir-cn', volume: 4530000 });
    list.push({ source: 'Iran Hub', target: 'UAE', weight: 5, id: 'g-ir-ae', volume: 27670000 });
    list.push({ source: 'Iran Hub', target: 'Oman', weight: 3, id: 'g-ir-om', volume: 2900000 });
    list.push({ source: 'Iran Hub', target: 'Pakistan', weight: 2, id: 'g-ir-pk', volume: 1240000 });

    // USA EXPORTS (The Truth)
    list.push({ source: 'USA Hub', target: 'South Korea', weight: 5, id: 'g-us-sk', volume: 176208062 });
    list.push({ source: 'USA Hub', target: 'Mainland China', weight: 3, id: 'g-us-cn', volume: 8148860 });
    list.push({ source: 'USA Hub', target: 'Canada', weight: 4, id: 'g-us-ca', volume: 92472582 });
    list.push({ source: 'USA Hub', target: 'Netherlands Hub', weight: 5, id: 'g-us-nl', volume: 306952849 });
    list.push({ source: 'USA Hub', target: 'Taiwan Hub', weight: 4, id: 'g-us-tw', volume: 76045198 });
    list.push({ source: 'USA Hub', target: 'United Kingdom', weight: 4, id: 'g-us-uk', volume: 63507363 });
    list.push({ source: 'USA Hub', target: 'Japan', weight: 4, id: 'g-us-jp', volume: 36954828 });
    list.push({ source: 'USA Hub', target: 'India', weight: 4, id: 'g-us-in', volume: 112546350 });
    list.push({ source: 'USA Hub', target: 'Germany', weight: 3, id: 'g-us-de', volume: 38322400 });

    // MIDDLE EAST STRATEGIC IMPORTS
    list.push({ source: 'Saudi Arabia', target: 'Japan', weight: 5, id: 'g-sa-jp', volume: 50000000 });
    list.push({ source: 'Kuwait', target: 'South Korea', weight: 4, id: 'g-ku-sk', volume: 30000000 });

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
      getWidth: (d: any) => Math.max(1, Math.log10(d.volume) - 4.5) * 2.5,
    }),
    new TextLayer({
      id: 'global-labels',
      data: globalNodes,
      getPosition: (d: any) => d.coordinates,
      getText: (d: any) => d.name,
      getSize: (d: any) => d.isHub ? 16 : 10,
      getColor: [255, 255, 255, 200],
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
                <div className="text-lg font-black font-mono">{(totalStrategicVolume / 1000000).toFixed(1)}M <span className="text-xs text-white/30 font-normal">KL</span></div>
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
             <Droplets className="w-4 h-4 text-[#BC002D] animate-pulse" />
             <div className="text-[9px] uppercase tracking-widest text-[#BC002D] font-black">System Ready: Strategic Data Lock</div>
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
           <span className="text-[10px] font-mono text-white/40 uppercase">UTC+9 / 17:36:20</span>
        </div>
      </div>

      {/* LEGEND overlay */}
      <div className="absolute bottom-8 right-8 z-10 flex gap-8 bg-black/20 backdrop-blur-md p-6 border border-white/5 rounded-sm">
         <div className="flex items-center gap-2">
           <div className="w-4 h-0.5 bg-[#00529B] shadow-[0_0_8px_#00529B]" />
           <span className="text-[9px] uppercase tracking-widest text-white/40">USA Hub Channels</span>
         </div>
         <div className="flex items-center gap-2">
           <div className="w-4 h-0.5 bg-[#009B48] shadow-[0_0_8px_#009B48]" />
           <span className="text-[9px] uppercase tracking-widest text-white/40">Brazil Hub Channels</span>
         </div>
         <div className="flex items-center gap-2">
           <div className="w-4 h-0.5 bg-[#BC002D] shadow-[0_0_8px_#BC002D]" />
           <span className="text-[9px] uppercase tracking-widest text-white/40">Pacific Strategic Flux</span>
         </div>
      </div>
    </div>
  );
};

export default App;
