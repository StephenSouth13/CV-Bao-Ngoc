import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { BadgeInfo, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AboutRecord {
  id: string;
  headline: string;
  description: string;
  image_url: string | null;
}

interface Skill {
  id: string;
  name: string;
  sort_order: number | null;
}

const About = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [about, setAbout] = useState<AboutRecord | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [aboutRes, skillsRes] = await Promise.all([
          supabase.from("about_section").select("*").limit(1).maybeSingle(),
          supabase.from("skills").select("*").order("sort_order", { ascending: true }),
        ]);
        if (aboutRes.data) setAbout(aboutRes.data as AboutRecord);
        if (skillsRes.data) setSkills(skillsRes.data as Skill[]);
      } catch (e) {
        console.error("Failed to load about/skills", e);
      }
    };
    load();
  }, []);

  const displayImage = about?.image_url;

  return (
    <section id="about" className="py-20 lg:py-32 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gradient text-center mb-12 lg:mb-16">
            Về tôi
          </h2>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex justify-center"
            >
              {displayImage && (
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary to-gold-light rounded-2xl blur-xl opacity-30" />
                <img
                  src={displayImage}
                  alt="Ảnh hồ sơ"
                  className="relative w-full max-w-md rounded-2xl shadow-2xl border-2 border-primary/20"
                />
              </div>
            )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-6"
            >
              {about?.headline && (
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-5 w-5" />
                  <h3 className="text-xl font-semibold">{about.headline}</h3>
                </div>
              )}

              {about?.description && (
                <p className="text-base sm:text-lg text-foreground/90 leading-relaxed">
                  {about.description}
                </p>
              )}

              {skills.length > 0 && (
                <div className="grid grid-cols-2 gap-4 pt-6">
                  {skills.map((skill, index) => (
                    <motion.div
                      key={skill.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ duration: 0.5, delay: 0.6 + index * 0.08 }}
                      className="group relative p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary to-gold-light opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-300" />
                      <BadgeInfo className="h-8 w-8 text-primary mb-3" />
                      <h3 className="font-semibold text-sm sm:text-base text-foreground">
                        {skill.name}
                      </h3>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;
