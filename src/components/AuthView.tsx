// src/components/AuthView.tsx
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, query, collectionGroup, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db, appId } from '../config/firebase';
import { DEFAULT_USER_DATA } from '../constants/defaults';
import { GraduationCap, User, Mail, Shield, Eye, EyeOff, AlertCircle, Loader, ArrowRight } from 'lucide-react';

export default function AuthView() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<'student' | 'instructor'>('student');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

   const handleAuth = async (e: any) => { 
        e.preventDefault(); 
        setError(''); 
        setLoading(true); 
        
        try { 
            let userCredential;
            let finalName = name.trim();
            const userEmail = email.toLowerCase().trim();

            if (isLogin) {
                // 1. SIGN IN
                userCredential = await signInWithEmailAndPassword(auth, email, password); 
                
                // Fetch their name from their profile so we can use it in the handshake
                const profileSnap = await getDoc(doc(db, 'artifacts', appId, 'users', userCredential.user.uid, 'profile', 'main'));
                if (profileSnap.exists()) finalName = profileSnap.data().name;

            } else { 
                // 2. SIGN UP
                userCredential = await createUserWithEmailAndPassword(auth, email, password); 
                finalName = finalName || (role === 'instructor' ? "Professor" : "Scholar");
                
                // Create the Base User Profile
                await setDoc(doc(db, 'artifacts', appId, 'users', userCredential.user.uid, 'profile', 'main'), { 
                    ...DEFAULT_USER_DATA, 
                    name: finalName, 
                    email: userEmail, 
                    role: role,
                    joinedAt: Date.now(),
                    isOnboarded: true
                }); 
            } 

            // ====================================================================
            // 3. THE MAGIC ROSTER HANDSHAKE
            // ====================================================================
            // Find all classes across ALL instructors where this student's email is listed
            const classesQuery = query(collectionGroup(db, 'classes'), where('studentEmails', 'array-contains', userEmail));
            const classesSnap = await getDocs(classesQuery);
            
            // Loop through those classes and update the 'Pending' roster objects with real data
            const updatePromises = classesSnap.docs.map(async (classDoc) => {
                const classData = classDoc.data();
                const studentsArray = classData.students || [];
                
                let rosterChanged = false;
                
                const updatedStudents = studentsArray.map((s: any) => {
                    // If we find their email, and their name is missing, heal it!
                    if (s.email === userEmail && !s.name) {
                        rosterChanged = true;
                        return { ...s, name: finalName || "Student", uid: userCredential.user.uid };
                    }
                    return s;
                });

                // Only push to Firebase if we actually fixed a pending registration
                if (rosterChanged) {
                    return updateDoc(classDoc.ref, { students: updatedStudents });
                }
            });

            // Wait for all rosters to update before finishing the login
            await Promise.all(updatePromises);

        } catch (err: any) { 
            setError(err.message.replace('Firebase: ', '').replace('Error (auth/', '').replace(').', '').split('-').join(' ')); 
        } finally { 
            setLoading(false); 
        } 
    };
  
    return ( 
        <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden font-sans">
            
            {/* --- IMMERSIVE BACKGROUND --- */}
            <div className="absolute inset-0 bg-slate-950 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-600/30 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }}></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-rose-600/20 blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }}></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay"></div>
            </div>

            {/* --- GLASSMORPHISM CARD --- */}
            <div className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 p-8 md:p-10 rounded-[3rem] shadow-2xl relative z-10 animate-in zoom-in-95 duration-700">
                
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] mx-auto flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-500/30 rotate-12 hover:rotate-0 transition-transform duration-500">
                        <GraduationCap size={40} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">LinguistFlow</h1>
                    <p className="text-indigo-200 font-medium text-sm">Enter the Academy.</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-5">
                    
                    {/* SIGN UP ONLY: Name & Role */}
                    {!isLogin && (
                        <div className="space-y-5 animate-in slide-in-from-top-4 fade-in duration-300">
                            {/* Segmented Role Toggle */}
                            <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/10">
                                <button 
                                    type="button" 
                                    onClick={() => setRole('student')} 
                                    className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${role === 'student' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Student
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setRole('instructor')} 
                                    className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${role === 'instructor' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Instructor
                                </button>
                            </div>

                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300 group-focus-within:text-white transition-colors">
                                    <User size={20} />
                                </div>
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    placeholder="Full Name"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border-2 border-white/10 focus:border-indigo-500 rounded-2xl text-white placeholder:text-slate-400 outline-none transition-all font-bold" 
                                    required={!isLogin} 
                                />
                            </div>
                        </div>
                    )}

                    {/* Email Input */}
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300 group-focus-within:text-white transition-colors">
                            <Mail size={20} />
                        </div>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="Email Address"
                            className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border-2 border-white/10 focus:border-indigo-500 rounded-2xl text-white placeholder:text-slate-400 outline-none transition-all font-bold" 
                            required 
                        />
                    </div>

                    {/* Password Input with Reveal Toggle */}
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300 group-focus-within:text-white transition-colors">
                            <Shield size={20} />
                        </div>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="Password"
                            className="w-full pl-12 pr-12 py-4 bg-slate-900/50 border-2 border-white/10 focus:border-indigo-500 rounded-2xl text-white placeholder:text-slate-400 outline-none transition-all font-bold" 
                            required 
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {/* Error Toast */}
                    {error && (
                        <div className="p-4 bg-rose-500/20 border border-rose-500/50 text-rose-200 text-sm font-bold rounded-xl flex items-start gap-3 animate-in shake">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <span className="capitalize">{error}</span>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        disabled={loading || !email || !password || (!isLogin && !name)} 
                        className="w-full bg-white text-indigo-900 hover:bg-indigo-50 active:scale-95 py-4 rounded-2xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:active:scale-100 mt-4"
                    >
                        {loading ? <Loader className="animate-spin text-indigo-600" size={20} /> : (isLogin ? "Sign In" : "Create Account")}
                        {!loading && <ArrowRight size={18} />}
                    </button>
                </form>

                {/* Mode Switcher */}
                <div className="mt-8 text-center">
                    <button 
                        onClick={() => { setIsLogin(!isLogin); setError(''); }} 
                        className="text-indigo-300 font-bold text-sm hover:text-white transition-colors"
                    >
                        {isLogin ? "Need access? Apply here." : "Already enrolled? Sign in."}
                    </button>
                </div>
            </div>
        </div> 
    );
}
