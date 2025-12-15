import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Save, Menu, Eye, EyeOff } from "lucide-react";

interface NavigationItem {
  key: string;
  label: string;
  path: string;
  visible: boolean;
}

const defaultNavItems: NavigationItem[] = [
  { key: "home", label: "Trang chủ", path: "/", visible: true },
  { key: "about", label: "Giới thiệu", path: "/about", visible: true },
  { key: "projects", label: "Dự án", path: "/projects", visible: true },
  { key: "blog", label: "Blog", path: "/blog", visible: true },
  { key: "store", label: "Cửa hàng", path: "/store", visible: true },
  { key: "contact", label: "Liên hệ", path: "/contact", visible: true },
];

const AdminNavigationSettings = () => {
  const queryClient = useQueryClient();
  const [navItems, setNavItems] = useState<NavigationItem[]>(defaultNavItems);

  const { data: savedSettings, isLoading } = useQuery({
    queryKey: ["navigation-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("key", "navigation_visibility")
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }
      return data?.value ? JSON.parse(data.value) : null;
    },
  });

  useEffect(() => {
    if (savedSettings) {
      setNavItems(
        defaultNavItems.map((item) => ({
          ...item,
          visible: savedSettings[item.key] !== false,
        }))
      );
    }
  }, [savedSettings]);

  const saveMutation = useMutation({
    mutationFn: async (items: NavigationItem[]) => {
      const visibilityMap = items.reduce(
        (acc, item) => ({
          ...acc,
          [item.key]: item.visible,
        }),
        {}
      );

      const { data: existing } = await supabase
        .from("settings")
        .select("id")
        .eq("key", "navigation_visibility")
        .single();

      if (existing) {
        const { error } = await supabase
          .from("settings")
          .update({ value: JSON.stringify(visibilityMap), updated_at: new Date().toISOString() })
          .eq("key", "navigation_visibility");
        if (error) throw error;
      } else {
        const { error } = await supabase.from("settings").insert({
          key: "navigation_visibility",
          value: JSON.stringify(visibilityMap),
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navigation-settings"] });
      toast({
        title: "Đã lưu",
        description: "Cài đặt điều hướng đã được cập nhật",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể lưu cài đặt",
        variant: "destructive",
      });
    },
  });

  const toggleVisibility = (key: string) => {
    setNavItems((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, visible: !item.visible } : item
      )
    );
  };

  const handleSave = () => {
    saveMutation.mutate(navItems);
  };

  if (isLoading) {
    return <div className="p-4">Đang tải...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Menu className="h-5 w-5" />
          Quản lý Menu Điều hướng
        </CardTitle>
        <CardDescription>
          Bật/tắt các mục menu hiển thị trên header của website
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {navItems.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {item.visible ? (
                  <Eye className="h-4 w-4 text-green-500" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <Label className="text-base font-medium">{item.label}</Label>
                  <p className="text-sm text-muted-foreground">{item.path}</p>
                </div>
              </div>
              <Switch
                checked={item.visible}
                onCheckedChange={() => toggleVisibility(item.key)}
                disabled={item.key === "home"}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Đang lưu..." : "Lưu cài đặt"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminNavigationSettings;
