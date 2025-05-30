import { Test, TestingModule } from '@nestjs/testing';
import { AudioProcessingService } from '../audio-processing.service';
import { OpenAIService } from '../openai.service';
import { AudioProcessingException } from '../exceptions';
import { Logger } from '@nestjs/common';
import axios from 'axios';

// Mock dependencies
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AudioProcessingService', () => {
  let service: AudioProcessingService;
  let openaiService: OpenAIService;

  // Mock the logger to avoid console output during tests
  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    setContext: jest.fn(),
  };

  // Mock OpenAIService
  const mockOpenAIService = {
    transcribeAudio: jest.fn(),
    downloadMedia: jest.fn(),
    analyzeImage: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock the Logger
    jest.spyOn(Logger, 'error').mockImplementation(mockLogger.error);
    jest.spyOn(Logger, 'log').mockImplementation(mockLogger.log);
    jest.spyOn(Logger, 'warn').mockImplementation(mockLogger.warn);
    jest.spyOn(Logger, 'debug').mockImplementation(mockLogger.debug);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AudioProcessingService,
        { provide: OpenAIService, useValue: mockOpenAIService },
      ],
    }).compile();

    service = module.get<AudioProcessingService>(AudioProcessingService);
    openaiService = module.get<OpenAIService>(OpenAIService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('transcribeAudio', () => {
    const audioUrl = 'https://example.com/audio.mp3';
    const audioBuffer = Buffer.from('test audio data');
    const transcriptionOptions = { language: 'en' };
    const transcriptionResult = 'This is the transcribed text';

    it('should use pre-downloaded buffer if provided', async () => {
      // Setup
      mockOpenAIService.transcribeAudio.mockResolvedValue(transcriptionResult);

      // Execute
      const result = await service.transcribeAudio(audioUrl, {
        audioBuffer,
        ...transcriptionOptions,
      });

      // Verify
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          text: transcriptionResult,
        }),
      );
      expect(mockOpenAIService.transcribeAudio).toHaveBeenCalledWith(
        audioBuffer,
        expect.objectContaining(transcriptionOptions),
      );
      expect(mockOpenAIService.downloadMedia).not.toHaveBeenCalled();
    });

    it('should download audio via OpenAI service if buffer not provided', async () => {
      // Setup
      mockOpenAIService.downloadMedia.mockResolvedValue(audioBuffer);
      mockOpenAIService.transcribeAudio.mockResolvedValue(transcriptionResult);

      // Execute
      const result = await service.transcribeAudio(
        audioUrl,
        transcriptionOptions,
      );

      // Verify
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          text: transcriptionResult,
        }),
      );
      expect(mockOpenAIService.downloadMedia).toHaveBeenCalledWith(
        audioUrl,
        undefined,
      );
      expect(mockOpenAIService.transcribeAudio).toHaveBeenCalledWith(
        audioBuffer,
        expect.objectContaining(transcriptionOptions),
      );
    });

    it('should fall back to axios for download if OpenAI service fails', async () => {
      // Setup
      const downloadError = new Error('OpenAI download failed');
      mockOpenAIService.downloadMedia.mockRejectedValue(downloadError);
      mockOpenAIService.transcribeAudio.mockResolvedValue(transcriptionResult);
      mockedAxios.get.mockResolvedValue({
        data: audioBuffer,
        headers: { 'content-type': 'audio/mp3' },
      });

      // Execute
      const result = await service.transcribeAudio(
        audioUrl,
        transcriptionOptions,
      );

      // Verify
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          text: transcriptionResult,
        }),
      );
      expect(mockOpenAIService.downloadMedia).toHaveBeenCalledWith(
        audioUrl,
        undefined,
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        audioUrl,
        expect.any(Object),
      );
      expect(mockOpenAIService.transcribeAudio).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining(transcriptionOptions),
      );
    });

    it('should throw AudioProcessingException if download fails', async () => {
      // Setup
      const downloadError = new Error('Download failed');
      mockOpenAIService.downloadMedia.mockRejectedValue(downloadError);
      mockedAxios.get.mockRejectedValue(downloadError);

      // Execute & Verify
      try {
        await service.transcribeAudio(audioUrl, transcriptionOptions);
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AudioProcessingException);
      }
    });

    it('should throw AudioProcessingException if transcription fails', async () => {
      // Setup
      const transcriptionError = new Error('Transcription failed');
      mockOpenAIService.downloadMedia.mockResolvedValue(audioBuffer);
      mockOpenAIService.transcribeAudio.mockRejectedValue(transcriptionError);

      // Execute & Verify
      try {
        await service.transcribeAudio(audioUrl, transcriptionOptions);
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AudioProcessingException);
      }
    });
  });

  describe('detectLanguage', () => {
    const audioUrl = 'https://example.com/audio.mp3';
    const audioBuffer = Buffer.from('test audio data');
    const languageResult = 'pt';

    it('should detect language using OpenAI service', async () => {
      // Setup
      mockOpenAIService.downloadMedia.mockResolvedValue(audioBuffer);
      mockOpenAIService.transcribeAudio.mockResolvedValue(languageResult);

      // Execute
      const result = await service.detectLanguage(audioUrl);

      // Verify
      expect(result).toBe(languageResult);
      expect(mockOpenAIService.downloadMedia).toHaveBeenCalledWith(audioUrl);
      expect(mockOpenAIService.transcribeAudio).toHaveBeenCalledWith(
        audioBuffer,
      );
    });

    it('should throw AudioProcessingException if language detection fails', async () => {
      // Setup
      const detectionError = new Error('Language detection failed');
      mockOpenAIService.downloadMedia.mockResolvedValue(audioBuffer);
      mockOpenAIService.transcribeAudio.mockRejectedValue(detectionError);

      // Execute & Verify
      try {
        await service.detectLanguage(audioUrl);
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AudioProcessingException);
      }
    });
  });
});
