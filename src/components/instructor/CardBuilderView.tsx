// src/components/instructor/CardBuilderView.tsx
import React, { useState, useEffect } from 'react';
import { Layers, Plus, X, Save, Edit3, Trash2 } from 'lucide-react';
import { INITIAL_SYSTEM_DECKS } from '../../constants/defaults';
import { Toast } from '../Toast';

export default function CardBuilderView({ onSaveCard, onUpdateCard, onDeleteCard, availableDecks, initialDeckId }: any) {
  const [formData, setFormData] = useState({ front: '', back: '', type: 'noun', ipa: '', sentence: '', sentenceTrans: '', grammarTags: '', deckId: initialDeckId || 'custom' });
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [morphology, setMorphology] = useState<any[]>([]);
  const [newMorphPart, setNewMorphPart] = useState({ part: '', meaning: '', type: 'root' });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

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
  
  const validDecks = availableDecks || {}; 
  const deckOptions = Object.entries(validDecks).map(([key, deck]: any) => ({ id: key, title: deck.title })); 
  const currentDeckCards = validDecks[formData.deckId] ? validDecks[formData.deckId].cards || [] : validDecks['custom'] ? validDecks['custom'].cards || [] : [];
  
  useEffect(() => { if (editingId && !currentDeckCards.some((c: any) => c.id === editingId)) { handleClear(); } }, [currentDeckCards, editingId]);

  return (
    <div className="space-y-6 relative">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4 text-sm text-indigo-800 flex justify-between items-center">
        <div><p className="font-bold flex items-center gap-2"><Layers size={16}/> {editingId ? 'Editing Card' : 'Card Creator'}</p></div>
        {editingId && <button onClick={handleClear} className="text-xs font-bold bg-white px-3 py-1 rounded-lg shadow-sm hover:text-indigo-600">Cancel Edit</button>}
      </div>
      
      <section className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Core Data</h3>
        <select name="deckId" value={formData.deckId} onChange={handleChange} disabled={!!editingId} className="w-full p-3 rounded-lg border border-slate-200 bg-indigo-50/50 font-bold text-indigo-900">
            <option value="custom">✍️ Scriptorium (My Deck)</option>
            {deckOptions.filter(d => d.id !== 'custom').map(d => (<option key={d.id} value={d.id}>{d.title}</option>))}
            <option value="new">✨ + Create New Deck</option>
        </select>
        {isCreatingDeck && <input value={newDeckTitle} onChange={(e) => setNewDeckTitle(e.target.value)} placeholder="New Deck Name" className="w-full p-3 rounded-lg border-2 border-indigo-500 bg-white font-bold" autoFocus />}
        <div className="grid grid-cols-2 gap-4">
            <input name="front" value={formData.front} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200 font-bold" placeholder="Word" />
            <input name="back" value={formData.back} onChange={handleChange} className="w-full p-3 rounded-lg border border-slate-200" placeholder="Meaning" />
        </div>
      </section>

      <section className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Morphology</h3>
        <div className="flex gap-2 items-end">
            <input value={newMorphPart.part} onChange={(e) => setNewMorphPart({...newMorphPart, part: e.target.value})} className="flex-1 p-2 rounded-lg border border-slate-200 text-sm" placeholder="Part" />
            <input value={newMorphPart.meaning} onChange={(e) => setNewMorphPart({...newMorphPart, meaning: e.target.value})} className="flex-1 p-2 rounded-lg border border-slate-200 text-sm" placeholder="Meaning" />
            <button type="button" onClick={addMorphology} className="bg-indigo-100 text-indigo-600 p-2 rounded-lg hover:bg-indigo-200"><Plus size={20}/></button>
        </div>
        <div className="flex flex-wrap gap-2">{morphology.map((m, i) => (<div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-sm"><span className="font-bold text-indigo-700">{m.part}</span><span>({m.meaning})</span><button type="button" onClick={() => removeMorphology(i)} className="text-slate-300 hover:text-rose-500"><X size={14}/></button></div>))}</div>
      </section>

      <button onClick={handleSubmit} className={`w-full text-white p-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${editingId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
        {editingId ? <><Save size={20}/> Update Card</> : <><Plus size={20}/> Create Card</>}
      </button>

      {currentDeckCards.length > 0 && (
          <div className="pt-6 border-t border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4">Cards in this Deck ({currentDeckCards.length})</h3>
              <div className="space-y-2">{currentDeckCards.map((card: any) => (
                  <div key={card.id} onClick={() => handleSelectCard(card)} className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-colors ${editingId === card.id ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                      <div><span className="font-bold text-slate-800">{card.front}</span><span className="text-slate-400 mx-2">•</span><span className="text-sm text-slate-500">{card.back}</span></div>
                      <div className="flex items-center gap-2"><Edit3 size={16} className="text-indigo-400" />{!(INITIAL_SYSTEM_DECKS as any)[card.deckId] && (<button onClick={(e) => { e.stopPropagation(); onDeleteCard(card.id); }} className="p-1 text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button>)}</div>
                  </div>
              ))}</div>
          </div>
      )}
    </div>
  );
}
