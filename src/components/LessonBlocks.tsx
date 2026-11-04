// src/components/LessonBlocks.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  RotateCcw, Check, X, Plus, Trash2,
  Maximize2, Minimize2, Lock, Unlock, Magnet, Grid,
  Code, CheckCircle2, Move, Pin, Monitor,
  MoreHorizontal, MoveDiagonal2, Copy, Link2,
  AlignHorizontalSpaceAround, AlignVerticalSpaceAround,
  Square, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  ChevronsUp, ChevronsDown, Layers, GripVertical,
  PanelTop, PanelBottom, PanelRight,
  CheckSquare, Columns, Keyboard, Tablet,
  Sparkles, Radio, Eye, Database, Zap, GitBranch
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

const BUILTIN_STATE_KEYS = [
  { id: 'normal', label: 'Normal (Base)', desc: 'Default appearance on slide load' },
  { id: 'hover', label: 'Hover', desc: 'Shown when pointer hovers over box' },
  { id: 'selected', label: 'Selected', desc: 'Toggled on click or Button Set choice' },
  { id: 'visited', label: 'Visited', desc: 'Remembers object was clicked at least once' },
  { id: 'disabled', label: 'Disabled', desc: 'Locked & non-interactive until enabled' }
];

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
//  TYPES FOR VARIABLES & CONDITIONAL TRIGGERS
// ============================================================================
export interface CanvasVariable {
  id: string;
  name: string;
  type: 'text' | 'number' | 'boolean';
  defaultValue: string | number | boolean;
}

export interface ConditionalTriggerRule {
  id: string;
  event: 'on_click' | 'on_drop' | 'on_variable_change' | 'on_timeline_reach';
  entityId?: string;
  zoneId?: string;
  watchVariable?: string;
  timelineThreshold?: number;
  // IF Condition
  conditionType?: 'none' | 'variable' | 'state';
  conditionVariable?: string;
  conditionOperator?: '==' | '!=' | '>=' | '<=' | '>' | '<';
  conditionValue?: string;
  conditionEntityId?: string;
  conditionStateIs?: string;
  // THEN Action
  action: 'adjust_variable' | 'change_state' | 'show_layer' | 'show_toast' | 'complete_block';
  targetVariable?: string;
  variableOp?: 'set' | 'add' | 'subtract' | 'toggle';
  variableAmount?: string | number;
  targetEntityId?: string;
  targetState?: string;
  targetLayerId?: string;
  message?: string;
  // ELSE Action (Optional)
  elseAction?: 'none' | 'adjust_variable' | 'change_state' | 'show_layer' | 'show_toast';
  elseTargetVariable?: string;
  elseVariableOp?: 'set' | 'add' | 'subtract' | 'toggle';
  elseVariableAmount?: string | number;
  elseTargetEntityId?: string;
  elseTargetState?: string;
  elseTargetLayerId?: string;
  elseMessage?: string;
}

// ============================================================================
//  TABLET / TOUCH ENVIRONMENT DETECTOR HOOK
// ============================================================================
function useTabletTouchDetector() {
  const [isAutoTouchTablet, setIsAutoTouchTablet] = useState<boolean>(false);

  useEffect(() => {
    const checkDevice = () => {
      const hasCoarsePointer =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(pointer: coarse)').matches;
      const hasTouchPoints =
        typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const isIPadOrTabletUA =
        /iPad|Android|Tablet|PlayBook|Silk/i.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isTabletWidth =
        typeof window !== 'undefined' &&
        window.innerWidth >= 600 &&
        window.innerWidth <= 1366;

      setIsAutoTouchTablet(
        Boolean(
          isIPadOrTabletUA ||
            (hasCoarsePointer && isTabletWidth) ||
            (hasTouchPoints && hasCoarsePointer)
        )
      );
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return isAutoTouchTablet;
}

// Helper: Resolve an entity's effective visual properties for a given active state
function resolveEntityVisualState(ent: any, stateName: string) {
  if (!stateName || stateName === 'normal' || !ent?.states?.[stateName]) {
    return ent;
  }
  const st = ent.states[stateName] || {};
  return {
    ...ent,
    label: st.label !== undefined && st.label !== '' ? st.label : ent.label,
    sublabel: st.sublabel !== undefined && st.sublabel !== '' ? st.sublabel : ent.sublabel,
    color: st.color || ent.color,
    borderStyle: st.borderStyle || ent.borderStyle,
    scale: st.scale !== undefined ? st.scale : ent.scale
  };
}

// Helper: Interpolate `%VariableName%` tokens in any string with live runtime values
export function interpolateVariables(
  rawText: string | undefined | null,
  varMap: Record<string, any>
): string {
  if (!rawText) return '';
  return String(rawText).replace(/%([a-zA-Z0-9_]+)%/g, (fullMatch, varName) => {
    if (varMap && varMap[varName] !== undefined) {
      return String(varMap[varName]);
    }
    const lowerKey = Object.keys(varMap || {}).find(
      (k) => k.toLowerCase() === String(varName).toLowerCase()
    );
    if (lowerKey !== undefined) {
      return String(varMap[lowerKey]);
    }
    return fullMatch;
  });
}

// ============================================================================
//  1. STUDENT & SMARTBOARD PLAYER: KINETIC CANVAS BLOCK
//  Features:
//   - Live `%Variable%` Text Replacement Engine
//   - Conditional Trigger Evaluator (`WHEN / IF / THEN / ELSE`)
//   - Object States (`Normal`, `Hover`, `Selected`, `Visited`, `Disabled`) & Button Sets
// ============================================================================
export const KineticCanvasBlock = ({ block, onComplete }: any) => {
  const outerWrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const resKey = block?.canvasResolution || 'fhd_1080';
  const resolution = CANVAS_RESOLUTIONS[resKey] || CANVAS_RESOLUTIONS.fhd_1080;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stageScale, setStageScale] = useState(0.55);

  // Build Initial Variable Map (User-defined + Built-in System Variables)
  const initialVariableMap = useMemo(() => {
    const map: Record<string, any> = {
      Score: 0,
      MistakeCount: 0,
      CorrectCount: 0,
      VisitedCount: 0,
      LearnerName: 'Discipulus'
    };
    const definedVars: CanvasVariable[] = Array.isArray(block?.variables) ? block.variables : [];
    definedVars.forEach((v) => {
      if (!v?.name) return;
      if (v.type === 'number') map[v.name] = Number(v.defaultValue ?? 0);
      else if (v.type === 'boolean')
        map[v.name] = v.defaultValue === true || String(v.defaultValue).toLowerCase() === 'true';
      else map[v.name] = String(v.defaultValue ?? '');
    });
    return map;
  }, [block?.variables]);

  const [runtimeVars, setRuntimeVars] = useState<Record<string, any>>(initialVariableMap);

  const initialEntities = useMemo(() => {
    return (Array.isArray(block?.entities) ? block.entities : []).map((e: any) => ({
      ...e,
      anchorX: e.anchorX ?? e.x ?? 50,
      anchorY: e.anchorY ?? e.y ?? 50,
      currentState: e.initialState || 'normal',
      isVisited: e.initialState === 'visited',
      isSelected: e.initialState === 'selected',
      placedZoneId: null,
      validationStatus: 'neutral' as 'neutral' | 'correct' | 'incorrect',
      sliderValue: e.sliderMin ?? 0,
      textValue: ''
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
  const [hoveredEntityId, setHoveredEntityId] = useState<string | null>(null);
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
    setRuntimeVars(initialVariableMap);
    setConnections([]);
    setTimelineProgress(0);
    setActiveLayer(null);
  }, [initialEntities, initialVariableMap]);

  // Keep Built-In System Variables (`CorrectCount` & `VisitedCount`) synced automatically
  useEffect(() => {
    const correctCount = entities.filter((e) => e.validationStatus === 'correct').length;
    const visitedCount = entities.filter((e) => e.isVisited || e.currentState === 'visited').length;
    setRuntimeVars((prev) => {
      if (prev.CorrectCount === correctCount && prev.VisitedCount === visitedCount) return prev;
      return {
        ...prev,
        CorrectCount: correctCount,
        VisitedCount: visitedCount
      };
    });
  }, [entities]);

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

  // ============================================================================
  //  🔥 CONDITIONAL TRIGGER EVALUATOR (`WHEN / IF / THEN / ELSE`)
  // ============================================================================
  const evaluateRuleCondition = useCallback(
    (rule: ConditionalTriggerRule, currentVars: Record<string, any>, currentEnts: any[]) => {
      if (!rule.conditionType || rule.conditionType === 'none') return true;

      if (rule.conditionType === 'variable' && rule.conditionVariable) {
        const actualVal = currentVars[rule.conditionVariable];
        const expectedRaw = rule.conditionValue ?? '';
        const op = rule.conditionOperator || '==';

        const numActual = Number(actualVal);
        const numExpected = Number(expectedRaw);
        const bothNumeric =
          !Number.isNaN(numActual) && !Number.isNaN(numExpected) && String(expectedRaw).trim() !== '';

        if (bothNumeric) {
          if (op === '==') return numActual === numExpected;
          if (op === '!=') return numActual !== numExpected;
          if (op === '>=') return numActual >= numExpected;
          if (op === '<=') return numActual <= numExpected;
          if (op === '>') return numActual > numExpected;
          if (op === '<') return numActual < numExpected;
        }

        const strActual = String(actualVal ?? '').trim().toLowerCase();
        const strExpected = String(expectedRaw).trim().toLowerCase();
        if (op === '!=') return strActual !== strExpected;
        return strActual === strExpected;
      }

      if (rule.conditionType === 'state' && rule.conditionEntityId) {
        const targetEnt = currentEnts.find((e) => e.id === rule.conditionEntityId);
        if (!targetEnt) return false;
        const desiredState = rule.conditionStateIs || 'visited';
        if (desiredState === 'visited') return Boolean(targetEnt.isVisited || targetEnt.currentState === 'visited');
        if (desiredState === 'selected') return Boolean(targetEnt.isSelected || targetEnt.currentState === 'selected');
        return (targetEnt.currentState || 'normal') === desiredState;
      }

      return true;
    },
    []
  );

  const executeTriggerAction = useCallback(
    (
      actionType: string | undefined,
      params: {
        targetVariable?: string;
        variableOp?: string;
        variableAmount?: any;
        targetEntityId?: string;
        targetState?: string;
        targetLayerId?: string;
        message?: string;
      },
      currentVars: Record<string, any>
    ) => {
      if (!actionType || actionType === 'none') return currentVars;
      let updatedVars = { ...currentVars };

      if (actionType === 'adjust_variable' && params.targetVariable) {
        const varName = params.targetVariable;
        const op = params.variableOp || 'set';
        const prevVal = updatedVars[varName];
        const rawAmt = params.variableAmount;

        if (op === 'toggle') {
          updatedVars[varName] = !prevVal;
        } else if (op === 'add') {
          updatedVars[varName] = Number(prevVal || 0) + Number(rawAmt || 1);
        } else if (op === 'subtract') {
          updatedVars[varName] = Number(prevVal || 0) - Number(rawAmt || 1);
        } else {
          // 'set'
          if (typeof prevVal === 'number') {
            updatedVars[varName] = Number(rawAmt ?? 0);
          } else if (typeof prevVal === 'boolean') {
            updatedVars[varName] = String(rawAmt).toLowerCase() === 'true';
          } else {
            updatedVars[varName] = String(rawAmt ?? '');
          }
        }
        setRuntimeVars(updatedVars);
      }

      if (actionType === 'change_state' && params.targetEntityId && params.targetState) {
        setEntities((prev) =>
          prev.map((item) =>
            item.id === params.targetEntityId
              ? {
                  ...item,
                  currentState: params.targetState,
                  isVisited: params.targetState === 'visited' ? true : item.isVisited,
                  isSelected: params.targetState === 'selected'
                }
              : item
          )
        );
      }

      if (actionType === 'show_layer' && params.targetLayerId) {
        const foundLayer = layers.find((l: any) => l.id === params.targetLayerId);
        if (foundLayer) setActiveLayer(foundLayer);
      }

      if (actionType === 'show_toast' && params.message) {
        setStatusBanner(interpolateVariables(params.message, updatedVars));
      }

      if (actionType === 'complete_block' && onComplete) {
        onComplete();
      }

      if (params.message && actionType !== 'show_toast') {
        setStatusBanner(interpolateVariables(params.message, updatedVars));
      }

      return updatedVars;
    },
    [layers, onComplete]
  );

  const runMatchingRules = useCallback(
    (
      eventType: 'on_click' | 'on_drop' | 'on_variable_change' | 'on_timeline_reach',
      context: { entityId?: string; zoneId?: string; variableName?: string; progress?: number },
      latestVars: Record<string, any>,
      latestEnts: any[]
    ) => {
      let workingVars = { ...latestVars };

      rules.forEach((rule: ConditionalTriggerRule) => {
        const rEvent = rule.event || (rule.zoneId ? 'on_drop' : 'on_click');
        if (rEvent !== eventType) return;

        if (eventType === 'on_click' && rule.entityId && rule.entityId !== context.entityId) return;
        if (eventType === 'on_drop') {
          if (rule.entityId && rule.entityId !== context.entityId) return;
          if (rule.zoneId && rule.zoneId !== context.zoneId) return;
        }
        if (
          eventType === 'on_variable_change' &&
          rule.watchVariable &&
          rule.watchVariable !== context.variableName
        ) {
          return;
        }

        const conditionPassed = evaluateRuleCondition(rule, workingVars, latestEnts);
        if (conditionPassed) {
          workingVars = executeTriggerAction(
            rule.action || (rule.targetLayerId ? 'show_layer' : 'show_toast'),
            {
              targetVariable: rule.targetVariable,
              variableOp: rule.variableOp,
              variableAmount: rule.variableAmount,
              targetEntityId: rule.targetEntityId,
              targetState: rule.targetState,
              targetLayerId: rule.targetLayerId,
              message: rule.message
            },
            workingVars
          );
        } else if (rule.elseAction && rule.elseAction !== 'none') {
          workingVars = executeTriggerAction(
            rule.elseAction,
            {
              targetVariable: rule.elseTargetVariable,
              variableOp: rule.elseVariableOp,
              variableAmount: rule.elseVariableAmount,
              targetEntityId: rule.elseTargetEntityId,
              targetState: rule.elseTargetState,
              targetLayerId: rule.elseTargetLayerId,
              message: rule.elseMessage
            },
            workingVars
          );
        }
      });
    },
    [rules, evaluateRuleCondition, executeTriggerAction]
  );

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
    setRuntimeVars(initialVariableMap);
    setConnections([]);
    setTimelineProgress(0);
    setActiveLayer(null);
    setStatusBanner('Canvas reset to initial states, variables, and anchored positions.');
    setTimeout(() => setStatusBanner(null), 2500);
  };

  // ============================================================================
  //  STORYLINE OBJECT STATE & BUTTON SET TRANSITION ENGINE
  // ============================================================================
  const applyEntityClickStateTransition = (clickedEnt: any) => {
    const hasStates =
      clickedEnt.states && Object.keys(clickedEnt.states).length > 0;
    const buttonSetName = (clickedEnt.buttonSet || '').trim();
    const isMultiSelectType = clickedEnt.entityType === 'multi_select';

    let nextEntsSnapshot = entities;

    if (hasStates || buttonSetName || isMultiSelectType || clickedEnt.requireVisited) {
      nextEntsSnapshot = entities.map((item) => {
        if (
          buttonSetName &&
          item.id !== clickedEnt.id &&
          (item.buttonSet || '').trim() === buttonSetName
        ) {
          const fallbackState =
            item.isVisited && item.states?.visited ? 'visited' : 'normal';
          return {
            ...item,
            isSelected: false,
            currentState: fallbackState
          };
        }

        if (item.id !== clickedEnt.id) return item;

        const nextVisited = true;
        let nextSelected = item.isSelected;
        let nextState = item.currentState || 'normal';

        if (buttonSetName) {
          nextSelected = true;
          nextState = item.states?.selected
            ? 'selected'
            : item.states?.visited
            ? 'visited'
            : 'selected';
        } else if (isMultiSelectType || item.states?.selected) {
          nextSelected = !item.isSelected;
          nextState = nextSelected
            ? 'selected'
            : item.states?.visited
            ? 'visited'
            : 'normal';
        } else if (item.states?.visited || item.requireVisited) {
          nextState = 'visited';
        }

        if (item.triggerEvent === 'on_click' && item.triggerTargetState) {
          nextState = item.triggerTargetState;
        }

        return {
          ...item,
          isVisited: nextVisited,
          isSelected: nextSelected,
          currentState: nextState
        };
      });
      setEntities(nextEntsSnapshot);
    }

    return nextEntsSnapshot;
  };

  const handlePointerDownEntity = (e: React.PointerEvent, ent: any) => {
    if (ent.entityType === 'bg_shape' || ent.currentState === 'disabled') return;
    e.stopPropagation();

    if (ent.entityType === 'connector_node' || ent.connectTargetId) {
      if (!activeConnectorSourceId) {
        setActiveConnectorSourceId(ent.id);
        setStatusBanner(
          `Selected "${interpolateVariables(ent.label, runtimeVars)}" — now tap its matching target box!`
        );
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

    const updatedEnts = applyEntityClickStateTransition(ent);

    // Inline entity click trigger
    if (ent.triggerEvent === 'on_click' && ent.triggerAction) {
      executeTriggerAction(
        ent.triggerAction,
        {
          targetVariable: ent.triggerTargetVariable,
          variableOp: ent.triggerVariableOp,
          variableAmount: ent.triggerVariableAmount,
          targetEntityId: ent.triggerTargetEntityId,
          targetState: ent.triggerTargetState,
          targetLayerId: ent.triggerLayerId,
          message: ent.triggerMessage
        },
        runtimeVars
      );
    }

    // Evaluate Conditional Trigger Wizard rules for `on_click`
    runMatchingRules('on_click', { entityId: ent.id }, runtimeVars, updatedEnts);

    if (
      ent.anchored ||
      ent.draggable === false ||
      ent.entityType === 'static_anchor' ||
      ent.entityType === 'multi_select'
    ) {
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
        setStatusBanner(`"${interpolateVariables(hitZone.label, runtimeVars)}" is at full capacity (${maxCap}/${maxCap}).`);
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
        const nextMistakes = Number(runtimeVars.MistakeCount || 0) + 1;
        const nextVars = { ...runtimeVars, MistakeCount: nextMistakes };
        setRuntimeVars(nextVars);

        setEntities((prev) =>
          prev.map((e) =>
            e.id === dragged.id ? { ...e, x: snapX, y: snapY, validationStatus: 'incorrect' } : e
          )
        );
        setStatusBanner(
          `Not quite! "${interpolateVariables(dragged.label, nextVars)}" does not belong in "${interpolateVariables(hitZone.label, nextVars)}".`
        );
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

      const nextScore = isMatch
        ? Number(runtimeVars.Score || 0) + 10
        : Number(runtimeVars.Score || 0);
      const nextVars = {
        ...runtimeVars,
        Score: nextScore,
        ...(isMatch ? {} : { MistakeCount: Number(runtimeVars.MistakeCount || 0) + 1 })
      };
      setRuntimeVars(nextVars);

      const nextEnts = entities.map((e) =>
        e.id === dragged.id
          ? {
              ...e,
              x: snapX,
              y: snapY,
              placedZoneId: hitZone.id,
              isVisited: true,
              currentState: e.states?.visited ? 'visited' : e.currentState,
              validationStatus: (isMatch ? 'correct' : 'incorrect') as 'correct' | 'incorrect'
            }
          : e
      );
      setEntities(nextEnts);

      if (isMatch && dragged.triggerMessage) {
        setStatusBanner(interpolateVariables(dragged.triggerMessage, nextVars));
      }
      if (isMatch && dragged.triggerAction === 'complete_block' && onComplete) {
        onComplete();
      }

      // Run Conditional Trigger Wizard rules for `on_drop`
      runMatchingRules('on_drop', { entityId: dragged.id, zoneId: hitZone.id }, nextVars, nextEnts);
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

    const requiredVisitedEntities = entities.filter((e) => e.requireVisited);
    const allVisitedMet =
      requiredVisitedEntities.length === 0 ||
      requiredVisitedEntities.every((e) => e.isVisited || e.currentState === 'visited');

    const selectableEntities = entities.filter(
      (e) => e.entityType === 'multi_select' || e.isCorrectSelect !== undefined
    );
    const allSelectionsRight =
      selectableEntities.length === 0 ||
      selectableEntities.every((e) => Boolean(e.isSelected) === Boolean(e.isCorrectSelect));

    if (allDraggablesRight && allConnectorsRight && allVisitedMet && allSelectionsRight) {
      setStatusBanner('All canvas states, variables, button sets & objectives verified!');
      if (layers.length > 0 && !activeLayer) {
        setActiveLayer(layers[0]);
      } else if (onComplete) {
        onComplete();
      }
    } else if (!allVisitedMet) {
      const remaining = requiredVisitedEntities.filter(
        (e) => !e.isVisited && e.currentState !== 'visited'
      ).length;
      setStatusBanner(`Explore all interactive cards first (${remaining} remaining to visit)!`);
    } else if (!allSelectionsRight) {
      setStatusBanner('Check your selected options — one or more choices need adjustment.');
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
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase tracking-widest">
                Kinetic Canvas HD • {resolution.badge}
              </span>
              {Array.isArray(block?.variables) && block.variables.length > 0 && (
                <div className="flex items-center gap-1.5">
                  {block.variables.slice(0, 4).map((v: CanvasVariable) => (
                    <span
                      key={v.id || v.name}
                      className="px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700 text-[10px] font-mono font-black"
                    >
                      {v.name}: {String(runtimeVars[v.name] ?? v.defaultValue)}
                    </span>
                  ))}
                </div>
              )}
              {statusBanner && (
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider animate-in fade-in">
                  {statusBanner}
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white mt-1">
              {interpolateVariables(block?.title || 'Interactive Kinetic Lab', runtimeVars)}
            </h3>
            {block?.subtitle && (
              <p className="text-xs font-bold text-slate-400 mt-0.5">
                {interpolateVariables(block.subtitle, runtimeVars)}
              </p>
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
          className="relative w-full overflow-hidden bg-slate-950 flex justify-center touch-none"
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
            className={`relative shrink-0 select-none overflow-hidden touch-none ${activeThemeClass}`}
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
                        {interpolateVariables(shape.label, runtimeVars)}
                      </span>
                    )}
                    {shape.sublabel && (
                      <span className="text-xs font-bold text-white/60 mt-1.5 px-1">
                        {interpolateVariables(shape.sublabel, runtimeVars)}
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
                      {interpolateVariables(z.label, runtimeVars)}
                    </span>
                  </div>
                  {z.sublabel && (
                    <span className="text-xs font-bold opacity-70 mt-1 text-center">
                      {interpolateVariables(z.sublabel, runtimeVars)} ({occupants.length}/{z.capacity || 1})
                    </span>
                  )}
                </div>
              );
            })}

            {/* 4. INTERACTIVE & ANCHORED ENTITIES (WITH ACTIVE STATE & %VARIABLE% INTERPOLATION) */}
            {entities
              .filter((e: any) => e.entityType !== 'bg_shape')
              .map((rawEnt: any) => {
                if (rawEnt.currentState === 'hidden') return null;

                const isHovered = hoveredEntityId === rawEnt.id && rawEnt.states?.hover;
                const activeStateName = isHovered
                  ? 'hover'
                  : rawEnt.isSelected && rawEnt.states?.selected
                  ? 'selected'
                  : rawEnt.currentState || 'normal';

                const ent = resolveEntityVisualState(rawEnt, activeStateName);
                const isDisabled = rawEnt.currentState === 'disabled';

                const palette = COLOR_STYLES[ent.color || 'indigo'] || COLOR_STYLES.indigo;
                const borderStyleClass =
                  BORDER_STYLE_CLASSES[ent.borderStyle || 'solid'] || BORDER_STYLE_CLASSES.solid;
                const radiusClass =
                  SHAPE_RADIUS_CLASSES[ent.shapeVariant || 'banner'] || 'rounded-2xl';
                const isDragging = draggingId === rawEnt.id;
                const isAnchored = Boolean(rawEnt.anchored || rawEnt.entityType === 'static_anchor');
                const isConnector = Boolean(
                  rawEnt.entityType === 'connector_node' || rawEnt.connectTargetId
                );

                let ringStyle = '';
                if (rawEnt.validationStatus === 'correct') {
                  ringStyle = 'ring-4 ring-emerald-400 !bg-emerald-600 !border-emerald-300';
                } else if (rawEnt.validationStatus === 'incorrect') {
                  ringStyle = 'ring-4 ring-rose-500 !bg-rose-600 !border-rose-300';
                } else if (activeConnectorSourceId === rawEnt.id || rawEnt.isSelected) {
                  ringStyle = 'ring-4 ring-amber-400 scale-105 shadow-[0_0_30px_rgba(251,191,36,0.45)]';
                }

                if (rawEnt.entityType === 'slider') {
                  const isAtTarget =
                    Math.abs(Number(rawEnt.sliderValue) - Number(rawEnt.sliderTarget)) <=
                    Number(rawEnt.sliderTolerance || 0);
                  return (
                    <div
                      key={rawEnt.id}
                      style={{
                        left: `${rawEnt.x}%`,
                        top: `${rawEnt.y}%`,
                        transform: `translate(-50%, -50%) scale(${ent.scale || 1})`,
                        zIndex: rawEnt.zOrder ?? 25
                      }}
                      className={`absolute p-5 rounded-3xl bg-slate-900/95 border-2 ${
                        isAtTarget ? 'border-emerald-400' : 'border-slate-700'
                      } text-white shadow-2xl min-w-[300px]`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-black">
                          {interpolateVariables(ent.label, runtimeVars)}
                        </span>
                        <span className="font-mono text-base font-black text-amber-400">
                          {rawEnt.sliderValue}
                          {rawEnt.sliderUnit || ''}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={rawEnt.sliderMin ?? 0}
                        max={rawEnt.sliderMax ?? 100}
                        step={rawEnt.sliderStep ?? 1}
                        value={rawEnt.sliderValue}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const boundVarName = rawEnt.bindVariable || rawEnt.variableName;
                          const nextVars = boundVarName
                            ? { ...runtimeVars, [boundVarName]: val }
                            : runtimeVars;
                          if (boundVarName) setRuntimeVars(nextVars);

                          const nextEnts = entities.map((item) =>
                            item.id === rawEnt.id
                              ? {
                                  ...item,
                                  sliderValue: val,
                                  validationStatus: (Math.abs(val - Number(rawEnt.sliderTarget)) <=
                                  Number(rawEnt.sliderTolerance || 0)
                                    ? 'correct'
                                    : 'neutral') as 'correct' | 'neutral'
                                }
                              : item
                          );
                          setEntities(nextEnts);
                          if (boundVarName) {
                            runMatchingRules(
                              'on_variable_change',
                              { variableName: boundVarName },
                              nextVars,
                              nextEnts
                            );
                          }
                        }}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                    </div>
                  );
                }

                if (rawEnt.entityType === 'text_input') {
                  return (
                    <div
                      key={rawEnt.id}
                      style={{
                        left: `${rawEnt.x}%`,
                        top: `${rawEnt.y}%`,
                        transform: `translate(-50%, -50%) scale(${ent.scale || 1})`,
                        zIndex: rawEnt.zOrder ?? 25
                      }}
                      className={`absolute p-5 rounded-3xl bg-slate-900/95 border-2 ${
                        rawEnt.validationStatus === 'correct' ? 'border-emerald-400' : 'border-slate-700'
                      } text-white shadow-2xl min-w-[320px]`}
                    >
                      <label className="text-xs font-black uppercase tracking-wider text-indigo-300 block mb-2">
                        {interpolateVariables(ent.label, runtimeVars)}
                      </label>
                      <input
                        type="text"
                        value={rawEnt.textValue || ''}
                        placeholder={rawEnt.placeholder || 'Type answer...'}
                        onChange={(e) => {
                          const val = e.target.value;
                          const boundVarName = rawEnt.bindVariable || rawEnt.variableName;
                          const nextVars = boundVarName
                            ? { ...runtimeVars, [boundVarName]: val }
                            : runtimeVars;
                          if (boundVarName) setRuntimeVars(nextVars);

                          const accepted = String(rawEnt.expectedText || '')
                            .split(',')
                            .map((s) => s.trim().toLowerCase())
                            .filter(Boolean);
                          const matches = accepted.includes(val.trim().toLowerCase());
                          const nextEnts = entities.map((item) =>
                            item.id === rawEnt.id
                              ? {
                                  ...item,
                                  textValue: val,
                                  validationStatus: (matches ? 'correct' : 'neutral') as
                                    | 'correct'
                                    | 'neutral'
                                }
                              : item
                          );
                          setEntities(nextEnts);
                          if (boundVarName) {
                            runMatchingRules(
                              'on_variable_change',
                              { variableName: boundVarName },
                              nextVars,
                              nextEnts
                            );
                          }
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                  );
                }

                const hasInteractiveStates =
                  Boolean(rawEnt.buttonSet) ||
                  Boolean(rawEnt.requireVisited) ||
                  Boolean(rawEnt.states && Object.keys(rawEnt.states).length > 0);

                return (
                  <div
                    key={rawEnt.id}
                    onPointerEnter={() => setHoveredEntityId(rawEnt.id)}
                    onPointerLeave={() =>
                      setHoveredEntityId((prev) => (prev === rawEnt.id ? null : prev))
                    }
                    onPointerDown={(e) => handlePointerDownEntity(e, rawEnt)}
                    style={{
                      left: `${rawEnt.x}%`,
                      top: `${rawEnt.y}%`,
                      width: rawEnt.width ? `${rawEnt.width}%` : undefined,
                      height: rawEnt.height ? `${rawEnt.height}%` : undefined,
                      transform: `translate(-50%, -50%) scale(${
                        (ent.scale || 1) * (isDragging ? 1.08 : 1)
                      }) rotate(${rawEnt.rotation || 0}deg)`,
                      zIndex: isDragging ? 75 : rawEnt.zOrder ?? (isAnchored ? 15 : 30)
                    }}
                    className={`absolute px-6 py-3.5 ${radiusClass} ${borderStyleClass} shadow-xl transition-all duration-200 select-none touch-none flex items-center justify-center ${
                      isDisabled
                        ? 'opacity-40 grayscale cursor-not-allowed bg-slate-800 border-slate-700 text-slate-400'
                        : isAnchored && !hasInteractiveStates
                        ? 'bg-slate-900/90 border-slate-600/80 text-white cursor-default shadow-md'
                        : isConnector || hasInteractiveStates
                        ? `${palette.bg} ${palette.border} cursor-pointer hover:shadow-2xl`
                        : `${palette.bg} ${palette.border} cursor-grab active:cursor-grabbing hover:shadow-2xl`
                    } ${ringStyle}`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isAnchored && ent.label && !hasInteractiveStates && (
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
                          <div className="text-lg font-black leading-tight">
                            {interpolateVariables(ent.label, runtimeVars)}
                          </div>
                        )}
                        {ent.sublabel && (
                          <div
                            className={`text-xs font-bold mt-0.5 ${
                              isAnchored && !hasInteractiveStates ? 'text-slate-400' : palette.sub
                            }`}
                          >
                            {interpolateVariables(ent.sublabel, runtimeVars)}
                          </div>
                        )}
                      </div>
                      {(rawEnt.validationStatus === 'correct' ||
                        (rawEnt.requireVisited && rawEnt.isVisited)) && (
                        <Check size={18} className="text-emerald-300 shrink-0 ml-1" strokeWidth={3} />
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
                <span className="text-xs font-black text-amber-400">
                  {interpolateVariables(activeKeyframeInfo.title, runtimeVars)}
                </span>
              )}
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={timelineProgress}
              onChange={(e) => {
                const nextVal = Number(e.target.value);
                setTimelineProgress(nextVal);
                runMatchingRules('on_timeline_reach', { progress: nextVal }, runtimeVars, entities);
              }}
              className="w-full accent-indigo-500 cursor-pointer h-2.5 bg-slate-800 rounded-lg"
            />
            {activeKeyframeInfo?.description && (
              <p className="text-xs font-medium text-slate-300 leading-relaxed">
                {interpolateVariables(activeKeyframeInfo.description, runtimeVars)}
              </p>
            )}
          </div>
        )}

        {/* Slide Layer Modal Overlay */}
        {activeLayer && (
          <div className="fixed inset-0 z-[9995] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-[2.5rem] max-w-lg w-full p-8 text-white shadow-2xl space-y-5 animate-in zoom-in-95">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest">
                {interpolateVariables(activeLayer.name || 'Verification Layer', runtimeVars)}
              </span>
              <h4 className="text-2xl font-black">
                {interpolateVariables(activeLayer.title, runtimeVars)}
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                {interpolateVariables(activeLayer.body, runtimeVars)}
              </p>

              {activeLayer.hasQuiz && Array.isArray(activeLayer.quizOptions) && (
                <div className="space-y-2.5 pt-2">
                  <p className="text-xs font-black uppercase tracking-wider text-indigo-300">
                    {interpolateVariables(activeLayer.quizQuestion, runtimeVars)}
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
                      {interpolateVariables(opt.text, runtimeVars)}
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
//  Now with:
//   - Variables Manager (`%Variable%` Dynamic Interpolation)
//   - Conditional Trigger Wizard (`WHEN / IF / THEN / ELSE` Rules)
//   - Storyline Object States Tray + Button Sets + Tablet Touch Studio
// ============================================================================
export const KineticCanvasBuilder = ({ block, onChange }: any) => {
  const builderRootRef = useRef<HTMLDivElement>(null);
  const outerWrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const isAutoTouchTablet = useTabletTouchDetector();
  const [tabletModeOverride, setTabletModeOverride] = useState<boolean | null>(null);
  const isTabletMode =
    tabletModeOverride !== null ? tabletModeOverride : isAutoTouchTablet;

  const [touchMultiSelectActive, setTouchMultiSelectActive] = useState<boolean>(false);
  const [touchNudgeStep, setTouchNudgeStep] = useState<number>(1);

  const resKey = block?.canvasResolution || 'fhd_1080';
  const resolution = CANVAS_RESOLUTIONS[resKey] || CANVAS_RESOLUTIONS.fhd_1080;

  const [stageScale, setStageScale] = useState(0.5);
  const [gridSnap, setGridSnap] = useState<number>(1);

  // MULTI-SELECTION STATE
  const [selectedItems, setSelectedItems] = useState<
    Array<{ kind: 'entity' | 'zone'; id: string }>
  >([]);

  // STORYLINE OBJECT STATES TRAY STATE
  const [showStatesTray, setShowStatesTray] = useState<boolean>(false);
  const [activeEditingState, setActiveEditingState] = useState<string>('normal');
  const [customStateInput, setCustomStateInput] = useState<string>('');

  // 🔥 VARIABLES MANAGER & CONDITIONAL TRIGGER WIZARD DRAWERS
  const [showVariablesPanel, setShowVariablesPanel] = useState<boolean>(false);
  const [showTriggerWizard, setShowTriggerWizard] = useState<boolean>(false);
  const [newVarName, setNewVarName] = useState<string>('');
  const [newVarType, setNewVarType] = useState<'text' | 'number' | 'boolean'>('number');
  const [newVarDefault, setNewVarDefault] = useState<string>('0');

  const primarySelected = selectedItems[0] || null;
  const isItemSelected = useCallback(
    (kind: 'entity' | 'zone', id: string) =>
      selectedItems.some((s) => s.kind === kind && s.id === id),
    [selectedItems]
  );

  useEffect(() => {
    setActiveEditingState('normal');
  }, [primarySelected?.id]);

  const selectOrToggleItem = (
    kind: 'entity' | 'zone',
    id: string,
    isShiftHeld: boolean
  ) => {
    const shouldMultiToggle = isShiftHeld || touchMultiSelectActive;
    if (shouldMultiToggle) {
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

  const entities = useMemo(
    () => (Array.isArray(block?.entities) ? block.entities : []),
    [block?.entities]
  );
  const zones = useMemo(
    () => (Array.isArray(block?.zones) ? block.zones : []),
    [block?.zones]
  );
  const variables: CanvasVariable[] = useMemo(
    () => (Array.isArray(block?.variables) ? block.variables : []),
    [block?.variables]
  );
  const rules: ConditionalTriggerRule[] = useMemo(
    () => (Array.isArray(block?.rules) ? block.rules : []),
    [block?.rules]
  );
  const layers = useMemo(
    () => (Array.isArray(block?.layers) ? block.layers : []),
    [block?.layers]
  );

  const allVariableNames = useMemo(() => {
    const names = new Set<string>([
      'Score',
      'MistakeCount',
      'CorrectCount',
      'VisitedCount',
      'LearnerName'
    ]);
    variables.forEach((v) => {
      if (v?.name) names.add(v.name);
    });
    return Array.from(names);
  }, [variables]);

  const notifyBuilder = useCallback((msg: string) => {
    setBuilderToast(msg);
    setTimeout(() => setBuilderToast(null), 2400);
  }, []);

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
  }, [
    resolution.width,
    showLayerToolbar,
    showStatesTray,
    showVariablesPanel,
    showTriggerWizard,
    taskbarDock
  ]);

  const snapCoord = (val: number, minVal = 3, maxVal = 97) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    if (!gridSnap || gridSnap <= 0) return Number(clamped.toFixed(1));
    return Number((Math.round(clamped / gridSnap) * gridSnap).toFixed(1));
  };

  // ============================================================================
  //  BATCH DUPLICATE, DELETE & NUDGE HANDLERS
  // ============================================================================
  const duplicateSelectedItems = useCallback(() => {
    if (selectedItems.length === 0) return;
    const now = Date.now();
    const selEntIds = new Set(
      selectedItems.filter((s) => s.kind === 'entity').map((s) => s.id)
    );
    const selZoneIds = new Set(
      selectedItems.filter((s) => s.kind === 'zone').map((s) => s.id)
    );

    const entityCopies: any[] = [];
    const zoneCopies: any[] = [];
    const newSelection: Array<{ kind: 'entity' | 'zone'; id: string }> = [];

    entities.forEach((ent: any, idx: number) => {
      if (selEntIds.has(ent.id)) {
        const copyId = `ent_${now}_${idx}`;
        const nx = Math.min(94, Number((Number(ent.x ?? 50) + 4).toFixed(1)));
        const ny = Math.min(94, Number((Number(ent.y ?? 50) + 4).toFixed(1)));
        entityCopies.push({
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

    zones.forEach((z: any, idx: number) => {
      if (selZoneIds.has(z.id)) {
        const copyId = `zone_${now}_${idx}`;
        const nx = Math.min(92, Number((Number(z.x ?? 50) + 4).toFixed(1)));
        const ny = Math.min(92, Number((Number(z.y ?? 30) + 4).toFixed(1)));
        zoneCopies.push({
          ...z,
          id: copyId,
          x: nx,
          y: ny
        });
        newSelection.push({ kind: 'zone', id: copyId });
      }
    });

    if (entityCopies.length > 0 || zoneCopies.length > 0) {
      onChange({
        ...block,
        entities: [...entities, ...entityCopies],
        zones: [...zones, ...zoneCopies]
      });
      setSelectedItems(newSelection);
      notifyBuilder(`Duplicated ${entityCopies.length + zoneCopies.length} item(s)!`);
    }
  }, [selectedItems, entities, zones, block, onChange, notifyBuilder]);

  const deleteSelectedItems = useCallback(() => {
    if (selectedItems.length === 0) return;
    const count = selectedItems.length;
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
    notifyBuilder(`Deleted ${count} selected item(s).`);
  }, [selectedItems, entities, zones, block, onChange, notifyBuilder]);

  const nudgeSelectedItems = useCallback(
    (dx: number, dy: number) => {
      if (selectedItems.length === 0) return;
      const selEntIds = new Set(
        selectedItems.filter((s) => s.kind === 'entity').map((s) => s.id)
      );
      const selZoneIds = new Set(
        selectedItems.filter((s) => s.kind === 'zone').map((s) => s.id)
      );

      const nextEntities = entities.map((e: any) => {
        if (!selEntIds.has(e.id) || e.lockInBuilder) return e;
        const nx = Math.max(2, Math.min(98, Number((Number(e.x ?? 50) + dx).toFixed(1))));
        const ny = Math.max(2, Math.min(98, Number((Number(e.y ?? 50) + dy).toFixed(1))));
        return {
          ...e,
          x: nx,
          y: ny,
          anchorX: nx,
          anchorY: ny
        };
      });

      const nextZones = zones.map((z: any) => {
        if (!selZoneIds.has(z.id) || z.lockInBuilder) return z;
        const nx = Math.max(4, Math.min(96, Number((Number(z.x ?? 50) + dx).toFixed(1))));
        const ny = Math.max(4, Math.min(96, Number((Number(z.y ?? 30) + dy).toFixed(1))));
        return {
          ...z,
          x: nx,
          y: ny
        };
      });

      onChange({ ...block, entities: nextEntities, zones: nextZones });
    },
    [selectedItems, entities, zones, block, onChange]
  );

  // ============================================================================
  //  KEYBOARD SHORTCUT LISTENER
  // ============================================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName || '';
      const isEditingInput =
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName) || target?.isContentEditable;

      if (isEditingInput) {
        if (e.key === 'Escape') {
          target?.blur();
        }
        return;
      }

      if (selectedItems.length === 0) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelectedItems();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const allCards = entities
          .filter((ent: any) => ent.entityType !== 'bg_shape' && !ent.lockInBuilder)
          .map((ent: any) => ({ kind: 'entity' as const, id: ent.id }));
        setSelectedItems(allCards);
        notifyBuilder(`Selected all ${allCards.length} cards (Ctrl+A)!`);
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedItems();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedItems([]);
        setTouchMultiSelectActive(false);
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 5 : e.altKey ? 0.5 : 1;
        if (e.key === 'ArrowUp') nudgeSelectedItems(0, -step);
        if (e.key === 'ArrowDown') nudgeSelectedItems(0, step);
        if (e.key === 'ArrowLeft') nudgeSelectedItems(-step, 0);
        if (e.key === 'ArrowRight') nudgeSelectedItems(step, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedItems.length,
    entities,
    duplicateSelectedItems,
    deleteSelectedItems,
    nudgeSelectedItems,
    notifyBuilder
  ]);

  // ============================================================================
  //  1-CLICK AUTO-ALIGN ROW & COLUMN
  // ============================================================================
  const handleAutoAlignRow = () => {
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
    notifyBuilder('Tap Multi-Select (or Shift+Click 2+ items) to align vertically.');
  };

  const startMoveItem = (
    e: React.PointerEvent,
    kind: 'entity' | 'zone',
    item: any
  ) => {
    e.stopPropagation();

    const alreadySelected = isItemSelected(kind, item.id);
    let nextSelection = selectedItems;
    const isMultiTrigger = e.shiftKey || touchMultiSelectActive;

    if (isMultiTrigger) {
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

  // State-Aware Field Updater
  const updateSelectedFields = (patch: Record<string, any>) => {
    const selEntIds = new Set(
      selectedItems.filter((s) => s.kind === 'entity').map((s) => s.id)
    );
    const selZoneIds = new Set(
      selectedItems.filter((s) => s.kind === 'zone').map((s) => s.id)
    );

    const visualStateKeys = ['label', 'sublabel', 'color', 'borderStyle', 'scale'];
    const isStateVisualEdit =
      activeEditingState !== 'normal' &&
      Object.keys(patch).some((k) => visualStateKeys.includes(k));

    const nextEntities = entities.map((e: any) => {
      if (!selEntIds.has(e.id)) return e;
      if (isStateVisualEdit && e.entityType !== 'bg_shape') {
        const currentStates = e.states || {};
        const prevThisState = currentStates[activeEditingState] || {
          label: e.label,
          sublabel: e.sublabel,
          color: e.color,
          borderStyle: e.borderStyle || 'solid',
          scale: e.scale || 1
        };
        return {
          ...e,
          states: {
            ...currentStates,
            [activeEditingState]: {
              ...prevThisState,
              ...patch
            }
          }
        };
      }
      return { ...e, ...patch };
    });

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
      category: '',
      states: {}
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
    notifyBuilder('Added Background Group Shape!');
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
    notifyBuilder(`Added ${cols}-Column Background Group Layout!`);
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

  // Add Custom Variable
  const handleAddVariable = () => {
    const cleanName = newVarName.trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!cleanName) return;
    const defaultVal =
      newVarType === 'number'
        ? Number(newVarDefault || 0)
        : newVarType === 'boolean'
        ? String(newVarDefault).toLowerCase() === 'true'
        : newVarDefault;
    const nextVars: CanvasVariable[] = [
      ...variables.filter((v) => v.name !== cleanName),
      { id: `var_${Date.now()}`, name: cleanName, type: newVarType, defaultValue: defaultVal }
    ];
    onChange({ ...block, variables: nextVars });
    setNewVarName('');
    setNewVarDefault(newVarType === 'number' ? '0' : '');
    notifyBuilder(`Created variable %${cleanName}%! Type %${cleanName}% inside any card or title.`);
  };

  // Add Conditional Trigger Rule
  const handleAddConditionalRule = () => {
    const defaultEntityId = primarySelected?.kind === 'entity' ? primarySelected.id : entities[0]?.id || '';
    const newRule: ConditionalTriggerRule = {
      id: `rule_${Date.now()}`,
      event: 'on_click',
      entityId: defaultEntityId,
      conditionType: 'none',
      conditionVariable: allVariableNames[0] || 'Score',
      conditionOperator: '>=',
      conditionValue: '10',
      action: 'adjust_variable',
      targetVariable: allVariableNames[0] || 'Score',
      variableOp: 'add',
      variableAmount: 10,
      message: 'Score is now %Score%!',
      elseAction: 'none'
    };
    onChange({ ...block, rules: [...rules, newRule] });
    notifyBuilder('Added new Conditional Trigger Rule!');
  };

  const updateRuleById = (ruleId: string, patch: Partial<ConditionalTriggerRule>) => {
    onChange({
      ...block,
      rules: rules.map((r) => (r.id === ruleId ? { ...r, ...patch } : r))
    });
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
  const rawActiveTarget = activeSelectedEntity || activeSelectedZone;
  const activeTarget =
    activeSelectedEntity && activeEditingState !== 'normal'
      ? resolveEntityVisualState(activeSelectedEntity, activeEditingState)
      : rawActiveTarget;
  const isMultiSelect = selectedItems.length > 1;

  const activeThemeClass =
    THEME_BACKGROUNDS[block?.backgroundTheme || 'physics_lab'] || THEME_BACKGROUNDS.physics_lab;

  const handleBtnSize = isTabletMode
    ? 'w-12 h-12 -top-5 -left-5'
    : 'w-8 h-8 -top-3.5 -left-3.5';
  const menuBtnSize = isTabletMode
    ? 'w-12 h-12 -top-5 -right-5'
    : 'w-8 h-8 -top-3.5 -right-3.5';
  const resizeBtnSize = isTabletMode
    ? 'w-12 h-12 -bottom-5 -right-5'
    : 'w-8 h-8 -bottom-3.5 -right-3.5';
  const handleIconPx = isTabletMode ? 18 : 13;

  const handleActivateOrCreateState = (stateKey: string) => {
    if (stateKey === 'normal') {
      setActiveEditingState('normal');
      return;
    }
    const selEntIds = new Set(
      selectedItems.filter((s) => s.kind === 'entity').map((s) => s.id)
    );
    const defaultColors: Record<string, string> = {
      hover: 'cyan',
      selected: 'amber',
      visited: 'emerald',
      disabled: 'slate'
    };

    const nextEntities = entities.map((e: any) => {
      if (!selEntIds.has(e.id) || e.entityType === 'bg_shape') return e;
      const existingStates = e.states || {};
      if (existingStates[stateKey]) return e;
      return {
        ...e,
        states: {
          ...existingStates,
          [stateKey]: {
            label: e.label,
            sublabel:
              stateKey === 'visited'
                ? '✓ Explored'
                : stateKey === 'selected'
                ? '★ Selected'
                : e.sublabel,
            color: defaultColors[stateKey] || e.color || 'indigo',
            borderStyle: stateKey === 'selected' ? 'glow' : e.borderStyle || 'solid',
            scale: stateKey === 'hover' ? 1.06 : e.scale || 1
          }
        }
      };
    });

    onChange({ ...block, entities: nextEntities });
    setActiveEditingState(stateKey);
    notifyBuilder(
      `Editing "${stateKey.toUpperCase()}" state — any color, text, or border changes apply to this state!`
    );
  };

  const handleDeleteStateOverride = (stateKey: string) => {
    if (stateKey === 'normal') return;
    const selEntIds = new Set(
      selectedItems.filter((s) => s.kind === 'entity').map((s) => s.id)
    );
    const nextEntities = entities.map((e: any) => {
      if (!selEntIds.has(e.id) || !e.states?.[stateKey]) return e;
      const nextStates = { ...e.states };
      delete nextStates[stateKey];
      return { ...e, states: nextStates };
    });
    onChange({ ...block, entities: nextEntities });
    setActiveEditingState('normal');
    notifyBuilder(`Removed "${stateKey}" state override.`);
  };

  // ============================================================================
  //  PHOTOSHOP / FIGMA CONTEXTUAL TASK BAR RENDERER
  // ============================================================================
  const renderContextualTaskBar = (isFloatingInstance = false) => {
    if (!activeTarget) {
      if (taskbarDock === 'top' || taskbarDock === 'bottom') {
        return (
          <div className="px-4 py-3 rounded-2xl bg-slate-900/95 text-slate-300 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
            <span className="flex items-center gap-2">
              {isTabletMode ? (
                <>
                  <Tablet size={16} className="text-emerald-400" />
                  <span>
                    <strong className="text-emerald-300">Tablet Touch Studio:</strong> Tap any box to edit States, Variables & Triggers!
                  </span>
                </>
              ) : (
                <>
                  <Keyboard size={14} className="text-indigo-400" />
                  <span>
                    Use <strong className="text-emerald-300">%VarName%</strong> in any label •{' '}
                    <strong className="text-amber-300">States & Triggers</strong> in top bar •{' '}
                    <strong className="text-cyan-300">Shift+Click</strong> multi-select
                  </span>
                </>
              )}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setTouchMultiSelectActive((m) => !m)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                  touchMultiSelectActive
                    ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                <CheckSquare size={13} />
                Multi-Select: {touchMultiSelectActive ? 'ON' : 'OFF'}
              </button>

              <button
                type="button"
                onClick={handleSelectAllCards}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-[10px] font-black uppercase text-slate-200 mr-1 flex items-center gap-1"
              >
                Select All
              </button>

              <span className="text-[10px] uppercase tracking-widest text-slate-500 mr-1">Dock:</span>
              <button
                type="button"
                title="Dock to Top Ribbon"
                onClick={() => setTaskbarDock('top')}
                className={`p-2 rounded-lg ${taskbarDock === 'top' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
              >
                <PanelTop size={14} />
              </button>
              <button
                type="button"
                title="Dock to Bottom Bar"
                onClick={() => setTaskbarDock('bottom')}
                className={`p-2 rounded-lg ${taskbarDock === 'bottom' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
              >
                <PanelBottom size={14} />
              </button>
              <button
                type="button"
                title="Dock to Right Inspector Sidebar"
                onClick={() => setTaskbarDock('right')}
                className="p-2 rounded-lg hover:bg-slate-800"
              >
                <PanelRight size={14} />
              </button>
              <button
                type="button"
                title="Float Over Canvas"
                onClick={() => setTaskbarDock('floating')}
                className="p-2 rounded-lg hover:bg-slate-800"
              >
                <Move size={14} />
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
      : Math.min(76, Math.max(24, Number(rawActiveTarget.x ?? 50)));
    const rawTargetY = Number(rawActiveTarget.y ?? 50);
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
            ? 'max-w-[96%] w-max rounded-2xl bg-slate-900/95 backdrop-blur-2xl border-2 border-indigo-400/70 shadow-[0_20px_60px_rgba(0,0,0,0.85)] p-3 text-white animate-in zoom-in-95 duration-150'
            : isVertical
            ? 'w-full lg:w-80 shrink-0 rounded-3xl bg-slate-900 text-white border border-slate-800 p-4 space-y-4 self-start shadow-xl'
            : 'w-full rounded-2xl bg-slate-900 text-white border border-slate-800 px-4 py-3 shadow-lg'
        }`}
      >
        <div
          className={`flex ${
            isVertical ? 'flex-col gap-3.5' : 'flex-wrap items-center gap-2.5'
          }`}
        >
          {/* 1. Drag Grip + Pin Toggle + Multi-Select Badge + States Button */}
          <div className="flex items-center gap-1.5 pr-2 border-r border-slate-700/80">
            {isFloatingInstance && (
              <button
                type="button"
                title="Drag to Reposition Floating Task Bar"
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
                className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white cursor-grab active:cursor-grabbing touch-none"
              >
                <GripVertical size={15} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setTouchMultiSelectActive((m) => !m)}
              title="Toggle Touch Multi-Select Mode"
              className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center gap-1 whitespace-nowrap transition-all ${
                touchMultiSelectActive || isMultiSelect
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow'
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
              }`}
            >
              <CheckSquare size={12} />
              {isMultiSelect
                ? `${selectedItems.length} Selected`
                : touchMultiSelectActive
                ? 'Multi-Tap: ON'
                : isBgShape
                ? 'Group Shape'
                : isEntity
                ? 'Card / Box'
                : 'Drop Bucket'}
            </button>

            {isEntity && !isBgShape && (
              <button
                type="button"
                onClick={() => setShowStatesTray((s) => !s)}
                title="Open Storyline Object States & Button Set Editor"
                className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center gap-1 whitespace-nowrap transition-all ${
                  showStatesTray || activeEditingState !== 'normal'
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                    : 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Sparkles size={12} />
                States ({activeEditingState.toUpperCase()})
              </button>
            )}

            {isFloatingInstance && (
              <button
                type="button"
                title={
                  isTaskbarPinned
                    ? 'Pinned in Place (Tap to Follow Selected Object)'
                    : 'Pin Task Bar at Current Position'
                }
                onClick={() => {
                  if (!isTaskbarPinned) {
                    setPinnedPos({ x: floatX, y: floatY });
                  }
                  setIsTaskbarPinned((p) => !p);
                }}
                className={`p-2 rounded-lg border transition-colors ${
                  isTaskbarPinned
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <Pin size={13} />
              </button>
            )}
          </div>

          {/* 2. Primary Text, Sublabel & Quick %Variable% Token Inserter */}
          <div className={`flex ${isVertical ? 'flex-col' : 'items-center'} gap-1.5`}>
            {!isMultiSelect && (
              <input
                type="text"
                value={activeTarget.label || ''}
                placeholder="Label (or %Score%)"
                onChange={(e) => updateSelectedFields({ label: e.target.value })}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-400 text-xs font-black text-white outline-none w-40"
                title={`Label for "${activeEditingState}" state (Supports %VarName%)`}
              />
            )}
            <input
              type="text"
              value={activeTarget.sublabel || ''}
              placeholder={isMultiSelect ? 'Batch subtitle...' : 'Subtitle / %Var%...'}
              onChange={(e) => updateSelectedFields({ sublabel: e.target.value })}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-400 text-xs font-bold text-slate-300 outline-none w-32"
              title="Subtitle / Hint (Supports %VarName%)"
            />
            {/* 1-Click Insert %Variable% Token Dropdown */}
            {!isMultiSelect && (
              <select
                value=""
                onChange={(e) => {
                  if (!e.target.value) return;
                  const token = `%${e.target.value}%`;
                  updateSelectedFields({
                    label: `${activeTarget.label || ''} ${token}`.trim()
                  });
                }}
                title="Insert a Dynamic %Variable% Reference into Label"
                className="px-2 py-2 rounded-xl bg-slate-950 border border-emerald-500/40 text-[10px] font-black text-emerald-300 outline-none"
              >
                <option value="">+%Var%</option>
                {allVariableNames.map((vn) => (
                  <option key={vn} value={vn}>
                    %{vn}%
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              title="Clear Text on Selected (Convert to Empty Resizable Box)"
              onClick={() =>
                updateSelectedFields({
                  label: '',
                  sublabel: '',
                  width: rawActiveTarget.width ?? 24,
                  height: rawActiveTarget.height ?? 16,
                  resizeMode: 'box'
                })
              }
              className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-[10px] font-black uppercase text-slate-300 transition-colors whitespace-nowrap"
            >
              Empty
            </button>
          </div>

          {/* 3. 6-Color Palette Swatches */}
          <div className="flex items-center gap-1.5 px-2 border-l border-r border-slate-800">
            {Object.entries(COLOR_STYLES).map(([colorKey, cObj]) => {
              const isPicked = (activeTarget.color || 'indigo') === colorKey;
              return (
                <button
                  key={colorKey}
                  type="button"
                  title={`Apply ${colorKey} to "${activeEditingState}" state`}
                  onClick={() => updateSelectedFields({ color: colorKey })}
                  style={{ backgroundColor: cObj.hex }}
                  className={`${
                    isTabletMode ? 'w-7 h-7' : 'w-5 h-5'
                  } rounded-full border transition-transform ${
                    isPicked
                      ? 'border-white scale-125 ring-2 ring-white/60'
                      : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                />
              );
            })}
          </div>

          {/* 4. Border Style & Shape Corner Pickers */}
          <div className="flex items-center gap-1.5">
            <select
              value={activeTarget.borderStyle || (isEntity ? 'solid' : 'dashed')}
              onChange={(e) => updateSelectedFields({ borderStyle: e.target.value })}
              title="Border Style"
              className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-[10px] font-black uppercase text-slate-200 outline-none"
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
                value={rawActiveTarget.shapeVariant || 'banner'}
                onChange={(e) => updateSelectedFields({ shapeVariant: e.target.value })}
                title="Corner Geometry"
                className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-[10px] font-black uppercase text-slate-200 outline-none"
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
            <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
              <span className="text-[9px] font-black text-slate-400">W%</span>
              <input
                type="number"
                min={5}
                max={96}
                value={rawActiveTarget.width ?? (isEntity ? 20 : 28)}
                onChange={(e) => {
                  const w = Math.max(5, Math.min(96, Number(e.target.value) || 15));
                  updateSelectedFields({
                    width: w,
                    height: rawActiveTarget.height ?? 14,
                    resizeMode: 'box'
                  });
                }}
                className="w-11 bg-transparent text-xs font-mono font-black text-emerald-400 outline-none text-center"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
              <span className="text-[9px] font-black text-slate-400">H%</span>
              <input
                type="number"
                min={5}
                max={96}
                value={rawActiveTarget.height ?? (isEntity ? 12 : 24)}
                onChange={(e) => {
                  const h = Math.max(5, Math.min(96, Number(e.target.value) || 12));
                  updateSelectedFields({
                    height: h,
                    width: rawActiveTarget.width ?? 20,
                    resizeMode: 'box'
                  });
                }}
                className="w-11 bg-transparent text-xs font-mono font-black text-emerald-400 outline-none text-center"
              />
            </div>

            {isBgShape && (
              <div
                className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800"
                title="Background Fill Opacity %"
              >
                <span className="text-[9px] font-black text-purple-300">α%</span>
                <input
                  type="number"
                  min={5}
                  max={95}
                  step={5}
                  value={rawActiveTarget.opacity ?? 22}
                  onChange={(e) =>
                    updateSelectedFields({
                      opacity: Math.max(5, Math.min(95, Number(e.target.value) || 20))
                    })
                  }
                  className="w-11 bg-transparent text-xs font-mono font-black text-purple-300 outline-none text-center"
                />
              </div>
            )}
          </div>

          {/* 6. ON-SCREEN TOUCH D-PAD NUDGE CLUSTER */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-950 border border-slate-800">
            <select
              value={touchNudgeStep}
              onChange={(e) => setTouchNudgeStep(Number(e.target.value))}
              title="Touch Nudge Step Size"
              className="bg-slate-900 text-amber-300 text-[10px] font-mono font-black px-1.5 py-1 rounded-lg border border-slate-700 outline-none"
            >
              <option value={0.5}>0.5%</option>
              <option value={1}>1%</option>
              <option value={5}>5%</option>
            </select>
            <button
              type="button"
              title="Nudge Left"
              onClick={() => nudgeSelectedItems(-touchNudgeStep, 0)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600 active:scale-90 text-white"
            >
              <ArrowLeft size={14} />
            </button>
            <button
              type="button"
              title="Nudge Up"
              onClick={() => nudgeSelectedItems(0, -touchNudgeStep)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600 active:scale-90 text-white"
            >
              <ArrowUp size={14} />
            </button>
            <button
              type="button"
              title="Nudge Down"
              onClick={() => nudgeSelectedItems(0, touchNudgeStep)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600 active:scale-90 text-white"
            >
              <ArrowDown size={14} />
            </button>
            <button
              type="button"
              title="Nudge Right"
              onClick={() => nudgeSelectedItems(touchNudgeStep, 0)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600 active:scale-90 text-white"
            >
              <ArrowRight size={14} />
            </button>
          </div>

          {/* 7. Category / Button Set / Sequence / Connector Target Controls */}
          <div className="flex items-center gap-1.5">
            {isEntity && !isBgShape ? (
              <>
                <input
                  type="text"
                  placeholder="Category (e.g. ed)"
                  value={rawActiveTarget.category || ''}
                  onChange={(e) => updateSelectedFields({ category: e.target.value })}
                  title="Category Match Tag"
                  className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-[11px] font-bold text-emerald-300 outline-none w-24"
                />
                <select
                  value={rawActiveTarget.buttonSet || ''}
                  onChange={(e) => updateSelectedFields({ buttonSet: e.target.value || undefined })}
                  title="Assign to a Storyline Button Set"
                  className="px-2 py-2 rounded-xl bg-slate-950 border border-amber-500/40 text-[10px] font-black text-amber-300 outline-none"
                >
                  <option value="">Btn Set: None</option>
                  <option value="set_a">Btn Set: Group A</option>
                  <option value="set_b">Btn Set: Group B</option>
                  <option value="set_c">Btn Set: Group C</option>
                </select>
                {!isMultiSelect && (
                  <>
                    <input
                      type="number"
                      placeholder="Seq #"
                      value={rawActiveTarget.sequenceIndex ?? ''}
                      onChange={(e) =>
                        updateEntityField(rawActiveTarget.id, {
                          sequenceIndex: e.target.value ? Number(e.target.value) : undefined
                        })
                      }
                      title="Sequence Order Slot #"
                      className="px-2 py-2 rounded-xl bg-slate-950 border border-slate-700 text-[11px] font-bold text-amber-300 outline-none w-14"
                    />
                    <select
                      value={rawActiveTarget.connectTargetId || ''}
                      onChange={(e) => handleLinkConnectorTarget(rawActiveTarget.id, e.target.value)}
                      title="Link SVG Connector Line Target"
                      className="px-2 py-2 rounded-xl bg-slate-950 border border-cyan-500/40 text-[10px] font-bold text-cyan-300 outline-none max-w-[130px]"
                    >
                      <option value="">Link Line: None</option>
                      {entities
                        .filter(
                          (other: any) =>
                            other.id !== rawActiveTarget.id && other.entityType !== 'bg_shape'
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
                  value={rawActiveTarget.acceptedCategory || ''}
                  onChange={(e) => updateSelectedFields({ acceptedCategory: e.target.value })}
                  className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-[11px] font-bold text-emerald-300 outline-none w-32"
                />
                <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-[9px] font-black text-slate-400">Cap</span>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={rawActiveTarget.capacity ?? 2}
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

          {/* 8. Quick Toggles */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            {isMultiSelect && (
              <>
                <button
                  type="button"
                  title="Align Selected Items Horizontally in a Row"
                  onClick={handleAutoAlignRow}
                  className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  <AlignHorizontalSpaceAround size={14} />
                </button>
                <button
                  type="button"
                  title="Align Selected Items Vertically in a Column"
                  onClick={handleAutoAlignColumn}
                  className="p-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white"
                >
                  <AlignVerticalSpaceAround size={14} />
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
                      width: rawActiveTarget.width ?? 42,
                      height: rawActiveTarget.height ?? 34,
                      opacity: rawActiveTarget.opacity ?? 20,
                      anchored: !isBgShape,
                      draggable: isBgShape
                    })
                  }
                  className={`p-2 rounded-lg border text-[10px] font-black uppercase flex items-center gap-1 ${
                    isBgShape
                      ? 'bg-purple-600 text-white border-purple-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  <Square size={13} />
                </button>

                <button
                  type="button"
                  title={
                    rawActiveTarget.anchored
                      ? 'Anchored on Student Stage (Students Cannot Drag)'
                      : 'Draggable by Students (Tap to Anchor in Place)'
                  }
                  onClick={() =>
                    updateSelectedFields({
                      anchored: !rawActiveTarget.anchored,
                      draggable: Boolean(rawActiveTarget.anchored)
                    })
                  }
                  className={`p-2 rounded-lg border ${
                    rawActiveTarget.anchored
                      ? 'bg-amber-500 text-slate-950 border-amber-300'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  <Pin size={13} />
                </button>

                {!rawActiveTarget.anchored && (
                  <button
                    type="button"
                    title={
                      rawActiveTarget.returnToAnchor
                        ? 'Magnetic Home Return: ON'
                        : 'Magnetic Home Return: OFF'
                    }
                    onClick={() =>
                      updateSelectedFields({
                        returnToAnchor: !rawActiveTarget.returnToAnchor
                      })
                    }
                    className={`p-2 rounded-lg border ${
                      rawActiveTarget.returnToAnchor
                        ? 'bg-cyan-600 text-white border-cyan-400'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <Magnet size={13} />
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
                  : adjustLayerZOrder(isEntity ? 'entity' : 'zone', rawActiveTarget.id, 'back')
              }
              className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white"
            >
              <ChevronsDown size={14} />
            </button>
            <button
              type="button"
              title="Bring Selected to Front"
              onClick={() =>
                isMultiSelect
                  ? adjustBatchZOrder('front')
                  : adjustLayerZOrder(isEntity ? 'entity' : 'zone', rawActiveTarget.id, 'front')
              }
              className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white"
            >
              <ChevronsUp size={14} />
            </button>

            <button
              type="button"
              title={
                rawActiveTarget.lockInBuilder
                  ? 'Locked in Editor (Tap to Unlock)'
                  : 'Lock Position in Editor'
              }
              onClick={() =>
                updateSelectedFields({
                  lockInBuilder: !rawActiveTarget.lockInBuilder
                })
              }
              className={`p-2 rounded-lg ${
                rawActiveTarget.lockInBuilder
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {rawActiveTarget.lockInBuilder ? <Lock size={14} /> : <Unlock size={14} />}
            </button>

            <button
              type="button"
              title="Duplicate Selected (Ctrl+D)"
              onClick={duplicateSelectedItems}
              className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white"
            >
              <Copy size={14} />
            </button>

            <button
              type="button"
              title="Delete Selected (Delete / Backspace)"
              onClick={deleteSelectedItems}
              className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-600 text-rose-400 hover:text-white"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* 9. Workspace Dock Mode Switcher */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800 ml-auto">
            <button
              type="button"
              title="Dock Task Bar to Top Ribbon"
              onClick={() => setTaskbarDock('top')}
              className={`p-2 rounded-lg ${
                taskbarDock === 'top'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <PanelTop size={14} />
            </button>
            <button
              type="button"
              title="Dock Task Bar to Bottom Tray"
              onClick={() => setTaskbarDock('bottom')}
              className={`p-2 rounded-lg ${
                taskbarDock === 'bottom'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <PanelBottom size={14} />
            </button>
            <button
              type="button"
              title="Dock Task Bar to Right Inspector Sidebar"
              onClick={() => setTaskbarDock('right')}
              className={`p-2 rounded-lg ${
                taskbarDock === 'right'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <PanelRight size={14} />
            </button>
            <button
              type="button"
              title="Float Task Bar Over Canvas"
              onClick={() => setTaskbarDock('floating')}
              className={`p-2 rounded-lg ${
                taskbarDock === 'floating'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Move size={14} />
            </button>
            <button
              type="button"
              title="Clear Selection"
              onClick={() => {
                setSelectedItems([]);
                setTouchMultiSelectActive(false);
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white ml-0.5"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={builderRootRef}
      tabIndex={-1}
      className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-indigo-500/30 shadow-xl overflow-hidden space-y-4 p-6 outline-none"
    >
      {/* Top Studio Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              {isTabletMode
                ? `Tablet Touch Studio Active • 48px Handles • Touch D-Pad (${selectedItems.length} Selected)`
                : `HD Stage Studio • %Variables% • Conditional Triggers • Object States (${selectedItems.length} Selected)`}
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
            placeholder="Canvas Slide Title (Supports %Variable%)..."
            className="text-lg font-black bg-transparent text-slate-900 dark:text-white outline-none border-b border-transparent focus:border-indigo-500 mt-0.5"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTabletModeOverride(isTabletMode ? false : true)}
            title="Toggle Tablet Touch-Friendly Interface"
            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border transition-all ${
              isTabletMode
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Tablet size={13} />
            {isTabletMode ? 'Tablet UI: ON' : 'Tablet UI: Auto'}
          </button>

          <button
            type="button"
            onClick={() => setTouchMultiSelectActive((m) => !m)}
            title="Tap to select multiple objects with one finger without holding Shift"
            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border transition-all ${
              touchMultiSelectActive
                ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <CheckSquare size={13} />
            Multi-Select
          </button>

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
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm"
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
            onClick={addZone}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm"
          >
            <Plus size={12} /> Drop Bucket
          </button>

          {/* 🔥 STORYLINE VARIABLES (%VAR%) DRAWER BUTTON */}
          <button
            type="button"
            onClick={() => setShowVariablesPanel((v) => !v)}
            className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border transition-all ${
              showVariablesPanel
                ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Database size={13} /> %Variables% ({variables.length})
          </button>

          {/* 🔥 CONDITIONAL TRIGGER WIZARD (IF / ELSE) BUTTON */}
          <button
            type="button"
            onClick={() => setShowTriggerWizard((t) => !t)}
            className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border transition-all ${
              showTriggerWizard
                ? 'bg-rose-600 text-white border-rose-400 shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
          >
            <GitBranch size={13} /> Triggers ({rules.length})
          </button>

          <button
            type="button"
            onClick={() => setShowStatesTray((s) => !s)}
            className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border transition-all ${
              showStatesTray
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Sparkles size={13} /> States
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

      {/* ============================================================================ */}
      {/* 🔥 PANEL A: ARTICULATE STORYLINE VARIABLES MANAGER (`%VarName%`)             */}
      {/* ============================================================================ */}
      {showVariablesPanel && (
        <div className="p-5 rounded-3xl bg-slate-950 text-white border-2 border-emerald-500/40 shadow-2xl space-y-4 animate-in slide-in-from-top-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-emerald-400" />
              <span className="text-xs font-black uppercase tracking-widest text-emerald-300">
                Project Variables Studio (%Variable% Dynamic Text Replacement)
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                Built-in: %Score%, %MistakeCount%, %CorrectCount%, %VisitedCount%, %LearnerName%
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowVariablesPanel(false)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>

          {/* Create New Variable Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
            <div className="sm:col-span-4">
              <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">
                Variable Name (No Spaces)
              </label>
              <input
                type="text"
                value={newVarName}
                onChange={(e) => setNewVarName(e.target.value)}
                placeholder="e.g. LegionMorale or ClueFound"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-black text-emerald-300 outline-none"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">
                Data Type
              </label>
              <select
                value={newVarType}
                onChange={(e) => {
                  const t = e.target.value as 'text' | 'number' | 'boolean';
                  setNewVarType(t);
                  setNewVarDefault(t === 'number' ? '0' : t === 'boolean' ? 'false' : '');
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-black text-white outline-none"
              >
                <option value="number">Number (Counter / Math)</option>
                <option value="text">Text (String / Name)</option>
                <option value="boolean">True / False (Flag)</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">
                Initial Default Value
              </label>
              <input
                type="text"
                value={newVarDefault}
                onChange={(e) => setNewVarDefault(e.target.value)}
                placeholder="Default value..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={handleAddVariable}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest"
              >
                + Add Variable
              </button>
            </div>
          </div>

          {/* Active Custom Variables Table */}
          {variables.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {variables.map((v) => (
                <div
                  key={v.id || v.name}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-emerald-400">
                        %{v.name}%
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[9px] font-black uppercase text-slate-400">
                        {v.type}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-300 mt-0.5">
                      Default: <strong className="text-white">{String(v.defaultValue)}</strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...block,
                        variables: variables.filter((item) => item.name !== v.name)
                      })
                    }
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================================ */}
      {/* 🔥 PANEL B: CONDITIONAL TRIGGER WIZARD (`WHEN / IF / THEN / ELSE`)           */}
      {/* ============================================================================ */}
      {showTriggerWizard && (
        <div className="p-5 rounded-3xl bg-slate-950 text-white border-2 border-rose-500/40 shadow-2xl space-y-4 animate-in slide-in-from-top-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <GitBranch size={16} className="text-rose-400" />
              <span className="text-xs font-black uppercase tracking-widest text-rose-300">
                Conditional Trigger Wizard (Storyline WHEN ➔ IF ➔ THEN ➔ ELSE Rules)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddConditionalRule}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
              >
                <Plus size={12} /> + Add Conditional Trigger
              </button>
              <button
                type="button"
                onClick={() => setShowTriggerWizard(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {rules.length === 0 ? (
            <p className="text-xs text-slate-400 font-bold py-2">
              No custom triggers yet. Click "+ Add Conditional Trigger" to build IF/ELSE rules (e.g., When User Clicks Verify ➔ If Score &gt;= 20 ➔ Show Success Layer ➔ Else Show Remediation Toast).
            </p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              {rules.map((rule, rIdx) => (
                <div
                  key={rule.id || rIdx}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase">
                      Trigger Rule #{rIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...block,
                          rules: rules.filter((r) => r.id !== rule.id)
                        })
                      }
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* ROW 1: WHEN EVENT + IF CONDITION */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="md:col-span-2">
                      <span className="text-[9px] font-black uppercase text-indigo-400 block">
                        1. WHEN Event
                      </span>
                      <select
                        value={rule.event || 'on_click'}
                        onChange={(e) =>
                          updateRuleById(rule.id, { event: e.target.value as any })
                        }
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-white"
                      >
                        <option value="on_click">User Clicks Box</option>
                        <option value="on_drop">Box Dropped on Zone</option>
                        <option value="on_variable_change">Variable Changes</option>
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      <span className="text-[9px] font-black uppercase text-slate-400 block">
                        Target Object / Variable
                      </span>
                      {rule.event === 'on_variable_change' ? (
                        <select
                          value={rule.watchVariable || 'Score'}
                          onChange={(e) =>
                            updateRuleById(rule.id, { watchVariable: e.target.value })
                          }
                          className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-emerald-300"
                        >
                          {allVariableNames.map((vn) => (
                            <option key={vn} value={vn}>
                              %{vn}%
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={rule.entityId || ''}
                          onChange={(e) =>
                            updateRuleById(rule.id, { entityId: e.target.value })
                          }
                          className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-white"
                        >
                          <option value="">Any Box</option>
                          {entities.map((ent: any) => (
                            <option key={ent.id} value={ent.id}>
                              {ent.label || ent.id}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <span className="text-[9px] font-black uppercase text-amber-400 block">
                        2. IF Condition
                      </span>
                      <select
                        value={rule.conditionType || 'none'}
                        onChange={(e) =>
                          updateRuleById(rule.id, { conditionType: e.target.value as any })
                        }
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-amber-300"
                      >
                        <option value="none">Always (No IF)</option>
                        <option value="variable">If Variable...</option>
                        <option value="state">If Object State...</option>
                      </select>
                    </div>

                    {rule.conditionType === 'variable' && (
                      <>
                        <div className="md:col-span-2">
                          <span className="text-[9px] font-black uppercase text-slate-400 block">
                            Check Variable
                          </span>
                          <select
                            value={rule.conditionVariable || 'Score'}
                            onChange={(e) =>
                              updateRuleById(rule.id, { conditionVariable: e.target.value })
                            }
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-emerald-300"
                          >
                            {allVariableNames.map((vn) => (
                              <option key={vn} value={vn}>
                                %{vn}%
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-1">
                          <span className="text-[9px] font-black uppercase text-slate-400 block">
                            Op
                          </span>
                          <select
                            value={rule.conditionOperator || '>='}
                            onChange={(e) =>
                              updateRuleById(rule.id, { conditionOperator: e.target.value as any })
                            }
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1.5 text-xs font-mono font-black text-white"
                          >
                            <option value="==">==</option>
                            <option value="!=">!=</option>
                            <option value=">=">&gt;=</option>
                            <option value="<=">&lt;=</option>
                            <option value=">">&gt;</option>
                            <option value="<">&lt;</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-[9px] font-black uppercase text-slate-400 block">
                            Value
                          </span>
                          <input
                            type="text"
                            value={rule.conditionValue ?? ''}
                            onChange={(e) =>
                              updateRuleById(rule.id, { conditionValue: e.target.value })
                            }
                            placeholder="e.g. 20"
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-white"
                          />
                        </div>
                      </>
                    )}

                    {rule.conditionType === 'state' && (
                      <>
                        <div className="md:col-span-3">
                          <span className="text-[9px] font-black uppercase text-slate-400 block">
                            Check Object
                          </span>
                          <select
                            value={rule.conditionEntityId || ''}
                            onChange={(e) =>
                              updateRuleById(rule.id, { conditionEntityId: e.target.value })
                            }
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-white"
                          >
                            {entities.map((ent: any) => (
                              <option key={ent.id} value={ent.id}>
                                {ent.label || ent.id}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-[9px] font-black uppercase text-slate-400 block">
                            Is State
                          </span>
                          <select
                            value={rule.conditionStateIs || 'visited'}
                            onChange={(e) =>
                              updateRuleById(rule.id, { conditionStateIs: e.target.value })
                            }
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-amber-300"
                          >
                            <option value="visited">Visited</option>
                            <option value="selected">Selected</option>
                            <option value="normal">Normal</option>
                            <option value="disabled">Disabled</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>

                  {/* ROW 2: THEN DO ACTION + OPTIONAL ELSE MESSAGE */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="md:col-span-3">
                      <span className="text-[9px] font-black uppercase text-emerald-400 block">
                        3. THEN Do Action
                      </span>
                      <select
                        value={rule.action || 'adjust_variable'}
                        onChange={(e) =>
                          updateRuleById(rule.id, { action: e.target.value as any })
                        }
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-emerald-300"
                      >
                        <option value="adjust_variable">Adjust Variable</option>
                        <option value="change_state">Change Object State</option>
                        <option value="show_layer">Show Slide Layer</option>
                        <option value="show_toast">Show Banner Toast</option>
                        <option value="complete_block">Complete Slide</option>
                      </select>
                    </div>

                    {rule.action === 'adjust_variable' && (
                      <>
                        <div className="md:col-span-2">
                          <span className="text-[9px] font-black uppercase text-slate-400 block">
                            Target Variable
                          </span>
                          <select
                            value={rule.targetVariable || 'Score'}
                            onChange={(e) =>
                              updateRuleById(rule.id, { targetVariable: e.target.value })
                            }
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-emerald-300"
                          >
                            {allVariableNames.map((vn) => (
                              <option key={vn} value={vn}>
                                %{vn}%
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-[9px] font-black uppercase text-slate-400 block">
                            Operation
                          </span>
                          <select
                            value={rule.variableOp || 'add'}
                            onChange={(e) =>
                              updateRuleById(rule.id, { variableOp: e.target.value as any })
                            }
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-white"
                          >
                            <option value="add">Add (+)</option>
                            <option value="subtract">Subtract (-)</option>
                            <option value="set">Set (=)</option>
                            <option value="toggle">Toggle Bool</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-[9px] font-black uppercase text-slate-400 block">
                            Amount / Value
                          </span>
                          <input
                            type="text"
                            value={rule.variableAmount ?? 10}
                            onChange={(e) =>
                              updateRuleById(rule.id, { variableAmount: e.target.value })
                            }
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-white"
                          />
                        </div>
                      </>
                    )}

                    {rule.action === 'change_state' && (
                      <>
                        <div className="md:col-span-3">
                          <span className="text-[9px] font-black uppercase text-slate-400 block">
                            Target Object
                          </span>
                          <select
                            value={rule.targetEntityId || ''}
                            onChange={(e) =>
                              updateRuleById(rule.id, { targetEntityId: e.target.value })
                            }
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-white"
                          >
                            {entities.map((ent: any) => (
                              <option key={ent.id} value={ent.id}>
                                {ent.label || ent.id}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-3">
                          <span className="text-[9px] font-black uppercase text-slate-400 block">
                            New State
                          </span>
                          <select
                            value={rule.targetState || 'visited'}
                            onChange={(e) =>
                              updateRuleById(rule.id, { targetState: e.target.value })
                            }
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-amber-300"
                          >
                            <option value="normal">Normal</option>
                            <option value="visited">Visited</option>
                            <option value="selected">Selected</option>
                            <option value="disabled">Disabled</option>
                            <option value="hidden">Hidden</option>
                          </select>
                        </div>
                      </>
                    )}

                    <div className="md:col-span-3">
                      <span className="text-[9px] font-black uppercase text-slate-400 block">
                        Toast Banner (Supports %Var%)
                      </span>
                      <input
                        type="text"
                        value={rule.message || ''}
                        onChange={(e) =>
                          updateRuleById(rule.id, { message: e.target.value })
                        }
                        placeholder="e.g. Score: %Score%!"
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================================ */}
      {/* PANEL C: ARTICULATE STORYLINE OBJECT STATES & BUTTON SETS TRAY               */}
      {/* ============================================================================ */}
      {showStatesTray && (
        <div className="p-4 rounded-3xl bg-slate-950 text-white border-2 border-amber-500/40 shadow-2xl space-y-4 animate-in slide-in-from-top-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Sparkles size={16} className="text-amber-400" />
              <span className="text-xs font-black uppercase tracking-widest text-amber-300">
                Storyline Object States & Button Set Studio
              </span>
              {activeSelectedEntity ? (
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black">
                  Target: {activeSelectedEntity.label || activeSelectedEntity.id}
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-bold">
                  Select any card on the canvas to configure its interactive states
                </span>
              )}
            </div>

            {activeSelectedEntity && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-400">Initial State:</span>
                  <select
                    value={activeSelectedEntity.initialState || 'normal'}
                    onChange={(e) => updateSelectedFields({ initialState: e.target.value })}
                    className="bg-transparent text-xs font-black text-amber-300 outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="hidden">Hidden</option>
                    <option value="disabled">Disabled</option>
                    <option value="selected">Selected</option>
                    <option value="visited">Visited</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    updateSelectedFields({
                      requireVisited: !activeSelectedEntity.requireVisited,
                      anchored: !activeSelectedEntity.requireVisited
                        ? true
                        : activeSelectedEntity.anchored,
                      draggable: !activeSelectedEntity.requireVisited
                        ? false
                        : activeSelectedEntity.draggable
                    })
                  }
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${
                    activeSelectedEntity.requireVisited
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Eye size={12} />
                  {activeSelectedEntity.requireVisited ? 'Must Visit: ON' : 'Must Visit: OFF'}
                </button>

                {activeSelectedEntity.buttonSet && (
                  <button
                    type="button"
                    onClick={() =>
                      updateSelectedFields({
                        isCorrectSelect: !activeSelectedEntity.isCorrectSelect
                      })
                    }
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${
                      activeSelectedEntity.isCorrectSelect
                        ? 'bg-amber-500 text-slate-950 border-amber-300'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <Radio size={12} />
                    {activeSelectedEntity.isCorrectSelect
                      ? 'Correct Set Choice ✓'
                      : 'Mark as Correct Choice'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowStatesTray(false)}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>
            )}
          </div>

          {activeSelectedEntity && activeSelectedEntity.entityType !== 'bg_shape' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {BUILTIN_STATE_KEYS.map((st) => {
                  const isEditingThis = activeEditingState === st.id;
                  const isConfigured =
                    st.id === 'normal' || Boolean(activeSelectedEntity.states?.[st.id]);
                  const previewEnt = resolveEntityVisualState(activeSelectedEntity, st.id);
                  const previewPalette =
                    COLOR_STYLES[previewEnt.color || 'indigo'] || COLOR_STYLES.indigo;

                  return (
                    <div
                      key={st.id}
                      onClick={() => handleActivateOrCreateState(st.id)}
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                        isEditingThis
                          ? 'bg-indigo-950/70 border-amber-400 ring-2 ring-amber-400/40'
                          : isConfigured
                          ? 'bg-slate-900 border-slate-700 hover:border-indigo-400'
                          : 'bg-slate-900/40 border-dashed border-slate-800 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-white">
                          {st.label}
                        </span>
                        {st.id !== 'normal' && isConfigured && (
                          <button
                            type="button"
                            title="Remove State Override"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStateOverride(st.id);
                            }}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>

                      <div
                        className={`px-3 py-2 rounded-xl text-center truncate text-xs font-black border ${previewPalette.bg} ${previewPalette.border}`}
                      >
                        {previewEnt.label || '(Empty)'}
                      </div>

                      <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                        <span>{isConfigured ? 'Configured ✓' : '+ Tap to Create'}</span>
                        {isEditingThis && (
                          <span className="text-amber-400 font-black uppercase">Editing</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Custom States:
                  </span>
                  {Object.keys(activeSelectedEntity.states || {})
                    .filter((k) => !BUILTIN_STATE_KEYS.some((b) => b.id === k))
                    .map((customKey) => (
                      <button
                        key={customKey}
                        type="button"
                        onClick={() => setActiveEditingState(customKey)}
                        className={`px-3 py-1 rounded-xl text-xs font-black uppercase border flex items-center gap-1.5 ${
                          activeEditingState === customKey
                            ? 'bg-amber-400 text-slate-950 border-amber-300'
                            : 'bg-slate-900 text-indigo-300 border-slate-700'
                        }`}
                      >
                        <span>{customKey}</span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStateOverride(customKey);
                          }}
                          className="hover:text-rose-500"
                        >
                          ×
                        </span>
                      </button>
                    ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customStateInput}
                    onChange={(e) => setCustomStateInput(e.target.value)}
                    placeholder="New custom state (e.g. translated)..."
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white outline-none w-52"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const clean = customStateInput.trim().toLowerCase().replace(/\s+/g, '_');
                      if (!clean) return;
                      handleActivateOrCreateState(clean);
                      setCustomStateInput('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase"
                  >
                    + Add State
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VISUAL LAYER & Z-ORDER TOOLBAR PANEL */}
      {showLayerToolbar && (
        <div className="p-4 rounded-3xl bg-slate-900 text-white border border-slate-700 shadow-xl space-y-3 animate-in slide-in-from-top-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Layers size={15} className="text-amber-400" />
              <span className="text-xs font-black uppercase tracking-widest">
                Layer Stack & Background Group Presets
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
                  className={`px-3.5 py-2.5 rounded-2xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
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
                      className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white"
                    >
                      <ChevronsDown size={14} />
                    </button>
                    <button
                      type="button"
                      title="Step Backward"
                      onClick={() => adjustLayerZOrder(item.kind, item.id, 'backward')}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      title="Step Forward"
                      onClick={() => adjustLayerZOrder(item.kind, item.id, 'forward')}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      title="Bring to Front"
                      onClick={() => adjustLayerZOrder(item.kind, item.id, 'front')}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white"
                    >
                      <ChevronsUp size={14} />
                    </button>
                    <button
                      type="button"
                      title={item.locked ? 'Unlock Layer in Editor' : 'Lock Layer Position in Editor'}
                      onClick={() =>
                        item.kind === 'entity'
                          ? updateEntityField(item.id, { lockInBuilder: !item.locked })
                          : updateZoneField(item.id, { anchored: !item.locked, lockInBuilder: !item.locked })
                      }
                      className={`p-2 rounded-lg ${
                        item.locked
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {item.locked ? <Lock size={14} /> : <Unlock size={14} />}
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
          className="relative flex-1 w-full overflow-hidden rounded-3xl border-2 border-slate-300 dark:border-slate-700 bg-slate-950 flex justify-center touch-none"
        >
          {/* DOCK POSITION 4: FLOATING / PINNABLE OVER-CANVAS TASK BAR */}
          {taskbarDock === 'floating' && renderContextualTaskBar(true)}

          <div
            ref={stageRef}
            onPointerDown={(e) => {
              builderRootRef.current?.focus();
              if (!e.shiftKey && !touchMultiSelectActive) {
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
            className={`relative shrink-0 select-none overflow-hidden touch-none ${activeThemeClass}`}
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
                    onPointerDown={(e) => {
                      builderRootRef.current?.focus();
                      startMoveItem(e, 'entity', shape);
                    }}
                    style={{
                      left: `${shape.x}%`,
                      top: `${shape.y}%`,
                      width: `${shape.width || 44}%`,
                      height: `${shape.height || 36}%`,
                      backgroundColor: `${palette.softBg}${fillAlpha})`,
                      transform: `translate(-50%, -50%) rotate(${shape.rotation || 0}deg)`,
                      zIndex: shape.zOrder ?? 2
                    }}
                    className={`group absolute ${radiusClass} ${borderStyleClass} ${palette.border} p-6 flex flex-col items-start justify-start transition-shadow touch-none ${
                      shape.lockInBuilder ? 'cursor-default' : 'cursor-move'
                    } ${isSelected ? 'ring-4 ring-amber-400' : ''}`}
                  >
                    {!shape.lockInBuilder && (
                      <button
                        type="button"
                        title="Drag to Move"
                        onPointerDown={(e) => {
                          builderRootRef.current?.focus();
                          startMoveItem(e, 'entity', shape);
                        }}
                        className={`absolute ${handleBtnSize} rounded-full bg-slate-900 hover:bg-purple-600 text-white border-2 border-white flex items-center justify-center shadow-lg cursor-move z-30 touch-none`}
                      >
                        <Move size={handleIconPx} />
                      </button>
                    )}

                    <button
                      type="button"
                      title="Select"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        builderRootRef.current?.focus();
                        selectOrToggleItem('entity', shape.id, e.shiftKey);
                      }}
                      className={`absolute ${menuBtnSize} rounded-full border-2 flex items-center justify-center shadow-lg transition-colors z-30 touch-none ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 border-white'
                          : 'bg-slate-900 hover:bg-purple-600 text-white border-white'
                      }`}
                    >
                      <MoreHorizontal size={handleIconPx} />
                    </button>

                    {!shape.lockInBuilder && (
                      <button
                        type="button"
                        title="Pull Diagonally to Resize Group Shape Width & Height"
                        onPointerDown={(e) => {
                          builderRootRef.current?.focus();
                          startResizeItem(e, 'entity', shape);
                        }}
                        className={`absolute ${resizeBtnSize} rounded-full bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-white flex items-center justify-center shadow-lg cursor-nwse-resize z-30 touch-none`}
                      >
                        <MoveDiagonal2 size={handleIconPx} />
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
                  onPointerDown={(e) => {
                    builderRootRef.current?.focus();
                    startMoveItem(e, 'zone', z);
                  }}
                  style={{
                    left: `${z.x}%`,
                    top: `${z.y}%`,
                    width: `${z.width || 24}%`,
                    height: `${z.height || 24}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: z.zOrder ?? (isSelected ? 25 : 10)
                  }}
                  className={`group absolute rounded-[2rem] ${zBorderClass} p-5 flex flex-col items-center justify-start cursor-move transition-colors touch-none ${
                    isSelected
                      ? 'border-amber-400 bg-amber-500/15 ring-4 ring-amber-400/60'
                      : `${zPalette.border} bg-slate-900/35`
                  }`}
                >
                  {!z.lockInBuilder && (
                    <button
                      type="button"
                      title="Drag to Move Drop Zone"
                      onPointerDown={(e) => {
                        builderRootRef.current?.focus();
                        startMoveItem(e, 'zone', z);
                      }}
                      className={`absolute ${handleBtnSize} rounded-full bg-slate-900 hover:bg-indigo-600 text-white border-2 border-slate-600 flex items-center justify-center shadow-lg cursor-move z-30 touch-none`}
                    >
                      <Move size={handleIconPx} />
                    </button>
                  )}

                  <button
                    type="button"
                    title="Select Zone"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      builderRootRef.current?.focus();
                      selectOrToggleItem('zone', z.id, e.shiftKey);
                    }}
                    className={`absolute ${menuBtnSize} rounded-full border-2 flex items-center justify-center shadow-lg transition-colors z-30 touch-none ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 border-white'
                        : 'bg-slate-900 hover:bg-indigo-600 text-white border-slate-600'
                    }`}
                  >
                    <MoreHorizontal size={handleIconPx} />
                  </button>

                  {!z.lockInBuilder && (
                    <button
                      type="button"
                      title="Pull Diagonally to Resize Zone Width & Height"
                      onPointerDown={(e) => {
                        builderRootRef.current?.focus();
                        startResizeItem(e, 'zone', z);
                      }}
                      className={`absolute ${resizeBtnSize} rounded-full bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-white flex items-center justify-center shadow-lg cursor-nwse-resize z-30 touch-none`}
                    >
                      <MoveDiagonal2 size={handleIconPx} />
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
              .map((rawEnt: any) => {
                const isSelected = isItemSelected('entity', rawEnt.id);
                const ent =
                  isSelected && activeEditingState !== 'normal'
                    ? resolveEntityVisualState(rawEnt, activeEditingState)
                    : rawEnt;

                const palette = COLOR_STYLES[ent.color || 'indigo'] || COLOR_STYLES.indigo;
                const borderStyleClass =
                  BORDER_STYLE_CLASSES[ent.borderStyle || 'solid'] || BORDER_STYLE_CLASSES.solid;
                const radiusClass =
                  SHAPE_RADIUS_CLASSES[ent.shapeVariant || 'banner'] || 'rounded-2xl';
                const stateCount = Object.keys(rawEnt.states || {}).length;

                return (
                  <div
                    key={rawEnt.id}
                    onPointerDown={(e) => {
                      builderRootRef.current?.focus();
                      startMoveItem(e, 'entity', rawEnt);
                    }}
                    style={{
                      left: `${rawEnt.x}%`,
                      top: `${rawEnt.y}%`,
                      width: rawEnt.width ? `${rawEnt.width}%` : undefined,
                      height: rawEnt.height ? `${rawEnt.height}%` : undefined,
                      transform: `translate(-50%, -50%) scale(${ent.scale || 1}) rotate(${
                        rawEnt.rotation || 0
                      }deg)`,
                      zIndex: rawEnt.zOrder ?? (isSelected ? 55 : 35)
                    }}
                    className={`group absolute px-7 py-4 ${radiusClass} ${borderStyleClass} shadow-xl cursor-move flex items-center justify-center touch-none ${
                      rawEnt.anchored && stateCount === 0 && !rawEnt.buttonSet
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
                    {!rawEnt.lockInBuilder && (
                      <button
                        type="button"
                        title="Drag in 4 Directions to Move"
                        onPointerDown={(e) => {
                          builderRootRef.current?.focus();
                          startMoveItem(e, 'entity', rawEnt);
                        }}
                        className={`absolute ${handleBtnSize} rounded-full bg-slate-900 hover:bg-indigo-600 text-white border-2 border-white/80 flex items-center justify-center shadow-lg cursor-move z-30 touch-none`}
                      >
                        <Move size={handleIconPx} />
                      </button>
                    )}

                    <button
                      type="button"
                      title="Tap to Select"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        builderRootRef.current?.focus();
                        selectOrToggleItem('entity', rawEnt.id, e.shiftKey);
                      }}
                      className={`absolute ${menuBtnSize} rounded-full border-2 flex items-center justify-center shadow-lg transition-colors z-30 touch-none ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 border-white'
                          : 'bg-slate-900 hover:bg-indigo-600 text-white border-white/80'
                      }`}
                    >
                      <MoreHorizontal size={handleIconPx} />
                    </button>

                    {!rawEnt.lockInBuilder && (
                      <button
                        type="button"
                        title="Pull Diagonally to Resize Box"
                        onPointerDown={(e) => {
                          builderRootRef.current?.focus();
                          startResizeItem(e, 'entity', rawEnt);
                        }}
                        className={`absolute ${resizeBtnSize} rounded-full bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-white flex items-center justify-center shadow-lg cursor-nwse-resize z-30 touch-none`}
                      >
                        <MoveDiagonal2 size={handleIconPx} />
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      {rawEnt.anchored && (
                        <span title="Anchored to Stage" className="inline-flex">
                          <Pin size={15} className="text-amber-400 rotate-45" />
                        </span>
                      )}
                      {rawEnt.connectTargetId && (
                        <span title="Linked Connector Node" className="inline-flex">
                          <Link2 size={15} className="text-cyan-200" />
                        </span>
                      )}
                      {rawEnt.buttonSet && (
                        <span
                          title={`Button Set: ${rawEnt.buttonSet}`}
                          className="px-1.5 py-0.5 rounded bg-black/30 text-[9px] font-black uppercase text-amber-300"
                        >
                          {rawEnt.buttonSet}
                        </span>
                      )}
                      {stateCount > 0 && (
                        <span
                          title={`${stateCount + 1} States Configured`}
                          className="px-1.5 py-0.5 rounded bg-black/30 text-[9px] font-black uppercase text-cyan-200"
                        >
                          {stateCount + 1} States
                        </span>
                      )}
                      <div className="text-center">
                        <div className="text-lg font-black">{ent.label || '(Empty Block)'}</div>
                        <div className="text-[11px] font-bold opacity-80">
                          {ent.sublabel}{' '}
                          {rawEnt.width
                            ? `• (${rawEnt.width}% × ${rawEnt.height || 10}%)`
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
