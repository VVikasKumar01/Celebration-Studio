import heroCelebrationTable from './images/hero_celebration_table_1792786186518.jpg';
import avatarCoordinator from './images/avatar_coordinator_1792786187158.jpg';
import vendorVenueGlasshouse from './images/vendor_venue_glasshouse_1792788421157.jpg';
import vendorCateringGourmet from './images/vendor_catering_gourmet_1792788434732.jpg';
import vendorPhotoStory from './images/vendor_photo_story_1792788449975.jpg';
import vendorDecorFlorals from './images/vendor_decor_florals_1792788465584.jpg';
import vendorMusicDj from './images/vendor_music_dj_1792788482173.jpg';

export const IMAGES = {
  hero: heroCelebrationTable,
  avatarCoordinator: avatarCoordinator,
  venue: vendorVenueGlasshouse,
  catering: vendorCateringGourmet,
  photography: vendorPhotoStory,
  decor: vendorDecorFlorals,
  music: vendorMusicDj,
  logistics: heroCelebrationTable,
} as const;

export const CATEGORY_IMAGE_MAP: Record<string, string> = {
  'Venue': vendorVenueGlasshouse,
  'Catering': vendorCateringGourmet,
  'Photography': vendorPhotoStory,
  'Decor & Florals': vendorDecorFlorals,
  'Music & DJ': vendorMusicDj,
  'Logistics': heroCelebrationTable,
};

export const BUDGET_IMAGE_MAP: Record<string, string> = {
  venue: vendorVenueGlasshouse,
  catering: vendorCateringGourmet,
  entertainmentMedia: vendorPhotoStory,
  decor: vendorDecorFlorals,
  logisticsStaffing: heroCelebrationTable,
  contingency: vendorMusicDj,
};

export const resolveVendorImage = (vendor?: { imageUrl?: string; category?: string } | null): string => {
  if (!vendor) return IMAGES.venue;
  if (vendor.imageUrl) {
    if (vendor.imageUrl.includes('glasshouse')) return IMAGES.venue;
    if (vendor.imageUrl.includes('catering') || vendor.imageUrl.includes('gourmet')) return IMAGES.catering;
    if (vendor.imageUrl.includes('photo') || vendor.imageUrl.includes('story')) return IMAGES.photography;
    if (vendor.imageUrl.includes('decor') || vendor.imageUrl.includes('florals')) return IMAGES.decor;
    if (vendor.imageUrl.includes('music') || vendor.imageUrl.includes('dj')) return IMAGES.music;
    if (vendor.imageUrl.includes('hero') || vendor.imageUrl.includes('table')) return IMAGES.hero;
    if (!vendor.imageUrl.startsWith('/src/')) return vendor.imageUrl;
  }
  return (vendor.category && CATEGORY_IMAGE_MAP[vendor.category]) || IMAGES.venue;
};

export default IMAGES;

