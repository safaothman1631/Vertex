-- Trash table for soft-delete
CREATE TABLE IF NOT EXISTS public.trash (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name  text NOT NULL,
  record_id   uuid NOT NULL,
  record_data jsonb NOT NULL,
  deleted_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  deleted_at  timestamptz DEFAULT now(),
  expires_at  timestamptz DEFAULT (now() + interval '30 days')
);

ALTER TABLE public.trash ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trash' AND policyname = 'Admins can manage trash') THEN
    CREATE POLICY "Admins can manage trash" ON public.trash FOR ALL
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
  END IF;
END $$;

-- Auto-purge function
CREATE OR REPLACE FUNCTION public.purge_expired_trash()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM public.trash WHERE expires_at < now();
END;
$$;

-- Missing RLS policies for admin delete
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Admins can delete orders') THEN
    CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Admins can delete order items') THEN
    CREATE POLICY "Admins can delete order items" ON public.order_items FOR DELETE
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'Admins can delete contact messages') THEN
    CREATE POLICY "Admins can delete contact messages" ON public.contact_messages FOR DELETE
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
  END IF;
END $$;
