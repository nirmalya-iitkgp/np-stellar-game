/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * THE HEART OF THE MAIN SEQUENCE
 * A poetic astrophysical evolution game.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Zap, Sparkles, Activity, Volume2, VolumeX, AlertCircle, Waves, Scale, Gem, Flame, ArrowRight } from 'lucide-react';

// --- AUDIO ENGINE ---
const createAudioContext = () => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    return new AudioContext();
};

let audioCtx: AudioContext | null = null;

const playTone = (freq: number, type: OscillatorType, duration: number, volume: number) => {
    if (!audioCtx) audioCtx = createAudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime;
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(now + duration);
};

// --- CONSTANTS ---
const MIDNIGHT_NAVY = '#0f172a';
const HELIUM_RED = '#f43f5e';
const ALPHA_BLUE = '#38bdf8';

const ELEMENTS = [
    { symbol: 'C', mass: 12, name: 'Carbon', color: '#fbbf24', radius: 40 },
    { symbol: 'O', mass: 16, name: 'Oxygen', color: '#10b981', radius: 42, poem: ["The very breath that sustains my frame", "Is forged in the heat of your sacred flame."] },
    { symbol: 'Ne', mass: 20, name: 'Neon', color: '#bfdbfe', radius: 44, poem: ["Like neon signs in a midnight street", "My heart glows bright whenever we meet."] },
    { symbol: 'Mg', mass: 24, name: 'Magnesium', color: '#c084fc', radius: 46, poem: ["A brilliance caught in a sudden spark", "You light the path within the dark."] },
    { symbol: 'Si', mass: 28, name: 'Silicon', color: '#fb923c', radius: 48, poem: ["Stone and glass and ancient earth", "From your solid step, the worlds find birth."] },
    { symbol: 'S', mass: 32, name: 'Sulfur', color: '#facc15', radius: 50, poem: ["Yellow dust in the cosmic wind", "Where transformation's soul is pinned."] },
    { symbol: 'Ar', mass: 36, name: 'Argon', color: '#818cf8', radius: 52, poem: ["Silent, noble, drifting free", "A ghost of light in a velvet sea."] },
    { symbol: 'Ca', mass: 40, name: 'Calcium', color: '#fca5a5', radius: 54, poem: ["The bone that builds the strength of life", "Unyielding force through starlit strife."] },
    { symbol: 'Ti', mass: 44, name: 'Titanium', color: '#94a3b8', radius: 56, poem: ["Strength of gods and steel of suns", "Where the river of creation runs."] },
    { symbol: 'Cr', mass: 48, name: 'Chromium', color: '#d1d5db', radius: 58, poem: ["Gleaming silver, polished bright", "Mirroring the stars of night."] },
    { symbol: 'Mn', mass: 52, name: 'Manganese', color: '#64748b', radius: 60, poem: ["The subtle shift, the hidden weight", "Before the door of iron fate."] },
    { symbol: 'Fe', mass: 56, name: 'Iron', color: '#475569', radius: 62, poem: ["The final bond where all currents cease", "In your steady core, I find my peace."] },
];

const GOLD_ELEMENT = { symbol: 'Au', mass: 197, name: 'Gold', color: '#fbbf24', radius: 80, poem: ["Born of a crash where the heavens fold", "A love this rare is paved in gold."] };

// --- UTILS ---
class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    type: 'helium' | 'alpha' | 'isotope';
    radius: number;
    color: string;
    glow: number;
    label: string = '';

    constructor(canvas: HTMLCanvasElement, type: 'helium' | 'alpha' | 'isotope') {
        this.type = type;
        const isMobile = window.innerWidth < 640;
        
        if (isMobile && type === 'helium') {
            // Mobile specific: Helium streams from the top
            this.x = Math.random() * canvas.width;
            this.y = -20;
            this.vx = (Math.random() - 0.5) * 1.5;
            this.vy = Math.random() * 2 + 2;
        } else {
            const side = Math.floor(Math.random() * 4);
            if (side === 0) { this.x = Math.random() * canvas.width; this.y = -20; }
            else if (side === 1) { this.x = canvas.width + 20; this.y = Math.random() * canvas.height; }
            else if (side === 2) { this.x = Math.random() * canvas.width; this.y = canvas.height + 20; }
            else { this.x = -20; this.y = Math.random() * canvas.height; }

            const angle = Math.atan2(canvas.height / 2 - this.y, canvas.width / 2 - this.x) + (Math.random() - 0.5) * 0.5;
            const speed = type === 'helium' ? Math.random() * 2 + 3 : (type === 'alpha' ? Math.random() * 0.5 + 1 : Math.random() * 0.8 + 1.2);
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
        }

        if (type === 'helium') {
            this.radius = 4;
            this.color = HELIUM_RED;
            this.glow = 0;
        } else if (type === 'alpha') {
            this.radius = 12;
            this.color = ALPHA_BLUE;
            this.glow = 15;
        } else {
            this.radius = 15;
            const subType = Math.random();
            if (subType < 0.3) { this.color = '#10b981'; this.label = 'O'; }
            else if (subType < 0.6) { this.color = '#bfdbfe'; this.label = 'Ne'; }
            else { this.color = '#fb923c'; this.label = 'Si'; }
            this.glow = 20;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        if (this.glow > 0) {
            ctx.shadowBlur = this.glow;
            ctx.shadowColor = this.color;
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        if (this.label) {
            ctx.fillStyle = MIDNIGHT_NAVY;
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.label, this.x, this.y);
        }
        ctx.restore();
    }
}

export default function App() {
    const [gameState, setGameState] = useState<'intro' | 'playing' | 'evolving' | 'collapsed' | 'ascended'>('intro');
    const [difficulty, setDifficulty] = useState<'Novice' | 'Commander' | 'Destroyer'>('Commander');
    const [stability, setStability] = useState(100);
    const [elementIndex, setElementIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const [spectralShift, setSpectralShift] = useState(0); // -100 (Blue/Slow) to 100 (Red/Fast)
    const [shieldTime, setShieldTime] = useState(0);
    const [nodes, setNodes] = useState<{ x: number, y: number, order: number, reached: boolean }[]>([]);
    const [nextNodeOrder, setNextNodeOrder] = useState(1);
    const [solarMass, setSolarMass] = useState(0.5);
    const [destiny, setDestiny] = useState<null | 'dwarf' | 'supernova'>(null);

    const [alphasCaptured, setAlphasCaptured] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const frameRef = useRef<number>(0);
    const playerRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
    const lastNodeSpawnRef = useRef<number>(Date.now());
    const currentElement = ELEMENTS[elementIndex];

    const playSound = useCallback((freq: number, type: OscillatorType, duration: number, volume: number) => {
        if (!isMuted) playTone(freq, type, duration, volume);
    }, [isMuted]);

    const spawnNodes = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const newNodes = Array.from({ length: 3 }).map((_, i) => ({
            x: Math.random() * (canvas.width - 200) + 100,
            y: Math.random() * (canvas.height - 200) + 100,
            order: i + 1,
            reached: false
        }));
        setNodes(newNodes);
        setNextNodeOrder(1);
        lastNodeSpawnRef.current = Date.now();
    }, []);

    // Handle Resize
    useEffect(() => {
        const resize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
                if (playerRef.current.x === 0) {
                    playerRef.current.x = window.innerWidth / 2;
                    playerRef.current.y = window.innerHeight / 2;
                }
            }
        };
        window.addEventListener('resize', resize);
        resize();
        return () => window.removeEventListener('resize', resize);
    }, []);

    // Main Game Loop
    useEffect(() => {
        if (gameState !== 'playing') return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        let lastFrameTime = performance.now();
        const loop = (time: number) => {
            const dt = (time - lastFrameTime) / 16; // Normalized to 60fps
            lastFrameTime = time;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Path-based aesthetics
            const isSupernovaPath = solarMass >= 1.4;
            const bgStart = isSupernovaPath ? '#270c12' : '#1e293b';
            const bgEnd = isSupernovaPath ? '#0f0507' : '#0f172a';

            // Draw Background Gradients
            const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width/2);
            grad.addColorStop(0, bgStart);
            grad.addColorStop(1, bgEnd);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Momentum Physics Engine
            const drag = 0.94;
            const massEffect = 1 + (currentElement.radius / 100) + (solarMass - 0.5);
            const spring = 0.05 / massEffect;
            
            const ax = (mousePos.x - playerRef.current.x) * spring;
            const ay = (mousePos.y - playerRef.current.y) * spring;
            
            playerRef.current.vx = (playerRef.current.vx + ax) * drag;
            playerRef.current.vy = (playerRef.current.vy + ay) * drag;
            playerRef.current.x += playerRef.current.vx;
            playerRef.current.y += playerRef.current.vy;

            // Spectral Meter calculation (based on velocity)
            const speed = Math.sqrt(playerRef.current.vx ** 2 + playerRef.current.vy ** 2);
            const targetShift = (speed - 5) * 15; // Centered around speed 5
            setSpectralShift(prev => prev + (Math.max(-100, Math.min(100, targetShift)) - prev) * 0.1);

            // Update Shield
            if (shieldTime > 0) {
                setShieldTime(prev => Math.max(0, prev - 0.016));
            }

            // Draw Convection Nodes
            const pX = playerRef.current.x;
            const pY = playerRef.current.y;
            const pR = currentElement.radius;

            nodes.forEach(node => {
                if (node.reached) return;
                ctx.save();
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.strokeStyle = node.order === nextNodeOrder ? ALPHA_BLUE : 'rgba(255,255,255,0.2)';
                ctx.beginPath();
                ctx.arc(node.x, node.y, 20, 0, Math.PI * 2);
                ctx.stroke();
                
                // Glow
                ctx.shadowBlur = 10;
                ctx.shadowColor = ALPHA_BLUE;
                ctx.fillStyle = node.order === nextNodeOrder ? ALPHA_BLUE : 'rgba(255,255,255,0.1)';
                ctx.beginPath();
                ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
                ctx.fill();
                
                // Order Number
                ctx.font = '10px monospace';
                ctx.fillStyle = 'white';
                ctx.fillText(node.order.toString(), node.x, node.y - 15);
                ctx.restore();

                // Collision with node
                const dNode = Math.sqrt((pX - node.x)**2 + (pY - node.y)**2);
                if (dNode < pR + 20 && node.order === nextNodeOrder) {
                    node.reached = true;
                    setNextNodeOrder(prev => prev + 1);
                    playSound(600 + node.order * 100, 'sine', 0.1, 0.2);
                    
                    if (node.order === 3) {
                        setShieldTime(5); // 5 second shield
                        playSound(1000, 'square', 0.5, 0.4);
                        setNodes([]);
                    }
                }
            });

            // Node Spawning Interval
            if (Date.now() - lastNodeSpawnRef.current > 45000) {
                spawnNodes();
            }

            // Draw Player Neumorphic Pulse
            // Shield visual
            if (shieldTime > 0) {
                ctx.save();
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 3;
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#38bdf8';
                ctx.beginPath();
                ctx.arc(pX, pY, pR + 10, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            ctx.save();
            ctx.shadowBlur = 20;
            ctx.shadowColor = currentElement.color;
            ctx.beginPath();
            ctx.arc(pX, pY, pR, 0, Math.PI * 2);
            ctx.fillStyle = currentElement.color;
            ctx.fill();
            ctx.restore();

            // Spectral tinting on nucleus
            ctx.save();
            ctx.globalCompositeOperation = 'overlay';
            const spectralColor = spectralShift > 0 ? `rgba(255,0,0,${spectralShift/200})` : `rgba(0,0,255,${Math.abs(spectralShift)/200})`;
            ctx.fillStyle = spectralColor;
            ctx.beginPath();
            ctx.arc(pX, pY, pR, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Neumorphic Inner Glow effect
            const innerGrad = ctx.createRadialGradient(pX - pR/3, pY - pR/3, pR/10, pX, pY, pR);
            innerGrad.addColorStop(0, 'rgba(255,255,255,0.4)');
            innerGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = innerGrad;
            ctx.beginPath();
            ctx.arc(pX, pY, pR, 0, Math.PI * 2);
            ctx.fill();

            // Label
            ctx.fillStyle = MIDNIGHT_NAVY;
            ctx.font = 'bold 16px font-sans';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(currentElement.symbol, pX, pY);

            // Helium Spawn
            const difficultyScalar = difficulty === 'Novice' ? 0.6 : (difficulty === 'Destroyer' ? 1.4 : 1.0);
            const heliumChance = (0.008 + (elementIndex * 0.012)) * difficultyScalar;
            if (Math.random() < heliumChance) {
                particlesRef.current.push(new Particle(canvas, 'helium'));
            }

            // Alpha Spawn (Dynamic rarity - gets harder at higher elements)
            const alphaScalar = difficulty === 'Novice' ? 1.2 : (difficulty === 'Destroyer' ? 0.8 : 1.0);
            const baseAlphaChance = (0.012 - (elementIndex * 0.0008)) * alphaScalar;
            const alphaChance = Math.abs(spectralShift) < 20 ? Math.max(0.004, baseAlphaChance) : 0.002;
            if (Math.random() < alphaChance) {
                particlesRef.current.push(new Particle(canvas, 'alpha'));
            }

            // Isotope Spawn (Heavy elements for mass path)
            if (Math.random() < 0.005) {
                particlesRef.current.push(new Particle(canvas, 'isotope'));
            }

            // Update & Draw Particles
            for (let i = particlesRef.current.length - 1; i >= 0; i--) {
                const p = particlesRef.current[i];
                if (!p) continue;
                
                // Gravitational Pull Logic (Helium pulled towards heavy mass)
                if (p.type === 'helium' && solarMass > 1.0) {
                    const dx = pX - p.x;
                    const dy = pY - p.y;
                    const distSq = dx*dx + dy*dy;
                    const pullStrength = (solarMass - 1.0) * 15;
                    if (distSq < 160000) { // Within 400px
                        const force = pullStrength / Math.max(200, Math.sqrt(distSq));
                        p.vx += (dx / Math.sqrt(distSq)) * force * 0.05;
                        p.vy += (dy / Math.sqrt(distSq)) * force * 0.05;
                    }
                }

                // Particle-Particle Separation (Prevent Overlap)
                for (let j = i - 1; j >= 0; j--) {
                    const other = particlesRef.current[j];
                    if (!other) continue;
                    const dx = p.x - other.x;
                    const dy = p.y - other.y;
                    const minDist = p.radius + other.radius + 5;
                    const distSq = dx*dx + dy*dy;
                    if (distSq < minDist*minDist) {
                        const dist = Math.sqrt(distSq) || 1;
                        const force = (minDist - dist) / dist * 0.5;
                        p.vx += dx * force;
                        p.vy += dy * force;
                        other.vx -= dx * force;
                        other.vy -= dy * force;
                    }
                }

                // Magnetic Attraction for Alpha if centered
                if (p.type === 'alpha' && Math.abs(spectralShift) < 20) {
                    const dx = pX - p.x;
                    const dy = pY - p.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist < 400) {
                        p.vx += (dx / dist) * 0.2;
                        p.vy += (dy / dist) * 0.2;
                    }
                }

                p.update();
                p.draw(ctx);

                // Collision Detection
                const dx = p.x - pX;
                const dy = p.y - pY;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if (dist < pR + p.radius) {
                    particlesRef.current.splice(i, 1);
                    if (p.type === 'helium') {
                        if (shieldTime > 0) {
                            playSound(300, 'sine', 0.05, 0.1);
                        } else {
                            setStability(prev => {
                                const next = prev - (5 + elementIndex * 1.0);
                                if (next <= 0) {
                                    setGameState('collapsed');
                                    playSound(100, 'sawtooth', 1, 0.5);
                                    return 0;
                                }
                                playSound(150, 'sine', 0.1, 0.2);
                                return next;
                            });
                        }
                    } else if (p.type === 'isotope') {
                        // Heavy isotope adds mass
                        const massGain = p.label === 'O' ? 0.04 : (p.label === 'Ne' ? 0.06 : 0.08);
                        setSolarMass(prev => Math.min(2.0, prev + massGain));
                        playSound(800, 'sine', 0.1, 0.2);
                        setStability(prev => Math.min(100, prev + 5)); 
                    } else {
                        // Gathered Alpha
                        playSound(440, 'triangle', 0.2, 0.3);
                        setAlphasCaptured(prev => {
                            const next = prev + 1;
                            const required = 4; // Require 4 alphas to evolve
                            if (next >= required) {
                                setGameState('evolving');
                                particlesRef.current = [];
                                setNodes([]);
                                setStability(100); 
                                setSolarMass(prevMass => prevMass + 0.012); 
                                setTimeout(() => {
                                    setElementIndex(pIdx => {
                                        const nIdx = pIdx + 1;
                                        if (nIdx >= ELEMENTS.length - 1) {
                                            if (solarMass >= 1.4) {
                                                setDestiny('supernova');
                                            } else {
                                                setDestiny('dwarf');
                                            }
                                            setGameState('ascended');
                                            playSound(880, 'sine', 2, 0.5);
                                            return pIdx;
                                        }
                                        setGameState('playing');
                                        return nIdx;
                                    });
                                }, 2000);
                                return 0;
                            }
                            return next;
                        });
                    }
                    continue;
                }

                // Remove out of bounds
                if (p.x < -100 || p.x > canvas.width + 100 || p.y < -100 || p.y > canvas.height + 100) {
                    particlesRef.current.splice(i, 1);
                }
            }

            frameRef.current = requestAnimationFrame(loop);
        };

        frameRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameRef.current);
    }, [gameState, mousePos, elementIndex, currentElement, playSound, nodes, nextNodeOrder, shieldTime, spectralShift, spawnNodes, solarMass]);

    const setStageAscended = () => {
        setGameState('ascended');
        playSound(880, 'sine', 2, 0.5);
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (gameState !== 'playing') return;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setMousePos({ x: clientX, y: clientY });
    };

    const resetGame = () => {
        setStability(100);
        setElementIndex(0);
        setSolarMass(0.5);
        setAlphasCaptured(0);
        setDestiny(null);
        setGameState('intro');
        particlesRef.current = [];
    };

    return (
        <div 
            className="relative w-full h-screen overflow-hidden bg-[#0f172a] text-slate-200 font-sans select-none touch-none"
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
        >
            <canvas ref={canvasRef} className="absolute inset-0 z-0" />

            {/* UI Overlay */}
            <div className="absolute top-0 left-0 right-0 p-3 sm:p-6 flex flex-col sm:flex-row justify-between items-center sm:items-start pointer-events-none z-50 gap-4 sm:gap-0 bg-gradient-to-b from-black/60 to-transparent">
                {/* Compact Stats Group */}
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center sm:items-start">
                    <div className="bg-white/5 backdrop-blur-xl px-4 py-2 rounded-lg border border-white/10 w-full sm:w-52 shadow-2xl">
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                                <Activity className="w-3 h-3 text-emerald-400" />
                                <span className="text-[7px] sm:text-[9px] uppercase tracking-widest text-slate-300 font-bold">Stability</span>
                            </div>
                            <span className="text-[9px] font-mono text-emerald-400">{Math.ceil(stability)}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-800/50 rounded-full overflow-hidden">
                            <motion.div 
                                className={`h-full ${stability > 30 ? 'bg-emerald-500' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}
                                animate={{ width: `${stability}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl px-4 py-2 rounded-lg border border-white/10 w-full sm:w-52 shadow-2xl">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Waves className="w-3 h-3 text-blue-400" />
                            <span className="text-[7px] sm:text-[9px] uppercase tracking-widest text-slate-300 font-bold">Sync</span>
                        </div>
                        <div className="relative w-full h-1.5 bg-slate-800/50 rounded-full overflow-hidden flex items-center justify-center">
                            <motion.div 
                                className="absolute w-1 h-full bg-white shadow-[0_0_8px_white] z-10"
                                animate={{ left: `${50 + spectralShift/2}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl px-4 py-2 rounded-lg border border-white/10 w-full sm:w-52 shadow-2xl">
                        <div className="flex items-center justify-between mb-1.5">
                             <div className="flex items-center gap-2">
                                <Scale className="w-3 h-3 text-amber-400" />
                                <span className="text-[7px] sm:text-[9px] uppercase tracking-widest text-slate-300 font-bold">Mass</span>
                             </div>
                             <span className={`text-[9px] font-mono ${solarMass >= 1.4 ? 'text-rose-500' : 'text-amber-400'}`}>{solarMass.toFixed(2)}M☉</span>
                        </div>
                        <div className="relative w-full h-1 bg-slate-800/50 rounded-full overflow-hidden">
                            <motion.div 
                                className={`h-full ${solarMass >= 1.4 ? 'bg-rose-500' : 'bg-amber-400'}`}
                                animate={{ width: `${(solarMass / 2.0) * 100}%` }}
                            />
                            <div className="absolute left-[70%] top-0 bottom-0 w-[1px] bg-white/30" />
                        </div>
                    </div>
                </div>

                {/* Right Side: Shield status */}
                <div className="flex flex-col items-center sm:items-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                    {shieldTime > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-blue-900/50 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-blue-400/30 flex items-center gap-2 sm:gap-3 shadow-2xl"
                        >
                            <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 animate-pulse" />
                            <div className="flex flex-col">
                                <span className="text-[6px] sm:text-[8px] uppercase tracking-[0.2em] text-blue-300 font-bold">Magnetic Shield</span>
                                <div className="w-20 sm:w-24 h-1 bg-blue-900 rounded-full mt-1">
                                    <motion.div 
                                        className="h-full bg-blue-400"
                                        animate={{ width: `${(shieldTime / 5) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Bottom Left: Atomic Data */}
            <div className="absolute bottom-6 left-6 pointer-events-none z-50">
                <div className="bg-white/5 backdrop-blur-xl px-5 py-3 rounded-xl border border-white/10 text-left min-w-[140px] shadow-2xl">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[7px] sm:text-[9px] uppercase tracking-widest text-slate-300 font-bold">Active Nucleus</span>
                        <Zap className="w-3 h-3 text-blue-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-mono text-white leading-none tracking-tighter flex items-center gap-3">
                        {currentElement.symbol}
                        <div className="flex flex-col">
                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{currentElement.name}</span>
                            <span className="text-[8px] text-slate-500">{currentElement.mass} amu</span>
                        </div>
                    </div>
                    
                    {/* Alpha Progress */}
                    <div className="mt-3 pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[7px] text-slate-400 uppercase tracking-widest">Fusion Step</span>
                            <span className="text-[8px] font-mono text-blue-400">{alphasCaptured}/4</span>
                        </div>
                        <div className="flex gap-1.5">
                            {[...Array(4)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`h-1 w-5 rounded-full ${i < alphasCaptured ? 'bg-blue-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'bg-slate-700'}`} 
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stage Overlays */}
            <AnimatePresence mode="wait">
                {gameState === 'intro' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-start bg-[#020617]/98 backdrop-blur-3xl z-[100] p-4 sm:p-8 text-center overflow-y-auto selection:bg-blue-500/30 font-sans"
                    >
                        {/* Cinematic Grain/Noise Overlay */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150" />
                        
                        <div className="flex flex-col items-center max-w-4xl w-full py-8 sm:py-16 relative z-10 shrink-0">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                                className="mb-8 sm:mb-12 pointer-events-none"
                            >
                                <div className="flex items-center justify-center gap-4 mb-4">
                                    <div className="h-[1px] w-6 sm:w-8 bg-blue-500/50" />
                                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 opacity-60" />
                                    <div className="h-[1px] w-6 sm:w-8 bg-blue-500/50" />
                                </div>
                                <h1 className="text-4xl sm:text-7xl lg:text-8xl font-extralight tracking-[0.4em] sm:tracking-[0.5em] text-white leading-tight">STELLAR</h1>
                                <p className="text-[9px] sm:text-[11px] text-blue-400 font-mono tracking-[0.3em] sm:tracking-[0.6em] uppercase mt-4 sm:mt-6 opacity-60">Epoch: Nucleosynthesis / Origin: Void</p>
                            </motion.div>

                            <motion.div 
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    hidden: { opacity: 0 },
                                    visible: {
                                        opacity: 1,
                                        transition: { staggerChildren: 0.3, delayChildren: 0.6 }
                                    }
                                }}
                                className="space-y-16 mb-24 px-4 sm:px-12"
                            >
                                <motion.div 
                                    variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                                    className="max-w-2xl mx-auto border-l border-white/10 pl-6 sm:pl-8 py-2 text-left"
                                >
                                    <p className="text-[10px] sm:text-xs text-blue-300 font-mono tracking-widest uppercase mb-3 opacity-50">Log #001: The Weaver's Paradox</p>
                                    <p className="text-sm sm:text-xl text-slate-200 font-light leading-relaxed italic tracking-wide">
                                        "Before the first sun ignited, there was only the Squall—a cold, infinite gale of Helium-4, threatening to extinguish the spark of creation before it could even drift."
                                    </p>
                                </motion.div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-14 text-center">
                                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="group">
                                        <div className="mb-3 sm:mb-4 flex justify-center">
                                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-blue-500/50 transition-colors">
                                                <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                                            </div>
                                        </div>
                                        <h3 className="text-[9px] sm:text-xs font-bold text-white uppercase tracking-[0.2em] sm:tracking-[0.25em] mb-2 sm:mb-3">The Gathering</h3>
                                        <p className="text-[10px] sm:text-[13px] text-slate-400 leading-relaxed font-light">
                                            Feed the core. Capture the Alpha isotopes to build your weight. Each fusion is a step toward evolution.
                                        </p>
                                    </motion.div>

                                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="group">
                                        <div className="mb-3 sm:mb-4 flex justify-center">
                                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-emerald-500/50 transition-colors">
                                                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-emerald-400/50" />
                                            </div>
                                        </div>
                                        <h3 className="text-[9px] sm:text-xs font-bold text-blue-400 uppercase tracking-[0.2em] sm:tracking-[0.25em] mb-2 sm:mb-3 font-mono">Inertia</h3>
                                        <p className="text-[10px] sm:text-[13px] text-slate-400 leading-relaxed font-light">
                                            As you swell, your center resists the helm. Heavier cores move with the grace of mountains.
                                        </p>
                                    </motion.div>

                                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="group">
                                        <div className="mb-3 sm:mb-4 flex justify-center">
                                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-rose-500/50 transition-colors">
                                                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                                            </div>
                                        </div>
                                        <h3 className="text-[9px] sm:text-xs font-bold text-rose-400 uppercase tracking-[0.2em] sm:tracking-[0.25em] mb-2 sm:mb-3">The Threshold</h3>
                                        <p className="text-[10px] sm:text-[13px] text-slate-400 leading-relaxed font-light">
                                            <span className="text-rose-300 font-mono font-bold">1.4 M☉</span>. The barrier of survival. Cross it to burn in a Supernova flash, or stay beneath to endure.
                                        </p>
                                    </motion.div>
                                </div>

                                <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="pt-10">
                                    <div className="flex items-center justify-center gap-4 max-w-sm mx-auto p-1 bg-white/5 rounded-full border border-white/10">
                                        {(['Novice', 'Commander', 'Destroyer'] as const).map((lvl) => (
                                            <button
                                                key={lvl}
                                                onClick={() => setDifficulty(lvl)}
                                                className={`flex-1 py-2 px-4 rounded-full text-[10px] uppercase tracking-wider transition-all ${difficulty === lvl ? 'bg-white text-black font-bold shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                            >
                                                {lvl}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            </motion.div>

                            <motion.button 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 2.2, duration: 1 }}
                                onClick={() => {
                                    setGameState('playing');
                                    playSound(440, 'sine', 0.2, 0.3);
                                }}
                                className="group relative px-20 py-5 rounded-full bg-white text-black tracking-[0.5em] uppercase text-[10px] sm:text-xs font-bold hover:scale-105 transition-all duration-500 active:scale-95"
                            >
                                <span className="relative z-10 flex items-center gap-3">
                                    Ignite the Void <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </span>
                                <div className="absolute inset-x-0 -bottom-4 h-8 bg-blue-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {gameState === 'evolving' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-start sm:justify-center bg-[#020617]/95 backdrop-blur-xl z-[90] p-6 sm:p-8 text-center overflow-y-auto"
                    >
                        <div className="flex flex-col items-center py-12 sm:py-24 shrink-0">
                            <div className="w-24 sm:w-48 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30 mb-8 sm:mb-12" />
                            <h2 className="text-[8px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.5em] text-blue-400 mb-2 sm:mb-4 font-bold">Synthesis Event</h2>
                            <div className="flex flex-col gap-2 sm:gap-4">
                                {(ELEMENTS[elementIndex + 1]?.poem || ["Evolution complete.", ""]).map((line, idx) => (
                                    <p key={idx} className="text-base sm:text-3xl font-serif italic text-white max-w-2xl leading-relaxed px-4 sm:px-6">
                                        {line}
                                    </p>
                                ))}
                            </div>
                            <div className="w-24 sm:w-48 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30 mt-8 sm:mb-12" />
                        </div>
                    </motion.div>
                )}

                {gameState === 'collapsed' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 flex flex-col items-center justify-start sm:justify-center bg-black/95 backdrop-blur-3xl z-[150] p-6 sm:p-8 text-center overflow-y-auto"
                    >
                        <div className="flex flex-col items-center max-w-sm py-12 sm:py-24 shrink-0">
                            <AlertCircle className="w-16 h-16 sm:w-20 sm:h-20 text-rose-500 mb-6 sm:mb-8 animate-pulse" />
                            <h2 className="text-2xl sm:text-4xl font-bold tracking-tighter text-white mb-4 sm:mb-6 uppercase">Star Collapsed</h2>
                            <p className="text-slate-400 mb-8 sm:mb-12 text-sm sm:text-base">The helium squall was too fierce. Your core has gone dark.</p>
                            <button 
                                onClick={resetGame}
                                className="px-10 py-3 sm:px-12 sm:py-4 rounded-full border border-rose-500 text-rose-500 tracking-widest uppercase text-xs sm:text-sm hover:bg-rose-500/10"
                            >
                                Emerge from Ash
                            </button>
                        </div>
                    </motion.div>
                )}

                {gameState === 'ascended' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`absolute inset-0 flex flex-col items-center justify-start sm:justify-center ${destiny === 'supernova' ? 'bg-[#1a0505]' : 'bg-[#0f172a]'} z-[200] p-6 sm:p-8 text-center overflow-y-auto`}
                    >
                        <div className="flex flex-col items-center py-12 sm:py-24 max-w-2xl shrink-0">
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1, rotate: destiny === 'supernova' ? [0, 5, -5, 0] : 0 }}
                                transition={{ duration: 1, repeat: destiny === 'supernova' ? Infinity : 0 }}
                                className={`w-32 h-32 sm:w-48 sm:h-48 rounded-full ${destiny === 'supernova' ? 'bg-[#fbbf24] shadow-[0_0_120px_rgba(251,191,36,0.8)]' : 'bg-slate-100 shadow-[0_0_100px_rgba(255,255,255,0.4)]'} flex flex-col items-center justify-center mb-8 sm:mb-12`}
                            >
                                {destiny === 'supernova' ? (
                                    <>
                                        <Flame className="w-8 h-8 sm:w-12 sm:h-12 text-slate-900 mb-2" />
                                        <span className="text-3xl sm:text-5xl font-light text-slate-900 leading-none">Au</span>
                                        <span className="text-[8px] sm:text-[10px] text-slate-900 font-bold uppercase tracking-widest mt-1">Gold</span>
                                    </>
                                ) : (
                                    <>
                                        <Gem className="w-8 h-8 sm:w-12 sm:h-12 text-blue-900 mb-2" />
                                        <span className="text-3xl sm:text-5xl font-light text-blue-900 leading-none">C</span>
                                        <span className="text-[8px] sm:text-[10px] text-blue-900 font-bold uppercase tracking-widest mt-1">Diamond</span>
                                    </>
                                )}
                            </motion.div>

                            <h2 className={`text-xl sm:text-4xl font-light tracking-[0.2em] sm:tracking-[0.4em] ${destiny === 'supernova' ? 'text-[#fbbf24]' : 'text-blue-200'} uppercase mb-4`}>
                                {destiny === 'supernova' ? 'Path of Power: Supernova' : 'Path of Peace: White Dwarf'}
                            </h2>

                            <div className="flex flex-col gap-2 mb-8 sm:mb-12">
                                {destiny === 'supernova' ? (
                                    <>
                                        <p className="text-base sm:text-2xl font-serif italic text-rose-300 max-w-xl px-4 sm:px-6">
                                            "In one great flash, the dark is torn,"
                                        </p>
                                        <p className="text-base sm:text-2xl font-serif italic text-rose-300 max-w-xl px-4 sm:px-6">
                                            "So that the rarest gold is born."
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-base sm:text-2xl font-serif italic text-blue-100 max-w-xl px-4 sm:px-6">
                                            "A quiet light that never dies,"
                                        </p>
                                        <p className="text-base sm:text-2xl font-serif italic text-blue-100 max-w-xl px-4 sm:px-6">
                                            "A steady love in sapphire skies."
                                        </p>
                                    </>
                                )}
                            </div>

                            <p className="text-slate-400 mb-8 sm:mb-12 max-w-md text-xs sm:text-sm leading-relaxed px-4">
                                {destiny === 'supernova' 
                                    ? "Your extreme mass triggered a total core collapse. In the cataclysmic rebound, the heaviest elements of the universe were forged."
                                    : "By maintaining a stable, low mass, you shed your outer layers in a beautiful nebula, leaving behind a steady, eternal crystal core."
                                }
                            </p>

                            <button 
                                onClick={resetGame}
                                className={`px-10 py-3 sm:px-12 sm:py-4 rounded-full border ${destiny === 'supernova' ? 'border-[#fbbf24] text-[#fbbf24]' : 'border-blue-300 text-blue-300'} tracking-widest uppercase text-xs sm:text-sm hover:opacity-80 transition-all`}
                            >
                                Begin the cycle anew
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HUD Decorations */}
            <div className="absolute bottom-8 left-8 flex items-center gap-4 text-slate-700 pointer-events-none uppercase text-[10px] tracking-[1em]">
                <Shield className="w-3 h-3" /> Integrity Monitor
            </div>

            <button 
                onClick={() => setIsMuted(!isMuted)}
                className="absolute bottom-8 right-8 p-4 bg-[#0f172a] rounded-full shadow-[5px_5px_10px_#060a12,-5px_-5px_10px_#182442] text-slate-600 hover:text-blue-400 z-[100]"
            >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
        </div>
    );
}
