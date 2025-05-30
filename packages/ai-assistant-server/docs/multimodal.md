# Multimodal Capabilities

This document describes the multimodal capabilities of the AI Assistant, which allow it to process and analyze various types of media including images, documents, audio, and video.

## Supported Media Types

The AI Assistant can process the following types of media:

- **Images**: JPG, JPEG, PNG, GIF, WEBP
  - General image analysis
  - Receipt analysis
  - Document image analysis

- **Documents**: PDF
  - Text extraction
  - Financial information extraction

- **Structured Data**: CSV
  - Data parsing and analysis

- **Audio**: MP3, WAV
  - Transcription using OpenAI Whisper
  - Financial information extraction from transcripts

- **Video**: MP4
  - Audio track extraction and transcription

## How It Works

1. When a user sends a message with an attachment, the attachment is detected by the supervisor agent.
2. The supervisor routes the message to the media analysis agent.
3. The media analysis agent determines the type of media and processes it using the appropriate tool:
   - Images are analyzed using GPT-4 Vision
   - PDFs are processed using PDFLoader
   - CSVs are processed using CSVLoader
   - Audio is transcribed using OpenAI Whisper
4. The results are added to the agent context and can be used by other agents.
5. The supervisor agent incorporates the media analysis results into the final response.

## Configuration

The following environment variables can be configured for multimodal capabilities:

```
# Multimodal Configuration
MAX_FILE_SIZE_MB=10
MEDIA_STORAGE_PATH=/path/to/media/storage
ALLOWED_FILE_TYPES=pdf,csv,jpg,jpeg,png,mp3,mp4,wav
```

## Limitations

- Maximum file size: 10MB
- Some file types may require additional processing time
- Audio transcription accuracy depends on the quality of the audio
- Video processing is limited to audio track extraction and transcription

## Examples

### Image Analysis

When a user sends an image of a receipt, the AI Assistant can extract:
- Merchant name
- Date
- Total amount
- Line items

### Document Analysis

When a user sends a PDF of a financial statement, the AI Assistant can extract:
- Account information
- Transaction history
- Balance information

### Audio Analysis

When a user sends an audio recording, the AI Assistant can:
- Transcribe the audio
- Extract financial information from the transcript

## Future Improvements

- Support for more file types
- Improved accuracy for receipt and document analysis
- Better integration with other agents
- Caching of processed media to improve performance
