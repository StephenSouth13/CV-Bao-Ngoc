-- Create or replace update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create chatbot training table
CREATE TABLE public.chatbot_training (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keywords TEXT[] NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'vi',
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chatbot_training ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active chatbot training"
ON public.chatbot_training
FOR SELECT
USING (active = true);

CREATE POLICY "Admins can manage chatbot training"
ON public.chatbot_training
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_chatbot_training_updated_at
BEFORE UPDATE ON public.chatbot_training
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();