// src/components/instructor/InstructorVault.tsx
import React, { useState, useMemo } from 'react';
import { 
    Search, BookOpen, Layers, Clock, Edit3, 
    Play, ShieldAlert, ArrowDownAZ, LayoutGrid, 
    Trash2, CheckSquare, Square, Folder, FolderPlus, X, ChevronRight, FolderOpen
} from 'lucide-react';

export default function InstructorVault({ decks = {}, lessons = [], onLaunchLive, onEditArtifact, onDeleteArtifact, onMoveToFolder }: any) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'lesson' | 'deck'>('all');
    const [sortBy, setSortBy] = useState<'recent' | 'alpha'>('recent');
    
    // 🔥 NEW: Virtual File System (VFS) Routing State
    const [currentPath, setCurrentPath] = useState<string[]>([]);
    
    const [selectedArtifacts, setSelectedArtifacts] = useState<Record<string, {type: string, title: string}>>({});
    const [pendingDelete, setPendingDelete] = useState<{id: string, type: string, title: string}[] | null>(null);
    const [showFolderMenu, setShowFolderMenu] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // 1. Normalize and combine Decks and Lessons into a single "Artifacts" pool
    const artifacts = useMemo(() => {
        const availableDecks = Object.values(decks || {}).filter((d: any) => d.id && d.id !== 'custom');
        
        const normalizedDecks = availableDecks.map((d: any) => ({
            ...d,
            artifactType: 'deck',
            displayTitle: d.title || d.name || 'Untitled Crystal',
            displayDesc: d.description || 'Flashcard data crystal.',
            metric: `${d.cards?.length || 0} Cards`,
            timestamp: d.updatedAt || d.createdAt || 0,
            folder: d.folder || null
        }));

        const normalizedLessons = lessons.map((l: any) => ({
            ...l,
            artifactType: 'lesson',
            displayTitle: l.title || 'Untitled Payload',
            displayDesc: l.description || 'Interactive lesson payload.',
            metric: `${l.blocks?.length || 0} Blocks`,
            timestamp: l.updatedAt || l.createdAt || 0,
            folder: l.folder || null
        }));

        return [...normalizedDecks, ...normalizedLessons];
    }, [decks, lessons]);

    // 🔥 THE VIRTUAL FILE SYSTEM ENGINE
    const { displayFiles, sortedFolders, allAbsoluteFolders } = useMemo(() => {
        const isSearching = searchQuery.trim().length > 0;

        // 1. Base Filter (Type & Search)
        let baseFiles = artifacts.filter(a => filterType === 'all' || a.artifactType === filterType);
        
        if (isSearching) {
            const lowerQuery = searchQuery.toLowerCase();
            baseFiles = baseFiles.filter(a => 
                a.displayTitle.toLowerCase().includes(lowerQuery) || 
                a.displayDesc.toLowerCase().includes(lowerQuery)
            );
        }

        // 2. Sort Base Files
        baseFiles.sort((a, b) => {
            if (sortBy === 'recent') return b.timestamp - a.timestamp;
            return a.displayTitle.localeCompare(b.displayTitle);
        });

        // 3. VFS Routing
        const vfsFolders = new Set<string>();
        let filesInView: any[] = [];
        
        // Extract all unique absolute paths for the Move Menu
        const absoluteFolders = new Set(artifacts.map(a => a.folder).filter(Boolean));

        if (isSearching) {
            filesInView = baseFiles; // Flatten the view during searches
        } else {
            baseFiles.forEach(a => {
                const aPathStr = (a.folder || '').trim();
                const aPath = aPathStr ? aPathStr.split('/').map(p => p.trim()).filter(Boolean) : [];

                let matchesPath = true;
                for (let i = 0; i < currentPath.length; i++) {
                    if (aPath[i] !== currentPath[i]) {
                        matchesPath = false;
                        break;
                    }
                }

                if (matchesPath) {
                    if (aPath.length === currentPath.length) {
                        filesInView.push(a); // File lives exactly in this folder
                    } else if (aPath.length > currentPath.length) {
                        vfsFolders.add(aPath[currentPath.length]); // Immediate subfolder exists
                    }
                }
            });
        }

        return {
            displayFiles: filesInView,
            sortedFolders: Array.from(vfsFolders).sort(),
            allAbsoluteFolders: Array.from(absoluteFolders).sort()
        };
    }, [artifacts, searchQuery, filterType, sortBy, currentPath]);

    // 🔥 Bulk Selection Handlers
    const toggleSelection = (id: string, type: string, title: string) => {
        setSelectedArtifacts(prev => {
            const next = { ...prev };
            if (next[id]) delete next[id];
            else next[id] = { type, title };
            return next;
        });
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
            Object.entries(selectedArtifacts).forEach(([id, data]) => {
                onMoveToFolder(id, data.type, folderName);
            });
        }
        setShowFolderMenu(false);
        setNewFolderName('');
        clearSelection();
    };

    const selectedCount = Object.keys(selectedArtifacts).length;

    return (
        <div className="h-full flex flex-col max-w-7xl mx-auto w-full p-4 md:p-8 animate-in fade-in duration-500 overflow-hidden relative">
            
            {/* --- DELETION CONFIRMATION TOAST --- */}
            {pendingDelete && (
                <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900 dark:bg-slate-800 text-white px-6 py-4 rounded-[2rem] shadow-[0_40px_80px_rgba(0,0,0,0.6)] border-4 border-rose-500 flex flex-col sm:flex-row items-center gap-6 animate-in slide-in-from-bottom-12 zoom-in-95 duration-300">
                    <div className="text-center sm:text-left">
                        <p className="text-sm font-black tracking-widest uppercase mb-1 text-rose-400">Confirm Deletion</p>
                        <p className="text-xs text-slate-300 font-bold max-w-[250px] truncate">
                            {pendingDelete.length === 1 
                                ? `"${pendingDelete[0].title}" will be permanently destroyed.` 
                                : `${pendingDelete.length} artifacts will be permanently destroyed.`}
                        </p>
                    </div>
                    <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                        <button 
                            onClick={() => setPendingDelete(null)} 
                            className="flex-1 sm:flex-none px-6 py-3 bg-slate-800 hover:bg-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleConfirmDelete} 
                            className="flex-1 sm:flex-none px-6 py-3 bg-rose-600 hover:bg-rose-500 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-rose-600/20"
                        >
                            Destroy
                        </button>
                    </div>
                </div>
            )}

            {/* --- HEADER & CONTROLS --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 shrink-0">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">The Vault</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Manage and Deploy Artifacts</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Search Bar */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search archives..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-indigo-500 transition-all shadow-sm"
                        />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex bg-slate-200 dark:bg-slate-800 p-1.5 rounded-2xl w-full sm:w-auto shrink-0 shadow-inner">
                        <button onClick={() => setSortBy('recent')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${sortBy === 'recent' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                            <Clock size={14} /> Recent
                        </button>
                        <button onClick={() => setSortBy('alpha')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${sortBy === 'alpha' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                            <ArrowDownAZ size={14} /> A-Z
                        </button>
                    </div>
                </div>
            </div>

            {/* --- TYPE FILTERS --- */}
            <div className="flex gap-3 mb-6 overflow-x-auto custom-scrollbar pb-2 shrink-0">
                <button onClick={() => setFilterType('all')} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 ${filterType === 'all' ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-lg' : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-400'}`}>
                    <LayoutGrid size={16} /> All Types
                </button>
                <button onClick={() => setFilterType('lesson')} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 ${filterType === 'lesson' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-blue-300'}`}>
                    <BookOpen size={16} /> Lessons
                </button>
                <button onClick={() => setFilterType('deck')} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 ${filterType === 'deck' ? 'bg-fuchsia-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-fuchsia-300'}`}>
                    <Layers size={16} /> Data Crystals
                </button>
            </div>

            {/* --- VFS BREADCRUMBS --- */}
            {!searchQuery && (
                <div className="flex flex-wrap items-center gap-2 mb-6 px-2 text-sm font-black uppercase tracking-widest text-slate-500 shrink-0">
                    <button 
                        onClick={() => setCurrentPath([])} 
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${currentPath.length === 0 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' : 'hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <FolderOpen size={16}/> Root
                    </button>
                    {currentPath.map((segment, idx) => {
                        const isLast = idx === currentPath.length - 1;
                        return (
                            <React.Fragment key={idx}>
                                <ChevronRight size={14} className="text-slate-300 dark:text-slate-600" />
                                <button 
                                    onClick={() => setCurrentPath(currentPath.slice(0, idx + 1))} 
                                    className={`px-3 py-1.5 rounded-lg transition-colors ${isLast ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' : 'hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    {segment}
                                </button>
                            </React.Fragment>
                        );
                    })}
                </div>
            )}

            {/* --- THE DIRECTORY & FILE GRID --- */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar -mx-2 px-2 pb-24">
                
                {/* 1. RENDER SUB-FOLDERS */}
                {!searchQuery && sortedFolders.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                        {sortedFolders.map(folder => (
                            <button
                                key={folder}
                                onClick={() => setCurrentPath([...currentPath, folder])}
                                className="p-5 bg-indigo-50 dark:bg-indigo-500/10 border-2 border-indigo-100 dark:border-indigo-500/20 rounded-[1.5rem] flex items-center gap-4 hover:border-indigo-400 dark:hover:border-indigo-400 transition-all active:scale-95 group text-left shadow-sm"
                            >
                                <div className="w-12 h-12 bg-indigo-200 dark:bg-indigo-500/30 rounded-xl flex items-center justify-center shrink-0 transition-colors group-hover:bg-indigo-300 dark:group-hover:bg-indigo-500/50">
                                    <Folder size={24} className="text-indigo-600 dark:text-indigo-300 group-hover:fill-indigo-100 dark:group-hover:fill-indigo-800 transition-colors" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="font-black text-indigo-900 dark:text-indigo-100 truncate text-lg">{folder}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">Directory</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* 2. RENDER ARTIFACTS */}
                {displayFiles.length === 0 && sortedFolders.length === 0 ? (
                    <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-12 bg-white/50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <ShieldAlert size={64} className="mb-4 text-slate-300 dark:text-slate-600" />
                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-2">Directory Empty</h3>
                        <p className="text-slate-500 font-bold max-w-sm">No artifacts reside in this location.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
                        {displayFiles.map((artifact) => {
                            const isLesson = artifact.artifactType === 'lesson';
                            const typeColor = isLesson ? 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30' : 'text-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-500/10 border-fuchsia-200 dark:border-fuchsia-500/30';
                            const isSelected = !!selectedArtifacts[artifact.id];
                            
                            return (
                                <div 
                                    key={`${artifact.artifactType}_${artifact.id}`} 
                                    className={`border-2 rounded-[2rem] p-6 flex flex-col transition-all group relative overflow-hidden min-h-[220px] ${
                                        isSelected 
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-400 dark:border-indigo-500 shadow-[0_10px_30px_rgba(99,102,241,0.2)] scale-[0.98]' 
                                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg'
                                    }`}
                                >
                                    {/* MULTI-SELECT CHECKBOX */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); toggleSelection(artifact.id, artifact.artifactType, artifact.displayTitle); }}
                                        className="absolute top-6 right-6 z-20 text-slate-300 hover:text-indigo-500 transition-colors"
                                    >
                                        {isSelected ? <CheckSquare size={28} className="text-indigo-500" /> : <Square size={28} className="dark:text-slate-600" />}
                                    </button>
                                    
                                    <div className="flex justify-between items-start mb-4 relative z-10 shrink-0">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${typeColor}`}>
                                            {isLesson ? <BookOpen size={24} /> : <Layers size={24} />}
                                        </div>
                                    </div>

                                    <div className="relative z-10 mb-4 flex-1 pr-8">
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-2 line-clamp-2">{artifact.displayTitle}</h3>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-2">{artifact.displayDesc}</p>
                                    </div>

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 relative z-10 shrink-0">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                <Clock size={10} /> {new Date(artifact.timestamp || Date.now()).toLocaleDateString()}
                                            </span>
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 mt-1">{artifact.metric}</span>
                                        </div>
                                        
                                        <div className={`flex gap-2 transition-opacity ${selectedCount > 0 ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                                            <button 
                                                onClick={() => setPendingDelete([{ id: artifact.id, type: artifact.artifactType, title: artifact.displayTitle }])}
                                                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 flex items-center justify-center transition-colors"
                                                title="Delete Artifact"
                                            >
                                                <Trash2 size={16} strokeWidth={3} />
                                            </button>
                                            <button 
                                                onClick={() => onEditArtifact(artifact.id, artifact.artifactType)}
                                                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 flex items-center justify-center transition-colors"
                                                title="Edit Artifact"
                                            >
                                                <Edit3 size={16} strokeWidth={3} />
                                            </button>
                                            <button 
                                                onClick={() => onLaunchLive(artifact.id, artifact.artifactType)}
                                                className="w-10 h-10 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 flex items-center justify-center transition-transform active:scale-90 shadow-md"
                                                title="Deploy to Classroom"
                                            >
                                                <Play size={16} fill="currentColor" className="ml-0.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 🔥 BULK ACTION BAR */}
            {selectedCount > 0 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[8000] bg-slate-900 dark:bg-slate-800 text-white px-3 py-3 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom-12 duration-300 w-[95%] md:w-auto max-w-3xl">
                    <div className="bg-indigo-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-black shrink-0">
                        {selectedCount}
                    </div>
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-300 hidden sm:block">Artifacts Selected</span>
                    
                    <div className="h-8 w-px bg-slate-700 mx-2 hidden sm:block" />

                    <div className="flex gap-2 flex-1 justify-end relative">
                        {/* Folder Assignment Trigger */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowFolderMenu(!showFolderMenu)}
                                className={`px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors border ${showFolderMenu ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'}`}
                            >
                                <FolderPlus size={16} /> Move
                            </button>

                            {/* Folder Dropup Menu */}
                            {showFolderMenu && (
                                <div className="absolute bottom-full left-0 mb-4 w-72 bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 z-50">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assign to Folder Path</span>
                                    <p className="text-[9px] font-bold text-slate-500 leading-tight mb-1">Use slashes (/) to create sub-directories instantly.</p>
                                    
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Math/Algebra" 
                                            value={newFolderName}
                                            onChange={e => setNewFolderName(e.target.value)}
                                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 outline-none focus:border-indigo-500"
                                        />
                                        <button 
                                            onClick={() => newFolderName.trim() && handleBulkMoveToFolder(newFolderName)}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-black text-xs transition-colors"
                                        >
                                            Move
                                        </button>
                                    </div>
                                    
                                    {allAbsoluteFolders.length > 0 && (
                                        <>
                                            <div className="h-px w-full bg-slate-700 my-1" />
                                            <div className="max-h-40 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                                                <button 
                                                    onClick={() => handleBulkMoveToFolder('')} 
                                                    className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                >
                                                    [Move to Root]
                                                </button>
                                                {allAbsoluteFolders.map(f => (
                                                    <button 
                                                        key={String(f)} 
                                                        onClick={() => handleBulkMoveToFolder(String(f))} 
                                                        className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-xs font-mono font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors truncate"
                                                    >
                                                        <Folder size={12} className="shrink-0 text-slate-500" />
                                                        <span className="truncate">{String(f)}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => {
                                const items = Object.entries(selectedArtifacts).map(([id, data]) => ({ id, type: data.type, title: data.title }));
                                setPendingDelete(items);
                                setShowFolderMenu(false);
                            }} 
                            className="px-4 py-2.5 bg-slate-800 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-400 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors"
                        >
                            <Trash2 size={16} /> Delete
                        </button>
                        
                        <button 
                            onClick={clearSelection} 
                            className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white rounded-xl flex items-center justify-center transition-colors shrink-0 ml-2"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}
