const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

const initializeDatabase = async () => {
  try {
    // Create tables if they don't exist (new databases get the correct rules here)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(60) NOT NULL CHECK (LENGTH(name) >= 20 AND LENGTH(name) <= 60),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        address VARCHAR(400) NOT NULL CHECK (LENGTH(address) <= 400),
        role VARCHAR(20) NOT NULL DEFAULT 'NORMAL_USER' CHECK (role IN ('SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        name VARCHAR(60) NOT NULL CHECK (LENGTH(name) >= 20 AND LENGTH(name) <= 60),
        email VARCHAR(255) UNIQUE NOT NULL,
        address VARCHAR(400) NOT NULL CHECK (LENGTH(address) <= 400),
        owner_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
        average_rating DECIMAL(2,1) DEFAULT 0.0,
        total_ratings INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, store_id)
      )
    `);

    // Migrations for databases created before these rules existed.
    // Each step is safe to run again.
    await pool.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_name_check;
      UPDATE users
      SET name = LEFT(name, 43) || ' (legacy account)'
      WHERE LENGTH(name) < 20;
      ALTER TABLE users ADD CONSTRAINT users_name_check
        CHECK (LENGTH(name) >= 20 AND LENGTH(name) <= 60);

      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      UPDATE users SET role = UPPER(role) WHERE role <> UPPER(role);
      ALTER TABLE users ALTER COLUMN role SET DEFAULT 'NORMAL_USER';
      ALTER TABLE users ADD CONSTRAINT users_role_check
        CHECK (role IN ('SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER'));

      ALTER TABLE ratings ADD COLUMN IF NOT EXISTS comment TEXT;
    `);

    // Older databases used ON DELETE CASCADE for store owners. Preserve stores
    // when an owner is removed, matching the current schema's nullable owner_id.
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conrelid = 'stores'::regclass
            AND conname = 'stores_owner_id_fkey'
            AND confdeltype = 'n'
        ) THEN
          ALTER TABLE stores DROP CONSTRAINT IF EXISTS stores_owner_id_fkey;
          ALTER TABLE stores ADD CONSTRAINT stores_owner_id_fkey
            FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
      END;
      $$;
    `);

    // Indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_stores_name ON stores(name)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores(owner_id)');
    await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_owner_unique ON stores(owner_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_ratings_store ON ratings(store_id)');

    // Keep stores.average_rating and total_ratings in sync with the ratings table
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_store_rating()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE stores
        SET
          average_rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM ratings
            WHERE store_id = COALESCE(NEW.store_id, OLD.store_id)
          ),
          total_ratings = (
            SELECT COUNT(*)
            FROM ratings
            WHERE store_id = COALESCE(NEW.store_id, OLD.store_id)
          )
        WHERE id = COALESCE(NEW.store_id, OLD.store_id);
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS rating_update_trigger ON ratings;
      CREATE TRIGGER rating_update_trigger
        AFTER INSERT OR UPDATE OR DELETE ON ratings
        FOR EACH ROW
        EXECUTE FUNCTION update_store_rating();
    `);
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

module.exports = {
  pool,
  initializeDatabase
};
