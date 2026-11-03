// src/components/instructor/BuilderHub.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Layers, BookOpen, FileText, Gamepad2, X, Edit3, Eye, Zap, Map, 
  Wrench, Search, Loader2, Volume2, AlertCircle, ArrowLeft, PenTool,
  Sparkles, Plus, Trash2, BookText, Link as LinkIcon, School, HelpCircle,
  Rocket, Globe, Check
} from 'lucide-react';
import { doc, setDoc, onSnapshot, deleteDoc, arrayUnion } from 'firebase/firestore';
import { db, appId, auth } from '../../config/firebase';
import { JuicyToast } from '../Toast';
import CardBuilderView from './CardBuilderView';
import LessonBuilderView from './LessonBuilderView';
import ExamBuilderView from './ExamBuilderView';
import ArcadeBuilderView from './ArcadeBuilderView';
import CurriculumBuilderView from './CurriculumBuilderView';
import LivePreview from '../LivePreview';
import { KineticCanvasBuilder } from '../LessonBlocks';
import MarbleScrabble from '../MarbleScrabble';

// ============================================================================
//  KINETIC CANVAS PRESET TEMPLATES (CLASSIC + 7-MODE STORYLINE 360 PRESETS)
// ============================================================================
const KINETIC_PRESETS: Record<string, any> = {
    blank: {
        title: 'Custom Blank Canvas',
        subtitle: 'Drag objects or click interactive elements on the slide.',
        backgroundTheme: 'light_grid',
        backgroundUrl: '',
        entities: [],
        zones: [],
        layers: [],
        rules: [],
        timelineKeyframes: []
    },
    sorting: {
        title: 'Category Sorting & Chronological Sequencing',
        subtitle: '1. Sort the vocabulary cards into the Noun & Verb buckets (2/2 capacity each) ➔ 2. Order the 3 steps into Slots #1, #2, and #3.',
        backgroundTheme: 'light_grid',
        backgroundUrl: '',
        successAnimation: 'bounce_glow',
        entities: [
            { id: 'ent_sort_n1', entityType: 'draggable', label: 'senatus (Senate)', sublabel: 'Noun', color: 'indigo', x: 16, y: 82, scale: 1, rotation: 0, draggable: true, initialState: 'normal', category: 'noun' },
            { id: 'ent_sort_n2', entityType: 'draggable', label: 'gladius (Sword)', sublabel: 'Noun', color: 'indigo', x: 34, y: 82, scale: 1, rotation: 0, draggable: true, initialState: 'normal', category: 'noun' },
            { id: 'ent_sort_v1', entityType: 'draggable', label: 'scribit (Writes)', sublabel: 'Verb', color: 'emerald', x: 16, y: 92, scale: 1, rotation: 0, draggable: true, initialState: 'normal', category: 'verb' },
            { id: 'ent_sort_v2', entityType: 'draggable', label: 'currit (Runs)', sublabel: 'Verb', color: 'emerald', x: 34, y: 92, scale: 1, rotation: 0, draggable: true, initialState: 'normal', category: 'verb' },
            { id: 'ent_seq_2', entityType: 'draggable', label: 'Phase B: Republic', sublabel: 'Step #2', color: 'amber', x: 58, y: 86, scale: 1, rotation: 0, draggable: true, initialState: 'normal', sequenceIndex: 2 },
            { id: 'ent_seq_3', entityType: 'draggable', label: 'Phase C: Empire', sublabel: 'Step #3', color: 'amber', x: 74, y: 86, scale: 1, rotation: 0, draggable: true, initialState: 'normal', sequenceIndex: 3 },
            { id: 'ent_seq_1', entityType: 'draggable', label: 'Phase A: Monarchy', sublabel: 'Step #1', color: 'amber', x: 90, y: 86, scale: 1, rotation: 0, draggable: true, initialState: 'normal', sequenceIndex: 1 }
        ],
        zones: [
            { id: 'zone_bucket_nouns', label: 'Nouns Bucket', sublabel: 'Capacity: 2 Nouns', x: 25, y: 26, width: 38, height: 32, capacity: 2, acceptedCategory: 'noun' },
            { id: 'zone_bucket_verbs', label: 'Verbs Bucket', sublabel: 'Capacity: 2 Verbs', x: 25, y: 58, width: 38, height: 26, capacity: 2, acceptedCategory: 'verb' },
            { id: 'zone_seq_1', label: '1st Era', sublabel: 'Slot #1', x: 74, y: 20, width: 36, height: 18, capacity: 1, sequenceOrder: 1 },
            { id: 'zone_seq_2', label: '2nd Era', sublabel: 'Slot #2', x: 74, y: 42, width: 36, height: 18, capacity: 1, sequenceOrder: 2 },
            { id: 'zone_seq_3', label: '3rd Era', sublabel: 'Slot #3', x: 74, y: 64, width: 36, height: 18, capacity: 1, sequenceOrder: 3 }
        ],
        layers: [],
        rules: [],
        timelineKeyframes: []
    },
    connectors: {
        title: 'SVG Connector-Line Matching & Hotspot Pin Labeling',
        subtitle: '1. Tap a Left Node and tap its matching Right Node to draw an SVG connector line ➔ 2. Drag the labels onto the pulsing 📍 Hotspot Pins.',
        backgroundTheme: 'grid',
        backgroundUrl: '',
        successAnimation: 'combine_flash',
        entities: [
            { id: 'node_l1', entityType: 'connector_node', label: "Idiom: 'Break the ice'", sublabel: 'Tap to connect', color: 'cyan', x: 20, y: 24, scale: 1, rotation: 0, draggable: false, connectTargetId: 'node_r1' },
            { id: 'node_l2', entityType: 'connector_node', label: "Idiom: 'Spill the beans'", sublabel: 'Tap to connect', color: 'cyan', x: 20, y: 46, scale: 1, rotation: 0, draggable: false, connectTargetId: 'node_r2' },
            { id: 'node_r2', entityType: 'connector_node', label: 'Reveal a secret prematurely', sublabel: 'Target Node', color: 'slate', x: 56, y: 24, scale: 1, rotation: 0, draggable: false },
            { id: 'node_r1', entityType: 'connector_node', label: 'Start a friendly conversation', sublabel: 'Target Node', color: 'slate', x: 56, y: 46, scale: 1, rotation: 0, draggable: false },
            { id: 'lbl_pin_1', entityType: 'hotspot_label', label: '🏷️ Apex Core', sublabel: 'Drag to Pin #1', color: 'rose', x: 30, y: 82, scale: 1, rotation: 0, draggable: true, sequenceIndex: 1 },
            { id: 'lbl_pin_2', entityType: 'hotspot_label', label: '🏷️ Basal Valve', sublabel: 'Drag to Pin #2', color: 'amber', x: 65, y: 82, scale: 1, rotation: 0, draggable: true, sequenceIndex: 2 }
        ],
        zones: [
            { id: 'pin_1', label: 'Upper Chamber', x: 85, y: 26, width: 16, height: 16, capacity: 1, sequenceOrder: 1, isHotspotPin: true },
            { id: 'pin_2', label: 'Lower Conduit', x: 85, y: 56, width: 16, height: 16, capacity: 1, sequenceOrder: 2, isHotspotPin: true }
        ],
        layers: [],
        rules: [],
        timelineKeyframes: []
    },
    sliders: {
        title: 'Number-Line Sliders, Text-Entry & Multi-Select Cards',
        subtitle: "1. Set the Thruster Slider to 75 N ➔ 2. Type 'equilibrium' into the Text Box ➔ 3. Select ONLY the 2 true statements on the right.",
        backgroundTheme: 'physics_lab',
        backgroundUrl: '',
        successAnimation: 'lever_tilt',
        entities: [
            { id: 'ent_slider_1', entityType: 'slider', label: 'Thruster Output (Target: 75 N)', x: 26, y: 28, scale: 1, rotation: 0, sliderMin: 0, sliderMax: 100, sliderStep: 5, sliderTarget: 75, sliderTolerance: 0, sliderUnit: ' N' },
            { id: 'ent_text_1', entityType: 'text_input', label: "State when Net Force = 0 (Type 'equilibrium'):", placeholder: 'equilibrium...', expectedText: 'equilibrium, balance, static equilibrium', x: 26, y: 68, scale: 1, rotation: 0 },
            { id: 'ent_ms_1', entityType: 'multi_select', label: 'Force is a vector (magnitude + direction)', sublabel: 'Tap to toggle', color: 'indigo', x: 72, y: 25, scale: 1, rotation: 0, draggable: false, isCorrectSelect: true },
            { id: 'ent_ms_2', entityType: 'multi_select', label: 'Mass and Weight are identical in space', sublabel: 'Tap to toggle', color: 'slate', x: 72, y: 50, scale: 1, rotation: 0, draggable: false, isCorrectSelect: false },
            { id: 'ent_ms_3', entityType: 'multi_select', label: 'Equal opposite torques produce balance', sublabel: 'Tap to toggle', color: 'indigo', x: 72, y: 75, scale: 1, rotation: 0, draggable: false, isCorrectSelect: true }
        ],
        zones: [],
        layers: [],
        rules: [],
        timelineKeyframes: []
    },
    timeline: {
        title: 'Cause-and-Effect Timeline Scrubber & Gated Slide Layer',
        subtitle: '1. Drag the bottom Timeline Scrubber from 0% to 100% to watch the Core expand and reveal the Release Valve ➔ 2. Click the Valve to open the Checkpoint Layer!',
        backgroundTheme: 'roman_road',
        backgroundUrl: '',
        enableTimeline: true,
        successAnimation: 'chariot_march',
        entities: [
            { id: 'ent_tl_core', entityType: 'draggable', label: 'Stage 1: Cold Core (300 K)', sublabel: 'Scrub timeline below', color: 'cyan', x: 25, y: 48, scale: 1, rotation: 0, draggable: false, initialState: 'normal' },
            { id: 'ent_tl_valve', entityType: 'draggable', label: '🔓 Engage Release Valve', sublabel: 'Revealed at 100% — Click to Open Layer', color: 'emerald', x: 75, y: 48, scale: 1, rotation: 0, draggable: false, initialState: 'hidden' }
        ],
        zones: [],
        timelineKeyframes: [
            {
                id: 'kf_0',
                progress: 0,
                title: '0% — Baseline Equilibrium (300 K)',
                description: 'At 0% on the timeline, the thermal core is at rest on the left and the emergency release valve remains hidden.',
                entityOverrides: [
                    { entityId: 'ent_tl_core', x: 25, y: 48, scale: 1, rotation: 0, labelOverride: 'Stage 1: Cold Core (300 K)' },
                    { entityId: 'ent_tl_valve', state: 'hidden' }
                ]
            },
            {
                id: 'kf_50',
                progress: 50,
                title: '50% — Thermal Compression (650 K)',
                description: 'As energy enters the system, the core moves toward the center, expands to 1.3x scale, and tilts 15°.',
                entityOverrides: [
                    { entityId: 'ent_tl_core', x: 48, y: 48, scale: 1.3, rotation: 15, labelOverride: 'Stage 2: Compressing (650 K)' },
                    { entityId: 'ent_tl_valve', state: 'hidden' }
                ]
            },
            {
                id: 'kf_90',
                progress: 90,
                title: '100% — Critical Threshold Reached (1,200 K)',
                description: 'At peak pressure, the core reaches 1.5x scale and reveals the green Release Valve button on the right! Click it now.',
                entityOverrides: [
                    { entityId: 'ent_tl_core', x: 42, y: 48, scale: 1.5, rotation: 30, labelOverride: 'Stage 3: Peak Pressure (1200 K)' },
                    { entityId: 'ent_tl_valve', state: 'normal' }
                ]
            }
        ],
        layers: [
            {
                id: 'layer_tl_quiz',
                name: 'Layer 1: Cause-and-Effect Mastery Gate',
                theme: 'quiz',
                title: 'Thermal Process Verification',
                body: 'You scrubbed the timeline to observe the cause-and-effect sequence and revealed the hidden Release Valve. Answer this check to complete the lab:',
                buttonLabel: 'Complete Lab',
                hasQuiz: true,
                quizQuestion: 'What happened when you scrubbed the timeline past 90%?',
                quizOptions: [
                    { id: 'opt_1', text: 'The core expanded to 1.5x scale and revealed the hidden Release Valve' },
                    { id: 'opt_2', text: 'The core froze at 0 K' }
                ],
                correctOptionId: 'opt_1',
                gateUntilCorrect: true,
                onCloseAction: 'complete_block'
            }
        ],
        rules: [
            {
                id: 'rule_tl_click',
                event: 'on_click',
                entityId: 'ent_tl_valve',
                zoneId: '',
                action: 'show_layer',
                targetLayerId: 'layer_tl_quiz',
                reaction: 'chariot_march',
                message: 'Opening Thermal Verification Layer...',
                isRequired: true
            }
        ]
    },
    grammar: {
        title: 'Grammar & Syntax Assembly: The Roman Road',
        subtitle: 'Drag the Latin words into their grammatical slots to launch the chariot.',
        backgroundTheme: 'roman_road',
        successAnimation: 'chariot_march',
        entities: [
            { id: 'ent_1', label: 'Legatus', sublabel: 'Nominative Subject', color: 'indigo', x: 20, y: 80, scale: 1, rotation: 0, allowResize: false, allowRotate: false, variableName: 'Subject' },
            { id: 'ent_2', label: 'epistulam', sublabel: 'Accusative Object', color: 'amber', x: 50, y: 80, scale: 1, rotation: 0, allowResize: false, allowRotate: false, variableName: 'Object' },
            { id: 'ent_3', label: 'mittit', sublabel: 'Transitive Verb', color: 'emerald', x: 80, y: 80, scale: 1, rotation: 0, allowResize: false, allowRotate: false, variableName: 'Verb' }
        ],
        zones: [
            { id: 'zone_1', label: '1. Nominative (Who?)', x: 22, y: 30, width: 25, height: 24 },
            { id: 'zone_2', label: '2. Accusative (What?)', x: 50, y: 30, width: 25, height: 24 },
            { id: 'zone_3', label: '3. Verb (Action)', x: 78, y: 30, width: 25, height: 24 }
        ],
        rules: [
            { id: 'r1', entityId: 'ent_1', zoneId: 'zone_1', reaction: 'bounce_glow', message: 'Nominative Subject locked!' },
            { id: 'r2', entityId: 'ent_2', zoneId: 'zone_2', reaction: 'combine_flash', message: 'Direct Object connected!' },
            { id: 'r3', entityId: 'ent_3', zoneId: 'zone_3', reaction: 'chariot_march', message: 'Legatus epistulam mittit! The Chariot Rides!' }
        ]
    },
    map: {
        title: 'Interactive Map: Provinces of the Empire',
        subtitle: 'Place the historical legions onto their strategic territories.',
        backgroundTheme: 'parchment',
        successAnimation: 'combine_flash',
        entities: [
            { id: 'ent_1', label: 'Legio X Fretensis', sublabel: 'Eastern Frontier', color: 'rose', x: 25, y: 82, scale: 1, rotation: 0, allowResize: false, allowRotate: false, variableName: 'Garrison A' },
            { id: 'ent_2', label: 'Legio IX Hispana', sublabel: 'Northern Frontier', color: 'indigo', x: 75, y: 82, scale: 1, rotation: 0, allowResize: false, allowRotate: false, variableName: 'Garrison B' }
        ],
        zones: [
            { id: 'zone_1', label: 'Britannia (North)', x: 30, y: 28, width: 28, height: 25 },
            { id: 'zone_2', label: 'Iudaea (East)', x: 72, y: 42, width: 28, height: 25 }
        ],
        rules: [
            { id: 'r1', entityId: 'ent_2', zoneId: 'zone_1', reaction: 'bounce_glow', message: 'Northern border secured!' },
            { id: 'r2', entityId: 'ent_1', zoneId: 'zone_2', reaction: 'combine_flash', message: 'Eastern trade routes active!' }
        ]
    },
    physics: {
        title: 'Physics & Forces Lab: Vector Equilibrium',
        subtitle: 'Place the Force Vector on the fulcrum, resize to 1.5x, and tilt to 30°.',
        backgroundTheme: 'physics_lab',
        successAnimation: 'lever_tilt',
        entities: [
            { id: 'ent_1', label: 'Force Vector →', sublabel: 'Scale 1.5x • Tilt 30°', color: 'cyan', x: 30, y: 78, scale: 1, rotation: 0, allowResize: true, allowRotate: true, targetScale: 1.5, targetRotation: 30, variableName: 'Torque Vector' },
            { id: 'ent_2', label: '50kg Counterweight', sublabel: 'Anchor Mass', color: 'amber', x: 70, y: 78, scale: 1, rotation: 0, allowResize: false, allowRotate: false, variableName: 'Load Mass' }
        ],
        zones: [
            { id: 'zone_1', label: 'Fulcrum Vector Node', x: 35, y: 35, width: 30, height: 26 },
            { id: 'zone_2', label: 'Lever Load Plate', x: 70, y: 35, width: 28, height: 26 }
        ],
        rules: [
            { id: 'r1', entityId: 'ent_1', zoneId: 'zone_1', reaction: 'lever_tilt', message: 'Vector engaged on Fulcrum!' },
            { id: 'r2', entityId: 'ent_2', zoneId: 'zone_2', reaction: 'bounce_glow', message: 'Counterweight balanced!' }
        ]
    }
};

// ============================================================================
//  SUB-COMPONENT: PHONETIC ENGINE DRAWER
// ============================================================================
const PhoneticEngine = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [word, setWord] = useState('');
    const [ipa, setIpa] = useState<string | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPhonetics = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!word.trim()) return;

        setIsLoading(true);
        setError(null);
        setIpa(null);
        setAudioUrl(null);

        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            if (!response.ok) throw new Error("Word not found in global database.");
            
            const data = await response.json();
            const phonetics = data[0]?.phonetics || [];
            const textEntry = phonetics.find((p: any) => p.text);
            const audioEntry = phonetics.find((p: any) => p.audio && p.audio.length > 0);

            const finalIpa = textEntry?.text || data[0]?.phonetic;

            if (finalIpa) {
                setIpa(finalIpa);
                if (audioEntry) setAudioUrl(audioEntry.audio);
            } else {
                setError("IPA transcription unavailable.");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const playAudio = () => {
        if (audioUrl) {
            const audio = new Audio(audioUrl);
            audio.play().catch(() => {});
        }
    };

    return (
        <div className={`absolute top-0 right-0 bottom-0 w-full sm:w-96 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-l border-slate-200 dark:border-slate-800 shadow-2xl z-[9000] transition-transform duration-500 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-500/5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
                        <Volume2 size={16} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest">Phonetic Engine</h3>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <X size={18} strokeWidth={2.5} />
                </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
                <form onSubmit={fetchPhonetics} className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        value={word}
                        onChange={(e) => setWord(e.target.value)}
                        placeholder="Target word..."
                        className="w-full pl-12 pr-24 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white font-semibold transition-all text-sm"
                    />
                    <button 
                        type="submit"
                        disabled={isLoading || !word.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition-colors shadow-sm"
                    >
                        {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'Scan'}
                    </button>
                </form>

                {error && (
                    <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl mb-6">
                        <AlertCircle size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{error}</span>
                    </div>
                )}

                {ipa && (
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] animate-in zoom-in-95 duration-300 relative overflow-hidden group">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">IPA Output</span>
                        <h2 className="text-3xl font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-wider mb-8">
                            {ipa}
                        </h2>
                        
                        {audioUrl && (
                            <button 
                                onClick={playAudio}
                                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-95 shadow-sm"
                            >
                                <Volume2 size={16} /> Play Pronunciation
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================================================
//  🔥 BUILT-IN READING & SOURCE LINK STUDIO (CREATE, LINK & ASSIGN TO COHORTS)
// ============================================================================
const ReadingStudioPanel = ({
    lessons = [],
    instructorClasses = [],
    onSaveLesson,
    onAssign,
    onToast
}: any) => {
    const existingReadings = useMemo(
        () => (lessons || []).filter((l: any) => l?.type === 'reading' || l?.contentType === 'reading'),
        [lessons]
    );

    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [language, setLanguage] = useState('la');
    const [readingMode, setReadingMode] = useState<'passage' | 'external_link' | 'hybrid'>('hybrid');
    const [externalUrl, setExternalUrl] = useState('');
    const [sourceCitation, setSourceCitation] = useState('');
    const [xp, setXp] = useState<number>(60);
    const [content, setContent] = useState('');
    const [glossary, setGlossary] = useState<any[]>([]);
    const [checkpoints, setCheckpoints] = useState<any[]>([]);

    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
    const [newTerm, setNewTerm] = useState('');
    const [newPos, setNewPos] = useState('noun');
    const [newDef, setNewDef] = useState('');

    const resetReadingForm = () => {
        setEditingId(null);
        setTitle('');
        setSubtitle('');
        setLanguage('la');
        setReadingMode('hybrid');
        setExternalUrl('');
        setSourceCitation('');
        setXp(60);
        setContent('');
        setGlossary([]);
        setCheckpoints([]);
        setSelectedClassIds([]);
    };

    const loadReadingForEdit = (r: any) => {
        setEditingId(r.id);
        setTitle(r.title || '');
        setSubtitle(r.subtitle || r.description || '');
        setLanguage(r.language || 'la');
        setReadingMode(r.readingMode || (r.externalUrl && !r.content ? 'external_link' : 'hybrid'));
        setExternalUrl(r.externalUrl || '');
        setSourceCitation(r.sourceCitation || '');
        setXp(r.xp || 60);
        setContent(r.content || '');
        setGlossary(Array.isArray(r.glossary) ? r.glossary : []);
        setCheckpoints(Array.isArray(r.checkpoints) ? r.checkpoints : []);
    };

    const addGlossTerm = () => {
        if (!newTerm.trim() || !newDef.trim()) return;
        setGlossary(prev => [
            ...prev,
            { id: `gl_${Date.now()}`, term: newTerm.trim(), partOfSpeech: newPos, definition: newDef.trim() }
        ]);
        setNewTerm('');
        setNewDef('');
    };

    const addCheckpointQuestion = () => {
        setCheckpoints(prev => [
            ...prev,
            {
                id: `cp_${Date.now()}`,
                question: 'Comprehension question...',
                options: [
                    { id: 'a', text: 'Option A' },
                    { id: 'b', text: 'Option B' },
                    { id: 'c', text: 'Option C' }
                ],
                correctId: 'a'
            }
        ]);
    };

    const assignReadingToClassEverywhere = async (classId: string, readingPayload: any) => {
        const assignmentEntry = {
            id: readingPayload.id,
            lessonId: readingPayload.id,
            title: readingPayload.title,
            description: readingPayload.subtitle || readingPayload.description || 'Assigned Reading',
            type: 'reading',
            contentType: 'reading',
            cohortId: null,
            assignedAt: Date.now()
        };

        if (onAssign) {
            await onAssign(classId, assignmentEntry);
        }

        // Also write directly to Firestore classes/{classId} so it works even if onAssign wasn't passed down
        await setDoc(
            doc(db, 'artifacts', appId, 'classes', classId),
            { assignments: arrayUnion(assignmentEntry) },
            { merge: true }
        ).catch(() => {});

        const uid = auth?.currentUser?.uid;
        if (uid) {
            await setDoc(
                doc(db, 'artifacts', appId, 'users', uid, 'classes', classId),
                { assignments: arrayUnion(assignmentEntry) },
                { merge: true }
            ).catch(() => {});
        }
    };

    const handleSaveAndPublishReading = async () => {
        if (!title.trim()) {
            if (onToast) onToast('Please enter a title for the reading passage.');
            return;
        }
        const readingId = editingId || `reading_${Date.now()}`;
        const payload = {
            id: readingId,
            title: title.trim(),
            subtitle: subtitle.trim(),
            description: subtitle.trim() || 'Assigned reading & annotation passage.',
            language,
            type: 'reading',
            contentType: 'reading',
            readingMode,
            externalUrl: externalUrl.trim(),
            sourceCitation: sourceCitation.trim(),
            xp: Number(xp) || 60,
            content,
            glossary,
            checkpoints,
            blocks: [
                {
                    type: 'text',
                    title: title.trim(),
                    content: content || `External Resource: ${externalUrl}`
                }
            ],
            updatedAt: Date.now()
        };

        // Save directly to custom_lessons so it is immediately available in the global library
        await setDoc(doc(db, 'artifacts', appId, 'custom_lessons', readingId), payload, { merge: true }).catch(() => {});
        if (onSaveLesson) {
            await onSaveLesson(payload, readingId);
        }

        for (const cId of selectedClassIds) {
            await assignReadingToClassEverywhere(cId, payload);
        }

        if (onToast) {
            onToast(
                selectedClassIds.length > 0
                    ? `Reading saved & assigned to ${selectedClassIds.length} class(es)! 📖`
                    : 'Reading saved to Library! 📖'
            );
        }
        resetReadingForm();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: Reading & Link Authoring */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                        <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                            Reading & Source Link Studio
                        </span>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                            {editingId ? `Editing: ${title}` : 'Create or Link an Assigned Reading'}
                        </h3>
                    </div>
                    {editingId && (
                        <button
                            type="button"
                            onClick={resetReadingForm}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-black uppercase"
                        >
                            + New Blank
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    {[
                        { id: 'passage', label: '📖 Passage Only' },
                        { id: 'external_link', label: '🔗 External URL / PDF' },
                        { id: 'hybrid', label: '⚡ Passage + Link' }
                    ].map((m) => (
                        <button
                            key={m.id}
                            type="button"
                            onClick={() => setReadingMode(m.id as any)}
                            className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                readingMode === m.id
                                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                                    : 'text-slate-500'
                            }`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                    <div className="sm:col-span-6">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Reading Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Caesar's De Bello Gallico (I.1)"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-black outline-none"
                        />
                    </div>
                    <div className="sm:col-span-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Language Lock</label>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-black outline-none"
                        >
                            <option value="la">Latin (la)</option>
                            <option value="es">Spanish (es)</option>
                            <option value="en">English (en)</option>
                            <option value="fr">French (fr)</option>
                            <option value="de">German (de)</option>
                        </select>
                    </div>
                    <div className="sm:col-span-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Reward XP</label>
                        <input
                            type="number"
                            value={xp}
                            onChange={(e) => setXp(parseInt(e.target.value) || 60)}
                            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-black outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                        Student Instructions / Context Subtitle
                    </label>
                    <input
                        type="text"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="Read the passage, click underlined words for glossary notes, and annotate key clauses..."
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold outline-none"
                    />
                </div>

                {(readingMode === 'external_link' || readingMode === 'hybrid') && (
                    <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-500/30 space-y-2.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                            <LinkIcon size={13} /> External Resource URL (PDF, Perseus Digital Library, Google Doc, or Article)
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                            <input
                                type="url"
                                value={externalUrl}
                                onChange={(e) => setExternalUrl(e.target.value)}
                                placeholder="https://..."
                                className="sm:col-span-8 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                            />
                            <input
                                type="text"
                                value={sourceCitation}
                                onChange={(e) => setSourceCitation(e.target.value)}
                                placeholder="Source Citation (optional)"
                                className="sm:col-span-4 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                            />
                        </div>
                    </div>
                )}

                {(readingMode === 'passage' || readingMode === 'hybrid') && (
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                            Passage Content (Separate paragraphs with a new line so students can annotate each section)
                        </label>
                        <textarea
                            rows={8}
                            lang={language}
                            translate="no"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Gallia est omnis divisa in partes tres..."
                            className="notranslate w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-serif leading-relaxed outline-none custom-scrollbar"
                        />
                    </div>
                )}

                {/* Interactive Glossary Builder */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                        Tap-to-Define Glossary ({glossary.length} terms)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <input
                            type="text"
                            translate="no"
                            value={newTerm}
                            onChange={(e) => setNewTerm(e.target.value)}
                            placeholder="Word in text (e.g. divisa)"
                            className="notranslate sm:col-span-4 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-black"
                        />
                        <select
                            value={newPos}
                            onChange={(e) => setNewPos(e.target.value)}
                            className="sm:col-span-2 px-2 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                        >
                            <option value="noun">Noun</option>
                            <option value="verb">Verb</option>
                            <option value="adj">Adj</option>
                            <option value="prep">Prep</option>
                        </select>
                        <input
                            type="text"
                            value={newDef}
                            onChange={(e) => setNewDef(e.target.value)}
                            placeholder="Definition / morphology note..."
                            className="sm:col-span-4 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                        />
                        <button
                            type="button"
                            onClick={addGlossTerm}
                            className="sm:col-span-2 py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase"
                        >
                            + Add
                        </button>
                    </div>
                    {glossary.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {glossary.map((g) => (
                                <span
                                    key={g.id}
                                    className="px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border text-xs flex items-center gap-1.5"
                                >
                                    <strong translate="no" className="notranslate text-indigo-600">{g.term}</strong>: {g.definition}
                                    <button
                                        type="button"
                                        onClick={() => setGlossary(glossary.filter(i => i.id !== g.id))}
                                        className="text-slate-400 hover:text-rose-500"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Checkpoints */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Comprehension Checkpoints ({checkpoints.length})
                        </span>
                        <button
                            type="button"
                            onClick={addCheckpointQuestion}
                            className="px-3 py-1 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase"
                        >
                            + Add Question
                        </button>
                    </div>
                    {checkpoints.map((cp, idx) => (
                        <div key={cp.id} className="p-3 rounded-xl bg-white dark:bg-slate-900 border space-y-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={cp.question}
                                    onChange={(e) => {
                                        const next = [...checkpoints];
                                        next[idx] = { ...cp, question: e.target.value };
                                        setCheckpoints(next);
                                    }}
                                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border text-xs font-black"
                                />
                                <button
                                    type="button"
                                    onClick={() => setCheckpoints(checkpoints.filter(i => i.id !== cp.id))}
                                    className="text-rose-500"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {cp.options.map((opt: any, oIdx: number) => (
                                    <div key={opt.id} className="flex items-center gap-1">
                                        <input
                                            type="radio"
                                            checked={cp.correctId === opt.id}
                                            onChange={() => {
                                                const next = [...checkpoints];
                                                next[idx] = { ...cp, correctId: opt.id };
                                                setCheckpoints(next);
                                            }}
                                        />
                                        <input
                                            type="text"
                                            value={opt.text}
                                            onChange={(e) => {
                                                const next = [...checkpoints];
                                                const opts = [...cp.options];
                                                opts[oIdx] = { ...opt, text: e.target.value };
                                                next[idx] = { ...cp, options: opts };
                                                setCheckpoints(next);
                                            }}
                                            className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-950 border text-[11px] font-bold"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right 4 Cols: Assign to Cohorts & Saved Readings Library */}
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                        Assign to Classes / Cohorts
                    </span>
                    <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar">
                        {(instructorClasses || []).map((cls: any) => {
                            const isChecked = selectedClassIds.includes(cls.id);
                            return (
                                <label
                                    key={cls.id}
                                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer ${
                                        isChecked
                                            ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-500'
                                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                                    }`}
                                >
                                    <div>
                                        <div className="text-xs font-black text-slate-800 dark:text-white">{cls.name}</div>
                                        <div className="text-[10px] font-bold text-slate-400">Code: {cls.code}</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() =>
                                            setSelectedClassIds(prev =>
                                                isChecked ? prev.filter(id => id !== cls.id) : [...prev, cls.id]
                                            )
                                        }
                                    />
                                </label>
                            );
                        })}
                        {(!instructorClasses || instructorClasses.length === 0) && (
                            <p className="text-xs text-slate-400 font-bold">No classes created yet—reading will save to your Vault.</p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleSaveAndPublishReading}
                        className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
                    >
                        <School size={15} />
                        {selectedClassIds.length > 0
                            ? `Save & Assign to ${selectedClassIds.length} Class(es)`
                            : 'Save Reading to Library'}
                    </button>
                </div>

                {/* Existing Readings Quick-Assign */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                        Saved Readings ({existingReadings.length})
                    </h4>
                    <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar">
                        {existingReadings.map((r: any) => (
                            <div key={r.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-black text-slate-800 dark:text-white truncate">{r.title}</span>
                                    <button
                                        type="button"
                                        onClick={() => loadReadingForEdit(r)}
                                        className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase shrink-0"
                                    >
                                        Edit
                                    </button>
                                </div>
                                {instructorClasses?.length > 0 && (
                                    <select
                                        defaultValue=""
                                        onChange={async (e) => {
                                            if (e.target.value) {
                                                await assignReadingToClassEverywhere(e.target.value, r);
                                                if (onToast) onToast(`Assigned "${r.title}" to class! 📖`);
                                                e.target.value = '';
                                            }
                                        }}
                                        className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border text-[10px] font-black"
                                    >
                                        <option value="">+ Quick-Assign to Class...</option>
                                        {instructorClasses.map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
//  MAIN BUILDER HUB
// ============================================================================
export default function BuilderHub({ 
  userData,
  onSaveCard, 
  onUpdateCard, 
  onDeleteCard, 
  onSaveLesson,
  onSaveCurriculum, 
  onAssign,
  onStartMarbleScrabble,
  allDecks, 
  onPublishDeck,       
  instructorClasses = [],   
  lessons = [], 
  curriculums = [], 
  initialMode, 
  onClearMode,
  targetLessonId,      
  clearTargetLesson    
}: any) {
  const [lessonData, setLessonData] = useState<any>({ title: '', subtitle: '', language: 'la', blocks: [], theme: 'indigo' });
  const [mode, setMode] = useState<'card' | 'lesson' | 'reading' | 'exam' | 'arcade' | 'curriculum'>(initialMode || 'card'); 
  
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [triggerAiModal, setTriggerAiModal] = useState(false);

  // 🔥 Live WordForge Host Modal State (Allows launching WordForge directly from BuilderHub!)
  const [wfLaunchClassId, setWfLaunchClassId] = useState<string>(instructorClasses?.[0]?.id || '');
  const [wfSelectedDeckKey, setWfSelectedDeckKey] = useState<string>('salutationes');
  const [activeWordForgeHost, setActiveWordForgeHost] = useState<{ classId: string; block: any } | null>(null);
  const [wfLiveState, setWfLiveState] = useState<any>({});

  useEffect(() => {
    if (!wfLaunchClassId && instructorClasses?.length > 0) {
      setWfLaunchClassId(instructorClasses[0].id);
    }
  }, [instructorClasses, wfLaunchClassId]);

  // Sync live_sessions/{classId} when hosting WordForge directly from BuilderHub
  useEffect(() => {
    if (!activeWordForgeHost?.classId) return;
    const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', activeWordForgeHost.classId);
    const unsub = onSnapshot(sessionRef, (snap) => {
      if (snap.exists()) {
        setWfLiveState(snap.data() as Record<string, any>);
      }
    });
    return () => unsub();
  }, [activeWordForgeHost?.classId]);

  const handleUpdateWordForgeSession = useCallback(
    async (updates: any) => {
      if (!activeWordForgeHost?.classId) return;
      const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', activeWordForgeHost.classId);
      await setDoc(
        sessionRef,
        {
          ...updates,
          classId: activeWordForgeHost.classId,
          type: 'marble-scrabble',
          currentQuestion: {
            ...activeWordForgeHost.block,
            gameType: 'marble-scrabble'
          },
          updatedAt: Date.now()
        },
        { merge: true }
      ).catch(() => {});
    },
    [activeWordForgeHost]
  );

  // Catch intent from Dashboard
  useEffect(() => {
    if (targetLessonId) {
        if (targetLessonId === 'new') {
            setMode('lesson');
            setLessonData({ title: '', subtitle: '', language: 'la', blocks: [], theme: 'indigo' });
        } 
        else if (targetLessonId === 'generate') {
            setMode('lesson');
            setLessonData({ title: '', subtitle: '', language: 'la', blocks: [], theme: 'indigo' });
            setTriggerAiModal(true);
        } 
        else {
            const lessonToEdit = lessons.find((l: any) => l.id === targetLessonId);
            if (lessonToEdit) {
                if (lessonToEdit.type === 'reading' || lessonToEdit.contentType === 'reading') {
                    setMode('reading');
                } else {
                    setMode('lesson');
                    setLessonData(lessonToEdit);
                }
            }
        }
        if (clearTargetLesson) clearTargetLesson();
    }
  }, [targetLessonId, lessons, clearTargetLesson]);

  useEffect(() => { if (initialMode) setMode(initialMode); }, [initialMode]);

  useEffect(() => {
      if (mode !== 'lesson' && mode !== 'card') {
          setIsPreviewActive(false);
      }
  }, [mode]);

  const modes = [
    { id: 'card', label: 'Flashcards', icon: <Layers size={16}/> },
    { id: 'lesson', label: 'Interactive Lesson', icon: <BookOpen size={16}/> },
    { id: 'reading', label: 'Readings & Links', icon: <BookText size={16}/> },
    { id: 'exam', label: 'Assessment', icon: <FileText size={16}/> },
    { id: 'arcade', label: 'Arcade & WordForge', icon: <Gamepad2 size={16}/> },
    { id: 'curriculum', label: 'Pathway Map', icon:  } 
  ];

  // --- INJECT A KINETIC CANVAS LAB BLOCK INTO LESSON DATA ---
  const handleAddKineticBlock = (
    presetKey: 'blank' | 'sorting' | 'connectors' | 'sliders' | 'timeline' | 'grammar' | 'map' | 'physics' = 'blank'
  ) => {
    const preset = KINETIC_PRESETS[presetKey] || KINETIC_PRESETS.blank;
    const clonedPreset = JSON.parse(JSON.stringify(preset));
    const newBlock = {
        id: `kinetic_${Date.now()}`,
        type: 'kinetic_canvas',
        ...clonedPreset
    };
    setLessonData((prev: any) => ({
        ...prev,
        blocks: [...(prev.blocks || []), newBlock]
    }));
    setToastMsg(`Added "${clonedPreset.title}" to Lesson! ✨`);
  };

  // --- INJECT A WORDFORGE (MARBLE-SCRABBLE) GAME BLOCK INTO LESSON DATA ---
  const handleAddWordForgeBlockToLesson = () => {
    const chosenDeck = allDecks?.[wfSelectedDeckKey] || Object.values(allDecks || {})[0];
    const deckItems = Array.isArray(chosenDeck?.cards)
      ? chosenDeck.cards.map((c: any) => ({ term: c.front || c.term, definition: c.back || c.definition }))
      : [];

    const wfBlock = {
      id: `wordforge_${Date.now()}`,
      type: 'game',
      gameType: 'marble-scrabble',
      title: `WordForge Arena: ${chosenDeck?.title || 'Vocabulary Discovery'}`,
      timePerTurnSeconds: 90,
      items: deckItems
    };

    setLessonData((prev: any) => ({
      ...prev,
      blocks: [...(prev.blocks || []), wfBlock]
    }));
    setToastMsg('Added 3D WordForge Arena Slide to Lesson! 🎲');
  };

  // --- LAUNCH WORDFORGE LIVE ON SMARTBOARD FOR SELECTED CLASS ---
  const handleLaunchLiveWordForge = () => {
    const targetClsId = wfLaunchClassId || instructorClasses?.[0]?.id || 'LIVE_ARENA';
    const chosenDeck = allDecks?.[wfSelectedDeckKey] || Object.values(allDecks || {})[0];
    const deckItems = Array.isArray(chosenDeck?.cards)
      ? chosenDeck.cards.map((c: any) => ({ term: c.front || c.term, definition: c.back || c.definition }))
      : [];

    if (onStartMarbleScrabble && wfSelectedDeckKey && targetClsId) {
      onStartMarbleScrabble(wfSelectedDeckKey, targetClsId);
      return;
    }

    setActiveWordForgeHost({
      classId: targetClsId,
      block: {
        id: `wf_live_${Date.now()}`,
        type: 'game',
        gameType: 'marble-scrabble',
        title: `WordForge: ${chosenDeck?.title || 'Live Vocabulary Arena'}`,
        timePerTurnSeconds: 90,
        items: deckItems
      }
    });
  };

  const handleUpdateKineticBlock = (blockId: string, updatedBlock: any) => {
    setLessonData((prev: any) => ({
        ...prev,
        blocks: (prev.blocks || []).map((b: any) => b.id === blockId ? updatedBlock : b)
    }));
  };

  const handleRemoveKineticBlock = (blockId: string) => {
    setLessonData((prev: any) => ({
        ...prev,
        blocks: (prev.blocks || []).filter((b: any) => b.id !== blockId)
    }));
  };

  const handleCommit = () => {
    const payload = mode === 'arcade' ? { ...lessonData, type: 'arcade_game' } : lessonData;
    onSaveLesson(payload, lessonData.id || null);
    setToastMsg(mode === 'arcade' ? "Arcade Game Committed! 🎮" : "Unit Committed! 📚");
    if (mode === 'lesson') {
        setLessonData({ title: '', subtitle: '', language: 'la', blocks: [], theme: 'indigo' });
    } else if (mode === 'arcade') {
        setLessonData({ title: '', description: '', gameTemplate: 'connect-three', targetScore: 3, mode: 'pvp', deckIds: [] });
    }
  };

  const kineticBlocks = (lessonData?.blocks || []).filter((b: any) => b?.type === 'kinetic_canvas');

  // If hosting WordForge live directly from BuilderHub, render the full-screen Projector Arena
  if (activeWordForgeHost) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col">
        <button
          type="button"
          onClick={async () => {
            await deleteDoc(doc(db, 'artifacts', appId, 'live_sessions', activeWordForgeHost.classId)).catch(() => {});
            setActiveWordForgeHost(null);
            setWfLiveState({});
          }}
          className="absolute top-4 left-4 z-[9999] bg-slate-900/90 hover:bg-rose-600 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-700 flex items-center gap-1.5 shadow-xl"
        >
          <ArrowLeft size={14} /> End WordForge Broadcast
        </button>
        <MarbleScrabble
          block={activeWordForgeHost.block}
          classId={activeWordForgeHost.classId}
          isProjector={true}
          liveState={wfLiveState}
          studentId="projector"
          onUpdateLiveState={handleUpdateWordForgeSession}
        />
      </div>
    );
  }

  return ( 
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden animate-in fade-in duration-500 relative transition-colors">
      {toastMsg && <JuicyToast message={toastMsg} onClose={() => setToastMsg(null)} />}

      {/* TOP HEADER */}
      <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex justify-between items-center shrink-0 z-40 select-none">
        <div className="flex items-center gap-4 flex-1">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hidden sm:flex">
                <PenTool size={20} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Studio</h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Build, link, and launch curriculum</p>
            </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {mode === 'lesson' && (
            <div className="hidden md:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Globe size={14} className="text-indigo-500" />
              <select
                value={lessonData.language || 'la'}
                onChange={(e) => setLessonData((prev: any) => ({ ...prev, language: e.target.value }))}
                className="bg-transparent text-xs font-black text-slate-700 dark:text-slate-200 outline-none"
                title="Target Language Lock (Prevents Browser Auto-Translate)"
              >
                <option value="la">Lang: Latin (la)</option>
                <option value="es">Lang: Spanish (es)</option>
                <option value="en">Lang: English (en)</option>
                <option value="fr">Lang: French (fr)</option>
                <option value="de">Lang: German (de)</option>
              </select>
            </div>
          )}

          <button 
              onClick={() => setIsToolsOpen(!isToolsOpen)} 
              className={`p-2.5 rounded-xl transition-all border ${isToolsOpen ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300'}`} 
              title="Phonetic Engine"
          >
              <Wrench size={18} />
          </button>
          
          {(mode === 'lesson' || mode === 'card') && (
            <button 
                onClick={() => setIsPreviewActive(!isPreviewActive)} 
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${isPreviewActive ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-500/50'}`}
            >
                <Eye size={16} /> <span className="hidden sm:inline">Preview</span>
            </button>
          )}

          {mode !== 'exam' && mode !== 'card' && mode !== 'curriculum' && mode !== 'reading' && (
            <button onClick={handleCommit} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all active:scale-95 ${mode === 'arcade' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'}`}>
                Save
            </button>
          )}

          {initialMode && (
              <button onClick={onClearMode} className="p-2.5 text-slate-400 hover:text-rose-500 transition-colors ml-2">
                  <X size={20} />
              </button>
          )}
        </div>
      </header>

      {/* TOOLS DRAWER */}
      <PhoneticEngine isOpen={isToolsOpen} onClose={() => setIsToolsOpen(false)} />

      {/* WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="h-full flex flex-col w-full overflow-y-auto custom-scrollbar transition-all duration-500 ease-in-out">
          
          {/* TAB SELECTOR */}
          <div className="w-full px-6 pt-6 pb-2 shrink-0 max-w-6xl mx-auto select-none">
              <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-full sm:w-fit overflow-x-auto shadow-inner border border-slate-200/50 dark:border-slate-800 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {modes.map((m) => {
                      const isActive = mode === m.id;
                      return (
                          <button 
                              key={m.id}
                              onClick={() => {
                                  setMode(m.id as any);
                                  if (m.id === 'arcade') setLessonData({ title: '', description: '', gameTemplate: 'connect-three', targetScore: 3, mode: 'pvp', deckIds: [] });
                                  if (m.id === 'lesson') setLessonData({ title: '', subtitle: '', language: 'la', blocks: [], theme: 'indigo' });
                              }} 
                              className={`flex-1 sm:flex-none min-w-fit px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                  isActive 
                                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700' 
                                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                              }`}
                          >
                              {m.icon}
                              <span>{m.label}</span>
                          </button>
                      );
                  })}
              </div>
          </div>

          {/* BUILDER CONTENT */}
          <div className="flex-1 p-6 md:p-8 pt-4 mx-auto w-full max-w-6xl animate-in fade-in duration-500 space-y-8">
            {mode === 'card' && (
                <CardBuilderView 
                    onSaveCard={onSaveCard} 
                    onUpdateCard={onUpdateCard} 
                    onDeleteCard={onDeleteCard} 
                    availableDecks={allDecks} 
                    onPublishDeck={onPublishDeck} 
                    instructorClasses={instructorClasses} 
                />
            )}

            {mode === 'lesson' && (
                <>
                    {/* 🔥 KINETIC CANVAS 2.0 + WORDFORGE 1-CLICK MULTI-MODAL PRESET DOCK */}
                    <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 rounded-[2.2rem] border border-indigo-500/30 shadow-xl space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                                            Storyline 360 & WordForge Engine • 1-Click Templates
                                        </span>
                                        {kineticBlocks.length > 0 && (
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase">
                                                {kineticBlocks.length} Active in Lesson
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-base sm:text-lg font-black tracking-tight">
                                        Insert an Interactive Kinetic Canvas or WordForge Arena Slide
                                    </h3>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleAddWordForgeBlockToLesson}
                                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                                >
                                    <Plus size={12} /> 🎲 WordForge Arena Slide
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAddKineticBlock('blank')}
                                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 border border-white/15"
                                >
                                    <Plus size={12} /> 📄 Blank Canvas
                                </button>
                            </div>
                        </div>

                        {/* Row 1: The 4 Multi-Modal Storyline 360 Templates */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-white/10">
                            <button
                                type="button"
                                onClick={() => handleAddKineticBlock('sorting')}
                                className="p-3 rounded-2xl bg-indigo-600/90 hover:bg-indigo-500 text-left transition-all active:scale-95 border border-indigo-400/40 shadow-md"
                            >
                                <div className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                                    <Plus size={12} /> 🗂️ Sorting & Order
                                </div>
                                <p className="text-[9px] text-indigo-200 font-bold mt-1 leading-tight">
                                    Capacity buckets + numbered sequence slots
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleAddKineticBlock('connectors')}
                                className="p-3 rounded-2xl bg-cyan-600/90 hover:bg-cyan-500 text-left transition-all active:scale-95 border border-cyan-400/40 shadow-md"
                            >
                                <div className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                                    <Plus size={12} /> 🔗 Connectors & Pins
                                </div>
                                <p className="text-[9px] text-cyan-100 font-bold mt-1 leading-tight">
                                    SVG connector lines + 📍 hotspot pins
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleAddKineticBlock('sliders')}
                                className="p-3 rounded-2xl bg-emerald-600/90 hover:bg-emerald-500 text-left transition-all active:scale-95 border border-emerald-400/40 shadow-md"
                            >
                                <div className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                                    <Plus size={12} /> 🎛️ Sliders & Inputs
                                </div>
                                <p className="text-[9px] text-emerald-100 font-bold mt-1 leading-tight">
                                    Number-line sliders, text box & multi-select
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleAddKineticBlock('timeline')}
                                className="p-3 rounded-2xl bg-purple-600/90 hover:bg-purple-500 text-left transition-all active:scale-95 border border-purple-400/40 shadow-md"
                            >
                                <div className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                                    <Plus size={12} /> ⏱️ Timeline & Layer
                                </div>
                                <p className="text-[9px] text-purple-100 font-bold mt-1 leading-tight">
                                    Cause-effect scrubber + gated quiz layer
                                </p>
                            </button>
                        </div>

                        {/* Row 2: Classic Spatial Presets */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mr-1">
                                Classic Presets:
                            </span>
                            <button
                                type="button"
                                onClick={() => handleAddKineticBlock('grammar')}
                                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1 border border-white/10"
                            >
                                <Plus size={11} /> 🏛️ Grammar Chariot
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAddKineticBlock('map')}
                                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1 border border-white/10"
                            >
                                <Plus size={11} /> 🗺️ Empire Map
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAddKineticBlock('physics')}
                                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1 border border-white/10"
                            >
                                <Plus size={11} /> ⚖️ Physics Lab
                            </button>
                        </div>
                    </div>

                    {/* 🔥 RENDER VISUAL EDITORS FOR ANY KINETIC CANVAS BLOCKS IN THIS LESSON */}
                    {kineticBlocks.length > 0 && (
                        <div className="space-y-6">
                            {kineticBlocks.map((kb: any) => (
                                <div key={kb.id} className="relative">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveKineticBlock(kb.id)}
                                        className="absolute top-6 right-6 z-20 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-rose-100"
                                    >
                                        <Trash2 size={12} /> Remove Canvas Slide
                                    </button>
                                    <KineticCanvasBuilder
                                        block={kb}
                                        onChange={(updated: any) => handleUpdateKineticBlock(kb.id, updated)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* EXISTING LESSON BUILDER VIEW */}
                    <LessonBuilderView 
                        data={lessonData} 
                        setData={setLessonData} 
                        onTogglePreview={() => setIsPreviewActive(!isPreviewActive)} 
                        isPreviewActive={isPreviewActive} 
                        triggerAiModal={triggerAiModal} 
                        onAiModalHandled={() => setTriggerAiModal(false)} 
                        userData={userData} 
                    />
                </>
            )}

            {/* 🔥 NEW MODE: READINGS & EXTERNAL SOURCE LINKS */}
            {mode === 'reading' && (
                <ReadingStudioPanel
                    lessons={lessons}
                    instructorClasses={instructorClasses}
                    onSaveLesson={onSaveLesson}
                    onAssign={onAssign}
                    onToast={(msg: string) => setToastMsg(msg)}
                />
            )}

            {mode === 'exam' && (
                <ExamBuilderView 
                    onSave={(examObj: any) => { 
                        onSaveLesson(examObj); 
                        setToastMsg("Assessment Successfully Built! 🎯"); 
                    }} 
                />
            )}

            {mode === 'arcade' && (
                <div className="space-y-8">
                    {/* 🔥 WORDFORGE (MARBLE-SCRABBLE) LIVE SMARTBOARD LAUNCHER & DECK LINKER */}
                    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-6 sm:p-8 rounded-[2.5rem] border border-indigo-500/40 shadow-2xl space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <span className="px-3 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase tracking-widest">
                                    3D Multiplayer Vocabulary Arena
                                </span>
                                <h3 className="text-2xl font-black tracking-tight mt-2">
                                    WordForge Live Smartboard Launcher
                                </h3>
                                <p className="text-xs font-medium text-indigo-200 mt-1">
                                    Select a Class Cohort and a Vocabulary Deck below to launch a live 3D WordForge session on your Smartboard—students join automatically from their class screen or QR code!
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-300 block mb-1.5">
                                    Target Class / Cohort
                                </label>
                                <select
                                    value={wfLaunchClassId}
                                    onChange={(e) => setWfLaunchClassId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-xs font-black text-white outline-none"
                                >
                                    {instructorClasses.map((cls: any) => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.name} (Code: {cls.code})
                                        </option>
                                    ))}
                                    {instructorClasses.length === 0 && (
                                        <option value="LIVE_ARENA">Open Sandbox Room (Code: LIVE_A)</option>
                                    )}
                                </select>
                            </div>

                            <div className="md:col-span-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-300 block mb-1.5">
                                    Bonus Curriculum Deck (+15 XP per Word)
                                </label>
                                <select
                                    value={wfSelectedDeckKey}
                                    onChange={(e) => setWfSelectedDeckKey(e.target.value)}
                                    className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-xs font-black text-white outline-none"
                                >
                                    {Object.entries(allDecks || {}).map(([key, d]: any) => (
                                        <option key={key} value={key}>
                                            {d.title || key} ({(d.cards || []).length} words)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-4">
                                <button
                                    type="button"
                                    onClick={handleLaunchLiveWordForge}
                                    className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/40 flex items-center justify-center gap-2 transition-all active:scale-95 border border-indigo-400/40"
                                >
                                    <Rocket size={16} /> Launch Live WordForge Now
                                </button>
                            </div>
                        </div>
                    </div>

                    <ArcadeBuilderView 
                        data={lessonData} 
                        setData={setLessonData} 
                        availableDecks={allDecks} 
                    />
                </div>
            )}

            {mode === 'curriculum' && (
                <CurriculumBuilderView 
                    availableLessons={lessons} 
                    onSaveCurriculum={onSaveCurriculum} 
                    classes={instructorClasses} 
                    curriculums={curriculums} 
                />
            )}
          </div>
        </div>

        {/* SLIDE-OVER PREVIEW MODAL */}
        {isPreviewActive && (mode === 'lesson' || mode === 'card') && (
            <>
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm z-[8000]" onClick={() => setIsPreviewActive(false)} />
                <div className="absolute right-0 top-0 bottom-0 w-full md:w-[450px] lg:w-[500px] bg-slate-100 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col z-[8500] animate-in slide-in-from-right shadow-2xl">
                    <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                            <Eye size={18} /> Live Preview
                        </div>
                        <button onClick={() => setIsPreviewActive(false)} className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-hidden p-6 md:p-8 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50">
                        <div className="w-full h-full max-h-[850px] bg-white dark:bg-black rounded-[3rem] border-[10px] border-slate-800 dark:border-slate-950 shadow-xl overflow-hidden relative">
                            <LivePreview data={lessonData} />
                        </div>
                    </div>
                </div>
            </>
        )}
      </div>
    </div> 
  );
}
