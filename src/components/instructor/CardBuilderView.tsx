// src/components/instructor/CardBuilderView.tsx
import React, { useState, useEffect } from 'react';
import { Layers, Plus, X, Save, Edit3, Trash2, FileJson, Database } from 'lucide-react';
import { INITIAL_SYSTEM_DECKS } from '../../constants/defaults';
import { Toast } from '../Toast';

export default function CardBuilderView({ onSaveCard, onUpdateCard, onDeleteCard, availableDecks, initialDeckId }: any) {
  // Core States
  const [formData, setFormData] = useState({ front: '', back: '', type: 'noun', ipa: '', sentence: '', sentenceTrans: '', grammarTags: '', deckId: initialDeckId || 'custom' });
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [morphology, setMorphology] = useState<any[]>([]);
  const [newMorphPart, setNewMorphPart] = useState({ part: '', meaning: '', type: 'root' });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New Importer State
  const [importMode, setImportMode] = useState<boolean>(false);
  const [jsonInput, setJsonInput] = useState<string>('');

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
    setImportMode(false); // Switch to single mode to edit
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

  // 1. SINGLE CARD SUBMIT
  const handleSubmit = (e: any) => { 
    e.preventDefault(); 
    if (!formData.front || !formData.back) return; 
    
    let finalDeckId = formData.deckId; 
    let finalDeckTitle = null; 
    if (formData.deckId === 'new') { 
        if (!newDeckTitle) return alert("Please name your new deck."); 
        finalDeckId = `custom_${Date.now()}`; 
        finalDeckTitle = newDeckTitle; 
    } 

    const cardData = { 
        front: formData.front, back: formData.back, type: formData.type, 
        deckId: finalDeckId, deckTitle: finalDeckTitle, ipa: formData.ipa || "/.../", 
        mastery: 0, morphology: morphology.length > 0 ? morphology : [{ part: formData.front, meaning: "Root", type: "root" }], 
        usage: { sentence: formData.sentence || "-", translation: formData.sentenceTrans || "-" }, 
        grammar_tags: formData.grammarTags ? formData.grammarTags.split(',').map(t => t.trim()) : ["Custom"] 
    }; 

    if (editingId) { 
        onUpdateCard(editingId, cardData); 
        setToastMsg("Card Updated Successfully"); 
    } else { 
        onSaveCard(cardData); 
        setToastMsg("Card Created Successfully"); 
    } 

    handleClear(); 
    if (isCreatingDeck) { 
        setIsCreatingDeck(false); 
        setNewDeckTitle(''); 
        setFormData(prev => ({ ...prev, deckId: finalDeckId })); 
    } 
  };

  // 2. BULK JSON SUBMIT
  const handleBulkImport = async () => {
    try {
        const cards = JSON.parse(jsonInput);
        if (!Array.isArray(cards)) throw new Error("JSON must be an array");

        let finalDeckId = formData.deckId;
        let finalDeckTitle = null;
        if (formData.deckId === 'new') {
            if (!newDeckTitle) return alert("Please name your new deck.");
            finalDeckId = `custom_${Date.now()}`;
            finalDeckTitle = newDeckTitle;
        }

        let successCount = 0;
        for (const card of cards) {
            if (!card.front || !card.back) continue; // Skip invalid entries
            
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
            
            // Note: If you have hundreds of cards, consider adding a bulk add method to your actions
            await onSaveCard(cardData); 
            successCount++;
        }

        setToastMsg(`Successfully imported ${successCount} cards!`);
        setJsonInput('');
        setImportMode(false);

        if (isCreatingDeck) {
            setIsCreatingDeck(false);
            setNewDeckTitle('');
            setFormData(prev => ({ ...prev, deckId: finalDeckId }));
        }

    } catch (e: any) {
        alert("Invalid JSON format. Please check your syntax.");
    }
  };
  
  const validDecks = availableDecks || {}; 
  const deckOptions = Object.entries(validDecks).map(([key, deck]: any) => ({ id: key, title: deck.title })); 
  const currentDeckCards = validDecks[formData.deckId] ? validDecks[formData.deckId].cards || [] : validDecks['custom'] ? validDecks['custom'].cards || [] : [];
  
  useEffect(() => { if (editingId && !currentDeckCards.some((c: any) => c.id === editingId)) { handleClear(); } }, [currentDeckCards, editingId]);

  const jsonTemplate = `[\n  { "front": "canis", "back": "dog", "type": "noun" },\n  { "front": "videre", "back": "to see", "type": "verb" }\n]`;

  return (
    <div className="space-y-6 relative pb-12">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      
      <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4 text-sm text-indigo-800 flex justify-between items-center">
        <div><p className="font-bold flex items-center gap-2"><Layers size={16}/> Deck Builder</p></div>
        {editingId && <button onClick={handleClear} className="text-xs font-bold bg-white px-3 py-1 rounded-lg shadow-sm hover:text-indigo-600">Cancel Edit</button>}
      </div>
      
      {/* 1. UNIVERSAL DECK SELECTION (Applies to both Single and Bulk) */}
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

      {/* TABS FOR CREATION MODE */}
      <div className="flex gap-6 border-b-2 border-slate-100 relative bottom-[-1px]">
          <button onClick={() => setImportMode(false)} className={`pb-4 text-sm font-black uppercase tracking-widest transition-colors border-b-4 flex items-center gap-2 ${!importMode ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              <Edit3 size={16} /> Single Card
          </button>
          <button onClick={() => { setImportMode(true); handleClear(); }} className={`pb-4 text-sm font-black uppercase tracking-widest transition-colors border-b-4 flex items-center gap-2 ${importMode ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              <FileJson size={16} /> Bulk JSON Import
          </button>
      </div>

      {/* 2. MODE: SINGLE CARD */}
      {!importMode ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
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
          /* 3. MODE: BULK IMPORT */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <section className="bg-slate-900 p-6 rounded-3xl border-4 border-slate-800 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="font-black text-white text-sm uppercase tracking-widest">JSON Payload</h3>
                      <button onClick={() => setJsonInput(jsonTemplate)} className="text-[10px] font-black uppercase text-indigo-400 hover:text-white transition-colors tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">Paste Template</button>
                  </div>
                  <textarea 
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder="Paste your JSON array here..."
                      className="w-full h-64 bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-sm border-2 border-slate-800 focus:border-indigo-500 outline-none resize-y custom-scrollbar"
                      spellCheck="false"
                  />
                  <p className="text-xs font-bold text-slate-500 mt-4 text-center">Ensure your JSON is a valid array of objects containing <span className="text-emerald-400">"front"</span> and <span className="text-emerald-400">"back"</span> keys.</p>
              </section>

              <button onClick={handleBulkImport} disabled={!jsonInput.trim()} className="w-full bg-indigo-600 disabled:bg-slate-300 disabled:shadow-none text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/30 active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-indigo-500">
                  <Database size={20}/> Process & Import Deck
              </button>
          </div>
      )}

      {/* DECK INVENTORY (Always visible at bottom) */}
      {currentDeckCards.length > 0 && (
          <div className="pt-10 mt-10 border-t-2 border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs">Deck Inventory</h3>
                <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black tracking-widest">{currentDeckCards.length} Targets</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentDeckCards.map((card: any) => (
                      <div key={card.id} onClick={() => handleSelectCard(card)} className={`p-4 rounded-2xl border-2 flex justify-between items-center cursor-pointer transition-all group ${editingId === card.id ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-sm'}`}>
                          <div className="flex flex-col">
                              <span className="font-black text-slate-800">{card.front}</span>
                              <span className="text-xs font-bold text-slate-400 mt-0.5">{card.back}</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-100 transition-colors"><Edit3 size={14} /></div>
                              {!(INITIAL_SYSTEM_DECKS as any)[card.deckId] && (
                                  <button onClick={(e) => { e.stopPropagation(); onDeleteCard(card.id); }} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 hover:bg-rose-500 hover:text-white transition-all">
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
