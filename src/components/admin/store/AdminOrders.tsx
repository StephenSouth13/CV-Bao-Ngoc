import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState("");

  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              name,
              image_url
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);

      if (orderError) throw orderError;

      // If approved, update product stock
      if (status === 'approved') {
        const order = orders.find((o: any) => o.id === id);
        if (order) {
          for (const item of order.order_items) {
            const { data: product } = await supabase
              .from('products')
              .select('stock_quantity')
              .eq('id', item.product_id)
              .single();

            if (product) {
              await supabase
                .from('products')
                .update({ stock_quantity: product.stock_quantity - item.quantity })
                .eq('id', item.product_id);
            }
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success("Đã cập nhật trạng thái đơn hàng");
    }
  });

  const verifyOrderMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({
          verified_at: new Date().toISOString(),
          notes: notes || null
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setVerifyDialogOpen(false);
      setVerifyNotes("");
      setSelectedOrderId(null);
      toast.success("Đã xác nhận đơn hàng");
    }
  });

  const unverifyOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('orders')
        .update({
          verified_at: null,
          notes: null
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success("Đã hủy xác nhận đơn hàng");
    }
  });

  const getStatusBadge = (status: string, verified: boolean) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: "secondary", icon: Clock, label: "Chờ duyệt" },
      approved: { variant: "default", icon: Check, label: "Đã duyệt" },
      rejected: { variant: "destructive", icon: X, label: "Từ chối" }
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <div className="flex gap-2">
        <Badge variant={config.variant as any}>
          <Icon className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
        {verified && (
          <Badge variant="outline" className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
            <span className="text-green-600">Đã xác nhận</span>
          </Badge>
        )}
        {status === 'approved' && !verified && (
          <Badge variant="outline" className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-3 w-3 mr-1 text-amber-600" />
            <span className="text-amber-600">Chờ xác nhận</span>
          </Badge>
        )}
      </div>
    );
  };

  const filterOrders = (status: string) => {
    return orders.filter((order: any) => order.status === status);
  };

  const OrderCard = ({ order }: { order: any }) => (
    <Collapsible>
      <Card className="p-4">
        <CollapsibleTrigger className="w-full">
          <div className="flex justify-between items-start gap-4">
            <div className="text-left flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="font-semibold">{order.customer_name}</h3>
                {getStatusBadge(order.status, !!order.verified_at)}
              </div>
              <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
              <p className="text-sm text-muted-foreground truncate">{order.customer_address}</p>
              {order.verified_at && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Xác nhận vào {new Date(order.verified_at).toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-lg text-primary">
                {Number(order.total_amount).toLocaleString()}đ
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString('vi-VN')}
              </p>
              <ChevronDown className="h-4 w-4 ml-auto mt-2" />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4 space-y-4">
          <div className="border-t pt-4 space-y-3">
            <div>
              <h4 className="font-semibold mb-2">Thông tin liên hệ:</h4>
              <div className="bg-muted/50 p-3 rounded text-sm space-y-1">
                <p><strong>Tên:</strong> {order.customer_name}</p>
                <p><strong>Điện thoại:</strong> {order.customer_phone}</p>
                <p><strong>Địa chỉ:</strong> {order.customer_address}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Chi tiết đơn hàng:</h4>
              <div className="space-y-2">
                {order.order_items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm bg-muted/30 p-2 rounded">
                    <span>
                      {item.products.name} x{item.quantity}
                      {item.selected_color && ` - ${item.selected_color}`}
                      {item.selected_size && ` - ${item.selected_size}`}
                    </span>
                    <span className="font-semibold">{(Number(item.product_price) * item.quantity).toLocaleString()}đ</span>
                  </div>
                ))}
              </div>
            </div>

            {order.delivery_time && (
              <div className="text-sm border-l-2 border-blue-500 pl-3 py-2">
                <strong>Thời gian nhận:</strong> {order.delivery_time}
              </div>
            )}

            {order.customer_message && (
              <div className="text-sm border-l-2 border-blue-500 pl-3 py-2">
                <strong>Ghi chú khách hàng:</strong> {order.customer_message}
              </div>
            )}

            {order.notes && (
              <div className="text-sm border-l-2 border-green-500 pl-3 py-2 bg-green-50">
                <strong>Ghi chú admin:</strong> {order.notes}
              </div>
            )}
          </div>

          <div className="border-t pt-4 space-y-2">
            {order.status === 'pending' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'approved' })}
                  disabled={updateStatusMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Duyệt đơn
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'rejected' })}
                  disabled={updateStatusMutation.isPending}
                >
                  <X className="h-4 w-4 mr-1" />
                  Từ chối
                </Button>
              </div>
            )}

            {order.status === 'approved' && (
              <div className="flex gap-2">
                {!order.verified_at ? (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setVerifyDialogOpen(true);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Xác nhận đơn hàng
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => unverifyOrderMutation.mutate(order.id)}
                    disabled={unverifyOrderMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Hủy xác nhận
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'rejected' })}
                  disabled={updateStatusMutation.isPending}
                >
                  <X className="h-4 w-4 mr-1" />
                  Từ chối
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );

  const approvedUnverified = orders.filter((o: any) => o.status === 'approved' && !o.verified_at).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Quản lý đơn hàng</h2>
        {approvedUnverified > 0 && (
          <Badge variant="outline" className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 mr-1 text-amber-600" />
            <span className="text-amber-600">{approvedUnverified} chờ xác nhận</span>
          </Badge>
        )}
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Chờ duyệt ({filterOrders('pending').length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Đã duyệt ({filterOrders('approved').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Từ chối ({filterOrders('rejected').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {filterOrders('pending').length > 0 ? (
            filterOrders('pending').map((order: any) => (
              <OrderCard key={order.id} order={order} />
            ))
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              Không có đơn hàng chờ duyệt
            </Card>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4 mt-4">
          {filterOrders('approved').length > 0 ? (
            filterOrders('approved').map((order: any) => (
              <OrderCard key={order.id} order={order} />
            ))
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              Không có đơn hàng đã duyệt
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4 mt-4">
          {filterOrders('rejected').length > 0 ? (
            filterOrders('rejected').map((order: any) => (
              <OrderCard key={order.id} order={order} />
            ))
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              Không có đơn hàng bị từ chối
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận đơn hàng</DialogTitle>
            <DialogDescription>
              Xác nhận rằng đơn hàng này sẽ được xử lý và đơn hàng sẽ được tính vào doanh thu
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="verify-notes">Ghi chú (tùy chọn)</Label>
              <Textarea
                id="verify-notes"
                placeholder="Ví dụ: Đã kiểm tra, sẵn sàng giao hàng..."
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setVerifyDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                onClick={() => {
                  if (selectedOrderId) {
                    verifyOrderMutation.mutate({
                      id: selectedOrderId,
                      notes: verifyNotes
                    });
                  }
                }}
                disabled={verifyOrderMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Xác nhận
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
