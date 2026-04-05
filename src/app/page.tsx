import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import FeaturedProjectsSection from "@/components/home/FeaturedProjectsSection";
import StatsSection from "@/components/home/StatsSection";
import CTASection from "@/components/home/CTASection";

export default function HomePage() {
  return (
    <div className="relative z-10">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <FeaturedProjectsSection />
      <HowItWorksSection />
      <CTASection />
    </div>
  );
}
