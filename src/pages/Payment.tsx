import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/Header";
import { QRCodeSVG } from "qrcode.react";

const Payment = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_address: "",
    delivery_time: "",
    customer_message: ""
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { data: cartItems = [] } = useQuery({
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
            stock_quantity
          )
        `)
        .eq('user_id', user!.id);

      if (error) throw error;
      return data;
    }
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      const total = cartItems.reduce((sum, item) => {
        const product = item.products;
        const price = product.price * (1 - (product.discount_percent || 0) / 100);
        return sum + (price * item.quantity);
      }, 0);

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          ...formData,
          total_amount: total,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.products.name,
        product_price: item.products.price * (1 - (item.products.discount_percent || 0) / 100),
        quantity: item.quantity,
        selected_color: item.selected_color,
        selected_size: item.selected_size
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      const { error: clearError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (clearError) throw clearError;

      return order;
    },
    onSuccess: () => {
      toast.success("Đặt hàng thành công! Đơn hàng đang chờ xác nhận.");
      queryClient.invalidateQueries({ queryKey: ['cart-items'] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
      navigate('/');
    },
    onError: () => {
      toast.error("Đặt hàng thất bại, vui lòng thử lại");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_name || !formData.customer_phone || !formData.customer_address) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    createOrderMutation.mutate();
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-3xl font-bold mb-4">Vui lòng đăng nhập</h1>
          <Button onClick={() => navigate('/admin')}>Đăng nhập</Button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-3xl font-bold mb-4">Giỏ hàng trống</h1>
          <Button onClick={() => navigate('/cart')}>Quay lại giỏ hàng</Button>
        </div>
      </div>
    );
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const product = item.products;
      const price = product.price * (1 - (product.discount_percent || 0) / 100);
      return total + (price * item.quantity);
    }, 0);
  };

  const totalAmount = calculateTotal();
  
  // Generate VietQR payment string
  const bankInfo = {
    bank: "",
    accountNumber: "",
    accountName: "",
    amount: totalAmount,
    message: `DH${user?.id?.substring(0, 8)}`
  };

  return (
    <>
      <Header />
      <div className="min-h-screen pt-20 px-4 pb-20">
        <SEOHead
        title="Thanh toán - Cửa hàng"
        description="Hoàn tất đơn hàng của bạn"
      />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Thanh toán</h1>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-8">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Thông tin giao hàng</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Họ và tên *</Label>
                <Input
                  id="name"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Số điện thoại *</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="address">Địa chỉ *</Label>
                <Textarea
                  id="address"
                  required
                  value={formData.customer_address}
                  onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="delivery">Thời gian nhận hàng (tùy chọn)</Label>
                <Input
                  id="delivery"
                  value={formData.delivery_time}
                  onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                  placeholder="Ví dụ: Sáng 9h-12h"
                />
              </div>
              <div>
                <Label htmlFor="message">Ghi chú (tùy chọn)</Label>
                <Textarea
                  id="message"
                  value={formData.customer_message}
                  onChange={(e) => setFormData({ ...formData, customer_message: e.target.value })}
                  placeholder="Ghi chú thêm cho đơn hàng"
                />
              </div>
            </div>
          </Card>

          <div>
            <Card className="p-6 mb-4">
              <h2 className="text-xl font-bold mb-4">Đơn hàng của bạn</h2>
              <div className="space-y-2">
                {cartItems.map((item) => {
                  const product = item.products;
                  const price = product.price * (1 - (product.discount_percent || 0) / 100);
                  return (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{product.name} x{item.quantity}</span>
                      <span>{(price * item.quantity).toLocaleString()}đ</span>
                    </div>
                  );
                })}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Tổng cộng:</span>
                  <span className="text-primary">{calculateTotal().toLocaleString()}đ</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 mb-4">
              <h2 className="text-xl font-bold mb-4">Thông tin chuyển khoản</h2>
              <div className="flex flex-col items-center gap-4">
                <QRCodeSVG 
                  value={`|${bankInfo.bank}|${bankInfo.accountNumber}|${bankInfo.accountName}|${bankInfo.amount}|${bankInfo.message}`}
                  size={200}
                  level="H"
                />
                <div className="text-sm space-y-1 w-full">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngân hàng:</span>
                    <span className="font-semibold">{bankInfo.bank || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số TK:</span>
                    <span className="font-semibold">{bankInfo.accountNumber || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tên TK:</span>
                    <span className="font-semibold">{bankInfo.accountName || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số tiền:</span>
                    <span className="font-semibold text-primary">{totalAmount.toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nội dung:</span>
                    <span className="font-semibold">{bankInfo.message}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Quét mã QR hoặc chuyển khoản theo thông tin trên
                </p>
              </div>
            </Card>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? "Đang xử lý..." : "Xác nhận đã chuyển khoản"}
            </Button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default Payment;
