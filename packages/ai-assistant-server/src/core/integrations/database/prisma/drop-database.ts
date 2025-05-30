import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as readline from 'readline';

const prisma = new PrismaClient();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function dropDatabase() {
  console.log(
    '\n⚠️  WARNING: This will drop the entire database and all its data! ⚠️\n',
  );

  // Ask for confirmation
  rl.question(
    'Are you sure you want to proceed? (yes/no): ',
    async (answer) => {
      if (answer.toLowerCase() !== 'yes') {
        console.log('Operation cancelled.');
        rl.close();
        return;
      }

      try {
        // Disconnect Prisma client to release any connections
        await prisma.$disconnect();

        console.log('Dropping database...');

        // Use Prisma CLI to drop the database
        execSync('npx prisma migrate reset --force', { stdio: 'inherit' });

        console.log('\n✅ Database has been successfully dropped and reset!');
        console.log('\nTo recreate the database with minimal seed data, run:');
        console.log('npm run seed:minimal');
      } catch (error) {
        console.error('Error dropping database:', error);
      } finally {
        rl.close();
      }
    },
  );
}

// Run the function
dropDatabase();
