import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import ImageUpload from "./ImageUpload";

const AdminHero = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [heroId, setHeroId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [quote, setQuote] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [showButtons, setShowButtons] = useState(true);
  const [showQuote, setShowQuote] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchHeroData();
  }, []);

  const fetchHeroData = async () => {
    try {
      const { data, error } = await supabase
        .from("hero_section")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setHeroId(data.id);
        setName(data.name);
        setTitle(data.title);
        setQuote(data.quote);
        setProfileImageUrl(data.profile_image_url || "");
        setBackgroundImageUrl(data.background_image_url || "");
        setShowButtons(data.show_buttons !== false);
        setShowQuote(data.show_quote !== false);
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (heroId) {
        const { error } = await supabase
          .from("hero_section")
          .update({
            name,
            title,
            quote,
            profile_image_url: profileImageUrl || null,
            background_image_url: backgroundImageUrl || null,
            show_buttons: showButtons,
            show_quote: showQuote,
            updated_at: new Date().toISOString(),
          })
          .eq("id", heroId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("hero_section")
          .insert({
            name,
            title,
            quote,
            profile_image_url: profileImageUrl || null,
            background_image_url: backgroundImageUrl || null,
            show_buttons: showButtons,
            show_quote: showQuote,
          })
          .select()
          .single();

        if (error) throw error;
        setHeroId(data.id);
      }

      toast({
        title: "Thành công",
        description: "Đã lưu thông tin Hero",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý Hero Banner</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Chức danh</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quote">Câu trích dẫn</Label>
            <Textarea
              id="quote"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-sm">Hiển thị trên trang</h3>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-quote" className="font-normal cursor-pointer">Hiển thị câu trích dẫn</Label>
              <Switch
                id="show-quote"
                checked={showQuote}
                onCheckedChange={setShowQuote}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-buttons" className="font-normal cursor-pointer">Hiển thị 2 nút (Liên hệ & Tải CV)</Label>
              <Switch
                id="show-buttons"
                checked={showButtons}
                onCheckedChange={setShowButtons}
              />
            </div>
          </div>

          <ImageUpload
            label="Ảnh đại diện"
            value={profileImageUrl}
            onChange={setProfileImageUrl}
            folder="hero"
            aspectRatio="square"
          />

          <ImageUpload
            label="Ảnh nền"
            value={backgroundImageUrl}
            onChange={setBackgroundImageUrl}
            folder="hero"
            aspectRatio="banner"
          />

          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminHero;
