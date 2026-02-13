import { GlassNav } from "@/components/landing/glass-nav";
import { HeroSection } from "@/components/landing/hero-section";
import { TrustBar } from "@/components/landing/trust-bar";
import { FeaturesBento } from "@/components/landing/features-bento";
import { ProjectGrid } from "@/components/landing/project-grid";
import { MonetizationSection } from "@/components/landing/monetization-section";
import { HighlightsSection } from "@/components/landing/highlights-section";
import { FinalCTA } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <div className="landing-page min-h-screen bg-background">
      <GlassNav />
      <main className="relative overflow-hidden pt-32">
        <HeroSection />
        <TrustBar />
        <FeaturesBento />
        <ProjectGrid />
        <MonetizationSection />
        <HighlightsSection />
        
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
