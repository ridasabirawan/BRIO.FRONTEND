import { AccordionComponent } from "@/components/homepage/accordion-component";
import HeroSection from "@/components/homepage/hero-section";
import MarketingCards from "@/components/homepage/marketing-cards";
import Pricing from "@/components/homepage/pricing";
import SideBySide from "@/components/homepage/side-by-side";
import PageWrapper from "@/components/wrapper/page-wrapper";
import Reveal from "@/components/animations/reveal";

export default function Home() {
  return (
    <PageWrapper>
      <div className="flex flex-col justify-center items-center w-full mt-[1rem] p-3">
        <HeroSection />
      </div>
      <Reveal className="flex my-[8rem] w-full justify-center items-center">
        <SideBySide />
      </Reveal>
      <Reveal className="flex flex-col p-2 w-full justify-center items-center">
        <MarketingCards />
      </Reveal>
      <Reveal className="flex justify-center items-center w-full mt-[4rem]">
        <Pricing />
      </Reveal>
      <Reveal className="flex justify-center items-center w-full my-[8rem]">
        <AccordionComponent />
      </Reveal>
    </PageWrapper>
  );
}
