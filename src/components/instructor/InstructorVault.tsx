// src/components/instructor/InstructorVault.tsx
import React, { useState, useMemo } from 'react';
import { 
    Search, BookOpen, Layers, Clock, Edit3, 
    Play, ShieldAlert, ArrowDownAZ, LayoutGrid, 
    Trash2, CheckSquare, Square, Folder, FolderPlus, X, ChevronRight, FolderOpen, Archive
} from 'lucide-react';

export default function InstructorVault({ decks = {}, lessons = [], onLaunchLive, onEditArtifact, onDeleteArtifact, onMoveToFolder }: any) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'lesson' | 'deck'>('all');
    const [sortBy, setSortBy] = useState<'recent' | 'alpha'>('recent');
    const [currentPath, setCurrentPath] = useState<string[]>([]);
    
    const [selectedArtifacts, setSelectedArtifacts] = useState<Record<string, {type: string, title: string}>>({});
    const [pendingDelete, setPendingDelete] = useState<{id: string, type: string, title: string}[] | null>(null);
    const [showFolderMenu, setShowFolderMenu] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    const artifacts = useMemo(() => {
        const availableDecks = Object.values(decks || {}).filter((d: any) => d.id && d.id !== 'custom');
        const normalizedDecks = availableDecks.map((d: any) => ({
            ...d, artifactType: 'deck', displayTitle: d.title || d.name || 'Untitled Crystal', displayDesc: d.description || 'Flashcard data crystal.',
            metric: `${d.cards?.length || 0} Cards`, timestamp: d.updatedAt || d.createdAt || 0, folder: d.folder || null
        }));
        const normalizedLessons = lessons.map((l: any) => ({
            ...l, artifactType: 'lesson', displayTitle: l.title || 'Untitled Payload', displayDesc: l.description || 'Interactive lesson payload.',
            metric: `${l.blocks?.length || 0} Blocks`, timestamp: l.updatedAt || l.createdAt || 0, folder: l.folder || null
        }));
        return [...normalizedDecks, ...normalizedLessons];
    }, [decks, lessons]);

    const { displayFiles, sortedFolders, allAbsoluteFolders } = useMemo(() => {
        const isSearching = searchQuery.trim().length > 0;
        let baseFiles = artifacts.filter((a: any) => filterType === 'all' || a.artifactType === filterType);
        
        if (isSearching) {
            const lowerQuery = searchQuery.toLowerCase();
            baseFiles = baseFiles.filter((a: any) => a.displayTitle.toLowerCase().includes(lowerQuery) || a.displayDesc.toLowerCase().includes(lowerQuery));
        }

        baseFiles.sort((a: any, b: any) => sortBy === 'recent' ? b.timestamp - a.timestamp : a.displayTitle.localeCompare(b.displayTitle));

        const vfsFolders = new Set<string>();
        let filesInView: any[] = [];
        const absoluteFolders = new Set(artifacts.map((a: any) => a.folder).filter(Boolean));

        if (isSearching) {
            filesInView = baseFiles; 
        } else {
            baseFiles.forEach((a: any) => {
                const aPathStr = String(a.folder || '').trim();
                const aPath = aPathStr ? aPathStr.split('/').map((p: string) => p.trim()).filter(Boolean) : [];

                let matchesPath = true;
                for (let i = 0; i < currentPath.length; i++) {
                    if (aPath[i] !== currentPath[i]) {
                        matchesPath = false; break;
                    }
                }

                if (matchesPath) {
                    if (aPath.length === currentPath.length) filesInView.push(a); 
                    else if (aPath.length > currentPath.length) vfsFolders.add(aPath[currentPath.length]); 
                }
            });
        }
        return { displayFiles: filesInView, sortedFolders: Array.from(vfsFolders).sort(), allAbsoluteFolders: Array.from(absoluteFolders).sort() };
    }, [artifacts, searchQuery, filterType, sortBy, currentPath]);

    const toggleSelection = (id: string, type: string, title: string) => {
        setSelectedArtifacts(prev => { const next = { ...prev }; if (next[id]) delete next[id]; else next[id] = { type, title }; return next; });
    };

    const clearSelection = () => setSelectedArtifacts({});

    const handleConfirmDelete = () => {
        if (!pendingDelete) return;
        pendingDelete.forEach(item => onDeleteArtifact(item.id, item.type));
        setPendingDelete(null);
        clearSelection();
    };

    const handleBulkMoveToFolder = (folderName: string) => {
        if (onMoveToFolder) {
            Object.entries(selectedArtifacts).forEach(([id, data]) => onMoveToFolder(id, data.type, folderName));
        }
        setShowFolderMenu(false);
        setNewFolderName('');
        clearSelection();
    };

    const selectedCount = Object.keys(selectedArtifacts).length;

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden animate-in fade-in duration-500 relative transition-colors duration-300">
            
            {/* DELETION CONFIRMATION OVERLAY */}
            {pendingDelete && (
                <div className="absolute inset-0 z-[9999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
                    <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full text-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <ShieldAlert size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Confirm Deletion</h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                            {pendingDelete.length === 1 ? `Are you sure you want to delete "${pendingDelete[0].title}"? This cannot be undone.` : `Are you sure you want to permanently delete ${pendingDelete.length} artifacts?`}
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setPendingDelete(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors">Cancel</button>
                            <button onClick={handleConfirmDelete} className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-rose-600/20">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* UNIFIED HEADER */}
            <header className="h-24 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 md:px-10 flex justify-between items-center shrink-0 z-40 shadow-sm transition-colors duration-300 select-none">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hidden sm:flex transition-all duration-500 shadow-inner dark:shadow-none">
                        <Archive size={22} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Library</h2>
                        <p className="text-sm font-medium text-slate-500 mt-0.5">Manage and deploy all saved content</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative w-full sm:w-64 hidden md:block">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search library..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-indigo-500 transition-all shadow-sm text-sm"
                        />
                    </div>
                    
                    <div className="hidden sm:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 shadow-inner border border-slate-200 dark:border-slate-700">
                        <button onClick={() => setSortBy('recent')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${sortBy === 'recent' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                            <Clock size={16} /> Recent
                        </button>
                        <button onClick={() => setSortBy('alpha')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${sortBy === 'alpha' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                            <ArrowDownAZ size={16} /> A-Z
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-8 py-8 pb-32 relative">
                {/* TOOLBAR */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8 shrink-0 select-none">
                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-full sm:w-fit overflow-x-auto shadow-inner border border-slate-200 dark:border-slate-800 [&::-webkit-scrollbar]:hidden">
                        <button onClick={() => setFilterType('all')} className={`flex-1 sm:flex-none min-w-fit px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shrink-0 ${filterType === 'all' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                            <LayoutGrid size={18} /> All Content
                        </button>
                        <button onClick={() => setFilterType('lesson')} className={`flex-1 sm:flex-none min-w-fit px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shrink-0 ${filterType === 'lesson' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                            <BookOpen size={18} /> Lessons
                        </button>
                        <button onClick={() => setFilterType('deck')} className={`flex-1 sm:flex-none min-w-fit px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shrink-0 ${filterType === 'deck' ? 'bg-white dark:bg-slate-700 text-fuchsia-600 dark:text-fuchsia-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                            <Layers size={18} /> Flashcards
                        </button>
                    </div>

                    {/* Breadcrumbs */}
                    {!searchQuery && (
                        <div className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-slate-500">
                            <button onClick={() => setCurrentPath([])} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${currentPath.length === 0 ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                <FolderOpen size={16}/> Root
                            </button>
                            {currentPath.map((segment, idx) => {
                                const isLast = idx === currentPath.length - 1;
                                return (
                                    <React.Fragment key={idx}>
                                        <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
                                        <button onClick={() => setCurrentPath(currentPath.slice(0, idx + 1))} className={`px-3 py-1.5 rounded-lg transition-colors ${isLast ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                            {segment}
                                        </button>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* FOLDERS */}
                {!searchQuery && sortedFolders.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10 select-none">
                        {sortedFolders.map((folder: string) => (
                            <button key={folder} onClick={() => setCurrentPath([...currentPath, folder])} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all active:scale-[0.98] group text-left shadow-sm">
                                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0 transition-colors group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20">
                                    <Folder size={20} className="text-indigo-500 dark:text-indigo-400 transition-colors" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate text-base">{folder}</span>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Directory</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* FILES */}
                {displayFiles.length === 0 && sortedFolders.length === 0 ? (
                    <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center p-12 bg-white/50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 select-none">
                        <ShieldAlert size={48} className="mb-4 text-slate-300 dark:text-slate-600" />
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">Directory Empty</h3>
                        <p className="text-slate-500 font-medium max-w-sm text-sm">No artifacts reside in this location.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max select-none">
                        {displayFiles.map((artifact: any) => {
                            const isLesson = artifact.artifactType === 'lesson';
                            const typeColor = isLesson ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30' : 'text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-500/10 border-fuchsia-200 dark:border-fuchsia-500/30';
                            const isSelected = !!selectedArtifacts[artifact.id];
                            
                            return (
                                <div key={`${artifact.artifactType}_${artifact.id}`} className={`rounded-2xl p-5 flex flex-col transition-all duration-300 group relative overflow-hidden min-h-[200px] border ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-400 dark:border-indigo-500 shadow-md ring-1 ring-indigo-500/50' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-lg'}`}>
                                    <button onClick={(e) => { e.stopPropagation(); toggleSelection(artifact.id, artifact.artifactType, artifact.displayTitle); }} className="absolute top-5 right-5 z-20 text-slate-300 dark:text-slate-600 hover:text-indigo-500 transition-colors">
                                        {isSelected ? <CheckSquare size={24} className="text-indigo-500" /> : <Square size={24} />}
                                    </button>
                                    
                                    <div className="flex justify-between items-start mb-3 relative z-10 shrink-0">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${typeColor}`}>
                                            {isLesson ? <BookOpen size={20} /> : <Layers size={20} />}
                                        </div>
                                    </div>

                                    <div className="relative z-10 mb-4 flex-1 pr-8">
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight mb-1.5 line-clamp-2">{artifact.displayTitle}</h3>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{artifact.displayDesc}</p>
                                    </div>

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50 relative z-10 shrink-0">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Clock size={12} /> {new Date(artifact.timestamp || Date.now()).toLocaleDateString()}</span>
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">{artifact.metric}</span>
                                        </div>
                                        
                                        <div className={`flex gap-1.5 transition-opacity ${selectedCount > 0 && !isSelected ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                                            <button onClick={() => setPendingDelete([{ id: artifact.id, type: artifact.artifactType, title: artifact.displayTitle }])} className="p-2.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors" title="Delete"><Trash2 size={18} /></button>
                                            <button onClick={() => onEditArtifact(artifact.id, artifact.artifactType)} className="p-2.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors" title="Edit"><Edit3 size={18} /></button>
                                            <button onClick={() => onLaunchLive(artifact.id, artifact.artifactType)} className="p-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-transform active:scale-95 shadow-md" title="Launch"><Play size={18} fill="currentColor" className="ml-0.5" /></button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* SELECTION ACTION BAR */}
            {selectedCount > 0 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[8000] bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-4 py-3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 dark:border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom-12 duration-300 w-[95%] md:w-auto max-w-3xl select-none">
                    <div className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border border-indigo-200 dark:border-indigo-500/30">{selectedCount}</div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 hidden sm:block">Items Selected</span>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block" />

                    <div className="flex gap-2 flex-1 justify-end relative">
                        <div className="relative">
                            <button onClick={() => setShowFolderMenu(!showFolderMenu)} className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors border ${showFolderMenu ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}><FolderPlus size={18} /> Move</button>
                            {showFolderMenu && (
                                <div className="absolute bottom-full right-0 mb-4 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col gap-4 z-50 animate-in fade-in slide-in-from-bottom-2">
                                    <div>
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1 block">Move to Folder</span>
                                        <p className="text-xs font-medium text-slate-500 leading-tight">Use slashes (/) to create sub-directories instantly.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="text" placeholder="e.g. Math/Algebra" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                                        <button onClick={() => newFolderName.trim() && handleBulkMoveToFolder(newFolderName)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold text-sm transition-colors">Move</button>
                                    </div>
                                    {allAbsoluteFolders.length > 0 && (
                                        <>
                                            <div className="h-px w-full bg-slate-100 dark:bg-slate-700 my-1" />
                                            <div className="max-h-40 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                                                <button onClick={() => handleBulkMoveToFolder('')} className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">[Move to Root]</button>
                                                {allAbsoluteFolders.map((f: string) => (
                                                    <button key={String(f)} onClick={() => handleBulkMoveToFolder(String(f))} className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors truncate"><Folder size={14} className="shrink-0 text-slate-400" /><span className="truncate">{String(f)}</span></button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <button onClick={() => { const items = Object.entries(selectedArtifacts).map(([id, data]) => ({ id, type: data.type, title: data.title })); setPendingDelete(items); setShowFolderMenu(false); }} className="px-4 py-2.5 bg-slate-50 hover:bg-rose-50 dark:bg-slate-900 dark:hover:bg-rose-500/10 border border-slate-200 hover:border-rose-200 dark:border-slate-700 dark:hover:border-rose-500/30 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"><Trash2 size={18} /> Delete</button>
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 self-center" />
                        <button onClick={clearSelection} className="px-3 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl flex items-center justify-center transition-colors shrink-0" title="Clear selection"><X size={18} /></button>
                    </div>
                </div>
            )}
        </div>
    );
}
