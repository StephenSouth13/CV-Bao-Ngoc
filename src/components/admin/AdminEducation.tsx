import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X, Pencil, Trash2 } from "lucide-react";
import SortableList from "./SortableList";

interface Education {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  year: string;
  description?: string;
  achievements?: string[];
  sort_order: number;
}

const AdminEducation = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [education, setEducation] = useState<Education[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    institution: "",
    degree: "",
    field: "",
    year: "",
    description: "",
    achievements: [] as string[],
  });
  const [newAchievement, setNewAchievement] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchEducation();
  }, []);

  const fetchEducation = async () => {
    try {
      const { data, error } = await supabase
        .from("education")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setEducation(data || []);
    } catch (error) {
      console.error("Error fetching education:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu học vấn",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setEditingId("new");
    setFormData({
      institution: "",
      degree: "",
      field: "",
      year: "",
      description: "",
      achievements: [],
    });
    setNewAchievement("");
  };

  const handleEdit = (edu: Education) => {
    setEditingId(edu.id);
    setFormData({
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field || "",
      year: edu.year,
      description: edu.description || "",
      achievements: edu.achievements || [],
    });
    setNewAchievement("");
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      institution: "",
      degree: "",
      field: "",
      year: "",
      description: "",
      achievements: [],
    });
    setNewAchievement("");
  };

  const handleAddAchievement = () => {
    if (newAchievement.trim()) {
      setFormData({
        ...formData,
        achievements: [...formData.achievements, newAchievement.trim()],
      });
      setNewAchievement("");
    }
  };

  const handleRemoveAchievement = (index: number) => {
    setFormData({
      ...formData,
      achievements: formData.achievements.filter((_, i) => i !== index),
    });
  };

  const handleSave = async () => {
    if (!formData.institution || !formData.degree || !formData.year) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        institution: formData.institution,
        degree: formData.degree,
        field: formData.field || null,
        year: formData.year,
        description: formData.description || null,
        achievements: formData.achievements.length > 0 ? formData.achievements : null,
        sort_order: education.length,
      };

      if (editingId === "new") {
        const { error } = await supabase.from("education").insert([dataToSave]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("education")
          .update(dataToSave)
          .eq("id", editingId);
        if (error) throw error;
      }

      toast({
        title: "Thành công",
        description: "Đã lưu thông tin học vấn",
      });

      handleCancel();
      fetchEducation();
    } catch (error) {
      console.error("Error saving education:", error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu thông tin học vấn",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa?")) return;

    try {
      const { error } = await supabase.from("education").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: "Đã xóa",
        description: "Đã xóa thông tin học vấn",
      });

      fetchEducation();
    } catch (error) {
      console.error("Error deleting education:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa thông tin học vấn",
        variant: "destructive",
      });
    }
  };

  const handleReorder = async (reorderedItems: Education[]) => {
    setEducation(reorderedItems);
    
    try {
      for (let i = 0; i < reorderedItems.length; i++) {
        await supabase
          .from("education")
          .update({ sort_order: i })
          .eq("id", reorderedItems[i].id);
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thứ tự",
        variant: "destructive",
      });
      fetchEducation();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Quản lý Học vấn</CardTitle>
          {!editingId && (
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm mới
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {editingId && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Trường học / Tổ chức <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={formData.institution}
                    onChange={(e) =>
                      setFormData({ ...formData, institution: e.target.value })
                    }
                    placeholder="Ví dụ: Đại học Bách Khoa"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Bằng cấp <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={formData.degree}
                    onChange={(e) =>
                      setFormData({ ...formData, degree: e.target.value })
                    }
                    placeholder="Ví dụ: Cử nhân"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Chuyên ngành</label>
                  <Input
                    value={formData.field}
                    onChange={(e) =>
                      setFormData({ ...formData, field: e.target.value })
                    }
                    placeholder="Ví dụ: Khoa học máy tính"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Thời gian <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({ ...formData, year: e.target.value })
                    }
                    placeholder="Ví dụ: 2015 - 2019"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mô tả</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Mô tả chi tiết về quá trình học tập..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Thành tích</label>
                <div className="flex gap-2">
                  <Input
                    value={newAchievement}
                    onChange={(e) => setNewAchievement(e.target.value)}
                    placeholder="Nhập thành tích..."
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddAchievement();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddAchievement}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.achievements.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {formData.achievements.map((achievement, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-background rounded border"
                      >
                        <span className="text-muted-foreground">•</span>
                        <span className="flex-1 text-sm">{achievement}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAchievement(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Lưu
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Hủy
                </Button>
              </div>
            </div>
          )}

          <SortableList
            items={education}
            onReorder={handleReorder}
            renderItem={(edu) => (
              <div className="p-4 bg-background border rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    <h3 className="font-semibold">{edu.degree}</h3>
                    <p className="text-sm text-muted-foreground">{edu.institution}</p>
                    {edu.field && (
                      <p className="text-sm text-muted-foreground">Chuyên ngành: {edu.field}</p>
                    )}
                    <p className="text-sm font-medium">{edu.year}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(edu)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(edu.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEducation;
