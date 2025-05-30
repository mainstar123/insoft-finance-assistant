import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { TranscriptionOptions, TranscriptionResult } from './interfaces';
import { AudioProcessingException } from './exceptions';
import { normalizeError, getErrorMessage } from '../../utils/error-handling';
import axios from 'axios';

/**
 * Service for processing audio files
 */
@Injectable()
export class AudioProcessingService {
  private readonly logger = new Logger(AudioProcessingService.name);

  constructor(private readonly openaiService: OpenAIService) {
    this.logger.log('Audio processing service initialized');
  }

  /**
   * Transcribe audio from URL
   * @param audioUrl URL of the audio file
   * @param options Transcription options
   * @returns Transcription result
   */
  async transcribeAudio(
    audioUrl: string,
    options?: TranscriptionOptions,
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();
    this.logger.log(`Transcribing audio from ${audioUrl}`);

    try {
      // Use pre-downloaded buffer if available or download the audio file
      let audioBuffer: Buffer;

      if (options?.audioBuffer) {
        this.logger.debug(
          `Using pre-downloaded audio buffer (${options.audioBuffer.length} bytes)`,
        );
        audioBuffer = options.audioBuffer;
      } else {
        try {
          // First try using the OpenAI service
          audioBuffer = await this.openaiService.downloadMedia(
            audioUrl,
            options?.headers,
          );
        } catch (downloadError) {
          this.logger.warn(
            `Failed to download using OpenAI service: ${getErrorMessage(downloadError)}`,
          );

          // Fallback to direct download with axios if OpenAI service fails
          try {
            this.logger.debug(`Attempting direct download from ${audioUrl}`);
            const response = await axios.get(audioUrl, {
              responseType: 'arraybuffer',
              headers: {
                Accept: 'application/octet-stream',
                // Add any required headers for WhatsApp media URLs
                ...(options?.headers || {}),
              },
              // Add a longer timeout for large audio files
              timeout: 30000,
            });

            audioBuffer = Buffer.from(response.data);
            this.logger.debug(
              `Successfully downloaded ${audioBuffer.length} bytes directly`,
            );
          } catch (directDownloadError) {
            this.logger.error(
              `Direct download also failed: ${getErrorMessage(directDownloadError)}`,
            );
            throw directDownloadError;
          }
        }
      }

      // Detect language if not provided
      const language =
        options?.language || (await this.detectLanguage(audioUrl, audioBuffer));

      // Transcribe using Whisper
      const text = await this.openaiService.transcribeAudio(audioBuffer, {
        ...options,
        language,
      });

      const processingTime = Date.now() - startTime;
      this.logger.log(`Transcription completed in ${processingTime}ms`);

      return {
        success: true,
        text,
        language,
        processingTime: new Date(),
        metadata: {
          audioUrl,
          processingTimeMs: processingTime,
          isVoice: options?.isVoice,
          ...options,
        },
      };
    } catch (error) {
      this.logger.error(`Error transcribing audio: ${getErrorMessage(error)}`);
      throw new AudioProcessingException(normalizeError(error));
    }
  }

  /**
   * Detect language in audio
   * @param audioUrl URL of the audio file
   * @param audioBuffer Optional pre-downloaded audio buffer
   * @returns Detected language code
   */
  async detectLanguage(
    audioUrl: string,
    audioBuffer?: Buffer,
  ): Promise<string> {
    this.logger.log(`Detecting language in audio from ${audioUrl}`);

    try {
      // Use provided buffer or download the audio file
      const buffer =
        audioBuffer || (await this.openaiService.downloadMedia(audioUrl));

      // Use Whisper to detect language (first few seconds should be enough)
      const transcription = await this.openaiService.transcribeAudio(buffer);

      // For now, we're assuming Portuguese for Brazilian users
      // In a real implementation, we would use Whisper's language detection
      return 'pt';
    } catch (error) {
      this.logger.error(`Error detecting language: ${getErrorMessage(error)}`);
      throw new AudioProcessingException(normalizeError(error));
    }
  }
}
