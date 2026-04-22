/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * THE HEART OF THE MAIN SEQUENCE
 * A poetic astrophysical evolution game.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Zap, Sparkles, Activity, Volume2, VolumeX, AlertCircle, Scale, Gem, Flame, ArrowRight, Pause, Play, HelpCircle, ChevronDown, ChevronUp, BookOpen, Atom, Cpu } from 'lucide-react';

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
    { symbol: 'C', mass: 12, name: 'Carbon', color: '#f59e0b', radius: 32 },
    { symbol: 'O', mass: 16, name: 'Oxygen', color: '#38bdf8', radius: 34, poem: ["The very breath that sustains my frame", "Is forged in the heat of your sacred flame."] },
    { symbol: 'Ne', mass: 20, name: 'Neon', color: '#ff4d00', radius: 36, poem: ["Like neon signs in a midnight street", "My heart glows bright whenever we meet."] },
    { symbol: 'Mg', mass: 24, name: 'Magnesium', color: '#ffffff', radius: 38, poem: ["A brilliance caught in a sudden spark", "You light the path within the dark."] },
    { symbol: 'Si', mass: 28, name: 'Silicon', color: '#475569', radius: 40, poem: ["Stone and glass and ancient earth", "From your solid step, the worlds find birth."] },
    { symbol: 'S', mass: 32, name: 'Sulfur', color: '#fbbf24', radius: 41, poem: ["Yellow dust in the cosmic wind", "Where transformation's soul is pinned."] },
    { symbol: 'Ar', mass: 36, name: 'Argon', color: '#a855f7', radius: 42, poem: ["Silent, noble, drifting free", "A ghost of light in a velvet sea."] },
    { symbol: 'Ca', mass: 40, name: 'Calcium', color: '#f97316', radius: 43, poem: ["The bone that builds the strength of life", "Unyielding force through starlit strife."] },
    { symbol: 'Ti', mass: 44, name: 'Titanium', color: '#cbd5e1', radius: 44, poem: ["Strength of gods and steel of suns", "Where the river of creation runs."] },
    { symbol: 'Cr', mass: 48, name: 'Chromium', color: '#94a3b8', radius: 45, poem: ["Gleaming silver, polished bright", "Mirroring the stars of night."] },
    { symbol: 'Mn', mass: 52, name: 'Manganese', color: '#64748b', radius: 46, poem: ["The subtle shift, the hidden weight", "Before the door of iron fate."] },
    { symbol: 'Fe', mass: 56, name: 'Iron', color: '#b91c1c', radius: 47, poem: ["The final bond where all currents cease", "In your steady core, I find my peace."] },
];

const GOLD_ELEMENT = { symbol: 'Au', mass: 197, name: 'Gold', color: '#fbbf24', radius: 80, poem: ["Born of a crash where the heavens fold", "A love this rare is paved in gold."] };

// --- UTILS ---
class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    type: 'helium' | 'alpha' | 'isotope' | 'shield';
    radius: number;
    color: string;
    glow: number;
    label: string = '';

    constructor(canvas: HTMLCanvasElement, type: 'helium' | 'alpha' | 'isotope' | 'shield', currentElementIdx: number, difficulty: 'Nebula' | 'Stellar' | 'Quasar') {
        this.type = type;
        const isMobile = window.innerWidth < 640;
        const diffMultiplier = difficulty === 'Nebula' ? 0.7 : (difficulty === 'Quasar' ? 1.3 : 1.0);
        
        if (isMobile && type === 'helium') {
            // Mobile specific: Helium streams from the top
            this.x = Math.random() * canvas.width;
            this.y = -20;
            this.vx = (Math.random() - 0.5) * 1.5;
            this.vy = (Math.random() * 2 + 1.5) * diffMultiplier;
        } else {
            const side = Math.floor(Math.random() * 4);
            if (side === 0) { this.x = Math.random() * canvas.width; this.y = -20; }
            else if (side === 1) { this.x = canvas.width + 20; this.y = Math.random() * canvas.height; }
            else if (side === 2) { this.x = Math.random() * canvas.width; this.y = canvas.height + 20; }
            else { this.x = -20; this.y = Math.random() * canvas.height; }

            const angle = Math.atan2(canvas.height / 2 - this.y, canvas.width / 2 - this.x) + (Math.random() - 0.5) * 0.5;
            const baseSpeed = type === 'helium' ? Math.random() * 2 + 2.5 : (type === 'alpha' ? Math.random() * 0.5 + 0.8 : (type === 'shield' ? 1.2 : Math.random() * 0.8 + 1.0));
            const speed = baseSpeed * diffMultiplier;
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
        } else if (type === 'shield') {
            this.radius = 14;
            this.color = '#38bdf8';
            this.label = '◈';
            this.glow = 25;
        } else {
            this.radius = 15;
            // For gaining mass, only use unlocked elements (current and previous)
            const availableIndices = Array.from({ length: currentElementIdx + 1 }, (_, i) => i);
            
            // During Neutron pulse, prioritize heavy elements for mass gain
            let targetIdx;
            if (currentElementIdx >= ELEMENTS.length - 1 && Math.random() > 0.3) {
                // 70% chance to be the heaviest available element (Iron) during endgame
                targetIdx = currentElementIdx;
            } else {
                targetIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
            }
            
            const element = ELEMENTS[targetIdx];
            
            this.color = element.color;
            this.label = element.symbol;
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
    const [gameState, setGameState] = useState<'intro' | 'playing' | 'evolving' | 'collapsed' | 'ascended' | 'neutron'>('intro');
    const [difficulty, setDifficulty] = useState<'Nebula' | 'Stellar' | 'Quasar'>('Stellar');
    const [stability, setStability] = useState(100);
    const [elementIndex, setElementIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const [showHelp, setShowHelp] = useState(false);
    const [showNerdScience, setShowNerdScience] = useState(false);

    const [spectralShift, setSpectralShift] = useState(0); // -100 (Blue/Slow) to 100 (Red/Fast)
    const [shieldTime, setShieldTime] = useState(0);
    const [nodes, setNodes] = useState<{ x: number, y: number, order: number, reached: boolean }[]>([]);
    const [nextNodeOrder, setNextNodeOrder] = useState(1);
    const [solarMass, setSolarMass] = useState(0.5);
    const [destiny, setDestiny] = useState<null | 'dwarf' | 'supernova'>(null);

    const [alphasCaptured, setAlphasCaptured] = useState(0);
    const [neutronTimeLeft, setNeutronTimeLeft] = useState(0);
    const [flareWarning, setFlareWarning] = useState(0); // 0 to 1
    const [flareActive, setFlareActive] = useState(0); // 0 to 1
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const trailRef = useRef<{x: number, y: number, size: number}[]>([]);
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

    // Neutron Pulse Countdown
    useEffect(() => {
        let interval: any;
        if (gameState === 'neutron' && neutronTimeLeft > 0 && !isPaused) {
            interval = setInterval(() => {
                setNeutronTimeLeft(prev => {
                    const next = Math.max(0, prev - 0.1);
                    if (next <= 0) {
                        setGameState('ascended');
                        // Calculate final destiny after pulse
                        setSolarMass(finalMass => {
                            if (finalMass >= 1.4) {
                                setDestiny('supernova');
                            } else {
                                setDestiny('dwarf');
                            }
                            return finalMass;
                        });
                        playSound(880, 'sine', 2, 0.5);
                    }
                    return next;
                });
            }, 100);
        }
        return () => clearInterval(interval);
    }, [gameState, neutronTimeLeft, isPaused, playSound]);

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
        if ((gameState !== 'playing' && gameState !== 'neutron') || isPaused) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        let lastFrameTime = performance.now();
        const loop = (time: number) => {
            const dt = (time - lastFrameTime) / 16; // Normalized to 60fps
            lastFrameTime = time;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Background aesthetically adapts to difficulty
            const isSupernovaPath = solarMass >= 1.4;
            const difficultyBgTint = difficulty === 'Nebula' ? '#0f172a' : (difficulty === 'Quasar' ? '#0a0a0a' : '#1e293b');
            const bgStart = isSupernovaPath ? '#270c12' : difficultyBgTint;
            const bgEnd = isSupernovaPath ? '#0f0507' : '#0f172a';

            // Draw Background Gradients
            const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width/2);
            grad.addColorStop(0, bgStart);
            grad.addColorStop(1, bgEnd);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Momentum Physics Engine
            const drag = 0.94;
            const sizeMultiplier = difficulty === 'Nebula' ? 0.8 : (difficulty === 'Quasar' ? 1.15 : 1.0);
            const massEffect = 1 + ((currentElement.radius * sizeMultiplier) / 100) + (solarMass - 0.5);
            const spring = 0.05 / massEffect;
            
            const ax = (mousePos.x - playerRef.current.x) * spring;
            const ay = (mousePos.y - playerRef.current.y) * spring;
            
            playerRef.current.vx = (playerRef.current.vx + ax) * drag;
            playerRef.current.vy = (playerRef.current.vy + ay) * drag;
            playerRef.current.x += playerRef.current.vx;
            playerRef.current.y += playerRef.current.vy;

            // Draw Trail
            const pR = currentElement.radius * sizeMultiplier;
            trailRef.current.push({ x: playerRef.current.x, y: playerRef.current.y, size: pR });
            if (trailRef.current.length > 15) trailRef.current.shift();

            trailRef.current.forEach((pos, i) => {
                const ratio = i / trailRef.current.length;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, pR * ratio * 0.8, 0, Math.PI * 2);
                ctx.fillStyle = `${currentElement.color}${Math.floor(ratio * 40).toString(16).padStart(2, '0')}`;
                ctx.fill();
            });

            // Spectral Meter calculation (based on velocity)
            const speed = Math.sqrt(playerRef.current.vx ** 2 + playerRef.current.vy ** 2);
            const targetShift = (speed - 5) * 15; // Centered around speed 5
            setSpectralShift(prev => prev + (Math.max(-100, Math.min(100, targetShift)) - prev) * 0.1);

            // Update Shield & Healing & Flares
            if (shieldTime > 0) {
                setShieldTime(prev => Math.max(0, prev - 0.016));
            }

            // Auto-healing logic
            const healingRate = difficulty === 'Nebula' ? 0.04 : (difficulty === 'Stellar' ? 0.02 : 0.005);
            setStability(prev => Math.min(100, prev + healingRate));

            // Solar Flare Logic
            if (flareWarning > 0) {
                setFlareWarning(prev => prev - 1);
                if (flareWarning === 1) {
                    setFlareActive(400); // Activate for 400 frames
                    playSound(200, 'sawtooth', 1, 0.3);
                }
            } else if (flareActive > 0) {
                setFlareActive(prev => prev - 1);
            } else {
                const flareChance = difficulty === 'Nebula' ? 0.0001 : (difficulty === 'Stellar' ? 0.0003 : 0.0008);
                if (Math.random() < flareChance) {
                    setFlareWarning(200); // 200 frame warning
                    spawnNodes(); // Defensive sequence spawn
                    playSound(300, 'sine', 0.5, 0.2);
                }
            }

            // Draw Convection Nodes
            const pX = playerRef.current.x;
            const pY = playerRef.current.y;
            // pR is already declared above for the trail

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
                        setShieldTime(8); // 8 second shield (matches powerup)
                        playSound(1000, 'square', 0.5, 0.4);
                        setNodes([]);
                    }
                }
            });

            // Node Spawning Interval (Now linked to Solar Flares primarily)
            // We keep a fallback long-timer for practice
            const spawnInterval = gameState === 'neutron' ? 5000 : 60000;
            if (Date.now() - lastNodeSpawnRef.current > spawnInterval && flareWarning === 0 && flareActive === 0) {
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
            const areaScalar = (canvas.width * canvas.height) / (1920 * 1080);
            const difficultyScalar = difficulty === 'Nebula' ? 0.4 : (difficulty === 'Quasar' ? 1.6 : 1.0);
            const flareMultiplier = flareActive > 0 ? 2.5 : 1.0;
            const heliumChance = (0.008 + (elementIndex * 0.012)) * difficultyScalar * flareMultiplier * Math.max(0.5, areaScalar);
            if (gameState === 'playing' && Math.random() < heliumChance) {
                particlesRef.current.push(new Particle(canvas, 'helium', elementIndex, difficulty));
            }

            // Alpha Spawn
            const alphaScalar = difficulty === 'Nebula' ? 1.6 : (difficulty === 'Quasar' ? 0.7 : 1.0);
            const baseAlphaChance = (0.012 - (elementIndex * 0.0008)) * alphaScalar;
            const alphaChance = Math.abs(spectralShift) < 20 ? Math.max(0.004, baseAlphaChance) : 0.002;
            if (gameState === 'playing' && Math.random() < alphaChance) {
                particlesRef.current.push(new Particle(canvas, 'alpha', elementIndex, difficulty));
            }

            // Isotope & Shield Powerup Spawn
            const powerupChance = difficulty === 'Nebula' ? 0.012 : (difficulty === 'Quasar' ? 0.003 : 0.005);
            const shieldPowerupChance = difficulty === 'Nebula' ? 0.004 : (difficulty === 'Quasar' ? 0.0008 : 0.0015);
            
            if ((gameState === 'playing' || gameState === 'neutron') && Math.random() < (gameState === 'neutron' ? 0.15 : powerupChance)) {
                particlesRef.current.push(new Particle(canvas, 'isotope', gameState === 'neutron' ? ELEMENTS.length - 1 : elementIndex, difficulty));
            }
            if (gameState === 'playing' && Math.random() < shieldPowerupChance) {
                particlesRef.current.push(new Particle(canvas, 'shield', elementIndex, difficulty));
            }

            // Update & Draw Particles
            for (let i = particlesRef.current.length - 1; i >= 0; i--) {
                const p = particlesRef.current[i];
                if (!p) continue;
                
                // Neutron Mode Velocity Boost
                if (gameState === 'neutron') {
                    p.vx *= 1.001; 
                    p.vy *= 1.001;
                }
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
                        // Heavy isotope adds mass based on its position in hierarchy - Progressive Mass Gain
                        const elIdx = ELEMENTS.findIndex(e => e.symbol === p.label);
                        const massGain = 0.003 + (Math.pow(elIdx, 1.6) * 0.0008);
                        setSolarMass(prev => Math.min(2.0, prev + massGain));
                        playSound(800, 'sine', 0.1, 0.2);
                        setStability(prev => Math.min(100, prev + 5)); 
                    } else if (p.type === 'shield') {
                        // Magnetic Shield Powerup
                        setShieldTime(8);
                        playSound(1200, 'sine', 0.3, 0.4);
                        setStability(prev => Math.min(100, prev + 10));
                    } else {
                        // Gathered Alpha
                        playSound(440, 'triangle', 0.2, 0.3);
                        if (gameState === 'neutron') {
                            setStability(prev => Math.min(100, prev + 2));
                        } else {
                            setAlphasCaptured(prev => {
                                const next = prev + 1;
                                const required = 4; // Require 4 alphas to evolve
                                 if (next >= required) {
                                    const isFinalEvolution = elementIndex >= ELEMENTS.length - 1;
                                    
                                    if (isFinalEvolution) {
                                        // Skip the long 'evolving' state for the final transition to Neutron Pulse
                                        setGameState('neutron');
                                        setStability(100);
                                        setAlphasCaptured(0);
                                        setNeutronTimeLeft(20);
                                        setNodes([]);
                                        
                                        // Spawn intensive field of mass particles immediately
                                        const newParticles: Particle[] = [];
                                        for(let k=0; k<100; k++) {
                                            const np = new Particle(canvas, 'isotope', ELEMENTS.length-1, difficulty);
                                            np.x = Math.random() * canvas.width;
                                            np.y = Math.random() * canvas.height;
                                            np.vx = (Math.random() - 0.5) * 2;
                                            np.vy = (Math.random() - 0.5) * 2;
                                            newParticles.push(np);
                                        }
                                        particlesRef.current = newParticles;
                                        playSound(1200, 'square', 0.5, 0.4);
                                        return 0;
                                    }

                                    setGameState('evolving');
                                    particlesRef.current = [];
                                    setNodes([]);
                                    setStability(100); 
                                    // Progressive evolution mass bump - Tuned for difficulty
                                    setSolarMass(prevMass => prevMass + (0.001 * Math.pow(1.1, elementIndex))); 
                                    setTimeout(() => {
                                        setElementIndex(pIdx => {
                                            const nIdx = pIdx + 1;
                                            if (nIdx >= ELEMENTS.length) {
                                                // This block is now handled by the immediate transition above, 
                                                // but keeping safety for the callback
                                                return pIdx;
                                            }
                                            setGameState('playing');
                                            return nIdx;
                                        });
                                    }, 6000); 
                                    return 0;
                                }
                                return next;
                            });
                        }
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
    }, [gameState, mousePos, elementIndex, currentElement, playSound, nodes, nextNodeOrder, shieldTime, spectralShift, spawnNodes, solarMass, difficulty, flareActive, flareWarning, isPaused]);

    const setStageAscended = () => {
        setGameState('ascended');
        playSound(880, 'sine', 2, 0.5);
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (gameState !== 'playing' && gameState !== 'neutron') return;
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
            className="relative w-full h-[100dvh] overflow-hidden bg-[#0f172a] text-slate-200 font-sans select-none touch-none"
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
        >
            {/* Chromatic Aberration Overlay for Spectral Shift */}
            <div 
                className="absolute inset-0 pointer-events-none z-[190] opacity-50"
                style={{
                    boxShadow: Math.abs(spectralShift) > 20 
                        ? `inset 0 0 ${Math.abs(spectralShift)}px ${spectralShift > 0 ? 'rgba(255,0,0,0.4)' : 'rgba(0,0,255,0.4)'}`
                        : 'none',
                    filter: `contrast(${100 + Math.abs(spectralShift)/2}%)`
                }}
            />
            
            {/* Subtle Peripheral Grain for Shift Feedback */}
            <AnimatePresence>
                {Math.abs(spectralShift) > 50 && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.2, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1, repeat: Infinity }}
                        className={`absolute inset-0 z-[191] pointer-events-none bg-gradient-to-r ${spectralShift > 0 ? 'from-red-500/10 via-transparent to-red-500/10' : 'from-blue-500/10 via-transparent to-blue-500/10'}`}
                    />
                )}
            </AnimatePresence>

            <canvas ref={canvasRef} className="absolute inset-0 z-0" />

            {/* UI Overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 pt-[env(safe-area-inset-top,1rem)] flex flex-col sm:flex-row justify-between items-center sm:items-start pointer-events-none z-50 gap-4 sm:gap-0 bg-gradient-to-b from-black/60 to-transparent">
                {/* Compact Stats Group */}
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center sm:items-start">
                    <div className="bg-white/5 backdrop-blur-xl px-4 py-2 rounded-lg border border-white/10 w-full sm:w-52 shadow-2xl shrink-0">
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                                <Activity className="w-3 h-3 text-emerald-400" />
                                <span className="text-[7px] sm:text-[9px] uppercase tracking-widest text-slate-300 font-bold">Stability</span>
                            </div>
                            <span className="text-[9px] font-mono text-emerald-400">{Math.ceil(stability)}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-800/50 rounded-full overflow-hidden relative">
                            <motion.div 
                                className={`absolute left-0 top-0 bottom-0 ${stability > 30 ? 'bg-emerald-500' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}
                                animate={{ width: `${stability}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl px-4 py-2 rounded-lg border border-white/10 w-full sm:w-52 shadow-2xl shrink-0">
                        <div className="flex items-center justify-between mb-1.5">
                             <div className="flex items-center gap-2">
                                <Scale className="w-3 h-3 text-amber-400" />
                                <span className="text-[7px] sm:text-[9px] uppercase tracking-widest text-slate-300 font-bold">
                                    {gameState === 'neutron' ? 'Density' : 'Mass'}
                                </span>
                             </div>
                             <span className={`text-[9px] font-mono ${solarMass >= 1.4 ? 'text-rose-500' : 'text-amber-400'}`}>
                                {solarMass.toFixed(2)} M☉
                             </span>
                        </div>
                        <div className="w-full h-1 bg-slate-800/50 rounded-full overflow-hidden relative">
                            <motion.div 
                                className={`absolute left-0 top-0 bottom-0 ${solarMass >= 1.4 ? 'bg-rose-500' : 'bg-amber-400'}`}
                                animate={{ width: `${(solarMass / 2.0) * 100}%` }}
                            />
                            {gameState !== 'neutron' && <div className="absolute left-[70%] top-0 bottom-0 w-[1px] bg-white/30" />}
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
                                <div className="w-20 sm:w-24 h-1 bg-blue-900 rounded-full mt-1 relative overflow-hidden">
                                    <motion.div 
                                        className="absolute left-0 top-0 bottom-0 bg-blue-400"
                                        animate={{ width: `${(shieldTime / 8) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Bottom Left: Atomic Data Area */}
            <div className={`absolute bottom-6 sm:bottom-8 left-6 sm:left-8 pb-[env(safe-area-inset-bottom,0px)] pointer-events-none z-50 ${gameState === 'playing' ? 'md:hidden' : ''}`}>
                <div className="bg-white/5 backdrop-blur-xl px-5 py-3 rounded-xl border border-white/10 text-left min-w-[140px] shadow-2xl pointer-events-auto">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[7px] sm:text-[9px] uppercase tracking-widest text-slate-300 font-bold">
                            {gameState === 'neutron' ? 'Pulsar State' : 'Active Nucleus'}
                        </span>
                        <Zap className="w-3 h-3 text-blue-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-mono text-white leading-none tracking-tighter flex items-center gap-3">
                        {currentElement.symbol}
                        <div className="flex flex-col">
                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                                {gameState === 'neutron' ? 'Critical Core' : currentElement.name}
                            </span>
                            <span className="text-[8px] text-slate-500">
                                {gameState === 'neutron' ? "FINAL COLLAPSE" : `${currentElement.mass} amu`}
                            </span>
                        </div>
                    </div>
                    
                    {/* Alpha Progress / Pulsar Beat */}
                    <div className="mt-3 pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[7px] text-slate-400 uppercase tracking-widest">
                                {gameState === 'neutron' ? 'Subatomic Flux' : 'Fusion Step'}
                            </span>
                            <span className="text-[8px] font-mono text-blue-400">
                                {gameState === 'neutron' ? `${(stability / 10).toFixed(1)}%` : `${alphasCaptured}/4`}
                            </span>
                        </div>
                        <div className="flex gap-1.5">
                            {gameState === 'neutron' ? (
                                <motion.div 
                                    animate={{ opacity: [1, 0.4, 1] }} 
                                    transition={{ duration: 0.1, repeat: Infinity }}
                                    className="h-1 w-full rounded-full bg-blue-400 shadow-[0_0_15px_rgba(56,189,248,0.8)]"
                                />
                            ) : (
                                [...Array(4)].map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`h-1 w-5 rounded-full ${i < alphasCaptured ? 'bg-blue-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'bg-slate-700'}`} 
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Element Progression Panel */}
            {gameState === 'playing' && (
                <div className="absolute bottom-6 sm:bottom-8 left-6 right-56 pb-[env(safe-area-inset-bottom,0px)] hidden md:flex items-center gap-4 p-3 pr-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 z-50 overflow-x-auto shadow-2xl no-scrollbar">
                    <div className="flex flex-col items-center border-r border-white/10 pr-4 mr-2 shrink-0">
                        <span className="text-[7px] uppercase tracking-[0.2em] text-blue-400 font-bold mb-1">Active</span>
                        <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-900 font-black font-mono">
                                {currentElement.symbol}
                             </div>
                             <div className="flex flex-col text-left">
                                <span className="text-[10px] text-white font-bold tracking-wider">{currentElement.name}</span>
                                <span className="text-[8px] text-slate-400">{currentElement.mass} amu</span>
                             </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-nowrap sm:flex-wrap justify-start">
                        {ELEMENTS.map((el, idx) => {
                            const isNext = idx === elementIndex + 1;
                            const isPast = idx < elementIndex;
                            const isCurrent = idx === elementIndex;
                            
                            return (
                                <div 
                                    key={idx}
                                    className={`relative flex flex-col items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg border transition-all ${
                                        isCurrent 
                                        ? 'bg-blue-500 border-blue-400 scale-105 shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                                        : isPast 
                                        ? 'border-white/40 bg-white/20' 
                                        : isNext
                                        ? 'border-white/10 bg-white/5'
                                        : 'border-white/5 bg-transparent opacity-20 grayscale'
                                    }`}
                                >
                                    {isNext && (
                                        <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
                                            <motion.div 
                                                className="absolute bottom-0 left-0 right-0 bg-blue-400/30"
                                                animate={{ height: `${(alphasCaptured / 4) * 100}%` }}
                                            />
                                        </div>
                                    )}
                                    <span className={`text-[10px] sm:text-xs font-mono font-black ${isCurrent ? 'text-white' : 'text-slate-200'}`}>
                                        {el.symbol}
                                    </span>
                                    {isNext && (
                                        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_5px_#38bdf8] animate-pulse" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Flare Warning */}
            <AnimatePresence>
                {flareWarning > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="fixed top-24 left-1/2 -translate-x-1/2 bg-rose-950/80 backdrop-blur-xl px-6 py-3 rounded-full border border-rose-500/50 flex items-center gap-3 shadow-2xl z-[60]"
                    >
                        <Flame className="w-5 h-5 text-rose-500 animate-bounce" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-rose-300 uppercase tracking-[0.2em]">Solar Flare Imminent</span>
                            <div className="w-32 h-1 bg-rose-900 rounded-full mt-1 overflow-hidden">
                                <motion.div 
                                    className="h-full bg-rose-500"
                                    animate={{ width: `${(flareWarning / 200) * 100}%` }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Flare Active Effect */}
            <AnimatePresence>
                {flareActive > 0 && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.15 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-rose-500 pointer-events-none z-[40]"
                    />
                )}
            </AnimatePresence>

            {/* Stage Overlays */}
            <AnimatePresence mode="wait">
                {gameState === 'intro' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-start bg-[#020617]/98 backdrop-blur-3xl z-[100] p-4 sm:p-8 pt-[env(safe-area-inset-top,2rem)] pb-[env(safe-area-inset-bottom,2rem)] text-center overflow-y-auto selection:bg-blue-500/30 font-sans"
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
                                    <div className="flex flex-col gap-4">
                                        <p className="text-[10px] text-blue-400 font-mono tracking-widest uppercase opacity-60">Select Stellar Genesis</p>
                                        <div className="flex items-center justify-center gap-4 max-w-sm mx-auto p-1 bg-white/5 rounded-full border border-white/10">
                                            {(['Nebula', 'Stellar', 'Quasar'] as const).map((lvl) => (
                                                <button
                                                    key={lvl}
                                                    onClick={() => setDifficulty(lvl)}
                                                    className={`flex-1 py-1.5 px-4 rounded-full text-[9px] uppercase tracking-widest transition-all ${difficulty === lvl ? 'bg-white text-black font-bold shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                                >
                                                    {lvl}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-8 mt-2">
                                            <p className={`text-[8px] uppercase tracking-widest transition-opacity ${difficulty === 'Nebula' ? 'opacity-100 text-emerald-400' : 'opacity-0 h-0 sm:h-auto overflow-hidden'}`}>Gentle drift. Stable core.</p>
                                            <p className={`text-[8px] uppercase tracking-widest transition-opacity ${difficulty === 'Stellar' ? 'opacity-100 text-blue-400' : 'opacity-0 h-0 sm:h-auto overflow-hidden'}`}>Rhythmic bursts. Solar flares.</p>
                                            <p className={`text-[8px] uppercase tracking-widest transition-opacity ${difficulty === 'Quasar' ? 'opacity-100 text-rose-500' : 'opacity-0 h-0 sm:h-auto overflow-hidden'}`}>Extreme density. Void storms.</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>

                            <motion.button 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 2.2, duration: 1 }}
                                onClick={() => {
                                    setGameState('playing');
                                    playSound(440, 'sine', 0.2, 0.3);
                                }}
                                className="absolute bottom-6 sm:bottom-8 left-6 sm:left-8 right-56 pb-[env(safe-area-inset-bottom,0px)] group hidden md:flex items-center justify-between p-3 pr-8 bg-white text-black rounded-2xl z-[110] hover:scale-[1.01] transition-all shadow-2xl active:scale-95"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shadow-lg">
                                        <Zap className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[10px] font-bold tracking-[0.4em] uppercase">Ignite the Void</span>
                                        <span className="text-[8px] opacity-40 uppercase tracking-widest font-mono">Stellar Genesis Sequence</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-mono tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">READY</span>
                                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                </div>
                            </motion.button>

                            {/* Mobile Fallback Button */}
                            <motion.button 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 2.2, duration: 1 }}
                                onClick={() => {
                                    setGameState('playing');
                                    playSound(440, 'sine', 0.2, 0.3);
                                }}
                                className="md:hidden group relative px-12 py-3.5 rounded-full bg-white text-black tracking-[0.5em] uppercase text-[9px] font-bold hover:scale-105 transition-all duration-500 active:scale-95 mb-12"
                            >
                                Ignite the Void
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {gameState === 'evolving' && (() => {
                    const nextElement = ELEMENTS[elementIndex + 1] || currentElement;
                    return (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-start sm:justify-center bg-[#020617]/95 backdrop-blur-xl z-[90] p-6 sm:p-8 text-center overflow-y-auto"
                        >
                            {/* Flame Embers Animation */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                {[...Array(30)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ 
                                            x: Math.random() * 100 + "%", 
                                            y: "110%",
                                            opacity: 0,
                                            scale: Math.random() * 0.5 + 0.5
                                        }}
                                        animate={{ 
                                            y: "-10%",
                                            x: [
                                                (Math.random() * 100) + "%",
                                                (Math.random() * 100 + (Math.random() - 0.5) * 20) + "%"
                                            ],
                                            opacity: [0, 0.8, 0],
                                            rotate: Math.random() * 360
                                        }}
                                        transition={{ 
                                            duration: 4 + Math.random() * 6,
                                            repeat: Infinity,
                                            delay: Math.random() * 5,
                                            ease: "linear"
                                        }}
                                        className="absolute w-1.5 h-1.5 rounded-full blur-[1px]"
                                        style={{ 
                                            backgroundColor: nextElement.color,
                                            boxShadow: `0 0 12px ${nextElement.color}, 0 0 24px ${nextElement.color}`
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Elemental Background Tinge */}
                            <div 
                                className="absolute inset-0 pointer-events-none opacity-20"
                                style={{ 
                                    background: `radial-gradient(circle at center, ${nextElement.color}44 0%, transparent 70%)` 
                                }}
                            />
                            <div 
                                className="absolute bottom-0 inset-x-0 h-64 pointer-events-none opacity-30"
                                style={{ 
                                    background: `linear-gradient(to top, ${nextElement.color}22 0%, transparent 100%)` 
                                }}
                            />

                            <div className="flex flex-col items-center py-12 sm:py-24 shrink-0 relative z-10">
                                <motion.div 
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="mb-6 flex flex-col items-center"
                                >
                                    <div 
                                        className="text-5xl sm:text-7xl font-mono text-white font-black mb-2 px-6 py-2 border-b-2 shadow-2xl"
                                        style={{ borderBottomColor: nextElement.color, boxShadow: `0 15px 30px -15px ${nextElement.color}99` }}
                                    >
                                        {nextElement.symbol}
                                    </div>
                                    <div className="text-xl sm:text-2xl font-mono tracking-[0.3em] uppercase" style={{ color: nextElement.color }}>
                                        {nextElement.name}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-2">
                                        Atomic Mass: {nextElement.mass} amu
                                    </div>
                                    {ELEMENTS[elementIndex + 2] && (
                                        <div 
                                            className="mt-6 px-4 py-2 rounded-full border backdrop-blur-sm transition-all"
                                            style={{ 
                                                backgroundColor: `${ELEMENTS[elementIndex + 2].color}11`, 
                                                borderColor: `${ELEMENTS[elementIndex + 2].color}33` 
                                            }}
                                        >
                                            <span 
                                                className="text-[10px] font-mono tracking-widest uppercase opacity-80"
                                                style={{ color: ELEMENTS[elementIndex + 2].color }}
                                            >
                                                Upcoming Transition: {ELEMENTS[elementIndex + 2].name} ({ELEMENTS[elementIndex + 2].symbol})
                                            </span>
                                        </div>
                                    )}
                                </motion.div>

                                <div className="w-24 sm:w-48 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8 sm:mb-12" />
                                <h2 className="text-[8px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.5em] text-white/40 mb-6 font-bold font-mono">Successive Synthesis Complete</h2>
                                <div className="flex flex-col gap-2 sm:gap-4">
                                {(ELEMENTS[elementIndex + 1]?.poem || ["The evolution continues...", ""]).map((line, idx) => (
                                    <motion.p 
                                        key={idx} 
                                        initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                        transition={{ delay: 0.5 + idx * 0.8, duration: 1.5, ease: "easeOut" }}
                                        className="text-base sm:text-3xl font-serif italic text-white max-w-2xl leading-relaxed px-4 sm:px-6"
                                    >
                                        {line}
                                    </motion.p>
                                ))}
                                </div>
                                <div className="w-24 sm:w-48 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30 mt-8 sm:mb-12" />
                            </div>
                        </motion.div>
                    );
                })()}

                {gameState === 'collapsed' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 flex flex-col items-center justify-start sm:justify-center bg-black/95 backdrop-blur-3xl z-[150] p-6 sm:p-8 pt-[env(safe-area-inset-top,2rem)] pb-[env(safe-area-inset-bottom,2rem)] text-center overflow-y-auto"
                    >
                        <div className="flex flex-col items-center max-w-sm py-12 sm:py-24 shrink-0">
                            <AlertCircle className="w-16 h-16 sm:w-20 sm:h-20 text-rose-500 mb-6 sm:mb-8 animate-pulse" />
                            <h2 className="text-2xl sm:text-4xl font-bold tracking-tighter text-white mb-4 sm:mb-6 uppercase">Star Collapsed</h2>
                            <p className="text-slate-400 mb-8 sm:mb-12 text-sm sm:text-base">The helium squall was too fierce. Your core has gone dark.</p>
                            <button 
                                onClick={resetGame}
                                className="px-8 py-2.5 sm:px-10 sm:py-3 rounded-full border border-rose-500 text-rose-500 tracking-widest uppercase text-[10px] sm:text-xs hover:bg-rose-500/10"
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
                        className={`absolute inset-0 flex flex-col items-center justify-start sm:justify-center ${destiny === 'supernova' ? 'bg-[#1a0505]' : 'bg-[#0f172a]'} z-[200] p-6 sm:p-8 pt-[env(safe-area-inset-top,2rem)] pb-[env(safe-area-inset-bottom,2rem)] text-center overflow-y-auto`}
                    >
                        <div className="flex flex-col items-center py-12 sm:py-24 max-w-2xl shrink-0">
                            {destiny === 'supernova' && (
                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                                    {[...Array(12)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ scale: 0, opacity: 1 }}
                                            animate={{ 
                                                scale: [0, 15], 
                                                opacity: [1, 0],
                                                borderWidth: ["10px", "0px"]
                                            }}
                                            transition={{ 
                                                duration: 1.5, 
                                                delay: i * 0.15,
                                                repeat: Infinity,
                                                ease: "easeOut"
                                            }}
                                            className="absolute w-32 h-32 rounded-full border border-[#fbbf24] blur-[2px]"
                                        />
                                    ))}
                                    {[...Array(40)].map((_, i) => (
                                        <motion.div
                                            key={`p-${i}`}
                                            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                                            animate={{ 
                                                x: (Math.random() - 0.5) * 800,
                                                y: (Math.random() - 0.5) * 800,
                                                opacity: 0,
                                                scale: 0
                                            }}
                                            transition={{ 
                                                duration: 1 + Math.random(), 
                                                repeat: Infinity,
                                                delay: Math.random() * 2,
                                                ease: "easeOut"
                                            }}
                                            className="absolute w-2 h-2 bg-[#fbbf24] rounded-full blur-[1px]"
                                        />
                                    ))}
                                </div>
                            )}

                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ 
                                    scale: destiny === 'supernova' ? [0, 1.2, 1] : 1,
                                    rotate: destiny === 'supernova' ? [0, 10, -10, 0] : 0 
                                }}
                                transition={{ 
                                    scale: { duration: 0.8, ease: "backOut" },
                                    rotate: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                                }}
                                className={`w-32 h-32 sm:w-48 sm:h-48 rounded-full ${destiny === 'supernova' ? 'bg-[#fbbf24] shadow-[0_0_120px_rgba(251,191,36,1)]' : 'bg-slate-100 shadow-[0_0_100px_rgba(255,255,255,0.4)]'} flex flex-col items-center justify-center mb-8 sm:mb-12 relative z-10`}
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

                            <div className="flex flex-col sm:flex-row gap-4 mt-8 sm:mt-12">
                                <button 
                                    onClick={resetGame}
                                    className={`px-8 py-2.5 sm:px-10 sm:py-3 rounded-full border ${destiny === 'supernova' ? 'border-[#fbbf24] text-[#fbbf24]' : 'border-blue-300 text-blue-300'} tracking-widest uppercase text-[10px] sm:text-xs hover:opacity-80 transition-all`}
                                >
                                    Begin the cycle anew
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {gameState === 'neutron' && (
                    <div className="absolute top-32 sm:top-28 left-1/2 -translate-x-1/2 pt-[env(safe-area-inset-top,0px)] pointer-events-none z-[100] text-center w-full">
                        <motion.h2 
                            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="text-[#fbbf24] font-mono text-2xl sm:text-3xl tracking-[0.5em] font-black uppercase"
                        >
                            Neutron Pulse
                        </motion.h2>
                        <p className="text-white/50 text-[10px] uppercase tracking-widest mt-2">
                            Critical Flux Active • {neutronTimeLeft.toFixed(1)}s Remaining
                        </p>
                    </div>
                )}
            </AnimatePresence>

            {/* Controls */}

            <div className="absolute bottom-8 right-8 pb-[env(safe-area-inset-bottom,0px)] flex items-center gap-3 z-[100]">
                {gameState === 'playing' && (
                    <button 
                        onClick={() => setIsPaused(!isPaused)}
                        className="p-3 bg-[#0f172a] rounded-full shadow-[5px_5px_10px_#060a12,-5px_-5px_10px_#182442] text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                        {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </button>
                )}
                <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-3 bg-[#0f172a] rounded-full shadow-[5px_5px_10px_#060a12,-5px_-5px_10px_#182442] text-slate-400 hover:text-blue-400 transition-colors"
                >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <button 
                    onClick={() => {
                        setShowHelp(true);
                        setIsPaused(true);
                    }}
                    className="p-3 bg-[#0f172a] rounded-full shadow-[5px_5px_10px_#060a12,-5px_-5px_10px_#182442] text-slate-400 hover:text-amber-400 transition-colors"
                >
                    <HelpCircle className="w-4 h-4" />
                </button>
            </div>

            {/* Help Modal */}
            <AnimatePresence>
                {showHelp && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-4xl max-h-[85dvh] overflow-y-auto overflow-x-hidden shadow-2xl no-scrollbar"
                        >
                            <div className="p-8 sm:p-12 pb-[env(safe-area-inset-bottom,2rem)] pt-[env(safe-area-inset-top,2rem)] relative">
                                <button 
                                    onClick={() => setShowHelp(false)}
                                    className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    <Zap className="w-6 h-6 rotate-45" />
                                </button>

                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                                        <BookOpen className="w-8 h-8 text-amber-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-light tracking-tighter text-white">Stellar Manual</h2>
                                        <p className="text-slate-400 text-sm tracking-widest uppercase">Navigation & Nucleosynthesis</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    {/* Mechanics Section */}
                                    <section>
                                        <div className="flex items-center gap-2 mb-6">
                                            <Cpu className="w-5 h-5 text-emerald-400" />
                                            <h3 className="text-xl text-emerald-400 font-medium tracking-tight">Mission Logs (How to Play)</h3>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 group">
                                                <h4 className="text-slate-200 font-bold mb-2 flex items-center gap-2">
                                                    <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                                                    The Action: Navigation
                                                </h4>
                                                <p className="text-slate-400 text-sm leading-relaxed">
                                                    You control the star's nucleus. Move your cursor (or drag) to navigate. Shift your perspective near the edges to manipulate the <span className="text-blue-400">Time-Space Continuum</span>.
                                                </p>
                                                <ul className="mt-3 text-xs text-slate-500 space-y-1">
                                                    <li>• <span className="text-blue-400">Right/Down:</span> Redshift (Fast forward, harder)</li>
                                                    <li>• <span className="text-red-400">Left/Up:</span> Blueshift (Slow motion, safer)</li>
                                                </ul>
                                            </div>

                                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                                <h4 className="text-slate-200 font-bold mb-2 flex items-center gap-2">
                                                    <div className="w-1 h-4 bg-amber-500 rounded-full" />
                                                    The Reward: Fusion
                                                </h4>
                                                <p className="text-slate-400 text-sm leading-relaxed">
                                                    Capture <span className="text-blue-400">Alpha Particles</span> (blue pulses) to prepare for fusion. Gain mass with <span className="text-emerald-400">Isotopes</span>. Avoid <span className="text-rose-500">Helium Flux</span> that bleeds your internal stability.
                                                </p>
                                                <ul className="mt-3 text-xs text-slate-500 space-y-1">
                                                    <li>• <span className="text-white">Convection Nodes:</span> Flow through nodes 1-2-3 for a temporary Magnetic Shield.</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Science Section */}
                                    <section>
                                        <div className="flex items-center gap-2 mb-6">
                                            <Atom className="w-5 h-5 text-blue-400" />
                                            <h3 className="text-xl text-blue-400 font-medium tracking-tight">The Stellar Forge</h3>
                                        </div>

                                        <div className="space-y-6">
                                            <p className="text-slate-300 text-sm leading-relaxed italic border-l-2 border-blue-500/30 pl-4 py-1">
                                                "Stars are the engines of the universe, crushing protons until they yield gold."
                                            </p>
                                            
                                            <p className="text-slate-400 text-sm leading-relaxed">
                                                In our simulation, you begin as a <span className="text-white">Neutron</span> (or Proton). Through successive captures, you perform <span className="text-blue-400">nucleosynthesis</span>—the process of fusing lighter elements into heavier ones.
                                            </p>

                                            <div className="pt-4 border-t border-white/10">
                                                <button 
                                                    onClick={() => setShowNerdScience(!showNerdScience)}
                                                    className="flex items-center justify-between w-full p-4 bg-blue-500/10 hover:bg-blue-500/20 rounded-2xl text-blue-400 transition-all font-mono text-xs uppercase tracking-widest border border-blue-500/20"
                                                >
                                                    Science for Nerds
                                                    {showNerdScience ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>

                                                <AnimatePresence>
                                                    {showNerdScience && (
                                                        <motion.div 
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="pt-6 space-y-4 text-xs font-mono text-blue-300/70 leading-relaxed uppercase tracking-tighter">
                                                                <p>
                                                                    <span className="text-white font-bold">» Chandrasekhar Limit:</span> Stars above 1.4 solar masses cannot support themselves as white dwarfs. They collapse into Supernovae.
                                                                </p>
                                                                <p>
                                                                    <span className="text-white font-bold">» Alpha Process:</span> Elements from Helium (2) to Iron (26) are primarily forged by the sequential capture of Helium-4 nuclei (Alpha particles).
                                                                </p>
                                                                <p>
                                                                    <span className="text-white font-bold">» Doppler Effect:</span> Relativistic speed causes light to shift. Redshift increases the observer's interaction frequency, while Blueshift dilates time.
                                                                </p>
                                                                <p>
                                                                    <span className="text-white font-bold">» The Iron Peak:</span> Iron (Fe) has the highest binding energy per nucleon. Beyond iron, fusion consumes energy rather than releasing it, leading to instant catastrophic core collapse.
                                                                </p>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                <div className="mt-12 pt-8 border-t border-white/5 flex justify-center">
                                    <button 
                                        onClick={() => setShowHelp(false)}
                                        className="px-8 py-3 bg-emerald-500 text-slate-900 font-bold rounded-full uppercase tracking-widest text-[10px] hover:bg-white transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)]"
                                    >
                                        Resume Core Authority
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
