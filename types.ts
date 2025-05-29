import { Feature } from './constants';

export interface FeatureDefinition {
  id: string;
  name: Feature;
  description: string;
  icon?: React.FC<{ className?: string }>; // Optional: For specific icons per feature
  requiresFileUpload?: boolean; // To conditionally show certain UI elements
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  sources?: GroundingSource[]; // Optional for search grounding in chat
}

export interface GroundingSource {
  uri: string;
  title: string;
}
