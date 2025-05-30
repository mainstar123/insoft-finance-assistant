import { execSync } from 'child_process';
import * as readline from 'readline';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function resetDatabase() {
  console.log(
    '\n⚠️  WARNING: This will reset the entire database and all its data! ⚠️',
  );
  console.log(
    'The database will be dropped and recreated with minimal seed data.\n',
  );

  // Ask for confirmation
  rl.question('Are you sure you want to proceed? (yes/no): ', (answer) => {
    if (answer.toLowerCase() !== 'yes') {
      console.log('Operation cancelled.');
      rl.close();
      return;
    }

    try {
      console.log('Resetting database...');

      // Use Prisma CLI to reset the database
      execSync('npx prisma migrate reset --force', { stdio: 'inherit' });

      console.log('\n✅ Database has been reset!');
      console.log('Now seeding with minimal data...');

      // Run the minimal seed script
      execSync('npm run seed:minimal', { stdio: 'inherit' });

      console.log(
        '\n✅ Database has been successfully reset and seeded with minimal data!',
      );
    } catch (error) {
      console.error('Error resetting database:', error);
    } finally {
      rl.close();
    }
  });
}

// Run the function
resetDatabase();
