import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminStoreDashboard from "./store/AdminStoreDashboard";
import AdminProducts from "./store/AdminProducts";
import AdminProductCategories from "./store/AdminProductCategories";
import AdminOrders from "./store/AdminOrders";

const AdminStore = () => {
  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-8">
        <TabsTrigger value="dashboard">Doanh thu</TabsTrigger>
        <TabsTrigger value="products">Sản phẩm</TabsTrigger>
        <TabsTrigger value="categories">Danh mục</TabsTrigger>
        <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard">
        <AdminStoreDashboard />
      </TabsContent>

      <TabsContent value="products">
        <AdminProducts />
      </TabsContent>

      <TabsContent value="categories">
        <AdminProductCategories />
      </TabsContent>

      <TabsContent value="orders">
        <AdminOrders />
      </TabsContent>
    </Tabs>
  );
};

export default AdminStore;
