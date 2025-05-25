import { PGlite } from "@electric-sql/pglite";

let dbInstance = null;
let isInitialized = false;

export const getDb = async () => {
  if (!dbInstance) {
    dbInstance = new PGlite();
    await initializeDb(dbInstance);
    isInitialized = true;
  }
  
  while (!isInitialized) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return dbInstance;
};

const initializeDb = async (db) => {
  try {
    // Create patients table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        date_of_birth DATE NOT NULL,
        gender VARCHAR(10) NOT NULL,
        address TEXT,
        phone VARCHAR(20),
        email VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better query performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_patients_name ON patients (last_name, first_name)
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_patients_dob ON patients (date_of_birth)
    `);

    // Create audit log table
    await db.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        action VARCHAR(20) NOT NULL,
        table_name VARCHAR(50) NOT NULL,
        record_id INTEGER,
        changed_by VARCHAR(100),
        changes JSONB,
        action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // The following PL/pgSQL function and trigger are not supported in pglite (no procedural language support)
    // You should remove or comment out the trigger/function code if you are using pglite.

    console.log("Database initialization completed");
  } catch (err) {
    console.error("Database initialization error:", err);
    throw err;
  }
};