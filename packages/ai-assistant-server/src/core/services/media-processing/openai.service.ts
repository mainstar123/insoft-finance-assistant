import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import axios from 'axios';
import { TranscriptionOptions, ImageAnalysisOptions } from './interfaces';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import { getErrorMessage, normalizeError } from '../../utils/error-handling';
import { ConfigService } from '@/config';


/**
 * Service for interacting with OpenAI APIs (Whisper, GPT-4 Vision)
 */
@Injectable()
export class OpenAIService {
  private readonly api: OpenAI;
  private readonly logger = new Logger(OpenAIService.name);
  private readonly chatModel: ChatOpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getAIConfig().openaiApiKey;

    this.api = new OpenAI({
      apiKey,
    });

    this.chatModel = new ChatOpenAI({
      modelName: 'gpt-4-vision-preview',
      temperature: 0.2,
      maxTokens: 1000,
      cache: true,
    });

    this.logger.log('OpenAI service initialized');
  }

  /**
   * Transcribe audio using OpenAI Whisper
   * @param audioBuffer Audio buffer to transcribe
   * @param options Transcription options
   * @returns Transcribed text
   */
  async transcribeAudio(
    audioBuffer: Buffer,
    options?: TranscriptionOptions,
  ): Promise<string> {
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `audio-${Date.now()}.mp3`);

    this.logger.debug(`Writing audio to temporary file: ${tempFilePath}`);
    fs.writeFileSync(tempFilePath, audioBuffer);

    try {
      this.logger.debug('Calling OpenAI Whisper API');
      const transcription = await this.api.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        language: options?.language || 'pt', // Default to Portuguese
        prompt: options?.prompt,
        temperature: options?.temperature,
      });

      this.logger.debug('Transcription successful');
      return transcription.text;
    } catch (error) {
      this.logger.error(`Error transcribing audio: ${getErrorMessage(error)}`);
      throw normalizeError(error);
    } finally {
      // Clean up temporary file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
        this.logger.debug(`Deleted temporary file: ${tempFilePath}`);
      }
    }
  }

  /**
   * Analyze image using GPT-4 Vision via LangChain
   * @param imageBuffer Image buffer to analyze
   * @param options Image analysis options
   * @returns Image analysis
   */
  async analyzeImage(
    imageBuffer: Buffer,
    options?: ImageAnalysisOptions,
  ): Promise<string> {
    try {
      this.logger.debug('Calling OpenAI GPT-4 Vision API via LangChain');

      // Convert image buffer to base64
      const base64Image = imageBuffer.toString('base64');
      const imageUrl = `data:image/jpeg;base64,${base64Image}`;

      // Use provided prompt or generate one based on analysis type
      let prompt =
        options?.prompt ||
        'Describe this image in detail, focusing on any financial information.';

      // If no custom prompt is provided, use default prompts based on analysis type
      if (!options?.prompt) {
        if (options?.analysisType === 'receipt') {
          prompt =
            'This is a receipt. Extract the merchant name, date, total amount, payment method, and line items with prices.';
        } else if (options?.analysisType === 'document') {
          prompt =
            'This is a financial document. Extract the document type, dates, amounts, account information, and any other relevant financial details.';
        } else if (options?.analysisType === 'transaction') {
          prompt =
            'This shows a financial transaction. Extract the transaction type, amount, date, time, sender, recipient, and any reference numbers or categories.';
        }
      }

      // Add caption context if provided
      if (options?.caption) {
        prompt = `Context: ${options.caption}\n\n${prompt}`;
      }

      // Create a message with text and image
      const message = new HumanMessage({
        content: [
          {
            type: 'text',
            text: prompt,
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
              detail: 'high',
            },
          },
        ],
      });

      // Call the model with the message
      const response = await this.chatModel.invoke([message]);

      this.logger.debug('Image analysis successful');
      return response.content as string;
    } catch (error) {
      this.logger.error(`Error analyzing image: ${getErrorMessage(error)}`);
      throw normalizeError(error);
    }
  }

  /**
   * Download media from URL
   * @param url URL to download from
   * @param headers Optional headers to include in the request
   * @returns Buffer containing the downloaded media
   */
  async downloadMedia(
    url: string,
    headers?: Record<string, string>,
  ): Promise<Buffer> {
    try {
      this.logger.debug(`Downloading media from: ${url}`);
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          Accept: 'application/octet-stream',
          ...headers,
        },
      });

      this.logger.debug(`Downloaded ${response.data.length} bytes`);
      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(`Error downloading media: ${getErrorMessage(error)}`);
      throw normalizeError(error);
    }
  }

  
}
