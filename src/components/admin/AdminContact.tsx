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
      if (contact) {
        // Update existing
        const { error } = await supabase
          .from("contacts")
          .update({
            email: formData.email,
            phone: formData.phone,
            location: formData.location,
            map_embed_url: formData.map_embed_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", contact.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase.from("contacts").insert({
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          map_embed_url: formData.map_embed_url,
        });

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
