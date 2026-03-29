-- Trigger: Auto-update products.rating and review_count on review changes
CREATE OR REPLACE FUNCTION update_product_review_stats()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE products SET
      review_count = (SELECT count(*) FROM reviews WHERE product_id = OLD.product_id),
      rating = COALESCE((SELECT round(avg(rating)::numeric, 1) FROM reviews WHERE product_id = OLD.product_id), 0)
    WHERE id = OLD.product_id;
    RETURN OLD;
  ELSE
    UPDATE products SET
      review_count = (SELECT count(*) FROM reviews WHERE product_id = NEW.product_id),
      rating = COALESCE((SELECT round(avg(rating)::numeric, 1) FROM reviews WHERE product_id = NEW.product_id), 0)
    WHERE id = NEW.product_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_review_stats ON reviews;
CREATE TRIGGER trg_review_stats
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_review_stats();

-- Function: Increment coupon used_count atomically
CREATE OR REPLACE FUNCTION increment_coupon_used(coupon_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE coupons SET used_count = used_count + 1 WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
