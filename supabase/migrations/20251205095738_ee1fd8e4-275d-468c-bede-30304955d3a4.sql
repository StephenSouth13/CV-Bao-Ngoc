-- Drop the public access policy on contacts
DROP POLICY IF EXISTS "Anyone can view contacts" ON public.contacts;

-- Create admin-only view policy
CREATE POLICY "Admins can view contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));