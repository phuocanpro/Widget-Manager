const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: 'postgres', // Connect to default database first
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function setupDatabase() {
  try {
    
    // Create database if it doesn't exist
    await pool.query(`CREATE DATABASE ${process.env.DB_NAME}`);
    
    // Close connection to default database
    await pool.end();
    
    // Connect to the new database
    const newPool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
    
    // Run migrations
    const migration1SQL = fs.readFileSync('./database/migrations/001_create_tables.sql', 'utf8');
    await newPool.query(migration1SQL);
    
    // Run additional migration for existing databases
    try {
      const migration2SQL = fs.readFileSync('./database/migrations/002_add_welcome_message_column.sql', 'utf8');
      await newPool.query(migration2SQL);
    } catch (migration2Error) {
      // Migration 2 might fail if columns already exist, that's okay
    }
    
    await newPool.end();
    
  } catch (error) {
    if (error.code === '42P04') {
    } else {
      process.exit(1);
    }
  }
}

setupDatabase();
