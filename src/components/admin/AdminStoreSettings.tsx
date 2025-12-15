import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Store, Save } from "lucide-react";

const AdminStoreSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [storeName, setStoreName] = useState("Cửa hàng");
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "store_name")
        .single();

      if (!error && data) {
        setStoreName(data.value);
      }
    } catch (error) {
      console.error("Error fetching store settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("settings")
        .upsert(
          { key: "store_name", value: storeName, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã lưu cài đặt cửa hàng",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu cài đặt",
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
          <Store className="h-5 w-5" />
          Cài đặt Cửa hàng
        </CardTitle>
        <CardDescription>
          Tùy chỉnh tên hiển thị của cửa hàng trên header
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storeName">Tên cửa hàng (hiển thị trên menu)</Label>
            <Input
              id="storeName"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="VD: Cửa hàng, Khóa học, Shop..."
              required
            />
            <p className="text-sm text-muted-foreground">
              Tên này sẽ hiển thị trên thanh điều hướng thay vì "Cửa hàng"
            </p>
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

export default AdminStoreSettings;