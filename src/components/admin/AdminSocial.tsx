import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit, Trash2, X, Check } from "lucide-react";

interface SocialLink {
  id: string;
  provider: string;
  url: string;
  sort_order: number;
}

const DEFAULT_PROVIDERS = ["linkedin", "facebook", "twitter", "github", "instagram", "youtube", "zalo"];

const AdminSocial = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ provider: "", url: "", sort_order: 0 });
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
      const { data, error } = await sb.from("social_links").select("*").order("sort_order", { ascending: true });
      if (error) {
        if (String(error.message || "").toLowerCase().includes("relation") || error.code === "42P01") {
          setTableMissing(true);
        } else {
          throw error;
        }
      }
      setLinks(data || []);
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.message || "Không thể tải danh sách mạng xã hội", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNew = () => {
    setEditingId("new");
    setFormData({ provider: "", url: "", sort_order: (links[links.length - 1]?.sort_order ?? 0) + 1 });
  };

  const handleEdit = (item: SocialLink) => {
    setEditingId(item.id);
    setFormData({ provider: item.provider, url: item.url, sort_order: item.sort_order });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ provider: "", url: "", sort_order: 0 });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const sb: any = supabase;
      if (editingId === "new") {
        const { error } = await sb.from("social_links").insert({ ...formData });
        if (error) throw error;
        toast({ title: "Thành công", description: "Đã thêm liên kết mạng xã hội" });
      } else {
        const { error } = await sb.from("social_links").update({ ...formData, updated_at: new Date().toISOString() }).eq("id", editingId);
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
      const { error } = await sb.from("social_links").delete().eq("id", id);
      if (error) throw error;
      await fetchLinks();
      toast({ title: "Thành công", description: "Đã xóa liên kết" });
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.message || "Không thể xóa", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Quản lý Social Links</CardTitle>
          {!editingId && (
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" /> Thêm
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {tableMissing && (
          <div className="p-4 border border-destructive rounded-md">
            <p className="text-sm mb-2">Bảng social_links chưa tồn tại. T��o trong Supabase với câu lệnh:</p>
            <pre className="text-xs whitespace-pre-wrap bg-muted p-3 rounded">{`create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz
);`}</pre>
          </div>
        )}

        {editingId && (
          <form onSubmit={handleSave} className="space-y-4 border border-gold/20 p-4 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="provider">Loại</Label>
                <Input id="provider" value={formData.provider} onChange={(e) => setFormData({ ...formData, provider: e.target.value })} placeholder="linkedin, facebook, twitter, github..." required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
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
          <div className="space-y-4">
            {links.length === 0 && !editingId && (
              <p className="text-sm text-muted-foreground">Chưa có liên kết mạng xã hội nào. Thêm bằng nút Thêm.</p>
            )}
            {links.map((l) => (
              <div key={l.id} className="p-3 border border-gold/20 rounded-md flex items-center justify-between">
                <div>
                  <div className="font-medium">{l.provider}</div>
                  <div className="text-xs text-muted-foreground truncate">{l.url}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(l)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(l.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminSocial;
