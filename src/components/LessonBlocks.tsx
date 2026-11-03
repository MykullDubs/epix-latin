// src/components/LessonBlocks.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  RotateCcw, Check, X, Plus, Trash2, Zap,
  Maximize2, Minimize2, Lock, Magnet, Grid,
  Code, CheckCircle2, Move, Pin, Monitor,
  MoreHorizontal, MoveDiagonal2, Copy, Palette,
  Sparkles, Sliders
} from 'lucide-react';

// ============================================================================
//  HD VIRTUAL RESOLUTION PRESETS
// ============================================================================
export const CANVAS_RESOLUTIONS: Record<
  string,
  { label: string; width: number; height: number; badge: string; desc: string }
> = {
  hd_720: {
    label: 'Standard HD (1280 × 720)',
    width: 1280,
    height: 720,
    badge: '16:9 HD',
    desc: 'Balanced layout for 4–6 cards and 2–3 drop zones'
  },
  fhd_1080: {
    label: 'Full HD Smartboard (1920 × 1080)',
    width: 1920,
    height: 1080,
    badge: '1080p FHD',
    desc: 'High-definition stage for 8–14 cards, sorting buckets & sentence slots'
  },
  deep_1600: {
    label: 'Deep Worksheet Lab (1600 × 1200)',
    width: 1600,
    height: 1200,
    badge: '4:3 Deep',
    desc: 'Extra vertical space for sorting buckets + multi-row sentence building'
  },
  ultrawide_2400: {
    label: 'Ultra-Wide Timeline (2400 × 1000)',
    width: 2400,
    height: 1000,
    badge: '21:9 Cinema',
    desc: 'Panoramic horizontal stage for 6–8 sequential timeline or syntax slots'
  }
};

const COLOR_STYLES: Record<string, { bg: string; border: string; text: string; sub: string; hex: string }> = {
  indigo: {
    bg: 'bg-indigo-600 text-white',
    border: 'border-indigo-400',
    text: 'text-white',
    sub: 'text-indigo-200',
    hex: '#4f46e5'
  },
  emerald: {
    bg: 'bg-emerald-600 text-white',
    border: 'border-emerald-400',
    text: 'text-white',
    sub: 'text-emerald-100',
    hex: '#059669'
  },
  amber: {
    bg: 'bg-amber-500 text-slate-950',
    border: 'border-amber-300',
    text: 'text-slate-950',
    sub: 'text-slate-800',
    hex: '#f59e0b'
  },
  rose: {
    bg: 'bg-rose-600 text-white',
    border: 'border-rose-400',
    text: 'text-white',
    sub: 'text-rose-100',
    hex: '#e11d48'
  },
  cyan: {
    bg: 'bg-cyan-600 text-white',
    border: 'border-cyan-300',
    text: 'text-white',
    sub: 'text-cyan-100',
    hex: '#0891b2'
  },
  slate: {
    bg: 'bg-slate-800 text-white',
    border: 'border-slate-600',
    text: 'text-white',
    sub: 'text-slate-300',
    hex: '#1e293b'
  }
};

const BORDER_STYLE_CLASSES: Record<string, string> = {
  solid: 'border-2 border-solid',
  dashed: 'border-2 border-dashed',
  dotted: 'border-2 border-dotted',
  double: 'border-4 border-double',
  glow: 'border-2 border-solid shadow-[0_0_25px_rgba(99,102,241,0.55)]',
  none: 'border-0'
};

const THEME_BACKGROUNDS: Record<string, string> = {
  light_grid:
    'bg-slate-50 text-slate-900 bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] [background-size:28px_28px]',
  grid:
    'bg-slate-950 text-white bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:28px_28px]',
  physics_lab:
    'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white bg-[linear-gradient(to_right,rgba(99,102,241,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.08)_1px,transparent_1px)] [background-size:40px_40px]',
  roman_road:
    'bg-gradient-to-b from-amber-950/90 via-stone-900 to-slate-950 text-white',
  parchment:
    'bg-gradient-to-br from-amber-50 via-orange-50/80 to-stone-100 text-slate-900'
};

// ============================================================================
//  1. STUDENT & SMARTBOARD PLAYER: KINETIC CANVAS BLOCK (HD + ANCHORED)
// ============================================================================
export const KineticCanvasBlock = ({ block, onComplete }: any) => {
  const outerWrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const resKey = block?.canvasResolution || 'fhd_1080';
  const resolution = CANVAS_RESOLUTIONS[resKey] || CANVAS_RESOLUTIONS.fhd_1080;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stageScale, setStageScale] = useState(0.55);

  const initialEntities = useMemo(() => {
    return (Array.isArray(block?.entities) ? block.entities : []).map((e: any) => ({
      ...e,
      anchorX: e.anchorX ?? e.x ?? 50,
      anchorY: e.anchorY ?? e.y ?? 50,
      currentState: e.initialState || 'normal',
      placedZoneId: null,
      validationStatus: 'neutral' as 'neutral' | 'correct' | 'incorrect',
      sliderValue: e.sliderMin ?? 0,
      textValue: '',
      isSelected: false
    }));
  }, [block?.entities]);

  const zones = useMemo(() => (Array.isArray(block?.zones) ? block.zones : []), [block?.zones]);
  const layers = useMemo(() => (Array.isArray(block?.layers) ? block.layers : []), [block?.layers]);
  const rules = useMemo(() => (Array.isArray(block?.rules) ? block.rules : []), [block?.rules]);
  const keyframes = useMemo(
    () => (Array.isArray(block?.timelineKeyframes) ? block.timelineKeyframes : []),
    [block?.timelineKeyframes]
  );

  const [entities, setEntities] = useState<any[]>(initialEntities);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [activeConnectorSourceId, setActiveConnectorSourceId] = useState<string | null>(null);
  const [connections, setConnections] = useState<
    Array<{ fromId: string; toId: string; isCorrect: boolean }>
  >([]);
  const [timelineProgress, setTimelineProgress] = useState<number>(0);
  const [activeLayer, setActiveLayer] = useState<any | null>(null);
  const [layerQuizChoice, setLayerQuizChoice] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  useEffect(() => {
    setEntities(initialEntities);
    setConnections([]);
    setTimelineProgress(0);
    setActiveLayer(null);
  }, [initialEntities]);

  // Responsive Virtual Resolution Scaler
  useEffect(() => {
    const updateScale = () => {
      if (!outerWrapRef.current) return;
      const availW = outerWrapRef.current.clientWidth;
      if (availW > 0) {
        const nextScale = isFullscreen
          ? Math.min((window.innerWidth - 48) / resolution.width, (window.innerHeight - 180) / resolution.height)
          : availW / resolution.width;
        setStageScale(Math.max(0.25, Math.min(1.5, nextScale)));
      }
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (outerWrapRef.current) ro.observe(outerWrapRef.current);
    window.addEventListener('resize', updateScale);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [resolution.width, resolution.height, isFullscreen]);

  // Apply Timeline Scrubber Keyframe Overrides
  useEffect(() => {
    if (!block?.enableTimeline || keyframes.length === 0) return;
    const sorted = [...keyframes].sort((a, b) => a.progress - b.progress);
    const activeKf =
      sorted.reduce((acc, kf) => (timelineProgress >= kf.progress ? kf : acc), sorted[0]) || sorted[0];

    if (activeKf?.entityOverrides) {
      setEntities((prev) =>
        prev.map((ent) => {
          const ov = activeKf.entityOverrides.find((o: any) => o.entityId === ent.id);
          if (!ov) return ent;
          return {
            ...ent,
            x: ov.x ?? ent.x,
            y: ov.y ?? ent.y,
            scale: ov.scale ?? ent.scale,
            rotation: ov.rotation ?? ent.rotation,
            label: ov.labelOverride ?? ent.label,
            currentState: ov.state ?? ent.currentState
          };
        })
      );
    }
  }, [timelineProgress, block?.enableTimeline, keyframes]);

  const handleResetLab = () => {
    setEntities(initialEntities);
    setConnections([]);
    setTimelineProgress(0);
    setActiveLayer(null);
    setStatusBanner('Canvas reset to anchored starting positions.');
    setTimeout(() => setStatusBanner(null), 2500);
  };

  // Drag Start (Respects `anchored: true` lock and inline triggers)
  const handlePointerDownEntity = (e: React.PointerEvent, ent: any) => {
    e.stopPropagation();

    if (ent.entityType === 'connector_node') {
      if (!activeConnectorSourceId) {
        setActiveConnectorSourceId(ent.id);
      } else if (activeConnectorSourceId !== ent.id) {
        const sourceEnt = entities.find((item) => item.id === activeConnectorSourceId);
        const isCorrect =
          sourceEnt?.connectTargetId === ent.id || ent?.connectTargetId === activeConnectorSourceId;
        setConnections((prev) => [
          ...prev.filter((c) => c.fromId !== activeConnectorSourceId),
          { fromId: activeConnectorSourceId, toId: ent.id, isCorrect }
        ]);
        setActiveConnectorSourceId(null);
      } else {
        setActiveConnectorSourceId(null);
      }
      return;
    }

    if (ent.entityType === 'multi_select') {
      setEntities((prev) =>
        prev.map((item) => (item.id === ent.id ? { ...item, isSelected: !item.isSelected } : item))
      );
      return;
    }

    // Check inline triggerAction on the entity OR a matching rule in block.rules
    if (ent.triggerEvent === 'on_click' && ent.triggerAction) {
      if (ent.triggerMessage) setStatusBanner(ent.triggerMessage);
      if (ent.triggerAction === 'complete_block' && onComplete) onComplete();
      if (ent.triggerAction === 'show_layer' && ent.triggerLayerId) {
        const foundL = layers.find((l: any) => l.id === ent.triggerLayerId);
        if (foundL) setActiveLayer(foundL);
      }
    }

    const clickRule = rules.find((r: any) => r.event === 'on_click' && r.entityId === ent.id);
    if (clickRule) {
      if (clickRule.message) setStatusBanner(clickRule.message);
      if (clickRule.action === 'show_layer' && clickRule.targetLayerId) {
        const foundLayer = layers.find((l: any) => l.id === clickRule.targetLayerId);
        if (foundLayer) setActiveLayer(foundLayer);
      }
      return;
    }

    if (ent.anchored || ent.draggable === false || ent.entityType === 'static_anchor') {
      return;
    }

    setDraggingId(ent.id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveStage = (e: React.PointerEvent) => {
    if (!draggingId || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;
    const clampedX = Math.max(3, Math.min(97, Number(rawX.toFixed(2))));
    const clampedY = Math.max(4, Math.min(96, Number(rawY.toFixed(2))));

    setEntities((prev) =>
      prev.map((ent) =>
        ent.id === draggingId
          ? { ...ent, x: clampedX, y: clampedY, validationStatus: 'neutral' }
          : ent
      )
    );
  };

  const handlePointerUpStage = () => {
    if (!draggingId) return;
    const dragged = entities.find((e) => e.id === draggingId);
    setDraggingId(null);
    if (!dragged) return;

    const hitZone = zones.find((z: any) => {
      const halfW = (z.width || 24) / 2;
      const halfH = (z.height || 24) / 2;
      return (
        dragged.x >= z.x - halfW &&
        dragged.x <= z.x + halfW &&
        dragged.y >= z.y - halfH &&
        dragged.y <= z.y + halfH
      );
    });

    if (hitZone) {
      const occupants = entities.filter((e) => e.placedZoneId === hitZone.id && e.id !== dragged.id);
      const maxCap = hitZone.capacity || 6;

      if (occupants.length >= maxCap) {
        if (dragged.returnToAnchor !== false) {
          setEntities((prev) =>
            prev.map((e) =>
              e.id === dragged.id
                ? { ...e, x: e.anchorX, y: e.anchorY, placedZoneId: null, validationStatus: 'neutral' }
                : e
            )
          );
        }
        setStatusBanner(`"${hitZone.label}" is at full capacity (${maxCap}/${maxCap}).`);
        return;
      }

      let isMatch = true;
      if (hitZone.acceptedCategory && dragged.category) {
        isMatch = hitZone.acceptedCategory.trim().toLowerCase() === dragged.category.trim().toLowerCase();
      } else if (hitZone.sequenceOrder !== undefined && dragged.sequenceIndex !== undefined) {
        isMatch = Number(hitZone.sequenceOrder) === Number(dragged.sequenceIndex);
      } else {
        const matchingRule = rules.find(
          (r: any) => r.entityId === dragged.id && r.zoneId === hitZone.id
        );
        if (rules.length > 0 && !matchingRule && (hitZone.acceptedCategory || hitZone.sequenceOrder)) {
          isMatch = false;
        }
      }

      const slotIndex = occupants.length;
      let snapX = hitZone.x;
      let snapY = hitZone.y;
      if (maxCap > 1) {
        const cols = maxCap >= 4 ? 2 : 1;
        const col = slotIndex % cols;
        const row = Math.floor(slotIndex / cols);
        const offsetX = cols === 2 ? (col === 0 ? -hitZone.width * 0.22 : hitZone.width * 0.22) : 0;
        const offsetY = -hitZone.height * 0.14 + row * 7.5;
        snapX = Number((hitZone.x + offsetX).toFixed(2));
        snapY = Number((hitZone.y + offsetY).toFixed(2));
      }

      if (!isMatch && dragged.returnToAnchor) {
        setEntities((prev) =>
          prev.map((e) =>
            e.id === dragged.id ? { ...e, x: snapX, y: snapY, validationStatus: 'incorrect' } : e
          )
        );
        setStatusBanner(`Not quite! "${dragged.label}" does not belong in "${hitZone.label}".`);
        setTimeout(() => {
          setEntities((prev) =>
            prev.map((e) =>
              e.id === dragged.id
                ? { ...e, x: e.anchorX, y: e.anchorY, placedZoneId: null, validationStatus: 'neutral' }
                : e
            )
          );
        }, 750);
        return;
      }

      setEntities((prev) =>
        prev.map((e) =>
          e.id === dragged.id
            ? {
                ...e,
                x: snapX,
                y: snapY,
                placedZoneId: hitZone.id,
                validationStatus: isMatch ? 'correct' : 'incorrect'
              }
            : e
        )
      );

      if (isMatch && dragged.triggerMessage) {
        setStatusBanner(dragged.triggerMessage);
      }
      if (isMatch && dragged.triggerAction === 'complete_block' && onComplete) {
        onComplete();
      }

      const matchedRule = rules.find(
        (r: any) => r.entityId === dragged.id && r.zoneId === hitZone.id
      );
      if (matchedRule) {
        if (matchedRule.message) setStatusBanner(matchedRule.message);
        if (matchedRule.action === 'show_layer' && matchedRule.targetLayerId) {
          const targetL = layers.find((l: any) => l.id === matchedRule.targetLayerId);
          if (targetL) setActiveLayer(targetL);
        }
      }
    } else {
      setEntities((prev) =>
        prev.map((e) =>
          e.id === dragged.id
            ? {
                ...e,
                x: e.returnToAnchor ? e.anchorX : e.x,
                y: e.returnToAnchor ? e.anchorY : e.y,
                placedZoneId: null,
                validationStatus: 'neutral'
              }
            : e
        )
      );
    }
  };

  const checkMastery = () => {
    const draggablesWithTargets = entities.filter(
      (e) => !e.anchored && e.draggable !== false && (e.category || e.sequenceIndex !== undefined)
    );
    const allDraggablesRight =
      draggablesWithTargets.length === 0 ||
      draggablesWithTargets.every((e) => e.validationStatus === 'correct');

    if (allDraggablesRight) {
      setStatusBanner('All canvas objectives verified!');
      if (layers.length > 0 && !activeLayer) {
        setActiveLayer(layers[0]);
      } else if (onComplete) {
        onComplete();
      }
    } else {
      setStatusBanner('Some items are still unplaced or in the wrong slot. Keep going!');
    }
  };

  const activeThemeClass =
    THEME_BACKGROUNDS[block?.backgroundTheme || 'physics_lab'] || THEME_BACKGROUNDS.physics_lab;

  const activeKeyframeInfo = useMemo(() => {
    if (!block?.enableTimeline || keyframes.length === 0) return null;
    const sorted = [...keyframes].sort((a, b) => a.progress - b.progress);
    return sorted.reduce((acc, kf) => (timelineProgress >= kf.progress ? kf : acc), sorted[0]);
  }, [block?.enableTimeline, keyframes, timelineProgress]);

  return (
    <div
      translate="no"
      className={`notranslate ${
        isFullscreen
          ? 'fixed inset-0 z-[9990] bg-slate-950 p-4 sm:p-8 flex flex-col justify-center overflow-y-auto'
          : 'my-8 w-full'
      }`}
    >
      <div className="bg-slate-900 rounded-[2.5rem] border-2 border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Top HD Canvas Bar */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase tracking-widest">
                Kinetic Canvas HD • {resolution.badge}
              </span>
              {statusBanner && (
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider animate-in fade-in">
                  {statusBanner}
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white mt-1">
              {block?.title || 'Interactive Kinetic Lab'}
            </h3>
            {block?.subtitle && (
              <p className="text-xs font-bold text-slate-400 mt-0.5">{block.subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetLab}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-slate-700"
            >
              <RotateCcw size={13} /> Reset
            </button>
            <button
              type="button"
              onClick={checkMastery}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-emerald-600/25"
            >
              <CheckCircle2 size={14} /> Verify Board
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen((f) => !f)}
              className="p-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand to Fullscreen Theater Mode'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>

        {/* Scaled High-Definition Coordinate Stage */}
        <div
          ref={outerWrapRef}
          style={{ height: `${Math.round(resolution.height * stageScale)}px` }}
          className="relative w-full overflow-hidden bg-slate-950 flex justify-center"
        >
          <div
            ref={stageRef}
            onPointerMove={handlePointerMoveStage}
            onPointerUp={handlePointerUpStage}
            style={{
              width: `${resolution.width}px`,
              height: `${resolution.height}px`,
              transform: `scale(${stageScale})`,
              transformOrigin: 'top center'
            }}
            className={`relative shrink-0 select-none overflow-hidden ${activeThemeClass}`}
          >
            {block?.backgroundUrl && (
              <img
                src={block.backgroundUrl}
                alt="Stage Background"
                className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
              />
            )}

            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              {connections.map((conn, idx) => {
                const fromEnt = entities.find((e) => e.id === conn.fromId);
                const toEnt = entities.find((e) => e.id === conn.toId);
                if (!fromEnt || !toEnt) return null;
                return (
                  <line
                    key={idx}
                    x1={`${fromEnt.x}%`}
                    y1={`${fromEnt.y}%`}
                    x2={`${toEnt.x}%`}
                    y2={`${toEnt.y}%`}
                    stroke={conn.isCorrect ? '#10b981' : '#f43f5e'}
                    strokeWidth="5"
                    strokeDasharray={conn.isCorrect ? 'none' : '10,8'}
                  />
                );
              })}
            </svg>

            {/* Drop Zones & Buckets */}
            {zones.map((z: any) => {
              const occupants = entities.filter((e) => e.placedZoneId === z.id);
              if (z.invisible) return null;
              const zBorderClass = BORDER_STYLE_CLASSES[z.borderStyle || 'dashed'] || 'border-4 border-dashed';
              const zColorPalette = COLOR_STYLES[z.color || 'indigo'];
              return (
                <div
                  key={z.id}
                  style={{
                    left: `${z.x}%`,
                    top: `${z.y}%`,
                    width: `${z.width || 24}%`,
                    height: `${z.height || 24}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className={`absolute rounded-[2rem] ${zBorderClass} flex flex-col items-center justify-start p-5 transition-all pointer-events-none ${
                    z.isHotspotPin
                      ? 'border-rose-400 bg-rose-500/15 rounded-full'
                      : occupants.length > 0
                      ? 'border-indigo-400/80 bg-indigo-500/10'
                      : `${zColorPalette ? zColorPalette.border : 'border-slate-400/40'} bg-slate-900/25 backdrop-blur-[2px]`
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {z.sequenceOrder !== undefined && (
                      <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-black flex items-center justify-center shadow">
                        {z.sequenceOrder}
                      </span>
                    )}
                    <span className="text-lg font-black uppercase tracking-wider text-center drop-shadow-sm">
                      {z.label}
                    </span>
                  </div>
                  {z.sublabel && (
                    <span className="text-xs font-bold opacity-70 mt-1 text-center">
                      {z.sublabel} ({occupants.length}/{z.capacity || 1})
                    </span>
                  )}
                </div>
              );
            })}

            {/* Interactive & Anchored Entities */}
            {entities.map((ent: any) => {
              if (ent.currentState === 'hidden') return null;
              const palette = COLOR_STYLES[ent.color || 'indigo'] || COLOR_STYLES.indigo;
              const borderStyleClass = BORDER_STYLE_CLASSES[ent.borderStyle || 'solid'] || BORDER_STYLE_CLASSES.solid;
              const isDragging = draggingId === ent.id;
              const isAnchored = Boolean(ent.anchored || ent.entityType === 'static_anchor');

              let ringStyle = '';
              if (ent.validationStatus === 'correct') {
                ringStyle = 'ring-4 ring-emerald-400 !bg-emerald-600 !border-emerald-300';
              } else if (ent.validationStatus === 'incorrect') {
                ringStyle = 'ring-4 ring-rose-500 !bg-rose-600 !border-rose-300';
              } else if (activeConnectorSourceId === ent.id || ent.isSelected) {
                ringStyle = 'ring-4 ring-amber-400 scale-105';
              }

              if (ent.entityType === 'slider') {
                const isAtTarget =
                  Math.abs(Number(ent.sliderValue) - Number(ent.sliderTarget)) <=
                  Number(ent.sliderTolerance || 0);
                return (
                  <div
                    key={ent.id}
                    style={{
                      left: `${ent.x}%`,
                      top: `${ent.y}%`,
                      transform: `translate(-50%, -50%) scale(${ent.scale || 1})`
                    }}
                    className={`absolute z-20 p-5 rounded-3xl bg-slate-900/95 border-2 ${
                      isAtTarget ? 'border-emerald-400' : 'border-slate-700'
                    } text-white shadow-2xl min-w-[300px]`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-black">{ent.label}</span>
                      <span className="font-mono text-base font-black text-amber-400">
                        {ent.sliderValue}
                        {ent.sliderUnit || ''}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={ent.sliderMin ?? 0}
                      max={ent.sliderMax ?? 100}
                      step={ent.sliderStep ?? 1}
                      value={ent.sliderValue}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setEntities((prev) =>
                          prev.map((item) =>
                            item.id === ent.id
                              ? {
                                  ...item,
                                  sliderValue: val,
                                  validationStatus:
                                    Math.abs(val - Number(ent.sliderTarget)) <=
                                    Number(ent.sliderTolerance || 0)
                                      ? 'correct'
                                      : 'neutral'
                                }
                              : item
                          )
                        );
                      }}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                );
              }

              if (ent.entityType === 'text_input') {
                return (
                  <div
                    key={ent.id}
                    style={{
                      left: `${ent.x}%`,
                      top: `${ent.y}%`,
                      transform: `translate(-50%, -50%) scale(${ent.scale || 1})`
                    }}
                    className={`absolute z-20 p-5 rounded-3xl bg-slate-900/95 border-2 ${
                      ent.validationStatus === 'correct' ? 'border-emerald-400' : 'border-slate-700'
                    } text-white shadow-2xl min-w-[320px]`}
                  >
                    <label className="text-xs font-black uppercase tracking-wider text-indigo-300 block mb-2">
                      {ent.label}
                    </label>
                    <input
                      type="text"
                      value={ent.textValue || ''}
                      placeholder={ent.placeholder || 'Type answer...'}
                      onChange={(e) => {
                        const val = e.target.value;
                        const accepted = String(ent.expectedText || '')
                          .split(',')
                          .map((s) => s.trim().toLowerCase())
                          .filter(Boolean);
                        const matches = accepted.includes(val.trim().toLowerCase());
                        setEntities((prev) =>
                          prev.map((item) =>
                            item.id === ent.id
                              ? {
                                  ...item,
                                  textValue: val,
                                  validationStatus: matches ? 'correct' : 'neutral'
                                }
                              : item
                          )
                        );
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                );
              }

              return (
                <div
                  key={ent.id}
                  onPointerDown={(e) => handlePointerDownEntity(e, ent)}
                  style={{
                    left: `${ent.x}%`,
                    top: `${ent.y}%`,
                    width: ent.width ? `${ent.width}%` : undefined,
                    minHeight: ent.height ? `${ent.height}%` : undefined,
                    transform: `translate(-50%, -50%) scale(${
                      (ent.scale || 1) * (isDragging ? 1.08 : 1)
                    }) rotate(${ent.rotation || 0}deg)`,
                    zIndex: isDragging ? 60 : isAnchored ? 15 : 30
                  }}
                  className={`absolute px-6 py-3.5 rounded-2xl ${borderStyleClass} shadow-xl transition-shadow select-none flex items-center justify-center ${
                    isAnchored
                      ? 'bg-slate-900/90 border-slate-600/80 text-white cursor-default shadow-md'
                      : `${palette.bg} ${palette.border} cursor-grab active:cursor-grabbing hover:shadow-2xl`
                  } ${ringStyle}`}
                >
                  <div className="flex items-center gap-2.5">
                    {isAnchored && (
                      <span title="Anchored to Stage" className="inline-flex">
                        <Pin size={14} className="text-amber-400 shrink-0 rotate-45" />
                      </span>
                    )}
                    <div className="text-center">
                      <div className="text-lg font-black leading-tight whitespace-nowrap">
                        {ent.label}
                      </div>
                      {ent.sublabel && (
                        <div
                          className={`text-xs font-bold mt-0.5 whitespace-nowrap ${
                            isAnchored ? 'text-slate-400' : palette.sub
                          }`}
                        >
                          {ent.sublabel}
                        </div>
                      )}
                    </div>
                    {ent.validationStatus === 'correct' && (
                      <Check size={18} className="text-white shrink-0 ml-1" strokeWidth={3} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Cause-and-Effect Timeline Scrubber */}
        {block?.enableTimeline && (
          <div className="p-6 bg-slate-950 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
                Interactive Timeline Scrubber ({timelineProgress}%)
              </span>
              {activeKeyframeInfo && (
                <span className="text-xs font-black text-amber-400">{activeKeyframeInfo.title}</span>
              )}
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={timelineProgress}
              onChange={(e) => setTimelineProgress(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-2.5 bg-slate-800 rounded-lg"
            />
            {activeKeyframeInfo?.description && (
              <p className="text-xs font-medium text-slate-300 leading-relaxed">
                {activeKeyframeInfo.description}
              </p>
            )}
          </div>
        )}

        {/* Slide Layer Modal Overlay */}
        {activeLayer && (
          <div className="fixed inset-0 z-[9995] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-[2.5rem] max-w-lg w-full p-8 text-white shadow-2xl space-y-5 animate-in zoom-in-95">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest">
                {activeLayer.name || 'Verification Layer'}
              </span>
              <h4 className="text-2xl font-black">{activeLayer.title}</h4>
              <p className="text-sm text-slate-300 leading-relaxed">{activeLayer.body}</p>

              {activeLayer.hasQuiz && Array.isArray(activeLayer.quizOptions) && (
                <div className="space-y-2.5 pt-2">
                  <p className="text-xs font-black uppercase tracking-wider text-indigo-300">
                    {activeLayer.quizQuestion}
                  </p>
                  {activeLayer.quizOptions.map((opt: any) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setLayerQuizChoice(opt.id)}
                      className={`w-full p-3.5 rounded-2xl border text-left text-xs font-bold transition-all ${
                        layerQuizChoice === opt.id
                          ? 'bg-indigo-600 border-indigo-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (
                    activeLayer.hasQuiz &&
                    activeLayer.gateUntilCorrect &&
                    layerQuizChoice !== activeLayer.correctOptionId
                  ) {
                    return;
                  }
                  const shouldComplete = activeLayer.onCloseAction === 'complete_block';
                  setActiveLayer(null);
                  if (shouldComplete && onComplete) onComplete();
                }}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest shadow-lg"
              >
                {activeLayer.buttonLabel || 'Continue'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
//  2. INSTRUCTOR VISUAL STUDIO: KINETIC CANVAS BUILDER
//  Features:
//   - Four-Directions (<Move />) Drag Handle
//   - Diagonal (<MoveDiagonal2 />) Pull-to-Resize Handle
//   - Three-Dots (<MoreHorizontal />) In-Place Tooltip Inspector Box
// ============================================================================
export const KineticCanvasBuilder = ({ block, onChange }: any) => {
  const outerWrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const resKey = block?.canvasResolution || 'fhd_1080';
  const resolution = CANVAS_RESOLUTIONS[resKey] || CANVAS_RESOLUTIONS.fhd_1080;

  const [stageScale, setStageScale] = useState(0.5);
  const [gridSnap, setGridSnap] = useState<number>(1);
  const [selectedItem, setSelectedItem] = useState<{ kind: 'entity' | 'zone'; id: string } | null>(
    null
  );

  // Dragging & Diagonal Resizing Interaction State
  const [interaction, setInteraction] = useState<{
    mode: 'move' | 'resize';
    kind: 'entity' | 'zone';
    id: string;
    startClientX: number;
    startClientY: number;
    initX: number;
    initY: number;
    initScale: number;
    initWidth: number;
    initHeight: number;
  } | null>(null);

  // Three-Dots (•••) In-Place Tooltip Popover State
  const [openMenuFor, setOpenMenuFor] = useState<{ kind: 'entity' | 'zone'; id: string } | null>(
    null
  );
  const [menuTab, setMenuTab] = useState<'style' | 'text' | 'triggers'>('style');

  const [showRawJson, setShowRawJson] = useState(false);
  const [rawJsonText, setRawJsonText] = useState('');

  const entities = Array.isArray(block?.entities) ? block.entities : [];
  const zones = Array.isArray(block?.zones) ? block.zones : [];
  const layers = Array.isArray(block?.layers) ? block.layers : [];
  const rules = Array.isArray(block?.rules) ? block.rules : [];

  useEffect(() => {
    const updateScale = () => {
      if (!outerWrapRef.current) return;
      const availW = outerWrapRef.current.clientWidth;
      if (availW > 0) {
        setStageScale(Math.max(0.25, Math.min(1.2, availW / resolution.width)));
      }
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (outerWrapRef.current) ro.observe(outerWrapRef.current);
    window.addEventListener('resize', updateScale);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [resolution.width]);

  const snapCoord = (val: number, minVal = 4, maxVal = 96) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    if (!gridSnap || gridSnap <= 0) return Number(clamped.toFixed(1));
    return Number((Math.round(clamped / gridSnap) * gridSnap).toFixed(1));
  };

  // Start Four-Directions Move
  const startMoveItem = (
    e: React.PointerEvent,
    kind: 'entity' | 'zone',
    item: any
  ) => {
    e.stopPropagation();
    setSelectedItem({ kind, id: item.id });
    setInteraction({
      mode: 'move',
      kind,
      id: item.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      initX: item.x ?? 50,
      initY: item.y ?? 50,
      initScale: item.scale ?? 1,
      initWidth: item.width ?? 24,
      initHeight: item.height ?? 20
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Start Diagonal Pull-to-Resize
  const startResizeItem = (
    e: React.PointerEvent,
    kind: 'entity' | 'zone',
    item: any
  ) => {
    e.stopPropagation();
    setSelectedItem({ kind, id: item.id });
    setInteraction({
      mode: 'resize',
      kind,
      id: item.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      initX: item.x ?? 50,
      initY: item.y ?? 50,
      initScale: item.scale ?? 1,
      initWidth: item.width ?? (kind === 'zone' ? 28 : 16),
      initHeight: item.height ?? (kind === 'zone' ? 26 : 10)
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Unified Stage Pointer Move (Handles Both 4-Direction Move & Diagonal Resize)
  const handleStagePointerMove = (e: React.PointerEvent) => {
    if (!interaction || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();

    if (interaction.mode === 'move') {
      const nextX = snapCoord(((e.clientX - rect.left) / rect.width) * 100);
      const nextY = snapCoord(((e.clientY - rect.top) / rect.height) * 100);

      if (interaction.kind === 'entity') {
        const nextEntities = entities.map((ent: any) =>
          ent.id === interaction.id
            ? { ...ent, x: nextX, y: nextY, anchorX: nextX, anchorY: nextY }
            : ent
        );
        onChange({ ...block, entities: nextEntities });
      } else {
        const nextZones = zones.map((z: any) =>
          z.id === interaction.id ? { ...z, x: nextX, y: nextY } : z
        );
        onChange({ ...block, zones: nextZones });
      }
    } else if (interaction.mode === 'resize') {
      const deltaPctX = ((e.clientX - interaction.startClientX) / rect.width) * 100;
      const deltaPctY = ((e.clientY - interaction.startClientY) / rect.height) * 100;

      if (interaction.kind === 'zone') {
        const nextW = snapCoord(interaction.initWidth + deltaPctX * 2, 8, 90);
        const nextH = snapCoord(interaction.initHeight + deltaPctY * 2, 8, 90);
        const nextZones = zones.map((z: any) =>
          z.id === interaction.id ? { ...z, width: nextW, height: nextH } : z
        );
        onChange({ ...block, zones: nextZones });
      } else {
        // Diagonal pull on an entity smoothly scales it (and updates width/height if box sizing is used)
        const diagonalDelta = (deltaPctX + deltaPctY) / 25;
        const nextScale = Number(
          Math.max(0.5, Math.min(2.6, interaction.initScale + diagonalDelta)).toFixed(2)
        );
        const nextEntities = entities.map((ent: any) =>
          ent.id === interaction.id ? { ...ent, scale: nextScale } : ent
        );
        onChange({ ...block, entities: nextEntities });
      }
    }
  };

  const addEntity = (isAnchoredProp: boolean) => {
    const newId = `ent_${Date.now()}`;
    const newEnt = {
      id: newId,
      entityType: isAnchoredProp ? 'static_anchor' : 'draggable',
      label: isAnchoredProp ? 'Anchored Sentence Frame' : 'New Draggable Card',
      sublabel: isAnchoredProp ? 'Pinned in place' : 'Category / Sequence',
      color: isAnchoredProp ? 'slate' : 'indigo',
      borderStyle: 'solid',
      x: 50,
      y: isAnchoredProp ? 50 : 80,
      anchorX: 50,
      anchorY: isAnchoredProp ? 50 : 80,
      scale: 1,
      rotation: 0,
      draggable: !isAnchoredProp,
      anchored: isAnchoredProp,
      returnToAnchor: !isAnchoredProp,
      category: ''
    };
    onChange({ ...block, entities: [...entities, newEnt] });
    setSelectedItem({ kind: 'entity', id: newId });
    setOpenMenuFor({ kind: 'entity', id: newId });
  };

  const addZone = () => {
    const newId = `zone_${Date.now()}`;
    const newZone = {
      id: newId,
      label: 'Drop Bucket / Slot',
      sublabel: 'Capacity: 2',
      color: 'indigo',
      borderStyle: 'dashed',
      x: 50,
      y: 30,
      width: 28,
      height: 26,
      capacity: 2,
      acceptedCategory: '',
      anchored: false
    };
    onChange({ ...block, zones: [...zones, newZone] });
    setSelectedItem({ kind: 'zone', id: newId });
    setOpenMenuFor({ kind: 'zone', id: newId });
  };

  const updateEntityField = (id: string, patch: Record<string, any>) => {
    onChange({
      ...block,
      entities: entities.map((e: any) => (e.id === id ? { ...e, ...patch } : e))
    });
  };

  const updateZoneField = (id: string, patch: Record<string, any>) => {
    onChange({
      ...block,
      zones: zones.map((z: any) => (z.id === id ? { ...z, ...patch } : z))
    });
  };

  const duplicateEntity = (ent: any) => {
    const copyId = `ent_${Date.now()}`;
    const copy = {
      ...ent,
      id: copyId,
      x: Math.min(92, (ent.x || 50) + 6),
      y: Math.min(92, (ent.y || 50) + 4),
      anchorX: Math.min(92, (ent.x || 50) + 6),
      anchorY: Math.min(92, (ent.y || 50) + 4)
    };
    onChange({ ...block, entities: [...entities, copy] });
    setSelectedItem({ kind: 'entity', id: copyId });
    setOpenMenuFor({ kind: 'entity', id: copyId });
  };

  const activeMenuEntity =
    openMenuFor?.kind === 'entity' ? entities.find((e: any) => e.id === openMenuFor.id) : null;
  const activeMenuZone =
    openMenuFor?.kind === 'zone' ? zones.find((z: any) => z.id === openMenuFor.id) : null;

  const activeThemeClass =
    THEME_BACKGROUNDS[block?.backgroundTheme || 'physics_lab'] || THEME_BACKGROUNDS.physics_lab;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-indigo-500/30 shadow-xl overflow-hidden space-y-6 p-6">
      {/* Top Studio Controls: Resolution Picker, Grid Snap & Add Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block">
            High-Definition Kinetic Stage Editor • Drag <Move size={11} className="inline" /> to Move • Pull <MoveDiagonal2 size={11} className="inline" /> to Resize • Click ••• for Tooltip
          </span>
          <input
            type="text"
            value={block?.title || ''}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
            placeholder="Canvas Slide Title..."
            className="text-lg font-black bg-transparent text-slate-900 dark:text-white outline-none border-b border-transparent focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Resolution Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <Monitor size={14} className="text-indigo-500" />
            <select
              value={resKey}
              onChange={(e) => onChange({ ...block, canvasResolution: e.target.value })}
              className="bg-transparent text-xs font-black text-slate-800 dark:text-white outline-none"
            >
              {Object.entries(CANVAS_RESOLUTIONS).map(([k, r]) => (
                <option key={k} value={k}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Grid Snap Precision Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <Grid size={14} className="text-emerald-500" />
            <select
              value={gridSnap}
              onChange={(e) => setGridSnap(Number(e.target.value))}
              className="bg-transparent text-xs font-black text-slate-800 dark:text-white outline-none"
            >
              <option value={0}>Snap: Free (0.1%)</option>
              <option value={1}>Snap: Fine HD (1%)</option>
              <option value={2}>Snap: Standard (2%)</option>
              <option value={5}>Snap: Coarse Grid (5%)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => addEntity(false)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm"
          >
            <Plus size={12} /> Card
          </button>

          <button
            type="button"
            onClick={() => addEntity(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm"
            title="Add an Anchored Sentence Frame or Fixed Diagram Label"
          >
            <Pin size={12} /> + Anchored Prop
          </button>

          <button
            type="button"
            onClick={addZone}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm"
          >
            <Plus size={12} /> Drop Bucket
          </button>

          <button
            type="button"
            onClick={() => {
              setRawJsonText(JSON.stringify(block, null, 2));
              setShowRawJson((s) => !s);
            }}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase flex items-center gap-1"
          >
            <Code size={13} /> JSON
          </button>
        </div>
      </div>

      {showRawJson && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <textarea
            rows={10}
            value={rawJsonText}
            onChange={(e) => setRawJsonText(e.target.value)}
            className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-xl border border-slate-800 outline-none"
          />
          <button
            type="button"
            onClick={() => {
              try {
                const parsed = JSON.parse(rawJsonText);
                onChange(parsed);
                setShowRawJson(false);
              } catch {
                alert('Invalid JSON syntax.');
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest"
          >
            Apply JSON to Canvas
          </button>
        </div>
      )}

      {/* Interactive HD Stage Preview with Direct-Manipulation Handles & In-Place Tooltip */}
      <div
        ref={outerWrapRef}
        style={{ height: `${Math.round(resolution.height * stageScale)}px` }}
        className="relative w-full overflow-hidden rounded-3xl border-2 border-slate-300 dark:border-slate-700 bg-slate-950 flex justify-center"
      >
        <div
          ref={stageRef}
          onPointerDown={() => setOpenMenuFor(null)}
          onPointerMove={handleStagePointerMove}
          onPointerUp={() => setInteraction(null)}
          style={{
            width: `${resolution.width}px`,
            height: `${resolution.height}px`,
            transform: `scale(${stageScale})`,
            transformOrigin: 'top center'
          }}
          className={`relative shrink-0 select-none overflow-hidden ${activeThemeClass}`}
        >
          {/* ============================================================================ */}
          {/* DROP ZONES / BUCKETS ON BUILDER STAGE                                        */}
          {/* ============================================================================ */}
          {zones.map((z: any) => {
            const isSelected = selectedItem?.kind === 'zone' && selectedItem.id === z.id;
            const isMenuOpen = openMenuFor?.kind === 'zone' && openMenuFor.id === z.id;
            const zBorderClass = BORDER_STYLE_CLASSES[z.borderStyle || 'dashed'] || 'border-4 border-dashed';
            const zPalette = COLOR_STYLES[z.color || 'indigo'] || COLOR_STYLES.indigo;

            return (
              <div
                key={z.id}
                onPointerDown={(e) => startMoveItem(e, 'zone', z)}
                style={{
                  left: `${z.x}%`,
                  top: `${z.y}%`,
                  width: `${z.width || 24}%`,
                  height: `${z.height || 24}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: isMenuOpen ? 80 : isSelected ? 25 : 15
                }}
                className={`group absolute rounded-[2rem] ${zBorderClass} p-5 flex flex-col items-center justify-start cursor-move transition-colors ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/15 ring-2 ring-amber-400/50'
                    : `${zPalette.border} bg-slate-900/35`
                }`}
              >
                {/* TOP-LEFT: Four-Directions Move Handle */}
                <button
                  type="button"
                  title="Drag to Move Drop Zone"
                  onPointerDown={(e) => startMoveItem(e, 'zone', z)}
                  className="absolute -top-3.5 -left-3.5 w-9 h-9 rounded-full bg-slate-900 hover:bg-indigo-600 text-white border-2 border-slate-600 flex items-center justify-center shadow-lg cursor-move z-30"
                >
                  <Move size={15} />
                </button>

                {/* TOP-RIGHT: Three-Dots (•••) Tooltip Menu Trigger */}
                <button
                  type="button"
                  title="Customize Zone Style, Capacity & Category"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem({ kind: 'zone', id: z.id });
                    setOpenMenuFor(isMenuOpen ? null : { kind: 'zone', id: z.id });
                  }}
                  className={`absolute -top-3.5 -right-3.5 w-9 h-9 rounded-full border-2 flex items-center justify-center shadow-lg transition-colors z-30 ${
                    isMenuOpen
                      ? 'bg-amber-400 text-slate-950 border-white'
                      : 'bg-slate-900 hover:bg-indigo-600 text-white border-slate-600'
                  }`}
                >
                  <MoreHorizontal size={16} />
                </button>

                {/* BOTTOM-RIGHT: Diagonal Pull-to-Resize Handle */}
                <button
                  type="button"
                  title="Pull Diagonally to Resize Zone Width & Height"
                  onPointerDown={(e) => startResizeItem(e, 'zone', z)}
                  className="absolute -bottom-3.5 -right-3.5 w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-white flex items-center justify-center shadow-lg cursor-nwse-resize z-30"
                >
                  <MoveDiagonal2 size={15} />
                </button>

                <div className="flex items-center gap-2">
                  {z.anchored && <Lock size={14} className="text-amber-400" />}
                  <span className="text-lg font-black uppercase">{z.label}</span>
                </div>
                <span className="text-xs font-bold opacity-75">
                  {z.sublabel} • ({z.width || 24}% × {z.height || 24}%)
                </span>
              </div>
            );
          })}

          {/* ============================================================================ */}
          {/* DRAGGABLE & ANCHORED ENTITIES ON BUILDER STAGE                               */}
          {/* ============================================================================ */}
          {entities.map((ent: any) => {
            const isSelected = selectedItem?.kind === 'entity' && selectedItem.id === ent.id;
            const isMenuOpen = openMenuFor?.kind === 'entity' && openMenuFor.id === ent.id;
            const palette = COLOR_STYLES[ent.color || 'indigo'] || COLOR_STYLES.indigo;
            const borderStyleClass =
              BORDER_STYLE_CLASSES[ent.borderStyle || 'solid'] || BORDER_STYLE_CLASSES.solid;

            return (
              <div
                key={ent.id}
                onPointerDown={(e) => startMoveItem(e, 'entity', ent)}
                style={{
                  left: `${ent.x}%`,
                  top: `${ent.y}%`,
                  transform: `translate(-50%, -50%) scale(${ent.scale || 1}) rotate(${
                    ent.rotation || 0
                  }deg)`,
                  zIndex: isMenuOpen ? 90 : isSelected ? 50 : 35
                }}
                className={`group absolute px-7 py-4 rounded-2xl ${borderStyleClass} shadow-xl cursor-move ${
                  ent.anchored
                    ? 'bg-slate-900 border-amber-400 text-white'
                    : `${palette.bg} ${palette.border}`
                } ${isSelected ? 'ring-4 ring-white' : ''}`}
              >
                {/* TOP-LEFT: Four-Directions Move Handle */}
                <button
                  type="button"
                  title="Drag in 4 Directions to Move"
                  onPointerDown={(e) => startMoveItem(e, 'entity', ent)}
                  className="absolute -top-3.5 -left-3.5 w-8 h-8 rounded-full bg-slate-900 hover:bg-indigo-600 text-white border-2 border-white/80 flex items-center justify-center shadow-lg cursor-move z-30"
                >
                  <Move size={13} />
                </button>

                {/* TOP-RIGHT: Three-Dots (•••) Tooltip Menu Button */}
                <button
                  type="button"
                  title="Open Box Options (Color, Border, Text, Triggers)"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem({ kind: 'entity', id: ent.id });
                    setOpenMenuFor(isMenuOpen ? null : { kind: 'entity', id: ent.id });
                  }}
                  className={`absolute -top-3.5 -right-3.5 w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg transition-colors z-30 ${
                    isMenuOpen
                      ? 'bg-amber-400 text-slate-950 border-white'
                      : 'bg-slate-900 hover:bg-indigo-600 text-white border-white/80'
                  }`}
                >
                  <MoreHorizontal size={15} />
                </button>

                {/* BOTTOM-RIGHT: Diagonal Pull-to-Resize Handle */}
                <button
                  type="button"
                  title="Pull Diagonally to Resize Object"
                  onPointerDown={(e) => startResizeItem(e, 'entity', ent)}
                  className="absolute -bottom-3.5 -right-3.5 w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-white flex items-center justify-center shadow-lg cursor-nwse-resize z-30"
                >
                  <MoveDiagonal2 size={13} />
                </button>

                <div className="flex items-center gap-2">
                  {ent.anchored && (
                    <span title="Anchored to Stage" className="inline-flex">
                      <Pin size={15} className="text-amber-400 rotate-45" />
                    </span>
                  )}
                  {ent.returnToAnchor && !ent.anchored && (
                    <span title="Magnetic Return to Home Anchor" className="inline-flex">
                      <Magnet size={14} className="text-cyan-200" />
                    </span>
                  )}
                  <div>
                    <div className="text-lg font-black whitespace-nowrap">{ent.label}</div>
                    <div className="text-[11px] font-bold opacity-80 whitespace-nowrap">
                      {ent.sublabel} • {Math.round((ent.scale || 1) * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* ============================================================================ */}
          {/* IN-PLACE THREE-DOTS (•••) FLOATING TOOLTIP INSPECTOR POPOVER                 */}
          {/* Appears directly next to the selected Entity or Drop Zone on the canvas      */}
          {/* ============================================================================ */}
          {(activeMenuEntity || activeMenuZone) && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              style={{
                left: `${Math.min(72, Math.max(28, (activeMenuEntity || activeMenuZone).x))}%`,
                top: `${Math.min(68, Math.max(22, (activeMenuEntity || activeMenuZone).y))}%`,
                transform: 'translate(-50%, -50%)'
              }}
              className="absolute z-[200] w-[420px] rounded-3xl bg-slate-900/98 backdrop-blur-2xl border-2 border-indigo-400/60 shadow-[0_25px_70px_rgba(0,0,0,0.85)] text-white p-5 space-y-4 animate-in zoom-in-95 duration-150"
            >
              {/* Popover Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest">
                    {activeMenuEntity ? 'Box Properties' : 'Zone Properties'}
                  </span>
                  <span className="text-sm font-black truncate max-w-[180px]">
                    {(activeMenuEntity || activeMenuZone).label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {activeMenuEntity && (
                    <button
                      type="button"
                      title="Duplicate Box"
                      onClick={() => duplicateEntity(activeMenuEntity)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white"
                    >
                      <Copy size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => {
                      if (activeMenuEntity) {
                        onChange({
                          ...block,
                          entities: entities.filter((e: any) => e.id !== activeMenuEntity.id)
                        });
                      } else if (activeMenuZone) {
                        onChange({
                          ...block,
                          zones: zones.filter((z: any) => z.id !== activeMenuZone.id)
                        });
                      }
                      setOpenMenuFor(null);
                    }}
                    className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-600 text-rose-400 hover:text-white"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenMenuFor(null)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Tooltip Sub-Tabs: Style (Color/Border) | Text & Tags | Triggers & Anchors */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800">
                {[
                  { id: 'style', label: 'Color & Border' },
                  { id: 'text', label: 'Text & Match' },
                  { id: 'triggers', label: 'Triggers & Pin' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setMenuTab(t.id as any)}
                    className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                      menuTab === t.id
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: COLOR PALETTE, BORDER STYLE & SCALE */}
              {menuTab === 'style' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                      Box Color Theme
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {Object.entries(COLOR_STYLES).map(([colorKey, cObj]) => {
                        const target = activeMenuEntity || activeMenuZone;
                        const isPicked = (target.color || 'indigo') === colorKey;
                        return (
                          <button
                            key={colorKey}
                            type="button"
                            onClick={() =>
                              activeMenuEntity
                                ? updateEntityField(activeMenuEntity.id, { color: colorKey })
                                : updateZoneField(activeMenuZone.id, { color: colorKey })
                            }
                            style={{ backgroundColor: cObj.hex }}
                            className={`h-9 rounded-xl border-2 capitalize text-[10px] font-black flex items-center justify-center transition-transform ${
                              isPicked ? 'border-white scale-110 ring-2 ring-white/50' : 'border-transparent opacity-80 hover:opacity-100'
                            }`}
                          >
                            {isPicked && <Check size={14} className="text-white drop-shadow" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                      Border Style
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['solid', 'dashed', 'dotted', 'double', 'glow', 'none'].map((bStyle) => {
                        const target = activeMenuEntity || activeMenuZone;
                        const currentBS = target.borderStyle || (activeMenuZone ? 'dashed' : 'solid');
                        return (
                          <button
                            key={bStyle}
                            type="button"
                            onClick={() =>
                              activeMenuEntity
                                ? updateEntityField(activeMenuEntity.id, { borderStyle: bStyle })
                                : updateZoneField(activeMenuZone.id, { borderStyle: bStyle })
                            }
                            className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                              currentBS === bStyle
                                ? 'bg-indigo-600/30 border-indigo-400 text-white'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {bStyle}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {activeMenuEntity && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                          Size Scale ({Math.round((activeMenuEntity.scale || 1) * 100)}%)
                        </label>
                        <input
                          type="range"
                          min={0.5}
                          max={2.4}
                          step={0.05}
                          value={activeMenuEntity.scale || 1}
                          onChange={(e) =>
                            updateEntityField(activeMenuEntity.id, { scale: Number(e.target.value) })
                          }
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                          Rotation ({activeMenuEntity.rotation || 0}°)
                        </label>
                        <input
                          type="range"
                          min={-45}
                          max={45}
                          step={5}
                          value={activeMenuEntity.rotation || 0}
                          onChange={(e) =>
                            updateEntityField(activeMenuEntity.id, { rotation: Number(e.target.value) })
                          }
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: TEXT, SUBLABEL & CATEGORY / SEQUENCE MATCHING */}
              {menuTab === 'text' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Primary Text / Label
                    </label>
                    <input
                      type="text"
                      value={(activeMenuEntity || activeMenuZone).label || ''}
                      onChange={(e) =>
                        activeMenuEntity
                          ? updateEntityField(activeMenuEntity.id, { label: e.target.value })
                          : updateZoneField(activeMenuZone.id, { label: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-black text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Subtitle / Hint Note
                    </label>
                    <input
                      type="text"
                      value={(activeMenuEntity || activeMenuZone).sublabel || ''}
                      onChange={(e) =>
                        activeMenuEntity
                          ? updateEntityField(activeMenuEntity.id, { sublabel: e.target.value })
                          : updateZoneField(activeMenuZone.id, { sublabel: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>

                  {activeMenuEntity ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                          Category Tag (Bucket Match)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. ed_feeling"
                          value={activeMenuEntity.category || ''}
                          onChange={(e) =>
                            updateEntityField(activeMenuEntity.id, { category: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-emerald-300 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                          Sequence Slot #
                        </label>
                        <input
                          type="number"
                          placeholder="1, 2, 3..."
                          value={activeMenuEntity.sequenceIndex ?? ''}
                          onChange={(e) =>
                            updateEntityField(activeMenuEntity.id, {
                              sequenceIndex: e.target.value ? Number(e.target.value) : undefined
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-amber-300 outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                          Accepts Category
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. ed_feeling"
                          value={activeMenuZone.acceptedCategory || ''}
                          onChange={(e) =>
                            updateZoneField(activeMenuZone.id, { acceptedCategory: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-emerald-300 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                          Sequence Order #
                        </label>
                        <input
                          type="number"
                          placeholder="1, 2..."
                          value={activeMenuZone.sequenceOrder ?? ''}
                          onChange={(e) =>
                            updateZoneField(activeMenuZone.id, {
                              sequenceOrder: e.target.value ? Number(e.target.value) : undefined
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-amber-300 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                          Max Capacity
                        </label>
                        <input
                          type="number"
                          value={activeMenuZone.capacity ?? 2}
                          onChange={(e) =>
                            updateZoneField(activeMenuZone.id, {
                              capacity: Math.max(1, Number(e.target.value) || 1)
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-black text-white outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ANCHORING & INTERACTION TRIGGERS */}
              {menuTab === 'triggers' && (
                <div className="space-y-3">
                  {activeMenuEntity ? (
                    <>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const nextAnchored = !activeMenuEntity.anchored;
                            updateEntityField(activeMenuEntity.id, {
                              anchored: nextAnchored,
                              draggable: !nextAnchored
                            });
                          }}
                          className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-between border ${
                            activeMenuEntity.anchored
                              ? 'bg-amber-500 text-slate-950 border-amber-300'
                              : 'bg-slate-950 text-slate-300 border-slate-800'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Pin size={14} /> Pin / Anchor in Place on Stage
                          </span>
                          <span>{activeMenuEntity.anchored ? 'LOCKED' : 'OFF'}</span>
                        </button>

                        {!activeMenuEntity.anchored && (
                          <button
                            type="button"
                            onClick={() =>
                              updateEntityField(activeMenuEntity.id, {
                                returnToAnchor: !activeMenuEntity.returnToAnchor,
                                anchorX: activeMenuEntity.x,
                                anchorY: activeMenuEntity.y
                              })
                            }
                            className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-between border ${
                              activeMenuEntity.returnToAnchor
                                ? 'bg-cyan-600 text-white border-cyan-400'
                                : 'bg-slate-950 text-slate-300 border-slate-800'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <Magnet size={14} /> Snap Back to Home Anchor if Missed
                            </span>
                            <span>{activeMenuEntity.returnToAnchor ? 'ON' : 'OFF'}</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800">
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                            Trigger Event
                          </label>
                          <select
                            value={activeMenuEntity.triggerEvent || 'on_drop'}
                            onChange={(e) =>
                              updateEntityField(activeMenuEntity.id, { triggerEvent: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white outline-none"
                          >
                            <option value="on_drop">When Dropped in Zone</option>
                            <option value="on_click">When Clicked</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                            Trigger Action
                          </label>
                          <select
                            value={activeMenuEntity.triggerAction || 'bounce_glow'}
                            onChange={(e) =>
                              updateEntityField(activeMenuEntity.id, { triggerAction: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white outline-none"
                          >
                            <option value="bounce_glow">Bounce & Glow</option>
                            <option value="show_layer">Open Slide Layer</option>
                            <option value="complete_block">Complete Slide</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                          Toast / Banner Message When Triggered
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Correct! -ED describes how the person feels."
                          value={activeMenuEntity.triggerMessage || ''}
                          onChange={(e) =>
                            updateEntityField(activeMenuEntity.id, { triggerMessage: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-emerald-300 outline-none"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() =>
                          updateZoneField(activeMenuZone.id, { anchored: !activeMenuZone.anchored })
                        }
                        className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-between border ${
                          activeMenuZone.anchored
                            ? 'bg-amber-500 text-slate-950 border-amber-300'
                            : 'bg-slate-950 text-slate-300 border-slate-800'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Lock size={14} /> Lock Zone Position in Editor
                        </span>
                        <span>{activeMenuZone.anchored ? 'LOCKED' : 'UNLOCKED'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
