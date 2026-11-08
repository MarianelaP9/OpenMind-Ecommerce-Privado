// OPENMIND_UNIFIED_HOVER_LIBRARY_V3
// Una sola biblioteca contextual por grupo. No requiere descargar ni importar archivos.
import { useEffect, useState, type CSSProperties, type ChangeEvent } from 'react';
import type { VisualConfig } from '../../storefront/visual/types';
import {
  MOVEMENT_EFFECTS,
  LIGHT_EFFECTS,
  motionTransform,
  lightStyle,
  type MotionEffectId,
  type LightEffectId,
} from '../../storefront/visual/effectLibrary';
import { CURATED_EFFECTS } from '../../storefront/visual/curatedEffectCatalog';
import { readImportedPresets } from '../../storefront/visual/importedEffectPresets';
import './productHoverInspector.css';
import './effectLibraryInspector.css';
import '../../storefront/visual/image-hover.css';

type Area = 'featured' | 'catalog' | 'category';
type Kind = 'motion' | 'light';
type Field =
  | 'hoverFeaturedMotion' | 'hoverFeaturedLight'
  | 'hoverCatalogMotion' | 'hoverCatalogLight'
  | 'hoverCategoryMotion' | 'hoverCategoryLight';

type Props = {
  hero: VisualConfig['hero'];
  suggestedArea: Area;
  onEdit: (field: Field, value: string) => void;
};

type LibraryItem = {
  id: string;
  name: string;
  description: string;
  searchText: string;
  motion: MotionEffectId;
  light: LightEffectId;
  combination: boolean;
  saved?: boolean;
};

const groups = [
  { id: 'featured', label: 'Destacados', description: 'Fotografías de los productos destacados y banners de productos del inicio.', motion: 'hoverFeaturedMotion', light: 'hoverFeaturedLight' },
  { id: 'catalog', label: 'Catálogo', description: 'Tarjetas de producto en la página de catálogo.', motion: 'hoverCatalogMotion', light: 'hoverCatalogLight' },
  { id: 'category', label: 'Categorías', description: 'Tarjetas de categorías que tienen fotografía.', motion: 'hoverCategoryMotion', light: 'hoverCategoryLight' },
] as const;

function normalize(value: string): string {
  return value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function searchMatches(haystack: string, query: string): boolean {
  return normalize(query).split(/\s+/).filter(Boolean).every(word => normalize(haystack).includes(word));
}

function listOptions(kind: Kind, motion: MotionEffectId, light: LightEffectId, stored: string | undefined): LibraryItem[] {
  const options: LibraryItem[] = [];
  if (kind === 'motion') {
    for (const effect of MOVEMENT_EFFECTS) {
      const aliases = CURATED_EFFECTS.filter(entry => entry.kind === 'product' &&
        entry.settings.motion === effect.id && entry.settings.light === 'none')
        .map(entry => `${entry.name} ${entry.keywords}`).join(' ');
      options.push({
        id: `motion:${effect.id}`, name: effect.label, description: effect.description,
        searchText: `${effect.label} ${effect.description} ${effect.keywords} ${aliases}`,
        motion: effect.id, light, combination: false,
      });
    }
  } else {
    for (const effect of LIGHT_EFFECTS) {
      const aliases = CURATED_EFFECTS.filter(entry => entry.kind === 'product' &&
        entry.settings.light === effect.id && entry.settings.motion === 'none')
        .map(entry => `${entry.name} ${entry.keywords}`).join(' ');
      options.push({
        id: `light:${effect.id}`, name: effect.label, description: effect.description,
        searchText: `${effect.label} ${effect.description} ${effect.keywords} ${aliases}`,
        motion, light: effect.id, combination: false,
      });
    }
  }

  // Las recetas combinadas se encuentran en cualquiera de los dos grupos,
  // pero se explica claramente que actualizan movimiento Y luz.
  for (const effect of CURATED_EFFECTS) {
    if (effect.kind !== 'product') continue;
    if (effect.settings.motion === 'none' || effect.settings.light === 'none') continue;
    options.push({
      id: `recipe:${effect.key}`, name: effect.name, description: effect.description,
      searchText: `${effect.name} ${effect.description} ${effect.keywords} combinación movimiento luz`,
      motion: effect.settings.motion, light: effect.settings.light, combination: true,
    });
  }

  // Se conservan accesibles las recetas que ya existan en la tienda.
  for (const preset of readImportedPresets(stored)) {
    if (preset.kind !== 'product') continue;
    if (kind === 'motion' && preset.settings.motion === 'none') continue;
    if (kind === 'light' && preset.settings.light === 'none') continue;
    options.push({
      id: `saved:${preset.id}`, name: preset.name, description: 'Receta que ya tienes guardada.',
      searchText: `${preset.name} mis efectos guardado favorito`,
      motion: preset.settings.motion, light: preset.settings.light,
      combination: true, saved: true,
    });
  }
  return options;
}

export function ProductHoverInspector({ hero, suggestedArea, onEdit }: Props) {
  const [area, setArea] = useState<Area>(suggestedArea);
  const [opened, setOpened] = useState<Kind | null>(null);
  const [query, setQuery] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [replay, setReplay] = useState(0);

  useEffect(() => {
    setArea(suggestedArea);
    setOpened(null);
  }, [suggestedArea]);

  const current = groups.find(group => group.id === area) ?? groups[0];
  const motion: MotionEffectId = hero[current.motion] ?? 'none';
  const light: LightEffectId = hero[current.light] ?? 'none';

  function toggle(kind: Kind) {
    setOpened(old => old === kind ? null : kind);
    setQuery('');
    setSelectedKey(null);
    setReplay(value => value + 1);
  }

  function apply(item: LibraryItem, kind: Kind) {
    // Las opciones individuales conservan el otro efecto. Solo las recetas
    // explícitamente marcadas como combinación modifican ambas dimensiones.
    if (kind === 'motion' || item.combination) {
      if (item.motion !== motion) onEdit(current.motion, item.motion);
    }
    if (kind === 'light' || item.combination) {
      if (item.light !== light) onEdit(current.light, item.light);
    }
  }

  function library(kind: Kind) {
    const options = listOptions(kind, motion, light, hero.importedEffectPresets);
    const filtered = options.filter(item => searchMatches(item.searchText, query));
    const selected = filtered.find(item => item.id === selectedKey) ?? filtered[0];
    const active = selected !== undefined && selected.motion === motion && selected.light === light;
    const style = {
      '--ve-sample-transform': motionTransform(selected?.motion ?? motion),
      '--ve-sample-overlay-animation': lightStyle(selected?.light ?? light).animation,
      '--ve-sample-overlay-background': lightStyle(selected?.light ?? light).background,
    } as CSSProperties;
    const name = kind === 'motion' ? 'movimientos' : 'efectos de luz';

    return (
      <section className="ve-effect-library ve-effect-library--inline" aria-label={`Buscar ${name}`}>
        <label className="ve-effect-library__search-label" htmlFor={`ve-effect-search-${kind}`}>
          Buscar {name} por nombre
        </label>
        <input
          id={`ve-effect-search-${kind}`}
          className="ve-effect-library__search"
          type="search"
          placeholder={kind === 'motion' ? 'Ej.: zoom, giro, bounce, flotar…' : 'Ej.: glow, brillo, destello, estrellas…'}
          value={query}
          onChange={(event: ChangeEvent<HTMLInputElement>) => { setQuery(event.target.value); setSelectedKey(null); }}
        />
        <p className="ve-effect-library__count">{filtered.length} opciones · Biblioteca de OpenMind</p>
        <div className="ve-effect-library__results" aria-label={`Resultados de ${name}`}>
          {filtered.map(item => (
            <button
              type="button"
              key={item.id}
              className={selected?.id === item.id ? 'is-previewing' : ''}
              aria-pressed={selected?.id === item.id}
              onClick={() => { setSelectedKey(item.id); setReplay(value => value + 1); }}
            >
              <strong>{item.name}</strong>
              <span>{item.description}</span>
              {item.combination && <em>{item.saved ? 'Mi efecto guardado · ' : ''}Combina movimiento y luz</em>}
            </button>
          ))}
          {filtered.length === 0 && <p className="ve-effect-library__empty">Sin resultados. Prueba con otra palabra.</p>}
        </div>
        {selected && (
          <div className="ve-effect-library__preview" aria-live="polite">
            <strong>Vista previa: {selected.name}</strong>
            <div key={`${selected.id}-${replay}`} className="ve-effect-library__sample" style={style} tabIndex={0}
              aria-label="Muestra interactiva. Pasa el mouse para ver el efecto.">
              <div className="ve-effect-library__sample-art" aria-hidden="true">🪴</div>
            </div>
            <button type="button" className="ve-effect-library__repeat" onClick={() => setReplay(value => value + 1)}>
              Probar otra vez
            </button>
            {selected.combination && <p>Esta combinación cambia tanto el movimiento como la iluminación.</p>}
            <button type="button" className="ve-effect-library__apply" disabled={active}
              onClick={() => apply(selected, kind)}>
              {active ? 'Efecto en uso' : selected.combination ? 'Aplicar combinación' : 'Aplicar este efecto'}
            </button>
            <p>Seleccionar solo muestra el efecto. Al aplicar, recuerda pulsar «Guardar cambios» arriba.</p>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="ve-hover-panel" aria-labelledby="ve-hover-heading">
      <div className="ve-hover-panel__heading">
        <span className="ve-hover-panel__eyebrow">INTERACCIÓN CON EL MOUSE</span>
        <h2 id="ve-hover-heading">Efectos de las fotografías</h2>
        <p>Escoge un movimiento y una iluminación. Puedes usarlos por separado o juntos.</p>
      </div>

      <label className="ve-hover-panel__label" htmlFor="ve-hover-area">Dónde aplicar los efectos</label>
      <select id="ve-hover-area" value={area}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => { setArea(event.target.value as Area); setOpened(null); }}>
        {groups.map(group => <option key={group.id} value={group.id}>{group.label}</option>)}
      </select>
      <p className="ve-hover-panel__help">{current.description}</p>

      <fieldset className="ve-hover-panel__group">
        <legend>Movimiento al pasar el mouse</legend>
        <div className="ve-hover-panel__choices">
          {MOVEMENT_EFFECTS.slice(0, 5).map(effect => (
            <label key={effect.id} className={motion === effect.id ? 'is-selected' : ''}>
              <input type="radio" name={`hover-motion-${area}`} checked={motion === effect.id}
                onChange={() => onEdit(current.motion, effect.id)} />
              <span>{effect.label}</span>
            </label>
          ))}
        </div>
        {opened === 'motion' && library('motion')}
        <button type="button" className="ve-effect-library__open"
          aria-expanded={opened === 'motion'} aria-controls="ve-effect-search-motion"
          onClick={() => toggle('motion')}>
          {opened === 'motion' ? 'Ocultar biblioteca de movimientos' : 'Explorar más movimientos'}
        </button>
      </fieldset>

      <fieldset className="ve-hover-panel__group">
        <legend>Efectos de luz</legend>
        <div className="ve-hover-panel__choices">
          {LIGHT_EFFECTS.slice(0, 5).map(effect => (
            <label key={effect.id} className={light === effect.id ? 'is-selected' : ''}>
              <input type="radio" name={`hover-light-${area}`} checked={light === effect.id}
                onChange={() => onEdit(current.light, effect.id)} />
              <span>{effect.label}</span>
            </label>
          ))}
        </div>
        {opened === 'light' && library('light')}
        <button type="button" className="ve-effect-library__open"
          aria-expanded={opened === 'light'} aria-controls="ve-effect-search-light"
          onClick={() => toggle('light')}>
          {opened === 'light' ? 'Ocultar biblioteca de luz' : 'Explorar más efectos de luz'}
        </button>
      </fieldset>

      <p className="ve-hover-panel__footnote">Se comparten los ajustes entre las cuatro plantillas. En pantallas táctiles no se activan efectos al pasar el mouse.</p>
    </section>
  );
}
