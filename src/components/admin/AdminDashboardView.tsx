// src/components/admin/AdminDashboardView.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
    query, collectionGroup, where, onSnapshot, collection, 
    addDoc, updateDoc, doc, deleteDoc, arrayRemove, arrayUnion 
} from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { 
    Loader, AlertTriangle, Briefcase, Shield, Users, Megaphone, Plus, X, 
    Mail, School, FileText, BookOpen, Database, Check, Tag, Trash2, 
    ChevronRight, TrendingUp, BarChart, Activity, Clock, Save, AlertCircle 
} from 'lucide-react';
import { JuicyToast } from '../Toast';

// ============================================================================
//  HELPER COMPONENTS
// ============================================================================
function MetricCard({ icon, label, value, trend, color }: any) {
    const bgColors: any = { indigo: 'bg-indigo-50', emerald: 'bg-emerald-50', rose: 'bg-rose-50', amber: 'bg-amber-50' };
    const textColors: any = { indigo: 'text-indigo-600', emerald: 'text-emerald-600', rose: 'text-rose-600', amber: 'text-amber-600' };

    return (
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between h-48 group hover:border-slate-300 transition-colors">
            <div className="flex justify-between items-start">
                <div className={`p-4 rounded-2xl ${bgColors[color]}`}>{icon}</div>
                <TrendingUp size={16} className="text-slate-300 group-hover:text-emerald-400 transition-colors" />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <div className="flex items-end gap-3">
                    <span className={`text-4xl font-black leading-none ${textColors[color]}`}>{value}</span>
                    <span className="text-xs font-bold text-slate-400 mb-1">{trend}</span>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
//  ADMIN DASHBOARD: THE FRANCHISE EDITION (SaaS Multi-Tenant)
// ============================================================================
export default function AdminDashboardView({ user, activeOrg }: any) {
    const isSuperAdmin = user.role === 'admin';
    const isOrgAdmin = user.role === 'org_admin';
    const userOrgId = user.orgId || null;

    const [activeTab, setActiveTab] = useState<any>(isSuperAdmin ? 'overview' : 'cohorts');
    const [allProfiles, setAllProfiles] = useState<any[]>([]);
    const [allCohorts, setAllCohorts] = useState<any[]>([]);
    const [globalLogs, setGlobalLogs] = useState<any[]>([]);
    const [allContent, setAllContent] = useState<any[]>([]);
    const [organizations, setOrganizations] = useState<any[]>([]); 
    const [loading, setLoading] = useState(true);

    const [directorySearch, setDirectorySearch] = useState('');
    const [vaultSearch, setVaultSearch] = useState('');
    const [vaultFilters, setVaultFilters] = useState<string[]>(['lesson', 'exam', 'arcade']);
    const [selectedVaultItems, setSelectedVaultItems] = useState<string[]>([]);
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    
    const [showOrgModal, setShowOrgModal] = useState(false);
    const [newOrg, setNewOrg] = useState({ name: '', logoUrl: '', themeColor: '#4f46e5' });
    const [isProvisioning, setIsProvisioning] = useState(false);
    const [editingOrg, setEditingOrg] = useState<any | null>(null);
    
    const [selectedInstructorUid, setSelectedInstructorUid] = useState<string | null>(null);
    const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);
    const [selectedContentId, setSelectedContentId] = useState<string | null>(null); 
    const [deployingContent, setDeployingContent] = useState<any | null>(null);
    const [deploySelectedCohorts, setDeploySelectedCohorts] = useState<string[]>([]);
    const [isDeploying, setIsDeploying] = useState(false);

    const [bulkTagInput, setBulkTagInput] = useState('');
    const [inspectorTagInput, setInspectorTagInput] = useState('');
    const [toast, setToast] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);
    const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => setToast({ msg, type });
    const [confirmModal, setConfirmModal] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);

    // THE SCOPED DATA ENGINE
    useEffect(() => {
        const qProfiles = isSuperAdmin ? query(collectionGroup(db, 'profile')) : query(collectionGroup(db, 'profile'), where('orgId', '==', userOrgId));
        const unsubProfiles = onSnapshot(qProfiles, (snap) => setAllProfiles(snap.docs.map(d => ({ uid: d.ref.path.split('/')[3], ...d.data() }))));

        const qClasses = isSuperAdmin ? query(collectionGroup(db, 'classes')) : query(collectionGroup(db, 'classes'), where('orgId', '==', userOrgId));
        const unsubClasses = onSnapshot(qClasses, (snap) => setAllCohorts(snap.docs.map(d => ({ id: d.id, _instructorUid: d.ref.path.split('/')[3], ...d.data() }))));

        const qLogs = isSuperAdmin ? query(collection(db, 'artifacts', appId, 'activity_logs'), where('scoreDetail.status', '==', 'pending_review')) : query(collection(db, 'artifacts', appId, 'activity_logs'), where('orgId', '==', userOrgId), where('scoreDetail.status', '==', 'pending_review'));
        const unsubLogs = onSnapshot(qLogs, (snap) => setGlobalLogs(snap.docs.map(d => d.data())));

        const qContent = isSuperAdmin ? query(collectionGroup(db, 'custom_lessons')) : query(collectionGroup(db, 'custom_lessons'), where('orgId', 'in', ['global', userOrgId]));
        const unsubContent = onSnapshot(qContent, (snap) => setAllContent(snap.docs.map(d => ({ id: d.id, _instructorUid: d.ref.path.split('/')[3], ...d.data() }))));

        let unsubOrgs = () => {};
        if (isSuperAdmin) {
            const qOrgs = query(collection(db, 'artifacts', appId, 'organizations'));
            unsubOrgs = onSnapshot(qOrgs, (snap) => {
                setOrganizations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                setLoading(false);
            });
        } else { setLoading(false); }

        return () => { unsubProfiles(); unsubClasses(); unsubLogs(); unsubContent(); unsubOrgs(); };
    }, [userOrgId, isSuperAdmin]);

    // ACTIONS
    const handleProvisionOrg = async () => {
        if (!newOrg.name.trim()) return;
        setIsProvisioning(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'organizations'), { ...newOrg, createdAt: Date.now() });
            setShowOrgModal(false);
            setNewOrg({ name: '', logoUrl: '', themeColor: '#4f46e5' });
            triggerToast("B2B Organization Provisioned!", 'success');
        } catch (e) { triggerToast("Provisioning failed.", 'error'); }
        setIsProvisioning(false);
    };

    const handleSaveOrgEdit = async () => {
        if (!editingOrg || !editingOrg.name.trim()) return;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'organizations', editingOrg.id), {
                name: editingOrg.name, logoUrl: editingOrg.logoUrl, themeColor: editingOrg.themeColor
            });
            setEditingOrg(null);
            triggerToast("Organization updated.", "success");
        } catch (e) { triggerToast("Failed to update.", "error"); }
    };

    const assignUserToOrg = async (uid: string, orgId: string) => {
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'users', uid, 'profile', 'main'), { orgId: orgId === 'global' ? null : orgId });
            triggerToast(orgId !== 'global' ? "Preview Mode Active." : "Returned to Global View.");
        } catch (e) { triggerToast("Migration failed.", 'error'); }
    };

    const deleteOrganization = (orgId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmModal({
            title: "Dissolve Organization",
            message: "WARNING: Dissolving a tenant returns users to the Global Pool.",
            onConfirm: async () => {
                try {
                    await deleteDoc(doc(db, 'artifacts', appId, 'organizations', orgId));
                    triggerToast("Organization dissolved.", 'success');
                } catch (e) { triggerToast("Delete failed.", 'error'); }
                setConfirmModal(null);
            }
        });
    };

    const toggleUserRole = (uid: string, currentRole: string) => {
        const roles = isSuperAdmin ? ['student', 'instructor', 'org_admin', 'admin'] : ['student', 'instructor', 'org_admin'];
        const currentIndex = roles.indexOf(currentRole);
        const nextRole = roles[(currentIndex + 1) % roles.length];
        setConfirmModal({
            title: "Permissions", message: `Change role to ${nextRole.toUpperCase()}?`,
            onConfirm: async () => {
                try {
                    await updateDoc(doc(db, 'artifacts', appId, 'users', uid, 'profile', 'main'), { role: nextRole });
                    triggerToast(`Role updated to ${nextRole}`);
                } catch (e) { triggerToast("Update failed", "error"); }
                setConfirmModal(null);
            }
        });
    };

    const handleGlobalBroadcast = async () => {
        if (!broadcastMsg.trim()) return;
        setIsBroadcasting(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'global_announcements'), {
                message: broadcastMsg.trim(), authorName: 'System Admin', timestamp: Date.now(), active: true, type: 'system_alert', orgId: isSuperAdmin ? 'global' : userOrgId
            });
            setBroadcastMsg(''); setShowBroadcastModal(false); triggerToast("Broadcasted!", 'success');
        } catch (error) { triggerToast("Failed.", 'error'); }
        setIsBroadcasting(false);
    };

    // DERIVED UI DATA
    const studentsCount = allProfiles.filter(p => p.role === 'student').length;
    const populatedCohorts = allCohorts.map(cohort => ({ ...cohort, instructorName: allProfiles.find(i => i.uid === cohort._instructorUid)?.name || 'Unknown', studentCount: cohort.students?.length || 0 }));
    const populatedInstructors = allProfiles.filter(p => p.role !== 'student').map(inst => {
        const theirCohorts = allCohorts.filter(c => c._instructorUid === inst.uid);
        return { ...inst, activeCohorts: theirCohorts.length, ungradedItems: 0, theirCohorts };
    });
    const populatedContent = allContent.map(item => ({ ...item, authorName: allProfiles.find(i => i.uid === item._instructorUid)?.name || 'Unknown' }));
    const filteredContent = populatedContent.filter(c => vaultFilters.includes(c.type === 'arcade_game' ? 'arcade' : (c.type === 'exam' ? 'exam' : 'lesson')));

    if (loading) return <div className="h-full flex items-center justify-center bg-slate-50"><Loader className="animate-spin text-indigo-500" /></div>;

    const activeInstructor = populatedInstructors.find(i => i.uid === selectedInstructorUid);
    const activeCohort = populatedCohorts.find(c => c.id === selectedCohortId);
    const activeContent = populatedContent.find(c => c.id === selectedContentId);

    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden font-sans relative">
            {toast && <div className="absolute top-0 left-0 w-full z-[4000] flex justify-center"><JuicyToast message={toast.msg} type={toast.type} onClose={() => setToast(null)} /></div>}
            
            {/* Main Header */}
            <header className="h-24 bg-slate-900 px-10 flex justify-between items-center shrink-0 z-30 shadow-xl" style={activeOrg ? { borderBottom: `4px solid ${activeOrg.themeColor}` } : {}}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: activeOrg?.themeColor || '#10b981' }}>{activeOrg ? <Briefcase size={24} /> : <Shield size={24} />}</div>
                    <div><h2 className="text-xl font-black text-white uppercase">{activeOrg ? activeOrg.name : 'Command Center'}</h2></div>
                </div>
                <div className="flex bg-slate-800 p-1.5 rounded-[1.5rem]">
                    {[ isSuperAdmin && 'overview', isSuperAdmin && 'franchise', 'cohorts', 'instructors', 'directory', 'vault' ].filter(Boolean).map((id: any) => (
                        <button key={id} onClick={() => setActiveTab(id)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === id ? 'bg-white text-slate-900' : 'text-slate-400'}`}>{id}</button>
                    ))}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                <div className="max-w-6xl mx-auto space-y-12">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-4 gap-6 animate-in slide-in-from-bottom-4">
                            <MetricCard icon={<Users size={24}/>} label="Enrollment" value={studentsCount} trend="Active" color="indigo" />
                            <MetricCard icon={<Briefcase size={24}/>} label="Franchises" value={organizations.length} trend="B2B" color="indigo" />
                            <MetricCard icon={<BookOpen size={24}/>} label="Cohorts" value={populatedCohorts.length} trend="Active" color="emerald" />
                            <MetricCard icon={<AlertCircle size={24}/>} label="Pending" value={globalLogs.length} trend="Exams" color="rose" />
                        </div>
                    )}
                    {/* Additional tab logic for directory, vault, etc. follows same structure */}
                    <p className="text-slate-400 text-sm font-bold">Workspace Active: {activeTab.toUpperCase()}</p>
                </div>
            </div>
            
            {/* Modals and Overlays go here */}
            {confirmModal && <div className="absolute inset-0 z-[3000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-[2.5rem] text-center max-w-sm">
                    <h3 className="text-2xl font-black mb-2">{confirmModal.title}</h3>
                    <p className="text-sm mb-8">{confirmModal.message}</p>
                    <div className="flex gap-3"><button onClick={() => setConfirmModal(null)} className="flex-1 p-4 bg-slate-100 rounded-xl font-black">Cancel</button><button onClick={confirmModal.onConfirm} className="flex-1 p-4 bg-rose-600 text-white rounded-xl font-black">Confirm</button></div>
                </div>
            </div>}
        </div>
    );
}
