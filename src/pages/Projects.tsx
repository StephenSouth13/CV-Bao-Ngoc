import Header from "@/components/Header";
import ProjectsSection from "@/components/Projects";
import Footer from "@/components/Footer";
import FloatingChat from "@/components/FloatingChat";
import BackToTop from "@/components/BackToTop";
import SEOHead from "@/components/SEOHead";

const Projects = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Projects"
        description=""
      />
      <Header />
      <main className="pt-20">
        <ProjectsSection />
      </main>
      <Footer />
      <FloatingChat />
      <BackToTop />
    </div>
  );
};

export default Projects;
