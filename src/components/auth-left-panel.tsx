import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

type FeatureIcon = "spark" | "code" | "chart" | "tutor";

const features: { title: string; description: string; icon: FeatureIcon }[] = [
  { title: "Interactive Learning", description: "Visualize and understand algorithms", icon: "spark" },
  { title: "Practice & Improve", description: "Solve curated problems at your level", icon: "code" },
  { title: "Track Your Progress", description: "Detailed analytics and insights", icon: "chart" },
  { title: "AI Tutor", description: "Get personalized help and explanations", icon: "tutor" },
];

function FeatureGlyph({ icon }: { icon: FeatureIcon }) {
  if (icon === "spark") return <path d="m13 2-3 8H4l7 12 3-8h6L13 2Z" fill="currentColor" stroke="none" />;
  if (icon === "code") return <><path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" /></>;
  if (icon === "chart") return <><path d="M4 19V5m0 14h16M8 16v-4m4 4V7m4 9v-6" /><path d="M7 12h2v4H7zm4-6h2v10h-2zm4 3h2v7h-2z" fill="currentColor" stroke="none" /></>;
  return <><rect x="4" y="8" width="16" height="12" rx="4" /><path d="M9 8V5h6v3M8 13h.01M16 13h.01M9 17h6M2 12h2m16 0h2" /><circle cx="9" cy="14" r=".6" fill="currentColor" /><circle cx="15" cy="14" r=".6" fill="currentColor" /></>;
}

export function AuthLeftPanel() {
  return (
    <div className="auth-left-panel relative z-10 flex h-full min-h-[10rem] flex-col">
      <Link aria-label="CodeTrail home" className="auth-brand flex w-fit items-center gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-400" href="/">
        <BrandMark />
        <span className="text-[1.7rem] font-semibold tracking-tight text-white">CodeTrail</span>
      </Link>

      <div className="auth-intro mt-5 max-w-[34rem] md:mt-6 lg:mt-7">
        <span className="inline-flex rounded-full border border-violet-300/20 bg-violet-300/[0.08] px-4 py-2 text-xs font-semibold tracking-wide text-violet-100 sm:text-sm">
          DSA Learning Platform
        </span>
        <h1 className="mt-4 text-[clamp(1.75rem,3.6vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.04em] text-white">
          Master DSA,<br />Track Progress,<br />
          <span className="auth-gradient-text">Build Confidence</span>
        </h1>
        <p className="mt-3 max-w-[33rem] text-sm leading-6 text-slate-300 sm:text-base sm:leading-6">
          Learn algorithms, visualize concepts, solve problems, and get AI-powered guidance — all in one place.
        </p>
      </div>

      <ul className="auth-features mt-5 hidden gap-2.5 sm:grid sm:grid-cols-2 md:mt-6 md:grid-cols-1 lg:mt-6 lg:gap-3">
        {features.map((feature) => (
          <li className="flex items-center gap-2.5" key={feature.title}>
            <span className="auth-feature-icon grid size-10 shrink-0 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.055] text-violet-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:size-11">
              <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24"><FeatureGlyph icon={feature.icon} /></svg>
            </span>
            <span>
              <span className="block text-sm font-semibold text-white sm:text-[0.9375rem]">{feature.title}</span>
              <span className="block text-xs leading-4 text-slate-400 sm:text-[0.8125rem] sm:leading-5">{feature.description}</span>
            </span>
          </li>
        ))}
      </ul>

      <svg aria-hidden="true" className="auth-wave pointer-events-none absolute -bottom-10 -left-12 hidden h-44 w-[calc(100%+6rem)] md:block lg:h-56" preserveAspectRatio="none" viewBox="0 0 900 230">
        <defs><linearGradient id="auth-wave-line" x1="0" x2="1"><stop offset="0" stopColor="#2563eb" stopOpacity="0.05" /><stop offset="0.52" stopColor="#6366f1" stopOpacity="0.48" /><stop offset="1" stopColor="#7c3aed" stopOpacity="0.08" /></linearGradient></defs>
        <path d="M0 150C150 120 210 210 365 170S590 30 900 54" fill="none" stroke="url(#auth-wave-line)" strokeWidth="1.5" />
        <path d="M0 173C150 143 210 233 365 193S590 53 900 77" fill="none" stroke="url(#auth-wave-line)" strokeWidth="1" />
        <path d="M0 196C150 166 210 256 365 216S590 76 900 100" fill="none" stroke="url(#auth-wave-line)" strokeWidth="1" />
        <g fill="#818cf8" opacity=".55"><circle cx="610" cy="102" r="2" /><circle cx="666" cy="82" r="1.5" /><circle cx="710" cy="76" r="2" /><circle cx="765" cy="66" r="1.5" /><circle cx="802" cy="63" r="2" /><circle cx="855" cy="56" r="1.5" /></g>
      </svg>
    </div>
  );
}
