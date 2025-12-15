import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowDown, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolvePublicImageUrl } from "@/lib/utils";
import { getSignedUrlForValue } from "@/lib/imageHelpers";

const Hero = () => {
  const [heroData, setHeroData] = useState({
    name: "",
    title: "",
    quote: "",
    profile_image_url: null as string | null,
    background_image_url: null as string | null,
    show_buttons: true,
    show_quote: true,
  });

  useEffect(() => {
    fetchHeroData();
  }, []);

  const fetchHeroData = async () => {
    const { data } = await supabase
      .from("hero_section")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (data) {
      setHeroData({
        name: data.name,
        title: data.title,
        quote: data.quote,
        profile_image_url: data.profile_image_url,
        background_image_url: data.background_image_url,
        show_buttons: data.show_buttons !== false,
        show_quote: data.show_quote !== false,
      });
    }
  };

  const scrollToContact = () => {
    document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
  };

  const [displayProfileImage, setDisplayProfileImage] = useState<string | null>(null);
  const [displayBackgroundImage, setDisplayBackgroundImage] = useState<string | null>(null);

  useEffect(() => {
    // resolve profile image with fallback to signed url
    const pubProfile = resolvePublicImageUrl(heroData.profile_image_url);
    if (!pubProfile) {
      setDisplayProfileImage(null);
    } else {
      const img = new Image();
      img.onload = () => setDisplayProfileImage(pubProfile);
      img.onerror = async () => {
        const signed = await getSignedUrlForValue(heroData.profile_image_url);
        if (signed) {
          const img2 = new Image();
          img2.onload = () => setDisplayProfileImage(signed);
          img2.onerror = () => setDisplayProfileImage(null);
          img2.src = signed;
        } else {
          setDisplayProfileImage(null);
        }
      };
      img.src = pubProfile;
    }

    // resolve background image with fallback to signed url
    const pubBg = resolvePublicImageUrl(heroData.background_image_url);
    if (!pubBg) {
      setDisplayBackgroundImage(null);
    } else {
      const bgImg = new Image();
      bgImg.onload = () => setDisplayBackgroundImage(pubBg);
      bgImg.onerror = async () => {
        const signed = await getSignedUrlForValue(heroData.background_image_url);
        if (signed) {
          const bg2 = new Image();
          bg2.onload = () => setDisplayBackgroundImage(signed);
          bg2.onerror = () => setDisplayBackgroundImage(null);
          bg2.src = signed;
        } else {
          setDisplayBackgroundImage(null);
        }
      };
      bgImg.src = pubBg;
    }
  }, [heroData.profile_image_url, heroData.background_image_url]);

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: displayBackgroundImage
          ? `linear-gradient(rgba(15, 15, 15, 0.85), rgba(15, 15, 15, 0.85)), url(${displayBackgroundImage})`
          : "linear-gradient(rgba(15, 15, 15, 0.85), rgba(15, 15, 15, 0.85))",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/20 animate-pulse" style={{ animationDuration: '8s' }} />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Profile Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-gold-light rounded-full blur-lg opacity-75 animate-float" />
            {displayProfileImage && (
              <img
                src={displayProfileImage}
                alt={heroData.name}
                className="relative w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 rounded-full object-cover border-4 border-primary glow-gold"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </motion.div>

          {/* Name */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold text-gradient"
          >
            {heroData.name}
          </motion.h1>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-xl sm:text-2xl lg:text-3xl font-semibold text-foreground/90"
          >
            {heroData.title}
          </motion.h2>

          {/* Quote */}
          {heroData.show_quote && heroData.quote && (
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl italic border-l-4 border-primary pl-4 sm:pl-6"
            >
              "{heroData.quote}"
            </motion.p>
          )}

          {/* CTA Buttons */}
          {heroData.show_buttons && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Button
                size="lg"
                onClick={scrollToContact}
                className="gold-gradient hover:opacity-90 transition-opacity text-background font-semibold px-8"
              >
                Liên hệ ngay
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10 px-8"
                onClick={() => window.open("/CV.pdf", "_blank")}
              >
                <Download className="mr-2 h-5 w-5" />
                Tải CV
              </Button>
            </motion.div>
          )}

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <ArrowDown className="h-6 w-6 text-primary animate-bounce" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
