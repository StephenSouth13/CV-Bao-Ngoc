import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit, Trash2, X, Upload, ExternalLink } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  full_description?: string;
  challenge?: string;
  solution?: string;
  image_url: string | null;
  metrics: any;
  link: string | null;
  sort_order: number;
  featured?: boolean;
  technologies?: string[];
  slug?: string;
}

const AdminProjects = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    full_description: "",
    challenge: "",
    solution: "",
    image_url: "",
    metrics: "",
    link: "",
    featured: false,
    technologies: "",
    slug: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [filtersEnabled, setFiltersEnabled] = useState<boolean>(true);

  useEffect(() => {
    fetchProjects();
    fetchSettings();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      const msg = String(error?.message || "").toLowerCase();
      // If schema change (missing column) or relation missing, try a fallback without ordering
      if (msg.includes("does not exist") || msg.includes("relation") || msg.includes("column \"sort_order\"")) {
        try {
          const { data: fallback } = await supabase.from("projects").select("*");
          setProjects(fallback || []);
          toast({
            title: "Lưu ý",
            description:
              "Không thể sắp xếp bằng sort_order (có thể do thay đổi schema). Hiển thị dữ liệu bằng fallback.",
          });
        } catch (e) {
          toast({ title: "Lỗi", description: "Không thể tải danh sách dự án", variant: "destructive" });
        }
      } else {
        toast({ title: "Lỗi", description: "Không thể tải danh sách dự án", variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    setImagePreview(project.image_url || "");
    setFormData({
      title: project.title,
      category: project.category,
      description: project.description,
      full_description: project.full_description || "",
      challenge: project.challenge || "",
      solution: project.solution || "",
      image_url: project.image_url || "",
      metrics: JSON.stringify(project.metrics || []),
      link: project.link || "",
      featured: project.featured || false,
      technologies: project.technologies ? project.technologies.join(", ") : "",
      slug: project.slug || "",
    });
  };

  const handleNew = () => {
    setEditingId("new");
    setImageFile(null);
    setImagePreview("");
    setFormData({
      title: "",
      category: "",
      description: "",
      full_description: "",
      challenge: "",
      solution: "",
      image_url: "",
      metrics: "[]",
      link: "",
      featured: false,
      technologies: "",
      slug: "",
    });
  };

  const runBackfillPrompt = async () => {
    const key = window.prompt("Paste Supabase Service Role key (will not be stored), or cancel to abort:");
    if (!key) return;
    if (!confirm("This will run a backfill that updates project slugs. Proceed?")) return;
    await runBackfillWithKey(key);
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from("settings").select("value").eq("key", "projects_filters_enabled").maybeSingle();
      if (error) throw error;
      if (data && data.value === "true") setFiltersEnabled(true);
      else setFiltersEnabled(false);
    } catch (err: any) {
      // settings table might not exist; keep default true
      console.warn("Could not fetch settings for projects_filters_enabled:", err?.message || err);
      setFiltersEnabled(true);
    }
  };

  const saveFiltersEnabled = async (v: boolean) => {
    setIsSaving(true);
    try {
      const sb: any = supabase;
      // Try upsert into settings table
      const { error } = await sb.from("settings").upsert({ key: "projects_filters_enabled", value: v ? "true" : "false" }, { onConflict: ["key"] });
      if (error) throw error;
      setFiltersEnabled(v);
      toast({ title: "Thành công", description: "Đã cập nhật cài đặt b�� lọc" });
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message || "Không thể lưu cài đặt", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const runBackfillWithKey = async (serviceKey: string) => {
    try {
      setIsSaving(true);
      const admin = createClient(import.meta.env.VITE_SUPABASE_URL, serviceKey);
      const { data: projects, error } = await admin.from('projects').select('id,title,slug');
      if (error) throw error;
      if (!projects || projects.length === 0) {
        alert('No projects found');
        setIsSaving(false);
        return;
      }

      const sanitize = (s: string) =>
        s
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-');

      for (const p of projects) {
        if (p.slug) continue;
        let base = sanitize(p.title || `project-${p.id}`);
        let candidate = base;
        let i = 0;
        while (true) {
          const { data: existing, error: e } = await admin.from('projects').select('id').eq('slug', candidate).limit(1).maybeSingle();
          if (e) {
            // if slug column missing or other error, break
            console.warn('backfill check error', e.message || e);
            break;
          }
          if (!existing) break;
          i += 1;
          candidate = `${base}-${i}`;
        }

        try {
          const { error: upErr } = await admin.from('projects').update({ slug: candidate }).eq('id', p.id);
          if (upErr) {
            console.error('Failed update', p.id, upErr.message || upErr);
          }
        } catch (upErr) {
          console.error('Update error', upErr);
        }
      }

      alert('Backfill complete. Refresh to see changes.');
    } catch (err: any) {
      alert('Backfill failed: ' + (err.message || String(err)));
    } finally {
      setIsSaving(false);
      await fetchProjects();
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setImageFile(null);
    setImagePreview("");
    setFormData({
      title: "",
      category: "",
      description: "",
      full_description: "",
      challenge: "",
      solution: "",
      image_url: "",
      metrics: "[]",
      link: "",
      featured: false,
      technologies: "",
      slug: "",
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.image_url || null;

    try {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("project-images")
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("project-images")
        .getPublicUrl(filePath);

      return data?.publicUrl || null;
    } catch (error: any) {
      toast({
        title: "Error uploading image",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const imageUrl = await uploadImage();

      let metricsData = [];
      try {
        metricsData = JSON.parse(formData.metrics);
      } catch {
        throw new Error("Metrics phải là JSON hợp lệ");
      }

      const technologiesArray = formData.technologies
        ? formData.technologies.split(",").map((t) => t.trim())
        : [];

      const sanitize = (s: string) =>
      s
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");

    const rawSlug = formData.slug && formData.slug.trim() !== "" ? sanitize(formData.slug) : (formData.title ? sanitize(formData.title) : null);

      // Ensure slug uniqueness by appending suffix if needed
      const ensureUniqueSlug = async (base: string | null, excludeId?: string | null) => {
        if (!base) return null;
        let candidate = base;
        let i = 0;
        while (true) {
          try {
            const query = supabase.from("projects").select("id").eq("slug", candidate);
            if (excludeId) query.neq("id", excludeId);
            const { data: existing, error } = await query.limit(1).maybeSingle();
            if (error) {
              // If slug column doesn't exist, stop trying uniqueness checks and return candidate
              const msg = String(error.message || "").toLowerCase();
              if (msg.includes("slug") && msg.includes("does not exist")) {
                return candidate;
              }
              throw error;
            }

            if (!existing) return candidate;
          } catch (err: any) {
            const msg = String(err?.message || "").toLowerCase();
            if (msg.includes("slug") && msg.includes("does not exist")) {
              return candidate;
            }
            throw err;
          }

          i += 1;
          candidate = `${base}-${i}`;
        }
      };

      const slug = await ensureUniqueSlug(rawSlug, editingId && editingId !== "new" ? editingId : undefined);

      const saveData = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        full_description: formData.full_description || null,
        challenge: formData.challenge || null,
        solution: formData.solution || null,
        image_url: imageUrl,
        metrics: metricsData,
        link: formData.link || null,
        featured: formData.featured,
        technologies: technologiesArray,
        slug: slug,
      };

      const attemptSave = async (dataToSave: any, mode: "insert" | "update") => {
        try {
          if (mode === "insert") {
            const maxOrder = projects.length > 0 ? Math.max(...projects.map((p) => p.sort_order)) : 0;
            const { error } = await supabase.from("projects").insert({ ...dataToSave, sort_order: maxOrder + 1 });
            if (error) throw error;
            return;
          }

          if (mode === "update") {
            const { error } = await supabase.from("projects").update({ ...dataToSave, updated_at: new Date().toISOString() }).eq("id", editingId);
            if (error) throw error;
            return;
          }
        } catch (err: any) {
          const message = String(err?.message || "").toLowerCase();
          // If error mentions missing column, strip the offending keys and retry once
          const missingColMatch = message.match(/column "([^"]+)"/i);
          if (missingColMatch) {
            const col = missingColMatch[1];
            // map common column names to our saveData keys
            const keyMap = { slug: "slug", technologies: "technologies", metrics: "metrics" };
            const keyToRemove = Object.keys(dataToSave).find((k) => k === col || (keyMap[col] && k === keyMap[col]));
            if (keyToRemove) {
              const cleaned = { ...dataToSave };
              delete cleaned[keyToRemove];
              // retry
              if (mode === "insert") {
                const maxOrder = projects.length > 0 ? Math.max(...projects.map((p) => p.sort_order)) : 0;
                const { error: err2 } = await supabase.from("projects").insert({ ...cleaned, sort_order: maxOrder + 1 });
                if (!err2) return;
              } else {
                const { error: err2 } = await supabase.from("projects").update({ ...cleaned, updated_at: new Date().toISOString() }).eq("id", editingId);
                if (!err2) return;
              }
            }
          }
          // rethrow
          throw err;
        }
      };

      if (editingId === "new") {
        await attemptSave(saveData, "insert");
        toast({ title: "Thành công", description: "Đã thêm dự án mới" });
      } else {
        await attemptSave(saveData, "update");
        toast({ title: "Thành công", description: "Đã cập nhật dự án" });
      }

      handleCancel();
      await fetchProjects();
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
    if (!confirm("Bạn có chắc muốn xóa dự án n��y?")) return;
    
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await fetchProjects();
      toast({ title: "Thành công", description: "Đã xóa dự án" });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa",
        variant: "destructive",
      });
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
          <CardTitle>Quản lý Dự án</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm">Bật bộ lọc danh mục</label>
              <Switch checked={filtersEnabled} onCheckedChange={(v) => saveFiltersEnabled(Boolean(v))} />
            </div>
            <div className="flex items-center gap-2">
              {!editingId && (
                <>
                  <Button onClick={handleNew}>
                    <Plus className="h-4 w-4 mr-2" /> Thêm mới
                  </Button>
                  <Button variant="outline" onClick={() => runBackfillPrompt()}>
                    Backfill Slugs
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {editingId && (
          <form onSubmit={handleSave} className="space-y-4 border border-gold/20 p-4 rounded-md">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tên dự án</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Danh mục</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả ngắn</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_description">Mô tả đầy đủ</Label>
              <Textarea
                id="full_description"
                value={formData.full_description}
                onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="challenge">Thách thức</Label>
              <Textarea
                id="challenge"
                value={formData.challenge}
                onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="solution">Giải pháp</Label>
              <Textarea
                id="solution"
                value={formData.solution}
                onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="technologies">Công nghệ (ngăn cách bằng dấu phẩy)</Label>
              <Input
                id="technologies"
                value={formData.technologies}
                onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                placeholder="React, TypeScript, Tailwind CSS"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 items-end">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (tùy chỉnh)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="auto-generated-from-title"
                />
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button
                  type="button"
                  onClick={() => {
                    const s = formData.title
                      .toLowerCase()
                      .trim()
                      .replace(/[^a-z0-9\s-]/g, "")
                      .replace(/\s+/g, "-");
                    setFormData({ ...formData, slug: s });
                  }}
                >
                  Tạo từ tiêu đề
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Hình ảnh dự án</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="flex-1"
                />
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="metrics">Metrics (JSON: [{"{"}label: "...", value: "..."{"}"}])</Label>
              <Textarea
                id="metrics"
                value={formData.metrics}
                onChange={(e) => setFormData({ ...formData, metrics: e.target.value })}
                rows={2}
                placeholder='[{"label": "Tăng trưởng", "value": "200%"}]'
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Link dự án</Label>
              <Input
                id="link"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
              />
              <Label htmlFor="featured">Hiển thị trên trang chủ</Label>
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

        <div className="space-y-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="p-4 border border-gold/20 rounded-md space-y-2"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{project.title}</h3>
                    {project.featured && <Badge variant="secondary">Featured</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {project.category}
                  </p>
                  <Link to={`/projects/${project.slug || project.id}`} target="_blank">
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Xem trang chi tiết
                    </Button>
                  </Link>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(project)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(project.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {project.technologies && project.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {project.technologies.map((tech, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              )}
              {project.image_url && (
                <img
                  src={project.image_url}
                  alt={project.title}
                  className="mt-2 rounded-lg w-full h-32 object-cover"
                />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminProjects;
