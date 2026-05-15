import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { getDbPool } from "@/lib/db";

type Cover = {
  desktopUrl: string;
  mobileUrl: string;
  linkUrl: string;
  linkedProductSlug: string;
  alt: string;
};

type CoverRow = RowDataPacket & {
  desktop_url: string | null;
  mobile_url: string | null;
  link_url: string | null;
  linked_product_slug: string | null;
  alt_text: string | null;
};

async function ensureSchema(conn: PoolConnection) {
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
    CREATE TABLE IF NOT EXISTS settings_homepage_cover (
      id TINYINT NOT NULL PRIMARY KEY,
      desktop_url TEXT NULL,
      mobile_url TEXT NULL,
      link_url TEXT NULL,
      linked_product_slug VARCHAR(255) NULL,
      alt_text VARCHAR(255) NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

export async function getHomepageCoverDb(): Promise<Cover> {
  const pool = getDbPool();
  const conn = await pool.getConnection();
  try {
    await ensureSchema(conn);
    const [rows] = await conn.query<CoverRow[]>(
      `SELECT desktop_url, mobile_url, link_url, linked_product_slug, alt_text FROM settings_homepage_cover WHERE id = 1 LIMIT 1`
    );
    const r = rows[0];
    return {
      desktopUrl: r?.desktop_url || "/cover/default-desktop.svg",
      mobileUrl: r?.mobile_url || "/cover/default-mobile.svg",
      linkUrl: r?.link_url || "",
      linkedProductSlug: r?.linked_product_slug || "",
      alt: r?.alt_text || "Couverture boutique valises",
    };
  } finally {
    conn.release();
  }
}

export async function upsertHomepageCoverDb(cover: Partial<Cover>) {
  const pool = getDbPool();
  const conn = await pool.getConnection();
  try {
    await ensureSchema(conn);
    await conn.query(
      `
      INSERT INTO settings_homepage_cover
        (id, desktop_url, mobile_url, link_url, linked_product_slug, alt_text)
      VALUES (1, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        desktop_url=VALUES(desktop_url),
        mobile_url=VALUES(mobile_url),
        link_url=VALUES(link_url),
        linked_product_slug=VALUES(linked_product_slug),
        alt_text=VALUES(alt_text)
      `,
      [
        cover.desktopUrl ?? null,
        cover.mobileUrl ?? null,
        cover.linkUrl ?? null,
        cover.linkedProductSlug ?? null,
        cover.alt ?? null,
      ]
    );
  } finally {
    conn.release();
  }
}
