import HeroSection from "@/components/home/HeroSection";
import FeaturedProjectsSection from "@/components/home/FeaturedProjectsSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import FeaturesSection from "@/components/home/FeaturesSection";

export default function HomePage() {
  return (
    <div className="relative z-10">
      <HeroSection />
      <FeaturedProjectsSection />
      <HowItWorksSection />
      <FeaturesSection />
    </div>
  );
}
