// src/components/MarketingSite.tsx
import React, { useState, useEffect } from 'react';
import { 
    LogIn, Menu, X, Shield, CheckCircle2, Zap, 
    PlayCircle, BarChart3, BookOpen, Briefcase, ChevronRight 
} from 'lucide-react';

interface MarketingSiteProps {
    onLoginClick: () => void;
    onBookDemoClick?: () => void;
}

// ============================================================================
//  MARKETING SITE: THE ACADEMY OS (SaaS Branding)
// ============================================================================
export default function MarketingSite({ onLoginClick, onBookDemoClick }: MarketingSiteProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activePage, setActivePage] = useState('home');

    // Creates the glassmorphism effect when scrolling down
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // --- INTERNAL HELPERS ---
    const Nav = () => (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-slate-950/80 backdrop-blur-md border-b border-white/10 py-4' : 'bg-transparent py-6'}`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* LOGO */}
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActivePage('home')}>
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20">M</div>
                    <span className="text-xl font-black tracking-widest uppercase text-white">Magister<span className="text-indigo-500">OS</span></span>
                </div>

                {/* DESKTOP LINKS */}
                <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-300 uppercase tracking-widest">
                    <button onClick={() => setActivePage('home')} className={`transition-colors ${activePage === 'home' ? 'text-white' : 'hover:text-white'}`}>Filosofía</button>
                    <button onClick={() => setActivePage('platform')} className={`transition-colors ${activePage === 'platform' ? 'text-white' : 'hover:text-white'}`}>Plataforma</button>
                    <button onClick={() => setActivePage('pricing')} className={`transition-colors ${activePage === 'pricing' ? 'text-white' : 'hover:text-white'}`}>Inversión</button>
                </div>

                {/* ACTIONS */}
                <div className="hidden md:flex items-center gap-4">
                    <button onClick={onLoginClick} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-300 hover:text-white transition-colors uppercase tracking-widest group">
                        <LogIn size={16} className="group-hover:text-indigo-400 transition-colors" /> Iniciar Sesión
                    </button>
                    <button onClick={onBookDemoClick} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black rounded-full transition-all uppercase tracking-widest shadow-lg active:scale-95">
                        Piloto de 14 Días
                    </button>
                </div>

                <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* MOBILE MENU */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-slate-900 border-b border-white/10 py-6 px-6 flex flex-col gap-6 shadow-2xl animate-in slide-in-from-top-4">
                    <button onClick={() => { setActivePage('home'); setMobileMenuOpen(false); }} className="text-left text-slate-300 font-bold uppercase tracking-widest">Filosofía</button>
                    <button onClick={() => { setActivePage('platform'); setMobileMenuOpen(false); }} className="text-left text-slate-300 font-bold uppercase tracking-widest">Plataforma</button>
                    <button onClick={() => { setActivePage('pricing'); setMobileMenuOpen(false); }} className="text-left text-slate-300 font-bold uppercase tracking-widest">Inversión</button>
                    <div className="h-px bg-white/10 w-full" />
                    <button onClick={onLoginClick} className="flex items-center justify-center gap-2 w-full py-4 bg-slate-800 rounded-xl font-bold text-white uppercase tracking-widest"><LogIn size={18} /> Iniciar Sesión</button>
                    <button onClick={onBookDemoClick} className="w-full py-4 bg-indigo-600 rounded-xl font-black text-white uppercase tracking-widest">Solicitar Piloto</button>
                </div>
            )}
        </nav>
    );

    const Footer = () => (
        <footer className="bg-slate-950 py-16 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <Shield size={24} className="text-indigo-500" />
                        <span className="text-2xl font-black text-white tracking-tighter">MAGISTER<span className="text-indigo-500">OS</span></span>
                    </div>
                    <p className="text-slate-400 font-medium max-w-sm">El sistema operativo de aprendizaje de marca blanca diseñado para academias de inglés de élite en Latinoamérica.</p>
                </div>
                <div>
                    <h4 className="text-white font-black mb-4 uppercase tracking-widest text-xs">Producto</h4>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => setActivePage('platform')} className="text-slate-400 hover:text-indigo-400 text-left text-sm font-medium">El Entorno Privado</button>
                        <button onClick={() => setActivePage('platform')} className="text-slate-400 hover:text-indigo-400 text-left text-sm font-medium">Bóveda Global</button>
                        <button onClick={() => setActivePage('platform')} className="text-slate-400 hover:text-indigo-400 text-left text-sm font-medium">Gimnasio</button>
                    </div>
                </div>
                <div>
                    <h4 className="text-white font-black mb-4 uppercase tracking-widest text-xs">Empresa</h4>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => setActivePage('pricing')} className="text-slate-400 hover:text-indigo-400 text-left text-sm font-medium">Planes y Precios</button>
                        <a href="#" className="text-slate-400 hover:text-indigo-400 text-left text-sm font-medium">Contactar a Ventas</a>
                    </div>
                </div>
            </div>
        </footer>
    );

    // --- RENDER LOGIC ---

    // 1. HOME PAGE
    if (activePage === 'home') return (
        <div className="min-h-screen bg-slate-900 font-sans selection:bg-indigo-500/30">
            <Nav />
            <main className="pt-32 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="max-w-5xl mx-auto text-center relative z-10 pt-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold text-xs uppercase tracking-widest mb-8">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /> El Estándar para Academias en LatAm
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.1] mb-8">
                        Deja de alquilar herramientas genéricas.<br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400">Sé dueño de tu campus digital.</span>
                    </h1>
                    <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
                        Plataforma de marca blanca diseñada para móviles. Reduce la deserción, automatiza calificaciones y accede a un currículo de inglés de clase mundial.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button onClick={onBookDemoClick} className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl">
                            Inicia tu Prueba Piloto
                        </button>
                        <button onClick={() => setActivePage('platform')} className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                            <PlayCircle size={18} /> Explora la Plataforma
                        </button>
                    </div>
                </div>
            </main>

            <section className="py-32 bg-slate-950 border-t border-white/5 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs uppercase tracking-widest mb-6">Nuestra Filosofía</div>
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Construido por educadores.</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-8 rounded-[2rem] bg-slate-900 border border-slate-800 group">
                            <Zap className="text-orange-400 mb-6" size={28}/>
                            <h3 className="text-xl font-black text-white mb-3">La Experiencia del Alumno</h3>
                            <p className="text-slate-400 font-medium leading-relaxed">Transformamos el estudio pasivo en una experiencia interactiva que los alumnos realmente disfrutan.</p>
                        </div>
                        <div className="p-8 rounded-[2rem] bg-slate-900 border border-slate-800 group">
                            <BookOpen className="text-indigo-400 mb-6" size={28}/>
                            <h3 className="text-xl font-black text-white mb-3">Empoderamiento Docente</h3>
                            <p className="text-slate-400 font-medium leading-relaxed">Aceleramos la planeación de clases y eliminamos horas de trabajo manual para tus instructores.</p>
                        </div>
                        <div className="p-8 rounded-[2rem] bg-slate-900 border border-slate-800 group">
                            <BarChart3 className="text-emerald-400 mb-6" size={28}/>
                            <h3 className="text-xl font-black text-white mb-3">Rentabilidad</h3>
                            <p className="text-slate-400 font-medium leading-relaxed">Brindamos a la dirección métricas claras sobre el progreso de los alumnos y el desempeño docente.</p>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );

    // 2. PLATFORM PAGE
    if (activePage === 'platform') return (
        <div className="min-h-screen bg-slate-900 font-sans">
            <Nav />
            <main className="pt-40 pb-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24">
                        <h1 className="text-5xl font-black text-white tracking-tight mb-6">Tu Entorno Privado.</h1>
                        <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">Aislamiento total de datos, inyección dinámica de marca y control absoluto.</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
                        <div className="aspect-square bg-slate-800 rounded-[3rem] border border-slate-700 flex items-center justify-center p-12">
                             <div className="w-full h-full bg-slate-900 rounded-2xl border border-slate-700 flex flex-col p-6 shadow-2xl">
                                 <div className="flex gap-4 mb-8">
                                     <div className="w-12 h-12 rounded-xl bg-rose-500" />
                                     <div className="space-y-2"><div className="h-4 w-32 bg-slate-700 rounded"/><div className="h-3 w-20 bg-slate-800 rounded"/></div>
                                 </div>
                                 <div className="flex-1 rounded-xl bg-slate-800/50 border border-slate-700 border-dashed" />
                             </div>
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-white mb-6">Marca Blanca Real.</h2>
                            <ul className="space-y-4">
                                {['Aislamiento de datos al 100%', 'Inyección dinámica de logotipo y colores', 'Propiedad total de la base de alumnos'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-300 font-medium"><CheckCircle2 size={20} className="text-emerald-500" /> {item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );

    // 3. PRICING PAGE
    if (activePage === 'pricing') return (
        <div className="min-h-screen bg-slate-900 font-sans">
            <Nav />
            <main className="pt-40 pb-32 px-6">
                <div className="max-w-3xl mx-auto text-center mb-20">
                    <h1 className="text-5xl font-black text-white mb-6">Precios transparentes.</h1>
                    <p className="text-xl text-slate-400 font-medium">Diseñado para la economía de las academias en América Latina.</p>
                </div>
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-800/50 rounded-[3rem] border border-slate-700 p-10 flex flex-col">
                        <h3 className="text-2xl font-black text-white mb-2">Boutique</h3>
                        <div className="mb-8"><span className="text-5xl font-black text-white">$149</span><span className="text-slate-500 font-bold"> / mes</span></div>
                        <ul className="space-y-4 mb-10 flex-1">
                            {['Hasta 100 Alumnos', 'Bóveda Global de Currículo', 'Centro de Mando'].map((f, i) => <li key={i} className="flex items-center gap-3 text-slate-300 font-medium"><CheckCircle2 size={20} className="text-slate-600" /> {f}</li>)}
                        </ul>
                        <button className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs">Prueba Gratis</button>
                    </div>
                    <div className="bg-indigo-600 rounded-[3rem] p-10 flex flex-col relative shadow-2xl">
                        <h3 className="text-2xl font-black text-white mb-2">Campus Premium</h3>
                        <div className="mb-8"><span className="text-5xl font-black text-white">$299</span><span className="text-indigo-300 font-bold"> / mes</span></div>
                        <ul className="space-y-4 mb-10 flex-1">
                            {['Hasta 250 Alumnos', 'Marca Blanca Completa', 'Soporte Prioritario WhatsApp'].map((f, i) => <li key={i} className="flex items-center gap-3 text-white font-medium"><CheckCircle2 size={20} className="text-indigo-300" /> {f}</li>)}
                        </ul>
                        <button className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-black uppercase tracking-widest text-xs">Ventas</button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );

    return null;
}
