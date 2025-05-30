/**
 * Script to query data from Weaviate
 * Usage: ts-node -r tsconfig-paths/register src/core/integrations/weaviate/scripts/query-weaviate.ts <ClassName>
 */
import axios from 'axios';

const COLORS = {
  RESET: '\x1b[0m',
  BRIGHT: '\x1b[1m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  CYAN: '\x1b[36m',
  RED: '\x1b[31m',
  MAGENTA: '\x1b[35m',
};

async function queryClass(className: string, limit: number = 10) {
  try {
    console.log(
      `${COLORS.CYAN}Querying class: ${className} (limit: ${limit})${COLORS.RESET}`,
    );

    const weaviateUrl = process.env.WEAVIATE_URL || 'http://localhost:8080';
    const response = await axios.get(
      `${weaviateUrl}/v1/objects?class=${className}&limit=${limit}`,
    );

    const { objects } = response.data;
    console.log(
      `${COLORS.GREEN}Found ${objects.length} objects${COLORS.RESET}`,
    );

    if (objects.length === 0) {
      console.log(
        `${COLORS.YELLOW}No data found in this class.${COLORS.RESET}`,
      );
      return;
    }

    // Display each object
    objects.forEach((obj: any, index: number) => {
      console.log(`\n${COLORS.BRIGHT}Object ${index + 1}:${COLORS.RESET}`);
      console.log(`ID: ${obj.id}`);
      console.log('Properties:');
      Object.entries(obj.properties || {}).forEach(([key, value]) => {
        console.log(`  ${key}: ${JSON.stringify(value)}`);
      });
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `${COLORS.RED}Error querying Weaviate:${COLORS.RESET}`,
      errorMessage,
    );
  }
}

async function main() {
  // Get class name from command line arguments
  const className = process.argv[2];
  const limit = parseInt(process.argv[3] || '10', 10);

  if (!className) {
    console.error(`${COLORS.RED}Error: Class name required${COLORS.RESET}`);
    console.log(
      `Usage: ts-node -r tsconfig-paths/register src/core/integrations/weaviate/scripts/query-weaviate.ts <ClassName> [limit]`,
    );
    process.exit(1);
  }

  await queryClass(className, limit);
}

main().catch((error) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`${COLORS.RED}Unhandled error:${COLORS.RESET}`, errorMessage);
  process.exit(1);
});
