-- Seed file for Hostinger MySQL (products + variants + cover + orders)
-- Run this in Hostinger phpMyAdmin or MySQL client.
-- It is idempotent (uses CREATE TABLE IF NOT EXISTS + ON DUPLICATE KEY UPDATE).

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;


CREATE TABLE IF NOT EXISTS settings_homepage_cover (
  id TINYINT NOT NULL PRIMARY KEY,
  desktop_url TEXT NULL,
  mobile_url TEXT NULL,
  link_url TEXT NULL,
  linked_product_slug VARCHAR(255) NULL,
  alt_text VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_number VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  city VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  reference VARCHAR(128) NOT NULL,
  product_image TEXT NULL,
  color VARCHAR(128) NOT NULL,
  size VARCHAR(128) NOT NULL,
  unit_price INT NOT NULL,
  subtotal INT NOT NULL,
  quantity INT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_order_number (order_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  slug VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  reference VARCHAR(128) NOT NULL,
  description TEXT NOT NULL,
  detailed_description TEXT NULL,
  category VARCHAR(64) NOT NULL,
  best_seller TINYINT(1) NOT NULL DEFAULT 0,
  stock_text VARCHAR(255) NOT NULL,
  landing_json TEXT NULL,
  material VARCHAR(255) NULL,
  dimensions VARCHAR(255) NULL,
  weight VARCHAR(255) NULL,
  wheels VARCHAR(255) NULL,
  lock_info VARCHAR(255) NULL,
  handle_info VARCHAR(255) NULL,
  warranty VARCHAR(255) NULL,
  shipping VARCHAR(255) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_variants (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL,
  color_name VARCHAR(128) NOT NULL,
  color_hex VARCHAR(16) NOT NULL,
  available TINYINT(1) NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS variant_images (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  variant_id VARCHAR(64) NOT NULL,
  sort_order INT NOT NULL,
  url TEXT NOT NULL,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_variant_sort (variant_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS variant_media (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  variant_id VARCHAR(64) NOT NULL,
  sort_order INT NOT NULL,
  media_type VARCHAR(16) NOT NULL,
  url TEXT NOT NULL,
  poster_url TEXT NULL,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_variant_media_sort (variant_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS variant_sizes (
  variant_id VARCHAR(64) NOT NULL,
  size_key VARCHAR(16) NOT NULL,
  price INT NOT NULL DEFAULT 0,
  in_stock TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (variant_id, size_key),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_sizes (
  product_id VARCHAR(64) NOT NULL,
  size_key VARCHAR(16) NOT NULL,
  price INT NOT NULL DEFAULT 0,
  in_stock TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, size_key),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


INSERT INTO settings_homepage_cover
  (id, desktop_url, mobile_url, link_url, linked_product_slug, alt_text)
VALUES
  (1, '/uploads/upl_2300166ed38a0705.jpg', '/uploads/upl_672b95c61141a3bb.jpg', NULL, NULL, 'Couverture boutique valises')
ON DUPLICATE KEY UPDATE
  desktop_url=VALUES(desktop_url),
  mobile_url=VALUES(mobile_url),
  link_url=VALUES(link_url),
  linked_product_slug=VALUES(linked_product_slug),
  alt_text=VALUES(alt_text);


INSERT INTO products (
  id, slug, name, reference, description, detailed_description, category,
  best_seller, stock_text,
  material, dimensions, weight, wheels, lock_info, handle_info, warranty, shipping,
  created_at, updated_at
) VALUES (
  'prod_2506a633ac7d08_19e0934c1de',
  'nouveau-produit',
  'teste',
  'REF-NEW',
  'teste teteste teteste teteste teteste teteste teteste teteste te',
  'teste teteste teteste teteste teteste te',
  'Valises',
  0,
  'Stock limité',
  'Carbon',
  '12',
  '12',
  '12',
  '12',
  '12',
  '12',
  '24-48',
  '2026-05-08 20:08:32',
  '2026-05-08 20:28:51'
) ON DUPLICATE KEY UPDATE
  slug=VALUES(slug),
  name=VALUES(name),
  reference=VALUES(reference),
  description=VALUES(description),
  detailed_description=VALUES(detailed_description),
  category=VALUES(category),
  best_seller=VALUES(best_seller),
  stock_text=VALUES(stock_text),
  material=VALUES(material),
  dimensions=VALUES(dimensions),
  weight=VALUES(weight),
  wheels=VALUES(wheels),
  lock_info=VALUES(lock_info),
  handle_info=VALUES(handle_info),
  warranty=VALUES(warranty),
  shipping=VALUES(shipping),
  created_at=VALUES(created_at),
  updated_at=VALUES(updated_at);


INSERT INTO product_variants (id, product_id, color_name, color_hex)
VALUES ('var_6941dadb05c04_19e0934c1c5', 'prod_2506a633ac7d08_19e0934c1de', 'Noir', '#0A0A0A')
ON DUPLICATE KEY UPDATE
  product_id=VALUES(product_id),
  color_name=VALUES(color_name),
  color_hex=VALUES(color_hex);


INSERT INTO variant_images (variant_id, sort_order, url)
VALUES ('var_6941dadb05c04_19e0934c1c5', 0, '/uploads/upl_191bfd748803d8ff.png')
ON DUPLICATE KEY UPDATE url=VALUES(url);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_6941dadb05c04_19e0934c1c5', '20', 500, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_6941dadb05c04_19e0934c1c5', '24', 300, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_6941dadb05c04_19e0934c1c5', '28', 500, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_6941dadb05c04_19e0934c1c5', 'pack3', 1400, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO product_variants (id, product_id, color_name, color_hex)
VALUES ('var_017d2d354a0df_19e09366d54', 'prod_2506a633ac7d08_19e0934c1de', 'bleu', '#4285F4')
ON DUPLICATE KEY UPDATE
  product_id=VALUES(product_id),
  color_name=VALUES(color_name),
  color_hex=VALUES(color_hex);


INSERT INTO variant_images (variant_id, sort_order, url)
VALUES ('var_017d2d354a0df_19e09366d54', 0, '/uploads/upl_4733c35806026793.png')
ON DUPLICATE KEY UPDATE url=VALUES(url);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_017d2d354a0df_19e09366d54', '20', 23, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_017d2d354a0df_19e09366d54', '24', 23, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_017d2d354a0df_19e09366d54', '28', 12, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_017d2d354a0df_19e09366d54', 'pack3', 23, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO products (
  id, slug, name, reference, description, detailed_description, category,
  best_seller, stock_text,
  material, dimensions, weight, wheels, lock_info, handle_info, warranty, shipping,
  created_at, updated_at
) VALUES (
  'prod_5fa7096b814768_19e0934c1de',
  'aero-abs',
  'Aéro ABS — Coque rigide',
  'GK-AERO-ABS',
  'Coque rigide en ABS premium avec finition mate, roues 360° fluides et poignée télescopique stable. Une valise moderne pour un usage régulier, en cabine comme en soute.',
  NULL,
  'Valises',
  1,
  'Stock limité',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '24–48h',
  '2026-05-08 20:08:32',
  '2026-05-08 20:30:02'
) ON DUPLICATE KEY UPDATE
  slug=VALUES(slug),
  name=VALUES(name),
  reference=VALUES(reference),
  description=VALUES(description),
  detailed_description=VALUES(detailed_description),
  category=VALUES(category),
  best_seller=VALUES(best_seller),
  stock_text=VALUES(stock_text),
  material=VALUES(material),
  dimensions=VALUES(dimensions),
  weight=VALUES(weight),
  wheels=VALUES(wheels),
  lock_info=VALUES(lock_info),
  handle_info=VALUES(handle_info),
  warranty=VALUES(warranty),
  shipping=VALUES(shipping),
  created_at=VALUES(created_at),
  updated_at=VALUES(updated_at);


INSERT INTO product_variants (id, product_id, color_name, color_hex)
VALUES ('var_0c9535cfa97378_19e0934c1de', 'prod_5fa7096b814768_19e0934c1de', 'Noir', '#0A0A0A')
ON DUPLICATE KEY UPDATE
  product_id=VALUES(product_id),
  color_name=VALUES(color_name),
  color_hex=VALUES(color_hex);


INSERT INTO variant_images (variant_id, sort_order, url)
VALUES ('var_0c9535cfa97378_19e0934c1de', 0, '/uploads/upl_0262a4680d92ce66.jpg')
ON DUPLICATE KEY UPDATE url=VALUES(url);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_0c9535cfa97378_19e0934c1de', '20', 449, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_0c9535cfa97378_19e0934c1de', '24', 549, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_0c9535cfa97378_19e0934c1de', '28', 649, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_0c9535cfa97378_19e0934c1de', 'pack3', 0, 0)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO product_variants (id, product_id, color_name, color_hex)
VALUES ('var_08516b2bfd0ee8_19e0947db7f', 'prod_5fa7096b814768_19e0934c1de', 'Noir', '#111112')
ON DUPLICATE KEY UPDATE
  product_id=VALUES(product_id),
  color_name=VALUES(color_name),
  color_hex=VALUES(color_hex);


INSERT INTO variant_images (variant_id, sort_order, url)
VALUES ('var_08516b2bfd0ee8_19e0947db7f', 0, '/uploads/upl_261d3d71e5de8d5d.png')
ON DUPLICATE KEY UPDATE url=VALUES(url);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_08516b2bfd0ee8_19e0947db7f', '20', 0, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_08516b2bfd0ee8_19e0947db7f', '24', 0, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_08516b2bfd0ee8_19e0947db7f', '28', 0, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_08516b2bfd0ee8_19e0947db7f', 'pack3', 0, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO products (
  id, slug, name, reference, description, detailed_description, category,
  best_seller, stock_text,
  material, dimensions, weight, wheels, lock_info, handle_info, warranty, shipping,
  created_at, updated_at
) VALUES (
  'prod_89945db583b39_19e0934c1de',
  'terra-polycarbonate',
  'Terra PC — Polycarbonate',
  'GK-TERRA-PC',
  'Polycarbonate flexible et résistant aux impacts, idéal pour la soute. Le design nervuré protège des chocs tout en gardant une silhouette élégante.',
  NULL,
  'Valises',
  1,
  'Stock limité',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '24–48h',
  '2026-05-08 20:08:32',
  '2026-05-08 20:08:32'
) ON DUPLICATE KEY UPDATE
  slug=VALUES(slug),
  name=VALUES(name),
  reference=VALUES(reference),
  description=VALUES(description),
  detailed_description=VALUES(detailed_description),
  category=VALUES(category),
  best_seller=VALUES(best_seller),
  stock_text=VALUES(stock_text),
  material=VALUES(material),
  dimensions=VALUES(dimensions),
  weight=VALUES(weight),
  wheels=VALUES(wheels),
  lock_info=VALUES(lock_info),
  handle_info=VALUES(handle_info),
  warranty=VALUES(warranty),
  shipping=VALUES(shipping),
  created_at=VALUES(created_at),
  updated_at=VALUES(updated_at);


INSERT INTO product_variants (id, product_id, color_name, color_hex)
VALUES ('var_0cf2a4bf816328_19e0934c1de', 'prod_89945db583b39_19e0934c1de', 'Noir', '#0A0A0A')
ON DUPLICATE KEY UPDATE
  product_id=VALUES(product_id),
  color_name=VALUES(color_name),
  color_hex=VALUES(color_hex);


INSERT INTO variant_images (variant_id, sort_order, url)
VALUES ('var_0cf2a4bf816328_19e0934c1de', 0, '/products/suitcase-terra-1.svg')
ON DUPLICATE KEY UPDATE url=VALUES(url);


INSERT INTO variant_images (variant_id, sort_order, url)
VALUES ('var_0cf2a4bf816328_19e0934c1de', 1, '/products/suitcase-terra-2.svg')
ON DUPLICATE KEY UPDATE url=VALUES(url);


INSERT INTO variant_images (variant_id, sort_order, url)
VALUES ('var_0cf2a4bf816328_19e0934c1de', 2, '/products/suitcase-terra-3.svg')
ON DUPLICATE KEY UPDATE url=VALUES(url);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_0cf2a4bf816328_19e0934c1de', '20', 529, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_0cf2a4bf816328_19e0934c1de', '24', 629, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_0cf2a4bf816328_19e0934c1de', '28', 729, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_0cf2a4bf816328_19e0934c1de', 'pack3', 0, 0)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO products (
  id, slug, name, reference, description, detailed_description, category,
  best_seller, stock_text,
  material, dimensions, weight, wheels, lock_info, handle_info, warranty, shipping,
  created_at, updated_at
) VALUES (
  'prod_df814b18d883a_19e0934c1de',
  'nova-aluminium',
  'Nova — Aluminium (édition)',
  'GK-NOVA-AL',
  'Une valise au style premium, inspirée des éditions aluminium. Angles renforcés, structure stable et détails minimalistes pour un rendu luxueux.',
  NULL,
  'Valises',
  1,
  'Stock limité',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '24–48h',
  '2026-05-08 20:08:32',
  '2026-05-08 20:08:32'
) ON DUPLICATE KEY UPDATE
  slug=VALUES(slug),
  name=VALUES(name),
  reference=VALUES(reference),
  description=VALUES(description),
  detailed_description=VALUES(detailed_description),
  category=VALUES(category),
  best_seller=VALUES(best_seller),
  stock_text=VALUES(stock_text),
  material=VALUES(material),
  dimensions=VALUES(dimensions),
  weight=VALUES(weight),
  wheels=VALUES(wheels),
  lock_info=VALUES(lock_info),
  handle_info=VALUES(handle_info),
  warranty=VALUES(warranty),
  shipping=VALUES(shipping),
  created_at=VALUES(created_at),
  updated_at=VALUES(updated_at);


INSERT INTO product_variants (id, product_id, color_name, color_hex)
VALUES ('var_da797ebe3f8a48_19e0934c1de', 'prod_df814b18d883a_19e0934c1de', 'Alu', '#B9C0C7')
ON DUPLICATE KEY UPDATE
  product_id=VALUES(product_id),
  color_name=VALUES(color_name),
  color_hex=VALUES(color_hex);


INSERT INTO variant_images (variant_id, sort_order, url)
VALUES ('var_da797ebe3f8a48_19e0934c1de', 0, '/products/suitcase-nova-1.svg')
ON DUPLICATE KEY UPDATE url=VALUES(url);


INSERT INTO variant_images (variant_id, sort_order, url)
VALUES ('var_da797ebe3f8a48_19e0934c1de', 1, '/products/suitcase-nova-2.svg')
ON DUPLICATE KEY UPDATE url=VALUES(url);


INSERT INTO variant_images (variant_id, sort_order, url)
VALUES ('var_da797ebe3f8a48_19e0934c1de', 2, '/products/suitcase-nova-3.svg')
ON DUPLICATE KEY UPDATE url=VALUES(url);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_da797ebe3f8a48_19e0934c1de', '20', 799, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_da797ebe3f8a48_19e0934c1de', '24', 899, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_da797ebe3f8a48_19e0934c1de', '28', 0, 0)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_da797ebe3f8a48_19e0934c1de', 'pack3', 0, 0)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO products (
  id, slug, name, reference, description, detailed_description, category,
  best_seller, stock_text,
  material, dimensions, weight, wheels, lock_info, handle_info, warranty, shipping,
  created_at, updated_at
) VALUES (
  'prod_212ac849e18068_19e0934c1de',
  'silk-softshell',
  'Silk — Softshell extensible',
  'GK-SILK-SOFT',
  'Softshell texturé avec poche frontale et zip extensible pour gagner de la place. Parfait pour les voyages où la flexibilité compte.',
  NULL,
  'Valises',
  0,
  'Stock limité',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '24–48h',
  '2026-05-08 20:08:32',
  '2026-05-08 20:08:32'
) ON DUPLICATE KEY UPDATE
  slug=VALUES(slug),
  name=VALUES(name),
  reference=VALUES(reference),
  description=VALUES(description),
  detailed_description=VALUES(detailed_description),
  category=VALUES(category),
  best_seller=VALUES(best_seller),
  stock_text=VALUES(stock_text),
  material=VALUES(material),
  dimensions=VALUES(dimensions),
  weight=VALUES(weight),
  wheels=VALUES(wheels),
  lock_info=VALUES(lock_info),
  handle_info=VALUES(handle_info),
  warranty=VALUES(warranty),
  shipping=VALUES(shipping),
  created_at=VALUES(created_at),
  updated_at=VALUES(updated_at);


INSERT INTO product_variants (id, product_id, color_name, color_hex)
VALUES ('var_da5b41bf46eda_19e0934c1de', 'prod_212ac849e18068_19e0934c1de', 'Noir', '#0A0A0A')
ON DUPLICATE KEY UPDATE
  product_id=VALUES(product_id),
  color_name=VALUES(color_name),
  color_hex=VALUES(color_hex);


INSERT INTO variant_images (variant_id, sort_order, url)
VALUES ('var_da5b41bf46eda_19e0934c1de', 0, '/products/suitcase-silk-1.svg')
ON DUPLICATE KEY UPDATE url=VALUES(url);


INSERT INTO variant_images (variant_id, sort_order, url)
VALUES ('var_da5b41bf46eda_19e0934c1de', 1, '/products/suitcase-silk-2.svg')
ON DUPLICATE KEY UPDATE url=VALUES(url);


INSERT INTO variant_images (variant_id, sort_order, url)
VALUES ('var_da5b41bf46eda_19e0934c1de', 2, '/products/suitcase-silk-3.svg')
ON DUPLICATE KEY UPDATE url=VALUES(url);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_da5b41bf46eda_19e0934c1de', '20', 479, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_da5b41bf46eda_19e0934c1de', '24', 579, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_da5b41bf46eda_19e0934c1de', '28', 679, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_da5b41bf46eda_19e0934c1de', 'pack3', 0, 0)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO products (
  id, slug, name, reference, description, detailed_description, category,
  best_seller, stock_text,
  material, dimensions, weight, wheels, lock_info, handle_info, warranty, shipping,
  created_at, updated_at
) VALUES (
  'prod_002d51998feb6_19e0934c1de',
  'orbit-zipperless',
  'Orbit — Fermeture sécurisée',
  'GK-ORBIT-SEC',
  'Structure stable et fermeture sécurisée pour voyager sereinement. Une option robuste avec un design premium et discret.',
  NULL,
  'Valises',
  0,
  'Stock limité',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '24–48h',
  '2026-05-08 20:08:32',
  '2026-05-08 20:08:32'
) ON DUPLICATE KEY UPDATE
  slug=VALUES(slug),
  name=VALUES(name),
  reference=VALUES(reference),
  description=VALUES(description),
  detailed_description=VALUES(detailed_description),
  category=VALUES(category),
  best_seller=VALUES(best_seller),
  stock_text=VALUES(stock_text),
  material=VALUES(material),
  dimensions=VALUES(dimensions),
  weight=VALUES(weight),
  wheels=VALUES(wheels),
  lock_info=VALUES(lock_info),
  handle_info=VALUES(handle_info),
  warranty=VALUES(warranty),
  shipping=VALUES(shipping),
  created_at=VALUES(created_at),
  updated_at=VALUES(updated_at);


INSERT INTO product_variants (id, product_id, color_name, color_hex)
VALUES ('var_edc00a2d63fcd_19e0934c1de', 'prod_002d51998feb6_19e0934c1de', 'Noir', '#0A0A0A')
ON DUPLICATE KEY UPDATE
  product_id=VALUES(product_id),
  color_name=VALUES(color_name),
  color_hex=VALUES(color_hex);


INSERT INTO variant_images (variant_id, sort_order, url)
VALUES ('var_edc00a2d63fcd_19e0934c1de', 0, '/products/suitcase-orbit-1.svg')
ON DUPLICATE KEY UPDATE url=VALUES(url);


INSERT INTO variant_images (variant_id, sort_order, url)
VALUES ('var_edc00a2d63fcd_19e0934c1de', 1, '/products/suitcase-orbit-2.svg')
ON DUPLICATE KEY UPDATE url=VALUES(url);


INSERT INTO variant_images (variant_id, sort_order, url)
VALUES ('var_edc00a2d63fcd_19e0934c1de', 2, '/products/suitcase-orbit-3.svg')
ON DUPLICATE KEY UPDATE url=VALUES(url);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_edc00a2d63fcd_19e0934c1de', '20', 569, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_edc00a2d63fcd_19e0934c1de', '24', 669, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_edc00a2d63fcd_19e0934c1de', '28', 769, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_edc00a2d63fcd_19e0934c1de', 'pack3', 0, 0)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO products (
  id, slug, name, reference, description, detailed_description, category,
  best_seller, stock_text,
  material, dimensions, weight, wheels, lock_info, handle_info, warranty, shipping,
  created_at, updated_at
) VALUES (
  'prod_7ede2b135f3a7_19e0934c1de',
  'set-trio',
  'Set Trio — 3 tailles',
  'GK-SET-TRIO',
  'Un trio harmonieux pour couvrir tous vos besoins: cabine, moyenne et grande. Empilables et faciles à ranger, avec un look premium.',
  NULL,
  'Valises',
  0,
  'Stock limité',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '24–48h',
  '2026-05-08 20:08:32',
  '2026-05-08 20:08:32'
) ON DUPLICATE KEY UPDATE
  slug=VALUES(slug),
  name=VALUES(name),
  reference=VALUES(reference),
  description=VALUES(description),
  detailed_description=VALUES(detailed_description),
  category=VALUES(category),
  best_seller=VALUES(best_seller),
  stock_text=VALUES(stock_text),
  material=VALUES(material),
  dimensions=VALUES(dimensions),
  weight=VALUES(weight),
  wheels=VALUES(wheels),
  lock_info=VALUES(lock_info),
  handle_info=VALUES(handle_info),
  warranty=VALUES(warranty),
  shipping=VALUES(shipping),
  created_at=VALUES(created_at),
  updated_at=VALUES(updated_at);


INSERT INTO product_variants (id, product_id, color_name, color_hex)
VALUES ('var_f75c9c356362e8_19e0934c1de', 'prod_7ede2b135f3a7_19e0934c1de', 'Noir', '#0A0A0A')
ON DUPLICATE KEY UPDATE
  product_id=VALUES(product_id),
  color_name=VALUES(color_name),
  color_hex=VALUES(color_hex);


INSERT INTO variant_images (variant_id, sort_order, url)
VALUES ('var_f75c9c356362e8_19e0934c1de', 0, '/products/valise-pack.svg')
ON DUPLICATE KEY UPDATE url=VALUES(url);


INSERT INTO variant_images (variant_id, sort_order, url)
VALUES ('var_f75c9c356362e8_19e0934c1de', 1, '/products/suitcase-set-2.svg')
ON DUPLICATE KEY UPDATE url=VALUES(url);


INSERT INTO variant_images (variant_id, sort_order, url)
VALUES ('var_f75c9c356362e8_19e0934c1de', 2, '/products/suitcase-set-3.svg')
ON DUPLICATE KEY UPDATE url=VALUES(url);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_f75c9c356362e8_19e0934c1de', '20', 0, 0)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_f75c9c356362e8_19e0934c1de', '24', 0, 0)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_f75c9c356362e8_19e0934c1de', '28', 0, 0)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_f75c9c356362e8_19e0934c1de', 'pack3', 0, 0)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO products (
  id, slug, name, reference, description, detailed_description, category,
  best_seller, stock_text,
  material, dimensions, weight, wheels, lock_info, handle_info, warranty, shipping,
  created_at, updated_at
) VALUES (
  'prod_55f849aef68e5_19e0934c1de',
  'carry-pro',
  'Carry Pro — Business cabine',
  'GK-CARRY-PRO',
  'Pensée pour le quotidien pro: intérieur optimisé, équilibre parfait et design sobre. Une cabine qui fait sérieux, partout.',
  NULL,
  'Valises',
  0,
  'Stock limité',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '24–48h',
  '2026-05-08 20:08:32',
  '2026-05-08 20:08:32'
) ON DUPLICATE KEY UPDATE
  slug=VALUES(slug),
  name=VALUES(name),
  reference=VALUES(reference),
  description=VALUES(description),
  detailed_description=VALUES(detailed_description),
  category=VALUES(category),
  best_seller=VALUES(best_seller),
  stock_text=VALUES(stock_text),
  material=VALUES(material),
  dimensions=VALUES(dimensions),
  weight=VALUES(weight),
  wheels=VALUES(wheels),
  lock_info=VALUES(lock_info),
  handle_info=VALUES(handle_info),
  warranty=VALUES(warranty),
  shipping=VALUES(shipping),
  created_at=VALUES(created_at),
  updated_at=VALUES(updated_at);


INSERT INTO product_variants (id, product_id, color_name, color_hex)
VALUES ('var_fc5d64ebbf2e2_19e0934c1de', 'prod_55f849aef68e5_19e0934c1de', 'Noir', '#0A0A0A')
ON DUPLICATE KEY UPDATE
  product_id=VALUES(product_id),
  color_name=VALUES(color_name),
  color_hex=VALUES(color_hex);


INSERT INTO variant_images (variant_id, sort_order, url)
VALUES ('var_fc5d64ebbf2e2_19e0934c1de', 0, '/products/suitcase-carry-1.svg')
ON DUPLICATE KEY UPDATE url=VALUES(url);


INSERT INTO variant_images (variant_id, sort_order, url)
VALUES ('var_fc5d64ebbf2e2_19e0934c1de', 1, '/products/suitcase-carry-2.svg')
ON DUPLICATE KEY UPDATE url=VALUES(url);


INSERT INTO variant_images (variant_id, sort_order, url)
VALUES ('var_fc5d64ebbf2e2_19e0934c1de', 2, '/products/suitcase-carry-3.svg')
ON DUPLICATE KEY UPDATE url=VALUES(url);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_fc5d64ebbf2e2_19e0934c1de', '20', 599, 1)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_fc5d64ebbf2e2_19e0934c1de', '24', 0, 0)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_fc5d64ebbf2e2_19e0934c1de', '28', 0, 0)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_fc5d64ebbf2e2_19e0934c1de', 'pack3', 0, 0)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO products (
  id, slug, name, reference, description, detailed_description, category,
  best_seller, stock_text,
  material, dimensions, weight, wheels, lock_info, handle_info, warranty, shipping,
  created_at, updated_at
) VALUES (
  'prod_825486d251758_19e0934c1de',
  'cloud-kids',
  'Cloud Kids — Valise cabine enfant',
  'GK-CLOUD-KID',
  'Une cabine enfant facile à manœuvrer: légère, stable et pensée pour les petits voyages. Style premium avec une touche fun, sans être trop chargée.',
  NULL,
  'Valises',
  0,
  'Stock limité',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '24–48h',
  '2026-05-08 20:08:32',
  '2026-05-08 20:08:32'
) ON DUPLICATE KEY UPDATE
  slug=VALUES(slug),
  name=VALUES(name),
  reference=VALUES(reference),
  description=VALUES(description),
  detailed_description=VALUES(detailed_description),
  category=VALUES(category),
  best_seller=VALUES(best_seller),
  stock_text=VALUES(stock_text),
  material=VALUES(material),
  dimensions=VALUES(dimensions),
  weight=VALUES(weight),
  wheels=VALUES(wheels),
  lock_info=VALUES(lock_info),
  handle_info=VALUES(handle_info),
  warranty=VALUES(warranty),
  shipping=VALUES(shipping),
  created_at=VALUES(created_at),
  updated_at=VALUES(updated_at);


INSERT INTO product_variants (id, product_id, color_name, color_hex)
VALUES ('var_be84002e42f358_19e0934c1de', 'prod_825486d251758_19e0934c1de', 'Bleu', '#2463EB')
ON DUPLICATE KEY UPDATE
  product_id=VALUES(product_id),
  color_name=VALUES(color_name),
  color_hex=VALUES(color_hex);


INSERT INTO variant_images (variant_id, sort_order, url)
VALUES ('var_be84002e42f358_19e0934c1de', 0, '/products/suitcase-cloud-1.svg')
ON DUPLICATE KEY UPDATE url=VALUES(url);


INSERT INTO variant_images (variant_id, sort_order, url)
VALUES ('var_be84002e42f358_19e0934c1de', 1, '/products/suitcase-cloud-2.svg')
ON DUPLICATE KEY UPDATE url=VALUES(url);


INSERT INTO variant_images (variant_id, sort_order, url)
VALUES ('var_be84002e42f358_19e0934c1de', 2, '/products/suitcase-cloud-3.svg')
ON DUPLICATE KEY UPDATE url=VALUES(url);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_be84002e42f358_19e0934c1de', '20', 0, 0)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_be84002e42f358_19e0934c1de', '24', 0, 0)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_be84002e42f358_19e0934c1de', '28', 0, 0)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


INSERT INTO variant_sizes (variant_id, size_key, price, in_stock)
VALUES ('var_be84002e42f358_19e0934c1de', 'pack3', 0, 0)
ON DUPLICATE KEY UPDATE
  price=VALUES(price),
  in_stock=VALUES(in_stock);


SET FOREIGN_KEY_CHECKS = 1;
