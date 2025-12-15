import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Contact {
  id: string;
  email: string;
  phone: string | null;
  location: string | null;
  map_embed_url: string | null;
}

const AdminContact = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [contact, setContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    location: "",
    map_embed_url: "",
    facebook_url: "",
    twitter_url: "",
    instagram_url: "",
    linkedin_url: "",
    youtube_url: "",
    github_url: "",
    zalo_url: "",
    tiktok_url: "",
    whatsapp: "",
    business_hours: "",
    tax_id: "",
    footer_text: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchContact();
  }, []);

  const fetchContact = async () => {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setContact(data);
        setFormData({
          email: data.email || "",
          phone: data.phone || "",
          location: data.location || "",
          map_embed_url: data.map_embed_url || "",
          facebook_url: data.facebook_url || "",
          twitter_url: data.twitter_url || "",
          instagram_url: data.instagram_url || "",
          linkedin_url: data.linkedin_url || "",
          youtube_url: data.youtube_url || "",
          github_url: data.github_url || "",
          zalo_url: data.zalo_url || "",
          tiktok_url: data.tiktok_url || "",
          whatsapp: data.whatsapp || "",
          business_hours: data.business_hours || "",
          tax_id: data.tax_id || "",
          footer_text: data.footer_text || "",
        });
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: any = {
        email: formData.email,
        phone: formData.phone || null,
        location: formData.location || null,
        map_embed_url: formData.map_embed_url || null,
        facebook_url: formData.facebook_url || null,
        twitter_url: formData.twitter_url || null,
        instagram_url: formData.instagram_url || null,
        linkedin_url: formData.linkedin_url || null,
        youtube_url: formData.youtube_url || null,
        github_url: formData.github_url || null,
        zalo_url: formData.zalo_url || null,
        tiktok_url: formData.tiktok_url || null,
        whatsapp: formData.whatsapp || null,
        business_hours: formData.business_hours || null,
        tax_id: formData.tax_id || null,
        footer_text: formData.footer_text || null,
        updated_at: new Date().toISOString(),
      };

      if (contact) {
        const { error } = await supabase.from("contacts").update(payload).eq("id", contact.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contacts").insert(payload);
        if (error) throw error;
      }

      toast({
        title: "Thành công",
        description: "Đã lưu thông tin liên hệ!",
      });

      fetchContact();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý Thông tin Liên hệ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+84 123 456 789"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Địa chỉ</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="Hà Nội, Việt Nam"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="map">Google Maps Embed URL</Label>
            <Textarea
              id="map"
              value={formData.map_embed_url}
              onChange={(e) => {
                const val = e.target.value;
                if (val.trim().startsWith("<")) {
                  const match = val.match(/src=["']([^"']+)["']/i);
                  setFormData({ ...formData, map_embed_url: match ? match[1] : "" });
                } else {
                  setFormData({ ...formData, map_embed_url: val });
                }
              }}
              placeholder="https://www.google.com/maps/embed?pb=..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Có thể dán trực tiếp toàn bộ thẻ iframe, hệ thống sẽ tự động lấy URL trong src="".
            </p>
            {formData.map_embed_url?.trim() && (
              <div className="mt-2 rounded-md overflow-hidden border border-border">
                <iframe
                  src={formData.map_embed_url}
                  title="Google Map Preview"
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Facebook URL</Label>
              <Input value={formData.facebook_url} onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })} placeholder="https://facebook.com/yourpage" />
            </div>
            <div>
              <Label>LinkedIn URL</Label>
              <Input value={formData.linkedin_url} onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/you" />
            </div>
            <div>
              <Label>Instagram URL</Label>
              <Input value={formData.instagram_url} onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })} placeholder="https://instagram.com/your" />
            </div>
            <div>
              <Label>Twitter URL</Label>
              <Input value={formData.twitter_url} onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })} placeholder="https://twitter.com/your" />
            </div>
            <div>
              <Label>YouTube URL</Label>
              <Input value={formData.youtube_url} onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })} placeholder="https://youtube.com/channel/.." />
            </div>
            <div>
              <Label>GitHub URL</Label>
              <Input value={formData.github_url} onChange={(e) => setFormData({ ...formData, github_url: e.target.value })} placeholder="https://github.com/your" />
            </div>
            <div>
              <Label>Zalo URL</Label>
              <Input value={formData.zalo_url} onChange={(e) => setFormData({ ...formData, zalo_url: e.target.value })} placeholder="https://zalo.me/.." />
            </div>
            <div>
              <Label>TikTok URL</Label>
              <Input value={formData.tiktok_url} onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })} placeholder="https://tiktok.com/@you" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label>WhatsApp (số)</Label>
              <Input value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} placeholder="+84123456789" />
            </div>
            <div>
              <Label>Giờ làm việc</Label>
              <Input value={formData.business_hours} onChange={(e) => setFormData({ ...formData, business_hours: e.target.value })} placeholder="Thứ 2 - Thứ 6: 9:00 - 18:00" />
            </div>
            <div>
              <Label>Mã số thuế</Label>
              <Input value={formData.tax_id} onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })} placeholder="0102030405" />
            </div>
            <div>
              <Label>Footer text</Label>
              <Input value={formData.footer_text} onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })} placeholder="© 2025 My Company — All rights reserved." />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            "Lưu thông tin"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminContact;
