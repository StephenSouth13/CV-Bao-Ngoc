import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, Award } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ImageUpload from "./ImageUpload";
import SortableList from "./SortableList";

interface Certificate {
  id: string;
  name: string;
  issuer: string;
  issue_date: string | null;
  expiry_date: string | null;
  credential_id: string | null;
  credential_url: string | null;
  description: string | null;
  image_url: string | null;
  sort_order: number | null;
}

const AdminCertificates = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Form states
  const [name, setName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [credentialId, setCredentialId] = useState("");
  const [credentialUrl, setCredentialUrl] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setCertificates(data || []);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách chứng chỉ",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setIssuer("");
    setIssueDate("");
    setExpiryDate("");
    setCredentialId("");
    setCredentialUrl("");
    setDescription("");
    setImageUrl("");
    setSortOrder(0);
    setEditingId(null);
  };

  const openEditDialog = (cert: Certificate) => {
    setEditingId(cert.id);
    setName(cert.name);
    setIssuer(cert.issuer);
    setIssueDate(cert.issue_date || "");
    setExpiryDate(cert.expiry_date || "");
    setCredentialId(cert.credential_id || "");
    setCredentialUrl(cert.credential_url || "");
    setDescription(cert.description || "");
    setImageUrl(cert.image_url || "");
    setSortOrder(cert.sort_order || 0);
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const certData = {
        name,
        issuer,
        issue_date: issueDate || null,
        expiry_date: expiryDate || null,
        credential_id: credentialId || null,
        credential_url: credentialUrl || null,
        description: description || null,
        image_url: imageUrl || null,
        sort_order: sortOrder,
      };

      if (editingId) {
        const { error } = await supabase
          .from("certificates")
          .update(certData)
          .eq("id", editingId);

        if (error) throw error;
        toast({ title: "Thành công", description: "Đã cập nhật chứng chỉ" });
      } else {
        const { error } = await supabase.from("certificates").insert(certData);

        if (error) throw error;
        toast({ title: "Thành công", description: "Đã thêm chứng chỉ mới" });
      }

      fetchCertificates();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu chứng chỉ",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReorder = async (reorderedItems: Certificate[]) => {
    setCertificates(reorderedItems);
    
    try {
      const updates = reorderedItems.map((item, index) => ({
        id: item.id,
        name: item.name,
        issuer: item.issuer,
        sort_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from("certificates")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id);
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thứ tự",
        variant: "destructive",
      });
      fetchCertificates();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa chứng chỉ này?")) return;

    try {
      const { error } = await supabase.from("certificates").delete().eq("id", id);

      if (error) throw error;
      toast({ title: "Thành công", description: "Đã xóa chứng chỉ" });
      fetchCertificates();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa chứng chỉ",
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Quản lý Chứng chỉ
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm chứng chỉ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Chỉnh sửa chứng chỉ" : "Thêm chứng chỉ mới"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên chứng chỉ *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="VD: IELTS 7.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issuer">Tổ chức cấp *</Label>
                  <Input
                    id="issuer"
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    required
                    placeholder="VD: British Council"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Ngày cấp</Label>
                  <Input
                    id="issueDate"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    placeholder="VD: 01/2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Ngày hết hạn</Label>
                  <Input
                    id="expiryDate"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    placeholder="VD: 01/2026 hoặc Không hết hạn"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="credentialId">Mã chứng chỉ</Label>
                  <Input
                    id="credentialId"
                    value={credentialId}
                    onChange={(e) => setCredentialId(e.target.value)}
                    placeholder="VD: ABC123XYZ"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Thứ tự hiển thị</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="credentialUrl">Link xác minh</Label>
                <Input
                  id="credentialUrl"
                  value={credentialUrl}
                  onChange={(e) => setCredentialUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <ImageUpload
                label="Hình ảnh chứng chỉ"
                value={imageUrl}
                onChange={setImageUrl}
                folder="certificates"
                aspectRatio="video"
                placeholder="Tải ảnh chứng chỉ lên từ máy tính"
              />

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Mô tả chi tiết về chứng chỉ..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    "Lưu"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {certificates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Chưa có chứng chỉ nào. Nhấn "Thêm chứng chỉ" để bắt đầu.
          </div>
        ) : (
          <SortableList
            items={certificates}
            onReorder={handleReorder}
            renderItem={(cert) => (
              <div className="flex items-center justify-between p-3 bg-background border rounded-lg">
                <div className="flex items-center gap-3">
                  {cert.image_url && (
                    <img
                      src={cert.image_url}
                      alt={cert.name}
                      className="h-10 w-10 object-cover rounded"
                    />
                  )}
                  <div>
                    <div className="font-medium">{cert.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {cert.issuer} {cert.issue_date && `• ${cert.issue_date}`}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(cert)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(cert.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            )}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default AdminCertificates;