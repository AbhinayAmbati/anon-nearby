import { v4 as uuidv4 } from 'uuid';

const codenameAdjectives = [
  'Cipher', 'Echo', 'Pulse', 'Void', 'Flux', 'Ghost', 'Neon', 'Pixel', 
  'Quantum', 'Shadow', 'Vector', 'Binary', 'Digital', 'Neural', 'Crypto',
  'Matrix', 'Zero', 'Alpha', 'Beta', 'Delta', 'Gamma', 'Omega', 'Phoenix',
  'Raven', 'Storm', 'Thunder', 'Lightning', 'Frost', 'Fire', 'Steel'
];

const codenameNouns = [
  'Node', 'Grid', 'Core', 'Link', 'Port', 'Gate', 'Hub', 'Cell', 
  'Beam', 'Wave', 'Signal', 'Code', 'Key', 'Lock', 'Shard', 'Fragment',
  'Trace', 'Path', 'Route', 'Bridge', 'Tower', 'Spike', 'Blade', 'Shield',
  'Arrow', 'Bolt', 'Star', 'Moon', 'Sun', 'Comet'
];

export const generateCodename = () => {
  const adjective = codenameAdjectives[Math.floor(Math.random() * codenameAdjectives.length)];
  const noun = codenameNouns[Math.floor(Math.random() * codenameNouns.length)];
  const number = Math.floor(Math.random() * 99) + 1;
  
  return `${adjective}${noun}_${number}`;
};

export const generateSessionId = () => {
  return uuidv4();
};

export const generateRoomId = () => {
  return `room_${uuidv4()}`;
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};