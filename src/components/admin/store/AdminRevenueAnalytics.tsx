import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp } from "lucide-react";

type PeriodType = 'week' | 'month' | 'quarter' | 'year';

const AdminRevenueAnalytics = () => {
  const [period, setPeriod] = useState<PeriodType>('month');

  const { data: revenueData = [], isLoading } = useQuery({
    queryKey: ['revenue-analytics', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_revenue_by_period', {
          p_period: period
        });

      if (error) {
        console.error('Error fetching revenue data:', error);
        return [];
      }

      return data || [];
    }
  });

  const { data: verifiedRevenue = 0 } = useQuery({
    queryKey: ['verified-revenue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_total_verified_revenue');

      if (error) {
        console.error('Error fetching verified revenue:', error);
        return 0;
      }

      return data || 0;
    }
  });

  const { data: pendingRevenue = 0 } = useQuery({
    queryKey: ['pending-revenue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_pending_revenue');

      if (error) {
        console.error('Error fetching pending revenue:', error);
        return 0;
      }

      return data || 0;
    }
  });

  const getTotalRevenue = () => {
    return revenueData.reduce((sum: number, item: any) => sum + Number(item.revenue), 0);
  };

  const getTotalOrders = () => {
    return revenueData.reduce((sum: number, item: any) => sum + (item.order_count || 0), 0);
  };

  const getTotalVerified = () => {
    return revenueData.reduce((sum: number, item: any) => sum + (item.verified_count || 0), 0);
  };

  const getPeriodLabel = () => {
    const labels: Record<PeriodType, string> = {
      week: 'Tuần',
      month: 'Tháng',
      quarter: 'Quý',
      year: 'Năm'
    };
    return labels[period];
  };

  const formattedData = revenueData.map((item: any) => ({
    ...item,
    revenue: Number(item.revenue) || 0
  }));

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Doanh thu đã xác nhận</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {Number(verifiedRevenue).toLocaleString()}đ
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Từ các đơn hàng đã được duyệt và xác nhận
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Doanh thu chờ xác nhận</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {Number(pendingRevenue).toLocaleString()}đ
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Từ các đơn hàng đã duyệt nhưng chưa xác nhận
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng ({getPeriodLabel()})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {getTotalRevenue().toLocaleString()}đ
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {getTotalOrders()} đơn hàng, {getTotalVerified()} đã xác nhận
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Biểu đồ doanh thu
            </CardTitle>
            <Tabs value={period} onValueChange={(val) => setPeriod(val as PeriodType)}>
              <TabsList>
                <TabsTrigger value="week" className="text-xs">Tuần</TabsTrigger>
                <TabsTrigger value="month" className="text-xs">Tháng</TabsTrigger>
                <TabsTrigger value="quarter" className="text-xs">Quý</TabsTrigger>
                <TabsTrigger value="year" className="text-xs">Năm</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {formattedData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `${value.toLocaleString()}đ`}
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" name="Doanh thu" />
                <Bar dataKey="order_count" fill="#3b82f6" name="Số đơn hàng" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              Không có dữ liệu
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết theo {getPeriodLabel()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-3 font-semibold">{getPeriodLabel()}</th>
                  <th className="pb-3 font-semibold text-right">Doanh thu</th>
                  <th className="pb-3 font-semibold text-right">Đơn hàng</th>
                  <th className="pb-3 font-semibold text-right">Đã xác nhận</th>
                  <th className="pb-3 font-semibold text-right">TB/đơn</th>
                </tr>
              </thead>
              <tbody>
                {formattedData.map((item: any, index: number) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="py-3">{item.period}</td>
                    <td className="py-3 text-right font-semibold">
                      {Number(item.revenue).toLocaleString()}đ
                    </td>
                    <td className="py-3 text-right">{item.order_count}</td>
                    <td className="py-3 text-right text-green-600">{item.verified_count}</td>
                    <td className="py-3 text-right text-muted-foreground">
                      {item.order_count > 0 
                        ? Math.round(Number(item.revenue) / item.order_count).toLocaleString()
                        : 0}đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRevenueAnalytics;
