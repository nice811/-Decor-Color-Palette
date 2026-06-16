import { RegionCode } from '@/utils/regionDetector';

export interface ColorItem {
  hex: string;
  name: string;
  role: 'primary' | 'secondary' | 'accent' | 'neutral' | 'background';
}

export interface Palette {
  id: string;
  name: string;
  room: 'living' | 'bedroom' | 'kitchen' | 'bathroom';
  style: 'modern' | 'traditional' | 'scandinavian' | 'bohemian';
  region?: RegionCode;
  colors: ColorItem[];
}

const PALETTE_LIBRARY: Palette[] = [
  {
    id: 'modern-warm',
    name: 'Warm Minimalism',
    room: 'living',
    style: 'modern',
    region: 'west',
    colors: [
      { hex: '#F5E6D3', name: 'Soft Cream', role: 'background' },
      { hex: '#D4A574', name: 'Terracotta', role: 'primary' },
      { hex: '#6B4423', name: 'Espresso', role: 'secondary' },
      { hex: '#E8D5B7', name: 'Sand', role: 'neutral' },
      { hex: '#8B6F47', name: 'Oak Brown', role: 'accent' },
    ],
  },
  {
    id: 'scandinavian-calm',
    name: 'Nordic Calm',
    room: 'living',
    style: 'scandinavian',
    region: 'west',
    colors: [
      { hex: '#FAFAFA', name: 'Arctic White', role: 'background' },
      { hex: '#6B7280', name: 'Slate Gray', role: 'primary' },
      { hex: '#9CA3AF', name: 'Cloud Gray', role: 'secondary' },
      { hex: '#F3F4F6', name: 'Mist', role: 'neutral' },
      { hex: '#D97706', name: 'Mustard', role: 'accent' },
    ],
  },
  {
    id: 'bohemian-forest',
    name: 'Forest Dream',
    room: 'living',
    style: 'bohemian',
    region: 'west',
    colors: [
      { hex: '#E8F5E9', name: 'Mint Foam', role: 'background' },
      { hex: '#2F5233', name: 'Forest Green', role: 'primary' },
      { hex: '#8B4513', name: 'Rustic Brown', role: 'secondary' },
      { hex: '#D4C4A8', name: 'Natural Linen', role: 'neutral' },
      { hex: '#C9A227', name: 'Golden Ochre', role: 'accent' },
    ],
  },
  {
    id: 'traditional-classic',
    name: 'Classic Heritage',
    room: 'living',
    style: 'traditional',
    region: 'west',
    colors: [
      { hex: '#FDF8F0', name: 'Ivory Cream', role: 'background' },
      { hex: '#5C4033', name: 'Walnut', role: 'primary' },
      { hex: '#8B0000', name: 'Ruby Red', role: 'secondary' },
      { hex: '#D4AF37', name: 'Classic Gold', role: 'accent' },
      { hex: '#F5DEB3', name: 'Wheat', role: 'neutral' },
    ],
  },
  {
    id: 'bedroom-tranquil',
    name: 'Tranquil Dusk',
    room: 'bedroom',
    style: 'modern',
    region: 'west',
    colors: [
      { hex: '#E8E4E1', name: 'Warm Gray', role: 'background' },
      { hex: '#2D3748', name: 'Charcoal', role: 'primary' },
      { hex: '#718096', name: 'Slate', role: 'secondary' },
      { hex: '#A0AEC0', name: 'Cool Gray', role: 'neutral' },
      { hex: '#D6BCB1', name: 'Dusty Rose', role: 'accent' },
    ],
  },
  {
    id: 'kitchen-fresh',
    name: 'Fresh Kitchen',
    room: 'kitchen',
    style: 'modern',
    region: 'west',
    colors: [
      { hex: '#FFFFFF', name: 'Pure White', role: 'background' },
      { hex: '#4A5568', name: 'Graphite', role: 'primary' },
      { hex: '#E2E8F0', name: 'Ice Blue', role: 'neutral' },
      { hex: '#38B2AC', name: 'Teal Accent', role: 'accent' },
      { hex: '#D69E2E', name: 'Brass Gold', role: 'secondary' },
    ],
  },
  {
    id: 'bathroom-ocean',
    name: 'Ocean Breeze',
    room: 'bathroom',
    style: 'modern',
    region: 'west',
    colors: [
      { hex: '#EBF8FF', name: 'Sky Mist', role: 'background' },
      { hex: '#2C5282', name: 'Deep Ocean', role: 'primary' },
      { hex: '#4299E1', name: 'Sky Blue', role: 'secondary' },
      { hex: '#F7FAFC', name: 'Sea Foam', role: 'neutral' },
      { hex: '#E6FFFA', name: 'Coastal Teal', role: 'accent' },
    ],
  },
  {
    id: 'west-hamptons',
    name: 'Hamptons Beach',
    room: 'living',
    style: 'traditional',
    region: 'west',
    colors: [
      { hex: '#F0F4F8', name: 'Driftwood White', role: 'background' },
      { hex: '#1E3A5F', name: 'Navy Blue', role: 'primary' },
      { hex: '#A8C5DA', name: 'Sky Wash', role: 'secondary' },
      { hex: '#C9B79C', name: 'Sandy Beige', role: 'neutral' },
      { hex: '#E8846B', name: 'Coral Sunset', role: 'accent' },
    ],
  },
  {
    id: 'sea-tropical-breeze',
    name: 'Tropical Breeze',
    room: 'living',
    style: 'modern',
    region: 'sea',
    colors: [
      { hex: '#FFF8E7', name: 'Coconut Cream', role: 'background' },
      { hex: '#FF7F50', name: 'Coral Sunset', role: 'primary' },
      { hex: '#2E8B57', name: 'Palm Green', role: 'secondary' },
      { hex: '#40E0D0', name: 'Turquoise Sea', role: 'accent' },
      { hex: '#D4A574', name: 'Bamboo Tan', role: 'neutral' },
    ],
  },
  {
    id: 'sea-mango-lounge',
    name: 'Mango Lounge',
    room: 'living',
    style: 'bohemian',
    region: 'sea',
    colors: [
      { hex: '#FFFCF2', name: 'Rice Paper', role: 'background' },
      { hex: '#E67E22', name: 'Mango Orange', role: 'primary' },
      { hex: '#FFC300', name: 'Pineapple Gold', role: 'accent' },
      { hex: '#5D6D7E', name: 'Storm Gray', role: 'secondary' },
      { hex: '#E8D4B8', name: 'Rattan', role: 'neutral' },
    ],
  },
  {
    id: 'sea-balinese-retreat',
    name: 'Balinese Retreat',
    room: 'bedroom',
    style: 'bohemian',
    region: 'sea',
    colors: [
      { hex: '#F9F3E3', name: 'Sandstone', role: 'background' },
      { hex: '#3A5F4C', name: 'Rainforest Green', role: 'primary' },
      { hex: '#B8860B', name: 'Golden Frangipani', role: 'accent' },
      { hex: '#D2B48C', name: 'Teak Wood', role: 'secondary' },
      { hex: '#FFE4E1', name: 'Jasmine Mist', role: 'neutral' },
    ],
  },
  {
    id: 'sea-singapore-modern',
    name: 'Singapore Skyline',
    room: 'living',
    style: 'modern',
    region: 'sea',
    colors: [
      { hex: '#F5F5F5', name: 'Marble White', role: 'background' },
      { hex: '#2C3E50', name: 'Marina Blue', role: 'primary' },
      { hex: '#F39C12', name: 'Orchard Gold', role: 'accent' },
      { hex: '#95A5A6', name: 'Concrete Gray', role: 'secondary' },
      { hex: '#E8E8E8', name: 'Linen Light', role: 'neutral' },
    ],
  },
  {
    id: 'sea-thai-elegance',
    name: 'Thai Silk',
    room: 'bedroom',
    style: 'traditional',
    region: 'sea',
    colors: [
      { hex: '#FFFEF0', name: 'Ivory Silk', role: 'background' },
      { hex: '#8B4513', name: 'Teak Brown', role: 'primary' },
      { hex: '#B22222', name: 'Temple Red', role: 'accent' },
      { hex: '#DAA520', name: 'Royal Gold', role: 'secondary' },
      { hex: '#F5DEB3', name: 'Wheat', role: 'neutral' },
    ],
  },
  {
    id: 'jpkr-wabi-sabi',
    name: 'Wabi-Sabi',
    room: 'living',
    style: 'scandinavian',
    region: 'jpkr',
    colors: [
      { hex: '#F5F1E8', name: 'Washi Paper', role: 'background' },
      { hex: '#8B7355', name: 'Cedar Wood', role: 'primary' },
      { hex: '#595959', name: 'Sumi Ink', role: 'secondary' },
      { hex: '#D3CFC1', name: 'Stone Gray', role: 'neutral' },
      { hex: '#3A5F4C', name: 'Moss Green', role: 'accent' },
    ],
  },
  {
    id: 'jpkr-sakura-dream',
    name: 'Sakura Dream',
    room: 'bedroom',
    style: 'modern',
    region: 'jpkr',
    colors: [
      { hex: '#FFF5F5', name: 'Pure White', role: 'background' },
      { hex: '#FFB7C5', name: 'Cherry Blossom', role: 'primary' },
      { hex: '#FF69B4', name: 'Hot Pink', role: 'accent' },
      { hex: '#696969', name: 'Graphite', role: 'secondary' },
      { hex: '#FFF0F5', name: 'Lavender Blush', role: 'neutral' },
    ],
  },
  {
    id: 'jpkr-hanok-minimal',
    name: 'Hanok Minimal',
    room: 'living',
    style: 'modern',
    region: 'jpkr',
    colors: [
      { hex: '#F8F4E8', name: 'Hanji Paper', role: 'background' },
      { hex: '#704214', name: 'Walnut Stain', role: 'primary' },
      { hex: '#C73E3A', name: 'Dancheong Red', role: 'accent' },
      { hex: '#2C3E50', name: 'Charcoal', role: 'secondary' },
      { hex: '#E8E0D0', name: 'Clay Beige', role: 'neutral' },
    ],
  },
  {
    id: 'jpkr-indigo-calm',
    name: 'Indigo Calm',
    room: 'bedroom',
    style: 'scandinavian',
    region: 'jpkr',
    colors: [
      { hex: '#F5F5F5', name: 'Stone White', role: 'background' },
      { hex: '#3F51B5', name: 'Indigo Blue', role: 'primary' },
      { hex: '#1A237E', name: 'Deep Indigo', role: 'secondary' },
      { hex: '#BDBDBD', name: 'Cloud Gray', role: 'neutral' },
      { hex: '#FFF8E1', name: 'Warm Amber', role: 'accent' },
    ],
  },
  {
    id: 'jpkr-korean-serene',
    name: 'Korean Serene',
    room: 'bedroom',
    style: 'traditional',
    region: 'jpkr',
    colors: [
      { hex: '#FFFAF0', name: 'Floral White', role: 'background' },
      { hex: '#5F6B6D', name: 'Jade Stone', role: 'primary' },
      { hex: '#E25822', name: 'Persimmon', role: 'accent' },
      { hex: '#A0522D', name: 'Sienna', role: 'secondary' },
      { hex: '#F4E8D0', name: 'Sand Beige', role: 'neutral' },
    ],
  },
  {
    id: 'sea-bathroom-oasis',
    name: 'Island Oasis',
    room: 'bathroom',
    style: 'modern',
    region: 'sea',
    colors: [
      { hex: '#E0FFFF', name: 'Aquamarine', role: 'background' },
      { hex: '#008B8B', name: 'Dark Cyan', role: 'primary' },
      { hex: '#F0E68C', name: 'Khaki Sand', role: 'neutral' },
      { hex: '#20B2AA', name: 'Light Sea Green', role: 'secondary' },
      { hex: '#FF6347', name: 'Coral Accent', role: 'accent' },
    ],
  },
  {
    id: 'jpkr-kitchen-mujin',
    name: 'Mujin Kitchen',
    room: 'kitchen',
    style: 'modern',
    region: 'jpkr',
    colors: [
      { hex: '#FAFAFA', name: 'Porcelain White', role: 'background' },
      { hex: '#4A4A4A', name: 'Iron Gray', role: 'primary' },
      { hex: '#C9A227', name: 'Brass', role: 'accent' },
      { hex: '#8B7355', name: 'Warm Wood', role: 'secondary' },
      { hex: '#D3D3D3', name: 'Light Gray', role: 'neutral' },
    ],
  },
];

export function getPalettesByFilter(
  room?: Palette['room'],
  style?: Palette['style'],
  region?: RegionCode
): Palette[] {
  return PALETTE_LIBRARY.filter((p) => {
    const roomMatch = !room || p.room === room;
    const styleMatch = !style || p.style === style;
    const regionMatch = !region || !p.region || p.region === region;
    return roomMatch && styleMatch && regionMatch;
  });
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0'))
      .join('')
  ).toUpperCase();
}

const hslToRgb = (h: number, s: number, l: number): string => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
};

interface RegionProfile {
  hueRanges: [number, number][];
  saturation: [number, number];
  lightness: [number, number];
  accentHueRanges: [number, number][];
  neutralLightness: [number, number];
  name: string;
}

const REGION_PROFILES: Record<RegionCode, RegionProfile> = {
  west: {
    name: 'West Market',
    hueRanges: [[0, 40], [180, 230], [30, 60]],
    saturation: [0.18, 0.35],
    lightness: [0.72, 0.92],
    accentHueRanges: [[15, 35], [195, 215], [0, 10]],
    neutralLightness: [0.75, 0.92],
  },
  sea: {
    name: 'Southeast Asia',
    hueRanges: [[15, 45], [150, 180], [180, 200]],
    saturation: [0.45, 0.75],
    lightness: [0.68, 0.90],
    accentHueRanges: [[15, 30], [330, 350], [45, 60]],
    neutralLightness: [0.78, 0.92],
  },
  jpkr: {
    name: 'Japan & Korea',
    hueRanges: [[30, 50], [200, 230], [100, 140]],
    saturation: [0.25, 0.55],
    lightness: [0.70, 0.93],
    accentHueRanges: [[340, 360], [200, 230], [45, 55]],
    neutralLightness: [0.78, 0.94],
  },
};

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pickRange<T>(ranges: T[]): T {
  return ranges[Math.floor(Math.random() * ranges.length)];
}

function pickHue(ranges: [number, number][]): number {
  const [lo, hi] = pickRange(ranges);
  return rand(lo, hi);
}

export function generateRandomPalette(
  room: Palette['room'] = 'living',
  style: Palette['style'] = 'modern',
  region: RegionCode = 'west'
): Palette {
  const profile = REGION_PROFILES[region] || REGION_PROFILES.west;

  const baseHue = pickHue(profile.hueRanges);
  const baseSat = rand(profile.saturation[0], profile.saturation[1]);
  const baseLight = rand(profile.lightness[0], profile.lightness[1]);

  const bg = hslToRgb(baseHue, baseSat * 0.25, baseLight + 0.05);
  const primary = hslToRgb(baseHue, baseSat * 1.1, Math.max(0.25, baseLight - 0.35));
  const secondary = hslToRgb(
    (baseHue + rand(15, 35)) % 360,
    baseSat * 0.9,
    Math.max(0.35, baseLight - 0.20)
  );
  const neutralLight = rand(profile.neutralLightness[0], profile.neutralLightness[1]);
  const neutral = hslToRgb(baseHue, baseSat * 0.15, neutralLight);

  const accentHue = pickHue(profile.accentHueRanges);
  const accent = hslToRgb(accentHue, baseSat * 1.3, Math.max(0.3, baseLight - 0.30));

  return {
    id: `gen-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: `${profile.name} ${Math.round(baseHue)}°`,
    room,
    style,
    region,
    colors: [
      { hex: bg, name: 'Background', role: 'background' },
      { hex: primary, name: 'Primary', role: 'primary' },
      { hex: secondary, name: 'Secondary', role: 'secondary' },
      { hex: neutral, name: 'Neutral', role: 'neutral' },
      { hex: accent, name: 'Accent', role: 'accent' },
    ],
  };
}

export function isLightColor(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

export const ALL_ROOMS: Palette['room'][] = ['living', 'bedroom', 'kitchen', 'bathroom'];
export const ALL_STYLES: Palette['style'][] = ['modern', 'traditional', 'scandinavian', 'bohemian'];

export { PALETTE_LIBRARY, REGION_PROFILES };
