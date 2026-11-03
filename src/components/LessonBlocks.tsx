// src/components/LessonBlocks.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  RotateCcw, Check, X, Plus, Trash2,
  Maximize2, Minimize2, Lock, Unlock, Magnet, Grid,
  Code, CheckCircle2, Move, Pin, Monitor,
  MoreHorizontal, MoveDiagonal2, Copy, Link2,
  AlignHorizontalSpaceAround, AlignVerticalSpaceAround,
  Square, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown,
  Layers, GripVertical, PanelTop, PanelBottom, PanelRight,
  Sliders, CheckSquare, Columns
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

const COLOR_STYLES: Record<
  string,
  { bg: string; border: string; text: string; sub: string; hex: string; softBg: string }
> = {
  indigo: {
    bg: 'bg-indigo-600 text-white',
    border: 'border-indigo-400',
    text: 'text-white',
    sub: 'text-indigo-200',
    hex: '#4f46e5',
    softBg: 'rgba(79, 70, 229, '
  },
  emerald: {
    bg: 'bg-emerald-600 text-white',
    border: 'border-emerald-400',
    text: 'text-white',
    sub: 'text-emerald-100',
    hex: '#059669',
    softBg: 'rgba(5, 150, 105, '
  },
  amber: {
    bg: 'bg-amber-500 text-slate-950',
    border: 'border-amber-300',
    text: 'text-slate-950',
    sub: 'text-slate-800',
    hex: '#f59e0b',
    softBg: 'rgba(245, 158, 11, '
  },
  rose: {
    bg: 'bg-rose-600 text-white',
    border: 'border-rose-400',
    text: 'text-white',
    sub: 'text-rose-100',
    hex: '#e11d48',
    softBg: 'rgba(225, 29, 72, '
  },
  cyan: {
    bg: 'bg-cyan-600 text-white',
    border: 'border-cyan-300',
    text: 'text-white',
    sub: 'text-cyan-100',
    hex: '#0891b2',
    softBg: 'rgba(8, 145, 178, '
  },
  slate: {
    bg: 'bg-slate-800 text-white',
    border: 'border-slate-500',
    text: 'text-white',
    sub: 'text-slate-300',
    hex: '#1e293b',
    softBg: 'rgba(30, 41, 59, '
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

const SHAPE_RADIUS_CLASSES: Record<string, string> = {
  rounded: 'rounded-[2rem]',
  sharp: 'rounded-none',
  pill: 'rounded-full',
  circle: 'rounded-full',
  banner: 'rounded-2xl'
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
//  1. STUDENT & SMARTBOARD PLAYER: KINETIC CANVAS BLOCK (HD + ANCHORED + SHAPES)
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

  const handlePointerDownEntity = (e: React.PointerEvent, ent: any) => {
    if (ent.entityType === 'bg_shape') return;
    e.stopPropagation();

    if (ent.entityType === 'connector_node' || ent.connectTargetId) {
      if (!activeConnectorSourceId) {
        setActiveConnectorSourceId(ent.id);
        setStatusBanner(`Selected "${ent.label}" — now click its matching target box!`);
      } else if (activeConnectorSourceId !== ent.id) {
        const sourceEnt = entities.find((item) => item.id === activeConnectorSourceId);
        const isCorrect =
          sourceEnt?.connectTargetId === ent.id || ent?.connectTargetId === activeConnectorSourceId;
        setConnections((prev) => [
          ...prev.filter((c) => c.fromId !== activeConnectorSourceId && c.toId !== activeConnectorSourceId),
          { fromId: activeConnectorSourceId, toId: ent.id, isCorrect }
        ]);
        setActiveConnectorSourceId(null);
        setStatusBanner(isCorrect ? 'Connector line linked!' : 'Connected — check if that pair matches.');
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
      (e) =>
        !e.anchored &&
        e.draggable !== false &&
        e.entityType !== 'bg_shape' &&
        e.entityType !== 'connector_node' &&
        (e.category || e.sequenceIndex !== undefined)
    );
    const allDraggablesRight =
      draggablesWithTargets.length === 0 ||
      draggablesWithTargets.every((e) => e.validationStatus === 'correct');

    const connectorNodesWithTargets = entities.filter((e) => e.connectTargetId);
    const allConnectorsRight =
      connectorNodesWithTargets.length === 0 ||
      connectorNodesWithTargets.every((e) =>
        connections.some(
          (c) =>
            c.isCorrect &&
            ((c.fromId === e.id && c.toId === e.connectTargetId) ||
              (c.toId === e.id && c.fromId === e.connectTargetId))
        )
      );

    if (allDraggablesRight && allConnectorsRight) {
      setStatusBanner('All canvas objectives verified!');
      if (layers.length > 0 && !activeLayer) {
        setActiveLayer(layers[0]);
      } else if (onComplete) {
        onComplete();
      }
    } else {
      setStatusBanner('Some items or connector lines are still incomplete. Keep going!');
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

            {/* 1. BACKGROUND GROUP SHAPES LAYER */}
            {entities
              .filter((e: any) => e.entityType === 'bg_shape' && e.currentState !== 'hidden')
              .map((shape: any) => {
                const palette = COLOR_STYLES[shape.color || 'slate'] || COLOR_STYLES.slate;
                const borderStyleClass =
                  BORDER_STYLE_CLASSES[shape.borderStyle || 'solid'] || BORDER_STYLE_CLASSES.solid;
                const radiusClass =
                  SHAPE_RADIUS_CLASSES[shape.shapeVariant || 'rounded'] || SHAPE_RADIUS_CLASSES.rounded;
                const fillAlpha = (shape.opacity ?? 25) / 100;

                return (
                  <div
                    key={shape.id}
                    style={{
                      left: `${shape.x}%`,
                      top: `${shape.y}%`,
                      width: `${shape.width || 42}%`,
                      height: `${shape.height || 36}%`,
                      backgroundColor: `${palette.softBg}${fillAlpha})`,
                      transform: `translate(-50%, -50%) rotate(${shape.rotation || 0}deg)`,
                      zIndex: shape.zOrder ?? 2
                    }}
                    className={`absolute ${radiusClass} ${borderStyleClass} ${palette.border} backdrop-blur-[2px] flex flex-col items-start justify-start p-6 pointer-events-none`}
                  >
                    {shape.label && (
                      <span className="text-sm font-black uppercase tracking-widest text-white/90 bg-black/25 px-3 py-1 rounded-full">
                        {shape.label}
                      </span>
                    )}
                    {shape.sublabel && (
                      <span className="text-xs font-bold text-white/60 mt-1.5 px-1">
                        {shape.sublabel}
                      </span>
                    )}
                  </div>
                );
              })}

            {/* 2. SVG CONNECTOR LINES LAYER */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
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

            {/* 3. DROP ZONES & BUCKETS */}
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
                    transform: 'translate(-50%, -50%)',
                    zIndex: z.zOrder ?? 10
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

            {/* 4. INTERACTIVE & ANCHORED ENTITIES */}
            {entities
              .filter((e: any) => e.entityType !== 'bg_shape')
              .map((ent: any) => {
                if (ent.currentState === 'hidden') return null;
                const palette = COLOR_STYLES[ent.color || 'indigo'] || COLOR_STYLES.indigo;
                const borderStyleClass =
                  BORDER_STYLE_CLASSES[ent.borderStyle || 'solid'] || BORDER_STYLE_CLASSES.solid;
                const radiusClass =
                  SHAPE_RADIUS_CLASSES[ent.shapeVariant || 'banner'] || 'rounded-2xl';
                const isDragging = draggingId === ent.id;
                const isAnchored = Boolean(ent.anchored || ent.entityType === 'static_anchor');
                const isConnector = Boolean(
                  ent.entityType === 'connector_node' || ent.connectTargetId
                );

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
                        transform: `translate(-50%, -50%) scale(${ent.scale || 1})`,
                        zIndex: ent.zOrder ?? 25
                      }}
                      className={`absolute p-5 rounded-3xl bg-slate-900/95 border-2 ${
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
                        transform: `translate(-50%, -50%) scale(${ent.scale || 1})`,
                        zIndex: ent.zOrder ?? 25
                      }}
                      className={`absolute p-5 rounded-3xl bg-slate-900/95 border-2 ${
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
                      height: ent.height ? `${ent.height}%` : undefined,
                      transform: `translate(-50%, -50%) scale(${
                        (ent.scale || 1) * (isDragging ? 1.08 : 1)
                      }) rotate(${ent.rotation || 0}deg)`,
                      zIndex: isDragging ? 75 : ent.zOrder ?? (isAnchored ? 15 : 30)
                    }}
                    className={`absolute px-6 py-3.5 ${radiusClass} ${borderStyleClass} shadow-xl transition-shadow select-none flex items-center justify-center ${
                      isAnchored
                        ? 'bg-slate-900/90 border-slate-600/80 text-white cursor-default shadow-md'
                        : isConnector
                        ? `${palette.bg} ${palette.border} cursor-pointer hover:shadow-2xl`
                        : `${palette.bg} ${palette.border} cursor-grab active:cursor-grabbing hover:shadow-2xl`
                    } ${ringStyle}`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isAnchored && ent.label && (
                        <span title="Anchored to Stage" className="inline-flex">
                          <Pin size={14} className="text-amber-400 shrink-0 rotate-45" />
                        </span>
                      )}
                      {isConnector && (
                        <span title="Tap to Draw Connector Line" className="inline-flex">
                          <Link2 size={15} className="text-cyan-200 shrink-0" />
                        </span>
                      )}
                      <div className="text-center">
                        {ent.label && (
                          <div className="text-lg font-black leading-tight">{ent.label}</div>
                        )}
                        {ent.sublabel && (
                          <div
                            className={`text-xs font-bold mt-0.5 ${
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
//   - Shift+Click Multi-Selection & Synchronized Group Dragging
//   - Batch Contextual Task Bar Editing (Color, Border, Shape, Dimensions, Category, Align, Delete)
//   - 4 Dock Modes (Top Ribbon, Bottom Bar, Right Inspector, Pinned/Floating)
// ============================================================================
export const KineticCanvasBuilder = ({ block, onChange }: any) => {
  const outerWrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const resKey = block?.canvasResolution || 'fhd_1080';
  const resolution = CANVAS_RESOLUTIONS[resKey] || CANVAS_RESOLUTIONS.fhd_1080;

  const [stageScale, setStageScale] = useState(0.5);
  const [gridSnap, setGridSnap] = useState<number>(1);

  // 🔥 MULTI-SELECTION STATE (Supports 1 or many selected items via Shift+Click)
  const [selectedItems, setSelectedItems] = useState<
    Array<{ kind: 'entity' | 'zone'; id: string }>
  >([]);

  const primarySelected = selectedItems[0] || null;
  const isItemSelected = (kind: 'entity' | 'zone', id: string) =>
    selectedItems.some((s) => s.kind === kind && s.id === id);

  const selectOrToggleItem = (
    kind: 'entity' | 'zone',
    id: string,
    isShiftHeld: boolean
  ) => {
    if (isShiftHeld) {
      setSelectedItems((prev) => {
        const exists = prev.some((s) => s.kind === kind && s.id === id);
        if (exists) {
          return prev.filter((s) => !(s.kind === kind && s.id === id));
        }
        return [...prev, { kind, id }];
      });
    } else {
      setSelectedItems([{ kind, id }]);
    }
  };

  const [showLayerToolbar, setShowLayerToolbar] = useState(false);
  const [builderToast, setBuilderToast] = useState<string | null>(null);

  // PHOTOSHOP CONTEXTUAL TASK BAR DOCK & PIN STATE
  const [taskbarDock, setTaskbarDock] = useState<'floating' | 'top' | 'bottom' | 'right'>('top');
  const [isTaskbarPinned, setIsTaskbarPinned] = useState<boolean>(false);
  const [pinnedPos, setPinnedPos] = useState<{ x: number; y: number }>({ x: 50, y: 12 });
  const [isDraggingTaskbar, setIsDraggingTaskbar] = useState<boolean>(false);

  // Supports both single-item and multi-item group dragging
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
    groupInitialCoords: Array<{
      kind: 'entity' | 'zone';
      id: string;
      initX: number;
      initY: number;
    }>;
  } | null>(null);

  const [showRawJson, setShowRawJson] = useState(false);
  const [rawJsonText, setRawJsonText] = useState('');

  const entities = Array.isArray(block?.entities) ? block.entities : [];
  const zones = Array.isArray(block?.zones) ? block.zones : [];

  const notifyBuilder = (msg: string) => {
    setBuilderToast(msg);
    setTimeout(() => setBuilderToast(null), 2600);
  };

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
  }, [resolution.width, showLayerToolbar, taskbarDock]);

  const snapCoord = (val: number, minVal = 3, maxVal = 97) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    if (!gridSnap || gridSnap <= 0) return Number(clamped.toFixed(1));
    return Number((Math.round(clamped / gridSnap) * gridSnap).toFixed(1));
  };

  // ============================================================================
  //  1-CLICK AUTO-ALIGN ROW & COLUMN (MULTI-SELECT AWARE)
  // ============================================================================
  const handleAutoAlignRow = () => {
    // 1. If 2+ items are multi-selected via Shift+Click, align & space ONLY the selected items!
    if (selectedItems.length >= 2) {
      const resolved = selectedItems
        .map((s) => {
          const obj =
            s.kind === 'entity'
              ? entities.find((e: any) => e.id === s.id)
              : zones.find((z: any) => z.id === s.id);
          return obj ? { ...s, x: Number(obj.x ?? 50), y: Number(obj.y ?? 50) } : null;
        })
        .filter(Boolean) as Array<{ kind: 'entity' | 'zone'; id: string; x: number; y: number }>;

      if (resolved.length >= 2) {
        const sorted = [...resolved].sort((a, b) => a.x - b.x);
        const avgY = Number(
          (sorted.reduce((sum, item) => sum + item.y, 0) / sorted.length).toFixed(1)
        );
        const minX = Math.max(10, Math.min(...sorted.map((i) => i.x)));
        const maxX = Math.min(90, Math.max(...sorted.map((i) => i.x)));
        const span = maxX - minX >= 16 ? maxX - minX : 72;
        const startX = maxX - minX >= 16 ? minX : 14;

        const newPosMap = new Map<string, { x: number; y: number }>();
        sorted.forEach((item, idx) => {
          const evenX = Number(
            (startX + (idx * span) / Math.max(1, sorted.length - 1)).toFixed(1)
          );
          newPosMap.set(`${item.kind}_${item.id}`, { x: evenX, y: avgY });
        });

        const nextEntities = entities.map((e: any) => {
          const hit = newPosMap.get(`entity_${e.id}`);
          return hit ? { ...e, x: hit.x, y: hit.y, anchorX: hit.x, anchorY: hit.y } : e;
        });
        const nextZones = zones.map((z: any) => {
          const hit = newPosMap.get(`zone_${z.id}`);
          return hit ? { ...z, x: hit.x, y: hit.y } : z;
        });

        onChange({ ...block, entities: nextEntities, zones: nextZones });
        notifyBuilder(`Aligned & distributed ${sorted.length} selected items along Y=${avgY}%!`);
        return;
      }
    }

    // 2. Single item selected -> Align its horizontal row band
    if (primarySelected?.kind === 'zone') {
      const targetZone = zones.find((z: any) => z.id === primarySelected.id);
      if (targetZone) {
        const bandY = Number(targetZone.y ?? 30);
        const rowZones = zones
          .filter((z: any) => Math.abs(Number(z.y ?? 30) - bandY) <= 15)
          .sort((a: any, b: any) => (a.x ?? 50) - (b.x ?? 50));

        if (rowZones.length > 1) {
          const count = rowZones.length;
          const idToNewX = new Map<string, number>();
          rowZones.forEach((z: any, idx: number) => {
            const evenX = count === 1 ? 50 : Number((14 + (idx * 72) / (count - 1)).toFixed(1));
            idToNewX.set(z.id, evenX);
          });

          const nextZones = zones.map((z: any) =>
            idToNewX.has(z.id)
              ? { ...z, x: idToNewX.get(z.id), y: Number(bandY.toFixed(1)) }
              : z
          );
          onChange({ ...block, zones: nextZones });
          notifyBuilder(`Aligned & distributed ${rowZones.length} drop zones along Y=${bandY.toFixed(0)}%!`);
          return;
        }
      }
    }

    if (primarySelected?.kind === 'entity') {
      const targetEnt = entities.find((e: any) => e.id === primarySelected.id);
      if (targetEnt && targetEnt.entityType !== 'bg_shape') {
        const bandY = Number(targetEnt.y ?? 82);
        const rowEnts = entities
          .filter(
            (e: any) =>
              e.entityType !== 'bg_shape' && Math.abs(Number(e.y ?? 82) - bandY) <= 14
          )
          .sort((a: any, b: any) => (a.x ?? 50) - (b.x ?? 50));

        if (rowEnts.length > 1) {
          const count = rowEnts.length;
          const idToNewX = new Map<string, number>();
          rowEnts.forEach((e: any, idx: number) => {
            const evenX = count === 1 ? 50 : Number((12 + (idx * 76) / (count - 1)).toFixed(1));
            idToNewX.set(e.id, evenX);
          });

          const nextEntities = entities.map((e: any) =>
            idToNewX.has(e.id)
              ? {
                  ...e,
                  x: idToNewX.get(e.id),
                  y: Number(bandY.toFixed(1)),
                  anchorX: idToNewX.get(e.id),
                  anchorY: Number(bandY.toFixed(1))
                }
              : e
          );
          onChange({ ...block, entities: nextEntities });
          notifyBuilder(`Aligned & evenly spaced ${rowEnts.length} boxes along Y=${bandY.toFixed(0)}%!`);
          return;
        }
      }
    }

    // 3. Fallback: Tidy all unanchored draggable cards into 1–2 bottom word-bank rows
    const draggables = entities.filter(
      (e: any) => !e.anchored && e.draggable !== false && e.entityType !== 'bg_shape'
    );
    if (draggables.length === 0) return;

    const maxPerRow = 6;
    const updatedMap = new Map<string, { x: number; y: number }>();
    draggables.forEach((ent: any, idx: number) => {
      const rowIdx = Math.floor(idx / maxPerRow);
      const colIdx = idx % maxPerRow;
      const itemsInThisRow = Math.min(maxPerRow, draggables.length - rowIdx * maxPerRow);
      const evenX =
        itemsInThisRow === 1
          ? 50
          : Number((12 + (colIdx * 76) / (itemsInThisRow - 1)).toFixed(1));
      const rowY = draggables.length > maxPerRow ? (rowIdx === 0 ? 80 : 91) : 85;
      updatedMap.set(ent.id, { x: evenX, y: rowY });
    });

    const nextEntities = entities.map((e: any) => {
      const coords = updatedMap.get(e.id);
      if (!coords) return e;
      return {
        ...e,
        x: coords.x,
        y: coords.y,
        anchorX: coords.x,
        anchorY: coords.y
      };
    });

    onChange({ ...block, entities: nextEntities });
    notifyBuilder(`Auto-aligned ${draggables.length} cards into an evenly spaced word bank!`);
  };

  const handleAutoAlignColumn = () => {
    // 1. If 2+ items are multi-selected via Shift+Click, align & space ONLY the selected items vertically!
    if (selectedItems.length >= 2) {
      const resolved = selectedItems
        .map((s) => {
          const obj =
            s.kind === 'entity'
              ? entities.find((e: any) => e.id === s.id)
              : zones.find((z: any) => z.id === s.id);
          return obj ? { ...s, x: Number(obj.x ?? 50), y: Number(obj.y ?? 50) } : null;
        })
        .filter(Boolean) as Array<{ kind: 'entity' | 'zone'; id: string; x: number; y: number }>;

      if (resolved.length >= 2) {
        const sorted = [...resolved].sort((a, b) => a.y - b.y);
        const avgX = Number(
          (sorted.reduce((sum, item) => sum + item.x, 0) / sorted.length).toFixed(1)
        );
        const minY = Math.max(14, Math.min(...sorted.map((i) => i.y)));
        const maxY = Math.min(88, Math.max(...sorted.map((i) => i.y)));
        const span = maxY - minY >= 16 ? maxY - minY : 56;
        const startY = maxY - minY >= 16 ? minY : 22;

        const newPosMap = new Map<string, { x: number; y: number }>();
        sorted.forEach((item, idx) => {
          const evenY = Number(
            (startY + (idx * span) / Math.max(1, sorted.length - 1)).toFixed(1)
          );
          newPosMap.set(`${item.kind}_${item.id}`, { x: avgX, y: evenY });
        });

        const nextEntities = entities.map((e: any) => {
          const hit = newPosMap.get(`entity_${e.id}`);
          return hit ? { ...e, x: hit.x, y: hit.y, anchorX: hit.x, anchorY: hit.y } : e;
        });
        const nextZones = zones.map((z: any) => {
          const hit = newPosMap.get(`zone_${z.id}`);
          return hit ? { ...z, x: hit.x, y: hit.y } : z;
        });

        onChange({ ...block, entities: nextEntities, zones: nextZones });
        notifyBuilder(`Aligned & stacked ${sorted.length} selected items vertically along X=${avgX}%!`);
        return;
      }
    }

    // 2. Single item selected -> Align its vertical column band
    if (primarySelected?.kind === 'entity') {
      const targetEnt = entities.find((e: any) => e.id === primarySelected.id);
      if (targetEnt && targetEnt.entityType !== 'bg_shape') {
        const bandX = Number(targetEnt.x ?? 25);
        const colEnts = entities
          .filter(
            (e: any) =>
              e.entityType !== 'bg_shape' && Math.abs(Number(e.x ?? 25) - bandX) <= 15
          )
          .sort((a: any, b: any) => (a.y ?? 50) - (b.y ?? 50));

        if (colEnts.length > 1) {
          const count = colEnts.length;
          const idToNewY = new Map<string, number>();
          colEnts.forEach((e: any, idx: number) => {
            const evenY = Number((20 + (idx * 60) / (count - 1)).toFixed(1));
            idToNewY.set(e.id, evenY);
          });

          const nextEntities = entities.map((e: any) =>
            idToNewY.has(e.id)
              ? {
                  ...e,
                  x: Number(bandX.toFixed(1)),
                  y: idToNewY.get(e.id),
                  anchorX: Number(bandX.toFixed(1)),
                  anchorY: idToNewY.get(e.id)
                }
              : e
          );
          onChange({ ...block, entities: nextEntities });
          notifyBuilder(`Aligned ${colEnts.length} boxes vertically along X=${bandX.toFixed(0)}%!`);
          return;
        }
      }
    }
    notifyBuilder('Shift+Click 2+ items (or select a box in a vertical column) to align vertically.');
  };

  // Start Four-Directions Move (Supports Shift+Click Multi-Selection & Synchronized Group Dragging)
  const startMoveItem = (
    e: React.PointerEvent,
    kind: 'entity' | 'zone',
    item: any
  ) => {
    e.stopPropagation();

    const alreadySelected = isItemSelected(kind, item.id);
    let nextSelection = selectedItems;

    if (e.shiftKey) {
      if (alreadySelected) {
        nextSelection = selectedItems.filter((s) => !(s.kind === kind && s.id === item.id));
        setSelectedItems(nextSelection);
        return;
      } else {
        nextSelection = [...selectedItems, { kind, id: item.id }];
        setSelectedItems(nextSelection);
      }
    } else if (!alreadySelected) {
      nextSelection = [{ kind, id: item.id }];
      setSelectedItems(nextSelection);
    }

    if (item.lockInBuilder) return;

    const groupInitialCoords = nextSelection
      .map((s) => {
        const obj =
          s.kind === 'entity'
            ? entities.find((ent: any) => ent.id === s.id)
            : zones.find((z: any) => z.id === s.id);
        if (!obj || obj.lockInBuilder) return null;
        return {
          kind: s.kind,
          id: s.id,
          initX: Number(obj.x ?? 50),
          initY: Number(obj.y ?? 50)
        };
      })
      .filter(Boolean) as Array<{
      kind: 'entity' | 'zone';
      id: string;
      initX: number;
      initY: number;
    }>;

    setInteraction({
      mode: 'move',
      kind,
      id: item.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      initX: Number(item.x ?? 50),
      initY: Number(item.y ?? 50),
      initScale: item.scale ?? 1,
      initWidth: item.width ?? 24,
      initHeight: item.height ?? 20,
      groupInitialCoords
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
    if (!isItemSelected(kind, item.id)) {
      setSelectedItems([{ kind, id: item.id }]);
    }
    if (item.lockInBuilder) return;

    setInteraction({
      mode: 'resize',
      kind,
      id: item.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      initX: Number(item.x ?? 50),
      initY: Number(item.y ?? 50),
      initScale: item.scale ?? 1,
      initWidth:
        item.width ??
        (kind === 'zone' ? 28 : item.entityType === 'bg_shape' ? 44 : 18),
      initHeight:
        item.height ??
        (kind === 'zone' ? 26 : item.entityType === 'bg_shape' ? 36 : 10),
      groupInitialCoords: []
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Unified Stage Pointer Move (Handles Single/Group Move, Resize, and Floating Taskbar Drag)
  const handleStagePointerMove = (e: React.PointerEvent) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();

    if (isDraggingTaskbar) {
      const nextX = Math.max(15, Math.min(85, ((e.clientX - rect.left) / rect.width) * 100));
      const nextY = Math.max(8, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100));
      setPinnedPos({ x: Number(nextX.toFixed(1)), y: Number(nextY.toFixed(1)) });
      return;
    }

    if (!interaction) return;

    if (interaction.mode === 'move') {
      const deltaPctX = ((e.clientX - interaction.startClientX) / rect.width) * 100;
      const deltaPctY = ((e.clientY - interaction.startClientY) / rect.height) * 100;

      // Group Move when 2+ items are selected
      if (interaction.groupInitialCoords.length > 1) {
        const entityMoveMap = new Map<string, { x: number; y: number }>();
        const zoneMoveMap = new Map<string, { x: number; y: number }>();

        interaction.groupInitialCoords.forEach((g) => {
          const nx = snapCoord(g.initX + deltaPctX);
          const ny = snapCoord(g.initY + deltaPctY);
          if (g.kind === 'entity') entityMoveMap.set(g.id, { x: nx, y: ny });
          else zoneMoveMap.set(g.id, { x: nx, y: ny });
        });

        const nextEntities = entities.map((ent: any) => {
          const moved = entityMoveMap.get(ent.id);
          return moved
            ? { ...ent, x: moved.x, y: moved.y, anchorX: moved.x, anchorY: moved.y }
            : ent;
        });
        const nextZones = zones.map((z: any) => {
          const moved = zoneMoveMap.get(z.id);
          return moved ? { ...z, x: moved.x, y: moved.y } : z;
        });

        onChange({ ...block, entities: nextEntities, zones: nextZones });
        return;
      }

      // Single Item Move
      const nextX = snapCoord(interaction.initX + deltaPctX);
      const nextY = snapCoord(interaction.initY + deltaPctY);

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
        const nextW = snapCoord(interaction.initWidth + deltaPctX * 2, 6, 96);
        const nextH = snapCoord(interaction.initHeight + deltaPctY * 2, 6, 96);
        const nextZones = zones.map((z: any) =>
          z.id === interaction.id ? { ...z, width: nextW, height: nextH } : z
        );
        onChange({ ...block, zones: nextZones });
      } else {
        const targetEnt = entities.find((ent: any) => ent.id === interaction.id);
        const useBoxResize =
          targetEnt?.entityType === 'bg_shape' ||
          targetEnt?.resizeMode === 'box' ||
          targetEnt?.width !== undefined ||
          !targetEnt?.label;

        if (useBoxResize) {
          const nextW = snapCoord(interaction.initWidth + deltaPctX * 2, 5, 96);
          const nextH = snapCoord(interaction.initHeight + deltaPctY * 2, 5, 96);
          const nextEntities = entities.map((ent: any) =>
            ent.id === interaction.id
              ? { ...ent, width: nextW, height: nextH, resizeMode: 'box' }
              : ent
          );
          onChange({ ...block, entities: nextEntities });
        } else {
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
    }
  };

  // Batch-Aware Field Updater (Applies to ALL currently selected items!)
  const updateSelectedFields = (patch: Record<string, any>) => {
    const selEntIds = new Set(
      selectedItems.filter((s) => s.kind === 'entity').map((s) => s.id)
    );
    const selZoneIds = new Set(
      selectedItems.filter((s) => s.kind === 'zone').map((s) => s.id)
    );

    const nextEntities = entities.map((e: any) =>
      selEntIds.has(e.id) ? { ...e, ...patch } : e
    );
    const nextZones = zones.map((z: any) =>
      selZoneIds.has(z.id)
        ? {
            ...z,
            ...patch,
            ...(patch.category !== undefined ? { acceptedCategory: patch.category } : {})
          }
        : z
    );

    onChange({ ...block, entities: nextEntities, zones: nextZones });
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

  const addEntity = (isAnchoredProp: boolean) => {
    const newId = `ent_${Date.now()}`;
    const newEnt = {
      id: newId,
      entityType: isAnchoredProp ? 'static_anchor' : 'draggable',
      label: isAnchoredProp ? 'Anchored Sentence Frame' : 'New Draggable Card',
      sublabel: isAnchoredProp ? 'Pull corner to resize box' : 'Category / Sequence',
      color: isAnchoredProp ? 'slate' : 'indigo',
      borderStyle: 'solid',
      shapeVariant: 'banner',
      x: 50,
      y: isAnchoredProp ? 55 : 82,
      anchorX: 50,
      anchorY: isAnchoredProp ? 55 : 82,
      width: isAnchoredProp ? 26 : undefined,
      height: isAnchoredProp ? 12 : undefined,
      resizeMode: isAnchoredProp ? 'box' : 'scale',
      scale: 1,
      rotation: 0,
      zOrder: isAnchoredProp ? 15 : 30,
      draggable: !isAnchoredProp,
      anchored: isAnchoredProp,
      returnToAnchor: !isAnchoredProp,
      category: ''
    };
    onChange({ ...block, entities: [...entities, newEnt] });
    setSelectedItems([{ kind: 'entity', id: newId }]);
  };

  const addBackgroundShape = () => {
    const newId = `shape_${Date.now()}`;
    const newShape = {
      id: newId,
      entityType: 'bg_shape',
      label: 'Group Section Header',
      sublabel: 'Background Grouping Container',
      color: 'indigo',
      borderStyle: 'solid',
      shapeVariant: 'rounded',
      opacity: 22,
      x: 50,
      y: 45,
      width: 48,
      height: 42,
      resizeMode: 'box',
      rotation: 0,
      zOrder: 2,
      draggable: false,
      anchored: true,
      lockInBuilder: false
    };
    onChange({ ...block, entities: [newShape, ...entities] });
    setSelectedItems([{ kind: 'entity', id: newId }]);
    notifyBuilder('Added Background Group Shape! Use the Contextual Taskbar to style or lock it.');
  };

  const addMultiColumnGroupPreset = (cols: 2 | 3) => {
    const now = Date.now();
    const paletteCycle = ['indigo', 'emerald', 'amber'];
    const newShapes = Array.from({ length: cols }).map((_, idx) => {
      const width = cols === 2 ? 43 : 29;
      const x = cols === 2 ? (idx === 0 ? 27 : 73) : idx === 0 ? 18 : idx === 1 ? 50 : 82;
      return {
        id: `shape_${now}_${idx}`,
        entityType: 'bg_shape',
        label: `Group Column ${idx + 1}`,
        sublabel: 'Background Container',
        color: paletteCycle[idx % paletteCycle.length],
        borderStyle: 'solid',
        shapeVariant: 'rounded',
        opacity: 18,
        x,
        y: 42,
        width,
        height: 62,
        resizeMode: 'box',
        rotation: 0,
        zOrder: 2,
        draggable: false,
        anchored: true,
        lockInBuilder: false
      };
    });
    onChange({ ...block, entities: [...newShapes, ...entities] });
    setSelectedItems(newShapes.map((s) => ({ kind: 'entity' as const, id: s.id })));
    notifyBuilder(`Added ${cols}-Column Background Group Layout (All ${cols} Selected)!`);
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
      zOrder: 10,
      acceptedCategory: '',
      anchored: false
    };
    onChange({ ...block, zones: [...zones, newZone] });
    setSelectedItems([{ kind: 'zone', id: newId }]);
  };

  const adjustLayerZOrder = (
    kind: 'entity' | 'zone',
    id: string,
    op: 'back' | 'backward' | 'forward' | 'front'
  ) => {
    const getNextZ = (currentZ: number) => {
      if (op === 'back') return 1;
      if (op === 'backward') return Math.max(1, currentZ - 5);
      if (op === 'forward') return Math.min(70, currentZ + 5);
      return 60;
    };

    if (kind === 'entity') {
      const target = entities.find((e: any) => e.id === id);
      const currZ = target?.zOrder ?? (target?.entityType === 'bg_shape' ? 2 : 30);
      updateEntityField(id, { zOrder: getNextZ(currZ) });
    } else {
      const target = zones.find((z: any) => z.id === id);
      const currZ = target?.zOrder ?? 10;
      updateZoneField(id, { zOrder: getNextZ(currZ) });
    }
  };

  const adjustBatchZOrder = (op: 'back' | 'front') => {
    const targetZ = op === 'back' ? 1 : 60;
    updateSelectedFields({ zOrder: targetZ });
  };

  const handleLinkConnectorTarget = (sourceId: string, targetId: string) => {
    const nextEntities = entities.map((e: any) => {
      if (e.id === sourceId) {
        return {
          ...e,
          connectTargetId: targetId || undefined,
          entityType: targetId ? 'connector_node' : 'draggable',
          draggable: !targetId && !e.anchored
        };
      }
      if (targetId && e.id === targetId) {
        return {
          ...e,
          entityType: 'connector_node',
          draggable: false
        };
      }
      return e;
    });
    onChange({ ...block, entities: nextEntities });
    if (targetId) {
      const targetObj = entities.find((e: any) => e.id === targetId);
      notifyBuilder(`Linked connector line to "${targetObj?.label || targetId}"!`);
    } else {
      notifyBuilder('Removed connector link.');
    }
  };

  const duplicateSelectedItems = () => {
    const now = Date.now();
    const selEntIds = new Set(
      selectedItems.filter((s) => s.kind === 'entity').map((s) => s.id)
    );
    const copies: any[] = [];
    const newSelection: Array<{ kind: 'entity' | 'zone'; id: string }> = [];

    entities.forEach((ent: any, idx: number) => {
      if (selEntIds.has(ent.id)) {
        const copyId = `ent_${now}_${idx}`;
        const nx = Math.min(92, Number((ent.x || 50) + 4));
        const ny = Math.min(92, Number((ent.y || 50) + 4));
        copies.push({
          ...ent,
          id: copyId,
          x: nx,
          y: ny,
          anchorX: nx,
          anchorY: ny
        });
        newSelection.push({ kind: 'entity', id: copyId });
      }
    });

    if (copies.length > 0) {
      onChange({ ...block, entities: [...entities, ...copies] });
      setSelectedItems(newSelection);
      notifyBuilder(`Duplicated ${copies.length} item(s)!`);
    }
  };

  const deleteSelectedItems = () => {
    const selEntIds = new Set(
      selectedItems.filter((s) => s.kind === 'entity').map((s) => s.id)
    );
    const selZoneIds = new Set(
      selectedItems.filter((s) => s.kind === 'zone').map((s) => s.id)
    );
    onChange({
      ...block,
      entities: entities.filter((e: any) => !selEntIds.has(e.id)),
      zones: zones.filter((z: any) => !selZoneIds.has(z.id))
    });
    setSelectedItems([]);
  };

  const handleSelectAllCards = () => {
    const allCardSelections = entities
      .filter((e: any) => e.entityType !== 'bg_shape')
      .map((e: any) => ({ kind: 'entity' as const, id: e.id }));
    setSelectedItems(allCardSelections);
    notifyBuilder(`Selected all ${allCardSelections.length} cards on stage!`);
  };

  const unifiedLayerStack = useMemo(() => {
    const list: Array<{
      kind: 'entity' | 'zone';
      id: string;
      label: string;
      typeLabel: string;
      zOrder: number;
      locked: boolean;
      hidden: boolean;
    }> = [];

    entities.forEach((e: any) => {
      const defaultZ = e.entityType === 'bg_shape' ? 2 : e.anchored ? 15 : 30;
      list.push({
        kind: 'entity',
        id: e.id,
        label: e.label || '(Empty Box / Shape)',
        typeLabel:
          e.entityType === 'bg_shape'
            ? 'Group Shape'
            : e.anchored
            ? 'Anchored Box'
            : 'Draggable Card',
        zOrder: e.zOrder ?? defaultZ,
        locked: Boolean(e.lockInBuilder),
        hidden: e.initialState === 'hidden'
      });
    });

    zones.forEach((z: any) => {
      list.push({
        kind: 'zone',
        id: z.id,
        label: z.label || 'Drop Bucket',
        typeLabel: 'Drop Zone',
        zOrder: z.zOrder ?? 10,
        locked: Boolean(z.anchored || z.lockInBuilder),
        hidden: Boolean(z.invisible)
      });
    });

    return list.sort((a, b) => b.zOrder - a.zOrder);
  }, [entities, zones]);

  const activeSelectedEntity =
    primarySelected?.kind === 'entity'
      ? entities.find((e: any) => e.id === primarySelected.id)
      : null;
  const activeSelectedZone =
    primarySelected?.kind === 'zone'
      ? zones.find((z: any) => z.id === primarySelected.id)
      : null;
  const activeTarget = activeSelectedEntity || activeSelectedZone;
  const isMultiSelect = selectedItems.length > 1;

  const activeThemeClass =
    THEME_BACKGROUNDS[block?.backgroundTheme || 'physics_lab'] || THEME_BACKGROUNDS.physics_lab;

  // ============================================================================
  //  🔥 PHOTOSHOP / FIGMA CONTEXTUAL TASK BAR RENDERER (SINGLE + BATCH MULTI-EDIT)
  // ============================================================================
  const renderContextualTaskBar = (isFloatingInstance = false) => {
    if (!activeTarget) {
      if (taskbarDock === 'top' || taskbarDock === 'bottom') {
        return (
          <div className="px-4 py-2.5 rounded-2xl bg-slate-900/95 text-slate-400 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
            <span className="flex items-center gap-2">
              <Sliders size={14} className="text-indigo-400" />
              Click any box to inspect — or <strong className="text-cyan-300">Shift + Click</strong> multiple boxes to batch-style, align, or move them together!
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleSelectAllCards}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600 text-[10px] font-black uppercase text-slate-200 mr-2 flex items-center gap-1"
              >
                <CheckSquare size={12} /> Select All Cards
              </button>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 mr-1">Dock:</span>
              <button
                type="button"
                title="Dock to Top Ribbon"
                onClick={() => setTaskbarDock('top')}
                className={`p-1.5 rounded-lg ${taskbarDock === 'top' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
              >
                <PanelTop size={13} />
              </button>
              <button
                type="button"
                title="Dock to Bottom Bar"
                onClick={() => setTaskbarDock('bottom')}
                className={`p-1.5 rounded-lg ${taskbarDock === 'bottom' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
              >
                <PanelBottom size={13} />
              </button>
              <button
                type="button"
                title="Dock to Right Inspector Sidebar"
                onClick={() => setTaskbarDock('right')}
                className="p-1.5 rounded-lg hover:bg-slate-800"
              >
                <PanelRight size={13} />
              </button>
              <button
                type="button"
                title="Float Over Canvas"
                onClick={() => setTaskbarDock('floating')}
                className="p-1.5 rounded-lg hover:bg-slate-800"
              >
                <Move size={13} />
              </button>
            </div>
          </div>
        );
      }
      return null;
    }

    const isVertical = taskbarDock === 'right' && !isFloatingInstance;
    const isEntity = Boolean(activeSelectedEntity);
    const isBgShape = activeSelectedEntity?.entityType === 'bg_shape';

    const floatX = isTaskbarPinned
      ? pinnedPos.x
      : Math.min(76, Math.max(24, Number(activeTarget.x ?? 50)));
    const rawTargetY = Number(activeTarget.y ?? 50);
    const floatY = isTaskbarPinned
      ? pinnedPos.y
      : rawTargetY > 32
      ? Math.max(10, rawTargetY - 16)
      : Math.min(88, rawTargetY + 18);

    const wrapperStyle: React.CSSProperties = isFloatingInstance
      ? {
          position: 'absolute',
          left: `${floatX}%`,
          top: `${floatY}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: 220
        }
      : {};

    return (
      <div
        style={wrapperStyle}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className={`${
          isFloatingInstance
            ? 'max-w-[95%] w-max rounded-2xl bg-slate-900/95 backdrop-blur-2xl border-2 border-indigo-400/70 shadow-[0_20px_60px_rgba(0,0,0,0.85)] p-2.5 text-white animate-in zoom-in-95 duration-150'
            : isVertical
            ? 'w-full lg:w-80 shrink-0 rounded-3xl bg-slate-900 text-white border border-slate-800 p-4 space-y-4 self-start shadow-xl'
            : 'w-full rounded-2xl bg-slate-900 text-white border border-slate-800 px-3.5 py-2.5 shadow-lg'
        }`}
      >
        <div
          className={`flex ${
            isVertical ? 'flex-col gap-3.5' : 'flex-wrap items-center gap-2.5'
          }`}
        >
          {/* 1. Drag Grip + Pin Toggle + Multi-Select Count Badge */}
          <div className="flex items-center gap-1.5 pr-2 border-r border-slate-700/80">
            {isFloatingInstance && (
              <button
                type="button"
                title="Drag to Reposition Floating Task Bar (Auto-Pins Position)"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setIsTaskbarPinned(true);
                  setIsDraggingTaskbar(true);
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                }}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  setIsDraggingTaskbar(false);
                  try {
                    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                  } catch {}
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white cursor-grab active:cursor-grabbing"
              >
                <GripVertical size={14} />
              </button>
            )}

            <span
              className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${
                isMultiSelect
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
              }`}
            >
              {isMultiSelect
                ? `${selectedItems.length} Selected`
                : isBgShape
                ? 'Group Shape'
                : isEntity
                ? 'Card / Box'
                : 'Drop Bucket'}
            </span>

            {isFloatingInstance && (
              <button
                type="button"
                title={
                  isTaskbarPinned
                    ? 'Pinned in Place (Click to Follow Selected Object)'
                    : 'Pin Task Bar at Current Position'
                }
                onClick={() => {
                  if (!isTaskbarPinned) {
                    setPinnedPos({ x: floatX, y: floatY });
                  }
                  setIsTaskbarPinned((p) => !p);
                }}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isTaskbarPinned
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <Pin size={12} />
              </button>
            )}
          </div>

          {/* 2. Primary Text & Sublabel Inline Inputs (Shown for Single Item or Batch Sublabel) */}
          <div className={`flex ${isVertical ? 'flex-col' : 'items-center'} gap-1.5`}>
            {!isMultiSelect && (
              <input
                type="text"
                value={activeTarget.label || ''}
                placeholder="(Empty Box — No Text)"
                onChange={(e) => updateSelectedFields({ label: e.target.value })}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-400 text-xs font-black text-white outline-none w-40"
                title="Primary Label"
              />
            )}
            <input
              type="text"
              value={activeTarget.sublabel || ''}
              placeholder={isMultiSelect ? 'Batch subtitle...' : 'Subtitle / hint...'}
              onChange={(e) => updateSelectedFields({ sublabel: e.target.value })}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-400 text-[11px] font-bold text-slate-300 outline-none w-32"
              title="Subtitle / Hint (Applies to All Selected)"
            />
            <button
              type="button"
              title="Clear Text on Selected (Convert to Empty Resizable Box)"
              onClick={() =>
                updateSelectedFields({
                  label: '',
                  sublabel: '',
                  width: activeTarget.width ?? 24,
                  height: activeTarget.height ?? 16,
                  resizeMode: 'box'
                })
              }
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-[9px] font-black uppercase text-slate-300 transition-colors whitespace-nowrap"
            >
              Empty
            </button>
          </div>

          {/* 3. 6-Color Palette Swatches (Batch Applies to All Selected!) */}
          <div className="flex items-center gap-1 px-2 border-l border-r border-slate-800">
            {Object.entries(COLOR_STYLES).map(([colorKey, cObj]) => {
              const isPicked = (activeTarget.color || 'indigo') === colorKey;
              return (
                <button
                  key={colorKey}
                  type="button"
                  title={`Apply ${colorKey} to selected`}
                  onClick={() => updateSelectedFields({ color: colorKey })}
                  style={{ backgroundColor: cObj.hex }}
                  className={`w-5 h-5 rounded-full border transition-transform ${
                    isPicked
                      ? 'border-white scale-125 ring-2 ring-white/60'
                      : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                />
              );
            })}
          </div>

          {/* 4. Border Style & Shape Corner Pickers (Batch Applies to All Selected!) */}
          <div className="flex items-center gap-1.5">
            <select
              value={activeTarget.borderStyle || (isEntity ? 'solid' : 'dashed')}
              onChange={(e) => updateSelectedFields({ borderStyle: e.target.value })}
              title="Border Style"
              className="px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-[10px] font-black uppercase text-slate-200 outline-none"
            >
              <option value="solid">Border: Solid</option>
              <option value="dashed">Border: Dashed</option>
              <option value="dotted">Border: Dotted</option>
              <option value="double">Border: Double</option>
              <option value="glow">Border: Glow</option>
              <option value="none">Border: None</option>
            </select>

            {isEntity && (
              <select
                value={activeTarget.shapeVariant || 'banner'}
                onChange={(e) => updateSelectedFields({ shapeVariant: e.target.value })}
                title="Corner Geometry"
                className="px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-[10px] font-black uppercase text-slate-200 outline-none"
              >
                <option value="banner">Shape: Card</option>
                <option value="rounded">Shape: Group Box</option>
                <option value="sharp">Shape: Rectangle</option>
                <option value="pill">Shape: Pill / Oval</option>
              </select>
            )}
          </div>

          {/* 5. Compact W% × H% Dimensions & Opacity */}
          <div className="flex items-center gap-1.5 px-2 border-l border-slate-800">
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
              <span className="text-[9px] font-black text-slate-400">W%</span>
              <input
                type="number"
                min={5}
                max={96}
                value={activeTarget.width ?? (isEntity ? 20 : 28)}
                onChange={(e) => {
                  const w = Math.max(5, Math.min(96, Number(e.target.value) || 15));
                  updateSelectedFields({
                    width: w,
                    height: activeTarget.height ?? 14,
                    resizeMode: 'box'
                  });
                }}
                className="w-10 bg-transparent text-xs font-mono font-black text-emerald-400 outline-none text-center"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
              <span className="text-[9px] font-black text-slate-400">H%</span>
              <input
                type="number"
                min={5}
                max={96}
                value={activeTarget.height ?? (isEntity ? 12 : 24)}
                onChange={(e) => {
                  const h = Math.max(5, Math.min(96, Number(e.target.value) || 12));
                  updateSelectedFields({
                    height: h,
                    width: activeTarget.width ?? 20,
                    resizeMode: 'box'
                  });
                }}
                className="w-10 bg-transparent text-xs font-mono font-black text-emerald-400 outline-none text-center"
              />
            </div>

            {isBgShape && (
              <div
                className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800"
                title="Background Fill Opacity %"
              >
                <span className="text-[9px] font-black text-purple-300">α%</span>
                <input
                  type="number"
                  min={5}
                  max={95}
                  step={5}
                  value={activeTarget.opacity ?? 22}
                  onChange={(e) =>
                    updateSelectedFields({
                      opacity: Math.max(5, Math.min(95, Number(e.target.value) || 20))
                    })
                  }
                  className="w-10 bg-transparent text-xs font-mono font-black text-purple-300 outline-none text-center"
                />
              </div>
            )}
          </div>

          {/* 6. Category / Sequence / Connector Target Controls */}
          <div className="flex items-center gap-1.5">
            {isEntity && !isBgShape ? (
              <>
                <input
                  type="text"
                  placeholder="Category (e.g. ed)"
                  value={activeTarget.category || ''}
                  onChange={(e) => updateSelectedFields({ category: e.target.value })}
                  title="Category Match Tag (Applies to All Selected)"
                  className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-[11px] font-bold text-emerald-300 outline-none w-28"
                />
                {!isMultiSelect && (
                  <>
                    <input
                      type="number"
                      placeholder="Seq #"
                      value={activeTarget.sequenceIndex ?? ''}
                      onChange={(e) =>
                        updateEntityField(activeTarget.id, {
                          sequenceIndex: e.target.value ? Number(e.target.value) : undefined
                        })
                      }
                      title="Sequence Order Slot #"
                      className="px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-[11px] font-bold text-amber-300 outline-none w-16"
                    />
                    <select
                      value={activeTarget.connectTargetId || ''}
                      onChange={(e) => handleLinkConnectorTarget(activeTarget.id, e.target.value)}
                      title="Link SVG Connector Line Target"
                      className="px-2 py-1.5 rounded-xl bg-slate-950 border border-cyan-500/40 text-[10px] font-bold text-cyan-300 outline-none max-w-[140px]"
                    >
                      <option value="">Link Line: None</option>
                      {entities
                        .filter(
                          (other: any) =>
                            other.id !== activeTarget.id && other.entityType !== 'bg_shape'
                        )
                        .map((other: any) => (
                          <option key={other.id} value={other.id}>
                            ➔ {other.label || other.id}
                          </option>
                        ))}
                    </select>
                  </>
                )}
              </>
            ) : !isEntity ? (
              <>
                <input
                  type="text"
                  placeholder="Accepts Cat (e.g. ed)"
                  value={activeTarget.acceptedCategory || ''}
                  onChange={(e) => updateSelectedFields({ acceptedCategory: e.target.value })}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-[11px] font-bold text-emerald-300 outline-none w-32"
                />
                <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
                  <span className="text-[9px] font-black text-slate-400">Cap</span>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={activeTarget.capacity ?? 2}
                    onChange={(e) =>
                      updateSelectedFields({
                        capacity: Math.max(1, Number(e.target.value) || 1)
                      })
                    }
                    className="w-8 bg-transparent text-xs font-mono font-black text-white outline-none text-center"
                  />
                </div>
              </>
            ) : null}
          </div>

          {/* 7. Quick Toggles: Align Selected Row/Col, Background Shape, Anchor, Lock, Z-Order, Duplicate & Delete */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            {isMultiSelect && (
              <>
                <button
                  type="button"
                  title="Align Selected Items Horizontally in a Row"
                  onClick={handleAutoAlignRow}
                  className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  <AlignHorizontalSpaceAround size={13} />
                </button>
                <button
                  type="button"
                  title="Align Selected Items Vertically in a Column"
                  onClick={handleAutoAlignColumn}
                  className="p-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white"
                >
                  <AlignVerticalSpaceAround size={13} />
                </button>
              </>
            )}

            {isEntity && (
              <>
                <button
                  type="button"
                  title={
                    isBgShape
                      ? 'Convert to Draggable Card'
                      : 'Convert to Background Group Shape (Sends Behind Cards)'
                  }
                  onClick={() =>
                    updateSelectedFields({
                      entityType: isBgShape ? 'draggable' : 'bg_shape',
                      zOrder: isBgShape ? 30 : 2,
                      width: activeTarget.width ?? 42,
                      height: activeTarget.height ?? 34,
                      opacity: activeTarget.opacity ?? 20,
                      anchored: !isBgShape,
                      draggable: isBgShape
                    })
                  }
                  className={`p-1.5 rounded-lg border text-[10px] font-black uppercase flex items-center gap-1 ${
                    isBgShape
                      ? 'bg-purple-600 text-white border-purple-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  <Square size={12} />
                </button>

                <button
                  type="button"
                  title={
                    activeTarget.anchored
                      ? 'Anchored on Student Stage (Students Cannot Drag)'
                      : 'Draggable by Students (Click to Anchor in Place)'
                  }
                  onClick={() =>
                    updateSelectedFields({
                      anchored: !activeTarget.anchored,
                      draggable: Boolean(activeTarget.anchored)
                    })
                  }
                  className={`p-1.5 rounded-lg border ${
                    activeTarget.anchored
                      ? 'bg-amber-500 text-slate-950 border-amber-300'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  <Pin size={12} />
                </button>

                {!activeTarget.anchored && (
                  <button
                    type="button"
                    title={
                      activeTarget.returnToAnchor
                        ? 'Magnetic Home Return: ON'
                        : 'Magnetic Home Return: OFF'
                    }
                    onClick={() =>
                      updateSelectedFields({
                        returnToAnchor: !activeTarget.returnToAnchor
                      })
                    }
                    className={`p-1.5 rounded-lg border ${
                      activeTarget.returnToAnchor
                        ? 'bg-cyan-600 text-white border-cyan-400'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <Magnet size={12} />
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              title="Send Selected to Back"
              onClick={() =>
                isMultiSelect
                  ? adjustBatchZOrder('back')
                  : adjustLayerZOrder(isEntity ? 'entity' : 'zone', activeTarget.id, 'back')
              }
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white"
            >
              <ChevronsDown size={13} />
            </button>
            <button
              type="button"
              title="Bring Selected to Front"
              onClick={() =>
                isMultiSelect
                  ? adjustBatchZOrder('front')
                  : adjustLayerZOrder(isEntity ? 'entity' : 'zone', activeTarget.id, 'front')
              }
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white"
            >
              <ChevronsUp size={13} />
            </button>

            <button
              type="button"
              title={
                activeTarget.lockInBuilder
                  ? 'Locked in Editor (Click to Unlock)'
                  : 'Lock Position in Editor'
              }
              onClick={() =>
                updateSelectedFields({
                  lockInBuilder: !activeTarget.lockInBuilder
                })
              }
              className={`p-1.5 rounded-lg ${
                activeTarget.lockInBuilder
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {activeTarget.lockInBuilder ? <Lock size={13} /> : <Unlock size={13} />}
            </button>

            {isEntity && (
              <button
                type="button"
                title="Duplicate Selected"
                onClick={duplicateSelectedItems}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white"
              >
                <Copy size={13} />
              </button>
            )}

            <button
              type="button"
              title="Delete Selected"
              onClick={deleteSelectedItems}
              className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-600 text-rose-400 hover:text-white"
            >
              <Trash2 size={13} />
            </button>
          </div>

          {/* 8. Workspace Dock Mode Switcher */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800 ml-auto">
            <button
              type="button"
              title="Dock Task Bar to Top Ribbon (Photoshop Style)"
              onClick={() => setTaskbarDock('top')}
              className={`p-1.5 rounded-lg ${
                taskbarDock === 'top'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <PanelTop size={13} />
            </button>
            <button
              type="button"
              title="Dock Task Bar to Bottom Tray"
              onClick={() => setTaskbarDock('bottom')}
              className={`p-1.5 rounded-lg ${
                taskbarDock === 'bottom'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <PanelBottom size={13} />
            </button>
            <button
              type="button"
              title="Dock Task Bar to Right Inspector Sidebar"
              onClick={() => setTaskbarDock('right')}
              className={`p-1.5 rounded-lg ${
                taskbarDock === 'right'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <PanelRight size={13} />
            </button>
            <button
              type="button"
              title="Float Task Bar Over Canvas"
              onClick={() => setTaskbarDock('floating')}
              className={`p-1.5 rounded-lg ${
                taskbarDock === 'floating'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Move size={13} />
            </button>
            <button
              type="button"
              title="Clear Selection"
              onClick={() => setSelectedItems([])}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white ml-0.5"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-indigo-500/30 shadow-xl overflow-hidden space-y-4 p-6">
      {/* Top Studio Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              HD Stage Studio • Shift+Click to Multi-Select ({selectedItems.length} Selected)
            </span>
            {builderToast && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase animate-in fade-in">
                {builderToast}
              </span>
            )}
          </div>
          <input
            type="text"
            value={block?.title || ''}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
            placeholder="Canvas Slide Title..."
            className="text-lg font-black bg-transparent text-slate-900 dark:text-white outline-none border-b border-transparent focus:border-indigo-500 mt-0.5"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            onClick={handleAutoAlignRow}
            title="Auto-align and evenly space selected items (or horizontal row)"
            className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <AlignHorizontalSpaceAround size={13} /> Align Row
          </button>

          <button
            type="button"
            onClick={handleAutoAlignColumn}
            title="Auto-align selected items vertically in a column"
            className="px-3 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <AlignVerticalSpaceAround size={13} /> Align Col
          </button>

          <button
            type="button"
            onClick={addBackgroundShape}
            title="Add a resizable background shape to visually group cards and buckets"
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <Square size={12} /> + Group Shape
          </button>

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
            title="Add a Resizable Empty/Text Frame or Fixed Diagram Label"
          >
            <Pin size={12} /> + Empty / Text Box
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
            onClick={() => setShowLayerToolbar((l) => !l)}
            className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border transition-all ${
              showLayerToolbar
                ? 'bg-slate-900 text-amber-400 border-amber-400 shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Layers size={13} /> Layers ({unifiedLayerStack.length})
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

      {/* DOCK POSITION 1: TOP PHOTOSHOP OPTIONS RIBBON */}
      {taskbarDock === 'top' && renderContextualTaskBar(false)}

      {/* VISUAL LAYER & Z-ORDER TOOLBAR PANEL */}
      {showLayerToolbar && (
        <div className="p-4 rounded-3xl bg-slate-900 text-white border border-slate-700 shadow-xl space-y-3 animate-in slide-in-from-top-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Layers size={15} className="text-amber-400" />
              <span className="text-xs font-black uppercase tracking-widest">
                Layer Stack & Background Group Presets (Shift+Click Rows to Multi-Select)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllCards}
                className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
              >
                <CheckSquare size={11} /> Select All Cards
              </button>
              <button
                type="button"
                onClick={() => addMultiColumnGroupPreset(2)}
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
              >
                <Columns size={11} /> + 2-Column Group
              </button>
              <button
                type="button"
                onClick={() => addMultiColumnGroupPreset(3)}
                className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
              >
                <Columns size={11} /> + 3-Column Group
              </button>
              <button
                type="button"
                onClick={() => setShowLayerToolbar(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-52 overflow-y-auto custom-scrollbar pr-1">
            {unifiedLayerStack.map((item) => {
              const isSelected = isItemSelected(item.kind, item.id);
              return (
                <div
                  key={`${item.kind}_${item.id}`}
                  onClick={(e) => selectOrToggleItem(item.kind, item.id, e.shiftKey)}
                  className={`px-3.5 py-2 rounded-2xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-600/30 border-amber-400 text-white ring-1 ring-amber-400/50'
                      : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[9px] font-mono font-black text-amber-300 shrink-0">
                      Z:{item.zOrder}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-black truncate">{item.label}</div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        {item.typeLabel}
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      title="Send to Back"
                      onClick={() => adjustLayerZOrder(item.kind, item.id, 'back')}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white"
                    >
                      <ChevronsDown size={13} />
                    </button>
                    <button
                      type="button"
                      title="Step Backward"
                      onClick={() => adjustLayerZOrder(item.kind, item.id, 'backward')}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white"
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      type="button"
                      title="Step Forward"
                      onClick={() => adjustLayerZOrder(item.kind, item.id, 'forward')}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      title="Bring to Front"
                      onClick={() => adjustLayerZOrder(item.kind, item.id, 'front')}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white"
                    >
                      <ChevronsUp size={13} />
                    </button>
                    <button
                      type="button"
                      title={item.locked ? 'Unlock Layer in Editor' : 'Lock Layer Position in Editor'}
                      onClick={() =>
                        item.kind === 'entity'
                          ? updateEntityField(item.id, { lockInBuilder: !item.locked })
                          : updateZoneField(item.id, { anchored: !item.locked, lockInBuilder: !item.locked })
                      }
                      className={`p-1.5 rounded-lg ${
                        item.locked
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {item.locked ? <Lock size={13} /> : <Unlock size={13} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* Main Workspace Container */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <div
          ref={outerWrapRef}
          style={{ height: `${Math.round(resolution.height * stageScale)}px` }}
          className="relative flex-1 w-full overflow-hidden rounded-3xl border-2 border-slate-300 dark:border-slate-700 bg-slate-950 flex justify-center"
        >
          {/* DOCK POSITION 4: FLOATING / PINNABLE OVER-CANVAS TASK BAR */}
          {taskbarDock === 'floating' && renderContextualTaskBar(true)}

          <div
            ref={stageRef}
            onPointerDown={(e) => {
              if (!e.shiftKey) {
                setSelectedItems([]);
              }
            }}
            onPointerMove={handleStagePointerMove}
            onPointerUp={() => {
              setInteraction(null);
              setIsDraggingTaskbar(false);
            }}
            style={{
              width: `${resolution.width}px`,
              height: `${resolution.height}px`,
              transform: `scale(${stageScale})`,
              transformOrigin: 'top center'
            }}
            className={`relative shrink-0 select-none overflow-hidden ${activeThemeClass}`}
          >
            {/* 1. BACKGROUND GROUP SHAPES ON BUILDER STAGE */}
            {entities
              .filter((e: any) => e.entityType === 'bg_shape')
              .map((shape: any) => {
                const isSelected = isItemSelected('entity', shape.id);
                const palette = COLOR_STYLES[shape.color || 'indigo'] || COLOR_STYLES.indigo;
                const borderStyleClass =
                  BORDER_STYLE_CLASSES[shape.borderStyle || 'solid'] || BORDER_STYLE_CLASSES.solid;
                const radiusClass =
                  SHAPE_RADIUS_CLASSES[shape.shapeVariant || 'rounded'] || SHAPE_RADIUS_CLASSES.rounded;
                const fillAlpha = (shape.opacity ?? 22) / 100;

                return (
                  <div
                    key={shape.id}
                    onPointerDown={(e) => startMoveItem(e, 'entity', shape)}
                    style={{
                      left: `${shape.x}%`,
                      top: `${shape.y}%`,
                      width: `${shape.width || 44}%`,
                      height: `${shape.height || 36}%`,
                      backgroundColor: `${palette.softBg}${fillAlpha})`,
                      transform: `translate(-50%, -50%) rotate(${shape.rotation || 0}deg)`,
                      zIndex: shape.zOrder ?? 2
                    }}
                    className={`group absolute ${radiusClass} ${borderStyleClass} ${palette.border} p-6 flex flex-col items-start justify-start transition-shadow ${
                      shape.lockInBuilder ? 'cursor-default' : 'cursor-move'
                    } ${isSelected ? 'ring-4 ring-amber-400' : ''}`}
                  >
                    {!shape.lockInBuilder && (
                      <button
                        type="button"
                        title="Drag to Move (Shift+Click to Multi-Select)"
                        onPointerDown={(e) => startMoveItem(e, 'entity', shape)}
                        className="absolute -top-3.5 -left-3.5 w-8 h-8 rounded-full bg-slate-900 hover:bg-purple-600 text-white border-2 border-white flex items-center justify-center shadow-lg cursor-move z-30"
                      >
                        <Move size={13} />
                      </button>
                    )}

                    <button
                      type="button"
                      title="Select (or Shift+Click to Multi-Select)"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectOrToggleItem('entity', shape.id, e.shiftKey);
                      }}
                      className={`absolute -top-3.5 -right-3.5 w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg transition-colors z-30 ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 border-white'
                          : 'bg-slate-900 hover:bg-purple-600 text-white border-white'
                      }`}
                    >
                      <MoreHorizontal size={15} />
                    </button>

                    {!shape.lockInBuilder && (
                      <button
                        type="button"
                        title="Pull Diagonally to Resize Group Shape Width & Height"
                        onPointerDown={(e) => startResizeItem(e, 'entity', shape)}
                        className="absolute -bottom-3.5 -right-3.5 w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-white flex items-center justify-center shadow-lg cursor-nwse-resize z-30"
                      >
                        <MoveDiagonal2 size={13} />
                      </button>
                    )}

                    {shape.label && (
                      <span className="text-sm font-black uppercase tracking-widest text-white bg-black/30 px-3.5 py-1 rounded-full">
                        {shape.label}
                      </span>
                    )}
                    {shape.sublabel && (
                      <span className="text-xs font-bold text-white/70 mt-1.5 px-1">
                        {shape.sublabel} ({shape.width || 44}% × {shape.height || 36}%)
                      </span>
                    )}
                  </div>
                );
              })}

            {/* 2. LIVE SVG CONNECTOR-PAIR PREVIEW LINES */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
              {entities
                .filter((e: any) => e.connectTargetId)
                .map((srcEnt: any) => {
                  const targetEnt = entities.find((t: any) => t.id === srcEnt.connectTargetId);
                  if (!targetEnt) return null;
                  return (
                    <g key={`link_${srcEnt.id}_${targetEnt.id}`}>
                      <line
                        x1={`${srcEnt.x}%`}
                        y1={`${srcEnt.y}%`}
                        x2={`${targetEnt.x}%`}
                        y2={`${targetEnt.y}%`}
                        stroke="#22d3ee"
                        strokeWidth="4"
                        strokeDasharray="10,8"
                        opacity="0.85"
                      />
                    </g>
                  );
                })}
            </svg>

            {/* 3. DROP ZONES / BUCKETS ON BUILDER STAGE */}
            {zones.map((z: any) => {
              const isSelected = isItemSelected('zone', z.id);
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
                    zIndex: z.zOrder ?? (isSelected ? 25 : 10)
                  }}
                  className={`group absolute rounded-[2rem] ${zBorderClass} p-5 flex flex-col items-center justify-start cursor-move transition-colors ${
                    isSelected
                      ? 'border-amber-400 bg-amber-500/15 ring-4 ring-amber-400/60'
                      : `${zPalette.border} bg-slate-900/35`
                  }`}
                >
                  {!z.lockInBuilder && (
                    <button
                      type="button"
                      title="Drag to Move Drop Zone (Shift+Click to Multi-Select)"
                      onPointerDown={(e) => startMoveItem(e, 'zone', z)}
                      className="absolute -top-3.5 -left-3.5 w-9 h-9 rounded-full bg-slate-900 hover:bg-indigo-600 text-white border-2 border-slate-600 flex items-center justify-center shadow-lg cursor-move z-30"
                    >
                      <Move size={15} />
                    </button>
                  )}

                  <button
                    type="button"
                    title="Select Zone (Shift+Click to Multi-Select)"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      selectOrToggleItem('zone', z.id, e.shiftKey);
                    }}
                    className={`absolute -top-3.5 -right-3.5 w-9 h-9 rounded-full border-2 flex items-center justify-center shadow-lg transition-colors z-30 ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 border-white'
                        : 'bg-slate-900 hover:bg-indigo-600 text-white border-slate-600'
                    }`}
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  {!z.lockInBuilder && (
                    <button
                      type="button"
                      title="Pull Diagonally to Resize Zone Width & Height"
                      onPointerDown={(e) => startResizeItem(e, 'zone', z)}
                      className="absolute -bottom-3.5 -right-3.5 w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-white flex items-center justify-center shadow-lg cursor-nwse-resize z-30"
                    >
                      <MoveDiagonal2 size={15} />
                    </button>
                  )}

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

            {/* 4. DRAGGABLE & ANCHORED ENTITIES ON BUILDER STAGE */}
            {entities
              .filter((e: any) => e.entityType !== 'bg_shape')
              .map((ent: any) => {
                const isSelected = isItemSelected('entity', ent.id);
                const palette = COLOR_STYLES[ent.color || 'indigo'] || COLOR_STYLES.indigo;
                const borderStyleClass =
                  BORDER_STYLE_CLASSES[ent.borderStyle || 'solid'] || BORDER_STYLE_CLASSES.solid;
                const radiusClass =
                  SHAPE_RADIUS_CLASSES[ent.shapeVariant || 'banner'] || 'rounded-2xl';

                return (
                  <div
                    key={ent.id}
                    onPointerDown={(e) => startMoveItem(e, 'entity', ent)}
                    style={{
                      left: `${ent.x}%`,
                      top: `${ent.y}%`,
                      width: ent.width ? `${ent.width}%` : undefined,
                      height: ent.height ? `${ent.height}%` : undefined,
                      transform: `translate(-50%, -50%) scale(${ent.scale || 1}) rotate(${
                        ent.rotation || 0
                      }deg)`,
                      zIndex: ent.zOrder ?? (isSelected ? 55 : 35)
                    }}
                    className={`group absolute px-7 py-4 ${radiusClass} ${borderStyleClass} shadow-xl cursor-move flex items-center justify-center ${
                      ent.anchored
                        ? 'bg-slate-900 border-amber-400 text-white'
                        : `${palette.bg} ${palette.border}`
                    } ${
                      isSelected
                        ? isMultiSelect
                          ? 'ring-4 ring-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.6)]'
                          : 'ring-4 ring-amber-400'
                        : ''
                    }`}
                  >
                    {!ent.lockInBuilder && (
                      <button
                        type="button"
                        title="Drag in 4 Directions to Move (Moves Entire Selected Group)"
                        onPointerDown={(e) => startMoveItem(e, 'entity', ent)}
                        className="absolute -top-3.5 -left-3.5 w-8 h-8 rounded-full bg-slate-900 hover:bg-indigo-600 text-white border-2 border-white/80 flex items-center justify-center shadow-lg cursor-move z-30"
                      >
                        <Move size={13} />
                      </button>
                    )}

                    <button
                      type="button"
                      title="Click to Select (or Shift+Click to Multi-Select)"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectOrToggleItem('entity', ent.id, e.shiftKey);
                      }}
                      className={`absolute -top-3.5 -right-3.5 w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg transition-colors z-30 ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 border-white'
                          : 'bg-slate-900 hover:bg-indigo-600 text-white border-white/80'
                      }`}
                    >
                      <MoreHorizontal size={15} />
                    </button>

                    {!ent.lockInBuilder && (
                      <button
                        type="button"
                        title="Pull Diagonally to Resize Box"
                        onPointerDown={(e) => startResizeItem(e, 'entity', ent)}
                        className="absolute -bottom-3.5 -right-3.5 w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-white flex items-center justify-center shadow-lg cursor-nwse-resize z-30"
                      >
                        <MoveDiagonal2 size={13} />
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      {ent.anchored && (
                        <span title="Anchored to Stage" className="inline-flex">
                          <Pin size={15} className="text-amber-400 rotate-45" />
                        </span>
                      )}
                      {ent.connectTargetId && (
                        <span title="Linked Connector Node" className="inline-flex">
                          <Link2 size={15} className="text-cyan-200" />
                        </span>
                      )}
                      {ent.returnToAnchor && !ent.anchored && !ent.connectTargetId && (
                        <span title="Magnetic Return to Home Anchor" className="inline-flex">
                          <Magnet size={14} className="text-cyan-200" />
                        </span>
                      )}
                      <div className="text-center">
                        <div className="text-lg font-black">{ent.label || '(Empty Block)'}</div>
                        <div className="text-[11px] font-bold opacity-80">
                          {ent.sublabel}{' '}
                          {ent.width
                            ? `• (${ent.width}% × ${ent.height || 10}%)`
                            : `• ${Math.round((ent.scale || 1) * 100)}%`}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* DOCK POSITION 3: RIGHT-HAND INSPECTOR SIDEBAR */}
        {taskbarDock === 'right' && renderContextualTaskBar(false)}
      </div>

      {/* DOCK POSITION 2: BOTTOM DOCKED CONTEXTUAL BAR */}
      {taskbarDock === 'bottom' && renderContextualTaskBar(false)}
    </div>
  );
};
