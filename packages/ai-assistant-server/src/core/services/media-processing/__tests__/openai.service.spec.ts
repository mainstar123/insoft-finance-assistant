import { Test, TestingModule } from '@nestjs/testing';
import { OpenAIService } from '../openai.service';
import { ConfigService } from '../../../../config/config.service';
import { Logger } from '@nestjs/common';
import axios from 'axios';
import OpenAI from 'openai';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';

// Mock dependencies
jest.mock('axios');
jest.mock('openai');
jest.mock('@langchain/openai');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;
const mockedChatOpenAI = ChatOpenAI as jest.MockedClass<typeof ChatOpenAI>;

describe('OpenAIService', () => {
  let service: OpenAIService;
  let configService: ConfigService;

  // Mock the logger to avoid console output during tests
  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    setContext: jest.fn(),
  };

  // Create mock ConfigService
  const mockConfigService = {
    getAIConfig: jest.fn().mockReturnValue({
      openaiApiKey: 'test-api-key',
    }),
  };

  // Mock for ChatOpenAI invoke method
  const mockInvoke = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock the Logger
    jest.spyOn(Logger, 'error').mockImplementation(mockLogger.error);
    jest.spyOn(Logger, 'log').mockImplementation(mockLogger.log);
    jest.spyOn(Logger, 'warn').mockImplementation(mockLogger.warn);
    jest.spyOn(Logger, 'debug').mockImplementation(mockLogger.debug);

    // Setup ChatOpenAI mock
    mockedChatOpenAI.prototype.invoke = mockInvoke;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAIService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<OpenAIService>(OpenAIService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize OpenAI API with the correct API key', () => {
      expect(mockedOpenAI).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
      });
    });

    it('should initialize ChatOpenAI with the correct model and settings', () => {
      expect(mockedChatOpenAI).toHaveBeenCalledWith({
        modelName: 'gpt-4-vision-preview',
        temperature: 0.2,
        maxTokens: 1000,
        cache: true,
      });
    });
  });

  describe('transcribeAudio', () => {
    const audioBuffer = Buffer.from('test audio data');
    const transcriptionOptions = { language: 'en' };
    const mockTranscriptionResponse = { text: 'This is the transcribed text' };

    it('should call OpenAI API to transcribe audio', async () => {
      // Setup
      const mockCreateTranscription = jest
        .fn()
        .mockResolvedValue(mockTranscriptionResponse);
      service['api'].audio = {
        transcriptions: {
          create: mockCreateTranscription,
        },
      } as any;

      // Execute
      const result = await service.transcribeAudio(
        audioBuffer,
        transcriptionOptions,
      );

      // Verify
      expect(result).toBe('This is the transcribed text');
      expect(mockCreateTranscription).toHaveBeenCalledWith(
        expect.objectContaining({
          file: expect.any(Object),
          model: 'whisper-1',
          language: 'en',
        }),
      );
    });

    it('should use default options if none provided', async () => {
      // Setup
      const mockCreateTranscription = jest
        .fn()
        .mockResolvedValue(mockTranscriptionResponse);
      service['api'].audio = {
        transcriptions: {
          create: mockCreateTranscription,
        },
      } as any;

      // Execute
      const result = await service.transcribeAudio(audioBuffer);

      // Verify
      expect(result).toBe('This is the transcribed text');
      expect(mockCreateTranscription).toHaveBeenCalledWith(
        expect.objectContaining({
          file: expect.any(Object),
          model: 'whisper-1',
        }),
      );
    });

    it('should handle errors during transcription', async () => {
      // Setup
      const transcriptionError = new Error('Transcription failed');
      const mockCreateTranscription = jest
        .fn()
        .mockRejectedValue(transcriptionError);
      service['api'].audio = {
        transcriptions: {
          create: mockCreateTranscription,
        },
      } as any;

      // Execute & Verify
      await expect(service.transcribeAudio(audioBuffer)).rejects.toThrow(
        transcriptionError,
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('analyzeImage', () => {
    const imageBuffer = Buffer.from('test image data');
    const analysisOptions = { analysisType: 'receipt' as const };
    const mockAnalysisResponse = { content: 'This is the image analysis' };

    it('should call ChatOpenAI to analyze image', async () => {
      // Setup
      mockInvoke.mockResolvedValue(mockAnalysisResponse);

      // Execute
      const result = await service.analyzeImage(imageBuffer, analysisOptions);

      // Verify
      expect(result).toBe('This is the image analysis');
      expect(mockInvoke).toHaveBeenCalledWith([expect.any(HumanMessage)]);
    });

    it('should use receipt-specific prompt for receipt analysis', async () => {
      // Setup
      mockInvoke.mockResolvedValue(mockAnalysisResponse);

      // Execute
      await service.analyzeImage(imageBuffer, {
        analysisType: 'receipt' as const,
      });

      // Verify
      expect(mockInvoke).toHaveBeenCalledWith([
        expect.objectContaining({
          content: expect.arrayContaining([
            expect.objectContaining({
              type: 'text',
              text: expect.stringContaining('This is a receipt'),
            }),
          ]),
        }),
      ]);
    });

    it('should use document-specific prompt for document analysis', async () => {
      // Setup
      mockInvoke.mockResolvedValue(mockAnalysisResponse);

      // Execute
      await service.analyzeImage(imageBuffer, {
        analysisType: 'document' as const,
      });

      // Verify
      expect(mockInvoke).toHaveBeenCalledWith([
        expect.objectContaining({
          content: expect.arrayContaining([
            expect.objectContaining({
              type: 'text',
              text: expect.stringContaining('This is a financial document'),
            }),
          ]),
        }),
      ]);
    });

    it('should use transaction-specific prompt for transaction analysis', async () => {
      // Setup
      mockInvoke.mockResolvedValue(mockAnalysisResponse);

      // Execute
      await service.analyzeImage(imageBuffer, {
        analysisType: 'transaction' as const,
      });

      // Verify
      expect(mockInvoke).toHaveBeenCalledWith([
        expect.objectContaining({
          content: expect.arrayContaining([
            expect.objectContaining({
              type: 'text',
              text: expect.stringContaining(
                'This shows a financial transaction',
              ),
            }),
          ]),
        }),
      ]);
    });

    it('should use custom prompt if provided', async () => {
      // Setup
      mockInvoke.mockResolvedValue(mockAnalysisResponse);
      const customPrompt = 'Custom analysis prompt';

      // Execute
      await service.analyzeImage(imageBuffer, { prompt: customPrompt });

      // Verify
      expect(mockInvoke).toHaveBeenCalledWith([
        expect.objectContaining({
          content: expect.arrayContaining([
            expect.objectContaining({
              type: 'text',
              text: expect.stringContaining(customPrompt),
            }),
          ]),
        }),
      ]);
    });

    it('should include caption context if provided', async () => {
      // Setup
      mockInvoke.mockResolvedValue(mockAnalysisResponse);
      const captionContext = 'This is a caption context';

      // Execute
      await service.analyzeImage(imageBuffer, {
        analysisType: 'receipt' as const,
        captionContext,
      });

      // Verify
      expect(mockInvoke).toHaveBeenCalledWith([
        expect.objectContaining({
          content: expect.arrayContaining([
            expect.objectContaining({
              type: 'text',
              text: expect.stringContaining(captionContext),
            }),
          ]),
        }),
      ]);
    });

    it('should handle errors during image analysis', async () => {
      // Setup
      const analysisError = new Error('Analysis failed');
      mockInvoke.mockRejectedValue(analysisError);

      // Execute & Verify
      await expect(
        service.analyzeImage(imageBuffer, analysisOptions),
      ).rejects.toThrow(analysisError);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('downloadMedia', () => {
    const mediaUrl = 'https://example.com/media.jpg';
    const mockResponse = {
      data: Buffer.from('test media data'),
      headers: { 'content-type': 'image/jpeg' },
    };

    it('should download media using axios', async () => {
      // Setup
      mockedAxios.get.mockResolvedValue(mockResponse);

      // Execute
      const result = await service.downloadMedia(mediaUrl);

      // Verify
      expect(result).toEqual({
        buffer: mockResponse.data,
        contentType: 'image/jpeg',
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(mediaUrl, {
        responseType: 'arraybuffer',
      });
    });

    it('should handle errors during download', async () => {
      // Setup
      const downloadError = new Error('Download failed');
      mockedAxios.get.mockRejectedValue(downloadError);

      // Execute & Verify
      await expect(service.downloadMedia(mediaUrl)).rejects.toThrow(
        downloadError,
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
