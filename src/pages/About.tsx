import Header from "@/components/Header";
import AboutSection from "@/components/About";
import Certificates from "@/components/Certificates";
import Education from "@/components/Education";
import Experience from "@/components/Experience";
import Footer from "@/components/Footer";
import FloatingChat from "@/components/FloatingChat";
import BackToTop from "@/components/BackToTop";
import SEOHead from "@/components/SEOHead";

const About = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="About"
        description=""
      />
      <Header />
      <main className="pt-20">
        <AboutSection />
        <Certificates />
        <Education />
        <Experience />
      </main>
      <Footer />
      <FloatingChat />
      <BackToTop />
    </div>
  );
};

export default About;
