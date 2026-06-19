"use client";

import Link from "next/link";
import { useRef, useState } from "react";
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

/* ---------- tone gradients (muted, institutional — not neon) ---------- */
const toneGrad: Record<string, string> = {
  indigo: "from-slate-800 to-indigo-950",
  slate: "from-neutral-800 to-neutral-600",
  emerald: "from-emerald-800 to-teal-950",
  violet: "from-slate-800 to-violet-950",
};

/* ---------- circular rotating stamp ---------- */
function Stamp() {
  return (
    <div className="absolute -left-5 top-1 z-40 hidden h-28 w-28 sm:block">
      <svg viewBox="0 0 120 120" className="h-full w-full animate-[spin_20s_linear_infinite]">
        <defs>
          <path id="stampPath" d="M60,60 m-42,0 a42,42 0 1,1 84,0 a42,42 0 1,1 -84,0" />
        </defs>
        <circle cx="60" cy="60" r="58" fill="white" stroke="#111" strokeWidth="1" />
        <text fontSize="9.5" fill="#111" letterSpacing="2.5" fontWeight="600">
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

function HeroCard({ c, className }: { c: (typeof heroCards)[number]; className: string }) {
  return (
    <div
      className={`absolute w-56 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl transition-transform duration-500 hover:scale-[1.03] ${className}`}
    >
      <div className={`relative h-32 bg-gradient-to-br ${toneGrad[c.tone]}`}>
        <span className="absolute left-3 top-3 text-[10px] font-medium uppercase tracking-wider text-white/70">{c.kind}</span>
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-neutral-900">{c.badge}</span>
      </div>
      <div className="space-y-1.5 p-3">
        <div className="text-sm font-semibold text-neutral-900">{c.title}</div>
        <div className="text-[11px] text-neutral-500">{c.meta}</div>
        <div className="flex items-center justify-between pt-1">
          <span className="font-mono text-sm font-bold text-neutral-900">{c.amount}</span>
          <span className="grid h-6 w-6 place-items-center rounded-full bg-neutral-100 text-neutral-500"><IconLock /></span>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ title, action }: { title: string; action?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      {action && (
        <a href="#" className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
          {action} <IconArrow />
        </a>
      )}
    </div>
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
    <div className="min-h-screen bg-[#f5f5f3] text-neutral-900">
      {/* ---------------- Navbar ---------------- */}
      <header className="sticky top-0 z-50 border-b border-neutral-200/70 bg-[#f5f5f3]/85 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <nav className="hidden items-center gap-6 text-sm text-neutral-600 md:flex">
            {nav.map((n) => (
              <a key={n.label} href={n.href} className="transition hover:text-neutral-900">{n.label}</a>
            ))}
          </nav>
          <Link href="/" className="flex items-center justify-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-neutral-900 text-xs font-bold text-white">M</span>
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
        <section id="product" className="grid items-center gap-10 py-12 lg:grid-cols-2 lg:py-20">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Track · {project.track}
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              {hero.headline.map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-neutral-600">{hero.sub}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={hero.primaryCta.href} className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-neutral-800">
                {hero.primaryCta.label}
              </Link>
              <a href={hero.secondaryCta.href} className="rounded-full border border-neutral-900 bg-transparent px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:-translate-y-0.5 hover:bg-white">
                {hero.secondaryCta.label}
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-8">
              {hero.stats.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold tracking-tight">{s.value}</div>
                  <div className="text-[11px] uppercase tracking-wider text-neutral-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* hero visual */}
          <div className="relative h-[420px] w-full sm:h-[460px]">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 500 460" fill="none" aria-hidden>
              <ellipse cx="270" cy="240" rx="210" ry="150" stroke="#d6d3d1" strokeWidth="1" transform="rotate(-18 270 240)" />
              <ellipse cx="270" cy="240" rx="150" ry="210" stroke="#e7e5e4" strokeWidth="1" transform="rotate(12 270 240)" />
            </svg>
            <span className="absolute right-6 top-2 text-neutral-300">✦</span>
            <span className="absolute bottom-8 left-2 text-neutral-400">✦</span>
            <span className="absolute right-16 bottom-2 text-2xl text-neutral-900">✦</span>
            <Stamp />
            <HeroCard c={heroCards[0]} className="left-2 top-2 z-10 -rotate-6" />
            <HeroCard c={heroCards[1]} className="right-2 top-16 z-20 rotate-6" />
            <HeroCard c={heroCards[2]} className="left-1/2 top-40 z-30 -translate-x-1/2 rotate-[2deg]" />
          </div>
        </section>

        {/* ---------------- Ecosystem row ---------------- */}
        <section id="technology" className="border-y border-neutral-200 py-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {ecosystem.map((e) => (
              <span key={e} className="text-lg font-semibold tracking-tight text-neutral-300 transition hover:text-neutral-500 sm:text-xl">{e}</span>
            ))}
          </div>
        </section>

        {/* ---------------- Use Cases pills ---------------- */}
        <section id="use-cases" className="py-14">
          <h2 className="mb-6 text-center text-2xl font-bold tracking-tight sm:text-3xl">{useCases.title}</h2>
          <div className="space-y-3">
            {useCases.rows.map((row, ri) => (
              <div key={ri} className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {row.map((p) => (
                  <span key={p} className="flex-shrink-0 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-900 hover:shadow-sm">{p}</span>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <Link href={project.demoHref} className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white">
              All use cases <IconArrow />
            </Link>
          </div>
        </section>

        {/* ---------------- Featured ---------------- */}
        <section className="py-8">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{featured.title}</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => scrollFeat(-1)} className="grid h-9 w-9 place-items-center rounded-full border border-neutral-300 bg-white text-neutral-600 transition hover:border-neutral-900" aria-label="Previous"><IconArrow dir={-1} /></button>
              <button onClick={() => scrollFeat(1)} className="grid h-9 w-9 place-items-center rounded-full border border-neutral-300 bg-white text-neutral-600 transition hover:border-neutral-900" aria-label="Next"><IconArrow /></button>
            </div>
          </div>
          <div ref={featRef} className="flex snap-x gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {featured.items.map((f) => (
              <article key={f.title} className="group w-[280px] flex-shrink-0 snap-start overflow-hidden rounded-2xl border border-neutral-900/90 bg-white transition hover:-translate-y-1 hover:shadow-xl">
                <div className={`relative h-44 bg-gradient-to-br ${toneGrad[f.tone]}`}>
                  <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-neutral-900">{f.status}</span>
                </div>
                <div className="space-y-2 p-4">
                  <h3 className="text-base font-semibold tracking-tight">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-neutral-600">{f.subtitle}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ---------------- Key Workflows ---------------- */}
        <section className="py-14">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{workflows.title}</h2>
            <div className="flex gap-1 rounded-full border border-neutral-300 bg-white p-1">
              {workflows.filters.map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filter === f ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-900"}`}>{f}</button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {workflows.items.map((w, i) => (
              <div key={w.name} className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white px-4 py-3 transition hover:border-neutral-400 hover:shadow-sm">
                <span className="w-5 text-sm font-semibold text-neutral-400">{i + 1}</span>
                <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-neutral-900 text-xs font-bold text-white">{w.name.slice(0, 1)}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{w.name}</div>
                  <div className="truncate text-xs text-neutral-500">{w.desc}</div>
                </div>
                <span className="hidden flex-shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-700 sm:inline-block">{w.metric}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- Explore tabs ---------------- */}
        <section id="explore" className="py-8">
          <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">{explore.title}</h2>
          <div className="flex flex-wrap gap-2">
            {explore.tabs.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${tab === t.key ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-900"}`}>{t.key}</button>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{activeTab.key}</div>
            <p className="mt-2 max-w-3xl text-lg leading-relaxed text-neutral-800">{activeTab.body}</p>
          </div>
        </section>

        {/* ---------------- Problem / Solution / Why ---------------- */}
        <section className="py-14">
          <div className="grid gap-5 md:grid-cols-3">
            {problemSolution.map((c) => (
              <div key={c.tag} className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg">
                <span className="mb-3 inline-flex w-fit rounded-full bg-neutral-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">{c.tag}</span>
                <h3 className="text-lg font-semibold tracking-tight">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- How it works ---------------- */}
        <section className="py-8">
          <SectionHead title={howItWorks.title} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.steps.map((s) => (
              <div key={s.n} className="rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-900">
                <div className="font-mono text-3xl font-bold text-neutral-200">{s.n}</div>
                <h3 className="mt-2 text-base font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- CTA band ---------------- */}
        <section className="py-14">
          <div className="flex flex-col items-center gap-5 rounded-3xl bg-neutral-900 px-6 py-14 text-center text-white sm:px-12">
            <h2 className="max-w-2xl text-2xl font-bold tracking-tight sm:text-4xl">Bounded. Private. Atomic.</h2>
            <p className="max-w-xl text-sm text-neutral-300">{project.oneLiner}</p>
            <div className="flex flex-wrap justify-center gap-3">
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
            <span className="grid h-6 w-6 place-items-center rounded-full bg-neutral-900 text-[10px] font-bold text-white">M</span>
            <span className="text-sm font-semibold">{project.name}</span>
            <span className="text-xs text-neutral-500">— {project.tagline}</span>
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
