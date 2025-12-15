import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, X } from "lucide-react";
import SortableList from "./SortableList";

interface Experience {
  id: string;
  year: string;
  title: string;
  company: string;
  location: string;
  description: string;
  achievements: string[];
  sort_order: number;
}

const AdminExperiences = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    year: "",
    title: "",
    company: "",
    location: "",
    description: "",
    achievements: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    try {
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setExperiences(data || []);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách kinh nghiệm",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (exp: Experience) => {
    setEditingId(exp.id);
    setFormData({
      year: exp.year,
      title: exp.title,
      company: exp.company,
      location: exp.location || "",
      description: exp.description || "",
      achievements: exp.achievements.join("\n"),
    });
  };

  const handleNew = () => {
    setEditingId("new");
    setFormData({
      year: "",
      title: "",
      company: "",
      location: "",
      description: "",
      achievements: "",
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      year: "",
      title: "",
      company: "",
      location: "",
      description: "",
      achievements: "",
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const achievementsArray = formData.achievements
        .split("\n")
        .filter(a => a.trim())
        .map(a => a.trim());

      if (editingId === "new") {
        const maxOrder = experiences.length > 0 ? Math.max(...experiences.map(e => e.sort_order)) : 0;
        
        const { error } = await supabase
          .from("experiences")
          .insert({
            ...formData,
            achievements: achievementsArray,
            sort_order: maxOrder + 1,
          });

        if (error) throw error;
        toast({ title: "Thành công", description: "Đã thêm kinh nghiệm mới" });
      } else {
        const { error } = await supabase
          .from("experiences")
          .update({
            ...formData,
            achievements: achievementsArray,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId);

        if (error) throw error;
        toast({ title: "Thành công", description: "Đã cập nhật kinh nghiệm" });
      }

      handleCancel();
      await fetchExperiences();
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

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("experiences")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await fetchExperiences();
      toast({ title: "Thành công", description: "Đã xóa kinh nghiệm" });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa",
        variant: "destructive",
      });
    }
  };

  const handleReorder = async (reorderedItems: Experience[]) => {
    setExperiences(reorderedItems);
    
    try {
      for (let i = 0; i < reorderedItems.length; i++) {
        await supabase
          .from("experiences")
          .update({ sort_order: i })
          .eq("id", reorderedItems[i].id);
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thứ tự",
        variant: "destructive",
      });
      fetchExperiences();
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
        <div className="flex justify-between items-center">
          <CardTitle>Quản lý Kinh nghiệm</CardTitle>
          {!editingId && (
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" /> Thêm mới
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {editingId && (
          <form onSubmit={handleSave} className="space-y-4 border border-gold/20 p-4 rounded-md">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Năm</Label>
                <Input
                  id="year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Địa điểm</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Chức vụ</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Công ty</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="achievements">Thành tựu (mỗi dòng 1 thành tựu)</Label>
              <Textarea
                id="achievements"
                value={formData.achievements}
                onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...</>
                ) : (
                  "Lưu"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" /> Hủy
              </Button>
            </div>
          </form>
        )}

        <SortableList
          items={experiences}
          onReorder={handleReorder}
          renderItem={(exp) => (
            <div className="p-4 bg-background border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{exp.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {exp.company} • {exp.year}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(exp)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(exp.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default AdminExperiences;
