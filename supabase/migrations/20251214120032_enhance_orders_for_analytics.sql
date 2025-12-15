-- Add verification tracking to orders table
-- This allows tracking confirmed orders separately from pending/rejected
-- Revenue should only count verified & approved orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_by UUID,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment to explain status flow
COMMENT ON COLUMN public.orders.status IS 'Order status: pending (awaiting review), approved (reviewed and accepted), rejected (review declined). Revenue only counts for approved orders. verified_at tracks when admin confirmed the order.';

COMMENT ON COLUMN public.orders.verified_at IS 'Timestamp when admin confirmed/verified this order. Orders must be approved AND verified to count towards revenue.';

COMMENT ON COLUMN public.orders.notes IS 'Internal notes from admin about the order.';

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_verified_at ON public.orders(verified_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- Update RLS policy to include note access for admins
-- This is already handled by existing "Admins can update orders" policy

-- Function to calculate revenue by date range (for analytics)
CREATE OR REPLACE FUNCTION public.get_revenue_by_period(
  p_period TEXT DEFAULT 'month',
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  period TEXT,
  revenue NUMERIC,
  order_count INTEGER,
  verified_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date TIMESTAMP WITH TIME ZONE;
  v_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Default to last 12 months if no dates provided
  v_end_date := COALESCE(p_end_date, NOW());
  v_start_date := COALESCE(p_start_date, NOW() - INTERVAL '1 year');

  IF p_period = 'week' THEN
    RETURN QUERY
    SELECT 
      TO_CHAR(DATE_TRUNC('week', orders.created_at), 'YYYY-MM-DD') AS period,
      COALESCE(SUM(CASE WHEN orders.status = 'approved' AND orders.verified_at IS NOT NULL THEN orders.total_amount ELSE 0 END), 0::NUMERIC) AS revenue,
      COUNT(*)::INTEGER AS order_count,
      COUNT(CASE WHEN orders.verified_at IS NOT NULL THEN 1 END)::INTEGER AS verified_count
    FROM public.orders
    WHERE orders.created_at >= v_start_date 
      AND orders.created_at <= v_end_date
    GROUP BY DATE_TRUNC('week', orders.created_at)
    ORDER BY period DESC;

  ELSIF p_period = 'month' THEN
    RETURN QUERY
    SELECT 
      TO_CHAR(DATE_TRUNC('month', orders.created_at), 'YYYY-MM') AS period,
      COALESCE(SUM(CASE WHEN orders.status = 'approved' AND orders.verified_at IS NOT NULL THEN orders.total_amount ELSE 0 END), 0::NUMERIC) AS revenue,
      COUNT(*)::INTEGER AS order_count,
      COUNT(CASE WHEN orders.verified_at IS NOT NULL THEN 1 END)::INTEGER AS verified_count
    FROM public.orders
    WHERE orders.created_at >= v_start_date 
      AND orders.created_at <= v_end_date
    GROUP BY DATE_TRUNC('month', orders.created_at)
    ORDER BY period DESC;

  ELSIF p_period = 'quarter' THEN
    RETURN QUERY
    SELECT 
      TO_CHAR(DATE_TRUNC('quarter', orders.created_at), 'YYYY-"Q"Q') AS period,
      COALESCE(SUM(CASE WHEN orders.status = 'approved' AND orders.verified_at IS NOT NULL THEN orders.total_amount ELSE 0 END), 0::NUMERIC) AS revenue,
      COUNT(*)::INTEGER AS order_count,
      COUNT(CASE WHEN orders.verified_at IS NOT NULL THEN 1 END)::INTEGER AS verified_count
    FROM public.orders
    WHERE orders.created_at >= v_start_date 
      AND orders.created_at <= v_end_date
    GROUP BY DATE_TRUNC('quarter', orders.created_at)
    ORDER BY period DESC;

  ELSIF p_period = 'year' THEN
    RETURN QUERY
    SELECT 
      TO_CHAR(DATE_TRUNC('year', orders.created_at), 'YYYY') AS period,
      COALESCE(SUM(CASE WHEN orders.status = 'approved' AND orders.verified_at IS NOT NULL THEN orders.total_amount ELSE 0 END), 0::NUMERIC) AS revenue,
      COUNT(*)::INTEGER AS order_count,
      COUNT(CASE WHEN orders.verified_at IS NOT NULL THEN 1 END)::INTEGER AS verified_count
    FROM public.orders
    WHERE orders.created_at >= v_start_date 
      AND orders.created_at <= v_end_date
    GROUP BY DATE_TRUNC('year', orders.created_at)
    ORDER BY period DESC;

  ELSE
    -- Default to month if invalid period
    RETURN QUERY
    SELECT 
      TO_CHAR(DATE_TRUNC('month', orders.created_at), 'YYYY-MM') AS period,
      COALESCE(SUM(CASE WHEN orders.status = 'approved' AND orders.verified_at IS NOT NULL THEN orders.total_amount ELSE 0 END), 0::NUMERIC) AS revenue,
      COUNT(*)::INTEGER AS order_count,
      COUNT(CASE WHEN orders.verified_at IS NOT NULL THEN 1 END)::INTEGER AS verified_count
    FROM public.orders
    WHERE orders.created_at >= v_start_date 
      AND orders.created_at <= v_end_date
    GROUP BY DATE_TRUNC('month', orders.created_at)
    ORDER BY period DESC;
  END IF;
END;
$$;

-- Function to get total revenue (only approved & verified orders)
CREATE OR REPLACE FUNCTION public.get_total_verified_revenue()
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(total_amount), 0::NUMERIC)
  FROM public.orders
  WHERE status = 'approved' AND verified_at IS NOT NULL;
$$;

-- Function to get pending revenue (approved but not verified)
CREATE OR REPLACE FUNCTION public.get_pending_revenue()
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(total_amount), 0::NUMERIC)
  FROM public.orders
  WHERE status = 'approved' AND verified_at IS NULL;
$$;
