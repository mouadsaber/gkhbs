import type { Pool, PoolConnection } from "mysql2/promise";
import { getDbPool } from "@/lib/db";
import type { ResultSetHeader } from "mysql2/promise";

export type OrderInput = {
  fullName: string;
  phone: string;
  city: string;
  productName: string;
  reference: string;
  productImage?: string;
  color: string;
  size: string;
  unitPrice: number;
  subtotal: number;
  quantity: number;
};

export type CreatedOrder = {
  orderNumber: string;
  createdAt: string;
};

async function ensureSchema(conn: PoolConnection) {
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
      unit_price INT NOT NULL,
      subtotal INT NOT NULL,
      quantity INT NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_order_number (order_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

function formatOrderNumber(id: number) {
  return `CMD-${String(id).padStart(4, "0")}`;
}

export async function createOrderInDb(input: OrderInput): Promise<CreatedOrder> {
  const pool: Pool = getDbPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await ensureSchema(conn);

    const createdAt = new Date();
    // Insert with a temporary order_number; update after we get insertId.
    const [result] = await conn.query<ResultSetHeader>(
      `
        INSERT INTO orders (
          order_number, created_at, full_name, phone, city,
          product_name, reference, product_image, color, size, unit_price, subtotal, quantity
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?
        )
      `,
      [
        "PENDING",
        createdAt,
        input.fullName,
        input.phone,
        input.city,
        input.productName,
        input.reference,
        input.productImage || null,
        input.color,
        input.size,
        input.unitPrice,
        input.subtotal,
        input.quantity,
      ]
    );

    const insertId = Number(result.insertId || 0);
    if (!insertId) throw new Error("insert_failed");
    const orderNumber = formatOrderNumber(insertId);

    await conn.query(`UPDATE orders SET order_number = ? WHERE id = ?`, [
      orderNumber,
      insertId,
    ]);

    await conn.commit();
    return { orderNumber, createdAt: createdAt.toISOString() };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
