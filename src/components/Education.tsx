import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { GraduationCap, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  year: string;
  description?: string;
  achievements?: string[];
  sort_order: number;
}

const Education = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [education, setEducation] = useState<EducationItem[]>([]);

  useEffect(() => {
    const fetchEducation = async () => {
      const { data, error } = await supabase
        .from("education")
        .select("*")
        .order("sort_order", { ascending: true });

      if (!error && data) {
        setEducation(data);
      }
    };

    fetchEducation();
  }, []);

  if (education.length === 0) return null;

  return (
    <section className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gradient text-center">
              Học vấn
            </h2>
          </div>
          <p className="text-center text-muted-foreground mb-12 lg:mb-16 max-w-2xl mx-auto">
            Hành trình học tập và phát triển chuyên môn
          </p>

          <div className="max-w-4xl mx-auto space-y-8">
            {education.map((edu, index) => (
              <motion.div
                key={edu.id}
                initial={{ opacity: 0, x: -50 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                <div className="glass-card p-6 sm:p-8 hover:shadow-glow transition-all duration-300 group">
                  {/* Timeline indicator */}
                  <div className="absolute left-0 top-8 w-1 h-full bg-gradient-to-b from-primary to-primary/20 -translate-x-8 hidden lg:block" />
                  <div className="absolute left-0 top-8 w-4 h-4 rounded-full bg-primary -translate-x-10 hidden lg:block" />

                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl sm:text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {edu.degree}
                      </h3>
                      <p className="text-lg font-semibold text-muted-foreground mb-1">
                        {edu.institution}
                      </p>
                      {edu.field && (
                        <p className="text-sm text-muted-foreground">
                          Chuyên ngành: {edu.field}
                        </p>
                      )}
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm sm:text-base whitespace-nowrap">
                      {edu.year}
                    </div>
                  </div>

                  {edu.description && (
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {edu.description}
                    </p>
                  )}

                  {edu.achievements && edu.achievements.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Award className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Thành tích nổi bật</h4>
                      </div>
                      <ul className="space-y-2">
                        {edu.achievements.map((achievement, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={isInView ? { opacity: 1, x: 0 } : {}}
                            transition={{ duration: 0.4, delay: index * 0.1 + i * 0.05 }}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <span className="text-primary mt-1">•</span>
                            <span>{achievement}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Education;
