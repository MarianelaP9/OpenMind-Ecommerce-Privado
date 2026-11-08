/**
 * OPENMIND_DIRECT_CATALOG_V2
 * Catálogo local revisado de recetas compatibles con OpenMind.
 * Sin JS/CSS remoto, sin descargas y sin consultas a terceros.
 * Los nombres alternativos ayudan a encontrar estilos conocidos en internet,
 * pero las animaciones se ejecutan con implementaciones propias de OpenMind.
 */
import { CAROUSEL_TRANSITIONS } from './carouselTransitionLibrary';
import type { ImportedCarouselPreset, ImportedProductPreset } from './importedEffectPresets';
import type { MotionEffectId, LightEffectId } from './effectLibrary';

type ContentPreset = Omit<ImportedCarouselPreset, 'id'> | Omit<ImportedProductPreset, 'id'>;
export type CatalogEffect = ContentPreset & {
  key: string;
  description: string;
  keywords: string;
  category: 'Suaves' | 'Movimiento' | 'Brillo' | 'Destacados';
};

type ProductRecipe = {
  key: string;
  name: string;
  description: string;
  keywords: string;
  category: CatalogEffect['category'];
  motion: MotionEffectId;
  light: LightEffectId;
};

const productRecipes: readonly ProductRecipe[] = [
  { key: 'brillo-suave', name: 'Brillo suave', description: 'Un reflejo cruza el producto al señalarlo.', keywords: 'brillo shine shimmer glint gloss reflejo', category: 'Brillo', motion: 'none', light: 'shine' },
  { key: 'levitar', name: 'Flotar', description: 'La fotografía se eleva ligeramente.', keywords: 'flotar float hover lift elevate', category: 'Suaves', motion: 'lift', light: 'none' },
  { key: 'zoom', name: 'Zoom delicado', description: 'Aumenta suavemente al pasar el mouse.', keywords: 'zoomIn scale grow ampliar acercar', category: 'Suaves', motion: 'zoom', light: 'none' },
  { key: 'borde-brillante', name: 'Borde luminoso', description: 'Destaca el marco sin cambiar el color del producto.', keywords: 'border glow outline shine brillo marco', category: 'Brillo', motion: 'none', light: 'border' },
  { key: 'luz-estrellas', name: 'Estrellitas', description: 'Puntos luminosos sobre la imagen.', keywords: 'twinkle stars glitter sparkle estrellas', category: 'Brillo', motion: 'none', light: 'twinkle' },
  { key: 'elevacion-brillo', name: 'Elevar y brillar', description: 'Sube y aparece una iluminación suave.', keywords: 'lift glow raise hover resplandor', category: 'Destacados', motion: 'lift', light: 'glow' },
  { key: 'acercar-brillo', name: 'Zoom con reflejo', description: 'Acercamiento combinado con barrido de luz.', keywords: 'zoom shine pulse shimmer zoomIn', category: 'Destacados', motion: 'zoom', light: 'shine' },
  { key: 'giro', name: 'Giro delicado', description: 'Rotación breve para destacar una foto.', keywords: 'rotate rotateIn turn girar', category: 'Movimiento', motion: 'rotate', light: 'none' },
  { key: 'inclinacion', name: 'Inclinación 3D', description: 'Efecto de perspectiva al señalar.', keywords: 'tilt 3d perspective inclinar giro', category: 'Movimiento', motion: 'tilt', light: 'none' },
  { key: 'rebote', name: 'Salto de imagen', description: 'La imagen se agranda con energía.', keywords: 'bounce pop bounceIn grow agrandar', category: 'Movimiento', motion: 'pop', light: 'none' },
  { key: 'chispa', name: 'Chispas suaves', description: 'Pequeños destellos en la fotografía.', keywords: 'sparkle sparkleStars glitter chispa', category: 'Brillo', motion: 'none', light: 'sparkle' },
  { key: 'deslizar', name: 'Deslizar al lado', description: 'Desplazamiento horizontal ligero.', keywords: 'slide slideInRight mover derecha', category: 'Movimiento', motion: 'slide', light: 'none' },
  { key: 'alejar', name: 'Alejamiento', description: 'La fotografía se reduce ligeramente.', keywords: 'zoomOut shrink disminuir alejar', category: 'Suaves', motion: 'shrink', light: 'none' },
  { key: 'flash', name: 'Destello rápido', description: 'Iluminación blanca momentánea.', keywords: 'flash destello blink brillo', category: 'Brillo', motion: 'none', light: 'flash' },
  { key: 'resplandor', name: 'Resplandor blanco', description: 'Halo neutro en los bordes.', keywords: 'glow halo resplandor glowOnHover', category: 'Brillo', motion: 'none', light: 'glow' },
  { key: 'haz-luz', name: 'Haz de luz', description: 'Una franja luminosa atraviesa el producto.', keywords: 'beam light sweep rayo streak', category: 'Brillo', motion: 'none', light: 'beam' },
  { key: 'pulso', name: 'Pulso de luz', description: 'La luz aparece y desaparece.', keywords: 'pulse breathe heartbeat latido', category: 'Brillo', motion: 'none', light: 'pulse' },
  { key: 'inclinar-estrellas', name: 'Giro con estrellas', description: 'Inclinación ligera y destellos blancos.', keywords: 'tilt twinkle estrellas brillo 3D', category: 'Destacados', motion: 'tilt', light: 'twinkle' },
  { key: 'pop-flash', name: 'Salto y destello', description: 'Acercamiento marcado con un flash breve.', keywords: 'bounceIn pop flash saltar', category: 'Destacados', motion: 'pop', light: 'flash' },
  { key: 'deslizar-luz', name: 'Deslizar y brillar', description: 'Movimiento lateral con reflejo.', keywords: 'slide shine mover iluminación', category: 'Destacados', motion: 'slide', light: 'shine' },
  { key: 'brillo-elevacion', name: 'Elevación estelar', description: 'Elevación y pequeños puntos luminosos.', keywords: 'lift sparkle raise stars', category: 'Destacados', motion: 'lift', light: 'sparkle' },
  { key: 'giro-resplandor', name: 'Giro con halo', description: 'Rotación leve y contorno iluminado.', keywords: 'rotate glow resplandor giro', category: 'Destacados', motion: 'rotate', light: 'glow' },
  { key: 'alejar-borde', name: 'Alejar con marco', description: 'La foto se reduce y su borde resalta.', keywords: 'zoomOut border outline shrink', category: 'Destacados', motion: 'shrink', light: 'border' },
  { key: 'inclinar-izquierda', name: 'Inclinar al otro lado', description: 'Rotación ligera hacia la izquierda.', keywords: 'lean rotate left tilt balanceo', category: 'Movimiento', motion: 'lean', light: 'none' },
];

const carouselKeywords: Record<string, string> = {
  fade: 'fadeIn fadeInOut opacity dissolve crossfade desvanecer',
  slide: 'slideIn slideInRight slideLeft slideRight deslizar horizontal',
  zoom: 'zoomIn zoomInDown scale acercamiento',
  blur: 'blurIn focus sharpen desenfoque enfoque',
  rise: 'fadeInUp slideInUp subir ascender',
  reveal: 'wipe reveal slideInLeft cortina izquierda',
  curtain: 'wipeRight cortina inversa revealRight',
  'curtain-up': 'wipeUp revealUp cortina vertical',
  drop: 'fadeInDown slideInDown caer descenso',
  flip: 'flipInX flipInY flip rotate3d volteo',
  diagonal: 'slideDiagonal drift flyIn diagonal',
  bounce: 'bounceIn bounceInUp bounce rebote',
  spin: 'rotateIn spin rotate giro',
  'zoom-blur': 'zoomInBlur softFocus zoom enfoque',
};

export const CURATED_EFFECTS: readonly CatalogEffect[] = [
  ...productRecipes.map((recipe): CatalogEffect => ({
    key: `product-${recipe.key}`,
    name: recipe.name,
    description: recipe.description,
    keywords: `${recipe.keywords} producto imagen fotografía`,
    category: recipe.category,
    kind: 'product',
    settings: { motion: recipe.motion, light: recipe.light },
  })),
  ...CAROUSEL_TRANSITIONS.map((option): CatalogEffect => ({
    key: `carousel-${option.id}`,
    name: option.title,
    description: option.description,
    keywords: `${option.keywords} ${carouselKeywords[option.id] ?? ''} carrusel portada transición`,
    category: option.category === 'Esenciales' ? 'Suaves' : option.category === 'Movimiento' ? 'Movimiento' : 'Destacados',
    kind: 'carousel',
    settings: { mode: 'automatic', interval: 5, transition: option.id, indicators: true },
  })),
];

/** Coincidencia flexible: mayúsculas, acentos, espacios y términos en inglés. */
function normalize(value: string): string {
  return value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export function searchCuratedEffects(kind: 'carousel' | 'product', query: string): CatalogEffect[] {
  const words = normalize(query).split(/\s+/).filter(Boolean).slice(0, 8);
  return CURATED_EFFECTS.filter(effect => {
    if (effect.kind !== kind) return false;
    const text = normalize(`${effect.name} ${effect.description} ${effect.keywords} ${effect.category}`);
    return words.every(word => text.includes(word));
  });
}
