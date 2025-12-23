-- Add explicit anonymous access denial policies to all sensitive tables

-- 1. Profiles - explicit auth required
CREATE POLICY "Require auth for profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND (id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)));

-- Drop the old policy and recreate with proper logic
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- 2. User addresses - explicit auth required  
CREATE POLICY "Require auth for addresses"
ON public.user_addresses
FOR ALL
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Drop old policies and keep only the secure one
DROP POLICY IF EXISTS "Users can view own addresses" ON public.user_addresses;
DROP POLICY IF EXISTS "Users can create own addresses" ON public.user_addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON public.user_addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON public.user_addresses;

-- 3. Orders - explicit auth required
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Require auth for orders select"
ON public.orders
FOR SELECT
USING (auth.uid() IS NOT NULL AND (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role)));

-- 4. Cart items - explicit auth required
DROP POLICY IF EXISTS "Users can view own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can add to cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can remove from cart" ON public.cart_items;

CREATE POLICY "Require auth for cart operations"
ON public.cart_items
FOR ALL
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 5. Order items - explicit auth required
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Require auth for order items select"
ON public.order_items
FOR SELECT
USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM orders 
  WHERE orders.id = order_items.order_id 
  AND (orders.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

-- 6. User roles - explicit auth required (users can only see their own)
DROP POLICY IF EXISTS "Users can check own role" ON public.user_roles;
CREATE POLICY "Require auth for role check"
ON public.user_roles
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 7. Invoices - ensure auth required
DROP POLICY IF EXISTS "Only admins can view invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;
CREATE POLICY "Only admins can manage invoices"
ON public.invoices
FOR ALL
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));