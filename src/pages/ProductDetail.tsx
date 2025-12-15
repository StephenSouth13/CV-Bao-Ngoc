import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/Header";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DOMPurify from "dompurify";

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string>("");

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_categories(name)')
        .eq('slug', slug)
        .eq('published', true)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        navigate('/admin');
        throw new Error("Vui lòng đăng nhập để thêm vào giỏ hàng");
      }

      if (!product) throw new Error("Product not found");

      const { data: existing } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .eq('selected_color', selectedColor || '')
        .eq('selected_size', selectedSize || '')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + 1 })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: product.id,
            quantity: 1,
            selected_color: selectedColor,
            selected_size: selectedSize
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
      <>
        <Header />
        <div className="min-h-screen pt-20 px-4">
          <div className="max-w-7xl mx-auto py-20 text-center">
            <p>Đang tải...</p>
          </div>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <div className="min-h-screen pt-20 px-4">
          <div className="max-w-7xl mx-auto py-20 text-center">
            <h1 className="text-3xl font-bold mb-4">Không tìm thấy sản phẩm</h1>
            <Button onClick={() => navigate('/store')}>Quay lại cửa hàng</Button>
          </div>
        </div>
      </>
    );
  }

  const discountedPrice = product.price * (1 - (product.discount_percent || 0) / 100);
  const displayImage = selectedImage || product.image_url;

  return (
    <>
      <Header />
      <div className="min-h-screen pt-20 px-4 pb-20">
        <SEOHead 
          title={`${product.name} - Cửa hàng`}
          description={product.description || ""}
        />
        <div className="max-w-7xl mx-auto">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => navigate('/store')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại cửa hàng
          </Button>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              {displayImage && (
                <Card className="overflow-hidden mb-4">
                  <img 
                    src={displayImage} 
                    alt={product.name}
                    className="w-full h-[500px] object-cover"
                  />
                </Card>
              )}
              
              {product.images && product.images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.map((img: string, idx: number) => (
                    <Card 
                      key={idx}
                      className={`overflow-hidden cursor-pointer border-2 ${selectedImage === img ? 'border-primary' : ''}`}
                      onClick={() => setSelectedImage(img)}
                    >
                      <img 
                        src={img} 
                        alt={`${product.name} ${idx + 1}`}
                        className="w-full h-20 object-cover"
                      />
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-4">
                {product.brand && (
                  <p className="text-sm text-muted-foreground mb-2">{product.brand}</p>
                )}
                <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
                
                <div className="flex items-center gap-4 mb-4">
                  {product.discount_percent > 0 && (
                    <>
                      <p className="text-2xl text-muted-foreground line-through">
                        {product.price.toLocaleString()}đ
                      </p>
                      <Badge className="bg-red-500">
                        -{product.discount_percent}%
                      </Badge>
                    </>
                  )}
                </div>
                
                <p className="text-4xl font-bold text-primary mb-6">
                  {discountedPrice.toLocaleString()}đ
                </p>

                <div className="flex items-center gap-2 mb-6">
                  <Badge variant={product.stock_quantity > 0 ? "default" : "secondary"}>
                    {product.stock_quantity > 0 ? `Còn ${product.stock_quantity} sản phẩm` : "Hết hàng"}
                  </Badge>
                  {product.featured && (
                    <Badge variant="outline">Nổi bật</Badge>
                  )}
                </div>
              </div>

              <Card className="p-6 mb-6">
                <h3 className="font-semibold mb-4">Tùy chọn sản phẩm</h3>
                
                {product.colors && product.colors.length > 0 && (
                  <div className="mb-4">
                    <Label className="mb-2 block">Màu sắc</Label>
                    <Select value={selectedColor} onValueChange={setSelectedColor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn màu sắc" />
                      </SelectTrigger>
                      <SelectContent>
                        {product.colors.map((color: string) => (
                          <SelectItem key={color} value={color}>
                            {color}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {product.sizes && product.sizes.length > 0 && (
                  <div className="mb-4">
                    <Label className="mb-2 block">Kích cỡ</Label>
                    <Select value={selectedSize} onValueChange={setSelectedSize}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn kích cỡ" />
                      </SelectTrigger>
                      <SelectContent>
                        {product.sizes.map((size: string) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => addToCartMutation.mutate()}
                  disabled={product.stock_quantity === 0 || addToCartMutation.isPending}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Thêm vào giỏ hàng
                </Button>
              </Card>

              {product.description && (
                <Card className="p-6 mb-4">
                  <h3 className="font-semibold mb-2">Mô tả ngắn</h3>
                  <p className="text-muted-foreground">{product.description}</p>
                </Card>
              )}

              {product.full_description && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-2">Mô tả chi tiết</h3>
                  <div 
                    className="text-muted-foreground prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.full_description) }}
                  />
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={`text-sm font-medium ${className || ''}`} {...props} />
);

export default ProductDetail;