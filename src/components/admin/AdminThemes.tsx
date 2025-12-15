import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import AdminThemeForm from "./AdminThemeForm";

const AdminThemes = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [editingTheme, setEditingTheme] = useState(null);

  const { data: themes = [] } = useQuery({
    queryKey: ["admin-themes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("themes")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const deleteThemeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("themes")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-themes"] });
      toast.success("Theme deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete theme");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("themes")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-themes"] });
      toast.success("Theme status updated");
    },
  });

  const handleCreateNew = () => {
    setEditingTheme(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (theme: any) => {
    setEditingTheme(theme);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTheme(null);
  };

  const handleThemeSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-themes"] });
    handleCloseDialog();
  };

  const activeThemes = themes.filter((t: any) => t.is_active);
  const inactiveThemes = themes.filter((t: any) => !t.is_active);

  const ThemeCard = ({ theme }: { theme: any }) => (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold">{theme.name}</h3>
            <Badge variant={theme.is_active ? "default" : "secondary"}>
              {theme.is_active ? "Active" : "Inactive"}
            </Badge>
            {theme.is_seasonal && (
              <Badge variant="outline" className="bg-amber-50">
                Seasonal
              </Badge>
            )}
          </div>
          {theme.description && (
            <p className="text-sm text-muted-foreground mb-2">{theme.description}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Slug: <code className="bg-muted px-1 rounded">{theme.slug}</code></span>
            <span>Category: <code className="bg-muted px-1 rounded">{theme.category}</code></span>
          </div>
          <div className="mt-2 p-2 bg-muted rounded">
            <div className="text-xs font-mono text-muted-foreground">
              Primary Color:
              <div
                className="w-8 h-8 rounded border mt-1"
                style={{ backgroundColor: theme.primary_color }}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => toggleActiveMutation.mutate({ id: theme.id, isActive: theme.is_active })}
            title={theme.is_active ? "Hide theme" : "Show theme"}
          >
            {theme.is_active ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleEdit(theme)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => deleteThemeMutation.mutate(theme.id)}
            disabled={deleteThemeMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Manage Themes</h2>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create Theme
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeThemes.length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactive ({inactiveThemes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-4">
          {activeThemes.length > 0 ? (
            activeThemes.map((theme: any) => (
              <ThemeCard key={theme.id} theme={theme} />
            ))
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              No active themes found
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4 mt-4">
          {inactiveThemes.length > 0 ? (
            inactiveThemes.map((theme: any) => (
              <ThemeCard key={theme.id} theme={theme} />
            ))
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              No inactive themes found
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTheme ? "Edit Theme" : "Create New Theme"}
            </DialogTitle>
            <DialogDescription>
              {editingTheme
                ? "Update the theme configuration"
                : "Create a new theme with custom CSS variables"}
            </DialogDescription>
          </DialogHeader>
          <AdminThemeForm
            theme={editingTheme}
            onSaved={handleThemeSaved}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminThemes;
