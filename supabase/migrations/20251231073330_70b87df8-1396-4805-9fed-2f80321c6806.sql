-- Add a single source of truth for blocking users
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false;

-- Backfill from legacy account_status (if it exists and was used)
UPDATE public.profiles
SET is_blocked = (account_status = 'blocked')
WHERE account_status IS NOT NULL;

-- Helper function (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_blocked(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_blocked FROM public.profiles WHERE id = _user_id), false)
$$;

-- PROFILES: allow admins to block/unblock any user
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- PROFILES: prevent blocked users from updating their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Active users can update own profile"
ON public.profiles
FOR UPDATE
USING ((id = auth.uid()) AND (NOT is_blocked(auth.uid())))
WITH CHECK ((id = auth.uid()) AND (NOT is_blocked(auth.uid())));

-- ORDERS: prevent blocked users from creating new orders (existing orders remain viewable)
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Active users can create orders"
ON public.orders
FOR INSERT
WITH CHECK ((auth.uid() = user_id) AND (NOT is_blocked(auth.uid())));

-- DESIGN REQUESTS: prevent blocked users from uploading/creating new design requests
DROP POLICY IF EXISTS "Users can create own design requests" ON public.design_requests;
CREATE POLICY "Active users can create own design requests"
ON public.design_requests
FOR INSERT
WITH CHECK ((auth.uid() = user_id) AND (NOT is_blocked(auth.uid())));

-- DESIGN PAYMENTS: prevent blocked users from initiating payments
DROP POLICY IF EXISTS "Users can create payments" ON public.design_payments;
CREATE POLICY "Active users can create payments"
ON public.design_payments
FOR INSERT
WITH CHECK (
  (NOT is_blocked(auth.uid()))
  AND EXISTS (
    SELECT 1
    FROM public.design_requests
    WHERE design_requests.id = design_payments.design_request_id
      AND design_requests.user_id = auth.uid()
  )
);

-- QUOTATION MESSAGES: prevent blocked users from sending messages
DROP POLICY IF EXISTS "Users can send messages" ON public.quotation_messages;
CREATE POLICY "Active users can send messages"
ON public.quotation_messages
FOR INSERT
WITH CHECK (
  (sender_role = 'user'::text)
  AND (sender_id = auth.uid())
  AND (NOT is_blocked(auth.uid()))
  AND EXISTS (
    SELECT 1
    FROM public.design_requests
    WHERE design_requests.id = quotation_messages.design_request_id
      AND design_requests.user_id = auth.uid()
  )
);

-- QUOTATION NEGOTIATIONS: prevent blocked users from negotiating
DROP POLICY IF EXISTS "Users can create negotiations" ON public.quotation_negotiations;
CREATE POLICY "Active users can create negotiations"
ON public.quotation_negotiations
FOR INSERT
WITH CHECK (
  (sender_role = 'user'::text)
  AND (sender_id = auth.uid())
  AND (NOT is_blocked(auth.uid()))
  AND EXISTS (
    SELECT 1
    FROM public.design_requests
    WHERE design_requests.id = quotation_negotiations.design_request_id
      AND design_requests.user_id = auth.uid()
  )
);

-- USER ADDRESSES: block all address ops for blocked users
DROP POLICY IF EXISTS "Require auth for addresses" ON public.user_addresses;
CREATE POLICY "Active users can manage addresses"
ON public.user_addresses
FOR ALL
USING ((auth.uid() IS NOT NULL) AND (auth.uid() = user_id) AND (NOT is_blocked(auth.uid())))
WITH CHECK ((auth.uid() IS NOT NULL) AND (auth.uid() = user_id) AND (NOT is_blocked(auth.uid())));

-- CART: block all cart ops for blocked users
DROP POLICY IF EXISTS "Require auth for cart operations" ON public.cart_items;
CREATE POLICY "Active users can manage cart"
ON public.cart_items
FOR ALL
USING ((auth.uid() IS NOT NULL) AND (auth.uid() = user_id) AND (NOT is_blocked(auth.uid())))
WITH CHECK ((auth.uid() IS NOT NULL) AND (auth.uid() = user_id) AND (NOT is_blocked(auth.uid())));

-- WISHLIST: prevent blocked users from modifying wishlist
DROP POLICY IF EXISTS "Users can add to own wishlist" ON public.wishlist;
CREATE POLICY "Active users can add to own wishlist"
ON public.wishlist
FOR INSERT
WITH CHECK ((auth.uid() = user_id) AND (NOT is_blocked(auth.uid())));

DROP POLICY IF EXISTS "Users can remove from own wishlist" ON public.wishlist;
CREATE POLICY "Active users can remove from own wishlist"
ON public.wishlist
FOR DELETE
USING ((auth.uid() = user_id) AND (NOT is_blocked(auth.uid())));

-- PRODUCT REVIEWS: prevent blocked users from writing/updating/deleting reviews
DROP POLICY IF EXISTS "Users can create reviews" ON public.product_reviews;
CREATE POLICY "Active users can create reviews"
ON public.product_reviews
FOR INSERT
WITH CHECK ((auth.uid() = user_id) AND (NOT is_blocked(auth.uid())));

DROP POLICY IF EXISTS "Users can update own reviews" ON public.product_reviews;
CREATE POLICY "Active users can update own reviews"
ON public.product_reviews
FOR UPDATE
USING ((auth.uid() = user_id) AND (NOT is_blocked(auth.uid())))
WITH CHECK ((auth.uid() = user_id) AND (NOT is_blocked(auth.uid())));

DROP POLICY IF EXISTS "Users can delete own reviews" ON public.product_reviews;
CREATE POLICY "Active users can delete own reviews"
ON public.product_reviews
FOR DELETE
USING ((auth.uid() = user_id) AND (NOT is_blocked(auth.uid())));
