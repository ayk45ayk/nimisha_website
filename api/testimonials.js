import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    // 1. GET: Fetch all reviews
    if (req.method === 'GET') {
      // Ensure table exists (Automatic creation on first run for convenience)
      await sql`CREATE TABLE IF NOT EXISTS testimonials (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        text TEXT,
        rating INT,
        anonymous BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`;

      const { rows } = await sql`SELECT * FROM testimonials ORDER BY created_at DESC;`;
      return res.status(200).json({ reviews: rows });
    }

    // 2. POST: Add a new review
    if (req.method === 'POST') {
      const { name, text, rating, anonymous } = req.body;
      if (!text || !rating) return res.status(400).json({ error: 'Missing fields' });

      await sql`INSERT INTO testimonials (name, text, rating, anonymous) VALUES (${name}, ${text}, ${rating}, ${anonymous});`;
      return res.status(200).json({ success: true });
    }

    // 3. DELETE: Remove a review (Admin only)
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing ID' });

      await sql`DELETE FROM testimonials WHERE id = ${id};`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Database Error:', error);
    return res.status(500).json({ error: error.message });
  }
}