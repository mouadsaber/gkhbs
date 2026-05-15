import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { getDbPool } from "@/lib/db";
import type { Product, ProductVariant, SizeKey } from "@/lib/productTypes";

type ProductRow = RowDataPacket & {
  id: string;
  slug: string;
  name: string;
  reference: string;
  description: string;
  detailed_description: string | null;
  category: string;
  best_seller: number;
  available: number;
  stock_text: string;
  landing_json: string | null;
  material: string | null;
  dimensions: string | null;
  weight: string | null;
  wheels: string | null;
  lock_info: string | null;
  handle_info: string | null;
  warranty: string | null;
  shipping: string | null;
  created_at: Date;
  updated_at: Date;
};

type VariantRow = RowDataPacket & {
  id: string;
  product_id: string;
  color_name: string;
  color_hex: string;
  available: number | null;
};

type VariantImageRow = RowDataPacket & {
  variant_id: string;
  sort_order: number;
  url: string;
};

type VariantMediaQueryRow = RowDataPacket & {
  variant_id: string;
  sort_order: number;
  media_type: "image" | "video";
  url: string;
  poster_url: string | null;
};

type VariantMediaRow = {
  variant_id: string;
  sort_order: number;
  media_type: "image" | "video";
  url: string;
  poster_url: string | null;
};

type VariantSizeRow = RowDataPacket & {
  variant_id: string;
  size_key: SizeKey;
  price: number;
  in_stock: number;
};

type ProductSizeRow = RowDataPacket & {
  product_id: string;
  size_key: SizeKey;
  price: number;
  in_stock: number;
};

const SIZE_KEYS: SizeKey[] = ["20", "24", "28", "pack3"];

async function ensureColumn(
  conn: PoolConnection,
  table: string,
  column: string,
  definitionSql: string
) {
  const [rows] = await conn.query<RowDataPacket[]>(
    `
    SELECT COUNT(*) as cnt
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    `,
    [table, column]
  );
  const cnt = Number((rows?.[0] as unknown as { cnt?: unknown })?.cnt ?? 0);
  if (cnt > 0) return;
  await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definitionSql}`);
}

async function ensureSchema(conn: PoolConnection) {
  // Matches scripts/seed.sql schema.
  // Run as separate statements to avoid requiring `multipleStatements: true`.
  await conn.query(`
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
      quantity INT NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_order_number (order_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      slug VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      reference VARCHAR(128) NOT NULL,
      description TEXT NOT NULL,
      detailed_description TEXT NULL,
      category VARCHAR(64) NOT NULL,
      best_seller TINYINT(1) NOT NULL DEFAULT 0,
      available TINYINT(1) NOT NULL DEFAULT 1,
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
  `);

  // Migrations: add new columns safely on existing installs.
  await ensureColumn(conn, "products", "landing_json", "TEXT NULL");
  await ensureColumn(conn, "products", "detailed_description", "TEXT NULL");
  await ensureColumn(conn, "products", "best_seller", "TINYINT(1) NOT NULL DEFAULT 0");
  await ensureColumn(conn, "products", "available", "TINYINT(1) NOT NULL DEFAULT 1");
  await ensureColumn(conn, "products", "stock_text", "VARCHAR(255) NOT NULL DEFAULT 'Stock limité'");
  await ensureColumn(conn, "products", "material", "VARCHAR(255) NULL");
  await ensureColumn(conn, "products", "dimensions", "VARCHAR(255) NULL");
  await ensureColumn(conn, "products", "weight", "VARCHAR(255) NULL");
  await ensureColumn(conn, "products", "wheels", "VARCHAR(255) NULL");
  await ensureColumn(conn, "products", "lock_info", "VARCHAR(255) NULL");
  await ensureColumn(conn, "products", "handle_info", "VARCHAR(255) NULL");
  await ensureColumn(conn, "products", "warranty", "VARCHAR(255) NULL");
  await ensureColumn(conn, "products", "shipping", "VARCHAR(255) NULL");

  await conn.query(`
    CREATE TABLE IF NOT EXISTS product_variants (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      product_id VARCHAR(64) NOT NULL,
      color_name VARCHAR(128) NOT NULL,
      color_hex VARCHAR(16) NOT NULL,
      available TINYINT(1) NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await ensureColumn(conn, "product_variants", "available", "TINYINT(1) NULL");

  await conn.query(`
    CREATE TABLE IF NOT EXISTS variant_images (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      variant_id VARCHAR(64) NOT NULL,
      sort_order INT NOT NULL,
      url TEXT NOT NULL,
      FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
      UNIQUE KEY uniq_variant_sort (variant_id, sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
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
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS variant_sizes (
      variant_id VARCHAR(64) NOT NULL,
      size_key VARCHAR(16) NOT NULL,
      price INT NOT NULL DEFAULT 0,
      in_stock TINYINT(1) NOT NULL DEFAULT 0,
      PRIMARY KEY (variant_id, size_key),
      FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS product_sizes (
      product_id VARCHAR(64) NOT NULL,
      size_key VARCHAR(16) NOT NULL,
      price INT NOT NULL DEFAULT 0,
      in_stock TINYINT(1) NOT NULL DEFAULT 0,
      PRIMARY KEY (product_id, size_key),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

function toIso(dt: Date) {
  return dt.toISOString();
}

function mapProduct(
  p: ProductRow,
  variants: Array<ProductVariant>
): Product {
  let landing: Product["landing"] | undefined = undefined;
  if (p.landing_json) {
    try {
      landing = JSON.parse(p.landing_json) as Product["landing"];
    } catch {
      landing = undefined;
    }
  }
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    reference: p.reference,
    description: p.description,
    detailedDescription: p.detailed_description || "",
    category: (p.category as Product["category"]) || "Valises",
    bestSeller: Boolean(p.best_seller),
    available: p.available == null ? true : Boolean(p.available),
    stockText: p.stock_text,
    landing,
    sizes: emptySizes(),
    details: {
      material: p.material || "",
      dimensions: p.dimensions || "",
      weight: p.weight || "",
      wheels: p.wheels || "",
      lock: p.lock_info || "",
      handle: p.handle_info || "",
      warranty: p.warranty || "",
      shipping: p.shipping || "",
    },
    variants,
    createdAt: toIso(p.created_at),
    updatedAt: toIso(p.updated_at),
  };
}

function emptySizes(): Product["sizes"] {
  return {
    "20": { price: 0, inStock: false },
    "24": { price: 0, inStock: false },
    "28": { price: 0, inStock: false },
    pack3: { price: 0, inStock: false },
  };
}

export async function getAllProductsDb(): Promise<Product[]> {
  const pool = getDbPool();
  const conn = await pool.getConnection();
  try {
    await ensureSchema(conn);
    const [products] = await conn.query<ProductRow[]>(`SELECT * FROM products ORDER BY updated_at DESC`);
    if (!products.length) return [];

    const productIds = products.map((p) => p.id);
    const sizesByProduct = new Map<string, ProductSizeRow[]>();
    const [productSizes] = await conn.query<ProductSizeRow[]>(
      `SELECT product_id, size_key, price, in_stock FROM product_sizes WHERE product_id IN (${productIds
        .map(() => "?")
        .join(",")})`,
      productIds
    );
    for (const row of productSizes) {
      const list = sizesByProduct.get(row.product_id) || [];
      list.push(row);
      sizesByProduct.set(row.product_id, list);
    }

    const [variants] = await conn.query<VariantRow[]>(
      `SELECT * FROM product_variants WHERE product_id IN (${productIds.map(() => "?").join(",")})`,
      productIds
    );
    const variantIds = variants.map((v) => v.id);

    const mediaByVariant = new Map<string, VariantMediaRow[]>();
    const sizesByVariant = new Map<string, VariantSizeRow[]>();
    if (variantIds.length) {
      // Prefer variant_media (supports images + videos). If empty, fallback to legacy variant_images.
      const [media] = await conn.query<VariantMediaQueryRow[]>(
        `SELECT variant_id, sort_order, media_type, url, poster_url FROM variant_media WHERE variant_id IN (${variantIds
          .map(() => "?")
          .join(",")}) ORDER BY sort_order ASC`,
        variantIds
      );
      if (media.length) {
        for (const row of media) {
          const list = mediaByVariant.get(row.variant_id) || [];
          list.push(row);
          mediaByVariant.set(row.variant_id, list);
        }
      } else {
        const [images] = await conn.query<VariantImageRow[]>(
          `SELECT variant_id, sort_order, url FROM variant_images WHERE variant_id IN (${variantIds
            .map(() => "?")
            .join(",")}) ORDER BY sort_order ASC`,
          variantIds
        );
        for (const row of images) {
          const list = mediaByVariant.get(row.variant_id) || [];
          list.push({
            variant_id: row.variant_id,
            sort_order: row.sort_order,
            media_type: "image",
            url: row.url,
            poster_url: null,
          });
          mediaByVariant.set(row.variant_id, list);
        }
      }

      const [sizes] = await conn.query<VariantSizeRow[]>(
        `SELECT variant_id, size_key, price, in_stock FROM variant_sizes WHERE variant_id IN (${variantIds.map(() => "?").join(",")})`,
        variantIds
      );
      for (const row of sizes) {
        const list = sizesByVariant.get(row.variant_id) || [];
        list.push(row);
        sizesByVariant.set(row.variant_id, list);
      }
    }

    const variantsByProduct = new Map<string, ProductVariant[]>();
    for (const v of variants) {
      const mediaRows = mediaByVariant.get(v.id) || [];
      const normalizePublicUrl = (input: unknown) => {
        const raw = String(input || "").trim();
        if (!raw) return "";
        if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("/")) return raw;
        const cleaned = raw.replace(/^[.\\/]+/, "");
        return `/${cleaned}`;
      };
      const mediaItems = mediaRows.map((m) => ({
        type: m.media_type,
        url: normalizePublicUrl(m.url) || "/products/valise-cabine.svg",
        posterUrl: m.poster_url ? normalizePublicUrl(m.poster_url) : undefined,
      }));
      const images = mediaItems.filter((m) => m.type === "image").map((m) => m.url);
      const variant: ProductVariant = {
        id: v.id,
        colorName: v.color_name,
        colorHex: v.color_hex,
        media: mediaItems.length
          ? mediaItems
          : [{ type: "image", url: "/products/valise-cabine.svg" }],
        images: images.length ? images : ["/products/valise-cabine.svg"],
        available: v.available == null ? undefined : Boolean(v.available),
      };
      const list = variantsByProduct.get(v.product_id) || [];
      list.push(variant);
      variantsByProduct.set(v.product_id, list);
    }

    return products.map((p) => {
      const prod = mapProduct(p, variantsByProduct.get(p.id) || []);
      const list = sizesByProduct.get(p.id) || [];
      if (list.length) {
        const sizes = emptySizes();
        for (const s of list) {
          sizes[s.size_key] = { price: Number(s.price || 0), inStock: Boolean(s.in_stock) };
        }
        prod.sizes = sizes;
      } else {
        // Legacy fallback: derive sizes from first variant_sizes row-set.
        const firstVariant = (variantsByProduct.get(p.id) || [])[0];
        if (firstVariant) {
          // no-op: prices will be 0 until admin sets global sizes
        }
      }
      return prod;
    });
  } finally {
    conn.release();
  }
}

export async function getProductBySlugDb(slug: string): Promise<Product | null> {
  const pool = getDbPool();
  const conn = await pool.getConnection();
  try {
    await ensureSchema(conn);
    const [products] = await conn.query<ProductRow[]>(`SELECT * FROM products WHERE slug = ? LIMIT 1`, [slug]);
    const p = products[0];
    if (!p) return null;

    const [sizesRows] = await conn.query<ProductSizeRow[]>(
      `SELECT product_id, size_key, price, in_stock FROM product_sizes WHERE product_id = ?`,
      [p.id]
    );
    const productSizes = emptySizes();
    for (const s of sizesRows) {
      productSizes[s.size_key] = { price: Number(s.price || 0), inStock: Boolean(s.in_stock) };
    }

    const [variants] = await conn.query<VariantRow[]>(
      `SELECT * FROM product_variants WHERE product_id = ?`,
      [p.id]
    );
    const variantIds = variants.map((v) => v.id);

    const mediaByVariant = new Map<string, VariantMediaRow[]>();
    const sizesByVariant = new Map<string, VariantSizeRow[]>();
    if (variantIds.length) {
      const [media] = await conn.query<VariantMediaQueryRow[]>(
        `SELECT variant_id, sort_order, media_type, url, poster_url FROM variant_media WHERE variant_id IN (${variantIds
          .map(() => "?")
          .join(",")}) ORDER BY sort_order ASC`,
        variantIds
      );
      if (media.length) {
        for (const row of media) {
          const list = mediaByVariant.get(row.variant_id) || [];
          list.push(row);
          mediaByVariant.set(row.variant_id, list);
        }
      } else {
        const [images] = await conn.query<VariantImageRow[]>(
          `SELECT variant_id, sort_order, url FROM variant_images WHERE variant_id IN (${variantIds
            .map(() => "?")
            .join(",")}) ORDER BY sort_order ASC`,
          variantIds
        );
        for (const row of images) {
          const list = mediaByVariant.get(row.variant_id) || [];
          list.push({
            variant_id: row.variant_id,
            sort_order: row.sort_order,
            media_type: "image",
            url: row.url,
            poster_url: null,
          });
          mediaByVariant.set(row.variant_id, list);
        }
      }

      const [sizes] = await conn.query<VariantSizeRow[]>(
        `SELECT variant_id, size_key, price, in_stock FROM variant_sizes WHERE variant_id IN (${variantIds.map(() => "?").join(",")})`,
        variantIds
      );
      for (const row of sizes) {
        const list = sizesByVariant.get(row.variant_id) || [];
        list.push(row);
        sizesByVariant.set(row.variant_id, list);
      }
    }

    const mappedVariants: ProductVariant[] = variants.map((v) => {
      const mediaRows = mediaByVariant.get(v.id) || [];
      const mediaItems = mediaRows.map((m) => ({
        type: m.media_type,
        url: m.url,
        posterUrl: m.poster_url || undefined,
      }));
      const images = mediaItems.filter((m) => m.type === "image").map((m) => m.url);
      return {
        id: v.id,
        colorName: v.color_name,
        colorHex: v.color_hex,
        media: mediaItems.length
          ? mediaItems
          : [{ type: "image", url: "/products/valise-cabine.svg" }],
        images: images.length ? images : ["/products/valise-cabine.svg"],
        available: v.available == null ? undefined : Boolean(v.available),
      };
    });

    const prod = mapProduct(p, mappedVariants);
    // If no product_sizes yet, fallback to legacy variant_sizes using the first variant.
    const hasAny = Object.values(productSizes).some((s) => s.price > 0 || s.inStock);
    if (hasAny) {
      prod.sizes = productSizes;
      return prod;
    }
    const firstVariantId = variants[0]?.id;
    if (firstVariantId) {
      const legacy = sizesByVariant.get(firstVariantId) || [];
      if (legacy.length) {
        const sizes = emptySizes();
        for (const s of legacy) {
          sizes[s.size_key] = { price: Number(s.price || 0), inStock: Boolean(s.in_stock) };
        }
        prod.sizes = sizes;
        // Best-effort migrate to product_sizes so next read is correct.
        try {
          await conn.query(`DELETE FROM product_sizes WHERE product_id = ?`, [p.id]);
          for (const key of SIZE_KEYS) {
            const s = sizes[key];
            await conn.query(
              `INSERT INTO product_sizes (product_id, size_key, price, in_stock) VALUES (?, ?, ?, ?)`,
              [p.id, key, Number(s.price || 0), s.inStock ? 1 : 0]
            );
          }
        } catch {
          // ignore
        }
      }
    }
    return prod;
  } finally {
    conn.release();
  }
}

export async function getProductByIdDb(id: string): Promise<Product | null> {
  const pool = getDbPool();
  const conn = await pool.getConnection();
  try {
    await ensureSchema(conn);
    const [products] = await conn.query<ProductRow[]>(
      `SELECT * FROM products WHERE id = ? LIMIT 1`,
      [id]
    );
    const p = products[0];
    if (!p) return null;

    const [sizesRows] = await conn.query<ProductSizeRow[]>(
      `SELECT product_id, size_key, price, in_stock FROM product_sizes WHERE product_id = ?`,
      [p.id]
    );
    const productSizes = emptySizes();
    for (const s of sizesRows) {
      productSizes[s.size_key] = { price: Number(s.price || 0), inStock: Boolean(s.in_stock) };
    }

    const [variants] = await conn.query<VariantRow[]>(
      `SELECT * FROM product_variants WHERE product_id = ?`,
      [p.id]
    );
    const variantIds = variants.map((v) => v.id);

    const mediaByVariant = new Map<string, VariantMediaRow[]>();
    const sizesByVariant = new Map<string, VariantSizeRow[]>();
    if (variantIds.length) {
      const [media] = await conn.query<VariantMediaQueryRow[]>(
        `SELECT variant_id, sort_order, media_type, url, poster_url FROM variant_media WHERE variant_id IN (${variantIds
          .map(() => "?")
          .join(",")}) ORDER BY sort_order ASC`,
        variantIds
      );
      if (media.length) {
        for (const row of media) {
          const list = mediaByVariant.get(row.variant_id) || [];
          list.push(row);
          mediaByVariant.set(row.variant_id, list);
        }
      } else {
        const [images] = await conn.query<VariantImageRow[]>(
          `SELECT variant_id, sort_order, url FROM variant_images WHERE variant_id IN (${variantIds
            .map(() => "?")
            .join(",")}) ORDER BY sort_order ASC`,
          variantIds
        );
        for (const row of images) {
          const list = mediaByVariant.get(row.variant_id) || [];
          list.push({
            variant_id: row.variant_id,
            sort_order: row.sort_order,
            media_type: "image",
            url: row.url,
            poster_url: null,
          });
          mediaByVariant.set(row.variant_id, list);
        }
      }

      const [sizes] = await conn.query<VariantSizeRow[]>(
        `SELECT variant_id, size_key, price, in_stock FROM variant_sizes WHERE variant_id IN (${variantIds
          .map(() => "?")
          .join(",")})`,
        variantIds
      );
      for (const row of sizes) {
        const list = sizesByVariant.get(row.variant_id) || [];
        list.push(row);
        sizesByVariant.set(row.variant_id, list);
      }
    }

    const mappedVariants: ProductVariant[] = variants.map((v) => {
      const mediaRows = mediaByVariant.get(v.id) || [];
      const mediaItems = mediaRows.map((m) => ({
        type: m.media_type,
        url: m.url,
        posterUrl: m.poster_url || undefined,
      }));
      const images = mediaItems.filter((m) => m.type === "image").map((m) => m.url);
      return {
        id: v.id,
        colorName: v.color_name,
        colorHex: v.color_hex,
        media: mediaItems.length
          ? mediaItems
          : [{ type: "image", url: "/products/valise-cabine.svg" }],
        images: images.length ? images : ["/products/valise-cabine.svg"],
        available: v.available == null ? undefined : Boolean(v.available),
      };
    });

    const prod = mapProduct(p, mappedVariants);
    const hasAny = Object.values(productSizes).some((s) => s.price > 0 || s.inStock);
    if (hasAny) prod.sizes = productSizes;
    return prod;
  } finally {
    conn.release();
  }
}

export async function upsertProductDb(product: Product): Promise<void> {
  const pool = getDbPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await ensureSchema(conn);

    const createdAt = new Date(product.createdAt || new Date().toISOString());
    const updatedAt = new Date(product.updatedAt || new Date().toISOString());

    await conn.query(
      `
      INSERT INTO products (
        id, slug, name, reference, description, detailed_description, category,
        best_seller, available, stock_text,
        landing_json,
        material, dimensions, weight, wheels, lock_info, handle_info, warranty, shipping,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?
      )
      ON DUPLICATE KEY UPDATE
        slug=VALUES(slug),
        name=VALUES(name),
        reference=VALUES(reference),
        description=VALUES(description),
        detailed_description=VALUES(detailed_description),
        category=VALUES(category),
        best_seller=VALUES(best_seller),
        available=VALUES(available),
        stock_text=VALUES(stock_text),
        landing_json=VALUES(landing_json),
        material=VALUES(material),
        dimensions=VALUES(dimensions),
        weight=VALUES(weight),
        wheels=VALUES(wheels),
        lock_info=VALUES(lock_info),
        handle_info=VALUES(handle_info),
        warranty=VALUES(warranty),
        shipping=VALUES(shipping),
        created_at=VALUES(created_at),
        updated_at=VALUES(updated_at)
    `,
      [
        product.id,
        product.slug,
        product.name,
        product.reference,
        product.description,
        product.detailedDescription || null,
        product.category,
        product.bestSeller ? 1 : 0,
        product.available ? 1 : 0,
        product.stockText,
        product.landing ? JSON.stringify(product.landing) : null,
        product.details?.material || null,
        product.details?.dimensions || null,
        product.details?.weight || null,
        product.details?.wheels || null,
        product.details?.lock || null,
        product.details?.handle || null,
        product.details?.warranty || null,
        product.details?.shipping || null,
        createdAt,
        updatedAt,
      ]
    );

    // Global sizes/prices for product.
    await conn.query(`DELETE FROM product_sizes WHERE product_id = ?`, [product.id]);
    for (const key of SIZE_KEYS) {
      const s = product.sizes?.[key];
      if (!s) continue;
      await conn.query(
        `INSERT INTO product_sizes (product_id, size_key, price, in_stock) VALUES (?, ?, ?, ?)`,
        [product.id, key, Number(s.price || 0), s.inStock ? 1 : 0]
      );
    }

    // Replace variants for this product to keep it simple and consistent.
    await conn.query(`DELETE FROM product_variants WHERE product_id = ?`, [product.id]);

    for (const v of product.variants) {
      await conn.query(
        `INSERT INTO product_variants (id, product_id, color_name, color_hex, available) VALUES (?, ?, ?, ?, ?)`,
        [v.id, product.id, v.colorName, v.colorHex, v.available == null ? null : v.available ? 1 : 0]
      );

      // Replace media for this variant.
      await conn.query(`DELETE FROM variant_media WHERE variant_id = ?`, [v.id]);
      await conn.query(`DELETE FROM variant_images WHERE variant_id = ?`, [v.id]); // legacy table

      const media =
        Array.isArray((v as unknown as { media?: unknown }).media) && (v as unknown as { media?: unknown[] }).media
          ? (v as unknown as { media: Array<{ type?: string; url?: string; posterUrl?: string }> }).media
          : (v.images || []).map((url) => ({ type: "image", url }));

      for (let i = 0; i < media.length; i++) {
        const item = media[i]!;
        const type = item.type === "video" ? "video" : "image";
        const url = String(item.url || "");
        if (!url) continue;
        const posterUrl = (item as { posterUrl?: string }).posterUrl;
        await conn.query(
          `INSERT INTO variant_media (variant_id, sort_order, media_type, url, poster_url) VALUES (?, ?, ?, ?, ?)`,
          [v.id, i, type, url, posterUrl || null]
        );
        if (type === "image") {
          await conn.query(
            `INSERT INTO variant_images (variant_id, sort_order, url) VALUES (?, ?, ?)`,
            [v.id, i, url]
          );
        }
      }

      // Sizes are global per product now; do not write variant_sizes anymore.
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function deleteProductDb(productId: string): Promise<void> {
  const pool = getDbPool();
  const conn = await pool.getConnection();
  try {
    await ensureSchema(conn);
    await conn.query(`DELETE FROM products WHERE id = ?`, [productId]);
  } finally {
    conn.release();
  }
}
