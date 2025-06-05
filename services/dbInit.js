const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const path = require('path');

async function initializeDatabase() {
    const prisma = new PrismaClient();
    
    try {
        console.log('Starting database initialization...');
        
        // Reset database if RESET_DB is true
        if (process.env.RESET_DB === 'true') {
            console.log('Resetting database...');
            execSync('npx prisma migrate reset --force', {
                stdio: 'inherit',
                cwd: path.join(__dirname, '..')
            });
        } else {
            // Run Prisma migrations
            console.log('Running Prisma migrations...');
            try {
                execSync('npx prisma migrate deploy', {
                    stdio: 'inherit',
                    cwd: path.join(__dirname, '..')
                });
            } catch (migrationError) {
                console.error('Migration failed, attempting to reset database...');
                execSync('npx prisma migrate reset --force', {
                    stdio: 'inherit',
                    cwd: path.join(__dirname, '..')
                });
            }
        }
        
        // Verify database connection
        await prisma.$connect();
        console.log('Database connection successful');
        
        // Optional: Run seed if needed
        if (process.env.RUN_SEED === 'true') {
            console.log('Running database seed...');
            execSync('npx prisma db seed', {
                stdio: 'inherit',
                cwd: path.join(__dirname, '..')
            });
        }
        
        console.log('Database initialization completed successfully');
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

module.exports = { initializeDatabase }; 