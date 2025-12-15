import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Submission {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  created_at: string;
  seen: boolean;
}

const AdminSubmissions = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setSubmissions(data || []);
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message || "Không thể tải danh sách liên hệ", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xác nhận xóa?")) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("contact_submissions").delete().eq("id", id);
      if (error) throw error;
      setSubmissions((s) => s.filter((x) => x.id !== id));
      toast({ title: "Đã xóa" });
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message || "Không thể xóa", variant: "destructive" });
    } finally {
      setIsDeleting(false);
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
    <>
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Người liên hệ ({submissions.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có khách hàng liên hệ nào.</p>
          ) : (
            <div className="grid gap-3">
              {submissions.map((s) => (
                <div
                  key={s.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedSubmission(s)}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{s.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(s.created_at).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">{s.email}</div>
                      {s.phone && (
                        <div className="text-sm text-muted-foreground">{s.phone}</div>
                      )}
                      <div className="mt-2 text-sm line-clamp-2">{s.message}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSubmission(s);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(s.id);
                        }}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết liên hệ</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Họ tên</label>
                  <p className="text-base font-semibold">{selectedSubmission.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-base">{selectedSubmission.email}</p>
                </div>
                {selectedSubmission.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Số điện thoại</label>
                    <p className="text-base">{selectedSubmission.phone}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Thời gian</label>
                  <p className="text-base">
                    {new Date(selectedSubmission.created_at).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tin nhắn</label>
                <p className="text-base mt-2 whitespace-pre-wrap p-4 bg-muted rounded-lg">
                  {selectedSubmission.message}
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                  Đóng
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDelete(selectedSubmission.id);
                    setSelectedSubmission(null);
                  }}
                >
                  Xóa
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminSubmissions;
