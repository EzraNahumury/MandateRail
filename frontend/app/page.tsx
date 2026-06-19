"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import {
  project,
  nav,
  hero,
  heroCards,
  ecosystem,
  useCases,
  featured,
  workflows,
  explore,
  problemSolution,
  howItWorks,
} from "./components/landing/content";
import { Reveal } from "./components/landing/Reveal";
import ScrollFloat from "./components/reactbits/ScrollFloat";
import GlareHover from "./components/reactbits/GlareHover";

/* ---------- tiny inline icons ---------- */
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
  </svg>
);
const IconMenu = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const IconArrow = ({ dir = 1 }: { dir?: number }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    style={{ transform: dir < 0 ? "rotate(180deg)" : undefined }}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const IconLock = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

/* ---------- workflow icons (one per row) ---------- */
const svg = (children: ReactNode) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const WfIssue = () => svg(<><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" /><path d="M12 11v6M9 14h6" /></>);
const WfSealed = () => svg(<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>);
const WfAtomic = () => svg(<path d="M13 2 4 14h7l-1 8 10-12h-7l1-8z" />);
const WfOverCap = () => svg(<><path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3z" /><path d="m9.5 9.5 5 5M14.5 9.5l-5 5" /></>);
const WfOffList = () => svg(<><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6 18.4 18.4" /></>);
const WfRevoke = () => svg(<><path d="M12 3v9" /><path d="M6.6 6.6a8 8 0 1 0 10.8 0" /></>);
const WfFunded = () => svg(<><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>);
const WfAudit = () => svg(<><rect x="6" y="4" width="12" height="16" rx="2" /><path d="M9 4h6M9 11l1.5 1.5L13 10M9 16h6" /></>);

const WF_META = [
  { icon: WfIssue, bar: "bg-sky-400", dot: "bg-sky-500" },
  { icon: WfSealed, bar: "bg-violet-400", dot: "bg-violet-500" },
  { icon: WfAtomic, bar: "bg-emerald-400", dot: "bg-emerald-500" },
  { icon: WfOverCap, bar: "bg-amber-400", dot: "bg-amber-500" },
  { icon: WfOffList, bar: "bg-rose-400", dot: "bg-rose-500" },
  { icon: WfRevoke, bar: "bg-red-400", dot: "bg-red-500" },
  { icon: WfFunded, bar: "bg-teal-400", dot: "bg-teal-500" },
  { icon: WfAudit, bar: "bg-indigo-400", dot: "bg-indigo-500" },
];

const HEADING = "text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl";

/* highlight the word "ledger" with a brand marker */
function withAccent(line: string): ReactNode {
  const w = "ledger";
  if (!line.includes(w)) return line;
  const [a, b] = line.split(w);
  return (
    <>
      {a}
      <span className="relative whitespace-nowrap">
        <span className="relative z-10">{w}</span>
        <span className="absolute inset-x-0 bottom-1.5 z-0 h-3 -rotate-1 rounded bg-lime-300/80" />
      </span>
      {b}
    </>
  );
}

/* ---------- circular rotating stamp ---------- */
function Stamp() {
  return (
    <div className="absolute -left-4 top-0 z-40 hidden h-28 w-28 sm:block">
      <svg viewBox="0 0 120 120" className="h-full w-full animate-[spin_22s_linear_infinite]">
        <defs>
          <path id="stampPath" d="M60,60 m-42,0 a42,42 0 1,1 84,0 a42,42 0 1,1 -84,0" />
        </defs>
        <circle cx="60" cy="60" r="58" fill="white" stroke="#111" strokeWidth="1" />
        <text fontSize="9.5" fill="#111" letterSpacing="2.4" fontWeight="600">
          <textPath href="#stampPath">CONFIDENTIAL · LEDGER-ENFORCED · CANTON · </textPath>
        </text>
      </svg>
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-neutral-900 text-white">
          <IconLock />
        </span>
      </span>
    </div>
  );
}

function HeroCard({ c }: { c: (typeof heroCards)[number] }) {
  return (
    <GlareHover
      width="224px"
      background="#ffffff"
      borderColor="#e5e5e5"
      borderRadius="1rem"
      glareColor="#ffffff"
      glareOpacity={0.4}
      glareSize={320}
      transitionDuration={750}
      className="shadow-2xl shadow-neutral-900/10 transition-transform duration-500 hover:scale-[1.03]"
    >
      <div className="relative h-32">
        <Image src={c.img} alt="" fill sizes="224px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/35" />
        <span className="absolute left-3 top-3 text-[10px] font-medium uppercase tracking-wider text-white/85">{c.kind}</span>
        <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-neutral-900">{c.badge}</span>
      </div>
      <div className="space-y-1.5 p-3">
        <div className="text-sm font-semibold text-neutral-900">{c.title}</div>
        <div className="text-[11px] text-neutral-500">{c.meta}</div>
        <div className="flex items-center justify-between pt-1">
          <span className="font-mono text-sm font-bold text-neutral-900">{c.amount}</span>
          <span className="grid h-6 w-6 place-items-center rounded-full bg-neutral-100 text-neutral-500"><IconLock /></span>
        </div>
      </div>
    </GlareHover>
  );
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState(explore.tabs[0].key);
  const [filter, setFilter] = useState(workflows.filters[0]);
  const featRef = useRef<HTMLDivElement>(null);
  const activeTab = explore.tabs.find((t) => t.key === tab) ?? explore.tabs[0];
  const scrollFeat = (dir: number) => featRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });

  return (
    <div className="min-h-screen bg-[#f5f5f3] text-neutral-900 [background-image:radial-gradient(circle,rgba(0,0,0,0.035)_1px,transparent_1px)] [background-size:26px_26px]">
      {/* ---------------- Navbar ---------------- */}
      <header className="sticky top-0 z-50 border-b border-neutral-200/70 bg-[#f5f5f3]/80 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <nav className="hidden items-center gap-6 text-sm text-neutral-600 md:flex">
            {nav.map((n) => (
              <a key={n.label} href={n.href} className="transition hover:text-neutral-900">{n.label}</a>
            ))}
          </nav>
          <Link href="/" className="flex items-center justify-center gap-2">
            <Image src="/logo.png" alt="MandateRail logo" width={28} height={28} className="h-7 w-7 rounded-full object-cover ring-1 ring-neutral-200" />
            <span className="text-base font-semibold tracking-tight">{project.name}</span>
          </Link>
          <div className="flex items-center justify-end gap-2">
            <button className="grid h-9 w-9 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition hover:text-neutral-900" aria-label="Search">
              <IconSearch />
            </button>
            <Link href={project.demoHref} className="hidden rounded-full bg-neutral-900 px-5 py-1.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 sm:inline-block">
              Login
            </Link>
            <button onClick={() => setMenuOpen((o) => !o)} className="grid h-9 w-9 place-items-center rounded-full bg-neutral-900 text-white md:hidden" aria-label="Menu">
              <IconMenu />
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-neutral-200 bg-[#f5f5f3] md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
              {nav.map((n) => (
                <a key={n.label} href={n.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm text-neutral-700 transition hover:bg-white">{n.label}</a>
              ))}
              <Link href={project.demoHref} className="rounded-lg bg-neutral-900 px-3 py-2 text-center text-sm font-semibold text-white">Login</Link>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ---------------- Hero ---------------- */}
        <section id="product" className="relative grid items-center gap-10 py-12 lg:grid-cols-2 lg:py-20">
          <div aria-hidden className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-lime-200/50 blur-3xl animate-blob" />
          <div aria-hidden className="pointer-events-none absolute right-10 top-32 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl animate-blob" style={{ animationDelay: "-7s" }} />

          <div className="relative animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white/70 px-3 py-1 text-xs font-medium text-neutral-600 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-500" /> Agentic procurement · Track {project.track}
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.04] tracking-tight sm:text-5xl lg:text-[3.6rem]">
              {hero.headline.map((line, i) => (
                <span key={i} className="block">{withAccent(line)}</span>
              ))}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-neutral-600">{hero.sub}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={hero.primaryCta.href} className="group rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-neutral-800">
                <span className="inline-flex items-center gap-2">{hero.primaryCta.label}<span className="transition-transform group-hover:translate-x-0.5"><IconArrow /></span></span>
              </Link>
              <a href={hero.secondaryCta.href} className="rounded-full border border-neutral-900 px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:-translate-y-0.5 hover:bg-white">
                {hero.secondaryCta.label}
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t border-neutral-200 pt-6">
              {hero.stats.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold tracking-tight">{s.value}</div>
                  <div className="text-[11px] uppercase tracking-wider text-neutral-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* hero visual — floating, rotated, real Canton imagery + glare */}
          <div className="relative h-[420px] w-full sm:h-[470px]">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 500 470" fill="none" aria-hidden>
              <ellipse cx="270" cy="245" rx="210" ry="155" stroke="#d6d3d1" strokeWidth="1" transform="rotate(-18 270 245)" />
              <ellipse cx="270" cy="245" rx="150" ry="210" stroke="#e7e5e4" strokeWidth="1" transform="rotate(12 270 245)" />
            </svg>
            <span className="absolute right-6 top-2 text-neutral-300">✦</span>
            <span className="absolute bottom-10 left-2 text-neutral-400">✦</span>
            <span className="absolute right-16 bottom-2 text-2xl text-neutral-900">✦</span>
            <Stamp />

            <div className="absolute left-0 top-2 z-10 animate-[floaty_7s_ease-in-out_infinite]">
              <div className="-rotate-6"><HeroCard c={heroCards[0]} /></div>
            </div>
            <div className="absolute right-0 top-20 z-20 animate-[floaty_8.5s_ease-in-out_infinite]" style={{ animationDelay: "-2s" }}>
              <div className="rotate-6"><HeroCard c={heroCards[1]} /></div>
            </div>
            <div className="absolute left-1/2 top-44 z-30 -translate-x-1/2">
              <div className="animate-[floaty_6.5s_ease-in-out_infinite]" style={{ animationDelay: "-4s" }}>
                <div className="rotate-2"><HeroCard c={heroCards[2]} /></div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- Ecosystem marquee ---------------- */}
        <section id="technology" className="relative border-y border-neutral-200 py-8">
          <div className="relative overflow-hidden">
            <div className="flex w-max animate-marquee items-center gap-12 pr-12">
              {[...ecosystem, ...ecosystem].map((e, i) => (
                <span key={i} className="text-xl font-semibold tracking-tight text-neutral-300 sm:text-2xl">{e}</span>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#f5f5f3] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#f5f5f3] to-transparent" />
          </div>
        </section>

        {/* ---------------- Use Cases pills ---------------- */}
        <section id="use-cases" className="py-14">
          <ScrollFloat containerClassName="mb-6 text-center" textClassName={HEADING}>{useCases.title}</ScrollFloat>
          <Reveal>
            <div className="space-y-3">
              {useCases.rows.map((row, ri) => (
                <div key={ri} className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {row.map((p) => (
                    <span key={p} className="flex-shrink-0 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:-translate-y-0.5 hover:border-neutral-900 hover:shadow-sm">{p}</span>
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-center">
              <Link href={project.demoHref} className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5">
                All use cases <IconArrow />
              </Link>
            </div>
          </Reveal>
        </section>

        {/* ---------------- Featured ---------------- */}
        <section className="py-8">
          <div className="mb-6 flex items-end justify-between">
            <ScrollFloat textClassName={HEADING}>{featured.title}</ScrollFloat>
            <div className="flex items-center gap-2">
              <button onClick={() => scrollFeat(-1)} className="grid h-9 w-9 place-items-center rounded-full border border-neutral-300 bg-white text-neutral-600 transition hover:border-neutral-900" aria-label="Previous"><IconArrow dir={-1} /></button>
              <button onClick={() => scrollFeat(1)} className="grid h-9 w-9 place-items-center rounded-full border border-neutral-300 bg-white text-neutral-600 transition hover:border-neutral-900" aria-label="Next"><IconArrow /></button>
            </div>
          </div>
          <Reveal>
            <div ref={featRef} className="flex snap-x items-stretch gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {featured.items.map((f) => (
                <GlareHover
                  key={f.title}
                  width="280px"
                  background="#ffffff"
                  borderColor="#111111"
                  borderRadius="1rem"
                  glareColor="#ffffff"
                  glareOpacity={0.35}
                  glareSize={320}
                  transitionDuration={800}
                  className="group flex-shrink-0 snap-start transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-neutral-900/15"
                >
                  <div className="relative h-44 overflow-hidden">
                    <Image src={f.img} alt="" fill sizes="280px" className="object-cover transition duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
                    <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-neutral-900">{f.status}</span>
                  </div>
                  <div className="space-y-2 p-4">
                    <h3 className="text-base font-semibold tracking-tight">{f.title}</h3>
                    <p className="text-sm leading-relaxed text-neutral-600">{f.subtitle}</p>
                  </div>
                </GlareHover>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ---------------- Key Workflows ---------------- */}
        <section className="py-14">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <ScrollFloat textClassName={HEADING}>{workflows.title}</ScrollFloat>
            <div className="flex gap-1 rounded-full border border-neutral-300 bg-white p-1">
              {workflows.filters.map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filter === f ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-900"}`}>{f}</button>
              ))}
            </div>
          </div>
          <Reveal>
            <div className="grid gap-4 md:grid-cols-2">
              {workflows.items.map((w, i) => {
                const m = WF_META[i % WF_META.length];
                const Icon = m.icon;
                return (
                  <GlareHover
                    key={w.name}
                    background="#ffffff"
                    borderColor="#e5e5e5"
                    borderRadius="0.9rem"
                    glareColor="#000000"
                    glareOpacity={0.05}
                    glareSize={300}
                    transitionDuration={750}
                    className="group transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span className={`absolute inset-y-0 left-0 w-1 ${m.bar} opacity-50 transition-opacity group-hover:opacity-100`} />
                    <div className="flex items-start gap-4 p-4 pl-6">
                      <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-neutral-900 text-white shadow-sm transition duration-300 group-hover:-rotate-3 group-hover:scale-110">
                        <Icon />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-[15px] font-semibold tracking-tight text-neutral-900">{w.name}</h3>
                          <span className="font-mono text-xs text-neutral-300">{String(i + 1).padStart(2, "0")}</span>
                        </div>
                        <p className="mt-0.5 text-sm leading-relaxed text-neutral-500">{w.desc}</p>
                        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-700 ring-1 ring-neutral-200">
                          <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
                          {w.metric}
                        </span>
                      </div>
                    </div>
                  </GlareHover>
                );
              })}
            </div>
          </Reveal>
        </section>

        {/* ---------------- Explore tabs ---------------- */}
        <section id="explore" className="py-8">
          <ScrollFloat containerClassName="mb-6" textClassName={HEADING}>{explore.title}</ScrollFloat>
          <Reveal>
            <div className="flex flex-wrap gap-2">
              {explore.tabs.map((t) => (
                <button key={t.key} onClick={() => setTab(t.key)} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${tab === t.key ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-900"}`}>{t.key}</button>
              ))}
            </div>
            <div className="mt-5 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              <div className="grid gap-0 md:grid-cols-[1.4fr_1fr]">
                <div className="p-6 sm:p-8">
                  <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{activeTab.key}</div>
                  <p className="mt-2 max-w-xl text-lg leading-relaxed text-neutral-800">{activeTab.body}</p>
                </div>
                <div className="relative min-h-[200px] border-t border-neutral-200 md:border-l md:border-t-0">
                  <Image src="/canton.png" alt="Canton ecosystem" fill sizes="(max-width:768px) 100vw, 360px" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ---------------- Problem / Solution / Why ---------------- */}
        <section className="py-14">
          <Reveal>
            <div className="grid gap-5 md:grid-cols-3">
              {problemSolution.map((c) => (
                <GlareHover
                  key={c.tag}
                  background="#ffffff"
                  borderColor="#e5e5e5"
                  borderRadius="1rem"
                  glareColor="#000000"
                  glareOpacity={0.05}
                  glareSize={300}
                  transitionDuration={750}
                  className="transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex h-full flex-col p-6">
                    <span className="mb-3 inline-flex w-fit rounded-full bg-neutral-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">{c.tag}</span>
                    <h3 className="text-lg font-semibold tracking-tight">{c.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-600">{c.body}</p>
                  </div>
                </GlareHover>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ---------------- How it works ---------------- */}
        <section className="py-8">
          <ScrollFloat containerClassName="mb-6" textClassName={HEADING}>{howItWorks.title}</ScrollFloat>
          <Reveal>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {howItWorks.steps.map((s) => (
                <GlareHover
                  key={s.n}
                  background="#ffffff"
                  borderColor="#e5e5e5"
                  borderRadius="1rem"
                  glareColor="#000000"
                  glareOpacity={0.05}
                  glareSize={300}
                  transitionDuration={750}
                  className="transition hover:-translate-y-1 hover:border-neutral-900"
                >
                  <div className="h-full p-5">
                    <div className="font-mono text-3xl font-bold text-neutral-200">{s.n}</div>
                    <h3 className="mt-2 text-base font-semibold">{s.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{s.body}</p>
                  </div>
                </GlareHover>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ---------------- CTA band ---------------- */}
        <section className="py-14">
          <div className="relative flex flex-col items-center gap-5 overflow-hidden rounded-3xl bg-neutral-900 px-6 py-16 text-center text-white sm:px-12">
            <div aria-hidden className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-lime-400/20 blur-3xl animate-blob" />
            <div aria-hidden className="pointer-events-none absolute -bottom-10 right-0 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl animate-blob" style={{ animationDelay: "-9s" }} />
            <ScrollFloat containerClassName="relative text-center" textClassName="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Bounded. Private. Atomic.
            </ScrollFloat>
            <p className="relative max-w-xl text-sm text-neutral-300">{project.oneLiner}</p>
            <div className="relative flex flex-wrap justify-center gap-3">
              <Link href={project.demoHref} className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:-translate-y-0.5">Launch the demo</Link>
              <a href={project.repo} className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">View on GitHub</a>
            </div>
          </div>
        </section>
      </main>

      {/* ---------------- Footer ---------------- */}
      <footer className="border-t border-neutral-200">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="MandateRail logo" width={24} height={24} className="h-6 w-6 rounded-full object-cover ring-1 ring-neutral-200" />
            <span className="text-sm font-semibold">{project.name}</span>
            <span className="hidden text-xs text-neutral-500 sm:inline">— {project.tagline}</span>
          </div>
          <div className="flex items-center gap-5 text-sm text-neutral-600">
            <Link href={project.demoHref} className="hover:text-neutral-900">Demo</Link>
            <a href={project.repo} className="hover:text-neutral-900">GitHub</a>
            <a href={project.repo} className="hover:text-neutral-900">Docs</a>
          </div>
          <div className="text-xs text-neutral-400">© 2026 {project.name} · Built on Canton</div>
        </div>
      </footer>
    </div>
  );
}
