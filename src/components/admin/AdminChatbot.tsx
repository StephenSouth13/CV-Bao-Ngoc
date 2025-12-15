import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChatbotTraining {
  id: string;
  keywords: string[];
  question: string;
  answer: string;
  language: string;
  priority: number;
  active: boolean;
}

const AdminChatbot = () => {
  const [trainings, setTrainings] = useState<ChatbotTraining[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    keywords: [""],
    question: "",
    answer: "",
    language: "vi",
    priority: 0,
    active: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    const { data, error } = await supabase
      .from("chatbot_training")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu huấn luyện",
        variant: "destructive",
      });
      return;
    }

    setTrainings(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanKeywords = formData.keywords.filter((k) => k.trim() !== "");

    if (cleanKeywords.length === 0 || !formData.question || !formData.answer) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    const dataToSave = {
      keywords: cleanKeywords,
      question: formData.question,
      answer: formData.answer,
      language: formData.language,
      priority: formData.priority,
      active: formData.active,
    };

    if (editingId) {
      const { error } = await supabase
        .from("chatbot_training")
        .update(dataToSave)
        .eq("id", editingId);

      if (error) {
        toast({
          title: "Lỗi",
          description: "Không thể cập nhật",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Thành công", description: "Đã cập nhật" });
    } else {
      const { error } = await supabase
        .from("chatbot_training")
        .insert([dataToSave]);

      if (error) {
        toast({
          title: "Lỗi",
          description: "Không thể thêm mới",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Thành công", description: "Đã thêm mới" });
    }

    setFormData({
      keywords: [""],
      question: "",
      answer: "",
      language: "vi",
      priority: 0,
      active: true,
    });
    setEditingId(null);
    fetchTrainings();
  };

  const handleEdit = (training: ChatbotTraining) => {
    setEditingId(training.id);
    setFormData({
      keywords: training.keywords,
      question: training.question,
      answer: training.answer,
      language: training.language,
      priority: training.priority,
      active: training.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa?")) return;

    const { error } = await supabase
      .from("chatbot_training")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Thành công", description: "Đã xóa" });
    fetchTrainings();
  };

  const addKeywordField = () => {
    setFormData({ ...formData, keywords: [...formData.keywords, ""] });
  };

  const updateKeyword = (index: number, value: string) => {
    const newKeywords = [...formData.keywords];
    newKeywords[index] = value;
    setFormData({ ...formData, keywords: newKeywords });
  };

  const removeKeyword = (index: number) => {
    if (formData.keywords.length === 1) return;
    const newKeywords = formData.keywords.filter((_, i) => i !== index);
    setFormData({ ...formData, keywords: newKeywords });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingId ? "Chỉnh sửa câu trả lời" : "Thêm câu trả lời mới"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Từ khóa (Keywords)</Label>
              <div className="space-y-2 mt-2">
                {formData.keywords.map((keyword, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={keyword}
                      onChange={(e) => updateKeyword(index, e.target.value)}
                      placeholder="Ví dụ: kinh nghiệm, dự án, skill..."
                      className="flex-1"
                    />
                    {formData.keywords.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeKeyword(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addKeywordField}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm từ khóa
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="question">Câu hỏi mẫu</Label>
              <Input
                id="question"
                value={formData.question}
                onChange={(e) =>
                  setFormData({ ...formData, question: e.target.value })
                }
                placeholder="Ví dụ: Bạn có kinh nghiệm gì?"
              />
            </div>

            <div>
              <Label htmlFor="answer">Câu trả lời</Label>
              <Textarea
                id="answer"
                value={formData.answer}
                onChange={(e) =>
                  setFormData({ ...formData, answer: e.target.value })
                }
                placeholder="Nhập câu trả lời..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="language">Ngôn ngữ</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) =>
                    setFormData({ ...formData, language: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vi">Tiếng Việt</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Độ ưu tiên</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, active: checked })
                }
              />
              <Label htmlFor="active">Kích hoạt</Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {editingId ? "Cập nhật" : "Thêm mới"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      keywords: [""],
                      question: "",
                      answer: "",
                      language: "vi",
                      priority: 0,
                      active: true,
                    });
                  }}
                >
                  Hủy
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Danh sách câu trả lời</h3>
        {trainings.map((training) => (
          <Card key={training.id}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex gap-2 flex-wrap mb-2">
                      {training.keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-primary/10 text-primary rounded text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                      <span className="px-2 py-1 bg-muted rounded text-xs">
                        {training.language === "vi" ? "🇻🇳" : "🇬🇧"}
                      </span>
                      <span className="px-2 py-1 bg-muted rounded text-xs">
                        Ưu tiên: {training.priority}
                      </span>
                      {!training.active && (
                        <span className="px-2 py-1 bg-destructive/10 text-destructive rounded text-xs">
                          Tạm ngưng
                        </span>
                      )}
                    </div>
                    <p className="font-medium mb-1">{training.question}</p>
                    <p className="text-sm text-muted-foreground">
                      {training.answer}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(training)}
                    >
                      Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(training.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminChatbot;