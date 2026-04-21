import { TEAM_ASSIGNMENTS } from './team_config';

// --- DATA ARCHIVE: INTERNAL LOGISTICS & PORT-LEVEL DATA ---

export const LOCATIONS: Record<string, [number, number]> = {
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
  'Nampo': [125.40, 38.73],
  'Sinuiju': [124.39, 40.10],
  'Wonsan': [127.44, 39.15],
};

export const REFINERIES = [
  'Chiba', 'Kawasaki', 'Negishi', 'Sakai', 'Aichi', 'Mizushima', 'Niigata',
  'Ulsan', 'Yeosu', 'Onsan', 'Daesan',
  'Ningbo', 'Tianjin', 'Huizhou',
  'Kaohsiung', 'Taoyuan', 'Mailiao',
  'Nampo'
];

export const JP_INITIAL_EDGES = [
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

export const SK_INITIAL_EDGES = [
  { id: 'sk-1', source: 'Yeosu', target: 'Ulsan', weight: 4 },
  { id: 'sk-2', source: 'Yeosu', target: 'Busan', weight: 3 },
  { id: 'sk-3', source: 'Ulsan', target: 'Incheon', weight: 5 },
  { id: 'sk-4', source: 'Daesan', target: 'Incheon', weight: 4 },
  { id: 'sk-5', source: 'Onsan', target: 'Busan', weight: 2 },
];

export const TW_DOMESTIC_EDGES = [
  { id: 'tw-1', source: 'Kaohsiung', target: 'Taoyuan', weight: 3 },
  { id: 'tw-2', source: 'Mailiao', target: 'Kaohsiung', weight: 4 },
];

export const NK_DOMESTIC_EDGES = [
  { id: 'nk-1', source: 'Nampo', target: 'Sinuiju', weight: 3 },
  { id: 'nk-2', source: 'Nampo', target: 'Wonsan', weight: 2 },
];

export const CENTRALITY: Record<string, { degree: number; betweenness: number; eigenvector: number; closeness: number; }> = {
  Chiba: { degree: 5, betweenness: 4.0, eigenvector: 0.049, closeness: 1.0 },
  Negishi: { degree: 5, betweenness: 4.0, eigenvector: 0.049, closeness: 1.0 },
  Sakai: { degree: 5, betweenness: 4.0, eigenvector: 0.049, closeness: 1.0 },
  Mizushima: { degree: 5, betweenness: 1.0, eigenvector: 0.0, closeness: 1.0 },
  Kawasaki: { degree: 3, betweenness: 2.0, eigenvector: 0.049, closeness: 1.0 },
  Niigata: { degree: 3, betweenness: 0.0, eigenvector: 1.0, closeness: 0.0 },
  Ulsan: { degree: 5, betweenness: 3.5, eigenvector: 0.82, closeness: 0.9 },
  Yeosu: { degree: 4, betweenness: 2.8, eigenvector: 0.75, closeness: 0.8 },
  Ningbo: { degree: 6, betweenness: 5.0, eigenvector: 0.95, closeness: 1.0 },
  Shanghai: { degree: 5, betweenness: 4.2, eigenvector: 0.88, closeness: 0.9 },
  Kaohsiung: { degree: 5, betweenness: 3.8, eigenvector: 0.85, closeness: 0.9 },
};

export const NODE_COMPANIES: Record<string, string> = {
  Negishi: 'ENEOS', Kawasaki: 'ENEOS', Chiba: 'ENEOS',
  Mizushima: 'Idemitsu', Sakai: 'Cosmo', Aichi: 'Cosmo', Niigata: 'ENEOS',
  Ulsan: 'SK Energy', Yeosu: 'GS Caltex', Onsan: 'S-Oil', Daesan: 'HD Hyundai',
  Incheon: 'SK Energy', Ningbo: 'Sinopec', Shanghai: 'Sinopec',
  Tianjin: 'PetroChina', Huizhou: 'CNOOC',
  Kaohsiung: 'CPC Corporation', Taoyuan: 'CPC Corporation', Mailiao: 'Formosa Petro',
  Nampo: 'KPC State', Sinuiju: 'KPC State', Wonsan: 'KPC State',
};
