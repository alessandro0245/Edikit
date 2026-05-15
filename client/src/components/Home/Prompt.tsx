import CategoryCard from "./CategoryCard";
import { categoriesTemplate } from "@/utils/constant";
import { Wand2 } from "lucide-react";

const Prompt = () => {
  return (
    <section
      className="relative py-20 md:py-28 overflow-hidden bg-background"
      id="prompt"
    >
      {/* ── Background decorations ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Subtle grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.025]">
          <defs>
            <pattern
              id="prompt-grid"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 48 0 L 0 0 0 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#prompt-grid)" />
        </svg>

        {/* Primary glow — top center */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-64 rounded-full bg-primary/10 blur-[120px] animate-hero-glow" />

        {/* Accent glow — bottom right */}
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-primary/7 blur-[80px] animate-hero-glow-delayed" />

        {/* Floating square — top left */}
        <svg
          className="absolute top-16 left-[5%] w-10 h-10 text-primary/20 animate-float"
          viewBox="0 0 40 40"
          fill="none"
        >
          <rect
            x="4"
            y="4"
            width="32"
            height="32"
            rx="6"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>

        {/* Floating cross — top right */}
        <svg
          className="absolute top-24 right-[6%] w-7 h-7 text-primary/25 animate-float-delayed"
          viewBox="0 0 28 28"
          fill="none"
        >
          <path
            d="M14 3v22M3 14h22"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        {/* Floating ring — bottom left */}
        <svg
          className="absolute bottom-20 left-[8%] w-12 h-12 text-primary/15 animate-float-slow"
          viewBox="0 0 48 48"
          fill="none"
        >
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="5 3"
          />
        </svg>

        {/* Floating triangle — bottom right */}
        <svg
          className="absolute bottom-16 right-[7%] w-9 h-9 text-primary/15 animate-float"
          viewBox="0 0 36 36"
          fill="none"
        >
          <polygon
            points="18,4 32,30 4,30"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* ── Content ── */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-6 mb-16 md:mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight text-balance">
              Create motion graphics
              <br className="hidden sm:block" />
              <span className="relative">
                {" "}
                from a{" "}
                <span className="bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  prompt
                </span>
                {/* Glow under "prompt" */}
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />
              </span>
            </h2>

            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Describe your vision and let our AI generate stunning motion
              graphics. Customize or export instantly.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categoriesTemplate.map((category, index) => (
              <CategoryCard key={index} {...category} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Prompt;
