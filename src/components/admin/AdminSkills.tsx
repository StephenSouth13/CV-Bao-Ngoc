import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Plus } from "lucide-react";
import SortableList from "./SortableList";

interface Skill {
  id: string;
  name: string;
  sort_order: number;
}

const AdminSkills = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setSkills(data || []);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách kỹ năng",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;

    setIsAdding(true);
    try {
      const maxOrder = skills.length > 0 ? Math.max(...skills.map(s => s.sort_order)) : 0;
      
      const { error } = await supabase
        .from("skills")
        .insert({
          name: newSkill.trim(),
          sort_order: maxOrder + 1,
        });

      if (error) throw error;

      setNewSkill("");
      await fetchSkills();
      toast({
        title: "Thành công",
        description: "Đã thêm kỹ năng mới",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thêm kỹ năng",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("skills")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await fetchSkills();
      toast({
        title: "Thành công",
        description: "Đã xóa kỹ năng",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa",
        variant: "destructive",
      });
    }
  };

  const handleReorder = async (reorderedItems: Skill[]) => {
    setSkills(reorderedItems);
    
    try {
      for (let i = 0; i < reorderedItems.length; i++) {
        await supabase
          .from("skills")
          .update({ sort_order: i })
          .eq("id", reorderedItems[i].id);
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thứ tự",
        variant: "destructive",
      });
      fetchSkills();
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
        <CardTitle>Quản lý Kỹ năng</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleAdd} className="flex gap-2">
          <div className="flex-1">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Tên kỹ năng mới"
            />
          </div>
          <Button type="submit" disabled={isAdding}>
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <><Plus className="h-4 w-4 mr-2" /> Thêm</>
            )}
          </Button>
        </form>

        <SortableList
          items={skills}
          onReorder={handleReorder}
          renderItem={(skill) => (
            <div className="flex items-center justify-between p-3 bg-background border rounded-lg">
              <span>{skill.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(skill.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default AdminSkills;
