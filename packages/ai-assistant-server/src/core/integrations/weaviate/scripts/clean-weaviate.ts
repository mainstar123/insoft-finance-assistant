/**
 * Script to clean up the Weaviate vector database
 * This will delete all objects from the classes used in the application
 */
import { ConfigService } from '@nestjs/config';
import { WeaviateService } from '../weaviate.service';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// List of classes to clean up (add more as needed)
const WEAVIATE_CLASSES = [
  'ConversationHistory',
  'FinancialTransaction',
  'BudgetGoal',
  'FinancialInsight',
  'FinancialMemory', // Used by multi-agents memory module
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', '.env.development'],
    }),
  ],
  providers: [ConfigService, WeaviateService],
})
class AppModule {}

/**
 * Delete all objects from a Weaviate class using a direct approach
 */
async function deleteAllObjectsInClass(weaviateService: WeaviateService, className: string): Promise<number> {
  try {
    // Use a query that will match all objects in the class
    // By using a path that all objects have and an operator that will match everything
    const allObjectsFilter = {
      path: ['id'],
      operator: 'Like',
      valueText: '.*', // Regex to match any id
    };

    // Get all objects from the class with just their IDs
    const objects = await weaviateService.searchObjects(
      className,
      '', // empty query to get all objects
      {
        fields: ['_additional { id }'],
        where: allObjectsFilter,
      }
    );

    console.log(`Found ${objects.length} objects to delete in ${className}`);

    // Track deleted count
    let deletedCount = 0;

    // If there are objects to delete, create a batch deletion filter
    if (objects.length > 0) {
      // Use the same filter for deletion
      await weaviateService.deleteObjects(className, allObjectsFilter);
      deletedCount = objects.length;
    }

    return deletedCount;
  } catch (error) {
    console.error(`Error in deleteAllObjectsInClass: ${error}`);
    throw error;
  }
}

async function bootstrap() {
  console.log('🧹 Starting Weaviate cleanup...');

  try {
    // Create a minimal app context
    const app = await NestFactory.createApplicationContext(AppModule);
    const weaviateService = app.get(WeaviateService);

    // Ensure Weaviate is initialized
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Clean up each class
    for (const className of WEAVIATE_CLASSES) {
      try {
        console.log(`📊 Cleaning up class: ${className}`);

        // Check if class exists first
        const exists = await weaviateService.hasSchema(className);

        if (exists) {
          try {
            // OPTIMIZATION: Try to delete the entire schema class first (much more efficient)
            console.log(
              `🔄 Attempting to delete entire schema class ${className}...`,
            );
            await weaviateService.deleteSchemaClass(className);
            console.log(`✅ Successfully deleted schema class ${className}`);

            // Re-create the schema if necessary (uncomment the following if you need to preserve schema)
            // await recreateSchema(weaviateService, className);
          } catch (schemaDeleteError) {
            console.error(
              `⚠️ Could not delete schema class ${className}: ${schemaDeleteError}`,
            );
            console.log(`⏳ Falling back to object-by-object deletion...`);

            // Fall back to the previous method of deleting objects
            try {
              // Try to delete all objects from the class
              const deletedCount = await deleteAllObjectsInClass(
                weaviateService,
                className,
              );
              console.log(
                `✅ Successfully cleaned up ${deletedCount} objects in ${className}`,
              );
            } catch (innerError) {
              console.error(`❌ Failed to clean up ${className}:`, innerError);

              // Attempt alternative approach with a different filter
              try {
                console.log(
                  `⚠️ Attempting alternative cleanup method for ${className}`,
                );

                // Try deleting objects one by one without a filter
                // This gets all objects first
                const objects = await weaviateService.searchObjects(
                  className,
                  '',
                  {
                    fields: ['_additional { id }'],
                    limit: 1000, // Set a reasonable limit
                  },
                );

                console.log(
                  `Found ${objects.length} objects with alternative method`,
                );

                // Delete each object individually using the existing deleteObjects method
                let deletedCount = 0;
                for (const obj of objects) {
                  if (obj._additional && obj._additional.id) {
                    try {
                      // Use the deleteObjects method with a filter that matches just this ID
                      const idFilter = {
                        path: ['id'],
                        operator: 'Equal',
                        valueText: obj._additional.id,
                      };
                      await weaviateService.deleteObjects(className, idFilter);
                      deletedCount++;
                    } catch (err) {
                      console.error(`Error deleting object: ${err}`);
                    }
                  }
                }

                console.log(
                  `✅ Successfully cleaned up ${deletedCount} objects in ${className} with alternative method`,
                );
              } catch (fallbackError) {
                console.error(
                  `❌ All cleanup methods failed for ${className}:`,
                  fallbackError,
                );
              }
            }
          }
        } else {
          console.log(
            `⚠️ Class ${className} does not exist in Weaviate, skipping`,
          );
        }
      } catch (error) {
        console.error(`❌ Error cleaning up class ${className}:`, error);
      }
    }

    console.log('🎉 Weaviate cleanup completed successfully');
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to cleanup Weaviate:', error);
    process.exit(1);
  }
}

bootstrap();
