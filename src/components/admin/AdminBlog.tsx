import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit, Trash2, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import ImageUpload from "./ImageUpload";

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image_url: string | null;
  category_id: string | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
  created_at: string;
  view_count: number;
}

interface BlogCategory {
  id: string;
  name: string;
  color: string;
}

interface BlogTag {
  id: string;
  name: string;
  slug: string;
  color: string;
}

const AdminBlog = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    image_url: "",
    category_id: "",
    featured: false,
    published: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBlogs();
    fetchCategories();
    fetchTags();
  }, []);

  const fetchBlogs = async () => {
    try {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setBlogs(data || []);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách blog",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("id, name, color")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_tags")
        .select("*")
        .order("name");

      if (error) throw error;
      setTags(data || []);
    } catch (error: any) {
      console.error("Error fetching tags:", error);
    }
  };

  const fetchBlogTags = async (blogId: string) => {
    try {
      const { data, error } = await supabase
        .from("blog_post_tags")
        .select("tag_id")
        .eq("blog_id", blogId);

      if (error) throw error;
      setSelectedTags(data?.map((item) => item.tag_id) || []);
    } catch (error: any) {
      console.error("Error fetching blog tags:", error);
    }
  };

  const handleEdit = (blog: Blog) => {
    setEditingId(blog.id);
    setImagePreview(blog.image_url || "");
    setFormData({
      title: blog.title,
      slug: blog.slug || "",
      content: blog.content,
      excerpt: blog.excerpt || "",
      image_url: blog.image_url || "",
      category_id: blog.category_id || "",
      featured: blog.featured,
      published: blog.published,
    });
    fetchBlogTags(blog.id);
  };

  const handleNew = () => {
    setEditingId("new");
    setImageFile(null);
    setImagePreview("");
    setSelectedTags([]);
    setFormData({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      image_url: "",
      category_id: "",
      featured: false,
      published: false,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setImageFile(null);
    setImagePreview("");
    setSelectedTags([]);
    setFormData({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      image_url: "",
      category_id: "",
      featured: false,
      published: false,
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
        title: "Lỗi upload ảnh",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const imageUrl = await uploadImage();
      const slug = formData.slug || generateSlug(formData.title);

      const saveData = {
        title: formData.title,
        slug: slug,
        content: formData.content,
        excerpt: formData.excerpt || null,
        image_url: imageUrl,
        category_id: formData.category_id || null,
        featured: formData.featured,
        published: formData.published,
      };

      let blogId = editingId;

      if (editingId === "new") {
        const maxOrder = blogs.length > 0 ? Math.max(...blogs.map((b) => b.sort_order)) : 0;
        const { data, error } = await supabase
          .from("blogs")
          .insert({ ...saveData, sort_order: maxOrder + 1 })
          .select("id")
          .single();

        if (error) throw error;
        blogId = data.id;
        toast({ title: "Thành công", description: "Đã thêm blog mới" });
      } else {
        const { error } = await supabase
          .from("blogs")
          .update(saveData)
          .eq("id", editingId);

        if (error) throw error;
        toast({ title: "Thành công", description: "Đã cập nhật blog" });
      }

      // Save tags
      if (blogId && blogId !== "new") {
        // Delete existing tags
        await supabase.from("blog_post_tags").delete().eq("blog_id", blogId);

        // Insert new tags
        if (selectedTags.length > 0) {
          const tagInserts = selectedTags.map((tagId) => ({
            blog_id: blogId,
            tag_id: tagId,
          }));
          await supabase.from("blog_post_tags").insert(tagInserts);
        }
      }

      handleCancel();
      await fetchBlogs();
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

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa blog này?")) return;

    try {
      const { error } = await supabase.from("blogs").delete().eq("id", id);

      if (error) throw error;
      await fetchBlogs();
      toast({ title: "Thành công", description: "Đã xóa blog" });
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
          <CardTitle>Quản lý Blog</CardTitle>
          {!editingId && (
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" /> Thêm mới
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {editingId && (
          <form onSubmit={handleSave} className="space-y-4 border border-primary/20 p-4 rounded-md">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (tự động nếu để trống)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Mô tả ngắn</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Danh mục</Label>
              <Select
                value={formData.category_id || "none"}
                onValueChange={(value) => setFormData({ ...formData, category_id: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không chọn</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Nội dung (Rich Text Editor)</Label>
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ["bold", "italic", "underline", "strike"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    [{ color: [] }, { background: [] }],
                    [{ align: [] }],
                    ["link", "image"],
                    ["clean"],
                  ],
                }}
                className="bg-background"
                style={{ minHeight: "300px" }}
              />
            </div>

            <ImageUpload
              label="Ảnh đại diện"
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              folder="blogs"
              aspectRatio="video"
              placeholder="Tải ảnh đại diện blog lên"
            />

            {/* Tags Selector */}
            {tags.length > 0 && (
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-md">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer transition-all ${
                        selectedTags.includes(tag.id)
                          ? "ring-2 ring-primary"
                          : "opacity-60 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                      onClick={() => toggleTag(tag.id)}
                    >
                      <Checkbox
                        checked={selectedTags.includes(tag.id)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{tag.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.featured}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, featured: checked })
                  }
                />
                <Label>Nổi bật</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.published}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, published: checked })
                  }
                />
                <Label>Xuất bản</Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  "Lưu"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Hủy
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {blogs.map((blog) => (
            <Card key={blog.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{blog.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {blog.excerpt}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {blog.featured && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                        Nổi bật
                      </span>
                    )}
                    {blog.published && (
                      <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">
                        Đã xuất bản
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(blog)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(blog.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminBlog;
