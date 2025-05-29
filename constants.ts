import { FeatureDefinition } from './types';
import { ChatBubbleLeftRightIcon, MagnifyingGlassIcon, PhotoIcon, ChatBubbleBottomCenterTextIcon as TextFromMediaIcon } from './components/icons/Icons'; // Updated icon import

export const GEMINI_TEXT_MODEL = 'gemini-2.5-flash-preview-04-17';
export const GEMINI_IMAGE_GEN_MODEL = 'imagen-3.0-generate-002';
// export const GEMINI_PRO_VISION_MODEL = 'gemini-pro-vision'; // Example if needed for specific vision tasks

export enum Feature {
  TEXT_TO_IMAGE = 'Text to Image',
  IMAGE_TO_TEXT = 'Image to Text',
  VIDEO_TO_TEXT = 'Video to Text',
  CHAT_WITH_AI = 'Chat with AI',
  SEARCH_GROUNDING = 'Search & Answer',
}

export const ALL_FEATURES: FeatureDefinition[] = [
  { 
    id: 't2i', 
    name: Feature.TEXT_TO_IMAGE, 
    description: 'Generate stunning images from your text descriptions.',
    icon: PhotoIcon 
  },
  { 
    id: 'i2t', 
    name: Feature.IMAGE_TO_TEXT, 
    description: 'Get detailed text descriptions or analyses for your images.',
    icon: TextFromMediaIcon,
    requiresFileUpload: true
  },
  { 
    id: 'v2t', 
    name: Feature.VIDEO_TO_TEXT, 
    description: 'Transcribe speech or get summaries from your video files.',
    icon: TextFromMediaIcon, // Using the same icon for consistency for now
    requiresFileUpload: true
  },
  { 
    id: 'chat', 
    name: Feature.CHAT_WITH_AI, 
    description: 'Have a conversation with an advanced AI assistant.',
    icon: ChatBubbleLeftRightIcon 
  },
  { 
    id: 'search', 
    name: Feature.SEARCH_GROUNDING, 
    description: 'Ask questions about recent events or topics requiring web knowledge.',
    icon: MagnifyingGlassIcon
  },
];

export const MAX_FILE_SIZE_MB = 10; // Max file size in MB for uploads
export const MAX_VIDEO_FILE_SIZE_MB_FOR_WARNING = 50; // Larger videos might work but could be slow. Gemini API itself has higher limits (e.g., 2GB for some video operations via API directly but base64 encoding here is a bottleneck)
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']; // Added GIF
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mpeg', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-flv', 'video/3gpp', 'video/x-matroska']; // Expanded video types

export const MAX_IMAGES_GENERATION = 4;
