import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Image, Save } from "lucide-react";

const AdminLogoSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [siteLogo, setSiteLogo] = useState("TBL");
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "site_logo")
        .single();

      if (!error && data) {
        setSiteLogo(data.value);
      }
    } catch (error) {
      console.error("Error fetching site logo settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (!siteLogo.trim()) {
        toast({
          title: "Lỗi",
          description: "Logo không được để trống",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const { error } = await supabase
        .from("settings")
        .upsert(
          { key: "site_logo", value: siteLogo, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã cập nhật logo trang web",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật logo",
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
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Cài đặt Logo
        </CardTitle>
        <CardDescription>
          Tùy chỉnh logo hiển thị trên header của trang web
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="siteLogo">Logo trang web</Label>
            <Input
              id="siteLogo"
              value={siteLogo}
              onChange={(e) => setSiteLogo(e.target.value)}
              placeholder="VD: TBL, MyBrand, ABC..."
              required
              maxLength={50}
            />
            <p className="text-sm text-muted-foreground">
              Logo này sẽ hiển thị ở phía bên trái thanh điều hướng
            </p>
          </div>

          <div className="space-y-2">
            <Label>Xem trước</Label>
            <div className="border border-border rounded-md p-4 bg-muted/30">
              <div className="text-xl lg:text-2xl font-bold text-gradient">
                {siteLogo || "TBL"}
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Lưu thay đổi
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminLogoSettings;
