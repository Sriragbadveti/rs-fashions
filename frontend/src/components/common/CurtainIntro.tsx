import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import gsap from "gsap";
import { ArrowRight, Sparkles } from "lucide-react";
import logo from "../../assets/logo/logo1.png";

interface CurtainIntroProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

const TOTAL_FOLDS = 16;

/* ================================================================
   HIILLOKSET JA KIMALLUSPARTIKKELIT (Canvas)
   ================================================================ */
interface ShimmerParticle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  vy: number;
  vx: number;
  baseVx: number;
  color: string;
}

const PALETTE_COLORS = [
  "247, 235, 236", // Lavender Blush
  "244, 231, 228", // Seashell
  "233, 201, 195", // Dogwood
  "255, 215, 180", // Warm Champagne
];

function EtherealLuminescentDust({ isExiting }: { isExiting: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const createParticle = (initialSpawn = false): ShimmerParticle => {
      const maxLife = 90 + Math.random() * 100;
      return {
        x: Math.random() * width,
        y: initialSpawn ? Math.random() * height : height + 10 + Math.random() * 20,
        size: Math.random() * 2.2 + 0.8,
        alpha: 0.1,
        life: initialSpawn ? Math.random() * maxLife : 0,
        maxLife,
        vy: -(Math.random() * 1.6 + 0.9),
        vx: 0,
        baseVx: (Math.random() - 0.5) * 0.6,
        color: PALETTE_COLORS[Math.floor(Math.random() * PALETTE_COLORS.length)],
      };
    };

    const particles: ShimmerParticle[] = Array.from({ length: 30 }, () =>
      createParticle(true),
    );

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "screen";

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life += 1;

        const progress = p.life / p.maxLife;
        p.vx = p.baseVx + Math.sin(p.life * 0.05) * 0.5;
        p.x += p.vx;
        p.y += p.vy;

        if (progress < 0.2) {
          p.alpha = (progress / 0.2) * 0.85;
        } else {
          p.alpha = (1 - progress) * 0.85;
        }

        const rad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
        rad.addColorStop(0, `rgba(${p.color}, ${Math.max(0, p.alpha)})`);
        rad.addColorStop(0.4, `rgba(${p.color}, ${Math.max(0, p.alpha * 0.45)})`);
        rad.addColorStop(1, `rgba(${p.color}, 0)`);

        ctx.fillStyle = rad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fill();

        if (p.life >= p.maxLife || p.y < -20) {
          particles[i] = createParticle(false);
        }
      }

      ctx.globalCompositeOperation = "source-over";
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 z-45 transition-opacity duration-500 ease-out ${
        isExiting ? "opacity-0" : "opacity-75"
      }`}
    />
  );
}

/* ================================================================
   ROYAL RED DRAPERY (Preserved)
   ================================================================ */
interface DraperyHalfProps {
  side: "left" | "right";
  containerRef: React.RefObject<HTMLDivElement | null>;
  foldRefs: React.MutableRefObject<HTMLDivElement[]>;
}

function DraperyHalf({ side, containerRef, foldRefs }: DraperyHalfProps) {
  const isLeft = side === "left";
  const filterId = useId();

  const foldData = useMemo(() => {
    return Array.from({ length: TOTAL_FOLDS }, (_, i) => {
      const normalizedPos = i / (TOTAL_FOLDS - 1);
      const centerFactor = Math.sin(normalizedPos * Math.PI);
      return {
        id: i,
        depth: 0.18 + centerFactor * 0.28,
      };
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-y-0 z-30 flex w-[55%] overflow-hidden ${
        isLeft ? "left-0 justify-start" : "right-0 justify-end"
      }`}
      style={{
        boxShadow: isLeft
          ? "24px 0 45px rgba(0,0,0,0.85)"
          : "-24px 0 45px rgba(0,0,0,0.85)",
      }}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-20 mix-blend-overlay">
        <filter id={filterId}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="1"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${filterId})`} />
      </svg>

      <div
        className={`flex h-full w-full ${isLeft ? "flex-row" : "flex-row-reverse"}`}
      >
        {foldData.map((fold, idx) => {
          const globalIdx = isLeft ? idx : TOTAL_FOLDS + idx;
          return (
            <div
              key={fold.id}
              ref={(el) => {
                if (el) foldRefs.current[globalIdx] = el;
              }}
              className="relative h-full flex-1 will-change-transform"
              style={{
                background: `
                  linear-gradient(
                    ${isLeft ? "90deg" : "270deg"},
                    #120104 0%,
                    #34040D 18%,
                    rgba(142, 21, 46, ${0.75 + fold.depth * 0.4}) 48%,
                    #6B0B21 68%,
                    #220208 86%,
                    #0A0002 100%
                  )
                `,
                boxShadow: "inset 0 0 16px rgba(0, 0, 0, 0.7)",
              }}
            >
              <div
                className="absolute inset-y-0 w-1/3 opacity-35"
                style={{
                  left: "38%",
                  background:
                    "linear-gradient(90deg, transparent, rgba(247, 235, 236, 0.3), transparent)",
                }}
              />
            </div>
          );
        })}
      </div>

      <div
        className={`pointer-events-none absolute inset-y-0 w-36 ${
          isLeft
            ? "right-0 bg-linear-to-l from-black/90 to-transparent"
            : "left-0 bg-linear-to-r from-black/90 to-transparent"
        }`}
      />
    </div>
  );
}

/* ================================================================
   MAIN INTRO ORCHESTRATOR
   ================================================================ */
export default function CurtainIntro({
  onComplete,
  forceShow = false,
}: CurtainIntroProps) {
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get("intro") === "true" || forceShow) return true;
    return !sessionStorage.getItem("rs_curtain_intro_seen");
  });

  const [isExiting, setIsExiting] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const backdropGlowRef = useRef<HTMLDivElement>(null);
  const blurBackplateRef = useRef<HTMLDivElement>(null);
  const leftCurtainRef = useRef<HTMLDivElement>(null);
  const rightCurtainRef = useRef<HTMLDivElement>(null);
  const foldsRef = useRef<HTMLDivElement[]>([]);
  const glassCardRef = useRef<HTMLDivElement>(null);
  const seamLightRef = useRef<HTMLDivElement>(null);

  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const completedRef = useRef(false);

  const finishIntro = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsExiting(true);

    try {
      sessionStorage.setItem("rs_curtain_intro_seen", "true");
    } catch {
      // safe fallback
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setIsVisible(false);
          onComplete?.();
        },
      });

      timelineRef.current?.kill();

      tl.to(glassCardRef.current, {
        opacity: 0,
        scale: 0.95,
        y: -15,
        duration: 0.32,
        ease: "power2.in",
      });

      tl.to(
        seamLightRef.current,
        {
          opacity: 0,
          scaleX: 0,
          duration: 0.25,
        },
        0,
      );

      tl.to(
        backdropGlowRef.current,
        {
          opacity: 0,
          duration: 0.35,
          ease: "power1.out",
        },
        0.1,
      );

      const leftFolds = foldsRef.current.slice(0, TOTAL_FOLDS);
      const rightFolds = foldsRef.current.slice(TOTAL_FOLDS);

      tl.to(
        leftFolds,
        {
          xPercent: (i) => -110 - (TOTAL_FOLDS - i) * 12,
          scaleX: 0.3,
          stagger: 0.015,
          duration: 1.05,
          ease: "power3.inOut",
        },
        0.05,
      );

      tl.to(
        rightFolds,
        {
          xPercent: (i) => 110 + i * 12,
          scaleX: 0.3,
          stagger: -0.015,
          duration: 1.05,
          ease: "power3.inOut",
        },
        0.05,
      );

      tl.to(
        leftCurtainRef.current,
        {
          xPercent: -108,
          duration: 1.1,
          ease: "power3.inOut",
        },
        0.1,
      );

      tl.to(
        rightCurtainRef.current,
        {
          xPercent: 108,
          duration: 1.1,
          ease: "power3.inOut",
        },
        0.1,
      );

      tl.to(
        blurBackplateRef.current,
        {
          opacity: 0,
          duration: 0.3,
          ease: "power2.out",
        },
        "-=0.7",
      );

      tl.to(
        rootRef.current,
        {
          opacity: 0,
          duration: 0.2,
          ease: "power1.out",
        },
        "-=0.25",
      );
    }, rootRef);

    return () => ctx.revert();
  }, [onComplete]);

  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        finishIntro();
      }
    };

    const handleReplay = () => {
      completedRef.current = false;
      setIsExiting(false);
      setIsVisible(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("rs:replay-intro", handleReplay);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("rs:replay-intro", handleReplay);
    };
  }, [isVisible, finishIntro]);

  useLayoutEffect(() => {
    if (!isVisible || !rootRef.current) return;

    document.body.style.overflow = "hidden";

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      timelineRef.current = tl;

      gsap.set(glassCardRef.current, { opacity: 0, scale: 0.94, y: 20 });
      gsap.set(seamLightRef.current, { scaleY: 0, opacity: 0 });

      tl.to(
        seamLightRef.current,
        {
          scaleY: 1,
          opacity: 0.85,
          duration: 0.55,
          ease: "power2.out",
        },
        0.2,
      );

      tl.to(
        glassCardRef.current,
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
        },
        0.35,
      );

      tl.call(finishIntro, [], 3.0);
    }, rootRef);

    return () => {
      timelineRef.current?.kill();
      ctx.revert();
      document.body.style.overflow = "";
    };
  }, [isVisible, finishIntro]);

  if (!isVisible) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-99999 flex items-center justify-center overflow-hidden select-none font-sans"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome presentation"
    >
      <div
        ref={blurBackplateRef}
        className="pointer-events-none absolute inset-0 z-0 bg-black/45"
      />

      <div
        ref={backdropGlowRef}
        className="pointer-events-none absolute inset-0 z-5 opacity-90 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(138, 21, 48, 0.55) 0%, rgba(30, 4, 10, 0.82) 60%, rgba(10, 1, 3, 0.96) 100%)",
        }}
      />

      <EtherealLuminescentDust isExiting={isExiting} />

      <DraperyHalf side="left" containerRef={leftCurtainRef} foldRefs={foldsRef} />
      <DraperyHalf side="right" containerRef={rightCurtainRef} foldRefs={foldsRef} />

      <div
        ref={seamLightRef}
        className="pointer-events-none absolute inset-y-0 left-1/2 z-35 w-[1.5px] -translate-x-1/2"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(247, 235, 236, 0.9) 30%, rgba(233, 201, 195, 1) 50%, rgba(142, 21, 46, 0.8) 80%, transparent)",
          boxShadow: "0 0 20px 2px rgba(233, 201, 195, 0.5)",
        }}
      />

      {/* ============================================================
          SOLID LUXURY HERO CONTAINER (Zero-lag, perfect legibility)
          ============================================================ */}
      <div
        ref={glassCardRef}
        className="relative z-40 mx-4 w-full max-w-lg will-change-transform"
      >
        <div
          className="pointer-events-none absolute -inset-4 rounded-[42px] opacity-40 blur-2xl"
          style={{
            background:
              "radial-gradient(circle at 50% 30%, rgba(212, 33, 75, 0.45), rgba(90, 8, 25, 0.25) 60%, transparent 80%)",
          }}
        />

        <div
          className="relative overflow-hidden rounded-4xl p-8 sm:p-12 text-center"
          style={{
            /* Solid wine velvet gradient: instant render with no backdrop-filter lag */
            background:
              "linear-gradient(155deg, #3A0510 0%, #200208 55%, #140105 100%)",
            border: "1px solid rgba(255, 225, 210, 0.18)",
            boxShadow: `
              0 30px 80px -15px rgba(0, 0, 0, 0.9),
              inset 0 1px 1px 0 rgba(255, 240, 225, 0.3),
              inset 0 -1px 1px 0 rgba(0, 0, 0, 0.6)
            `,
          }}
        >
          {/* Top highlight specular seam */}
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-[#F7EBEC]/50 to-transparent" />

          {/* Logo */}
          <div className="mx-auto mb-6 flex h-20 w-20 sm:h-22 sm:w-22 items-center justify-center rounded-full border border-[#E9C9C3]/25 bg-black/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.15)]">
            <img
              src={logo}
              alt="RS Fashions"
              className="h-[70%] w-[70%] object-contain brightness-0 invert drop-shadow-[0_2px_12px_rgba(247,235,236,0.4)]"
            />
          </div>

          {/* Couture Tag */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E9C9C3]/20 bg-[#4A0A17]/60 px-4 py-1 text-[15px] font-display tracking-[0.38em] text-white uppercase">
            <span>RS FASHIONS</span>
          </div>

          {/* Display Heading */}
          <h1 className="mt-5 font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-white leading-tight">
            A new chapter{" "}
            <span className="italic font-light text-[#F4E7E4] underline decoration-[#E9C9C3]/40 underline-offset-8">
              begins
            </span>{" "}
            here.
          </h1>

          {/* SOLID CONTRAST CTA BUTTON */}
          <button
            type="button"
            onClick={finishIntro}
            className="group relative mx-auto mt-8 inline-flex items-center gap-3 overflow-hidden rounded-full px-8 py-3.5 text-[11px] font-semibold tracking-[0.25em] uppercase text-[#200208] shadow-[0_10px_25px_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_12px_30px_rgba(233,201,195,0.35)] active:scale-95"
            style={{
              background:
                "linear-gradient(135deg, #F7EBEC 0%, #F4E7E4 50%, #E9C9C3 100%)",
              border: "1px solid rgba(255, 255, 255, 0.8)",
            }}
          >
            <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
            <span className="relative z-10">Enter</span>
            <ArrowRight
              size={13}
              className="relative z-10 text-[#200208] transition-transform duration-300 group-hover:translate-x-1"
            />
          </button>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-50"
        style={{
          boxShadow: "inset 0 0 100px 35px rgba(0, 0, 0, 0.7)",
        }}
      />
    </div>
  );
}