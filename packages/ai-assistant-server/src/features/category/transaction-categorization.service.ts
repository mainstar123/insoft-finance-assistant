import { Injectable, Logger } from '@nestjs/common';
import { CategoryService } from './category.service';
import { ICategory } from './interfaces/category.interface';

/**
 * Service for enhanced transaction categorization using NLP techniques
 */
@Injectable()
export class TransactionCategorizationService {
  private readonly logger = new Logger(TransactionCategorizationService.name);
  private categoryKeywords: Map<number, string[]> = new Map();
  private defaultCategories: Map<string, string[]> = new Map();
  private initialized = false;

  constructor(private readonly categoryService: CategoryService) {
    this.initializeDefaultCategories();
  }

  /**
   * Initialize default categories with keywords
   */
  private initializeDefaultCategories(): void {
    // Common categories with their associated keywords
    this.defaultCategories.set('Groceries', [
      'grocery',
      'supermarket',
      'food',
      'market',
      'walmart',
      'target',
      'kroger',
      'safeway',
      'aldi',
      'trader',
      'whole foods',
      'costco',
      'produce',
      'vegetables',
      'fruits',
    ]);

    this.defaultCategories.set('Dining', [
      'restaurant',
      'dining',
      'cafe',
      'coffee',
      'starbucks',
      'mcdonald',
      'burger',
      'pizza',
      'taco',
      'sushi',
      'food delivery',
      'doordash',
      'ubereats',
      'grubhub',
      'bar',
      'pub',
    ]);

    this.defaultCategories.set('Transportation', [
      'uber',
      'lyft',
      'taxi',
      'transport',
      'bus',
      'train',
      'subway',
      'metro',
      'gas',
      'fuel',
      'parking',
      'toll',
      'car service',
      'auto',
      'vehicle',
    ]);

    this.defaultCategories.set('Housing', [
      'rent',
      'mortgage',
      'lease',
      'apartment',
      'condo',
      'house payment',
      'housing',
      'property',
      'real estate',
      'hoa',
      'maintenance fee',
    ]);

    this.defaultCategories.set('Utilities', [
      'utility',
      'electric',
      'water',
      'gas',
      'power',
      'energy',
      'internet',
      'cable',
      'phone',
      'mobile',
      'cell',
      'bill',
      'service',
    ]);

    this.defaultCategories.set('Entertainment', [
      'movie',
      'theatre',
      'concert',
      'show',
      'ticket',
      'netflix',
      'spotify',
      'amazon prime',
      'disney',
      'hulu',
      'subscription',
      'game',
      'music',
    ]);

    this.defaultCategories.set('Shopping', [
      'amazon',
      'ebay',
      'etsy',
      'shop',
      'store',
      'retail',
      'mall',
      'clothing',
      'apparel',
      'electronics',
      'purchase',
      'buy',
    ]);

    this.defaultCategories.set('Health', [
      'doctor',
      'medical',
      'healthcare',
      'hospital',
      'clinic',
      'pharmacy',
      'prescription',
      'medicine',
      'dental',
      'vision',
      'fitness',
      'gym',
    ]);

    this.defaultCategories.set('Education', [
      'school',
      'college',
      'university',
      'tuition',
      'course',
      'class',
      'education',
      'book',
      'learning',
      'student',
      'loan',
    ]);

    this.defaultCategories.set('Income', [
      'salary',
      'income',
      'paycheck',
      'deposit',
      'wage',
      'payment received',
      'direct deposit',
      'transfer in',
      'refund',
      'reimbursement',
    ]);

    this.defaultCategories.set('Investments', [
      'investment',
      'stock',
      'bond',
      'mutual fund',
      'etf',
      'dividend',
      'brokerage',
      'retirement',
      '401k',
      'ira',
      'trading',
    ]);

    this.defaultCategories.set('Travel', [
      'hotel',
      'airbnb',
      'flight',
      'airline',
      'travel',
      'vacation',
      'trip',
      'booking',
      'airfare',
      'lodging',
      'resort',
      'cruise',
    ]);
  }

  /**
   * Initialize category keywords from database
   * @param userId User ID to fetch categories for
   */
  private async initializeCategoryKeywords(userId: number): Promise<void> {
    try {
      // Get all categories for the user (including global categories)
      const categories = await this.categoryService.findAll(userId);

      // Process each category
      for (const category of categories) {
        const keywords = this.extractKeywords(category);
        this.categoryKeywords.set(category.id, keywords);
      }

      this.initialized = true;
      this.logger.log(
        `Initialized ${this.categoryKeywords.size} categories with keywords`,
      );
    } catch (error) {
      this.logger.error(`Error initializing category keywords: ${error}`);
      // Fall back to default categories if there's an error
    }
  }

  /**
   * Extract keywords from a category
   * @param category The category to extract keywords from
   * @returns Array of keywords
   */
  private extractKeywords(category: ICategory): string[] {
    const keywords: string[] = [];

    // Add the category name as a keyword
    keywords.push(...this.tokenize(category.name));

    // Add the category description as keywords if available
    if (category.description) {
      keywords.push(...this.tokenize(category.description));
    }

    // Add default keywords for common categories if they match
    for (const [
      defaultCategory,
      defaultKeywords,
    ] of this.defaultCategories.entries()) {
      if (category.name.toLowerCase().includes(defaultCategory.toLowerCase())) {
        keywords.push(...defaultKeywords);
        break;
      }
    }

    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Tokenize text into keywords
   * @param text Text to tokenize
   * @returns Array of tokens
   */
  private tokenize(text: string): string[] {
    // Convert to lowercase
    const lowerText = text.toLowerCase();

    // Remove special characters and split by whitespace
    const tokens = lowerText
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2); // Filter out short tokens

    return tokens;
  }

  /**
   * Calculate TF-IDF score for a description against category keywords
   * @param description Transaction description
   * @param categoryId Category ID
   * @returns TF-IDF score
   */
  private calculateScore(description: string, keywords: string[]): number {
    const tokens = this.tokenize(description);
    let score = 0;

    // Calculate term frequency
    for (const token of tokens) {
      if (keywords.includes(token)) {
        score += 1;
      }
    }

    // Normalize by description length to avoid bias towards longer descriptions
    return score / Math.max(1, tokens.length);
  }

  /**
   * Categorize a transaction based on its description
   * @param description Transaction description
   * @param userId User ID
   * @returns Best matching category ID and name
   */
  async categorizeTransaction(
    description: string,
    userId: number,
  ): Promise<{ categoryId: number | null; categoryName: string }> {
    try {
      // Initialize category keywords if not already done
      if (!this.initialized) {
        await this.initializeCategoryKeywords(userId);
      }

      // If we still don't have categories, use default categorization
      if (this.categoryKeywords.size === 0) {
        const defaultCategory = this.categorizeWithDefaults(description);
        return { categoryId: null, categoryName: defaultCategory };
      }

      // Calculate scores for each category
      let bestScore = -1;
      let bestCategoryId: number | null = null;
      let bestCategoryName = 'Miscellaneous';

      for (const [categoryId, keywords] of this.categoryKeywords.entries()) {
        const score = this.calculateScore(description, keywords);

        if (score > bestScore) {
          bestScore = score;
          bestCategoryId = categoryId;
        }
      }

      // If we found a matching category, get its name
      if (bestCategoryId !== null && bestScore > 0.1) {
        // Threshold to avoid weak matches
        try {
          const category = await this.categoryService.findOne(bestCategoryId);
          bestCategoryName = category.name;
        } catch (error) {
          this.logger.warn(
            `Error fetching category name for ID ${bestCategoryId}: ${error}`,
          );
          // Fall back to default categorization
          bestCategoryName = this.categorizeWithDefaults(description);
        }
      } else {
        // Fall back to default categorization if no good match
        bestCategoryName = this.categorizeWithDefaults(description);
      }

      return { categoryId: bestCategoryId, categoryName: bestCategoryName };
    } catch (error) {
      this.logger.error(`Error categorizing transaction: ${error}`);
      // Fall back to default categorization
      return {
        categoryId: null,
        categoryName: this.categorizeWithDefaults(description),
      };
    }
  }

  /**
   * Categorize a transaction using default categories
   * @param description Transaction description
   * @returns Category name
   */
  private categorizeWithDefaults(description: string): string {
    const lowerDesc = description.toLowerCase();

    // Check each default category
    for (const [category, keywords] of this.defaultCategories.entries()) {
      for (const keyword of keywords) {
        if (lowerDesc.includes(keyword)) {
          return category;
        }
      }
    }

    // Default category if no match found
    return 'Miscellaneous';
  }

  /**
   * Get suggested categories for a transaction description
   * @param description Transaction description
   * @param userId User ID
   * @param limit Maximum number of suggestions
   * @returns Array of suggested categories with scores
   */
  async getSuggestedCategories(
    description: string,
    userId: number,
    limit: number = 3,
  ): Promise<
    Array<{ categoryId: number | null; categoryName: string; score: number }>
  > {
    try {
      // Initialize category keywords if not already done
      if (!this.initialized) {
        await this.initializeCategoryKeywords(userId);
      }

      const suggestions: Array<{
        categoryId: number | null;
        categoryName: string;
        score: number;
      }> = [];

      // Calculate scores for database categories
      if (this.categoryKeywords.size > 0) {
        for (const [categoryId, keywords] of this.categoryKeywords.entries()) {
          const score = this.calculateScore(description, keywords);

          if (score > 0.05) {
            // Minimum threshold for relevance
            try {
              const category = await this.categoryService.findOne(categoryId);
              suggestions.push({
                categoryId,
                categoryName: category.name,
                score,
              });
            } catch (error) {
              this.logger.warn(
                `Error fetching category name for ID ${categoryId}: ${error}`,
              );
            }
          }
        }
      }

      // Add suggestions from default categories
      for (const [category, keywords] of this.defaultCategories.entries()) {
        const tokens = this.tokenize(description);
        let score = 0;

        for (const token of tokens) {
          if (keywords.includes(token)) {
            score += 1;
          }
        }

        score = score / Math.max(1, tokens.length);

        if (score > 0.05) {
          // Minimum threshold for relevance
          // Check if this category is already in suggestions
          const existingIndex = suggestions.findIndex(
            (s) => s.categoryName.toLowerCase() === category.toLowerCase(),
          );

          if (
            existingIndex !== -1 &&
            suggestions[existingIndex] &&
            score > suggestions[existingIndex].score
          ) {
            suggestions[existingIndex].score = score;
          }
        }
      }

      // Sort by score (descending) and limit results
      return suggestions.sort((a, b) => b.score - a.score).slice(0, limit);
    } catch (error) {
      this.logger.error(`Error getting suggested categories: ${error}`);

      // Fall back to default categories
      const defaultCategory = this.categorizeWithDefaults(description);
      return [
        {
          categoryId: null,
          categoryName: defaultCategory,
          score: 1.0,
        },
      ];
    }
  }

  /**
   * Reset the initialized state to force reloading categories
   */
  resetInitialization(): void {
    this.initialized = false;
    this.categoryKeywords.clear();
    this.logger.log('Category initialization reset');
  }
}
