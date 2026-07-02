import HeroSection from "@/components/home/HeroSection";
import FeaturedProjectsSection from "@/components/home/FeaturedProjectsSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import StatsSection from "@/components/home/StatsSection";

export default function HomePage() {
  return (
    <div className="relative z-10">
      <HeroSection />
      <FeaturedProjectsSection />
      <HowItWorksSection />
      <FeaturesSection />
      <StatsSection />
    </div>
  );
}
