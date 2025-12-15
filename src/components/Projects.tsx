import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  image_url?: string;
  metrics?: any;
  slug?: string | null;
  featured?: boolean;
}

const Projects = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isHomePage = location.pathname === "/";
  const { toast } = useToast();

  const [filtersEnabled, setFiltersEnabled] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [isHomePage, selectedCategory, filtersEnabled]);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from("settings").select("value").eq("key", "projects_filters_enabled").maybeSingle();
      if (data && data.value === "true") setFiltersEnabled(true);
      else setFiltersEnabled(false);
    } catch (err) {
      setFiltersEnabled(true);
    }
  };

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      let query: any = supabase.from("projects").select("*");

      // Prefer ordering if available
      try {
        query = query.order("sort_order", { ascending: true });
      } catch (e) {
        // ignore ordering errors
      }

      if (isHomePage) {
        try {
          query = query.eq("featured", true).limit(4);
        } catch (e) {
          // featured may not exist; fallback to limit only
          query = query.limit(4);
        }
      } else if (filtersEnabled && selectedCategory) {
        try {
          query = query.eq("category", selectedCategory);
        } catch (e) {
          // category might not exist
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching projects:", error);
        toast({ title: "Lỗi tải dự án", description: error.message || String(error), variant: "destructive" });
        // fallback: try simple select without filters
        try {
          const { data: fallback } = await supabase.from("projects").select("*");
          setProjects(fallback || []);
        } catch (e) {
          setProjects([]);
        }
        return;
      }

      setProjects(data || []);
    } catch (error: any) {
      console.error("Error fetching projects:", error);
      toast({ title: "Lỗi tải dự án", description: error.message || String(error), variant: "destructive" });
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section id="projects" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="projects" className="py-20 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4"
      >
        <div className="flex flex-col md:flex-row items-center justify-between mb-4">
          <h2 className="text-3xl md:text-4xl font-bold">
            {isHomePage ? t("featuredProjects") : t("allProjects")}
          </h2>
          {!isHomePage && filtersEnabled && (
            <div className="mt-4 md:mt-0">
              <label className="text-sm mr-2">Lọc theo danh mục:</label>
              <select value={selectedCategory || ""} onChange={(e) => setSelectedCategory(e.target.value || null)} className="bg-card border-border px-3 py-2 rounded">
                <option value="">Tất cả</option>
                {Array.from(new Set(projects.map(p => p.category).filter(Boolean))).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        {isHomePage && (
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Khám phá những dự án tiêu biểu mà tôi đã thực hiện
          </p>
        )}

        <div className={`grid gap-6 md:gap-8 max-w-7xl mx-auto ${
          isHomePage 
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" 
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        }`}>
          {projects.length === 0 ? (
            <div className={`${isHomePage ? 'col-span-1 sm:col-span-2 lg:col-span-4' : 'col-span-1 md:col-span-2 lg:col-span-3'} text-center text-muted-foreground py-12`}>
              Không có dự án để hiển thị.
            </div>
          ) : (
            projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                <Card className="h-full hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
                  {project.image_url && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={project.image_url}
                        alt={project.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute top-4 right-4">
                        <span className="bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                          {project.category}
                        </span>
                      </div>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{project.title}</CardTitle>
                    {!project.image_url && (
                      <CardDescription className="text-sm">
                        {project.category}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{project.description}</p>

                    {project.metrics && project.metrics.length > 0 && (
                      <div className="grid grid-cols-2 gap-4">
                        {project.metrics.map((metric, i) => (
                          <div key={i} className="text-center p-3 bg-accent/50 rounded-lg">
                            <div className="text-2xl font-bold text-primary">
                              {metric.value}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {metric.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-4">
                      <Button variant="outline" asChild>
                        <Link to={`/projects/${project.slug || project.id}`}>
                          {t("viewDetails")}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {isHomePage && projects.length === 4 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-center mt-12"
          >
            <Button asChild size="lg">
              <Link to="/projects">{t("viewMore")}</Link>
            </Button>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
};

export default Projects;
