import React, { useState, useCallback, useRef } from 'react';
import { getTextFromVideo } from '../../services/geminiService';
import { fileToBase64, getMimeType } from '../../utils/fileUtils';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { SectionContainer } from '../common/SectionContainer';
import { Feature, ALLOWED_VIDEO_TYPES, MAX_FILE_SIZE_MB, MAX_VIDEO_FILE_SIZE_MB_FOR_WARNING } from '../../constants';
import { UploadIcon, ClipboardDocumentIcon } from '../icons/Icons';

export const VideoToTextGenerator: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('Describe this video. If there is speech, provide a transcript.');
  const [generatedText, setGeneratedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fileWarning, setFileWarning] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileWarning(null); // Clear previous warning
      setError(null); // Clear previous error
      const mime = getMimeType(file, ALLOWED_VIDEO_TYPES);
      if (!mime) {
        setError(`Invalid file type. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}.`);
        setVideoFile(null);
        setVideoPreview(null);
        return;
      }
      if (file.size > MAX_VIDEO_FILE_SIZE_MB_FOR_WARNING * 1024 * 1024) {
          setFileWarning(`Warning: File size is large (>${MAX_VIDEO_FILE_SIZE_MB_FOR_WARNING}MB). Processing might be slow or fail due to browser/API limits, though the theoretical API limit is much higher. Max recommended for this interface: ${MAX_FILE_SIZE_MB}MB.`);
      } else if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
           setError(`Error: File exceeds maximum recommended size of ${MAX_FILE_SIZE_MB}MB for this interface. Please choose a smaller file.`);
           setVideoFile(null);
           setVideoPreview(null);
           return;
      }
      
      setVideoFile(file);
      setGeneratedText('');
      setCopySuccess('');

      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateText = useCallback(async () => {
    if (!videoFile) {
      setError('Please upload a video file first.');
      return;
    }
     if (!prompt.trim()) {
      setError('Please enter a prompt for the AI.');
      return;
    }

    setIsLoading(true);
    // setError(null); // Keep fileWarning if present
    setGeneratedText('');
    setCopySuccess('');

    try {
      const mimeType = getMimeType(videoFile, ALLOWED_VIDEO_TYPES);
      if (!mimeType) {
        const newError = "Invalid video MIME type. This should not happen if validation passed.";
        setError(newError);
        throw new Error(newError);
      }

      const base64Data = await fileToBase64(videoFile);
      const description = await getTextFromVideo(base64Data, mimeType, prompt);
      setGeneratedText(description);
      setError(null); // Clear any previous errors/warnings if successful
      setFileWarning(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during video processing.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [videoFile, prompt]);

  const triggerFileInput = () => {
    if (isLoading) return;
    fileInputRef.current?.click();
  };
  
  const copyToClipboard = async () => {
    if (!generatedText) return;
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopySuccess('Copied to clipboard!');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setCopySuccess('Failed to copy.');
      setTimeout(() => setCopySuccess(''), 2000);
    }
  };

  return (
    <SectionContainer title={Feature.VIDEO_TO_TEXT} className="animate-fadeIn">
      <div className="space-y-6">
         <div>
            <label htmlFor="video-upload-v2t" className="block text-sm font-medium text-themed-secondary mb-1">Upload Video File</label>
            <div 
              className={`mt-1 flex flex-col items-center justify-center px-6 py-8 border-2 border-themed-primary border-dashed rounded-xl transition-all duration-200 ease-in-out group ${isLoading ? 'cursor-default opacity-70' : 'cursor-pointer hover:border-[var(--color-accent-primary)] hover:bg-themed-input'}`}
              onClick={triggerFileInput}
              onDrop={(e) => { e.preventDefault(); if (isLoading) return; if (e.dataTransfer.files && e.dataTransfer.files[0]) { const mockEvent = { target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>; handleFileChange(mockEvent);}}}
              onDragOver={(e) => e.preventDefault()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') triggerFileInput();}}
              aria-label="Video upload area"
              aria-disabled={isLoading}
            >
              <UploadIcon className={`mx-auto h-10 w-10 text-themed-muted group-hover:text-[var(--color-accent-primary)] transition-colors ${isLoading ? '' : 'group-hover:animate-bounce'}`} />
              <div className="flex text-xs sm:text-sm text-themed-muted mt-2">
                 <p className="pl-1">
                  {videoFile ? videoFile.name : <><span className="font-semibold text-[var(--color-accent-primary)]">Click to upload</span> or drag & drop</>}
                </p>
              </div>
              <p className="text-xs text-themed-muted mt-1">{ALLOWED_VIDEO_TYPES.join(', ')} (Max {MAX_FILE_SIZE_MB}MB recommended)</p>
            </div>
            <input
              id="video-upload-v2t"
              name="video-upload"
              type="file"
              accept={ALLOWED_VIDEO_TYPES.join(',')}
              onChange={handleFileChange}
              className="sr-only"
              ref={fileInputRef}
              disabled={isLoading}
            />
        </div>

        {fileWarning && <p className="text-sm text-yellow-500 dark:text-yellow-400 bg-yellow-500/10 p-3 rounded-md">{fileWarning}</p>}

        {videoPreview && (
          <div className="mt-4 bg-themed-secondary p-2 rounded-lg shadow-md border border-themed-primary">
            <video controls src={videoPreview} className="max-h-72 w-auto mx-auto rounded" aria-label="Uploaded video preview">
              Your browser does not support the video tag.
            </video>
          </div>
        )}
        
        <div>
          <label htmlFor="video-analysis-prompt" className="block text-sm font-medium text-themed-secondary mb-1">Analysis Prompt</label>
          <textarea
            id="video-analysis-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Summarize this video. What are the key topics discussed?"
            className="w-full p-3 form-input rounded-lg text-sm sm:text-base"
            rows={3}
            disabled={isLoading}
            aria-label="Prompt for video analysis"
          />
        </div>

        <button
          onClick={handleGenerateText}
          disabled={isLoading || !videoFile || !prompt.trim()}
          className="w-full btn-primary font-semibold py-3 px-6 rounded-lg shadow-md flex items-center justify-center text-sm sm:text-base"
          aria-live="polite"
        >
          {isLoading ? <LoadingSpinner size="sm" /> : 'Analyze Video'}
        </button>

        {error && <ErrorMessage message={error} title="Video Analysis Failed" />}
        {isLoading && !error && <LoadingSpinner message="AI is watching your video... this might take a moment." />}

        {generatedText && (
          <div className="mt-6 p-4 bg-themed-secondary rounded-lg shadow-md border border-themed-primary">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-poppins text-md font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)]">AI Analysis:</h3>
              <button onClick={copyToClipboard} className="btn-secondary text-xs py-1 px-2 rounded flex items-center" aria-label="Copy generated text to clipboard">
                <ClipboardDocumentIcon className="w-4 h-4 mr-1"/> {copySuccess ? 'Copied!' : 'Copy'}
              </button>
            </div>
            {copySuccess && <p className="text-xs text-green-500 mb-2">{copySuccess}</p>}
            <p className="text-themed-primary whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{generatedText}</p>
          </div>
        )}
         {!isLoading && !error && !videoFile && (
          <p className="text-center text-themed-muted py-4">Upload a video and provide a prompt to get its summary or transcription.</p>
        )}
      </div>
    </SectionContainer>
  );
};
