// src/components/AuthView.tsx
import React, { useState } from 'react';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signInWithPopup, 
    GoogleAuthProvider 
} from 'firebase/auth';
import { doc, getDoc, setDoc, query, collectionGroup, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db, appId } from '../config/firebase';
import { DEFAULT_USER_DATA } from '../constants/defaults';
import { GraduationCap, User, Mail, Shield, Eye, EyeOff, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export default function AuthView() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<'student' | 'instructor'>('student');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const executeRosterHandshake = async (userEmail: string, finalName: string, uid: string) => {
        try {
            const classesQuery = query(collectionGroup(db, 'classes'), where('studentEmails', 'array-contains', userEmail));
            const classesSnap = await getDocs(classesQuery);
            
            const updatePromises = classesSnap.docs.map(async (classDoc) => {
                const classData = classDoc.data();
                const studentsArray = classData.students || [];
                
                let rosterChanged = false;
                
                const updatedStudents = studentsArray.map((s: any) => {
                    if (s.email === userEmail && !s.name) {
                        rosterChanged = true;
                        return { ...s, name: finalName || "Student", uid: uid };
                    }
                    return s;
                });

                if (rosterChanged) {
                    return updateDoc(classDoc.ref, { students: updatedStudents });
                }
            });

            await Promise.all(updatePromises);
        } catch (e) {
            console.error("Roster Handshake Failed:", e);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setIsGoogleLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
            const userSnap = await getDoc(userRef);

            let finalName = user.displayName || "Scholar";
            const userEmail = (user.email || "").toLowerCase().trim();

            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    ...DEFAULT_USER_DATA,
                    name: finalName,
                    email: userEmail,
                    role: isLogin ? 'student' : role,
                    joinedAt: Date.now(),
                    isOnboarded: true
                });
                
                await executeRosterHandshake(userEmail, finalName, user.uid);
            }
        } catch (err: any) {
            if (err.code !== 'auth/popup-closed-by-user') {
                setError(err.message.replace('Firebase: ', '').split('-').join(' '));
            }
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleEmailAuth = async (e: any) => { 
        e.preventDefault(); 
        setError(''); 
        setLoading(true); 
        
        try { 
            let userCredential;
            let finalName = name.trim();
            const userEmail = email.toLowerCase().trim();

            if (isLogin) {
                userCredential = await signInWithEmailAndPassword(auth, email, password); 
                const profileSnap = await getDoc(doc(db, 'artifacts', appId, 'users', userCredential.user.uid, 'profile', 'main'));
                if (profileSnap.exists()) finalName = profileSnap.data().name;
            } else { 
                userCredential = await createUserWithEmailAndPassword(auth, email, password); 
                finalName = finalName || (role === 'instructor' ? "Professor" : "Scholar");
                
                await setDoc(doc(db, 'artifacts', appId, 'users', userCredential.user.uid, 'profile', 'main'), { 
                    ...DEFAULT_USER_DATA, 
                    name: finalName, 
                    email: userEmail, 
                    role: role,
                    joinedAt: Date.now(),
                    isOnboarded: true
                }); 
                
                await executeRosterHandshake(userEmail, finalName, userCredential.user.uid);
            } 
        } catch (err: any) { 
            setError(err.message.replace('Firebase: ', '').replace('Error (auth/', '').replace(').', '').split('-').join(' ')); 
        } finally { 
            setLoading(false); 
        } 
    };
  
    return ( 
        <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-indigo-500/30">
            
            {/* 🔥 FIX: ADDED pointer-events-none TO PREVENT CLICK INTERCEPTION */}
            <div className="absolute inset-0 bg-slate-950 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-600/30 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }}></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-rose-600/20 blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }}></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay"></div>
            </div>

            <div className="w-full max-w-[420px] bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-[3rem] shadow-2xl relative z-10 animate-in zoom-in-95 duration-700">
                
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.5rem] mx-auto flex items-center justify-center text-white mb-6 shadow-[0_10px_30px_rgba(99,102,241,0.4)] rotate-12 hover:rotate-0 transition-transform duration-500">
                        <GraduationCap size={32} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">Magister OS</h1>
                    <p className="text-indigo-300 font-medium text-sm">Authentication Gateway</p>
                </div>

                {!isLogin && (
                    <div className="animate-in slide-in-from-top-4 fade-in duration-300 mb-6">
                        <div className="flex bg-slate-950/50 p-1.5 rounded-2xl border border-white/5">
                            <button 
                                type="button" 
                                onClick={() => setRole('student')} 
                                className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${role === 'student' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Student
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setRole('instructor')} 
                                className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${role === 'instructor' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Instructor
                            </button>
                        </div>
                    </div>
                )}

                <button 
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading || loading}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 p-4 rounded-2xl font-black text-sm transition-all active:scale-[0.98] shadow-lg shadow-white/5 disabled:opacity-70 disabled:active:scale-100 mb-6"
                >
                    {isGoogleLoading ? (
                        <Loader2 size={20} className="animate-spin text-slate-400" />
                    ) : (
                        <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Continue with Google
                        </>
                    )}
                </button>

                <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-slate-800" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">OR EMAIL</span>
                    <div className="flex-1 h-px bg-slate-800" />
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                    
                    {!isLogin && (
                        <div className="relative group animate-in slide-in-from-top-4 fade-in duration-300">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                <User size={20} />
                            </div>
                            <input 
                                type="text" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                placeholder="Full Name"
                                className="w-full pl-14 pr-5 py-4 bg-slate-950/50 border-2 border-transparent focus:border-indigo-500/50 focus:bg-slate-900 rounded-2xl text-white placeholder:text-slate-600 outline-none transition-all font-bold shadow-inner" 
                                required={!isLogin} 
                            />
                        </div>
                    )}

                    <div className="relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                            <Mail size={20} />
                        </div>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="Email Address"
                            className="w-full pl-14 pr-5 py-4 bg-slate-950/50 border-2 border-transparent focus:border-indigo-500/50 focus:bg-slate-900 rounded-2xl text-white placeholder:text-slate-600 outline-none transition-all font-bold shadow-inner" 
                            required 
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                            <Shield size={20} />
                        </div>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="Password"
                            className="w-full pl-14 pr-14 py-4 bg-slate-950/50 border-2 border-transparent focus:border-indigo-500/50 focus:bg-slate-900 rounded-2xl text-white placeholder:text-slate-600 outline-none transition-all font-bold shadow-inner" 
                            required 
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {error && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl flex items-start gap-3 animate-in shake mt-2">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span className="capitalize">{error}</span>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading || isGoogleLoading || !email || !password || (!isLogin && !name)} 
                        className="w-full bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900/50 disabled:text-slate-600 active:scale-[0.98] py-4 rounded-2xl font-black uppercase tracking-widest text-white transition-all flex justify-center items-center gap-3 mt-6 text-[10px]"
                    >
                        {loading ? <Loader2 className="animate-spin text-white" size={16} /> : (isLogin ? "Sign in with Email" : "Create Account")}
                        {!loading && <ArrowRight size={14} />}
                    </button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-white/5">
                    <button 
                        onClick={() => { setIsLogin(!isLogin); setError(''); }} 
                        className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors"
                    >
                        {isLogin ? "Need access? Apply here." : "Already enrolled? Sign in."}
                    </button>
                </div>
            </div>
        </div> 
    );
}
