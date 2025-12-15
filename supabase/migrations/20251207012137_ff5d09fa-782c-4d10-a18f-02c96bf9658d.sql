-- Add product_type column to products table to distinguish between products and courses
ALTER TABLE public.products 
ADD COLUMN product_type text NOT NULL DEFAULT 'product';

-- Add comment for clarity
COMMENT ON COLUMN public.products.product_type IS 'Type of product: product or course';

-- Create index for filtering
CREATE INDEX idx_products_product_type ON public.products(product_type);