// src/components/instructor/CardBuilderView.tsx
import React, { useState, useEffect } from 'react';
import { 
    Layers, Plus, X, Save, Edit3, Trash2, FileJson, Database, 
    Loader2, FolderPlus, FolderOpen, Share2, Lock, Users, 
    Globe, CheckCircle2, Paperclip, ChevronRight, Wand2, BookOpen,
    Image as ImageIcon, Music, UploadCloud, BrainCircuit, Sparkles
} from 'lucide-react';
import { INITIAL_SYSTEM_DECKS } from '../../constants/defaults';
import { Toast } from '../Toast';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth, appId } from '../../config/firebase';

// ============================================================================
//  NETWORK PUBLISHING MODAL (INLINE COMPONENT)
// ============================================================================
const DeckShareModal = ({ deck, instructorClasses, onClose, onPublish }: any) => {
    const [visibility, setVisibility] = useState<'private' | 'restricted' | 'public'>(deck?.visibility || 'private');
    const [selectedClasses, setSelectedClasses] = useState<string[]>(deck?.allowedClasses || []);
    const [isSaving, setIsSaving] = useState(false);

    const toggleClass = (classId: string) => {
        setSelectedClasses(prev => 
            prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        await onPublish(deck.id || 'custom', deck.title, visibility, selectedClasses);
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-950 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Network Settings</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{deck?.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white dark:bg-slate-800 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-400 dark:text-slate-500 hover:text-rose-500 transition-colors shadow-sm"><X size={20} strokeWidth={3}/></button>
                </div>

                <div className="p-8 space-y-4">
                    <button onClick={() => setVisibility('private')} className={`w-full p-5 rounded-2xl border-2 flex items-start gap-4 transition-all text-left ${visibility === 'private' ? 'bg-slate-50 dark:bg-slate-900 border-slate-800 dark:border-indigo-500' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                        <div className={`p-3 rounded-full ${visibility === 'private' ? 'bg-slate-800 dark:bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}><Lock size={24} /></div>
                        <div className="flex-1">
                            <h4 className={`font-black text-lg ${visibility === 'private' ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>Classified (Private)</h4>
                            <p className="text-xs font-bold text-slate-400 mt-1">Only you can view and present this deck.</p>
                        </div>
                        {visibility === 'private' && <CheckCircle2 size={24} className="text-slate-800 dark:text-indigo-400" />}
                    </button>

                    <button onClick={() => setVisibility('restricted')} className={`w-full p-5 rounded-2xl border-2 flex flex-col gap-4 transition-all text-left ${visibility === 'restricted' ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-500' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-300'}`}>
                        <div className="flex items-start gap-4 w-full">
                            <div className={`p-3 rounded-full ${visibility === 'restricted' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}><Users size={24} /></div>
                            <div className="flex-1">
                                <h4 className={`font-black text-lg ${visibility === 'restricted' ? 'text-indigo-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>Restricted Access</h4>
                                <p className="text-xs font-bold text-slate-400 mt-1">Publish to specific cohorts.</p>
                            </div>
                            {visibility === 'restricted' && <CheckCircle2 size={24} className="text-indigo-600 dark:text-indigo-400" />}
                        </div>
                        {visibility === 'restricted' && (
                            <div className="w-full pt-4 border-t border-indigo-100 dark:border-indigo-500/20 grid grid-cols-2 gap-2">
                                {instructorClasses?.map((cls: any) => (
                                    <div key={cls.id} onClick={(e) => { e.stopPropagation(); toggleClass(cls.id); }} className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${selectedClasses.includes(cls.id) ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-white dark:bg-slate-800 border-indigo-100 dark:border-slate-700 text-indigo-900 dark:text-indigo-400 hover:bg-indigo-50'}`}>
                                        <span className="font-bold text-xs truncate pr-2">{cls.name}</span>
                                        {selectedClasses.includes(cls.id) && <CheckCircle2 size={14} />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </button>

                    <button onClick={() => setVisibility('public')} className={`w-full p-5 rounded-2xl border-2 flex items-start gap-4 transition-all text-left ${visibility === 'public' ? 'bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-500' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-emerald-300'}`}>
                        <div className={`p-3 rounded-full ${visibility === 'public' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}><Globe size={24} /></div>
                        <div className="flex-1">
                            <h4 className={`font-black text-lg ${visibility === 'public' ? 'text-emerald-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>Global Network</h4>
                            <p className="text-xs font-bold text-slate-400 mt-1">Open to all students on the platform.</p>
                        </div>
                        {visibility === 'public' && <CheckCircle2 size={24} className="text-emerald-500 dark:text-emerald-400" />}
                    </button>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button onClick={handleSave} disabled={isSaving} className="px-8 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-2">
                        {isSaving ? <><Loader2 size={16} className="animate-spin"/> Syncing...</> : 'Save Network Protocol'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
//  MAIN CARD BUILDER VIEW
// ============================================================================
export default function CardBuilderView({ 
    onSaveCard, onUpdateCard, onDeleteCard, availableDecks, 
    initialDeckId, onPublishDeck, instructorClasses 
}: any) {
    const [formData, setFormData] = useState({ 
        front: '', back: '', type: 'noun', ipa: '', sentence: '', sentenceTrans: '', 
        grammarTags: '', deckId: initialDeckId || 'custom', imageUrl: '', audioUrl: '' 
    });
    const [isCreatingDeck, setIsCreatingDeck] = useState(false);
    const [newDeckTitle, setNewDeckTitle] = useState('');
    const [morphology, setMorphology] = useState<any[]>([]);
    const [newMorphPart, setNewMorphPart] = useState({ part: '', meaning: '', type: 'root' });
    
    const [conjugations, setConjugations] = useState<Record<string, Record<string, string>>>({});
    const [tempConj, setTempConj] = useState({ tense: 'Present', person: '1s', verb: '' });

    const [isAutoFilling, setIsAutoFilling] = useState(false);
    const [showDefSelector, setShowDefSelector] = useState(false);
    const [fetchedOptions, setFetchedOptions] = useState<any[]>([]);

    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isUploadingAudio, setIsUploadingAudio] = useState(false);

    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    
    // 🔥 OPTIMISTIC STATE DECLARATION RESTORED
    const [localOptimisticDecks, setLocalOptimisticDecks] = useState<any>({});
    
    // 🔥 3-WAY BUILDER TAB STATE
    const [builderTab, setBuilderTab] = useState<'single' | 'bulk' | 'ai'>('single');
    
    const [jsonInput, setJsonInput] = useState<string>('');
    const [isImporting, setIsImporting] = useState<boolean>(false);
    const [importProgress, setImportProgress] = useState<{current: number, total: number} | null>(null);
    const [bulkDestination, setBulkDestination] = useState<'new' | 'existing'>('new');
    const [bulkNewTitle, setBulkNewTitle] = useState('');
    const [bulkExistingId, setBulkExistingId] = useState('custom');

    // 🔥 AI AUTO-FORGE STATE
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiTargetLanguage, setAiTargetLanguage] = useState('Spanish');
    const [aiCardCount, setAiCardCount] = useState(10);

    const [currentDeckCards, setCurrentDeckCards] = useState<any[]>([]);
    const [isFetchingCards, setIsFetchingCards] = useState(false);

    // 🔥 OPTIMISTIC MERGE
    const validDecks = { ...availableDecks, ...localOptimisticDecks };
    const deckOptions = Object.entries(validDecks).map(([key, deck]: any) => ({ id: key, title: deck.title })); 

    useEffect(() => { if (initialDeckId) setFormData(prev => ({...prev, deckId: initialDeckId})); }, [initialDeckId]);
    
    // 🔥 CLEAN FETCHER (No Infinite Loops)
    useEffect(() => {
        const fetchDeckCards = async () => {
            if (formData.deckId === 'new') { 
                setCurrentDeckCards([]); 
                return; 
            }
            if (formData.deckId === 'custom') { 
                setCurrentDeckCards(availableDecks['custom']?.cards || []); 
                return; 
            }

            setIsFetchingCards(true);
            try {
                const cardsRef = collection(db, 'artifacts', appId, 'decks', formData.deckId, 'cards');
                const snap = await getDocs(cardsRef);
                const loadedCards = snap.docs.map(doc => doc.data());
                setCurrentDeckCards(loadedCards);
            } catch (err) {
                console.error("Failed to fetch cards:", err);
            } finally {
                setIsFetchingCards(false);
            }
        };

        fetchDeckCards();
    }, [formData.deckId]);
    
    const handleChange = (e: any) => { 
        if (e.target.name === 'deckId') { 
            if (e.target.value === 'new') { 
                setIsCreatingDeck(true); 
                setFormData({ ...formData, deckId: 'new' }); 
            } else { 
                setIsCreatingDeck(false); 
                setFormData({ ...formData, deckId: e.target.value }); 
            } 
        } else { setFormData({ ...formData, [e.target.name]: e.target.value }); } 
    };

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'audio') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isImage = type === 'image';
        const setter = isImage ? setIsUploadingImage : setIsUploadingAudio;
        const field = isImage ? 'imageUrl' : 'audioUrl';

        const maxSize = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
            setToastMsg(`File too large. Limit is ${isImage ? '5MB' : '10MB'}.`);
            return;
        }

        setter(true);
        try {
            const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
            const fileRef = ref(storage, `artifacts/${appId}/users/${auth.currentUser?.uid}/media/${Date.now()}_${safeName}`);
            const uploadResult = await uploadBytes(fileRef, file);
            const url = await getDownloadURL(uploadResult.ref);
            
            setFormData(prev => ({ ...prev, [field]: url }));
            setToastMsg(`${isImage ? 'Image' : 'Audio'} payload secured! ✨`);
        } catch (err) {
            setToastMsg(`Upload failed. Check your connection.`);
        } finally { setter(false); }
    };

    const handleMagicAutoFill = async (e: React.MouseEvent) => {
        e.preventDefault();
        const queryWord = formData.front.trim();
        if (!queryWord) return;

        setIsAutoFilling(true);
        try {
            const safeQuery = encodeURIComponent(queryWord);
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${safeQuery}`);
            
            if (!response.ok) {
                if (queryWord.includes(' ')) {
                    const words = queryWord.split(' ');
                    let combinedIpa = '';
                    for (const w of words) {
                        try {
                            const wordRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`);
                            if (wordRes.ok) {
                                const wordData = await wordRes.json();
                                const txtEntry = wordData[0]?.phonetics?.find((p: any) => p.text);
                                const ipaTxt = txtEntry?.text || wordData[0]?.phonetic || '';
                                combinedIpa += ipaTxt.replace(/\//g, '') + ' ';
                            }
                        } catch (err) {}
                    }
                    if (combinedIpa.trim()) {
                        setFormData(prev => ({ ...prev, ipa: `/${combinedIpa.trim()}/` }));
                        setToastMsg("Phrase stitched! ✨ (Definition requires manual entry)");
                        return;
                    }
                }
                throw new Error("Word not found in global dictionary");
            }
            
            const data = await response.json();
            const textEntry = data[0]?.phonetics?.find((p: any) => p.text);
            const fetchedIpa = textEntry?.text || data[0]?.phonetic || '';

            const options: any[] = [];
            const validTypes = ['noun', 'verb', 'adjective', 'adverb', 'phrase'];

            data[0]?.meanings?.forEach((meaning: any) => {
                const rawPos = meaning.partOfSpeech || 'noun';
                const safeType = validTypes.includes(rawPos.toLowerCase()) ? rawPos.toLowerCase() : 'noun';
                
                meaning.definitions?.forEach((def: any) => {
                    options.push({ type: safeType, definition: def.definition, ipa: fetchedIpa });
                });
            });

            if (options.length === 1) {
                setFormData(prev => ({ ...prev, ipa: options[0].ipa, back: options[0].definition, type: options[0].type }));
                setToastMsg("Target data auto-filled! ✨");
            } else if (options.length > 1) {
                setFetchedOptions(options);
                setShowDefSelector(true);
            } else if (fetchedIpa) {
                setFormData(prev => ({ ...prev, ipa: fetchedIpa }));
                setToastMsg("Phonetics found! ✨ (Definition missing)");
            } else { setToastMsg("No extended data found for this exact word."); }
        } catch (err) { setToastMsg("Could not connect to dictionary engine."); } finally { setIsAutoFilling(false); }
    };

    const addMorphology = () => { if (newMorphPart.part && newMorphPart.meaning) { setMorphology([...morphology, newMorphPart]); setNewMorphPart({ part: '', meaning: '', type: 'root' }); } };
    const removeMorphology = (index: number) => { setMorphology(morphology.filter((_, i) => i !== index)); };

    const addConjugation = () => {
        if (!tempConj.verb.trim() || !tempConj.tense.trim()) return;
        setConjugations(prev => ({
            ...prev, [tempConj.tense]: { ...(prev[tempConj.tense] || {}), [tempConj.person]: tempConj.verb.trim() }
        }));
        setTempConj({ ...tempConj, verb: '' });
    };

    const removeConjugation = (tense: string, person: string) => {
        setConjugations(prev => {
            const next = { ...prev }; delete next[tense][person];
            if (Object.keys(next[tense]).length === 0) delete next[tense];
            return next;
        });
    };
    
    const handleSelectCard = (card: any) => { 
        setBuilderTab('single'); 
        setEditingId(card.id); 
        setFormData({ 
            front: card.front, back: card.back, type: card.type || 'noun', ipa: card.ipa || '', 
            sentence: card.usage?.sentence || '', sentenceTrans: card.usage?.translation || '', 
            grammarTags: card.grammar_tags?.join(', ') || '', deckId: card.deckId || formData.deckId,
            imageUrl: card.imageUrl || '', audioUrl: card.audioUrl || '' 
        }); 
        setMorphology(card.morphology || []); 
        setConjugations(card.conjugations || {});
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    };

    const handleClear = () => { 
        setEditingId(null); 
        setFormData(prev => ({ 
            ...prev, front: '', back: '', type: 'noun', ipa: '', 
            sentence: '', sentenceTrans: '', grammarTags: '', imageUrl: '', audioUrl: '' 
        })); 
        setMorphology([]); 
        setConjugations({});
    };

    const registerNewDeck = async (deckId: string, deckTitle: string) => {
        try {
            // 🔥 OPTIMISTIC UPDATE: Tell the UI the deck exists so Network Access works!
            setLocalOptimisticDecks((prev: any) => ({ ...prev, [deckId]: { id: deckId, title: deckTitle } }));

            const deckRef = doc(db, 'artifacts', appId, 'decks', deckId);
            await setDoc(deckRef, { id: deckId, key: deckId, title: deckTitle, type: 'vocabulary', createdAt: new Date().toISOString() }, { merge: true });
        } catch (err) { console.error("Failed to register deck:", err); }
    };

    const handleDeleteCard = async (cardId: string) => {
        if (!window.confirm("Delete this card permanently?")) return;
        try {
            await onDeleteCard(formData.deckId, cardId); 
            setCurrentDeckCards(prev => prev.filter(c => c.id !== cardId));
            if (editingId === cardId) handleClear();
            setToastMsg("Target eliminated.");
        } catch (err) { setToastMsg("Error: Deletion failed."); }
    };

    const handleSubmit = async (e: any) => { 
        e.preventDefault(); 
        if (!formData.front || !formData.back) return; 
        
        let finalDeckId = formData.deckId; 
        let finalDeckTitle = null; 
        
        if (formData.deckId === 'new') { 
            if (!newDeckTitle) return alert("Please name your new deck."); 
            finalDeckId = `deck_${Date.now()}`; 
            finalDeckTitle = newDeckTitle; 
            await registerNewDeck(finalDeckId, finalDeckTitle);
        } 

        const cardData = { 
            front: formData.front, back: formData.back, type: formData.type, 
            deckId: finalDeckId, deckTitle: finalDeckTitle, ipa: formData.ipa || "/.../", 
            imageUrl: formData.imageUrl || null, audioUrl: formData.audioUrl || null,
            mastery: 0, morphology: morphology.length > 0 ? morphology : [{ part: formData.front, meaning: "Root", type: "root" }], 
            conjugations: Object.keys(conjugations).length > 0 ? conjugations : null,
            usage: { sentence: formData.sentence || "-", translation: formData.sentenceTrans || "-" }, 
            grammar_tags: formData.grammarTags ? formData.grammarTags.split(',').map(t => t.trim()) : ["Custom"] 
        }; 

        if (editingId) { 
            await onUpdateCard(finalDeckId, editingId, cardData);
            setCurrentDeckCards(prev => prev.map(c => c.id === editingId ? { ...cardData, id: editingId } : c));
            setToastMsg("Target Updated Successfully"); 
        } else { 
            const newCardId = await onSaveCard(finalDeckId, cardData, true); 
            setCurrentDeckCards(prev => [...prev, { ...cardData, id: newCardId }]);
            setToastMsg("Target Forged Successfully"); 
        } 

        handleClear(); 
        if (isCreatingDeck) { 
            setIsCreatingDeck(false); 
            setNewDeckTitle(''); 
            setFormData(prev => ({ ...prev, deckId: finalDeckId })); 
        } 
    };

    const executeBulkIngest = async (cardsArray: any[], successMessage: string) => {
        let finalDeckId = bulkExistingId;
        let finalDeckTitle = validDecks[bulkExistingId]?.title || 'Custom Deck';
        
        if (bulkDestination === 'new') {
            if (!bulkNewTitle.trim()) return alert("Please name your new deck.");
            finalDeckId = `deck_${Date.now()}`;
            finalDeckTitle = bulkNewTitle.trim();
            await registerNewDeck(finalDeckId, finalDeckTitle);
        }

        setIsImporting(true);
        setImportProgress({ current: 0, total: cardsArray.length });

        let successCount = 0;
        
        for (let i = 0; i < cardsArray.length; i++) {
            const card = cardsArray[i];
            if (!card.front || !card.back) continue; 
            
            const cardData = {
                front: card.front, back: card.back, type: card.type || 'noun',
                deckId: finalDeckId, deckTitle: finalDeckTitle, ipa: card.ipa || "/.../",
                imageUrl: card.imageUrl || null, audioUrl: card.audioUrl || null,
                mastery: 0, morphology: card.morphology || [{ part: card.front, meaning: "Root", type: "root" }],
                conjugations: card.conjugations || null, 
                usage: { sentence: card.usage?.sentence || card.sentence || "-", translation: card.usage?.translation || card.translation || "-" },
                grammar_tags: card.grammarTags || ["Imported"]
            };
            
            try {
                const newId = await onSaveCard(finalDeckId, cardData, true); 
                successCount++;
                setImportProgress({ current: successCount, total: cardsArray.length });
                
                setCurrentDeckCards(prev => [...prev, { ...cardData, id: newId }]);
                await new Promise(resolve => setTimeout(resolve, 150));
            } catch (err) { console.error(`Failed to save: ${card.front}`, err); }
        }

        setToastMsg(`${successMessage} (${successCount} Targets)`);
        setJsonInput('');
        if (bulkDestination === 'new') {
            setBulkNewTitle('');
            setBulkDestination('existing');
            setBulkExistingId(finalDeckId);
            setFormData(prev => ({ ...prev, deckId: finalDeckId }));
        }
        setIsImporting(false);
        setImportProgress(null);
        setBuilderTab('single'); 
    };

    const handleBulkImport = async () => {
        try {
            const importedCards = JSON.parse(jsonInput);
            if (!Array.isArray(importedCards)) throw new Error("JSON must be an array");
            await executeBulkIngest(importedCards, "Bulk import complete!");
        } catch (e: any) {
            alert("Invalid JSON format. Check for missing commas or brackets.");
        }
    };

    const handleNeuralForge = async () => {
        if (!aiPrompt.trim()) {
            setToastMsg("Provide a prompt for the AI to forge.");
            return;
        }

        const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;        
        if (!apiKey) {
            setToastMsg("CRITICAL: Missing Gemini API Key in .env file.");
            return;
        }

        setIsImporting(true); 
        setToastMsg("Initializing Neural Forge. Please wait...");

        const systemPrompt = `You are a curriculum designer for an app called Magister OS. 
        Your task is to generate a highly accurate, professional set of flashcards based on the user's prompt.
        You MUST generate EXACTLY ${aiCardCount} cards.
        The target language is ${aiTargetLanguage}.
        
        JSON SCHEMA:
        [
          {
            "front": "Target word/concept in ${aiTargetLanguage}",
            "back": "Definition/translation in English",
            "type": "noun", 
            "ipa": "/phonetics in IPA format/",
            "morphology": [{"part": "The word itself or a root", "meaning": "Root meaning", "type": "root"}],
            "usage": {"sentence": "A simple example sentence in ${aiTargetLanguage}", "translation": "The English translation of the sentence"},
            "grammarTags": ["AI_Generated", "${aiTargetLanguage}"]
          }
        ]
        
        USER PROMPT: "${aiPrompt}"`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
                    generationConfig: {
                        responseMimeType: "application/json" 
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Gemini API Error Details:", errorData);
                throw new Error(`API call failed: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            let rawText = data.candidates[0].content.parts[0].text;
            
            rawText = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
            const aiCards = JSON.parse(rawText);
            
            if (!Array.isArray(aiCards)) throw new Error("AI did not return an array.");

            await executeBulkIngest(aiCards, "Neural Forge Complete!");

        } catch (err) {
            console.error("Neural Forge Error:", err);
            setToastMsg("Neural Forge failed. Check the console for details.");
            setIsImporting(false);
        }
    };
    
    useEffect(() => { if (editingId && !currentDeckCards.some((c: any) => c.id === editingId)) { handleClear(); } }, [currentDeckCards, editingId]);

    const jsonTemplate = `[\n  { "front": "canis", "back": "dog", "type": "noun", "imageUrl": "https://..." }\n]`;

    return (
        <div className="space-y-6 relative pb-12 font-sans transition-colors duration-300">
            {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
            
            {showShareModal && validDecks[formData.deckId] && (
                <DeckShareModal 
                    deck={{ ...validDecks[formData.deckId], id: formData.deckId }} 
                    instructorClasses={instructorClasses || []} 
                    onClose={() => setShowShareModal(false)}
                    onPublish={onPublishDeck}
                />
            )}

            {showDefSelector && (
                <div className="fixed inset-0 z-[9999] bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-950 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300 max-h-[80vh] flex flex-col">
                        
                        <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                                    <BookOpen size={20} className="text-indigo-500" /> Disambiguation Required
                                </h2>
                                <p className="text-xs font-bold text-slate-400 mt-1">Select the correct definition for <span className="text-indigo-500 uppercase tracking-widest ml-1">"{formData.front}"</span></p>
                            </div>
                            <button onClick={() => setShowDefSelector(false)} className="p-2 bg-white dark:bg-slate-800 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-400 dark:text-slate-500 hover:text-rose-500 transition-colors shadow-sm"><X size={20} strokeWidth={3}/></button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3 bg-slate-50 dark:bg-slate-950">
                            {fetchedOptions.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, ipa: opt.ipa, back: opt.definition, type: opt.type }));
                                        setShowDefSelector(false);
                                        setToastMsg("Target data auto-filled! ✨");
                                    }}
                                    className="w-full text-left p-5 rounded-[1.5rem] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all group active:scale-[0.98] shadow-sm hover:shadow-md"
                                >
                                    <span className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3 border border-indigo-100 dark:border-indigo-500/20">
                                        {opt.type}
                                    </span>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-900 dark:group-hover:text-indigo-100 transition-colors leading-relaxed">
                                        {opt.definition}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            <div className="bg-indigo-50 dark:bg-indigo-950 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/20 mb-4 text-sm text-indigo-800 dark:text-indigo-300 flex justify-between items-center transition-colors">
                <div><p className="font-bold flex items-center gap-2"><Layers size={16}/> Deck Builder</p></div>
                {editingId && <button onClick={handleClear} className="text-xs font-bold bg-white dark:bg-slate-800 dark:text-white px-3 py-1 rounded-lg shadow-sm hover:text-indigo-600 dark:hover:text-indigo-400">Cancel Edit</button>}
            </div>

            {/* 🔥 3-WAY TAB SELECTOR */}
            <div className="flex gap-4 border-b-2 border-slate-100 dark:border-slate-800 relative bottom-[-1px] overflow-x-auto custom-scrollbar">
                <button disabled={isImporting} onClick={() => setBuilderTab('single')} className={`pb-4 shrink-0 text-sm font-black uppercase tracking-widest transition-colors border-b-4 flex items-center gap-2 ${builderTab === 'single' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 dark:text-slate-600 hover:text-slate-600'} disabled:opacity-50`}>
                    <Edit3 size={16} /> Single Target
                </button>
                <button disabled={isImporting} onClick={() => { setBuilderTab('ai'); handleClear(); }} className={`pb-4 shrink-0 text-sm font-black uppercase tracking-widest transition-colors border-b-4 flex items-center gap-2 ${builderTab === 'ai' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 dark:text-slate-600 hover:text-slate-600'} disabled:opacity-50`}>
                    <BrainCircuit size={16} /> Neural Auto-Forge
                </button>
                <button disabled={isImporting} onClick={() => { setBuilderTab('bulk'); handleClear(); }} className={`pb-4 shrink-0 text-sm font-black uppercase tracking-widest transition-colors border-b-4 flex items-center gap-2 ${builderTab === 'bulk' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 dark:text-slate-600 hover:text-slate-600'} disabled:opacity-50`}>
                    <FileJson size={16} /> Bulk JSON
                </button>
            </div>

            {/* 🔥 RENDER BASED ON TAB */}
            {builderTab === 'single' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                        <h3 className="font-black text-slate-800 dark:text-slate-300 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Database size={16} className="text-indigo-500" /> Target Deck
                        </h3>
                        <select name="deckId" value={formData.deckId} onChange={handleChange} disabled={!!editingId} className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-indigo-50/30 dark:bg-slate-800 font-black text-indigo-900 dark:text-indigo-400 focus:border-indigo-500 outline-none transition-colors mb-3 cursor-pointer">
                            <option value="custom">✍️ Scriptorium (My Deck)</option>
                            {deckOptions.filter(d => d.id !== 'custom').map(d => (<option key={d.id} value={d.id}>{d.title}</option>))}
                            <option value="new">✨ + Create New Deck</option>
                        </select>
                        {isCreatingDeck && (
                            <input value={newDeckTitle} onChange={(e) => setNewDeckTitle(e.target.value)} placeholder="Enter new deck name..." className="w-full p-4 rounded-xl border-2 border-indigo-500 bg-white dark:bg-slate-800 dark:text-white font-black outline-none shadow-sm animate-in slide-in-from-top-2" autoFocus />
                        )}
                    </section>

                    <section className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-black text-slate-800 dark:text-slate-300 text-xs uppercase tracking-widest">Core Data</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Word (Front)</label>
                                <div className="relative flex items-center">
                                    <input 
                                        name="front" 
                                        value={formData.front} 
                                        onChange={handleChange} 
                                        className="w-full p-4 pl-4 pr-16 rounded-xl border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-bold focus:border-indigo-500 outline-none transition-colors" 
                                        placeholder="e.g. Incorporate" 
                                    />
                                    <button 
                                        type="button"
                                        onClick={handleMagicAutoFill}
                                        disabled={isAutoFilling || !formData.front.trim()}
                                        title="Magic Auto-Fill (Dictionary)"
                                        className="absolute right-2 p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-500/40 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-indigo-100 active:scale-95 shadow-sm"
                                    >
                                        {isAutoFilling ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Meaning (Back)</label>
                                <input name="back" value={formData.back} onChange={handleChange} className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-bold focus:border-indigo-500 outline-none transition-colors" placeholder="e.g. To include as part of a whole" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-2 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Phonetics (IPA)</label>
                                <input 
                                    name="ipa" 
                                    value={formData.ipa} 
                                    onChange={handleChange} 
                                    className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 font-mono text-slate-800 dark:text-white focus:border-indigo-500 outline-none transition-colors" 
                                    placeholder="e.g. /ɪnˈkɔːpəɹeɪt/" 
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Word Type</label>
                                <select 
                                    name="type" 
                                    value={formData.type} 
                                    onChange={handleChange} 
                                    className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 font-bold dark:text-white focus:border-indigo-500 outline-none cursor-pointer transition-colors"
                                >
                                    <option value="noun">Noun</option>
                                    <option value="verb">Verb</option>
                                    <option value="adjective">Adjective</option>
                                    <option value="adverb">Adverb</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    <section className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner transition-colors">
                        <div className="flex items-center gap-2 mb-4">
                            <UploadCloud size={16} className="text-indigo-500" />
                            <h3 className="font-black text-slate-800 dark:text-slate-300 text-xs uppercase tracking-widest">Media Payload</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            
                            {/* Image Dropzone */}
                            <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-center relative hover:border-indigo-400 transition-colors group">
                                {formData.imageUrl ? (
                                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                                        <img src={formData.imageUrl} alt="Card preview" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => setFormData(prev => ({...prev, imageUrl: ''}))} className="absolute top-2 right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                                    </div>
                                ) : (
                                    <>
                                        {isUploadingImage ? <Loader2 size={32} className="animate-spin text-indigo-500 mb-2" /> : <ImageIcon size={32} className="text-slate-300 dark:text-slate-600 mb-2 group-hover:text-indigo-400 transition-colors" />}
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Attach Reference Image</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1">PNG, JPG (Max 5MB)</span>
                                        <input type="file" accept="image/*" onChange={(e) => handleMediaUpload(e, 'image')} disabled={isUploadingImage} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                                    </>
                                )}
                            </div>

                            {/* Audio Dropzone */}
                            <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-center relative hover:border-indigo-400 transition-colors group">
                                {formData.audioUrl ? (
                                    <div className="w-full flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center"><Music size={20} /></div>
                                        <audio src={formData.audioUrl} controls className="w-full h-8 opacity-80" />
                                        <button type="button" onClick={() => setFormData(prev => ({...prev, audioUrl: ''}))} className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 tracking-widest flex items-center gap-1"><Trash2 size={12}/> Remove Audio</button>
                                    </div>
                                ) : (
                                    <>
                                        {isUploadingAudio ? <Loader2 size={32} className="animate-spin text-indigo-500 mb-2" /> : <Music size={32} className="text-slate-300 dark:text-slate-600 mb-2 group-hover:text-indigo-400 transition-colors" />}
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Attach Native Pronunciation</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1">MP3, WAV (Max 10MB)</span>
                                        <input type="file" accept="audio/*" onChange={(e) => handleMediaUpload(e, 'audio')} disabled={isUploadingAudio} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                                    </>
                                )}
                            </div>

                        </div>
                    </section>

                    <section className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-black text-slate-800 dark:text-slate-300 text-xs uppercase tracking-widest flex items-center gap-2">
                                <Paperclip size={16} className="text-indigo-500" /> Conjugation Forge
                            </h3>
                            <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">Beta</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-stretch">
                            <input value={tempConj.tense} onChange={(e) => setTempConj({...tempConj, tense: e.target.value})} className="sm:col-span-1 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs font-black dark:text-white outline-none focus:border-indigo-500" placeholder="Tense (e.g. Present)" />
                            <select value={tempConj.person} onChange={(e) => setTempConj({...tempConj, person: e.target.value})} className="sm:col-span-1 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs font-black dark:text-white outline-none">
                                {['1s', '2s', '3s', '1p', '2p', '3p'].map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <input value={tempConj.verb} onChange={(e) => setTempConj({...tempConj, verb: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && addConjugation()} className="sm:col-span-1 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs font-bold dark:text-white outline-none focus:border-indigo-500" placeholder="Form (e.g. Amo)" />
                            <button type="button" onClick={addConjugation} className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-500 transition-colors shadow-md active:scale-95 flex items-center justify-center"><Plus size={20}/></button>
                        </div>

                        {Object.keys(conjugations).length > 0 && (
                            <div className="mt-6 space-y-4">
                                {Object.entries(conjugations).map(([tense, forms]: any) => (
                                    <div key={tense} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                        <h4 className="text-[10px] font-black text-indigo-500 uppercase mb-3 flex items-center gap-2"><ChevronRight size={12}/> {tense}</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                                            {Object.entries(forms).map(([person, verb]: any) => (
                                                <div key={person} className="relative group bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                                                    <span className="text-[8px] font-black text-slate-400 block mb-0.5">{person}</span>
                                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{verb}</span>
                                                    <button onClick={() => removeConjugation(tense, person)} className="absolute -top-1 -right-1 bg-rose-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} strokeWidth={4}/></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                        <h3 className="font-black text-slate-800 dark:text-slate-300 text-xs uppercase tracking-widest">Morphology Breakdowns</h3>
                        <div className="flex gap-2 items-stretch">
                            <input value={newMorphPart.part} onChange={(e) => setNewMorphPart({...newMorphPart, part: e.target.value})} className="flex-1 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-sm font-bold outline-none focus:border-indigo-500" placeholder="Root/Suffix" />
                            <input value={newMorphPart.meaning} onChange={(e) => setNewMorphPart({...newMorphPart, meaning: e.target.value})} className="flex-1 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-sm font-bold outline-none focus:border-indigo-500" placeholder="Meaning" />
                            <button type="button" onClick={addMorphology} className="bg-slate-900 dark:bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-600 transition-colors shadow-md active:scale-95"><Plus size={20}/></button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                            {morphology.map((m, i) => (
                                <div key={i} className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-500/20 pl-4 pr-2 py-2 rounded-full text-sm shadow-sm transition-colors">
                                    <span className="font-black text-indigo-900 dark:text-indigo-400">{m.part}</span><span className="text-indigo-700 dark:text-indigo-500 font-bold">({m.meaning})</span>
                                    <button type="button" onClick={() => removeMorphology(i)} className="text-indigo-400 dark:text-indigo-500 hover:text-rose-500 ml-1 bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm"><X size={14}/></button>
                                </div>
                            ))}
                        </div>
                    </section>

                    <button onClick={handleSubmit} className={`w-full text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 ${editingId ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'}`}>
                        {editingId ? <><Save size={20}/> Update Vocabulary Target</> : <><Plus size={20}/> Forge Vocabulary Target</>}
                    </button>
                </div>
            )}

            {/* 🔥 THE NEURAL FORGE TAB */}
            {builderTab === 'ai' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <section className="bg-gradient-to-br from-indigo-500 to-cyan-400 p-8 rounded-3xl shadow-xl transition-colors text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Sparkles size={120}/></div>
                        <div className="relative z-10">
                            <h2 className="font-black text-3xl tracking-tighter mb-2">Neural Auto-Forge</h2>
                            <p className="text-sm font-bold opacity-90 max-w-sm mb-6">Describe the deck you want to build, and Magister OS will generate it instantly using AI.</p>
                            
                            <textarea 
                                value={aiPrompt} 
                                onChange={(e) => setAiPrompt(e.target.value)} 
                                disabled={isImporting} 
                                placeholder="e.g. '15 advanced medical terms in Spanish for emergency room nurses'" 
                                className="w-full h-32 bg-white/10 backdrop-blur-md text-white placeholder-white/50 p-5 rounded-2xl font-bold text-lg border-2 border-white/20 focus:border-white outline-none resize-none custom-scrollbar mb-4" 
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/20 p-4 rounded-xl border border-white/10">
                                    <label className="text-[10px] font-black uppercase tracking-widest block mb-2 opacity-80">Target Language</label>
                                    <input 
                                        value={aiTargetLanguage} 
                                        onChange={(e) => setAiTargetLanguage(e.target.value)} 
                                        disabled={isImporting}
                                        className="w-full bg-transparent text-white font-bold outline-none border-b border-white/30 focus:border-white pb-1"
                                    />
                                </div>
                                <div className="bg-black/20 p-4 rounded-xl border border-white/10">
                                    <label className="text-[10px] font-black uppercase tracking-widest block mb-2 opacity-80">Target Count</label>
                                    <input 
                                        type="number"
                                        min="5" max="30"
                                        value={aiCardCount} 
                                        onChange={(e) => setAiCardCount(parseInt(e.target.value))} 
                                        disabled={isImporting}
                                        className="w-full bg-transparent text-white font-bold outline-none border-b border-white/30 focus:border-white pb-1"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                        <h3 className="font-black text-slate-800 dark:text-slate-300 text-xs uppercase tracking-widest mb-4">Destination Deck</h3>
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                            <button onClick={() => setBulkDestination('new')} disabled={isImporting} className={`flex-1 p-4 rounded-xl border-2 flex items-center gap-3 transition-colors ${bulkDestination === 'new' ? 'border-indigo-600 dark:border-indigo-500 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'} disabled:opacity-50`}>
                                <FolderPlus size={20} /> <span className="font-black text-sm uppercase">Create New</span>
                            </button>
                            <button onClick={() => setBulkDestination('existing')} disabled={isImporting} className={`flex-1 p-4 rounded-xl border-2 flex items-center gap-3 transition-colors ${bulkDestination === 'existing' ? 'border-indigo-600 dark:border-indigo-500 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'} disabled:opacity-50`}>
                                <FolderOpen size={20} /> <span className="font-black text-sm uppercase">Add to Existing</span>
                            </button>
                        </div>
                        {bulkDestination === 'new' ? (
                            <input value={bulkNewTitle} onChange={(e) => setBulkNewTitle(e.target.value)} disabled={isImporting} placeholder="Name your new deck" className="w-full p-4 rounded-xl border-2 border-indigo-500 bg-white dark:bg-slate-800 dark:text-white font-black outline-none shadow-sm transition-colors" />
                        ) : (
                            <select value={bulkExistingId} onChange={(e) => setBulkExistingId(e.target.value)} disabled={isImporting} className="w-full p-4 rounded-xl border-2 border-indigo-500 bg-white dark:bg-slate-800 dark:text-indigo-400 font-black outline-none shadow-sm transition-colors cursor-pointer">
                                <option value="custom">✍️ Scriptorium (My Deck)</option>
                                {deckOptions.filter(d => d.id !== 'custom').map(d => (<option key={d.id} value={d.id}>{d.title}</option>))}
                            </select>
                        )}
                    </section>

                    <button onClick={handleNeuralForge} disabled={!aiPrompt.trim() || isImporting} className={`w-full text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${isImporting ? 'bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800'}`}>
                        {isImporting ? (
                            <><Loader2 size={20} className="animate-spin" /> Forging Targets... ({importProgress?.current || 0}/{importProgress?.total || 0})</>
                        ) : (
                            <><BrainCircuit size={20}/> Generate & Import Deck</>
                        )}
                    </button>
                </div>
            )}

            {/* THE BULK IMPORT TAB */}
            {builderTab === 'bulk' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <section className="bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                        <h3 className="font-black text-slate-800 dark:text-slate-300 text-xs uppercase tracking-widest mb-4">Destination Deck</h3>
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                            <button onClick={() => setBulkDestination('new')} disabled={isImporting} className={`flex-1 p-4 rounded-xl border-2 flex items-center gap-3 transition-colors ${bulkDestination === 'new' ? 'border-indigo-600 dark:border-indigo-500 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'} disabled:opacity-50`}>
                                <FolderPlus size={20} /> <span className="font-black text-sm uppercase">Create New</span>
                            </button>
                            <button onClick={() => setBulkDestination('existing')} disabled={isImporting} className={`flex-1 p-4 rounded-xl border-2 flex items-center gap-3 transition-colors ${bulkDestination === 'existing' ? 'border-indigo-600 dark:border-indigo-500 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'} disabled:opacity-50`}>
                                <FolderOpen size={20} /> <span className="font-black text-sm uppercase">Add to Existing</span>
                            </button>
                        </div>
                        {bulkDestination === 'new' ? (
                            <input value={bulkNewTitle} onChange={(e) => setBulkNewTitle(e.target.value)} disabled={isImporting} placeholder="Name your new deck" className="w-full p-4 rounded-xl border-2 border-indigo-500 bg-white dark:bg-slate-800 dark:text-white font-black outline-none shadow-sm transition-colors" />
                        ) : (
                            <select value={bulkExistingId} onChange={(e) => setBulkExistingId(e.target.value)} disabled={isImporting} className="w-full p-4 rounded-xl border-2 border-indigo-500 bg-white dark:bg-slate-800 dark:text-indigo-400 font-black outline-none shadow-sm transition-colors cursor-pointer">
                                <option value="custom">✍️ Scriptorium (My Deck)</option>
                                {deckOptions.filter(d => d.id !== 'custom').map(d => (<option key={d.id} value={d.id}>{d.title}</option>))}
                            </select>
                        )}
                    </section>

                    <section className="bg-slate-900 dark:bg-black p-6 rounded-3xl border-4 border-slate-800 shadow-xl transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-black text-white text-sm uppercase tracking-widest">JSON Payload</h3>
                            <button disabled={isImporting} onClick={() => setJsonInput(jsonTemplate)} className="text-[10px] font-black uppercase text-indigo-400 hover:text-white transition-colors tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">Paste Template</button>
                        </div>
                        <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} disabled={isImporting} placeholder="Paste your JSON array here..." className="w-full h-64 bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-sm border-2 border-slate-800 focus:border-indigo-500 outline-none resize-y custom-scrollbar" />
                    </section>

                    <button onClick={handleBulkImport} disabled={!jsonInput.trim() || isImporting} className={`w-full text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${isImporting ? 'bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800'}`}>
                        {isImporting ? <><Loader2 size={20} className="animate-spin" /> Forging Targets...</> : <><Database size={20}/> Process & Import Deck</>}
                    </button>
                </div>
            )}

            {/* DECK INVENTORY (Now dynamically fetches subcollection cards) */}
            {formData.deckId && (
                <div className="pt-10 mt-10 border-t-2 border-slate-100 dark:border-slate-800 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs">Deck Inventory</h3>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setShowShareModal(true)} className="bg-indigo-100 dark:bg-indigo-900/40 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm">
                                <Share2 size={14} /> Network Access
                            </button>
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-2 rounded-xl text-[10px] font-black tracking-widest transition-colors flex items-center gap-2">
                                {isFetchingCards ? <Loader2 size={12} className="animate-spin" /> : currentDeckCards.length} Targets
                            </span>
                        </div>
                    </div>
                    
                    {isFetchingCards ? (
                        <div className="py-12 flex justify-center opacity-50">
                            <Loader2 size={32} className="animate-spin text-indigo-500" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {currentDeckCards.map((card: any) => (
                                <div key={card.id} onClick={() => !isImporting && handleSelectCard(card)} className={`p-4 rounded-2xl border-2 flex justify-between items-center cursor-pointer transition-all group ${editingId === card.id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/50'}`}>
                                    <div className="flex flex-col">
                                        <span className="font-black text-slate-800 dark:text-white transition-colors">{card.front}</span>
                                        <span className="text-xs font-bold text-slate-400 mt-0.5">{card.back}</span>
                                        
                                        <div className="flex items-center gap-2 mt-2">
                                            {card.imageUrl && <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-indigo-500"><ImageIcon size={10} /> Image</span>}
                                            {card.audioUrl && <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-indigo-500"><Music size={10} /> Audio</span>}
                                            {card.conjugations && <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-indigo-500"><Paperclip size={10}/> Conjs</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 transition-colors"><Edit3 size={14} /></div>
                                        {!(INITIAL_SYSTEM_DECKS as any)[formData.deckId] && (
                                            <button onClick={(e) => { e.stopPropagation(); !isImporting && handleDeleteCard(card.id); }} className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-rose-500 hover:text-white transition-all">
                                                <Trash2 size={14}/>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
