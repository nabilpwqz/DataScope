'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { IconDatabase, IconActivity, IconTable, IconSliders } from '@/components/ui/icons';

interface NodePoint {
  id: string;
  label: string;
  metric: string;
  x: number;
  y: number;
  z: number;
  color: string;
}

const NODES: NodePoint[] = [
  { id: 'n1', label: 'pg_trgm Index', metric: '0.8ms', x: -140, y: -60, z: 40, color: '#34d399' },
  { id: 'n2', label: 'Pushdown Filter', metric: '100k rows', x: 130, y: -80, z: 20, color: '#10b981' },
  { id: 'n3', label: 'Virtual Matrix', metric: '60 FPS', x: -120, y: 70, z: 60, color: '#6ee7b7' },
  { id: 'n4', label: 'LRU L1 Cache', metric: 'HIT (0.2ms)', x: 120, y: 60, z: 50, color: '#059669' },
  { id: 'n5', label: 'RBAC Enforcement', metric: 'Verified', x: 0, y: 0, z: 90, color: '#a7f3d0' },
];

export const SpatialDataLens: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 18, y: -24 });
  const [activeLayer, setActiveLayer] = useState<'all' | 'index' | 'virtual' | 'telemetry'>('all');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let frameId: number;
    let angle = 0;

    const autoOrbit = () => {
      if (!isHovered) {
        angle += 0.004;
        setRotation({
          x: 16 + Math.sin(angle) * 6,
          y: -22 + Math.cos(angle) * 14,
        });
      }
      frameId = requestAnimationFrame(autoOrbit);
    };

    frameId = requestAnimationFrame(autoOrbit);
    return () => cancelAnimationFrame(frameId);
  }, [isHovered]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotX = -(y / rect.height) * 26;
    const rotY = (x / rect.width) * 36;
    setRotation({ x: rotX, y: rotY });
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto py-8 select-none">
      {/* 3D Telemetry Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 mb-4 rounded-xl border border-slate-800 bg-slate-900">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
          <span className="text-xs font-semibold text-slate-200">
            Spatial Telemetry Projection
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            pitch: {rotation.x.toFixed(1)}deg | yaw: {rotation.y.toFixed(1)}deg
          </span>
        </div>

        {/* Layer Filters */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setActiveLayer('all')}
            className={`px-2.5 py-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              activeLayer === 'all'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Composite 3D
          </button>
          <button
            onClick={() => setActiveLayer('index')}
            className={`px-2.5 py-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              activeLayer === 'index'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Index Plane
          </button>
          <button
            onClick={() => setActiveLayer('virtual')}
            className={`px-2.5 py-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              activeLayer === 'virtual'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Virtual Engine
          </button>
          <button
            onClick={() => setActiveLayer('telemetry')}
            className={`px-2.5 py-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              activeLayer === 'telemetry'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Telemetry
          </button>
        </div>
      </div>

      {/* 3D Perspective Stage */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
        className="relative h-[380px] sm:h-[460px] md:h-[520px] w-full rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden cursor-grab active:cursor-grabbing flex items-center justify-center [perspective:1400px]"
      >
        {/* Background Visual Texture */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <Image
            src="/images/hero-3d-mesh.png"
            alt="3D Holographic Mesh Topology"
            fill
            priority
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="object-cover mix-blend-screen"
          />
        </div>

        {/* 3D Space Container */}
        <div
          className="relative w-[320px] sm:w-[440px] md:w-[540px] h-[260px] sm:h-[320px] md:h-[360px] transition-transform duration-100 ease-out [transform-style:preserve-3d]"
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          }}
        >
          {/* Base Grid Plane (Ground Index Coordinate) */}
          <div
            className={`absolute inset-0 rounded-2xl border border-emerald-500/30 bg-slate-900/60 transition-opacity duration-300 [transform:translateZ(-40px)] ${
              activeLayer === 'virtual' ? 'opacity-30' : 'opacity-100'
            }`}
          >
            <div className="absolute top-3 left-3 text-xs text-emerald-400">
              LAYER 0: POSTGRESQL TRGM &amp; GIN VECTOR MATRIX
            </div>
            <div className="absolute bottom-3 right-3 text-xs text-slate-400">
              COORDINATES: (0, 0, -40)
            </div>
          </div>

          {/* Intermediate Data Pipeline Plane */}
          <div
            className={`absolute inset-6 rounded-xl border border-slate-700/60 bg-emerald-950/20 transition-opacity duration-300 [transform:translateZ(20px)] ${
              activeLayer === 'index' ? 'opacity-20' : 'opacity-90'
            }`}
          >
            <div className="p-3 text-xs text-slate-300 flex items-center justify-between border-b border-slate-800">
              <span>LAYER 1: PARALLEL QUERY PUSHDOWN</span>
              <span className="text-emerald-400 font-semibold">100,000 ROWS SCANNED</span>
            </div>

            {/* Simulated Query Stream Line */}
            <div className="mt-6 mx-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent relative">
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </div>

            <div className="mt-8 grid grid-cols-3 gap-2 px-4 text-center">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="block text-xs font-bold text-white font-mono">0.68ms</span>
                <span className="text-xs text-slate-400">Planner parse</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="block text-xs font-bold text-emerald-400 font-mono">3.42ms</span>
                <span className="text-xs text-slate-400">Index lookup</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="block text-xs font-bold text-slate-100 font-mono">1.10ms</span>
                <span className="text-xs text-slate-400">JSON serialize</span>
              </div>
            </div>
          </div>

          {/* Top Virtual Window & Active Nodes Plane */}
          <div
            className={`absolute inset-12 rounded-lg border border-emerald-400/50 bg-slate-950 p-4 transition-opacity duration-300 [transform:translateZ(70px)] ${
              activeLayer === 'telemetry' ? 'opacity-40' : 'opacity-100'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <span className="font-semibold text-white">LAYER 2: VIRTUAL EXPLORER WINDOW</span>
              <span className="text-emerald-400 font-medium">60 FPS DOM SYNC</span>
            </div>

            <div className="mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Viewport Rows:</span>
                <span className="text-slate-200">25 / 100,000</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Over-scan Buffer:</span>
                <span className="text-emerald-400">10 virtual items</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>DOM Nodes Rendered:</span>
                <span className="text-slate-200">35 elements</span>
              </div>
            </div>
          </div>

          {/* Spatial Floating Telemetry Nodes */}
          {NODES.map((node) => (
            <div
              key={node.id}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
              style={{
                transform: `translate3d(${node.x}px, ${node.y}px, ${node.z}px)`,
              }}
            >
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-700 bg-slate-900 text-left hover:border-emerald-400 transition-colors duration-150">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: node.color }}
                />
                <div>
                  <div className="text-xs font-semibold text-white leading-tight">
                    {node.label}
                  </div>
                  <div className="text-xs font-mono text-emerald-400">
                    {node.metric}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Spatial Axis Compass */}
        <div className="absolute bottom-4 left-4 p-2.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-400 space-y-1 hidden sm:block">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Interactive 3D Matrix Active</span>
          </div>
          <div className="text-slate-400">Move cursor to tilt and inspect layers</div>
        </div>
      </div>

      {/* Structured Telemetry Ribbon */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <IconDatabase className="h-4 w-4" />
            <span className="text-xs font-semibold text-slate-400">Database Engine</span>
          </div>
          <span className="text-sm font-bold text-white">PostgreSQL 15</span>
          <p className="text-xs text-slate-400 mt-0.5">GIN and Trigram pushdown</p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <IconActivity className="h-4 w-4" />
            <span className="text-xs font-semibold text-slate-400">Median Latency</span>
          </div>
          <span className="text-sm font-bold text-emerald-400 font-mono">4.2 ms</span>
          <p className="text-xs text-slate-400 mt-0.5">Multi-condition search</p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <IconTable className="h-4 w-4" />
            <span className="text-xs font-semibold text-slate-400">DOM Rendering</span>
          </div>
          <span className="text-sm font-bold text-slate-100">Virtual DOM</span>
          <p className="text-xs text-slate-400 mt-0.5">Smooth 60 FPS scrolling</p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <IconSliders className="h-4 w-4" />
            <span className="text-xs font-semibold text-slate-400">Access Security</span>
          </div>
          <span className="text-sm font-bold text-emerald-400">3-Tier RBAC</span>
          <p className="text-xs text-slate-400 mt-0.5">Strict role enforcement</p>
        </div>
      </div>
    </div>
  );
};
