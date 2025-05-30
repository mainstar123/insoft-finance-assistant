import { Injectable, Logger } from '@nestjs/common';
import { OrchestratorState } from '../types';

interface ToneConfig {
  emojis: {
    positive: string[];
    emphasis: string[];
    brand: string[];
    finance: string[];
  };
  languages: {
    [key: string]: {
      casualPhrases: {
        greetings: string[];
        transitions: string[];
        encouragement: string[];
        closings: string[];
      };
      knowledgeLevelTone: {
        [key: string]: {
          complexity: number;
          encouragementLevel: number;
          technicalTerms: boolean;
        };
      };
      technicalTerms: {
        [key: string]: string;
      };
      casualReplacements: {
        [key: string]: string;
      };
      firstPersonReplacements: {
        [key: string]: string;
      };
    };
  };
}

@Injectable()
export class ToneTransformerService {
  private readonly logger = new Logger(ToneTransformerService.name);

  private readonly toneConfig: ToneConfig = {
    emojis: {
      positive: ['🚀', '✨', '💪', '🎯', '😊'],
      emphasis: ['💡', '🎉', '✅'],
      brand: ['💜'],
      finance: ['💰', '📈', '🏦', '💸', '🎯'],
    },
    languages: {
      'pt-BR': {
        casualPhrases: {
          greetings: ['Oi!', 'E aí!', 'Olá!', 'Opa!'],
          transitions: ['Vamo lá!', 'Bora!', 'Então...', 'Sabe...'],
          encouragement: [
            'Você tá indo super bem!',
            'Mandou bem!',
            'Tô gostando de ver!',
            'Continue assim!',
          ],
          closings: [
            'Tô aqui se precisar de mais ajuda! 💜',
            'Me fala se ficou alguma dúvida! 💜',
            'Pode perguntar mais, tô aqui pra isso! 💜',
            'Bora continuar aprendendo juntos! 💜',
          ],
        },
        knowledgeLevelTone: {
          NO_KNOWLEDGE: {
            complexity: 1,
            encouragementLevel: 3,
            technicalTerms: false,
          },
          BEGINNER: {
            complexity: 2,
            encouragementLevel: 2,
            technicalTerms: false,
          },
          INTERMEDIATE: {
            complexity: 3,
            encouragementLevel: 2,
            technicalTerms: true,
          },
          ADVANCED: {
            complexity: 4,
            encouragementLevel: 1,
            technicalTerms: true,
          },
          EXPERT: {
            complexity: 5,
            encouragementLevel: 1,
            technicalTerms: true,
          },
        },
        technicalTerms: {
          'investimento de renda fixa': 'investimento mais seguro',
          diversificação: 'distribuição do dinheiro',
          volatilidade: 'variação',
          liquidez: 'disponibilidade do dinheiro',
          rentabilidade: 'ganho',
          'Certificado de Depósito Bancário': 'CDB',
          'título de renda fixa': 'tipo de investimento seguro',
          'captar recursos': 'pegar dinheiro emprestado',
        },
        casualReplacements: {
          '\\b(vamos|vou)\\b': 'vamo',
          '\\b(estou)\\b': 'tô',
          '\\b(está)\\b': 'tá',
          '\\b(estão)\\b': 'tão',
          '\\b(para)\\b': 'pra',
          '\\b(você está)\\b': 'você tá',
          '\\b(em relação a)\\b': 'sobre',
          '\\b(isto|isso) significa\\b': 'quer dizer',
          '\\b(portanto|assim)\\b': 'então',
          '\\b(permite|possibilita)\\b': 'deixa',
          '\\b(necessita|necessário)\\b': 'precisa',
          '\\b(possui|tem)\\b': 'tem',
          '\\b(realizar|efetuar)\\b': 'fazer',
        },
        firstPersonReplacements: {
          'a Tamy': 'eu',
          'A Tamy': 'Eu',
          'o assistente': 'eu',
          'O assistente': 'Eu',
          'ela pode': 'eu posso',
          'Ela pode': 'Eu posso',
        },
      },
      pt: {
        // Alias for pt-BR
        casualPhrases: {
          greetings: ['Oi!', 'E aí!', 'Olá!', 'Opa!'],
          transitions: ['Vamo lá!', 'Bora!', 'Então...', 'Sabe...'],
          encouragement: [
            'Você tá indo super bem!',
            'Mandou bem!',
            'Tô gostando de ver!',
            'Continue assim!',
          ],
          closings: [
            'Tô aqui se precisar de mais ajuda! 💜',
            'Me fala se ficou alguma dúvida! 💜',
            'Pode perguntar mais, tô aqui pra isso! 💜',
            'Bora continuar aprendendo juntos! 💜',
          ],
        },
        knowledgeLevelTone: {
          NO_KNOWLEDGE: {
            complexity: 1,
            encouragementLevel: 3,
            technicalTerms: false,
          },
          BEGINNER: {
            complexity: 2,
            encouragementLevel: 2,
            technicalTerms: false,
          },
          INTERMEDIATE: {
            complexity: 3,
            encouragementLevel: 2,
            technicalTerms: true,
          },
          ADVANCED: {
            complexity: 4,
            encouragementLevel: 1,
            technicalTerms: true,
          },
          EXPERT: {
            complexity: 5,
            encouragementLevel: 1,
            technicalTerms: true,
          },
        },
        technicalTerms: {
          'investimento de renda fixa': 'investimento mais seguro',
          diversificação: 'distribuição do dinheiro',
          volatilidade: 'variação',
          liquidez: 'disponibilidade do dinheiro',
          rentabilidade: 'ganho',
          'Certificado de Depósito Bancário': 'CDB',
          'título de renda fixa': 'tipo de investimento seguro',
          'captar recursos': 'pegar dinheiro emprestado',
        },
        casualReplacements: {
          '\\b(vamos|vou)\\b': 'vamo',
          '\\b(estou)\\b': 'tô',
          '\\b(está)\\b': 'tá',
          '\\b(estão)\\b': 'tão',
          '\\b(para)\\b': 'pra',
          '\\b(você está)\\b': 'você tá',
          '\\b(em relação a)\\b': 'sobre',
          '\\b(isto|isso) significa\\b': 'quer dizer',
          '\\b(portanto|assim)\\b': 'então',
          '\\b(permite|possibilita)\\b': 'deixa',
          '\\b(necessita|necessário)\\b': 'precisa',
          '\\b(possui|tem)\\b': 'tem',
          '\\b(realizar|efetuar)\\b': 'fazer',
        },
        firstPersonReplacements: {
          'a Tamy': 'eu',
          'A Tamy': 'Eu',
          'o assistente': 'eu',
          'O assistente': 'Eu',
          'ela pode': 'eu posso',
          'Ela pode': 'Eu posso',
        },
      },
    },
  };

  transformTone(content: string, state: OrchestratorState): string {
    try {
      const languageCode = this.getLanguageCode(state);
      let config =
        this.toneConfig.languages[
          languageCode as keyof typeof this.toneConfig.languages
        ];

      if (!config) {
        this.logger.warn(
          `No language config found for ${languageCode}, trying fallback`,
        );
        // Try fallback to base language code
        const baseCode = languageCode.split('-')[0];
        config =
          this.toneConfig.languages[
            baseCode as keyof typeof this.toneConfig.languages
          ];

        if (!config) {
          this.logger.warn(
            `No fallback config found for ${baseCode}, using default tone`,
          );
          return content;
        }
      }

      let transformed = content;

      // Add a greeting if it's a new message
      if (this.shouldAddGreeting(transformed)) {
        const greeting = this.getRandomPhrase(config.casualPhrases.greetings);
        transformed = `${greeting} ${transformed}`;
      }

      // Apply knowledge level-based transformations
      transformed = this.applyKnowledgeLevelTone(
        transformed,
        state.memoryContext?.financialKnowledge || 'BEGINNER',
        config,
      );

      // Convert to first person
      transformed = this.convertToFirstPerson(transformed, config);

      // Add appropriate emojis
      transformed = this.addEmojis(transformed);

      // Make language more casual
      transformed = this.casualizeLanguage(transformed, config);

      // Add a closing if it's the end of the message
      if (this.shouldAddClosing(transformed)) {
        const closing = this.getRandomPhrase(config.casualPhrases.closings);
        transformed = `${transformed}\n\n${closing}`;
      }

      return transformed;
    } catch (error) {
      this.logger.error('Error transforming tone', error);
      return content;
    }
  }

  private getLanguageCode(state: OrchestratorState): string {
    // Try to get language from state
    const langPref =
      state.memoryContext?.languagePreference?.code ||
      state.memoryContext?.preferredLanguage?.code ||
      'pt-BR'; // Default to Brazilian Portuguese

    return langPref;
  }

  private shouldAddGreeting(content: string): boolean {
    if (!content) return false;
    // Add greeting if the content doesn't already start with common greetings
    const commonGreetings = ['oi', 'olá', 'hey', 'hi', 'hello', 'e aí', 'opa'];
    const words = content.split(' ');
    if (words.length === 0) return true;
    const firstWord = words[0];
    if (!firstWord) return true;
    return !commonGreetings.includes(firstWord.toLowerCase());
  }

  private shouldAddClosing(content: string): boolean {
    if (!content) return false;
    // Add closing if the content doesn't already end with common closings
    const commonClosings = ['ajuda', 'dúvida', 'perguntar', 'dúvidas'];
    const words = content.toLowerCase().split(' ');
    const lastWords = words.slice(-3);
    return !commonClosings.some((closing) => lastWords.includes(closing));
  }

  private getRandomPhrase(phrases: string[]): string {
    if (!phrases || phrases.length === 0) return '';
    const index = Math.floor(Math.random() * phrases.length);
    return phrases[index] || '';
  }

  private applyKnowledgeLevelTone(
    content: string,
    knowledgeLevel: string,
    langConfig: ToneConfig['languages'][keyof ToneConfig['languages']],
  ): string {
    const config = langConfig.knowledgeLevelTone[knowledgeLevel];
    if (!config) return content;

    let transformed = content;

    // Adjust language complexity
    if (config.complexity <= 2) {
      // Simplify technical terms
      Object.entries(langConfig.technicalTerms).forEach(
        ([technical, simple]) => {
          transformed = transformed.replace(
            new RegExp(technical, 'gi'),
            simple,
          );
        },
      );
    }

    // Add encouragement based on level
    if (config.encouragementLevel >= 2) {
      const encouragement = this.getRandomPhrase(
        langConfig.casualPhrases.encouragement,
      );
      transformed = `${encouragement} ${transformed}`;
    }

    return transformed;
  }

  private convertToFirstPerson(
    content: string,
    langConfig: ToneConfig['languages'][keyof ToneConfig['languages']],
  ): string {
    let transformed = content;
    Object.entries(langConfig.firstPersonReplacements).forEach(([from, to]) => {
      transformed = transformed.replace(new RegExp(from, 'g'), to);
    });
    return transformed;
  }

  private addEmojis(content: string): string {
    let transformed = content;

    // Add brand emoji to mentions of Tamy
    transformed = transformed.replace(/\b(Tamy|TAMY)\b/g, 'Tamy 💜');

    // Add finance emojis to key terms
    const financeTerms = {
      investimento: '💰',
      dinheiro: '💸',
      banco: '🏦',
      rendimento: '📈',
      ganho: '📈',
      meta: '🎯',
      CDB: '💰',
      'renda fixa': '💰',
    };

    Object.entries(financeTerms).forEach(([term, emoji]) => {
      transformed = transformed.replace(
        new RegExp(`\\b${term}\\b`, 'gi'),
        `${term} ${emoji}`,
      );
    });

    // Add positive emojis to encouraging statements
    const positivePatterns = [
      /\b(parabéns|ótimo|excelente|muito bem|congratulations|great|excellent|well done)\b/gi,
      /\b(conseguiu|alcançou|realizou|achieved|accomplished|succeeded)\b/gi,
    ];

    positivePatterns.forEach((pattern) => {
      transformed = transformed.replace(pattern, (match) => {
        const emoji = this.getRandomPhrase(this.toneConfig.emojis.positive);
        return `${match} ${emoji}`;
      });
    });

    return transformed;
  }

  private casualizeLanguage(
    content: string,
    langConfig: ToneConfig['languages'][keyof ToneConfig['languages']],
  ): string {
    let transformed = content;
    Object.entries(langConfig.casualReplacements).forEach(
      ([formal, casual]) => {
        transformed = transformed.replace(new RegExp(formal, 'g'), casual);
      },
    );
    return transformed;
  }
}
