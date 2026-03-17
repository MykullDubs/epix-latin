// src/components/instructor/CardBuilderView.tsx
import React, { useState, useEffect } from 'react';
import { Layers, Plus, X, Save, Edit3, Trash2, FileJson, Database, Loader2, FolderPlus, FolderOpen, Share2, Lock, Users, Globe, CheckCircle2 } from 'lucide-react';
import { INITIAL_SYSTEM_DECKS } from '../../constants/defaults';
import { Toast } from '../Toast';
import { doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';

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
        // Ensure we pass the deck ID, title, and the actual array of cards
        await onPublish(deck.id || 'custom', deck.title, deck.cards || [], visibility, selectedClasses);
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
                
                <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Network Settings</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{deck?.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors shadow-sm"><X size={20} strokeWidth={3}/></button>
                </div>

                <div className="p-8 space-y-4">
                    {/* PRIVATE */}
                    <button onClick={() => setVisibility('private')} className={`w-full p-5 rounded-2xl border-2 flex items-start gap-4 transition-all text-left ${visibility === 'private' ? 'bg-slate-50 border-slate-800' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                        <div className={`p-3 rounded-full ${visibility === 'private' ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}><Lock size={24} /></div>
                        <div className="flex-1">
                            <h4 className={`font-black text-lg ${visibility === 'private' ? 'text-slate-900' : 'text-slate-600'}`}>Classified (Private)</h4>
                            <p className="text-xs font-bold text-slate-400 mt-1">Only you can view and present this deck. It will not appear in the student Gym.</p>
                        </div>
                        {visibility === 'private' && <CheckCircle2 size={24} className="text-slate-800" />}
                    </button>

                    {/* RESTRICTED */}
                    <button onClick={() => setVisibility('restricted')} className={`w-full p-5 rounded-2xl border-2 flex flex-col gap-4 transition-all text-left ${visibility === 'restricted' ? 'bg-indigo-50/50 border-indigo-500' : 'bg-white border-slate-100 hover:border-indigo-300'}`}>
                        <div className="flex items-start gap-4 w-full">
                            <div className={`p-3 rounded-full ${visibility === 'restricted' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-400'}`}><Users size={24} /></div>
                            <div className="flex-1">
                                <h4 className={`font-black text-lg ${visibility === 'restricted' ? 'text-indigo-900' : 'text-slate-600'}`}>Restricted Access</h4>
                                <p className="text-xs font-bold text-slate-400 mt-1">Publish to the Gym, but only for specific cohorts.</p>
                            </div>
                            {visibility === 'restricted' && <CheckCircle2 size={24} className="text-indigo-600" />}
                        </div>
                        
                        {visibility === 'restricted' && (
                            <div className="w-full pt-4 border-t border-indigo-100 grid grid-cols-2 gap-2 animate-in slide-in-from-top-2">
                                {instructorClasses?.map((cls: any) => (
                                    <div key={cls.id} onClick={(e) => { e.stopPropagation(); toggleClass(cls.id); }} className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${selectedClasses.includes(cls.id) ? 'bg-indigo-600 border-indigo-700 text-white shadow-inner' : 'bg-white border-indigo-100 text-indigo-900 hover:bg-indigo-50'}`}>
                                        <span className="font-bold text-xs truncate pr-2">{cls.name}</span>
                                        {selectedClasses.includes(cls.id) && <CheckCircle2 size={14} />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </button>

                    {/* PUBLIC */}
                    <button onClick={() => setVisibility('public')} className={`w-full p-5 rounded-2xl border-2 flex items-start gap-4 transition-all text-left ${visibility === 'public' ? 'bg-emerald-50/50 border-emerald-500' : 'bg-white border-slate-100 hover:border-emerald-300'}`}>
                        <div className={`p-3 rounded-full ${visibility === 'public' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-slate-100 text-slate-400'}`}><Globe size={24} /></div>
                        <div className="flex-1">
                            <h4 className={`font-black text-lg ${visibility === 'public' ? 'text-emerald-900' : 'text-slate-600'}`}>Global Network (Public)</h4>
                            <p className="text-xs font-bold text-slate-400 mt-1">Publish to the global Magister library. Any student on the platform can practice this deck.</p>
                        </div>
                        {visibility === 'public' && <CheckCircle2 size={24} className="text-emerald-500" />}
                    </button>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button onClick={handleSave} disabled={isSaving} className="px-8 py-4 bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50">
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
export default function CardBuilderView({ onSaveCard, onUpdateCard, onDeleteCard, availableDecks, initialDeckId, onPublishDeck, instructorClasses }: any) {
  // Single Card States
  const [formData, setFormData] = useState({ front: '', back: '', type: 'noun', ipa: '', sentence: '', sentenceTrans: '', grammarTags: '', deckId: initialDeckId || 'custom' });
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [morphology, setMorphology] = useState<any[]>([]);
  const [newMorphPart, setNewMorphPart] = useState({ part: '', meaning: '', type: 'root' });
  
  // Global States
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localOptimisticDecks, setLocalOptimisticDecks] = useState<any>({});
  const [showShareModal, setShowShareModal] = useState(false); // 🔥 Added Publishing Modal State
  
  // Bulk Import States
  const [importMode, setImportMode] = useState<boolean>(false);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<{current: number, total: number} | null>(null);
  const [bulkDestination, setBulkDestination] = useState<'new' | 'existing'>('new');
  const [bulkNewTitle, setBulkNewTitle] = useState('');
  const [bulkExistingId, setBulkExistingId] = useState('custom');

  const validDecks = { ...availableDecks, ...localOptimisticDecks };
  const deckOptions = Object.entries(validDecks).map(([key, deck]: any) => ({ id: key, title: deck.title })); 
  const currentDeckCards = validDecks[formData.deckId] ? validDecks[formData.deckId].cards || [] : [];

  useEffect(() => { if (initialDeckId) setFormData(prev => ({...prev, deckId: initialDeckId})); }, [initialDeckId]);
  
  const handleChange = (e: any) => { 
    if (e.target.name === 'deckId') { 
        if (e.target.value === 'new') { 
            setIsCreatingDeck(true); 
            setFormData({ ...formData, deckId: 'new' }); 
        } else { 
            setIsCreatingDeck(false); 
            setFormData({ ...formData, deckId: e.target.value }); 
        } 
    } else { 
        setFormData({ ...formData, [e.target.name]: e.target.value }); 
    } 
  };

  const addMorphology = () => { if (newMorphPart.part && newMorphPart.meaning) { setMorphology([...morphology, newMorphPart]); setNewMorphPart({ part: '', meaning: '', type: 'root' }); } };
  const removeMorphology = (index: number) => { setMorphology(morphology.filter((_, i) => i !== index)); };
  
  const handleSelectCard = (card: any) => { 
    setImportMode(false); 
    setEditingId(card.id); 
    setFormData({ front: card.front, back: card.back, type: card.type || 'noun', ipa: card.ipa || '', sentence: card.usage?.sentence || '', sentenceTrans: card.usage?.translation || '', grammarTags: card.grammar_tags?.join(', ') || '', deckId: card.deckId || formData.deckId }); 
    setMorphology(card.morphology || []); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleClear = () => { 
    setEditingId(null); 
    setFormData(prev => ({ ...prev, front: '', back: '', type: 'noun', ipa: '', sentence: '', sentenceTrans: '', grammarTags: '' })); 
    setMorphology([]); 
  };

  // Explicitly force Firebase to recognize the new Deck Folder
  const registerNewDeck = async (deckId: string, deckTitle: string) => {
      try {
          const deckRef = doc(db, 'artifacts', appId, 'decks', deckId);
          await setDoc(deckRef, { id: deckId, key: deckId, title: deckTitle, type: 'vocabulary', createdAt: new Date().toISOString() }, { merge: true });
      } catch (err) { console.error("Failed to register deck:", err); }
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
        mastery: 0, morphology: morphology.length > 0 ? morphology : [{ part: formData.front, meaning: "Root", type: "root" }], 
        usage: { sentence: formData.sentence || "-", translation: formData.sentenceTrans || "-" }, 
        grammar_tags: formData.grammarTags ? formData.grammarTags.split(',').map(t => t.trim()) : ["Custom"] 
    }; 

    if (!editingId) {
        setLocalOptimisticDecks((prev: any) => {
            const existingDeck = prev[finalDeckId] || validDecks[finalDeckId] || { title: finalDeckTitle || 'Custom Deck', cards: [] };
            return { ...prev, [finalDeckId]: { ...existingDeck, title: finalDeckTitle || existingDeck.title, cards: [...existingDeck.cards, { id: `temp_${Date.now()}`, ...cardData }] } };
        });
    }

    if (editingId) { 
        await onUpdateCard(editingId, cardData); 
        setToastMsg("Target Updated Successfully"); 
    } else { 
        await onSaveCard(cardData); 
        setToastMsg("Target Forged Successfully"); 
    } 

    handleClear(); 
    if (isCreatingDeck) { 
        setIsCreatingDeck(false); 
        setNewDeckTitle(''); 
        setFormData(prev => ({ ...prev, deckId: finalDeckId })); 
    } 
  };

  const handleBulkImport = async () => {
    try {
        const cards = JSON.parse(jsonInput);
        if (!Array.isArray(cards)) throw new Error("JSON must be an array");

        let finalDeckId = bulkExistingId;
        let finalDeckTitle = validDecks[bulkExistingId]?.title || 'Custom Deck';
        
        if (bulkDestination === 'new') {
            if (!bulkNewTitle.trim()) return alert("Please name your new deck in the input field above.");
            finalDeckId = `deck_${Date.now()}`;
            finalDeckTitle = bulkNewTitle.trim();
            await registerNewDeck(finalDeckId, finalDeckTitle);
        }

        setLocalOptimisticDecks((prev: any) => ({
            ...prev,
            [finalDeckId]: prev[finalDeckId] || validDecks[finalDeckId] || { title: finalDeckTitle, cards: [] }
        }));

        setIsImporting(true);
        setImportProgress({ current: 0, total: cards.length });

        let successCount = 0;
        
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            if (!card.front || !card.back) continue; 
            
            const cardData = {
                front: card.front,
                back: card.back,
                type: card.type || 'noun',
                deckId: finalDeckId,
                deckTitle: finalDeckTitle,
                ipa: card.ipa || "/.../",
                mastery: 0,
                morphology: card.morphology || [{ part: card.front, meaning: "Root", type: "root" }],
                usage: { sentence: card.sentence || "-", translation: card.translation || "-" },
                grammar_tags: card.grammarTags || ["Imported"]
            };
            
            try {
                await onSaveCard(cardData); 
                successCount++;
                setImportProgress({ current: successCount, total: cards.length });
                
                setLocalOptimisticDecks((prev: any) => {
                    const existingDeck = prev[finalDeckId];
                    return { ...prev, [finalDeckId]: { ...existingDeck, cards: [...existingDeck.cards, { id: `temp_${Date.now()}_${i}`, ...cardData }] } };
                });

                await new Promise(resolve => setTimeout(resolve, 250));
            } catch (err) { console.error(`Failed to save target: ${card.front}`, err); }
        }

        setToastMsg(`Successfully forged ${successCount} targets into ${finalDeckTitle}!`);
        setJsonInput('');
        
        // Reset bulk state and sync single card state so inventory updates
        if (bulkDestination === 'new') {
            setBulkNewTitle('');
            setBulkDestination('existing');
            setBulkExistingId(finalDeckId);
            setFormData(prev => ({ ...prev, deckId: finalDeckId }));
        }

    } catch (e: any) {
        alert("Invalid JSON format. Please check your syntax.");
    } finally {
        setIsImporting(false);
        setImportProgress(null);
    }
  };
  
  useEffect(() => { if (editingId && !currentDeckCards.some((c: any) => c.id === editingId)) { handleClear(); } }, [currentDeckCards, editingId]);

  const jsonTemplate = `[\n  { "front": "canis", "back": "dog", "type": "noun" },\n  { "front": "videre", "back": "to see", "type": "verb" }\n]`;

  return (
    <div className="space-y-6 relative pb-12 font-sans">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      
      {/* THE PUBLISHING MODAL */}
      {showShareModal && validDecks[formData.deckId] && (
          <DeckShareModal 
              deck={{ ...validDecks[formData.deckId], id: formData.deckId }} 
              instructorClasses={instructorClasses || []} 
              onClose={() => setShowShareModal(false)}
              onPublish={onPublishDeck}
          />
      )}
      
      <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4 text-sm text-indigo-800 flex justify-between items-center">
        <div><p className="font-bold flex items-center gap-2"><Layers size={16}/> Deck Builder</p></div>
        {editingId && <button onClick={handleClear} className="text-xs font-bold bg-white px-3 py-1 rounded-lg shadow-sm hover:text-indigo-600">Cancel Edit</button>}
      </div>

      {/* TABS FOR CREATION MODE */}
      <div className="flex gap-6 border-b-2 border-slate-100 relative bottom-[-1px]">
          <button disabled={isImporting} onClick={() => setImportMode(false)} className={`pb-4 text-sm font-black uppercase tracking-widest transition-colors border-b-4 flex items-center gap-2 ${!importMode ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'} disabled:opacity-50`}>
              <Edit3 size={16} /> Single Target
          </button>
          <button disabled={isImporting} onClick={() => { setImportMode(true); handleClear(); }} className={`pb-4 text-sm font-black uppercase tracking-widest transition-colors border-b-4 flex items-center gap-2 ${importMode ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'} disabled:opacity-50`}>
              <FileJson size={16} /> Bulk JSON Protocol
          </button>
      </div>

      {/* MODE 1: SINGLE CARD (Has its own destination dropdown) */}
      {!importMode ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Database size={16} className="text-indigo-500" /> Target Deck
                </h3>
                <select name="deckId" value={formData.deckId} onChange={handleChange} disabled={!!editingId} className="w-full p-4 rounded-xl border-2 border-slate-200 bg-indigo-50/30 font-black text-indigo-900 focus:border-indigo-500 outline-none transition-colors mb-3 cursor-pointer">
                    <option value="custom">✍️ Scriptorium (My Deck)</option>
                    {deckOptions.filter(d => d.id !== 'custom').map(d => (<option key={d.id} value={d.id}>{d.title}</option>))}
                    <option value="new">✨ + Create New Deck</option>
                </select>
                {isCreatingDeck && (
                    <input value={newDeckTitle} onChange={(e) => setNewDeckTitle(e.target.value)} placeholder="Enter new deck name..." className="w-full p-4 rounded-xl border-2 border-indigo-500 bg-white font-black outline-none shadow-sm animate-in slide-in-from-top-2" autoFocus />
                )}
            </section>

            <section className="space-y-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Core Data</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="front" value={formData.front} onChange={handleChange} className="w-full p-4 rounded-xl border-2 border-slate-200 font-bold focus:border-indigo-500 outline-none" placeholder="Target Word (e.g. canis)" />
                    <input name="back" value={formData.back} onChange={handleChange} className="w-full p-4 rounded-xl border-2 border-slate-200 font-bold focus:border-indigo-500 outline-none" placeholder="Meaning (e.g. dog)" />
                </div>
            </section>

            <section className="space-y-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Morphology Breakdowns</h3>
                <div className="flex gap-2 items-stretch">
                    <input value={newMorphPart.part} onChange={(e) => setNewMorphPart({...newMorphPart, part: e.target.value})} className="flex-1 p-3 rounded-xl border-2 border-slate-200 text-sm font-bold outline-none focus:border-indigo-500" placeholder="Root/Suffix" />
                    <input value={newMorphPart.meaning} onChange={(e) => setNewMorphPart({...newMorphPart, meaning: e.target.value})} className="flex-1 p-3 rounded-xl border-2 border-slate-200 text-sm font-bold outline-none focus:border-indigo-500" placeholder="Meaning" />
                    <button type="button" onClick={addMorphology} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-indigo-600 transition-colors shadow-md active:scale-95"><Plus size={20}/></button>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                    {morphology.map((m, i) => (
                        <div key={i} className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 pl-4 pr-2 py-2 rounded-full text-sm shadow-sm">
                            <span className="font-black text-indigo-900">{m.part}</span><span className="text-indigo-700 font-bold">({m.meaning})</span>
                            <button type="button" onClick={() => removeMorphology(i)} className="text-indigo-400 hover:text-rose-500 ml-1 bg-white rounded-full p-1 shadow-sm"><X size={14}/></button>
                        </div>
                    ))}
                </div>
            </section>

            <button onClick={handleSubmit} className={`w-full text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 ${editingId ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'}`}>
                {editingId ? <><Save size={20}/> Update Vocabulary Target</> : <><Plus size={20}/> Forge Vocabulary Target</>}
            </button>
          </div>
      ) : (
          /* MODE 2: BULK IMPORT (Has strict destination controls) */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              
              {/* BULK DESTINATION CONTROL */}
              <section className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 shadow-sm">
                  <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-4">Destination Deck</h3>
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                      <button onClick={() => setBulkDestination('new')} disabled={isImporting} className={`flex-1 p-4 rounded-xl border-2 flex items-center gap-3 transition-colors ${bulkDestination === 'new' ? 'border-indigo-600 bg-white text-indigo-700 shadow-sm' : 'border-slate-200 bg-transparent text-slate-500 hover:bg-slate-100'} disabled:opacity-50`}>
                          <FolderPlus size={20} /> <span className="font-black text-sm uppercase">Create New</span>
                      </button>
                      <button onClick={() => setBulkDestination('existing')} disabled={isImporting} className={`flex-1 p-4 rounded-xl border-2 flex items-center gap-3 transition-colors ${bulkDestination === 'existing' ? 'border-indigo-600 bg-white text-indigo-700 shadow-sm' : 'border-slate-200 bg-transparent text-slate-500 hover:bg-slate-100'} disabled:opacity-50`}>
                          <FolderOpen size={20} /> <span className="font-black text-sm uppercase">Add to Existing</span>
                      </button>
                  </div>
                  
                  {bulkDestination === 'new' ? (
                      <input value={bulkNewTitle} onChange={(e) => setBulkNewTitle(e.target.value)} disabled={isImporting} placeholder="Name your new deck (e.g. Unit 1 Vocab)" className="w-full p-4 rounded-xl border-2 border-indigo-500 bg-white font-black outline-none shadow-sm animate-in fade-in" autoFocus />
                  ) : (
                      <select value={bulkExistingId} onChange={(e) => setBulkExistingId(e.target.value)} disabled={isImporting} className="w-full p-4 rounded-xl border-2 border-indigo-500 bg-white font-black outline-none shadow-sm animate-in fade-in cursor-pointer">
                          <option value="custom">✍️ Scriptorium (My Deck)</option>
                          {deckOptions.filter(d => d.id !== 'custom').map(d => (<option key={d.id} value={d.id}>{d.title}</option>))}
                      </select>
                  )}
              </section>

              <section className="bg-slate-900 p-6 rounded-3xl border-4 border-slate-800 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="font-black text-white text-sm uppercase tracking-widest">JSON Payload</h3>
                      <button disabled={isImporting} onClick={() => setJsonInput(jsonTemplate)} className="text-[10px] font-black uppercase text-indigo-400 hover:text-white transition-colors tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 disabled:opacity-50">Paste Template</button>
                  </div>
                  <textarea 
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      disabled={isImporting}
                      placeholder="Paste your JSON array here..."
                      className="w-full h-64 bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-sm border-2 border-slate-800 focus:border-indigo-500 outline-none resize-y custom-scrollbar disabled:opacity-50"
                      spellCheck="false"
                  />
              </section>

              <button 
                  onClick={handleBulkImport} 
                  disabled={!jsonInput.trim() || isImporting} 
                  className={`w-full text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 ${isImporting ? 'bg-amber-500 shadow-amber-500/30' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30 disabled:bg-slate-300 disabled:shadow-none'}`}
              >
                  {isImporting ? (
                      <><Loader2 size={20} className="animate-spin" /> Forging Targets ({importProgress?.current} / {importProgress?.total})...</>
                  ) : (
                      <><Database size={20}/> Process & Import Deck</>
                  )}
              </button>
          </div>
      )}

      {/* DECK INVENTORY & NETWORK ACCESS BUTTON */}
      {currentDeckCards.length > 0 && (
          <div className="pt-10 mt-10 border-t-2 border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs">Deck Inventory</h3>
                
                <div className="flex items-center gap-3">
                    {/* 🔥 THE NEW PUBLISH BUTTON */}
                    <button 
                        onClick={() => setShowShareModal(true)}
                        className="bg-indigo-100 hover:bg-indigo-600 text-indigo-600 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm active:scale-95"
                    >
                        <Share2 size={14} /> Network Access
                    </button>
                    <span className="bg-slate-100 text-slate-500 px-3 py-2 rounded-xl text-[10px] font-black tracking-widest">{currentDeckCards.length} Targets</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentDeckCards.map((card: any) => (
                      <div key={card.id} onClick={() => !isImporting && handleSelectCard(card)} className={`p-4 rounded-2xl border-2 flex justify-between items-center cursor-pointer transition-all group ${editingId === card.id ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-sm'} ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
                          <div className="flex flex-col">
                              <span className="font-black text-slate-800">{card.front}</span>
                              <span className="text-xs font-bold text-slate-400 mt-0.5">{card.back}</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-100 transition-colors"><Edit3 size={14} /></div>
                              {!(INITIAL_SYSTEM_DECKS as any)[card.deckId] && (
                                  <button onClick={(e) => { e.stopPropagation(); !isImporting && onDeleteCard(card.id); }} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 hover:bg-rose-500 hover:text-white transition-all">
                                      <Trash2 size={14}/>
                                  </button>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
}
