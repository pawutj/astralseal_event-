"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";

interface FloatItem {
  id: number;
  x: number;
  y: number;
}

const TOTAL = 10_000;

export default function Home() {
  const [clicks, setClicks] = useState(0);
  // 0 = egg01 (default), 1 = egg02, 2 = egg03 — toggles between 1 & 2 after first click
  const [eggIndex, setEggIndex] = useState(0);
  const [squish, setSquish] = useState(false);
  const [floats, setFloats] = useState<FloatItem[]>([]);

  const pendingRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // โหลด total clicks จาก DB เมื่อหน้าเปิด
  useEffect(() => {
    fetch("/api/clicks")
      .then((r) => r.json())
      .then((d) => setClicks(d.clicks));
  }, []);

  // flush pending clicks ไปที่ API (เรียกหลัง click หยุด 300ms)
  const flush = useCallback(() => {
    if (pendingRef.current === 0) return;
    const amount = pendingRef.current;
    pendingRef.current = 0;
    fetch("/api/clicks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
  }, []);

  const remaining = Math.max(0, TOTAL - clicks);
  const isFinished = remaining === 0;

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isFinished) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setClicks((c) => Math.min(c + 1, TOTAL));
    setEggIndex((i) => {
      if (clicks < 5000) return i === 0 ? 1 : 0; // toggle egg01↔egg02
      return i === 1 ? 2 : 1;                     // toggle egg02↔egg03
    });

    setSquish(false);
    setTimeout(() => setSquish(false), 120);

    const id = Date.now() + Math.random();
    setFloats((f) => [...f, { id, x, y }]);
    setTimeout(() => setFloats((f) => f.filter((n) => n.id !== id)), 900);

    // batch API call — debounce 300ms
    pendingRef.current += 1;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, 300);
  }, [flush, isFinished]);

  if (isFinished) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black overflow-hidden">
        <div
          className="relative select-none overflow-hidden"
          style={{ width: "min(75vh, 100vw)", aspectRatio: "3 / 4" }}
        >
          <Image src="/egg/congrats.PNG" alt="Congratulations!" fill style={{ objectFit: "fill" }} priority />
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-black overflow-hidden">
      {/* Portrait game container — all images share the same canvas so they stack perfectly */}
      <div
        className="relative select-none cursor-pointer overflow-hidden"
        style={{ width: "min(75vh, 100vw)", aspectRatio: "3 / 4" }}
        onClick={handleClick}
      >
        {/* Layer 0 — Background */}
        <Image
          src="/egg/background00.png"
          alt=""
          fill
          style={{ objectFit: "fill" }}
          priority
        />

        {/* Layer 1 — "MYSTERY EGG" logo */}
        <Image
          src="/egg/playlogo.PNG"
          alt="Mystery Egg"
          fill
          style={{ objectFit: "fill" }}
          priority
        />

        {/* Layer 2 — Egg (all 3 always mounted to prevent loading flash, switch with opacity) */}
        {["/egg/egg01.PNG", "/egg/egg02.PNG", "/egg/egg03.PNG"].map((src, i) => (
          <div
            key={src}
            className="absolute inset-0"
            style={{
              opacity: eggIndex === i ? 1 : 0,
              transform: eggIndex === i && squish ? "scale(0.94) translateY(2%)" : "scale(1)",
              transition: squish ? "opacity 0s" : "transform 0.15s ease-out",
            }}
          >
            <Image src={src} alt="" fill style={{ objectFit: "fill" }} priority />
          </div>
        ))}

        {/* Layer 3 — "CLICK TO HATCH" button overlay */}
        <Image
          src="/egg/instruct.PNG"
          alt="Click to Hatch"
          fill
          style={{ objectFit: "fill" }}
        />

        {/* Click counter — counts down from 10,000 */}
        <div className="absolute inset-x-0 z-20 text-center pointer-events-none" style={{ top: "100px" }}>
          <p
            className="font-black text-5xl"
            style={{
              color: "#00ff88",
              textShadow: "0 0 24px rgba(0,255,100,1), 0 0 8px rgba(0,255,100,0.6), 0 2px 6px rgba(0,0,0,0.9)",
            }}
          >
            {remaining.toLocaleString()}
          </p>
        </div>

        {/* Floating -1 numbers */}
        {floats.map((f) => (
          <div
            key={f.id}
            className="absolute z-30 pointer-events-none font-bold text-xl float-up"
            style={{
              left: `${f.x}%`,
              top: `${f.y}%`,
              transform: "translate(-50%, -50%)",
              color: "#fde047",
              textShadow: "0 2px 6px rgba(0,0,0,0.8)",
            }}
          >
            -1
          </div>
        ))}
      </div>
    </div>
  );
}
