// src/components/admin/AdminDashboardView.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
    query, collectionGroup, where, onSnapshot, collection, 
    addDoc, updateDoc, setDoc, doc, deleteDoc, arrayUnion 
} from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { 
    Loader, Briefcase, Shield, Users, Megaphone, Plus, X, 
    Mail, School, FileText, BookOpen, Database, Check, Tag, Trash2, 
    ChevronRight, TrendingUp, Activity, Save, AlertCircle, Search,
    Edit3, UserPlus, GraduationCap, Sparkles, Layers, Zap
} from 'lucide-react';
import { JuicyToast } from '../Toast';

// ============================================================================
//  HELPER COMPONENTS (FROSTED GLASS AESTHETIC)
// ============================================================================
function MetricCard({ icon, label, value, trend, color, onClick }: any) {
    const bgColors: any = {
        indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    };
    const textColors: any = {
        indigo: 'text-indigo-600 dark:text-indigo-400',
        emerald: 'text-emerald-600 dark:text-emerald-400',
        rose: 'text-rose-600 dark:text-rose-400',
        amber: 'text-amber-600 dark:text-amber-400'
    };

    return (
        <div
            onClick={onClick}
            className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/60 dark:border-slate-800 shadow-xl flex flex-col justify-between h-44 group hover:scale-[1.02] transition-all ${onClick ? 'cursor-pointer' : ''}`}
        >
            <div className="flex justify-between items-start">
                <div className={`p-3.5 rounded-2xl border ${bgColors[color] || bgColors.indigo}`}>{icon}</div>
                <TrendingUp size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-400 transition-colors" />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <div className="flex items-end gap-3">
                    <span className={`text-3xl sm:text-4xl font-black leading-none tabular-nums ${textColors[color] || textColors.indigo}`}>
                        {value}
                    </span>
                    <span className="text-xs font-bold text-slate-400 mb-0.5">{trend}</span>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
//  ADMIN DASHBOARD: COMMAND CENTER (Students, Cohorts, Teachers & Vault)
// ============================================================================
export default function AdminDashboardView({ user, activeOrg }: any) {
    const isSuperAdmin = user?.role === 'admin' || !user?.role;
    const isOrgAdmin = user?.role === 'org_admin';
    const userOrgId = user?.orgId || null;

    const [activeTab, setActiveTab] = useState<'overview' | 'cohorts' | 'directory' | 'instructors' | 'vault' | 'franchise'>(
        isSuperAdmin ? 'overview' : 'cohorts'
    );

    const [allProfiles, setAllProfiles] = useState<any[]>([]);
    const [allCohorts, setAllCohorts] = useState<any[]>([]);
    const [globalLogs, setGlobalLogs] = useState<any[]>([]);
    const [allContent, setAllContent] = useState<any[]>([]);
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Search & Filters
    const [directorySearch, setDirectorySearch] = useState('');
    const [directoryRoleFilter, setDirectoryRoleFilter] = useState<'all' | 'student' | 'instructor' | 'admin'>('all');
    const [cohortSearch, setCohortSearch] = useState('');
    const [vaultSearch, setVaultSearch] = useState('');
    const [vaultFilters, setVaultFilters] = useState<string[]>(['lesson', 'exam', 'arcade']);

    // Modals & Drawers
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    // Organization Provisioning
    const [showOrgModal, setShowOrgModal] = useState(false);
    const [newOrg, setNewOrg] = useState({ name: '', logoUrl: '', themeColor: '#4f46e5' });
    const [isProvisioning, setIsProvisioning] = useState(false);
    const [editingOrg, setEditingOrg] = useState<any | null>(null);

    // Create Class / Cohort Modal
    const [showCreateCohortModal, setShowCreateCohortModal] = useState(false);
    const [newCohortForm, setNewCohortForm] = useState({
        name: '',
        subject: 'Latin & Classical Studies',
        grade: 'All Grades',
        instructorId: ''
    });
    const [isCreatingCohort, setIsCreatingCohort] = useState(false);

    // Active Cohort Inspector & Roster Enlistment
    const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);
    const [studentEmailToAdd, setStudentEmailToAdd] = useState('');
    const [selectedStudentUidToAdd, setSelectedStudentUidToAdd] = useState('');

    // Student / User Profile Editor Modal
    const [editingProfile, setEditingProfile] = useState<any | null>(null);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileCohortToJoin, setProfileCohortToJoin] = useState('');

    // Provision New User / Student Modal
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [newUserForm, setNewUserForm] = useState({
        name: '',
        email: '',
        role: 'student',
        targetLanguage: 'Latin',
        level: 'Novice',
        xp: 0,
        cohortId: ''
    });

    // Vault Content Deployment
    const [deployingContent, setDeployingContent] = useState<any | null>(null);
    const [deploySelectedCohorts, setDeploySelectedCohorts] = useState<string[]>([]);
    const [isDeploying, setIsDeploying] = useState(false);

    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
    const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => setToast({ msg, type });
    const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

    // ============================================================================
    //  SCOPED REAL-TIME DATA ENGINE (WITH DEDUPLICATION)
    // ============================================================================
    useEffect(() => {
        const qProfiles = isSuperAdmin
            ? query(collectionGroup(db, 'profile'))
            : query(collectionGroup(db, 'profile'), where('orgId', '==', userOrgId));

        const unsubProfiles = onSnapshot(qProfiles, (snap) => {
            const profileMap = new Map<string, any>();
            snap.docs.forEach((d) => {
                const data = d.data() as any;
                const pathParts = d.ref.path.split('/');
                const extractedUid = pathParts.includes('users') ? pathParts[pathParts.indexOf('users') + 1] : d.id;
                const uid = data.uid || extractedUid;
                if (uid) {
                    profileMap.set(uid, { ...profileMap.get(uid), ...data, uid });
                }
            });
            setAllProfiles(Array.from(profileMap.values()));
        });

        const qClasses = isSuperAdmin
            ? query(collectionGroup(db, 'classes'))
            : query(collectionGroup(db, 'classes'), where('orgId', '==', userOrgId));

        const unsubClasses = onSnapshot(qClasses, (snap) => {
            const cohortMap = new Map<string, any>();
            snap.docs.forEach((d) => {
                const data = d.data() as any;
                const pathParts = d.ref.path.split('/');
                const pathInstructorUid = pathParts.includes('users') ? pathParts[pathParts.indexOf('users') + 1] : null;
                const instructorUid = data.instructorId || pathInstructorUid || '';
                const existing = cohortMap.get(d.id);

                const mergedStudents = Array.from(
                    new Map(
                        [...(existing?.students || []), ...(data.students || [])].map((s: any) => [
                            typeof s === 'string' ? s : s.email || s.uid || JSON.stringify(s),
                            s
                        ])
                    ).values()
                );
                const mergedEmails = Array.from(new Set([...(existing?.studentEmails || []), ...(data.studentEmails || [])]));
                const mergedAssignments = [...(existing?.assignments || []), ...(data.assignments || [])];

                cohortMap.set(d.id, {
                    ...existing,
                    ...data,
                    id: d.id,
                    _instructorUid: instructorUid || existing?._instructorUid || '',
                    instructorId: instructorUid || existing?.instructorId || '',
                    students: mergedStudents,
                    studentEmails: mergedEmails,
                    assignments: mergedAssignments
                });
            });
            setAllCohorts(Array.from(cohortMap.values()));
        });

        const qLogs = isSuperAdmin
            ? query(collection(db, 'artifacts', appId, 'activity_logs'))
            : query(collection(db, 'artifacts', appId, 'activity_logs'), where('orgId', '==', userOrgId));

        const unsubLogs = onSnapshot(qLogs, (snap) => {
            setGlobalLogs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
        });

        const qContent = query(collectionGroup(db, 'custom_lessons'));
        const unsubContent = onSnapshot(qContent, (snap) => {
            const contentMap = new Map<string, any>();
            snap.docs.forEach((d) => {
                const data = d.data() as any;
                const pathParts = d.ref.path.split('/');
                const authorUid = data.instructorId || (pathParts.includes('users') ? pathParts[pathParts.indexOf('users') + 1] : '');
                contentMap.set(d.id, { id: d.id, _instructorUid: authorUid, ...data });
            });
            setAllContent(Array.from(contentMap.values()));
        });

        let unsubOrgs = () => {};
        if (isSuperAdmin) {
            const qOrgs = query(collection(db, 'artifacts', appId, 'organizations'));
            unsubOrgs = onSnapshot(qOrgs, (snap) => {
                setOrganizations(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
                setLoading(false);
            });
        } else {
            setLoading(false);
        }

        return () => {
            unsubProfiles();
            unsubClasses();
            unsubLogs();
            unsubContent();
            unsubOrgs();
        };
    }, [userOrgId, isSuperAdmin]);

    // ============================================================================
    //  DERIVED LISTS & METRICS
    // ============================================================================
    const studentsList = useMemo(() => allProfiles.filter((p) => (p.role || 'student') === 'student'), [allProfiles]);
    const instructorsList = useMemo(
        () => allProfiles.filter((p) => p.role === 'instructor' || p.role === 'admin' || p.role === 'org_admin'),
        [allProfiles]
    );

    const populatedCohorts = useMemo(() => {
        return allCohorts.map((cohort) => {
            const inst = allProfiles.find((i) => i.uid === (cohort.instructorId || cohort._instructorUid));
            const emailList = Array.isArray(cohort.studentEmails) ? cohort.studentEmails : [];
            const studentObjList = Array.isArray(cohort.students) ? cohort.students : [];
            const count = Math.max(emailList.length, studentObjList.length);
            return {
                ...cohort,
                instructorName: inst?.name || inst?.email || cohort.instructorName || 'Unassigned',
                studentCount: count
            };
        });
    }, [allCohorts, allProfiles]);

    const populatedInstructors = useMemo(() => {
        return instructorsList.map((inst) => {
            const theirCohorts = populatedCohorts.filter((c) => (c.instructorId || c._instructorUid) === inst.uid);
            return {
                ...inst,
                activeCohorts: theirCohorts.length,
                theirCohorts
            };
        });
    }, [instructorsList, populatedCohorts]);

    const filteredProfiles = useMemo(() => {
        return allProfiles.filter((p) => {
            const role = p.role || 'student';
            if (directoryRoleFilter !== 'all' && role !== directoryRoleFilter) return false;
            if (!directorySearch.trim()) return true;
            const q = directorySearch.toLowerCase();
            return (
                (p.name || '').toLowerCase().includes(q) ||
                (p.email || '').toLowerCase().includes(q) ||
                (p.uid || '').toLowerCase().includes(q)
            );
        });
    }, [allProfiles, directoryRoleFilter, directorySearch]);

    const filteredCohorts = useMemo(() => {
        if (!cohortSearch.trim()) return populatedCohorts;
        const q = cohortSearch.toLowerCase();
        return populatedCohorts.filter(
            (c) =>
                (c.name || '').toLowerCase().includes(q) ||
                (c.subject || '').toLowerCase().includes(q) ||
                (c.code || '').toLowerCase().includes(q) ||
                (c.instructorName || '').toLowerCase().includes(q)
        );
    }, [populatedCohorts, cohortSearch]);

    const populatedContent = useMemo(() => {
        return allContent.map((item) => ({
            ...item,
            authorName: allProfiles.find((i) => i.uid === item._instructorUid)?.name || 'Instructor'
        }));
    }, [allContent, allProfiles]);

    const filteredContent = useMemo(() => {
        return populatedContent
            .filter((c) => {
                const cType = c.type === 'arcade_game' ? 'arcade' : c.contentType === 'exam' || c.type === 'exam' ? 'exam' : 'lesson';
                return vaultFilters.includes(cType);
            })
            .filter((c) => !vaultSearch.trim() || (c.title || '').toLowerCase().includes(vaultSearch.toLowerCase()));
    }, [populatedContent, vaultFilters, vaultSearch]);

    const activeCohort = useMemo(
        () => populatedCohorts.find((c) => c.id === selectedCohortId) || null,
        [populatedCohorts, selectedCohortId]
    );

    // ============================================================================
    //  DUAL-PATH CLASS / COHORT SYNC HELPER
    // ============================================================================
    const writeCohortEverywhere = async (cohortId: string, instructorUid: string | null | undefined, patch: Record<string, any>) => {
        await setDoc(doc(db, 'artifacts', appId, 'classes', cohortId), patch, { merge: true });
        if (instructorUid) {
            await setDoc(doc(db, 'artifacts', appId, 'users', instructorUid, 'classes', cohortId), patch, { merge: true });
        }
    };

    // ============================================================================
    //  1. CREATE CLASS / COHORT (WITH TEACHER ASSIGNMENT)
    // ============================================================================
    const handleCreateCohort = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCohortForm.name.trim()) return;
        setIsCreatingCohort(true);
        try {
            const cohortId = doc(collection(db, 'artifacts', appId, 'classes')).id;
            const targetInstructorId = newCohortForm.instructorId || user?.uid || '';
            const instProfile = allProfiles.find((p) => p.uid === targetInstructorId);

            const payload = {
                id: cohortId,
                name: newCohortForm.name.trim(),
                subject: newCohortForm.subject.trim() || 'General Studies',
                grade: newCohortForm.grade.trim() || 'All Grades',
                code: Math.random().toString(36).substring(2, 8).toUpperCase(),
                instructorId: targetInstructorId,
                instructorName: instProfile?.name || instProfile?.email || 'Instructor',
                orgId: userOrgId || 'global',
                students: [],
                studentEmails: [],
                assignments: [],
                assignedCurriculums: [],
                cohorts: [],
                createdAt: Date.now(),
                pulse: 100
            };

            await writeCohortEverywhere(cohortId, targetInstructorId, payload);
            setShowCreateCohortModal(false);
            setNewCohortForm({ name: '', subject: 'Latin & Classical Studies', grade: 'All Grades', instructorId: '' });
            setSelectedCohortId(cohortId);
            triggerToast(`Cohort "${payload.name}" created!`, 'success');
        } catch (err) {
            console.error(err);
            triggerToast('Failed to create cohort.', 'error');
        } finally {
            setIsCreatingCohort(false);
        }
    };

    // ============================================================================
    //  2. ASSIGN / REASSIGN TEACHER TO COHORT
    // ============================================================================
    const handleAssignTeacherToCohort = async (cohort: any, newInstructorUid: string) => {
        if (!cohort?.id || !newInstructorUid) return;
        const oldInstructorUid = cohort.instructorId || cohort._instructorUid;
        const newInstProfile = allProfiles.find((p) => p.uid === newInstructorUid);

        const updatedCohort = {
            ...cohort,
            instructorId: newInstructorUid,
            _instructorUid: newInstructorUid,
            instructorName: newInstProfile?.name || newInstProfile?.email || 'Instructor',
            updatedAt: Date.now()
        };

        try {
            await writeCohortEverywhere(cohort.id, newInstructorUid, updatedCohort);
            if (oldInstructorUid && oldInstructorUid !== newInstructorUid) {
                await deleteDoc(doc(db, 'artifacts', appId, 'users', oldInstructorUid, 'classes', cohort.id)).catch(() => {});
            }
            triggerToast(`Assigned ${updatedCohort.instructorName} to ${cohort.name}!`, 'success');
        } catch (err) {
            console.error(err);
            triggerToast('Failed to assign instructor.', 'error');
        }
    };

    // ============================================================================
    //  3. ASSIGN & REMOVE STUDENTS IN A COHORT
    // ============================================================================
    const handleEnrollStudentInCohort = async (cohort: any, studentProfileOrEmail: any) => {
        if (!cohort?.id) return;

        let email = '';
        let name = '';
        let studentUid = '';

        if (typeof studentProfileOrEmail === 'string') {
            email = studentProfileOrEmail.trim();
            const matchedProfile = allProfiles.find(
                (p) => (p.email || '').toLowerCase() === email.toLowerCase() || p.uid === email
            );
            if (matchedProfile) {
                email = matchedProfile.email || email;
                name = matchedProfile.name || email.split('@')[0];
                studentUid = matchedProfile.uid;
            } else {
                name = email.split('@')[0];
            }
        } else if (studentProfileOrEmail && typeof studentProfileOrEmail === 'object') {
            email = (studentProfileOrEmail.email || '').trim();
            name = studentProfileOrEmail.name || email.split('@')[0] || 'Scholar';
            studentUid = studentProfileOrEmail.uid || '';
        }

        if (!email && !studentUid) {
            triggerToast('Please provide a student email or select a student profile.', 'error');
            return;
        }

        const effectiveEmail = email || `${studentUid}@scholar.local`;
        const studentEntry = {
            ...(studentUid ? { uid: studentUid } : {}),
            email: effectiveEmail,
            name,
            cohortId: cohort.id,
            joinedAt: Date.now()
        };

        const nextEmails = Array.from(
            new Set([...(cohort.studentEmails || []), effectiveEmail, effectiveEmail.toLowerCase()])
        );
        const existingStudents = (cohort.students || []).filter(
            (s: any) => (s.email || '').toLowerCase() !== effectiveEmail.toLowerCase()
        );
        const nextStudents = [...existingStudents, studentEntry];

        try {
            await writeCohortEverywhere(cohort.id, cohort.instructorId || cohort._instructorUid, {
                studentEmails: nextEmails,
                students: nextStudents
            });

            // Also update the student's profile document so cohortId & email are synced
            if (studentUid) {
                await setDoc(
                    doc(db, 'artifacts', appId, 'users', studentUid, 'profile', 'main'),
                    {
                        email: effectiveEmail,
                        cohortId: cohort.id,
                        enrolledCohortIds: arrayUnion(cohort.id)
                    },
                    { merge: true }
                );
            }

            setStudentEmailToAdd('');
            setSelectedStudentUidToAdd('');
            triggerToast(`Enrolled ${name} into ${cohort.name}!`, 'success');
        } catch (err) {
            console.error(err);
            triggerToast('Failed to enroll student.', 'error');
        }
    };

    const handleRemoveStudentFromCohort = async (cohort: any, targetEmail: string) => {
        if (!cohort?.id || !targetEmail) return;
        const normTarget = targetEmail.trim().toLowerCase();
        const nextEmails = (cohort.studentEmails || []).filter((e: string) => e.toLowerCase() !== normTarget);
        const nextStudents = (cohort.students || []).filter(
            (s: any) => (typeof s === 'string' ? s : s.email || '').toLowerCase() !== normTarget
        );

        try {
            await writeCohortEverywhere(cohort.id, cohort.instructorId || cohort._instructorUid, {
                studentEmails: nextEmails,
                students: nextStudents
            });
            triggerToast(`Removed ${targetEmail} from ${cohort.name}.`, 'info');
        } catch (err) {
            console.error(err);
            triggerToast('Failed to remove student.', 'error');
        }
    };

    const handleDeleteCohort = (cohort: any) => {
        setConfirmModal({
            title: `Delete "${cohort.name}"?`,
            message: 'This will permanently remove this class cohort and its roster associations.',
            onConfirm: async () => {
                try {
                    await deleteDoc(doc(db, 'artifacts', appId, 'classes', cohort.id)).catch(() => {});
                    if (cohort.instructorId || cohort._instructorUid) {
                        await deleteDoc(
                            doc(db, 'artifacts', appId, 'users', cohort.instructorId || cohort._instructorUid, 'classes', cohort.id)
                        ).catch(() => {});
                    }
                    if (selectedCohortId === cohort.id) setSelectedCohortId(null);
                    triggerToast('Cohort deleted.', 'info');
                } catch (e) {
                    triggerToast('Delete failed.', 'error');
                }
                setConfirmModal(null);
            }
        });
    };

    // ============================================================================
    //  4. STUDENT & USER PROFILE MANAGEMENT
    // ============================================================================
    const handleSaveProfileEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProfile?.uid) return;
        setIsSavingProfile(true);
        try {
            const payload = {
                name: editingProfile.name || 'Scholar',
                email: (editingProfile.email || '').trim(),
                role: editingProfile.role || 'student',
                targetLanguage: editingProfile.targetLanguage || 'Latin',
                level: editingProfile.level || 'Novice',
                xp: Number(editingProfile.xp) || 0,
                streak: Number(editingProfile.streak) || 0,
                orgId: editingProfile.orgId || null,
                updatedAt: Date.now()
            };
            await setDoc(doc(db, 'artifacts', appId, 'users', editingProfile.uid, 'profile', 'main'), payload, { merge: true });
            triggerToast(`Saved profile for ${payload.name}!`, 'success');
            setEditingProfile(null);
        } catch (err) {
            console.error(err);
            triggerToast('Failed to update profile.', 'error');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleCreateUserProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserForm.name.trim() || !newUserForm.email.trim()) return;
        try {
            const newUid = `usr_${Date.now()}`;
            const cleanEmail = newUserForm.email.trim();
            const profilePayload = {
                uid: newUid,
                name: newUserForm.name.trim(),
                email: cleanEmail,
                role: newUserForm.role,
                targetLanguage: newUserForm.targetLanguage || 'Latin',
                level: newUserForm.level || 'Novice',
                xp: Number(newUserForm.xp) || 0,
                streak: 1,
                cohortId: newUserForm.cohortId || null,
                orgId: userOrgId || null,
                createdAt: Date.now()
            };

            await setDoc(doc(db, 'artifacts', appId, 'users', newUid, 'profile', 'main'), profilePayload);

            // If a cohort was chosen during creation, immediately enroll the student in that cohort!
            if (newUserForm.cohortId) {
                const targetCohort = populatedCohorts.find((c) => c.id === newUserForm.cohortId);
                if (targetCohort) {
                    await handleEnrollStudentInCohort(targetCohort, profilePayload);
                }
            }

            setShowCreateUserModal(false);
            setNewUserForm({ name: '', email: '', role: 'student', targetLanguage: 'Latin', level: 'Novice', xp: 0, cohortId: '' });
            triggerToast(`Profile created for ${profilePayload.name}!`, 'success');
        } catch (err) {
            console.error(err);
            triggerToast('Failed to create user profile.', 'error');
        }
    };

    // ============================================================================
    //  5. DEPLOY VAULT CONTENT TO SELECTED COHORTS
    // ============================================================================
    const handleDeployContentToCohorts = async () => {
        if (!deployingContent || deploySelectedCohorts.length === 0) return;
        setIsDeploying(true);
        try {
            const assignmentObject = {
                id: deployingContent.id,
                lessonId: deployingContent.id,
                cohortId: null,
                assignedAt: Date.now()
            };

            for (const cId of deploySelectedCohorts) {
                const targetCohort = populatedCohorts.find((c) => c.id === cId);
                if (targetCohort) {
                    await writeCohortEverywhere(cId, targetCohort.instructorId || targetCohort._instructorUid, {
                        assignments: arrayUnion(assignmentObject)
                    });
                }
            }

            triggerToast(`Deployed "${deployingContent.title}" to ${deploySelectedCohorts.length} cohort(s)!`, 'success');
            setDeployingContent(null);
            setDeploySelectedCohorts([]);
        } catch (err) {
            console.error(err);
            triggerToast('Deployment failed.', 'error');
        } finally {
            setIsDeploying(false);
        }
    };

    // ============================================================================
    //  6. ORGANIZATION & BROADCAST ACTIONS
    // ============================================================================
    const handleProvisionOrg = async () => {
        if (!newOrg.name.trim()) return;
        setIsProvisioning(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'organizations'), { ...newOrg, createdAt: Date.now() });
            setShowOrgModal(false);
            setNewOrg({ name: '', logoUrl: '', themeColor: '#4f46e5' });
            triggerToast('B2B Organization Provisioned!', 'success');
        } catch (e) {
            triggerToast('Provisioning failed.', 'error');
        }
        setIsProvisioning(false);
    };

    const handleSaveOrgEdit = async () => {
        if (!editingOrg || !editingOrg.name.trim()) return;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'organizations', editingOrg.id), {
                name: editingOrg.name,
                logoUrl: editingOrg.logoUrl,
                themeColor: editingOrg.themeColor
            });
            setEditingOrg(null);
            triggerToast('Organization updated.', 'success');
        } catch (e) {
            triggerToast('Failed to update.', 'error');
        }
    };

    const handleGlobalBroadcast = async () => {
        if (!broadcastMsg.trim()) return;
        setIsBroadcasting(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'global_announcements'), {
                message: broadcastMsg.trim(),
                authorName: 'System Admin',
                timestamp: Date.now(),
                active: true,
                type: 'system_alert',
                orgId: isSuperAdmin ? 'global' : userOrgId
            });
            setBroadcastMsg('');
            setShowBroadcastModal(false);
            triggerToast('Announcement broadcasted!', 'success');
        } catch (error) {
            triggerToast('Broadcast failed.', 'error');
        }
        setIsBroadcasting(false);
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    // Helper to find all cohorts a student belongs to
    const getStudentEnrolledCohorts = (profile: any) => {
        if (!profile) return [];
        const pEmail = (profile.email || '').trim().toLowerCase();
        return populatedCohorts.filter((c) => {
            const inEmails = (c.studentEmails || []).some((e: string) => e.toLowerCase() === pEmail && pEmail !== '');
            const inStudents = (c.students || []).some(
                (s: any) => (s.uid && s.uid === profile.uid) || (pEmail && (s.email || '').toLowerCase() === pEmail)
            );
            return inEmails || inStudents || (profile.cohortId && profile.cohortId === c.id);
        });
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden font-sans relative">
            {toast && (
                <div className="absolute top-4 left-0 w-full z-[9500] flex justify-center pointer-events-none">
                    <JuicyToast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
                </div>
            )}

            {/* FROSTED GLASS TOP COMMAND HEADER */}
            <header
                className="min-h-[88px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-slate-200/80 dark:border-slate-800 px-6 sm:px-10 py-4 flex flex-wrap justify-between items-center gap-4 shrink-0 z-30 shadow-sm"
                style={activeOrg ? { borderBottom: `4px solid ${activeOrg.themeColor}` } : {}}
            >
                <div className="flex items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
                        style={{ backgroundColor: activeOrg?.themeColor || '#4f46e5' }}
                    >
                        {activeOrg ? <Briefcase size={22} /> : <Shield size={22} />}
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block">
                            Admin Command Center
                        </span>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                            {activeOrg ? activeOrg.name : 'Magister OS Administration'}
                        </h2>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setShowCreateCohortModal(true)}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                    >
                        <Plus size={14} /> New Class / Cohort
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowCreateUserModal(true)}
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all active:scale-95"
                    >
                        <UserPlus size={14} /> Add Student / User
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowBroadcastModal(true)}
                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-all"
                        title="Global Broadcast"
                    >
                        <Megaphone size={18} />
                    </button>

                    {/* Navigation Pill Bar */}
                    <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                        {[
                            isSuperAdmin && { id: 'overview', label: 'Overview' },
                            { id: 'cohorts', label: `Cohorts (${populatedCohorts.length})` },
                            { id: 'directory', label: `Students & Users (${allProfiles.length})` },
                            { id: 'instructors', label: `Teachers (${instructorsList.length})` },
                            { id: 'vault', label: `Vault (${allContent.length})` },
                            isSuperAdmin && { id: 'franchise', label: 'Franchises' }
                        ]
                            .filter(Boolean)
                            .map((tab: any) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        activeTab === tab.id
                                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                    </div>
                </div>
            </header>

            {/* MAIN WORKSPACE */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar">
                <div className="max-w-7xl mx-auto space-y-10">

                    {/* ========================================================= */}
                    {/* TAB 1: OVERVIEW                                           */}
                    {/* ========================================================= */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                <MetricCard
                                    icon={<Users size={22} />}
                                    label="Active Students"
                                    value={studentsList.length}
                                    trend="Manage Profiles →"
                                    color="indigo"
                                    onClick={() => {
                                        setDirectoryRoleFilter('student');
                                        setActiveTab('directory');
                                    }}
                                />
                                <MetricCard
                                    icon={<School size={22} />}
                                    label="Classes & Cohorts"
                                    value={populatedCohorts.length}
                                    trend="Manage Rosters →"
                                    color="emerald"
                                    onClick={() => setActiveTab('cohorts')}
                                />
                                <MetricCard
                                    icon={<GraduationCap size={22} />}
                                    label="Instructors"
                                    value={instructorsList.length}
                                    trend="Assign Classes →"
                                    color="amber"
                                    onClick={() => setActiveTab('instructors')}
                                />
                                <MetricCard
                                    icon={<Database size={22} />}
                                    label="Curriculum Modules"
                                    value={allContent.length}
                                    trend="Open Vault →"
                                    color="rose"
                                    onClick={() => setActiveTab('vault')}
                                />
                            </div>

                            {/* Quick Cohorts & Recent Students Split View */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Active Cohorts Snapshot */}
                                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 p-6 shadow-xl space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                            <School size={16} className="text-emerald-500" /> Active Classes & Cohorts
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('cohorts')}
                                            className="text-xs font-black text-indigo-600 hover:underline"
                                        >
                                            View All
                                        </button>
                                    </div>
                                    <div className="space-y-2.5">
                                        {populatedCohorts.slice(0, 5).map((c) => (
                                            <div
                                                key={c.id}
                                                onClick={() => {
                                                    setSelectedCohortId(c.id);
                                                    setActiveTab('cohorts');
                                                }}
                                                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 hover:border-indigo-400 flex items-center justify-between cursor-pointer transition-all"
                                            >
                                                <div>
                                                    <div className="font-black text-sm text-slate-900 dark:text-white">{c.name}</div>
                                                    <div className="text-[11px] font-bold text-slate-400">
                                                        Teacher: <span className="text-indigo-600 dark:text-indigo-400">{c.instructorName}</span> • Code: {c.code}
                                                    </div>
                                                </div>
                                                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">
                                                    {c.studentCount} Students
                                                </span>
                                            </div>
                                        ))}
                                        {populatedCohorts.length === 0 && (
                                            <p className="text-xs text-slate-400 font-bold py-6 text-center">
                                                No cohorts created yet. Click "+ New Class / Cohort" above to create one.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Recent Student Profiles Snapshot */}
                                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 p-6 shadow-xl space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                            <Users size={16} className="text-indigo-500" /> Student Directory
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('directory')}
                                            className="text-xs font-black text-indigo-600 hover:underline"
                                        >
                                            Manage All
                                        </button>
                                    </div>
                                    <div className="space-y-2.5">
                                        {studentsList.slice(0, 5).map((stu) => {
                                            const enrolled = getStudentEnrolledCohorts(stu);
                                            return (
                                                <div
                                                    key={stu.uid}
                                                    onClick={() => setEditingProfile({ ...stu })}
                                                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 hover:border-indigo-400 flex items-center justify-between cursor-pointer transition-all"
                                                >
                                                    <div>
                                                        <div className="font-black text-sm text-slate-900 dark:text-white">{stu.name || 'Scholar'}</div>
                                                        <div className="text-[11px] font-bold text-slate-400">
                                                            {stu.email || stu.uid} • {stu.xp || 0} XP
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase">
                                                            {enrolled.length} {enrolled.length === 1 ? 'Class' : 'Classes'}
                                                        </span>
                                                        <Edit3 size={14} className="text-slate-400" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 2: COHORTS & CLASSES MANAGER (ASSIGN TEACHERS/STUDENTS)*/}
                    {/* ========================================================= */}
                    {activeTab === 'cohorts' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
                            {/* Left Column: Cohort List */}
                            <div className="lg:col-span-5 space-y-4">
                                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <Search size={18} className="text-slate-400 ml-2" />
                                    <input
                                        type="text"
                                        value={cohortSearch}
                                        onChange={(e) => setCohortSearch(e.target.value)}
                                        placeholder="Search classes by name, code, or teacher..."
                                        className="w-full bg-transparent text-xs font-bold outline-none"
                                    />
                                </div>

                                <div className="space-y-3">
                                    {filteredCohorts.map((cohort) => {
                                        const isSelected = selectedCohortId === cohort.id;
                                        return (
                                            <div
                                                key={cohort.id}
                                                onClick={() => setSelectedCohortId(cohort.id)}
                                                className={`p-5 rounded-3xl border-2 cursor-pointer transition-all ${
                                                    isSelected
                                                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-xl shadow-indigo-500/20'
                                                        : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span
                                                        className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                                                            isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                                        }`}
                                                    >
                                                        {cohort.subject || 'General'} • Code: {cohort.code}
                                                    </span>
                                                    <span className={`text-xs font-black ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`}>
                                                        {cohort.studentCount} Students
                                                    </span>
                                                </div>
                                                <h4 className="text-lg font-black tracking-tight">{cohort.name}</h4>
                                                <p className={`text-xs font-bold mt-1 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                                                    Teacher: {cohort.instructorName}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right Column: Active Cohort Inspector (Teacher & Student Roster Assignment) */}
                            <div className="lg:col-span-7">
                                {activeCohort ? (
                                    <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
                                        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                                                    Cohort Inspector • Join Code: {activeCohort.code}
                                                </span>
                                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                                                    {activeCohort.name}
                                                </h3>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteCohort(activeCohort)}
                                                className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-rose-100"
                                            >
                                                <Trash2 size={13} /> Delete Class
                                            </button>
                                        </div>

                                        {/* 1. Assign / Reassign Teacher */}
                                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                                                Assigned Lead Teacher (Instructor)
                                            </label>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <select
                                                    value={activeCohort.instructorId || activeCohort._instructorUid || ''}
                                                    onChange={(e) => handleAssignTeacherToCohort(activeCohort, e.target.value)}
                                                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black outline-none focus:border-indigo-500"
                                                >
                                                    <option value="">-- Select an Instructor --</option>
                                                    {instructorsList.map((inst) => (
                                                        <option key={inst.uid} value={inst.uid}>
                                                            {inst.name || 'Instructor'} ({inst.email || inst.uid})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* 2. Assign Student to This Cohort (By Dropdown OR Email) */}
                                        <div className="p-5 rounded-3xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-500/20 space-y-4">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                                <UserPlus size={14} /> Enroll Student into {activeCohort.name}
                                            </h4>

                                            {/* Option A: Select from existing student directory */}
                                            <div className="flex gap-2">
                                                <select
                                                    value={selectedStudentUidToAdd}
                                                    onChange={(e) => setSelectedStudentUidToAdd(e.target.value)}
                                                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                                                >
                                                    <option value="">Select existing student from directory...</option>
                                                    {studentsList.map((s) => (
                                                        <option key={s.uid} value={s.uid}>
                                                            {s.name || 'Scholar'} ({s.email || s.uid})
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    disabled={!selectedStudentUidToAdd}
                                                    onClick={() => {
                                                        const stu = studentsList.find((s) => s.uid === selectedStudentUidToAdd);
                                                        if (stu) handleEnrollStudentInCohort(activeCohort, stu);
                                                    }}
                                                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-[10px] font-black uppercase tracking-widest shrink-0"
                                                >
                                                    Enroll Selected
                                                </button>
                                            </div>

                                            {/* Option B: Enroll directly by email address */}
                                            <div className="flex gap-2">
                                                <input
                                                    type="email"
                                                    value={studentEmailToAdd}
                                                    onChange={(e) => setStudentEmailToAdd(e.target.value)}
                                                    placeholder="Or type student email (e.g. scholar@school.edu)..."
                                                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    disabled={!studentEmailToAdd.trim()}
                                                    onClick={() => handleEnrollStudentInCohort(activeCohort, studentEmailToAdd)}
                                                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[10px] font-black uppercase tracking-widest shrink-0"
                                                >
                                                    + Add by Email
                                                </button>
                                            </div>
                                        </div>

                                        {/* 3. Current Cohort Student Roster */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    Enrolled Roster ({activeCohort.studentCount})
                                                </span>
                                            </div>

                                            <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                                                {(activeCohort.studentEmails || []).map((email: string) => {
                                                    const matchedProfile = allProfiles.find(
                                                        (p) => (p.email || '').toLowerCase() === email.toLowerCase()
                                                    );
                                                    return (
                                                        <div
                                                            key={email}
                                                            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3"
                                                        >
                                                            <div>
                                                                <div className="text-xs font-black text-slate-800 dark:text-white">
                                                                    {matchedProfile?.name || email.split('@')[0]}
                                                                </div>
                                                                <div className="text-[10px] font-bold text-slate-400">{email}</div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {matchedProfile && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditingProfile({ ...matchedProfile })}
                                                                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 text-[10px] font-black uppercase"
                                                                    >
                                                                        Profile
                                                                    </button>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveStudentFromCohort(activeCohort, email)}
                                                                    className="p-1.5 text-slate-400 hover:text-rose-500"
                                                                    title="Remove from Cohort"
                                                                >
                                                                    <X size={15} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {(activeCohort.studentEmails || []).length === 0 && (
                                                    <p className="text-xs text-slate-400 font-bold text-center py-6">
                                                        No students enrolled in this cohort yet. Use the controls above to add students.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full min-h-[360px] rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-10 text-center text-slate-400">
                                        <School size={40} className="mb-3 opacity-50" />
                                        <p className="text-sm font-black text-slate-600 dark:text-slate-300">Select a Class / Cohort on the left</p>
                                        <p className="text-xs font-bold mt-1">
                                            Assign teachers, manage student rosters, or click "+ New Class / Cohort" in the top bar.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 3: STUDENT & USER DIRECTORY (EDIT PROFILES & COHORTS) */}
                    {/* ========================================================= */}
                    {activeTab === 'directory' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex flex-wrap items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                                    <Search size={18} className="text-slate-400 ml-2" />
                                    <input
                                        type="text"
                                        value={directorySearch}
                                        onChange={(e) => setDirectorySearch(e.target.value)}
                                        placeholder="Search students & users by name, email, or UID..."
                                        className="w-full bg-transparent text-xs font-bold outline-none"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    {(['all', 'student', 'instructor', 'admin'] as const).map((r) => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setDirectoryRoleFilter(r)}
                                            className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                directoryRoleFilter === r
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                            }`}
                                        >
                                            {r === 'all' ? 'All Users' : `${r}s`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredProfiles.map((p) => {
                                    const role = p.role || 'student';
                                    const enrolledCohorts = getStudentEnrolledCohorts(p);
                                    return (
                                        <div
                                            key={p.uid}
                                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] border border-slate-200/80 dark:border-slate-800 p-5 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between gap-4"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center text-base border border-indigo-500/20">
                                                        {(p.name || p.email || 'S').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                                                            {p.name || 'Unnamed Scholar'}
                                                        </h4>
                                                        <p className="text-[11px] font-bold text-slate-400 truncate max-w-[180px]">
                                                            {p.email || p.uid}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span
                                                    className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                        role === 'admin'
                                                            ? 'bg-rose-500/10 text-rose-600'
                                                            : role === 'instructor'
                                                            ? 'bg-amber-500/15 text-amber-600'
                                                            : 'bg-emerald-500/10 text-emerald-600'
                                                    }`}
                                                >
                                                    {role}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black text-slate-500">
                                                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                                                    ⚡ {p.xp || 0} XP
                                                </span>
                                                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                                                    🌐 {p.targetLanguage || 'Latin'}
                                                </span>
                                                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                                    🏫 {enrolledCohorts.length} {enrolledCohorts.length === 1 ? 'Cohort' : 'Cohorts'}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingProfile({ ...p })}
                                                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                                >
                                                    <Edit3 size={13} /> Manage Profile & Cohorts
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 4: INSTRUCTORS / TEACHERS MANAGER                     */}
                    {/* ========================================================= */}
                    {activeTab === 'instructors' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-300">
                            {populatedInstructors.map((inst) => (
                                <div
                                    key={inst.uid}
                                    className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.2rem] border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4 flex flex-col justify-between"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full">
                                                {inst.role}
                                            </span>
                                            <h4 className="text-lg font-black text-slate-900 dark:text-white mt-2">
                                                {inst.name || 'Instructor'}
                                            </h4>
                                            <p className="text-xs font-bold text-slate-400">{inst.email || inst.uid}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setEditingProfile({ ...inst })}
                                            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                                            Assigned Classes ({inst.theirCohorts.length})
                                        </span>
                                        {inst.theirCohorts.map((c: any) => (
                                            <div
                                                key={c.id}
                                                onClick={() => {
                                                    setSelectedCohortId(c.id);
                                                    setActiveTab('cohorts');
                                                }}
                                                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-bold cursor-pointer hover:border-indigo-400"
                                            >
                                                <span>{c.name}</span>
                                                <span className="text-[10px] text-emerald-600 font-black">{c.studentCount} Students</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNewCohortForm((prev) => ({ ...prev, instructorId: inst.uid }));
                                            setShowCreateCohortModal(true);
                                        }}
                                        className="w-full py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        + Create Class for {inst.name?.split(' ')[0] || 'Teacher'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 5: CURRICULUM VAULT (DEPLOY TO COHORTS)               */}
                    {/* ========================================================= */}
                    {activeTab === 'vault' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex flex-wrap items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                                    <Search size={18} className="text-slate-400 ml-2" />
                                    <input
                                        type="text"
                                        value={vaultSearch}
                                        onChange={(e) => setVaultSearch(e.target.value)}
                                        placeholder="Search lessons, exams, and labs..."
                                        className="w-full bg-transparent text-xs font-bold outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filteredContent.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.2rem] border border-slate-200 dark:border-slate-800 p-6 shadow-lg flex flex-col justify-between gap-4"
                                    >
                                        <div>
                                            <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 text-[9px] font-black uppercase tracking-widest">
                                                {item.contentType || item.type || 'Lesson'}
                                            </span>
                                            <h4 className="text-lg font-black text-slate-900 dark:text-white mt-2 leading-snug">
                                                {item.title || 'Untitled Module'}
                                            </h4>
                                            <p className="text-xs font-bold text-slate-400 mt-1">By {item.authorName}</p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDeployingContent(item);
                                                setDeploySelectedCohorts([]);
                                            }}
                                            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest shadow-md"
                                        >
                                            Assign to Cohorts
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 6: FRANCHISE / ORGANIZATIONS                          */}
                    {/* ========================================================= */}
                    {activeTab === 'franchise' && isSuperAdmin && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-black">B2B Franchise Tenants</h3>
                                <button
                                    type="button"
                                    onClick={() => setShowOrgModal(true)}
                                    className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2"
                                >
                                    <Plus size={14} /> Provision Organization
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {organizations.map((org) => (
                                    <div key={org.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.2rem] border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: org.themeColor || '#4f46e5' }} />
                                            <div>
                                                <h4 className="font-black text-base">{org.name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400">ID: {org.id}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setEditingOrg(org)}
                                            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-black uppercase"
                                        >
                                            Edit Branding
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ============================================================================ */}
            {/* MODAL 1: EDIT STUDENT / USER PROFILE & COHORT ENROLLMENTS                    */}
            {/* ============================================================================ */}
            {editingProfile && (
                <div className="fixed inset-0 z-[9000] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
                    <form
                        onSubmit={handleSaveProfileEdit}
                        className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-7 space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                                    Profile & Cohort Manager
                                </span>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                                    {editingProfile.name || 'Scholar Profile'}
                                </h3>
                            </div>
                            <button type="button" onClick={() => setEditingProfile(null)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={editingProfile.name || ''}
                                    onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-black"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={editingProfile.email || ''}
                                    onChange={(e) => setEditingProfile({ ...editingProfile, email: e.target.value })}
                                    placeholder="student@school.edu"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">System Role</label>
                                <select
                                    value={editingProfile.role || 'student'}
                                    onChange={(e) => setEditingProfile({ ...editingProfile, role: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-black"
                                >
                                    <option value="student">Student</option>
                                    <option value="instructor">Instructor (Teacher)</option>
                                    <option value="org_admin">Org Admin</option>
                                    {isSuperAdmin && <option value="admin">Super Admin</option>}
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Target Language</label>
                                <input
                                    type="text"
                                    value={editingProfile.targetLanguage || 'Latin'}
                                    onChange={(e) => setEditingProfile({ ...editingProfile, targetLanguage: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Total XP</label>
                                <input
                                    type="number"
                                    value={editingProfile.xp ?? 0}
                                    onChange={(e) => setEditingProfile({ ...editingProfile, xp: parseInt(e.target.value) || 0 })}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-black"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Daily Streak</label>
                                <input
                                    type="number"
                                    value={editingProfile.streak ?? 0}
                                    onChange={(e) => setEditingProfile({ ...editingProfile, streak: parseInt(e.target.value) || 0 })}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-black"
                                />
                            </div>
                        </div>

                        {/* Direct Cohort Enlistment Inside Student Profile */}
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block">
                                Enrolled Classes / Cohorts
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {getStudentEnrolledCohorts(editingProfile).map((c) => (
                                    <span
                                        key={c.id}
                                        className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black flex items-center gap-1.5"
                                    >
                                        {c.name}
                                        {editingProfile.email && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveStudentFromCohort(c, editingProfile.email)}
                                                className="hover:text-rose-500"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </span>
                                ))}
                                {getStudentEnrolledCohorts(editingProfile).length === 0 && (
                                    <span className="text-xs text-slate-400 font-bold">Not assigned to any cohort yet.</span>
                                )}
                            </div>

                            <div className="flex gap-2 pt-2">
                                <select
                                    value={profileCohortToJoin}
                                    onChange={(e) => setProfileCohortToJoin(e.target.value)}
                                    className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                                >
                                    <option value="">Assign to a Cohort / Class...</option>
                                    {populatedCohorts.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.instructorName})
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    disabled={!profileCohortToJoin}
                                    onClick={async () => {
                                        const targetCohort = populatedCohorts.find((c) => c.id === profileCohortToJoin);
                                        if (targetCohort) {
                                            await handleEnrollStudentInCohort(targetCohort, editingProfile);
                                            setProfileCohortToJoin('');
                                        }
                                    }}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
                                >
                                    + Assign
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setEditingProfile(null)}
                                className="flex-1 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-black uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSavingProfile}
                                className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest shadow-lg"
                            >
                                {isSavingProfile ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ============================================================================ */}
            {/* MODAL 2: CREATE NEW CLASS / COHORT                                           */}
            {/* ============================================================================ */}
            {showCreateCohortModal && (
                <div className="fixed inset-0 z-[9000] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
                    <form
                        onSubmit={handleCreateCohort}
                        className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-7 space-y-4"
                    >
                        <div className="flex items-center justify-between pb-2">
                            <h3 className="text-xl font-black">Create Class / Cohort</h3>
                            <button type="button" onClick={() => setShowCreateCohortModal(false)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
                                <X size={16} />
                            </button>
                        </div>

                        <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Class / Cohort Name</label>
                            <input
                                type="text"
                                required
                                value={newCohortForm.name}
                                onChange={(e) => setNewCohortForm({ ...newCohortForm, name: e.target.value })}
                                placeholder="e.g., AP Latin Cohort Alpha"
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-black"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={newCohortForm.subject}
                                    onChange={(e) => setNewCohortForm({ ...newCohortForm, subject: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Grade / Level</label>
                                <input
                                    type="text"
                                    value={newCohortForm.grade}
                                    onChange={(e) => setNewCohortForm({ ...newCohortForm, grade: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Assign Lead Teacher</label>
                            <select
                                value={newCohortForm.instructorId}
                                onChange={(e) => setNewCohortForm({ ...newCohortForm, instructorId: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                            >
                                <option value="">Assign to Myself / Default Admin</option>
                                {instructorsList.map((inst) => (
                                    <option key={inst.uid} value={inst.uid}>
                                        {inst.name || 'Instructor'} ({inst.email || inst.uid})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={isCreatingCohort}
                            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest shadow-lg"
                        >
                            {isCreatingCohort ? 'Creating Cohort...' : 'Create Class Cohort'}
                        </button>
                    </form>
                </div>
            )}

            {/* ============================================================================ */}
            {/* MODAL 3: PROVISION NEW STUDENT / USER PROFILE                                */}
            {/* ============================================================================ */}
            {showCreateUserModal && (
                <div className="fixed inset-0 z-[9000] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
                    <form
                        onSubmit={handleCreateUserProfile}
                        className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-7 space-y-4"
                    >
                        <div className="flex items-center justify-between pb-2">
                            <h3 className="text-xl font-black">Register Student / User</h3>
                            <button type="button" onClick={() => setShowCreateUserModal(false)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
                                <X size={16} />
                            </button>
                        </div>

                        <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Full Name</label>
                            <input
                                type="text"
                                required
                                value={newUserForm.name}
                                onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                                placeholder="Marcus Aurelius"
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-black"
                            />
                        </div>

                        <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={newUserForm.email}
                                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                placeholder="marcus@academy.edu"
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Role</label>
                                <select
                                    value={newUserForm.role}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-black"
                                >
                                    <option value="student">Student</option>
                                    <option value="instructor">Instructor (Teacher)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Starting XP</label>
                                <input
                                    type="number"
                                    value={newUserForm.xp}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, xp: parseInt(e.target.value) || 0 })}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                                />
                            </div>
                        </div>

                        {newUserForm.role === 'student' && (
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                                    Immediately Enroll in Cohort (Optional)
                                </label>
                                <select
                                    value={newUserForm.cohortId}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, cohortId: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                                >
                                    <option value="">-- None --</option>
                                    {populatedCohorts.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.instructorName})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest shadow-lg"
                        >
                            Create Profile
                        </button>
                    </form>
                </div>
            )}

            {/* ============================================================================ */}
            {/* MODAL 4: DEPLOY VAULT CONTENT TO COHORTS                                     */}
            {/* ============================================================================ */}
            {deployingContent && (
                <div className="fixed inset-0 z-[9000] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-7 space-y-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Deploy Module</span>
                                <h3 className="text-lg font-black">{deployingContent.title}</h3>
                            </div>
                            <button type="button" onClick={() => setDeployingContent(null)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {populatedCohorts.map((c) => {
                                const isChecked = deploySelectedCohorts.includes(c.id);
                                return (
                                    <label
                                        key={c.id}
                                        className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer ${
                                            isChecked ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-500' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                                        }`}
                                    >
                                        <div>
                                            <div className="text-xs font-black">{c.name}</div>
                                            <div className="text-[10px] font-bold text-slate-400">Teacher: {c.instructorName}</div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() =>
                                                setDeploySelectedCohorts((prev) =>
                                                    isChecked ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                                                )
                                            }
                                        />
                                    </label>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            disabled={isDeploying || deploySelectedCohorts.length === 0}
                            onClick={handleDeployContentToCohorts}
                            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-black uppercase tracking-widest shadow-lg"
                        >
                            {isDeploying ? 'Deploying...' : `Assign to ${deploySelectedCohorts.length} Cohort(s)`}
                        </button>
                    </div>
                </div>
            )}

            {/* ============================================================================ */}
            {/* MODAL 5: GLOBAL BROADCAST                                                    */}
            {/* ============================================================================ */}
            {showBroadcastModal && (
                <div className="fixed inset-0 z-[9000] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-7 max-w-md w-full space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-black">System Broadcast</h3>
                            <button type="button" onClick={() => setShowBroadcastModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <textarea
                            rows={3}
                            value={broadcastMsg}
                            onChange={(e) => setBroadcastMsg(e.target.value)}
                            placeholder="Announcement message to all active scholars and instructors..."
                            className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border text-xs font-bold"
                        />
                        <button
                            type="button"
                            disabled={isBroadcasting}
                            onClick={handleGlobalBroadcast}
                            className="w-full py-3.5 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest"
                        >
                            {isBroadcasting ? 'Sending...' : 'Send Broadcast'}
                        </button>
                    </div>
                </div>
            )}

            {/* CONFIRMATION MODAL */}
            {confirmModal && (
                <div className="fixed inset-0 z-[9200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] text-center max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
                        <h3 className="text-2xl font-black mb-2">{confirmModal.title}</h3>
                        <p className="text-xs font-bold text-slate-500 mb-6">{confirmModal.message}</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmModal(null)} className="flex-1 p-3.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black uppercase">
                                Cancel
                            </button>
                            <button onClick={confirmModal.onConfirm} className="flex-1 p-3.5 bg-rose-600 text-white rounded-xl text-xs font-black uppercase">
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
