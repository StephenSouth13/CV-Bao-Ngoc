import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ImageUpload from "./ImageUpload";
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
  const [siteLogoUrl, setSiteLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [deleteStartDate, setDeleteStartDate] = useState<string>("");
  const [deleteEndDate, setDeleteEndDate] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", ["site_logo", "site_logo_url", "favicon_url"]);

      if (!error && data) {
        for (const row of data) {
          if (row.key === "site_logo") setSiteLogo(row.value);
          if (row.key === "site_logo_url") setSiteLogoUrl(row.value);
          if (row.key === "favicon_url") setFaviconUrl(row.value);
        }
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
      // Upsert multiple settings: site_logo (text), site_logo_url, favicon_url
      const updates = [
        { key: "site_logo", value: siteLogo, updated_at: new Date().toISOString() },
        { key: "site_logo_url", value: siteLogoUrl || null, updated_at: new Date().toISOString() },
        { key: "favicon_url", value: faviconUrl || null, updated_at: new Date().toISOString() },
      ];

      const { error } = await supabase.from("settings").upsert(updates, { onConflict: "key" });
      if (error) throw error;

      // Update favicon immediately
      try {
        if (faviconUrl) {
          const link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
          if (link) link.href = faviconUrl;
        }
      } catch (e) {
        // ignore
      }

      // Dispatch event so other components can react
      window.dispatchEvent(new Event('site-logo-changed'));

      toast({ title: "Thành công", description: "Đã cập nhật logo và favicon" });
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Logo ảnh (upload)</Label>
              <ImageUpload
                label="Logo trang web"
                value={siteLogoUrl}
                onChange={(url) => setSiteLogoUrl(url)}
                folder="logos"
              />
            </div>

            <div>
              <Label>Favicon</Label>
              <ImageUpload
                label="Favicon (ico/png)"
                value={faviconUrl}
                onChange={(url) => setFaviconUrl(url)}
                folder="favicons"
                aspectRatio="square"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteLogo">Logo văn bản (nếu không dùng ảnh)</Label>
            <Input
              id="siteLogo"
              value={siteLogo}
              onChange={(e) => setSiteLogo(e.target.value)}
              placeholder="VD: TBL, MyBrand, ABC..."
              maxLength={50}
            />
            <p className="text-sm text-muted-foreground">Logo này sẽ hiển thị ở phía bên trái thanh điều hướng nếu không có ảnh</p>
          </div>

          <div className="space-y-2">
            <Label>Xem trước</Label>
            <div className="border border-border rounded-md p-4 bg-muted/30">
              {siteLogoUrl ? (
                <img src={siteLogoUrl} alt="Logo" className="h-12 object-contain" />
              ) : (
                <div className="text-xl lg:text-2xl font-bold text-gradient">{siteLogo || "TBL"}</div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
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

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label>Xóa từ ngày</Label>
                <input
                  type="date"
                  value={deleteStartDate}
                  onChange={(e) => setDeleteStartDate(e.target.value)}
                  className="input"
                />
              </div>

              <div className="flex items-center gap-2">
                <Label>đến ngày</Label>
                <input
                  type="date"
                  value={deleteEndDate}
                  onChange={(e) => setDeleteEndDate(e.target.value)}
                  className="input"
                />
              </div>

              <Button variant="destructive" type="button" onClick={async () => {
                // Confirm action
                if (!deleteStartDate && !deleteEndDate) {
                  if (!confirm('Bạn chưa chọn khoảng ngày — thao tác này sẽ xóa toàn bộ dữ liệu đơn hàng. Tiếp tục?')) return;
                } else {
                  if (!confirm(`Xóa dữ liệu đơn hàng từ ${deleteStartDate || 'the beginning'} đến ${deleteEndDate || 'nay'}?`)) return;
                }

                try {
                  // Build query to fetch order ids in range
                  let query = supabase.from('orders').select('id');
                  if (deleteStartDate) {
                    const startIso = new Date(deleteStartDate).toISOString();
                    query = query.gte('created_at', startIso);
                  }
                  if (deleteEndDate) {
                    // include whole day
                    const endIso = new Date(deleteEndDate + 'T23:59:59').toISOString();
                    query = query.lte('created_at', endIso);
                  }

                  const { data: ordersToDelete, error: fetchErr } = await query;
                  if (fetchErr) throw fetchErr;

                  const orderIds = (ordersToDelete || []).map((o: any) => o.id).filter(Boolean);

                  if (orderIds.length === 0) {
                    toast({ title: 'Không có dữ liệu', description: 'Không tìm thấy đơn hàng trong khoảng ngày đã chọn.' });
                    return;
                  }

                  // Delete order_items for those orders first
                  const { error: delItemsErr } = await supabase.from('order_items').delete().in('order_id', orderIds);
                  if (delItemsErr) throw delItemsErr;

                  // Then delete orders
                  const { error: delOrdersErr } = await supabase.from('orders').delete().in('id', orderIds);
                  if (delOrdersErr) throw delOrdersErr;

                  toast({ title: 'Đã xóa', description: `Đã xóa ${orderIds.length} đơn hàng và dữ liệu liên quan.` });
                } catch (err: any) {
                  toast({ title: 'Lỗi', description: err.message || 'Không thể xóa dữ liệu', variant: 'destructive' });
                }
              }}>
                Xóa dữ liệu doanh thu (theo ngày)
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminLogoSettings;
