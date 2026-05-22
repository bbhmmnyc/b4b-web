// Muted, matted color palette — darker pigments for text/accents
// Pastel card gradients — soft wash fills for full-card backgrounds

const MUTED_COLORS = {
  'social-media':          { base: '#3D6B8E', light: '#3D6B8E22', cardFrom: '#B8DCF0', cardTo: '#E0F0FA' },
  'seo-sem':               { base: '#C4942A', light: '#C4942A22', cardFrom: '#F5DFA0', cardTo: '#FFF8E1' },
  'influencer-marketing':  { base: '#B4687A', light: '#B4687A22', cardFrom: '#E8B8D0', cardTo: '#FBE8F0' },
  'integrated-marketing':  { base: '#2D8B7A', light: '#2D8B7A22', cardFrom: '#A8E6CF', cardTo: '#E0F5EC' },
  'consumer-behavior':     { base: '#7B5E8D', light: '#7B5E8D22', cardFrom: '#C8B8E0', cardTo: '#EDE5F5' },
  'branding':              { base: '#C2544D', light: '#C2544D22', cardFrom: '#F0B8B0', cardTo: '#FDE8E5' },
  'marketing-tools':       { base: '#BF6B3A', light: '#BF6B3A22', cardFrom: '#F0C8A0', cardTo: '#FFF0E0' },
  'digital-marketing':     { base: '#5C8A6E', light: '#5C8A6E22', cardFrom: '#B0D8C0', cardTo: '#E0F0E8' },
  'marketing-and-ai':      { base: '#4A6FA5', light: '#4A6FA522', cardFrom: '#C0B8E0', cardTo: '#E8E0F5' },
  'keywords':              { base: '#A67C52', light: '#A67C5222', cardFrom: '#D8C8A8', cardTo: '#F5EFE0' },
  'careers':               { base: '#6B8E5C', light: '#6B8E5C22', cardFrom: '#C8E0A8', cardTo: '#F0F5E0' },
  'growth-hacking':        { base: '#C2544D', light: '#C2544D22', cardFrom: '#F0B8B0', cardTo: '#FDE8E5' },
};

// Fallback color cycle for dynamic/user-added categories
const COLOR_CYCLE = [
  { base: '#3D6B8E', light: '#3D6B8E22', cardFrom: '#B8DCF0', cardTo: '#E0F0FA' },
  { base: '#C4942A', light: '#C4942A22', cardFrom: '#F5DFA0', cardTo: '#FFF8E1' },
  { base: '#B4687A', light: '#B4687A22', cardFrom: '#E8B8D0', cardTo: '#FBE8F0' },
  { base: '#2D8B7A', light: '#2D8B7A22', cardFrom: '#A8E6CF', cardTo: '#E0F5EC' },
  { base: '#7B5E8D', light: '#7B5E8D22', cardFrom: '#C8B8E0', cardTo: '#EDE5F5' },
  { base: '#C2544D', light: '#C2544D22', cardFrom: '#F0B8B0', cardTo: '#FDE8E5' },
  { base: '#BF6B3A', light: '#BF6B3A22', cardFrom: '#F0C8A0', cardTo: '#FFF0E0' },
  { base: '#5C8A6E', light: '#5C8A6E22', cardFrom: '#B0D8C0', cardTo: '#E0F0E8' },
  { base: '#4A6FA5', light: '#4A6FA522', cardFrom: '#C0B8E0', cardTo: '#E8E0F5' },
  { base: '#A67C52', light: '#A67C5222', cardFrom: '#D8C8A8', cardTo: '#F5EFE0' },
];

export function getCategoryColor(slug) {
  if (MUTED_COLORS[slug]) return MUTED_COLORS[slug];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  return COLOR_CYCLE[Math.abs(hash) % COLOR_CYCLE.length];
}

// Hero title colors — muted, sophisticated
export const TITLE_COLORS = ['#C2544D', '#BF6B3A', '#C4942A', '#5C8A6E', '#2D8B7A', '#3D6B8E', '#4A6FA5', '#7B5E8D', '#B4687A', '#C2544D', '#A67C52', '#6B8E5C', '#BF6B3A'];
