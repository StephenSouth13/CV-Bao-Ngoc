import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Send, Mail, Phone, MapPin, MessageCircle, Linkedin, Facebook, Twitter, Github, Instagram, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ContactRow {
  id: string;
  email: string;
  phone: string | null;
  location: string | null;
  map_embed_url: string | null;
}

const Contact = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  // Default contact info (shown to public users since contacts table is admin-only)
  const defaultContact: ContactRow = {
    id: "default",
    email: "",
    phone: null,
    location: null,
    map_embed_url: null
  };
  
  const [contact, setContact] = useState<ContactRow>(defaultContact);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase.from("contacts").select("*").limit(1).maybeSingle();
        // Only update if admin successfully fetches data (non-admins will get RLS error)
        if (data && !error) setContact(data as ContactRow);
      } catch (e) {
        // Silently use default contact info for non-admin users
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supabase.from("contact_submissions").insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        message: formData.message,
      });
      toast({
        title: "Tin nhắn đã được gửi!",
        description: "Cảm ơn bạn đã liên hệ. Tôi sẽ phản hồi sớm nhất có thể.",
      });
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (err: any) {
      console.error("Failed to save submission", err);
      toast({ title: "Lỗi", description: "Không thể gửi tin nhắn, thử lại sau", variant: "destructive" });
    }
  };

  const contactInfo = [
    { icon: Mail, label: "Email", value: contact?.email || "", href: contact?.email ? `mailto:${contact.email}` : null },
    { icon: Phone, label: "Phone", value: contact?.phone || "", href: contact?.phone ? `tel:${contact.phone}` : null },
    { icon: MapPin, label: "Location", value: contact?.location || "", href: null },
    { icon: MessageCircle, label: "WhatsApp", value: contact?.whatsapp || "", href: contact?.whatsapp ? `https://wa.me/${contact.whatsapp.replace(/[^0-9+]/g, '')}` : null }
  ].filter((i) => i.value);

  const socialList = [
    { provider: 'facebook', url: contact?.facebook_url },
    { provider: 'linkedin', url: contact?.linkedin_url },
    { provider: 'instagram', url: contact?.instagram_url },
    { provider: 'twitter', url: contact?.twitter_url },
    { provider: 'youtube', url: contact?.youtube_url },
    { provider: 'github', url: contact?.github_url },
    { provider: 'zalo', url: contact?.zalo_url },
    { provider: 'tiktok', url: contact?.tiktok_url },
  ].filter(s => s.url);

  return (
    <section id="contact" className="py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gradient text-center mb-4">
            Liên hệ
          </h2>
          <p className="text-center text-muted-foreground mb-12 lg:mb-16">
            Hãy kết nối và cùng nhau tạo nên những giá trị bền vững
          </p>

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-2xl font-bold mb-6">Thông tin liên hệ</h3>
                <p className="text-foreground/70 mb-8">
                  Tôi luôn sẵn sàng lắng nghe và thảo luận về các cơ hội hợp tác mới. 
                  Đừng ngần ngại liên hệ với tôi qua các kênh dưới đây.
                </p>
              </div>

              <div className="space-y-8">
                {/* Socials Section */}
                {socialList.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className=""
                  >
                    <h4 className="font-semibold mb-3">Mạng xã hội</h4>
                    <div className="flex items-center gap-3">
                      {socialList.map((s, idx) => {
                        const provider = (s.provider || '').toLowerCase();
                        let Icon: any = MessageCircle;
                        if (provider.includes('linkedin')) Icon = Linkedin;
                        else if (provider.includes('facebook')) Icon = Facebook;
                        else if (provider.includes('twitter')) Icon = Twitter;
                        else if (provider.includes('github') || provider.includes('git')) Icon = Github;
                        else if (provider.includes('instagram')) Icon = Instagram;
                        else if (provider.includes('youtube')) Icon = Youtube;

                        return (
                          <a key={idx} href={s.url} target="_blank" rel="noreferrer" className="p-2 rounded bg-card border border-border hover:border-primary transition">
                            <Icon className="h-5 w-5 text-primary" />
                          </a>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Info Section */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <h4 className="font-semibold mb-3">Thông tin</h4>
                  <div className="space-y-4">
                    {contactInfo.map((info, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <info.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{info.label}</p>
                          {info.href ? (
                            <a href={info.href} className="font-medium hover:text-primary transition-colors">{info.value}</a>
                          ) : (
                            <p className="font-medium">{info.value}</p>
                          )}
                        </div>
                      </div>
                    ))}

                    {contact.business_hours && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Giờ làm việc</p>
                        <p className="font-medium">{contact.business_hours}</p>
                      </div>
                    )}

                    {contact.tax_id && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Mã số thuế</p>
                        <p className="font-medium">{contact.tax_id}</p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Footer Section (contact-specific footer text) */}
                {contact.footer_text && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <h4 className="font-semibold mb-3">Footer</h4>
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium">{contact.footer_text}</p>
                    </div>
                  </motion.div>
                )}
              </div>

              {(() => {
                const raw = contact?.map_embed_url?.trim();
                const extractSrc = (input: string | null | undefined) => {
                  if (!input) return null;
                  if (input.startsWith("<")) {
                    const match = input.match(/src=["']([^"']+)["']/i);
                    return match ? match[1] : null;
                  }
                  const maybe = input.replace(/^\((.*)\)$/s, "$1");
                  return maybe || null;
                };
                const mapSrc = extractSrc(raw);
                return mapSrc ? (
                  <div className="rounded-lg overflow-hidden border border-border">
                    <iframe
                      src={mapSrc}
                      title="Google Map"
                      width="100%"
                      height="260"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  </div>
                ) : null;
              })()}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Họ và tên
                  </label>
                  <Input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="bg-card border-border focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    className="bg-card border-border focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">
                    Số điện thoại
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+84 123 456 789"
                    className="bg-card border-border focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Tin nhắn
                  </label>
                  <Textarea
                    id="message"
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Nội dung tin nhắn..."
                    rows={6}
                    className="bg-card border-border focus:border-primary resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full gold-gradient hover:opacity-90 transition-opacity text-background font-semibold"
                  size="lg"
                >
                  <Send className="mr-2 h-5 w-5" />
                  Gửi tin nhắn
                </Button>
              </form>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;
