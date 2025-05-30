import { Module } from '@nestjs/common';
import { MediaProcessingService } from './media-processing.service';
import { AudioProcessingService } from './audio-processing.service';
import { ImageProcessingService } from './image-processing.service';
import { DocumentProcessingService } from './document-processing.service';
import { OpenAIService } from './openai.service';
import { ConfigModule } from '../../../config';

/**
 * Module for processing different types of media (audio, images, documents)
 */
@Module({
  imports: [ConfigModule],
  providers: [
    MediaProcessingService,
    AudioProcessingService,
    ImageProcessingService,
    DocumentProcessingService,
    OpenAIService,
  ],
  exports: [MediaProcessingService],
})
export class MediaProcessingModule {}
