
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CatInstance } from '../types';
import { createCatModel } from '../services/catModelBuilder';
import { 
    INITIAL_SPAWN_INTERVAL_MS, 
    INITIAL_DESPAWN_TIMEOUT_MS,
    CAT_NAMES,
    INITIAL_CAT_TYPES,
    CAT_VARIANTS
} from '../constants';

const CatScene: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [stats, setStats] = useState({ active: 0, spawned: 0 });
    const [hoveredCat, setHoveredCat] = useState<{ name: string; type: string; x: number; y: number } | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    // Configurable States
    const [spawnInterval, setSpawnInterval] = useState(INITIAL_SPAWN_INTERVAL_MS);
    const [despawnTimeout, setDespawnTimeout] = useState(INITIAL_DESPAWN_TIMEOUT_MS);
    const [rotationSpeedMult, setRotationSpeedMult] = useState(1.0);
    const [availableTypes, setAvailableTypes] = useState(INITIAL_CAT_TYPES);
    const [selectedManualType, setSelectedManualType] = useState(INITIAL_CAT_TYPES[0]);
    const [newTypeName, setNewTypeName] = useState("");

    // Audio Context Ref
    const audioCtxRef = useRef<AudioContext | null>(null);
    const lastHoveredIdRef = useRef<string | null>(null);

    // Refs for Three.js objects
    const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
    const catsRef = useRef<CatInstance[]>([]);
    const lastSpawnTimeRef = useRef<number>(0);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    
    // State Refs to allow stable listeners and loops
    const isSettingsOpenRef = useRef(isSettingsOpen);
    const spawnIntervalRef = useRef(spawnInterval);
    const despawnTimeoutRef = useRef(despawnTimeout);
    const rotationMultRef = useRef(rotationSpeedMult);
    const availableTypesRef = useRef(availableTypes);

    // Sync refs with state
    useEffect(() => { isSettingsOpenRef.current = isSettingsOpen; }, [isSettingsOpen]);
    useEffect(() => { spawnIntervalRef.current = spawnInterval; }, [spawnInterval]);
    useEffect(() => { despawnTimeoutRef.current = despawnTimeout; }, [despawnTimeout]);
    useEffect(() => { rotationMultRef.current = rotationSpeedMult; }, [rotationSpeedMult]);
    useEffect(() => { availableTypesRef.current = availableTypes; }, [availableTypes]);

    // Audio Synthesis Functions
    const initAudio = useCallback(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    }, []);

    const playSound = useCallback((type: 'spawn' | 'despawn' | 'hover') => {
        if (!audioCtxRef.current) return;
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === 'spawn') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'despawn') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'hover') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1200, now);
            gain.gain.setValueAtTime(0.02, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        }
    }, []);

    // Dragging state refs
    const raycasterRef = useRef(new THREE.Raycaster());
    const mouseRef = useRef(new THREE.Vector2());
    const dragPlaneRef = useRef(new THREE.Plane());
    const draggedCatRef = useRef<CatInstance | null>(null);
    const dragOffsetRef = useRef(new THREE.Vector3());
    const intersectionRef = useRef(new THREE.Vector3());
    const cameraDistanceRef = useRef<number>(8);

    const spawnCat = useCallback((time: number, customType?: string) => {
        const currentTypes = availableTypesRef.current;
        const type = customType || currentTypes[Math.floor(Math.random() * currentTypes.length)];
        
        const variant = CAT_VARIANTS.find(v => v.name === type) || CAT_VARIANTS[0];
        const bodyColor = variant.color;
        const eyeColor = variant.eyeColor;
        
        const meshSize = 1.0 * 2.0; 
        const mesh = createCatModel(bodyColor, eyeColor, meshSize);

        mesh.position.set(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 7,
            (Math.random() - 0.5) * 3 - 1.0
        );
        
        mesh.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );

        mesh.scale.set(0, 0, 0);
        sceneRef.current.add(mesh);

        const newCat: CatInstance = {
            id: Math.random().toString(36).substr(2, 9),
            name: CAT_NAMES[Math.floor(Math.random() * CAT_NAMES.length)],
            type: type,
            mesh,
            spawnTime: time,
            rotationSpeed: new THREE.Vector3(
                (Math.random() - 0.5) * 0.04,
                (Math.random() - 0.5) * 0.04,
                (Math.random() - 0.5) * 0.04
            ),
            targetScale: 1.0
        };

        catsRef.current.push(newCat);
        setStats(prev => ({ active: catsRef.current.length, spawned: prev.spawned + 1 }));
        lastSpawnTimeRef.current = time;
        
        // Trigger Spawn Sound
        playSound('spawn');
    }, [playSound]);

    const handleManualSpawn = () => {
        initAudio();
        spawnCat(performance.now(), selectedManualType);
    };

    const handleAddType = () => {
        if (newTypeName.trim() && !availableTypes.includes(newTypeName.trim())) {
            setAvailableTypes(prev => [...prev, newTypeName.trim()]);
            setNewTypeName("");
        }
    };

    useEffect(() => {
        if (!mountRef.current) return;

        const width = window.innerWidth;
        const height = window.innerHeight;

        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.set(0, 1, cameraDistanceRef.current);
        camera.lookAt(0, 0, -1);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountRef.current.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xaaaaaa, 0.8);
        sceneRef.current.add(ambientLight);
        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.9);
        hemisphereLight.position.set(0, 10, 5);
        sceneRef.current.add(hemisphereLight);
        const keyLight = new THREE.DirectionalLight(0xffffff, 0.7);
        keyLight.position.set(3, 4, 4);
        sceneRef.current.add(keyLight);
        const backLight = new THREE.DirectionalLight(0xffffff, 0.4);
        backLight.position.set(-3, -2, -4);
        sceneRef.current.add(backLight);

        const onPointerDown = (event: PointerEvent) => {
            initAudio(); // Resume audio on click
            if (isSettingsOpenRef.current && event.clientX < 320) return;
            
            mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
            raycasterRef.current.setFromCamera(mouseRef.current, camera);
            
            const meshes = catsRef.current.map(c => c.mesh);
            const intersects = raycasterRef.current.intersectObjects(meshes, true);
            
            if (intersects.length > 0) {
                let hitObject = intersects[0].object;
                while (hitObject.parent && !(hitObject.parent instanceof THREE.Scene)) {
                    if (catsRef.current.some(c => c.mesh === hitObject)) break;
                    hitObject = hitObject.parent;
                }
                const cat = catsRef.current.find(c => c.mesh === hitObject);
                if (cat) {
                    draggedCatRef.current = cat;
                    setHoveredCat(null);
                    mountRef.current!.style.cursor = 'grabbing';
                    const normal = new THREE.Vector3();
                    camera.getWorldDirection(normal).negate();
                    dragPlaneRef.current.setFromNormalAndCoplanarPoint(normal, cat.mesh.position);
                    if (raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, intersectionRef.current)) {
                        dragOffsetRef.current.copy(cat.mesh.position).sub(intersectionRef.current);
                    }
                }
            }
        };

        const onPointerMove = (event: PointerEvent) => {
            const clientX = event.clientX;
            const clientY = event.clientY;
            mouseRef.current.x = (clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = -(clientY / window.innerHeight) * 2 + 1;
            
            if (draggedCatRef.current) {
                raycasterRef.current.setFromCamera(mouseRef.current, camera);
                if (raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, intersectionRef.current)) {
                    draggedCatRef.current.mesh.position.copy(intersectionRef.current).add(dragOffsetRef.current);
                }
            } else {
                raycasterRef.current.setFromCamera(mouseRef.current, camera);
                const meshes = catsRef.current.map(c => c.mesh);
                const intersects = raycasterRef.current.intersectObjects(meshes, true);
                if (intersects.length > 0) {
                    let hitObject = intersects[0].object;
                    while (hitObject.parent && !(hitObject.parent instanceof THREE.Scene)) {
                        if (catsRef.current.some(c => c.mesh === hitObject)) break;
                        hitObject = hitObject.parent;
                    }
                    const cat = catsRef.current.find(c => c.mesh === hitObject);
                    if (cat) {
                        if (lastHoveredIdRef.current !== cat.id) {
                            playSound('hover');
                            lastHoveredIdRef.current = cat.id;
                        }
                        setHoveredCat({ name: cat.name, type: cat.type, x: clientX, y: clientY });
                    }
                    else {
                        setHoveredCat(null);
                        lastHoveredIdRef.current = null;
                    }
                    mountRef.current!.style.cursor = 'pointer';
                } else {
                    setHoveredCat(null);
                    lastHoveredIdRef.current = null;
                    mountRef.current!.style.cursor = 'default';
                }
            }
        };

        const onPointerUp = () => {
            draggedCatRef.current = null;
            if (mountRef.current) mountRef.current.style.cursor = 'default';
        };

        const onWheel = (event: WheelEvent) => {
            initAudio();
            const zoomSpeed = 0.005;
            cameraDistanceRef.current += event.deltaY * zoomSpeed;
            cameraDistanceRef.current = Math.max(3, Math.min(cameraDistanceRef.current, 20));
            camera.position.set(0, cameraDistanceRef.current * 0.125, cameraDistanceRef.current);
            camera.lookAt(0, 0, -1);
        };

        mountRef.current.addEventListener('pointerdown', onPointerDown);
        mountRef.current.addEventListener('wheel', onWheel, { passive: true });
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);

        let frameId: number;
        const animate = (time: number) => {
            frameId = requestAnimationFrame(animate);
            if (time - lastSpawnTimeRef.current >= spawnIntervalRef.current) {
                spawnCat(time);
            }
            const updatedCats: CatInstance[] = [];
            const currentDespawn = despawnTimeoutRef.current;
            catsRef.current.forEach(cat => {
                const age = time - cat.spawnTime;
                if (age < currentDespawn) {
                    if (age < 500) {
                        const s = (age / 500) * cat.targetScale;
                        cat.mesh.scale.set(s, s, s);
                    } else if (age > currentDespawn - 500) {
                        const s = ((currentDespawn - age) / 500) * cat.targetScale;
                        cat.mesh.scale.set(Math.max(0, s), Math.max(0, s), Math.max(0, s));
                    } else {
                        cat.mesh.scale.set(cat.targetScale, cat.targetScale, cat.targetScale);
                    }
                    
                    if (draggedCatRef.current !== cat) {
                        const mult = rotationMultRef.current;
                        cat.mesh.rotation.x += cat.rotationSpeed.x * mult;
                        cat.mesh.rotation.y += cat.rotationSpeed.y * mult;
                        cat.mesh.rotation.z += cat.rotationSpeed.z * mult;
                        cat.mesh.position.y += Math.sin(time * 0.001 + cat.spawnTime) * 0.005;
                    }
                    updatedCats.push(cat);
                } else {
                    sceneRef.current.remove(cat.mesh);
                    playSound('despawn');
                    if (draggedCatRef.current === cat) draggedCatRef.current = null;
                }
            });
            if (updatedCats.length !== catsRef.current.length) {
                catsRef.current = updatedCats;
                setStats(prev => ({ ...prev, active: updatedCats.length }));
            }
            renderer.render(sceneRef.current, camera);
        };
        frameId = requestAnimationFrame(animate);

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            cancelAnimationFrame(frameId);
            if (mountRef.current) {
                mountRef.current.removeEventListener('pointerdown', onPointerDown);
                mountRef.current.removeEventListener('wheel', onWheel);
                mountRef.current.removeChild(renderer.domElement);
            }
            const lights = sceneRef.current.children.filter(child => child instanceof THREE.Light);
            lights.forEach(light => sceneRef.current.remove(light));
        };
    }, [spawnCat, playSound, initAudio]);

    return (
        <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white selection:bg-purple-500/30">
            <div ref={mountRef} className="absolute inset-0 z-0 touch-none" />
            
            {/* Hover Label */}
            {hoveredCat && (
                <div 
                    className="absolute z-50 pointer-events-none transition-opacity duration-200"
                    style={{ left: hoveredCat.x + 15, top: hoveredCat.y + 15, opacity: 1 }}
                >
                    <div className="bg-slate-950/90 backdrop-blur-xl border border-white/20 px-5 py-3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                        <p className="text-white font-black text-xl leading-tight">{hoveredCat.name}</p>
                        <p className="text-purple-400 text-xs font-black uppercase tracking-[0.2em]">{hoveredCat.type}</p>
                    </div>
                </div>
            )}

            {/* UI Header */}
            <div className="absolute top-8 left-8 z-10 pointer-events-none space-y-4">
                <div className="space-y-1">
                    <h1 className="text-6xl font-black tracking-tighter drop-shadow-2xl uppercase italic flex items-baseline gap-3 text-white">
                        Spinning Cats <span className="text-purple-500 text-7xl">2</span>
                    </h1>
                </div>
                <div className="flex gap-4 pt-2">
                    <div className="bg-black/50 backdrop-blur-xl px-8 py-4 rounded-[2rem] border border-white/10 shadow-2xl">
                        <span className="block text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Active Now</span>
                        <span className="text-4xl font-mono text-purple-400 leading-none glow-text">{stats.active}</span>
                    </div>
                    <div className="bg-black/50 backdrop-blur-xl px-8 py-4 rounded-[2rem] border border-white/10 shadow-2xl">
                        <span className="block text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Total Cats</span>
                        <span className="text-4xl font-mono text-purple-400 leading-none glow-text">{stats.spawned}</span>
                    </div>
                </div>
            </div>

            {/* Settings Toggle Button */}
            <button 
                onClick={() => {
                    initAudio();
                    setIsSettingsOpen(!isSettingsOpen);
                }}
                className={`absolute top-8 right-8 z-50 p-5 rounded-[2rem] backdrop-blur-2xl border border-white/10 shadow-2xl transition-all duration-300 ${isSettingsOpen ? 'bg-purple-600 text-white scale-110' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 transition-transform duration-700 ${isSettingsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>

            {/* Settings Sidebar */}
            <div className={`absolute left-0 top-0 bottom-0 w-80 z-40 bg-slate-950/80 backdrop-blur-3xl border-r border-white/5 shadow-2xl transition-transform duration-500 ease-in-out p-8 pt-32 overflow-y-auto ${isSettingsOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="space-y-10">
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500 mb-6">Simulation Settings</h3>
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                                    Spawn Rate <span>{(spawnInterval/1000).toFixed(1)}s</span>
                                </label>
                                <input 
                                    type="range" min="500" max="10000" step="100" 
                                    value={spawnInterval} onChange={(e) => setSpawnInterval(Number(e.target.value))}
                                    className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-purple-500"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                                    Despawn Delay <span>{(despawnTimeout/1000).toFixed(1)}s</span>
                                </label>
                                <input 
                                    type="range" min="2000" max="30000" step="100" 
                                    value={despawnTimeout} onChange={(e) => setDespawnTimeout(Number(e.target.value))}
                                    className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-purple-500"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                                    Spin Velocity <span>x{rotationSpeedMult.toFixed(1)}</span>
                                </label>
                                <input 
                                    type="range" min="0.1" max="10.0" step="0.1" 
                                    value={rotationSpeedMult} onChange={(e) => setRotationSpeedMult(Number(e.target.value))}
                                    className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-purple-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-white/5">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500 mb-4">Manual Factory</h3>
                        <div className="space-y-3">
                            <select 
                                value={selectedManualType}
                                onChange={(e) => setSelectedManualType(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-3 text-sm font-bold focus:outline-none focus:border-purple-500 transition-all appearance-none cursor-pointer text-white"
                            >
                                {availableTypes.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                            </select>
                            <button 
                                onClick={handleManualSpawn}
                                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl shadow-[0_10px_30px_rgba(147,51,234,0.3)] transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Spawn Breed
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-white/5">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500 mb-4">Add New Breed</h3>
                        <div className="flex gap-2">
                            <input 
                                type="text" placeholder="Breed Name..." 
                                value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddType()}
                                className="flex-1 bg-slate-900 border border-white/10 rounded-2xl px-5 py-3 text-sm font-bold focus:outline-none focus:border-purple-500 text-white"
                            />
                            <button 
                                onClick={handleAddType}
                                className="bg-slate-800 hover:bg-purple-600 p-3 rounded-2xl transition-all shadow-xl"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Styles */}
            <style>{`
                .glow-text {
                    text-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
                }
                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 16px;
                    width: 16px;
                    border-radius: 50%;
                    background: #a855f7;
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
                }
                select {
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 1rem center;
                    background-size: 1em;
                }
            `}</style>
        </div>
    );
};

export default CatScene;
