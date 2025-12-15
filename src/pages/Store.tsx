import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, Search, SlidersHorizontal, BookOpen, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/Header";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Store = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  const [productType, setProductType] = useState<string>("all");

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
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

  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, product_categories(name)')
        .eq('published', true)
        .order('sort_order');

      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Extract unique brands from products
  const availableBrands = useMemo(() => {
    const brands = allProducts
      .map(p => p.brand)
      .filter((brand): brand is string => !!brand);
    return Array.from(new Set(brands)).sort();
  }, [allProducts]);

  // Filter and sort products
  const products = useMemo(() => {
    let filtered = [...allProducts];

    // Product type filter
    if (productType !== 'all') {
      filtered = filtered.filter(p => (p as any).product_type === productType);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.brand?.toLowerCase().includes(query)
      );
    }

    // Brand filter
    if (selectedBrands.length > 0) {
      filtered = filtered.filter(p => p.brand && selectedBrands.includes(p.brand));
    }

    // Price range filter
    if (priceRange !== 'all') {
      filtered = filtered.filter(p => {
        const price = p.price * (1 - (p.discount_percent || 0) / 100);
        switch (priceRange) {
          case 'under-100k': return price < 100000;
          case '100k-500k': return price >= 100000 && price < 500000;
          case '500k-1m': return price >= 500000 && price < 1000000;
          case 'over-1m': return price >= 1000000;
          default: return true;
        }
      });
    }

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => {
          const priceA = a.price * (1 - (a.discount_percent || 0) / 100);
          const priceB = b.price * (1 - (b.discount_percent || 0) / 100);
          return priceA - priceB;
        });
        break;
      case 'price-desc':
        filtered.sort((a, b) => {
          const priceA = a.price * (1 - (a.discount_percent || 0) / 100);
          const priceB = b.price * (1 - (b.discount_percent || 0) / 100);
          return priceB - priceA;
        });
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
        break;
      default:
        // Keep default sort_order
        break;
    }

    return filtered;
  }, [allProducts, searchQuery, selectedBrands, priceRange, sortBy, productType]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedBrands([]);
    setPriceRange("all");
    setSortBy("default");
    setSelectedCategory("all");
  };

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, color, size }: { productId: string; color?: string; size?: string }) => {
      if (!user) {
        navigate('/admin');
        throw new Error("Vui lòng đăng nhập để thêm vào giỏ hàng");
      }

      // Check if item already exists in cart
      const { data: existing } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('selected_color', color || '')
        .eq('selected_size', size || '')
        .maybeSingle();

      if (existing) {
        // Update quantity
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + 1 })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Insert new item
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity: 1,
            selected_color: color,
            selected_size: size
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Đã thêm vào giỏ hàng");
      queryClient.invalidateQueries({ queryKey: ['cart-items'] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Không thể thêm vào giỏ hàng");
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <div className="max-w-7xl mx-auto py-20 text-center">
          <p>Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  const productCount = allProducts.filter(p => (p as any).product_type === 'product' || !(p as any).product_type).length;
  const courseCount = allProducts.filter(p => (p as any).product_type === 'course').length;

  return (
    <>
      <Header />
      <div className="min-h-screen pt-20 px-4 pb-20">
        <SEOHead
          title="Cửa hàng - Sản phẩm & Khóa học"
          description="Khám phá các sản phẩm chất lượng và khóa học giúp bạn phát triển kỹ năng"
        />
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">Cửa hàng</h1>
                <p className="text-muted-foreground">Khám phá sản phẩm và khóa học chất lượng</p>
              </div>
            </div>

            {/* Product Type Tabs */}
            <Tabs value={productType} onValueChange={setProductType} className="mb-6">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Tất cả
                </TabsTrigger>
                <TabsTrigger value="product" className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Sản phẩm ({productCount})
                </TabsTrigger>
                <TabsTrigger value="course" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Khóa học ({courseCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search and Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full lg:w-[200px]">
                  <SelectValue placeholder="Danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Price Range Filter */}
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="w-full lg:w-[200px]">
                  <SelectValue placeholder="Khoảng giá" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả giá</SelectItem>
                  <SelectItem value="under-100k">Dưới 100k</SelectItem>
                  <SelectItem value="100k-500k">100k - 500k</SelectItem>
                  <SelectItem value="500k-1m">500k - 1tr</SelectItem>
                  <SelectItem value="over-1m">Trên 1tr</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-[200px]">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Mặc định</SelectItem>
                  <SelectItem value="price-asc">Giá: Thấp đến cao</SelectItem>
                  <SelectItem value="price-desc">Giá: Cao đến thấp</SelectItem>
                  <SelectItem value="name-asc">Tên: A-Z</SelectItem>
                  <SelectItem value="name-desc">Tên: Z-A</SelectItem>
                  <SelectItem value="newest">Mới nhất</SelectItem>
                </SelectContent>
              </Select>

              {/* Advanced Filters (Mobile Sheet) */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full lg:w-auto">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Lọc thêm
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Bộ lọc nâng cao</SheetTitle>
                    <SheetDescription>
                      Lọc sản phẩm theo thương hiệu
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    {/* Brand Filter */}
                    <div>
                      <h3 className="font-semibold mb-3">Thương hiệu</h3>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {availableBrands.length > 0 ? (
                          availableBrands.map((brand) => (
                            <div key={brand} className="flex items-center space-x-2">
                              <Checkbox
                                id={`brand-${brand}`}
                                checked={selectedBrands.includes(brand)}
                                onCheckedChange={() => toggleBrand(brand)}
                              />
                              <Label
                                htmlFor={`brand-${brand}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {brand}
                              </Label>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Không có thương hiệu</p>
                        )}
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={clearFilters}
                    >
                      Xóa tất cả bộ lọc
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Active Filters Display */}
            {(searchQuery || selectedBrands.length > 0 || priceRange !== 'all' || sortBy !== 'default' || selectedCategory !== 'all') && (
              <div className="flex flex-wrap gap-2 mt-4">
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Tìm: "{searchQuery}"
                  </Badge>
                )}
                {selectedBrands.map(brand => (
                  <Badge key={brand} variant="secondary" className="gap-1">
                    {brand}
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-6 text-xs"
                >
                  Xóa bộ lọc
                </Button>
              </div>
            )}

            {/* Results Count */}
            <p className="text-sm text-muted-foreground mt-4">
              Hiển thị {products.length} / {allProducts.length} sản phẩm
            </p>
          </div>

          {products.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">
                {productType === 'course' ? 'Chưa có khóa học' : 'Chưa có sản phẩm'}
              </h2>
              <p className="text-muted-foreground">
                {productType === 'course' ? 'Các khóa học sẽ được cập nhật sớm' : 'Các sản phẩm sẽ được cập nhật sớm'}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => {
                const discountedPrice = product.price * (1 - (product.discount_percent || 0) / 100);
                const isCourse = (product as any).product_type === 'course';
                
                return (
                  <Card key={product.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
                    <div 
                      onClick={() => navigate(`/products/${product.slug || product.id}`)}
                      className="relative"
                    >
                      {product.image_url && (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-64 object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                      {/* Type Badge */}
                      <Badge 
                        className="absolute top-2 left-2" 
                        variant={isCourse ? "default" : "secondary"}
                      >
                        {isCourse ? (
                          <><BookOpen className="h-3 w-3 mr-1" /> Khóa học</>
                        ) : (
                          <><ShoppingBag className="h-3 w-3 mr-1" /> Sản phẩm</>
                        )}
                      </Badge>
                      {product.discount_percent && product.discount_percent > 0 && (
                        <Badge className="absolute top-2 right-2 bg-red-500">
                          -{product.discount_percent}%
                        </Badge>
                      )}
                      {product.stock_quantity === 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Badge variant="secondary">{isCourse ? 'Đã đóng' : 'Hết hàng'}</Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
                      {product.brand && (
                        <p className="text-sm text-muted-foreground mb-2">{product.brand}</p>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {product.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          {product.discount_percent && product.discount_percent > 0 && (
                            <p className="text-sm text-muted-foreground line-through">
                              {product.price.toLocaleString()}đ
                            </p>
                          )}
                          <p className="text-xl font-bold text-primary">
                            {discountedPrice.toLocaleString()}đ
                          </p>
                        </div>
                        <Badge variant="outline">
                          {isCourse ? `${product.stock_quantity} chỗ` : `Còn ${product.stock_quantity}`}
                        </Badge>
                      </div>
                      
                      <Button
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCartMutation.mutate({ 
                            productId: product.id,
                            color: product.colors?.[0],
                            size: product.sizes?.[0]
                          });
                        }}
                        disabled={product.stock_quantity === 0 || addToCartMutation.isPending}
                      >
                        {isCourse ? (
                          <><BookOpen className="h-4 w-4 mr-2" /> Đăng ký ngay</>
                        ) : (
                          <><ShoppingCart className="h-4 w-4 mr-2" /> Thêm vào giỏ</>
                        )}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Store;
