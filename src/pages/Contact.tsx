import Header from "@/components/Header";
import ContactSection from "@/components/Contact";
import Footer from "@/components/Footer";
import FloatingChat from "@/components/FloatingChat";
import BackToTop from "@/components/BackToTop";
import SEOHead from "@/components/SEOHead";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Contact"
        description=""
      />
      <Header />
      <main className="pt-20">
        <ContactSection />
      </main>
      <Footer />
      <FloatingChat />
      <BackToTop />
    </div>
  );
};

export default Contact;
