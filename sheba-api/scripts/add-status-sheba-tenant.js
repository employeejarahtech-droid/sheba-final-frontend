require('dotenv').config();
const mysql = require('mysql2/promise');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.PLATFORM_DB_HOST || 'localhost',
    user: process.env.PLATFORM_DB_USER || 'root',
    password: process.env.PLATFORM_DB_PASSWORD || '',
    database: 'hospital_sheba_db'
  });

  try {
    await connection.connect();
    console.log('Connected to: hospital_sheba_db');

    // Check if column already exists
    const [results] = await connection.query(
      "SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'hospital_sheba_db' AND TABLE_NAME = 'lipid_profile' AND COLUMN_NAME = 'status'"
    );

    if (results.length > 0) {
      console.log('Status column already exists in lipid_profile table');
      return;
    }

    // Add the status column
    await connection.query(`
      ALTER TABLE lipid_profile
      ADD COLUMN status ENUM('complete', 'incomplete') DEFAULT 'incomplete' NULL
    `);

    console.log('Successfully added status column to lipid_profile table in hospital_sheba_db');

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
