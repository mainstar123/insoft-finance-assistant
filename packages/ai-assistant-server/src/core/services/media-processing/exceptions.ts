/**
 * Base exception for media processing errors
 */
export class MediaProcessingException extends Error {
  constructor(
    public readonly mediaType: string,
    public readonly originalError?: Error,
  ) {
    super(
      `Error processing ${mediaType}: ${originalError?.message || 'Unknown error'}`,
    );
    this.name = 'MediaProcessingException';
  }
}

/**
 * Exception for audio processing errors
 */
export class AudioProcessingException extends MediaProcessingException {
  constructor(originalError?: Error) {
    super('audio', originalError);
    this.name = 'AudioProcessingException';
  }
}

/**
 * Exception for image processing errors
 */
export class ImageProcessingException extends MediaProcessingException {
  constructor(originalError?: Error) {
    super('image', originalError);
    this.name = 'ImageProcessingException';
  }
}

/**
 * Exception for document processing errors
 */
export class DocumentProcessingException extends MediaProcessingException {
  constructor(originalError?: Error) {
    super('document', originalError);
    this.name = 'DocumentProcessingException';
  }
}

/**
 * Exception for unsupported media types
 */
export class UnsupportedMediaTypeException extends MediaProcessingException {
  constructor(mediaType: string) {
    super(mediaType, new Error(`Unsupported media type: ${mediaType}`));
    this.name = 'UnsupportedMediaTypeException';
  }
}
