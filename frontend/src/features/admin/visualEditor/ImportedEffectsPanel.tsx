/** OPENMIND_DIRECT_CATALOG_V2 — Buscar, probar y agregar sin archivos. */
import { useState, type CSSProperties } from 'react';
import type { VisualConfig } from '../../storefront/visual/types';
import { motionTransform, lightStyle } from '../../storefront/visual/effectLibrary';
import { searchCuratedEffects, type CatalogEffect } from '../../storefront/visual/curatedEffectCatalog';
import {
  MAX_IMPORTED_PRESETS,
  addImportedPreset,
  readImportedPresets,
  removeImportedPreset,
  type ImportedEffectPreset,
} from '../../storefront/visual/importedEffectPresets';
import './importedEffectsPanel.css';
import '../../storefront/components/hero-carousel.css';
import '../../storefront/visual/image-hover.css';

type Area = 'featured' | 'catalog' | 'category';
type Props = {
  kind: 'carousel' | 'product';
  hero: VisualConfig['hero'];
  area?: Area;
  onLibraryChange: (value: string) => void;
  onApply: (preset: ImportedEffectPreset, area?: Area) => void;
};

const productFields = {
  featured: ['hoverFeaturedMotion', 'hoverFeaturedLight'],
  catalog: ['hoverCatalogMotion', 'hoverCatalogLight'],
  category: ['hoverCategoryMotion', 'hoverCategoryLight'],
} as const;

function toPreset(option: CatalogEffect): ImportedEffectPreset {
  const id = crypto.randomUUID();
  if (option.kind === 'carousel') {
    return { id, name: option.name, kind: 'carousel', settings: { ...option.settings } };
  }
  return { id, name: option.name, kind: 'product', settings: { ...option.settings } };
}

export function ImportedEffectsPanel({ kind, hero, area = 'featured', onLibraryChange, onApply }: Props) {
  const [view, setView] = useState<'browse' | 'saved'>('browse');
  const [search, setSearch] = useState('');
  const [chosenCatalog, setChosenCatalog] = useState<string | null>(null);
  const [chosenSaved, setChosenSaved] = useState<string | null>(null);
  const [repeat, setRepeat] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const stored = hero.importedEffectPresets;
  const saved = readImportedPresets(stored).filter(item => item.kind === kind);
  const matches = searchCuratedEffects(kind, search);
  const catalogOption = matches.find(item => item.key === chosenCatalog) ?? matches[0];
  const savedOption = saved.find(item => item.id === chosenSaved) ?? saved[0];
  const selected: ImportedEffectPreset | undefined = view === 'saved'
    ? savedOption
    : catalogOption?.kind === 'carousel'
      ? { id: catalogOption.key, name: catalogOption.name, kind: 'carousel', settings: catalogOption.settings }
      : catalogOption?.kind === 'product'
        ? { id: catalogOption.key, name: catalogOption.name, kind: 'product', settings: catalogOption.settings }
        : undefined;

  const motion = selected?.kind === 'product' ? selected.settings.motion : 'none';
  const light = selected?.kind === 'product' ? selected.settings.light : 'none';
  const sampleStyle = {
    '--om-import-motion': motionTransform(motion),
    '--om-import-overlay-animation': lightStyle(light).animation,
    '--om-import-overlay-background': lightStyle(light).background,
  } as CSSProperties;
  const fields = productFields[area];
  const inUse = selected?.kind === 'carousel'
    ? hero.carouselMode === selected.settings.mode && hero.carouselInterval === selected.settings.interval &&
      hero.carouselTransition === selected.settings.transition && hero.carouselIndicators === selected.settings.indicators
    : selected?.kind === 'product'
      ? hero[fields[0]] === selected.settings.motion && hero[fields[1]] === selected.settings.light
      : false;

  function addAndApply() {
    if (!catalogOption) return;
    setError(''); setMessage('');
    // Si ya se agregó, no duplicamos favoritos y simplemente lo activamos.
    const existing = saved.find(item => item.name === catalogOption.name &&
      JSON.stringify(item.settings) === JSON.stringify(catalogOption.settings));
    if (existing) {
      onApply(existing, area);
      setChosenSaved(existing.id);
      setMessage('Efecto aplicado. Guarda los cambios para conservarlo.');
      return;
    }
    if (readImportedPresets(stored).length >= MAX_IMPORTED_PRESETS) {
      setError('Ya tienes 16 efectos guardados. En «Mis efectos» elimina alguno para agregar otro.');
      return;
    }
    try {
      const preset = toPreset(catalogOption);
      onLibraryChange(addImportedPreset(stored, preset));
      onApply(preset, area);
      setChosenSaved(preset.id);
      setMessage('Efecto agregado y aplicado. Ahora pulsa «Guardar cambios» en el editor.');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'No se pudo agregar el efecto.');
    }
  }

  function remove(id: string) {
    onLibraryChange(removeImportedPreset(stored, id));
    if (chosenSaved === id) setChosenSaved(null);
    setError('');
    setMessage('Quitado de Mis efectos. Guarda los cambios para confirmar.');
  }

  return (
    <section className="om-import" aria-label={kind === 'carousel' ? 'Catálogo de transiciones' : 'Catálogo de efectos para productos'}>
      <h3>Explorar efectos</h3>
      <p>Busca un nombre, mira cómo queda y agrégalo con un clic. Sin descargas ni archivos.</p>
      <div className="om-import__tabs" role="group" aria-label="Vista de biblioteca">
        <button type="button" aria-pressed={view === 'browse'} onClick={() => { setView('browse'); setError(''); }}>
          Buscar efectos
        </button>
        <button type="button" aria-pressed={view === 'saved'} onClick={() => { setView('saved'); setError(''); }}>
          Mis efectos ({saved.length})
        </button>
      </div>

      {view === 'browse' ? (
        <>
          <label className="om-import__search-label" htmlFor={`om-effect-search-${kind}`}>¿Qué efecto te gustaría?</label>
          <input
            id={`om-effect-search-${kind}`}
            className="om-import__search"
            type="search"
            placeholder={kind === 'carousel' ? 'Ej.: cortina, flip, bounce, zoom...' : 'Ej.: brillo, glow, girar, flotante...'}
            value={search}
            onChange={event => { setSearch(event.target.value); setChosenCatalog(null); setError(''); }}
          />
          <small>{matches.length} opciones compatibles con OpenMind. Puedes usar términos en español o inglés.</small>
          <div className="om-import__catalog-results" aria-label="Resultados de la biblioteca">
            {matches.map(option => (
              <button
                key={option.key}
                type="button"
                className="om-import__catalog-choice"
                aria-pressed={catalogOption?.key === option.key}
                onClick={() => { setChosenCatalog(option.key); setRepeat(value => value + 1); setError(''); setMessage(''); }}
              >
                <span>{option.name}</span>
                <small>{option.description}</small>
              </button>
            ))}
          </div>
          {matches.length === 0 && <p role="status">Ese nombre no aparece todavía en nuestra biblioteca. Prueba con «zoom», «brillo», «fade» o «giro».</p>}
          <small>Este buscador consulta el catálogo revisado de OpenMind; no descarga efectos automáticamente de cualquier página de internet.</small>
        </>
      ) : (
        <>
          {saved.length === 0 && <p>Tu colección está vacía. En «Buscar efectos» puedes elegir y agregar el primero.</p>}
          <div className="om-import__items" aria-label="Mis efectos guardados">
            {saved.map(preset => (
              <div key={preset.id} className="om-import__item">
                <button type="button" aria-pressed={savedOption?.id === preset.id}
                  onClick={() => { setChosenSaved(preset.id); setRepeat(value => value + 1); setMessage(''); }}>
                  {preset.name}
                </button>
                <button type="button" className="om-import__remove" onClick={() => remove(preset.id)}
                  aria-label={`Quitar ${preset.name} de Mis efectos`}>×</button>
              </div>
            ))}
          </div>
        </>
      )}
      {error && <p className="om-import__error" role="alert">{error}</p>}
      {message && <p className="om-import__message" role="status">{message}</p>}
      {selected && (
        <div className="om-import__preview">
          <strong>Vista previa: {selected.name}</strong>
          {selected.kind === 'carousel' ? (
            <div className="om-import__scene hero-carousel" role="img" aria-label={`Transición ${selected.name}`}>
              <div className="om-import__back">Foto A</div>
              <div key={`${selected.id}-${repeat}`} className={`om-import__front hero-carousel__image--transition-${selected.settings.transition}`}>
                Foto B
              </div>
            </div>
          ) : (
            <div className="om-import__sample" style={sampleStyle} tabIndex={0} aria-label="Señala o enfoca para probar el efecto">
              <div className="om-import__sample-art">🪴</div>
            </div>
          )}
          <button type="button" className="om-import__repeat" onClick={() => setRepeat(value => value + 1)}>
            {selected.kind === 'carousel' ? 'Repetir animación' : 'Probar otra vez'}
          </button>
          <button
            type="button"
            className="om-import__apply"
            disabled={inUse}
            onClick={() => view === 'browse' ? addAndApply() : onApply(selected, area)}
          >
            {inUse ? 'Efecto en uso' : view === 'browse' ? 'Agregar y aplicar' : 'Aplicar este efecto'}
          </button>
          <small>La selección se comparte entre las cuatro plantillas. Pulsa «Guardar cambios» para conservarla.</small>
        </div>
      )}
    </section>
  );
}
