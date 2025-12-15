import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";

const Cart = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ['cart-items', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (
            id,
            name,
            price,
            discount_percent,
            image_url,
            stock_quantity
          )
        `)
        .eq('user_id', user!.id);

      if (error) throw error;
      return data;
    }
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-items'] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
    }
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
      queryClient.invalidateQueries({ queryKey: ['cart-items'] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
    }
  });

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const product = item.products;
      const price = product.price * (1 - (product.discount_percent || 0) / 100);
      return total + (price * item.quantity);
    }, 0);
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <SEOHead 
          title="Giỏ hàng - Cửa hàng"
          description="Xem giỏ hàng của bạn"
        />
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-3xl font-bold mb-4">Vui lòng đăng nhập</h1>
          <p className="text-muted-foreground mb-6">Bạn cần đăng nhập để xem giỏ hàng</p>
          <Button onClick={() => navigate('/admin')}>Đăng nhập</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <div className="max-w-4xl mx-auto text-center py-20">
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <SEOHead 
          title="Giỏ hàng - Cửa hàng"
          description="Giỏ hàng của bạn đang trống"
        />
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-3xl font-bold mb-4">Giỏ hàng trống</h1>
          <p className="text-muted-foreground mb-6">Chưa có sản phẩm nào trong giỏ hàng</p>
          <Button onClick={() => navigate('/')}>Tiếp tục mua sắm</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-20">
      <SEOHead 
        title="Giỏ hàng - Cửa hàng"
        description="Xem và quản lý giỏ hàng của bạn"
      />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Giỏ hàng của bạn</h1>
        
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const product = item.products;
              const discountedPrice = product.price * (1 - (product.discount_percent || 0) / 100);
              
              return (
                <Card key={item.id} className="p-4">
                  <div className="flex gap-4">
                    {product.image_url && (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-24 h-24 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      {item.selected_color && (
                        <p className="text-sm text-muted-foreground">Màu: {item.selected_color}</p>
                      )}
                      {item.selected_size && (
                        <p className="text-sm text-muted-foreground">Size: {item.selected_size}</p>
                      )}
                      <div className="mt-2 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (item.quantity > 1) {
                                updateQuantityMutation.mutate({
                                  id: item.id,
                                  quantity: item.quantity - 1
                                });
                              }
                            }}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (item.quantity < product.stock_quantity) {
                                updateQuantityMutation.mutate({
                                  id: item.id,
                                  quantity: item.quantity + 1
                                });
                              }
                            }}
                            disabled={item.quantity >= product.stock_quantity}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItemMutation.mutate(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      {product.discount_percent > 0 && (
                        <p className="text-sm text-muted-foreground line-through">
                          {product.price.toLocaleString()}đ
                        </p>
                      )}
                      <p className="text-lg font-bold">
                        {discountedPrice.toLocaleString()}đ
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4">Tổng đơn hàng</h2>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span>Tạm tính:</span>
                  <span>{calculateTotal().toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Tổng cộng:</span>
                  <span className="text-primary">{calculateTotal().toLocaleString()}đ</span>
                </div>
              </div>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => navigate('/payment')}
              >
                Tiến hành thanh toán
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
