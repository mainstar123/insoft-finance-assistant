import { Test, TestingModule } from '@nestjs/testing';
import { MediaProcessingService } from '../media-processing.service';
import { OpenAIService } from '../openai.service';
import { AudioProcessingService } from '../audio-processing.service';
import { ImageProcessingService } from '../image-processing.service';
import { DocumentProcessingService } from '../document-processing.service';
import {
  UnsupportedMediaTypeException,
  MediaProcessingException,
} from '../exceptions';
import { Logger } from '@nestjs/common';

describe('MediaProcessingService', () => {
  let service: MediaProcessingService;
  let openaiService: OpenAIService;
  let audioProcessingService: AudioProcessingService;
  let imageProcessingService: ImageProcessingService;
  let documentProcessingService: DocumentProcessingService;

  // Mock the logger to avoid console output during tests
  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    setContext: jest.fn(),
  };

  // Mock dependencies
  const mockOpenAIService = {
    downloadMedia: jest.fn(),
    analyzeImage: jest.fn(),
  };

  const mockAudioProcessingService = {
    transcribeAudio: jest.fn(),
    detectLanguage: jest.fn(),
  };

  const mockImageProcessingService = {
    analyzeImage: jest.fn(),
  };

  const mockDocumentProcessingService = {
    parseDocument: jest.fn(),
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
        MediaProcessingService,
        { provide: OpenAIService, useValue: mockOpenAIService },
        {
          provide: AudioProcessingService,
          useValue: mockAudioProcessingService,
        },
        {
          provide: ImageProcessingService,
          useValue: mockImageProcessingService,
        },
        {
          provide: DocumentProcessingService,
          useValue: mockDocumentProcessingService,
        },
      ],
    }).compile();

    service = module.get<MediaProcessingService>(MediaProcessingService);
    openaiService = module.get<OpenAIService>(OpenAIService);
    audioProcessingService = module.get<AudioProcessingService>(
      AudioProcessingService,
    );
    imageProcessingService = module.get<ImageProcessingService>(
      ImageProcessingService,
    );
    documentProcessingService = module.get<DocumentProcessingService>(
      DocumentProcessingService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processMedia', () => {
    const mediaUrl = 'https://example.com/media.jpg';
    const mediaBuffer = Buffer.from('test media data');

    it('should process image media', async () => {
      // Setup
      const mediaType = 'image/jpeg';
      const analysisResult = 'This is an image analysis';
      mockOpenAIService.downloadMedia.mockResolvedValue({
        buffer: mediaBuffer,
        contentType: mediaType,
      });
      mockOpenAIService.analyzeImage.mockResolvedValue(analysisResult);

      // Execute
      const result = await service.processMedia(mediaUrl);

      // Verify
      expect(result).toEqual({
        mediaType,
        content: analysisResult,
        metadata: {
          url: mediaUrl,
          processingTimeMs: expect.any(Number),
        },
      });
      expect(openaiService.downloadMedia).toHaveBeenCalledWith(mediaUrl);
      expect(openaiService.analyzeImage).toHaveBeenCalledWith(
        mediaBuffer,
        expect.any(Object),
      );
    });

    it('should process audio media', async () => {
      // Setup
      const mediaType = 'audio/mp3';
      const transcriptionResult = 'This is a transcription';
      mockOpenAIService.downloadMedia.mockResolvedValue({
        buffer: mediaBuffer,
        contentType: mediaType,
      });
      mockAudioProcessingService.transcribeAudio.mockResolvedValue(
        transcriptionResult,
      );

      // Execute
      const result = await service.processMedia(mediaUrl);

      // Verify
      expect(result).toEqual({
        mediaType,
        content: transcriptionResult,
        metadata: {
          url: mediaUrl,
          processingTimeMs: expect.any(Number),
        },
      });
      expect(openaiService.downloadMedia).toHaveBeenCalledWith(mediaUrl);
      expect(audioProcessingService.transcribeAudio).toHaveBeenCalledWith(
        mediaUrl,
        mediaBuffer,
        undefined,
      );
    });

    it('should process video media as audio', async () => {
      // Setup
      const mediaType = 'video/mp4';
      const transcriptionResult = 'This is a video transcription';
      mockOpenAIService.downloadMedia.mockResolvedValue({
        buffer: mediaBuffer,
        contentType: mediaType,
      });
      mockAudioProcessingService.transcribeAudio.mockResolvedValue(
        transcriptionResult,
      );

      // Execute
      const result = await service.processMedia(mediaUrl);

      // Verify
      expect(result).toEqual({
        mediaType,
        content: transcriptionResult,
        metadata: {
          url: mediaUrl,
          processingTimeMs: expect.any(Number),
        },
      });
      expect(openaiService.downloadMedia).toHaveBeenCalledWith(mediaUrl);
      expect(audioProcessingService.transcribeAudio).toHaveBeenCalledWith(
        mediaUrl,
        mediaBuffer,
        undefined,
      );
    });

    it('should throw MediaProcessingException for unsupported media types', async () => {
      // Setup
      const mediaType = 'application/pdf';
      mockOpenAIService.downloadMedia.mockResolvedValue({
        buffer: mediaBuffer,
        contentType: mediaType,
      });

      // Execute & Verify
      await expect(service.processMedia(mediaUrl)).rejects.toThrow(
        MediaProcessingException,
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should throw MediaProcessingException if download fails', async () => {
      // Setup
      const downloadError = new Error('Download failed');
      mockOpenAIService.downloadMedia.mockRejectedValue(downloadError);

      // Execute & Verify
      await expect(service.processMedia(mediaUrl)).rejects.toThrow(
        MediaProcessingException,
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('analyzeImage', () => {
    const imageUrl = 'https://example.com/image.jpg';
    const imageBuffer = Buffer.from('test image data');
    const options = { analysisType: 'receipt' as const };
    const analysisResult = 'This is an image analysis';

    it('should analyze image with provided options', async () => {
      // Setup
      mockOpenAIService.downloadMedia.mockResolvedValue({
        buffer: imageBuffer,
        contentType: 'image/jpeg',
      });
      mockOpenAIService.analyzeImage.mockResolvedValue(analysisResult);

      // Execute
      const result = await service.analyzeImage(imageUrl, options);

      // Verify
      expect(result).toEqual({
        content: analysisResult,
        metadata: {
          url: imageUrl,
          processingTimeMs: expect.any(Number),
          analysisType: 'receipt',
        },
      });
      expect(openaiService.downloadMedia).toHaveBeenCalledWith(imageUrl);
      expect(openaiService.analyzeImage).toHaveBeenCalledWith(
        imageBuffer,
        options,
      );
    });

    it('should use buffer if provided', async () => {
      // Setup
      mockOpenAIService.analyzeImage.mockResolvedValue(analysisResult);

      // Execute
      const result = await service.analyzeImage(imageUrl, options, imageBuffer);

      // Verify
      expect(result).toEqual({
        content: analysisResult,
        metadata: {
          url: imageUrl,
          processingTimeMs: expect.any(Number),
          analysisType: 'receipt',
        },
      });
      expect(openaiService.downloadMedia).not.toHaveBeenCalled();
      expect(openaiService.analyzeImage).toHaveBeenCalledWith(
        imageBuffer,
        options,
      );
    });

    it('should throw MediaProcessingException if analysis fails', async () => {
      // Setup
      const analysisError = new Error('Analysis failed');
      mockOpenAIService.downloadMedia.mockResolvedValue({
        buffer: imageBuffer,
        contentType: 'image/jpeg',
      });
      mockOpenAIService.analyzeImage.mockRejectedValue(analysisError);

      // Execute & Verify
      await expect(service.analyzeImage(imageUrl, options)).rejects.toThrow(
        MediaProcessingException,
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('transcribeAudio', () => {
    const audioUrl = 'https://example.com/audio.mp3';
    const audioBuffer = Buffer.from('test audio data');
    const options = { language: 'en' };
    const transcriptionResult = 'This is a transcription';

    it('should transcribe audio with provided options', async () => {
      // Setup
      mockAudioProcessingService.transcribeAudio.mockResolvedValue(
        transcriptionResult,
      );

      // Execute
      const result = await service.transcribeAudio(audioUrl, options);

      // Verify
      expect(result).toEqual({
        content: transcriptionResult,
        metadata: {
          url: audioUrl,
          processingTimeMs: expect.any(Number),
          language: 'en',
        },
      });
      expect(audioProcessingService.transcribeAudio).toHaveBeenCalledWith(
        audioUrl,
        undefined,
        options,
      );
    });

    it('should use buffer if provided', async () => {
      // Setup
      mockAudioProcessingService.transcribeAudio.mockResolvedValue(
        transcriptionResult,
      );

      // Execute
      const result = await service.transcribeAudio(
        audioUrl,
        options,
        audioBuffer,
      );

      // Verify
      expect(result).toEqual({
        content: transcriptionResult,
        metadata: {
          url: audioUrl,
          processingTimeMs: expect.any(Number),
          language: 'en',
        },
      });
      expect(audioProcessingService.transcribeAudio).toHaveBeenCalledWith(
        audioUrl,
        audioBuffer,
        options,
      );
    });

    it('should throw MediaProcessingException if transcription fails', async () => {
      // Setup
      const transcriptionError = new Error('Transcription failed');
      mockAudioProcessingService.transcribeAudio.mockRejectedValue(
        transcriptionError,
      );

      // Execute & Verify
      await expect(service.transcribeAudio(audioUrl, options)).rejects.toThrow(
        MediaProcessingException,
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('detectLanguage', () => {
    const audioUrl = 'https://example.com/audio.mp3';
    const audioBuffer = Buffer.from('test audio data');
    const languageResult = 'en';

    it('should detect language from audio', async () => {
      // Setup
      mockAudioProcessingService.detectLanguage.mockResolvedValue(
        languageResult,
      );

      // Execute
      const result = await service.detectLanguage(audioUrl);

      // Verify
      expect(result).toEqual({
        language: languageResult,
        metadata: {
          url: audioUrl,
          processingTimeMs: expect.any(Number),
        },
      });
      expect(audioProcessingService.detectLanguage).toHaveBeenCalledWith(
        audioUrl,
        undefined,
      );
    });

    it('should use buffer if provided', async () => {
      // Setup
      mockAudioProcessingService.detectLanguage.mockResolvedValue(
        languageResult,
      );

      // Execute
      const result = await service.detectLanguage(audioUrl, audioBuffer);

      // Verify
      expect(result).toEqual({
        language: languageResult,
        metadata: {
          url: audioUrl,
          processingTimeMs: expect.any(Number),
        },
      });
      expect(audioProcessingService.detectLanguage).toHaveBeenCalledWith(
        audioUrl,
        audioBuffer,
      );
    });

    it('should throw MediaProcessingException if language detection fails', async () => {
      // Setup
      const detectionError = new Error('Language detection failed');
      mockAudioProcessingService.detectLanguage.mockRejectedValue(
        detectionError,
      );

      // Execute & Verify
      await expect(service.detectLanguage(audioUrl)).rejects.toThrow(
        MediaProcessingException,
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('detectMediaType', () => {
    it('should detect audio files', () => {
      expect(service.detectMediaType('https://example.com/audio.mp3')).toBe(
        'audio',
      );
      expect(service.detectMediaType('https://example.com/audio.wav')).toBe(
        'audio',
      );
      expect(service.detectMediaType('https://example.com/audio.ogg')).toBe(
        'audio',
      );
      expect(service.detectMediaType('https://example.com/audio.m4a')).toBe(
        'audio',
      );
    });

    it('should detect image files', () => {
      expect(service.detectMediaType('https://example.com/image.jpg')).toBe(
        'image',
      );
      expect(service.detectMediaType('https://example.com/image.jpeg')).toBe(
        'image',
      );
      expect(service.detectMediaType('https://example.com/image.png')).toBe(
        'image',
      );
      expect(service.detectMediaType('https://example.com/image.gif')).toBe(
        'image',
      );
      expect(service.detectMediaType('https://example.com/image.webp')).toBe(
        'image',
      );
    });

    it('should detect PDF files', () => {
      expect(service.detectMediaType('https://example.com/document.pdf')).toBe(
        'pdf',
      );
    });

    it('should detect CSV files', () => {
      expect(service.detectMediaType('https://example.com/data.csv')).toBe(
        'csv',
      );
    });

    it('should return unknown for unsupported or missing extensions', () => {
      expect(service.detectMediaType('https://example.com/file.txt')).toBe(
        'unknown',
      );
      expect(service.detectMediaType('https://example.com/file')).toBe(
        'unknown',
      );
      expect(service.detectMediaType('https://example.com/')).toBe('unknown');
    });
  });
});
