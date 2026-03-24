import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS testimonials (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        text TEXT,
        rating INT,
        anonymous BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    return res.status(200).json({ message: 'Table created successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}