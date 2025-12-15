import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import AdminAuth from "@/components/admin/AdminAuth";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminTabs from "@/components/admin/AdminTabs";

const Admin = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Check if user is admin
      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) throw error;

      if (roleData) {
        setIsAdmin(true);
      } else {
        toast({
          title: "Unauthorized",
          description: "Bạn không có quyền truy cập trang admin.",
          variant: "destructive",
        });
        setTimeout(() => navigate("/"), 2000);
      }
    } catch (error: any) {
      console.error("Auth check error:", error);
      toast({
        title: "Error",
        description: "Lỗi kiểm tra quyền truy cập",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setIsAdmin(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <AdminAuth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <AdminLayout>
      <AdminTabs />
    </AdminLayout>
  );
};

export default Admin;
