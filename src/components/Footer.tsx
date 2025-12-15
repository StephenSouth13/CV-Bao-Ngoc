import { motion } from "framer-motion";
import { Linkedin, Facebook, MessageCircle, Twitter, Github, Instagram, Youtube } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FooterLink { id: string; section: string; label: string; url: string; sort_order: number; }
interface SocialRow { id: string; provider: string; url: string; sort_order: number }

const Footer = () => {
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [socials, setSocials] = useState<SocialRow[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const sb: any = supabase;
        const { data } = await sb
          .from("footer_links")
          .select("*")
          .order("section", { ascending: true })
          .order("sort_order", { ascending: true });
        setLinks(data || []);
      } catch {
        setLinks([]);
      }

      try {
        const sb: any = supabase;
        const { data } = await sb.from("social_links").select("*").order("sort_order", { ascending: true });
        setSocials(data || []);
      } catch {
        setSocials([]);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const sb: any = supabase;
        const { data } = await sb
          .from("footer_links")
          .select("*")
          .order("section", { ascending: true })
          .order("sort_order", { ascending: true });
        setLinks(data || []);
      } catch {
        setLinks([]);
      }
    };
    load();
  }, []);

  const sections = useMemo(() => {
    const map = new Map<string, FooterLink[]>();
    for (const l of links) {
      const arr = map.get(l.section) || [];
      arr.push(l);
      map.set(l.section, arr);
    }
    return Array.from(map.entries());
  }, [links]);

  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-background border-t border-primary/20">
      <div className="absolute top-0 left-0 right-0 h-1 gold-gradient" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center space-y-6"
        >
          <div className="text-2xl font-bold text-gradient"></div>

          <div className="flex items-center gap-4">
            {(socials.length > 0 ? socials : [
              { id: "fallback-linkedin", provider: "linkedin", url: "https://linkedin.com", sort_order: 0 },
              { id: "fallback-facebook", provider: "facebook", url: "https://facebook.com", sort_order: 1 },
              { id: "fallback-zalo", provider: "zalo", url: "https://zalo.me", sort_order: 2 },
            ]).map((s, index) => {
              const provider = (s.provider || "").toLowerCase();
              let Icon: any = MessageCircle;
              if (provider.includes("linkedin")) Icon = Linkedin;
              else if (provider.includes("facebook")) Icon = Facebook;
              else if (provider.includes("twitter")) Icon = Twitter;
              else if (provider.includes("github") || provider.includes("git")) Icon = Github;
              else if (provider.includes("instagram")) Icon = Instagram;
              else if (provider.includes("youtube")) Icon = Youtube;

              return (
                <motion.a
                  key={s.id}
                  href={(s as any).url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                  className="p-3 rounded-full bg-card border border-border hover:border-primary hover:bg-primary/10 transition-all duration-300 glow-gold"
                  aria-label={provider}
                >
                  <Icon className="h-5 w-5 text-primary" />
                </motion.a>
              );
            })}
          </div>
        </motion.div>

        {sections.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {sections.map(([title, items], idx) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
              >
                <h4 className="font-semibold mb-3 text-primary">{title}</h4>
                <ul className="space-y-2 text-sm">
                  {items.map((l) => (
                    <li key={l.id}>
                      <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center text-sm text-muted-foreground"
        >
          <p>© {year}. All rights reserved.</p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
