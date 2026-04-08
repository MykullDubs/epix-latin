// src/components/LiveRoleplayArena.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Activity, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface LiveRoleplayArenaProps {
    scenarioPrompt: string;
    onClose: () => void;
}

export default function LiveRoleplayArena({ scenarioPrompt, onClose }: LiveRoleplayArenaProps) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [aiSpeaking, setAiSpeaking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Audio & Socket Refs
    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const nextPlayTimeRef = useRef<number>(0);

    // Explicitly grab the Vite Environment Variable
const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
    // ─────────────────────────────────────────────────────────────────────────────
    // UTILS: PCM <--> BASE64 CONVERSIONS
    // ─────────────────────────────────────────────────────────────────────────────
    const float32ToInt16Base64 = (float32Array: Float32Array): string => {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        const uint8Array = new Uint8Array(int16Array.buffer);
        let binary = '';
        for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
        }
        return btoa(binary);
    };

    const base64ToFloat32 = (base64: string): Float32Array => {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const int16View = new Int16Array(bytes.buffer);
        const float32Data = new Float32Array(int16View.length);
        for (let i = 0; i < int16View.length; i++) {
            float32Data[i] = int16View[i] / 32768;
        }
        return float32Data;
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // 1. BOOT THE AUDIO ENGINE & SOCKET
    // ─────────────────────────────────────────────────────────────────────────────
    const startCall = async () => {
        console.log("Initializing Gemini Live Engine...");
        
        if (!apiKey) {
            console.error("CRITICAL: VITE_GEMINI_API_KEY is undefined.");
            setError("Missing Neural Engine API Key. Please configure your environment variables.");
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            // A. Initialize Web Audio API for 16kHz capture (Gemini requires 16kHz input)
            const audioCtx = new window.AudioContext({ sampleRate: 16000 });
            audioContextRef.current = audioCtx;

            // B. Request Microphone Access
            console.log("Requesting microphone permissions...");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000 } });
            streamRef.current = stream;
            console.log("Microphone access granted.");

            // C. Connect to Gemini Live WebSocket
            const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
            console.log("Opening WebSocket to:", wsUrl.replace(apiKey, "HIDDEN_KEY"));
            
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("WebSocket opened. Sending initial setup config...");
                // Send the initial setup framing to define the persona
                const setupMessage = {
                    setup: {
                        model: "models/gemini-2.0-flash-exp",
                        generationConfig: {
                            responseModalities: ["AUDIO"],
                            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } } }
                        },
                        systemInstruction: {
                            parts: [{ text: scenarioPrompt || "You are a helpful roleplay partner." }]
                        }
                    }
                };
                ws.send(JSON.stringify(setupMessage));
            };

            ws.onmessage = async (event) => {
                if (event.data instanceof Blob) {
                    const text = await event.data.text();
                    try {
                        const data = JSON.parse(text);
                        handleIncomingData(data);
                    } catch (e) {
                        console.error("Failed to parse Blob JSON", e);
                    }
                } else {
                    try {
                        const data = JSON.parse(event.data);
                        handleIncomingData(data);
                    } catch (e) {
                        console.error("Failed to parse String JSON", e);
                    }
                }
            };

            ws.onerror = (e) => {
                console.error("Socket Error:", e);
                setError("Connection to the Neural Engine was interrupted.");
                setIsConnecting(false);
            };

            ws.onclose = (e) => {
                console.log("WebSocket closed.", e.code, e.reason);
                setIsConnected(false);
                setAiSpeaking(false);
                if (e.code !== 1000 && !error) {
                    setError(`Socket closed unexpectedly (Code ${e.code}).`);
                }
            };

        } catch (err: any) {
            console.error("Engine Initialization Failed:", err);
            setError(err.name === 'NotAllowedError' ? "Microphone access denied. Please allow mic permissions in your browser settings." : "Failed to initialize the audio engine.");
            setIsConnecting(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // 2. DATA HANDLER (Processing incoming WebSocket messages)
    // ─────────────────────────────────────────────────────────────────────────────
    const handleIncomingData = (data: any) => {
        // Setup confirmation
        if (data.setupComplete) {
            console.log("Setup Complete received. Link established.");
            setIsConnected(true);
            setIsConnecting(false);
            startMicrophoneCapture();
            return;
        }

        // Catch incoming audio chunks
        const parts = data?.serverContent?.modelTurn?.parts;
        if (parts && parts.length > 0) {
            const inlineData = parts[0]?.inlineData;
            if (inlineData && inlineData.mimeType.startsWith('audio/pcm')) {
                setAiSpeaking(true);
                playAudioChunk(inlineData.data);
            }
        }

        // Detect end of AI's turn
        if (data?.serverContent?.turnComplete) {
            // Add a slight delay to turn off the visualization so the last audio chunk finishes playing
            setTimeout(() => setAiSpeaking(false), 500); 
        }
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // 3. AUDIO PLAYBACK (Queuing AI Audio)
    // ─────────────────────────────────────────────────────────────────────────────
    const playAudioChunk = (base64Data: string) => {
        if (!audioContextRef.current) return;
        const ctx = audioContextRef.current;
        
        // Gemini outputs 24kHz PCM
        const float32Data = base64ToFloat32(base64Data);
        const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000); 
        audioBuffer.getChannelData(0).set(float32Data);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);

        // Seamless queueing
        const currentTime = ctx.currentTime;
        if (nextPlayTimeRef.current < currentTime) {
            nextPlayTimeRef.current = currentTime;
        }
        
        source.start(nextPlayTimeRef.current);
        nextPlayTimeRef.current += audioBuffer.duration;
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // 4. MICROPHONE CAPTURE (Streaming to AI)
    // ─────────────────────────────────────────────────────────────────────────────
    const startMicrophoneCapture = () => {
        if (!audioContextRef.current || !streamRef.current || !wsRef.current) return;
        const ctx = audioContextRef.current;
        const source = ctx.createMediaStreamSource(streamRef.current);

        // Create a script processor to grab raw audio chunks
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
            // If the user muted the mic or the socket dropped, do nothing
            if (isMuted || wsRef.current?.readyState !== WebSocket.OPEN) return;

            const inputData = e.inputBuffer.getChannelData(0);
            const base64PCM = float32ToInt16Base64(inputData);

            const message = {
                realtimeInput: {
                    mediaChunks: [{
                        mimeType: "audio/pcm;rate=16000",
                        data: base64PCM
                    }]
                }
            };
            wsRef.current.send(JSON.stringify(message));
        };

        source.connect(processor);
        processor.connect(ctx.destination); // Required for Safari to process audio
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // 5. TEARDOWN PROTOCOL
    // ─────────────────────────────────────────────────────────────────────────────
    const endCall = () => {
        if (wsRef.current) wsRef.current.close();
        if (processorRef.current) processorRef.current.disconnect();
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) audioContextRef.current.close();
        setIsConnected(false);
        onClose();
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => { endCall(); };
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center animate-in fade-in duration-500 overflow-hidden">
            
            {/* Cinematic Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] mix-blend-screen transition-all duration-1000 ${aiSpeaking ? 'bg-indigo-600/40 scale-110' : 'bg-indigo-900/10 scale-100'}`} />
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[100px] mix-blend-screen transition-all duration-500 delay-75 ${aiSpeaking ? 'bg-cyan-400/40 scale-125' : 'bg-cyan-900/10 scale-100'}`} />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay" />
            </div>

            {/* Header */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/10">
                        <Activity size={20} className="text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-white font-black uppercase tracking-widest text-xs">Live Audio Simulation</h2>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{isConnected ? 'Secure Connection Active' : 'Waiting for link'}</p>
                    </div>
                </div>
                <button onClick={endCall} className="p-3 bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-full transition-colors border border-white/5">
                    <X size={20} strokeWidth={3} />
                </button>
            </div>

            {/* Center Orb */}
            <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full">
                
                {error ? (
                    <div className="flex flex-col items-center max-w-md text-center animate-in zoom-in-95">
                        <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-6 border border-rose-500/20">
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-xl font-black text-white mb-2">Connection Failed</h3>
                        <p className="text-slate-400 font-medium mb-8">{error}</p>
                        <button onClick={onClose} className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-colors">
                            Return to Base
                        </button>
                    </div>
                ) : !isConnected ? (
                    <div className="flex flex-col items-center">
                        <button 
                            onClick={startCall} 
                            disabled={isConnecting}
                            className="relative group w-40 h-40 flex items-center justify-center cursor-pointer"
                        >
                            <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl group-hover:bg-indigo-500/40 transition-colors duration-500" />
                            <div className="w-32 h-32 bg-slate-900 border-2 border-indigo-500/50 rounded-full shadow-[0_0_50px_rgba(99,102,241,0.3)] flex flex-col items-center justify-center text-indigo-400 group-hover:scale-105 group-active:scale-95 transition-all z-10">
                                {isConnecting ? <Loader2 size={32} className="animate-spin" /> : <Mic size={32} />}
                            </div>
                        </button>
                        <p className="text-white font-black mt-8 tracking-widest uppercase text-sm">Tap to Initialize</p>
                        <p className="text-slate-500 text-xs mt-2 max-w-xs text-center">Allow microphone access to connect to the neural engine.</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        {/* The Pulsing Neural Orb */}
                        <div className="relative w-64 h-64 flex items-center justify-center mb-12">
                            <div className={`absolute inset-0 border-2 border-cyan-500/30 rounded-full transition-all duration-300 ${aiSpeaking ? 'scale-150 opacity-0 animate-ping' : 'scale-100 opacity-100'}`} />
                            <div className={`absolute inset-4 border-2 border-indigo-500/40 rounded-full transition-all duration-200 delay-75 ${aiSpeaking ? 'scale-125 opacity-0 animate-ping' : 'scale-100 opacity-100'}`} />
                            
                            <div className={`relative z-10 w-32 h-32 rounded-full shadow-[0_0_80px_rgba(6,182,212,0.4)] flex items-center justify-center transition-all duration-500 ${aiSpeaking ? 'bg-gradient-to-tr from-cyan-400 to-indigo-500 scale-110' : 'bg-slate-800 border-4 border-slate-700 scale-100'}`}>
                                {aiSpeaking ? <Activity size={48} className="text-white animate-pulse" /> : <Sparkles size={32} className="text-slate-500" />}
                            </div>
                        </div>

                        {/* Conversation Status */}
                        <div className="text-center h-16">
                            <h3 className="text-2xl font-black text-white tracking-tight">
                                {aiSpeaking ? "Receiving Transmission..." : "Listening..."}
                            </h3>
                            <p className="text-indigo-300/70 text-sm font-medium mt-1">
                                {aiSpeaking ? "The simulation is speaking." : "Speak into your microphone."}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div className={`absolute bottom-0 left-0 w-full p-8 flex justify-center transition-transform duration-500 ${isConnected ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-[2rem] flex items-center gap-6 shadow-2xl">
                    <button 
                        onClick={() => setIsMuted(!isMuted)}
                        className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-rose-500/20 text-rose-500 hover:bg-rose-500/30' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                    >
                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                    
                    <button onClick={endCall} className="bg-rose-600 hover:bg-rose-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg shadow-rose-600/20">
                        End Simulation
                    </button>
                </div>
            </div>
        </div>
    );
}
