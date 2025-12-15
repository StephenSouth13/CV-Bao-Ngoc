import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit, Trash2, X, Check } from "lucide-react";
import AdminSocial from "@/components/admin/AdminSocial";

interface FooterLink {
  id: string;
  section: string;
  label: string;
  url: string;
  sort_order: number;
}

const AdminFooter = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    section: "",
    label: "",
    url: "",
    sort_order: 0,
  });
  const [tableMissing, setTableMissing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setIsLoading(true);
    setTableMissing(false);
    try {
      const sb: any = supabase;
      const { data, error } = await sb
        .from("footer_links")
        .select("*")
        .order("section", { ascending: true })
        .order("sort_order", { ascending: true });

      if (error) {
        if (String(error.message || "").toLowerCase().includes("relation") || error.code === "42P01") {
          setTableMissing(true);
        } else {
          throw error;
        }
      }
      setLinks(data || []);
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.message || "Không thể tải footer", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNew = () => {
    setEditingId("new");
    setFormData({ section: "", label: "", url: "", sort_order: (links[links.length - 1]?.sort_order ?? 0) + 1 });
  };

  const handleEdit = (item: FooterLink) => {
    setEditingId(item.id);
    setFormData({ section: item.section, label: item.label, url: item.url, sort_order: item.sort_order });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ section: "", label: "", url: "", sort_order: 0 });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const sb: any = supabase;
      if (editingId === "new") {
        const { error } = await sb.from("footer_links").insert({ ...formData });
        if (error) throw error;
        toast({ title: "Thành công", description: "Đã thêm liên kết" });
      } else {
        const { error } = await sb
          .from("footer_links")
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq("id", editingId);
        if (error) throw error;
        toast({ title: "Thành công", description: "Đã cập nhật liên kết" });
      }
      handleCancel();
      await fetchLinks();
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.message || "Không thể lưu", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const sb: any = supabase;
      const { error } = await sb.from("footer_links").delete().eq("id", id);
      if (error) throw error;
      await fetchLinks();
      toast({ title: "Thành công", description: "Đã xóa liên kết" });
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.message || "Không thể xóa", variant: "destructive" });
    }
  };

  const sections = useMemo(() => {
    const map = new Map<string, FooterLink[]>();
    for (const l of links) {
      const arr = map.get(l.section) || [];
      arr.push(l);
      map.set(l.section, arr);
    }
    return Array.from(map.entries());
  }, [links]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Quản lý Footer Links</CardTitle>
          {!editingId && (
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" /> Thêm liên kết
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {tableMissing && (
          <div className="p-4 border border-destructive rounded-md">
            <p className="text-sm mb-2">Bảng footer_links chưa tồn tại. Tạo trong Supabase với câu lệnh:</p>
            <pre className="text-xs whitespace-pre-wrap bg-muted p-3 rounded">{`create table if not exists public.footer_links (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  label text not null,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz
);`}</pre>
          </div>
        )}

        {editingId && (
          <form onSubmit={handleSave} className="space-y-4 border border-gold/20 p-4 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="section">Nhóm</Label>
                <Input id="section" value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Tiêu đề</Label>
                <Input id="label" value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Liên kết</Label>
                <Input id="url" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort">Thứ tự</Label>
                <Input id="sort" type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...</>) : (<><Check className="mr-2 h-4 w-4"/> Lưu</>)}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" /> Hủy
              </Button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="space-y-6">
            {sections.length === 0 && !editingId && (
              <p className="text-sm text-muted-foreground">Chưa có liên kết nào.</p>
            )}
            {sections.map(([sectionName, items]) => (
              <div key={sectionName} className="border border-gold/20 rounded-md">
                <div className="px-4 py-2 border-b border-border bg-card/50 font-medium">{sectionName}</div>
                <div className="divide-y divide-border">
                  {items.map((item) => (
                    <div key={item.id} className="px-4 py-3 flex items-center gap-4 justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.label}</div>
                        <div className="text-xs text-muted-foreground truncate">{item.url}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Embedded social links admin for convenience */}
        <div className="pt-6">
          <h3 className="text-lg font-medium mb-3">Quản lý Mạng xã hội</h3>
          <AdminSocial />
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminFooter;
