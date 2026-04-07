export const ORDERS_BASE_QUERY = `
  SELECT
    o.order_id,
    u.name AS user,
    p.model,
    COALESCE(
      array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL),
      '{}'
    ) AS tags,
    o.order_date,
    sh.change_date AS current_status_date,
    s.state_name AS status
  FROM orders o
  JOIN users u ON u.user_id = o.user_id
  JOIN products p ON p.product_id = o.product_id
  LEFT JOIN products_tags pt ON pt.product_id = p.product_id
  LEFT JOIN tags t ON t.tag_id = pt.tag_id
  LEFT JOIN state_history sh ON sh.order_id = o.order_id AND sh.current_state = true
  LEFT JOIN states s ON s.state_id = sh.state_id`;

export const ORDERS_GROUP_ORDER = `
  GROUP BY o.order_id, u.name, p.model, o.order_date, sh.change_date, s.state_name
  ORDER BY o.order_id`;
