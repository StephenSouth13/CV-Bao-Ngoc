import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, BookOpen, ShoppingBag } from "lucide-react";
import ImageUpload from "../ImageUpload";

const AdminProducts = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    full_description: "",
    category_id: "",
    brand: "",
    price: "",
    discount_percent: "0",
    stock_quantity: "",
    colors: "",
    sizes: "",
    image_url: "",
    published: true,
    featured: false,
    product_type: "product"
  });

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_categories (
            id,
            name
          )
        `)
        .order('sort_order');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data;
    }
  });

  // Filter products by type
  const filteredProducts = products.filter(p => {
    if (filterType === 'all') return true;
    return (p as any).product_type === filterType || (filterType === 'product' && !(p as any).product_type);
  });

  const productCount = products.filter(p => (p as any).product_type === 'product' || !(p as any).product_type).length;
  const courseCount = products.filter(p => (p as any).product_type === 'course').length;

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const slug = editingProduct?.slug || generateSlug(data.name);
      const productData = {
        ...data,
        slug,
        price: parseFloat(data.price),
        discount_percent: parseInt(data.discount_percent) || 0,
        stock_quantity: parseInt(data.stock_quantity),
        colors: data.colors ? data.colors.split(',').map((c: string) => c.trim()) : [],
        sizes: data.sizes ? data.sizes.split(',').map((s: string) => s.trim()) : [],
        category_id: data.category_id || null,
        product_type: data.product_type
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(editingProduct ? "Đã cập nhật" : "Đã thêm mới");
      setOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success("Đã xóa");
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      full_description: "",
      category_id: "",
      brand: "",
      price: "",
      discount_percent: "0",
      stock_quantity: "",
      colors: "",
      sizes: "",
      image_url: "",
      published: true,
      featured: false,
      product_type: "product"
    });
    setEditingProduct(null);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      full_description: product.full_description || "",
      category_id: product.category_id || "",
      brand: product.brand || "",
      price: product.price.toString(),
      discount_percent: product.discount_percent?.toString() || "0",
      stock_quantity: product.stock_quantity.toString(),
      colors: product.colors?.join(', ') || "",
      sizes: product.sizes?.join(', ') || "",
      image_url: product.image_url || "",
      published: product.published,
      featured: product.featured,
      product_type: product.product_type || "product"
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const isCourse = formData.product_type === 'course';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quản lý sản phẩm & khóa học</h2>
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Chỉnh sửa" : "Thêm"} {isCourse ? "khóa học" : "sản phẩm"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Type Selection */}
              <div>
                <Label>Loại</Label>
                <Select
                  value={formData.product_type}
                  onValueChange={(value) => setFormData({ ...formData, product_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        Sản phẩm
                      </div>
                    </SelectItem>
                    <SelectItem value="course">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Khóa học
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="name">{isCourse ? "Tên khóa học" : "Tên sản phẩm"} *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Danh mục</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không chọn</SelectItem>
                      {categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="brand">{isCourse ? "Giảng viên" : "Hãng"}</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Giá (đ) *</Label>
                  <Input
                    id="price"
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="discount">Giảm giá (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="stock">{isCourse ? "Số chỗ" : "Số lượng"} *</Label>
                  <Input
                    id="stock"
                    type="number"
                    required
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Mô tả ngắn</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="full_description">Mô tả chi tiết</Label>
                <Textarea
                  id="full_description"
                  value={formData.full_description}
                  onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
                  rows={4}
                />
              </div>

              {!isCourse && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="colors">Màu sắc (phân cách bằng dấu phẩy)</Label>
                    <Input
                      id="colors"
                      value={formData.colors}
                      onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                      placeholder="Đỏ, Xanh, Vàng"
                    />
                  </div>

                  <div>
                    <Label htmlFor="sizes">Kích cỡ (phân cách bằng dấu phẩy)</Label>
                    <Input
                      id="sizes"
                      value={formData.sizes}
                      onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                      placeholder="S, M, L, XL"
                    />
                  </div>
                </div>
              )}

              <ImageUpload
                label={isCourse ? "Hình ảnh khóa học" : "Hình ảnh sản phẩm"}
                value={formData.image_url}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
                folder="products"
                aspectRatio="video"
                placeholder={isCourse ? "Tải ảnh khóa học lên" : "Tải ảnh sản phẩm lên"}
              />

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="published"
                    checked={formData.published}
                    onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                  />
                  <Label htmlFor="published">Hiển thị</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                  />
                  <Label htmlFor="featured">Nổi bật</Label>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filterType} onValueChange={setFilterType}>
        <TabsList>
          <TabsTrigger value="all">Tất cả ({products.length})</TabsTrigger>
          <TabsTrigger value="product" className="flex items-center gap-1">
            <ShoppingBag className="h-4 w-4" />
            Sản phẩm ({productCount})
          </TabsTrigger>
          <TabsTrigger value="course" className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            Khóa học ({courseCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4">
        {filteredProducts.map((product: any) => {
          const isProductCourse = product.product_type === 'course';
          return (
            <Card key={product.id} className="p-4">
              <div className="flex gap-4">
                {product.image_url && (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <Badge variant={isProductCourse ? "default" : "secondary"}>
                      {isProductCourse ? (
                        <><BookOpen className="h-3 w-3 mr-1" /> Khóa học</>
                      ) : (
                        <><ShoppingBag className="h-3 w-3 mr-1" /> Sản phẩm</>
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>Giá: {product.price.toLocaleString()}đ</span>
                    {product.discount_percent > 0 && (
                      <span className="text-green-600">-{product.discount_percent}%</span>
                    )}
                    <span>{isProductCourse ? "Chỗ:" : "Tồn kho:"} {product.stock_quantity}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => {
                      if (confirm('Xác nhận xóa?')) {
                        deleteMutation.mutate(product.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminProducts;