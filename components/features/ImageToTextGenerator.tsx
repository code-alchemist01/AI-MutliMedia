import React, { useState, useCallback, useRef } from 'react';
import { getTextFromImage } from '../../services/geminiService';
import { fileToBase64, getMimeType } from '../../utils/fileUtils';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { SectionContainer } from '../common/SectionContainer';
import { Feature, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_MB } from '../../constants';
import { UploadIcon, ClipboardDocumentIcon } from '../icons/Icons';

export const ImageToTextGenerator: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('Describe this image in detail.');
  const [generatedText, setGeneratedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const mime = getMimeType(file, ALLOWED_IMAGE_TYPES);
      if (!mime) {
        setError(`Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}.`);
        setImageFile(null);
        setImagePreview(null);
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          setError(`File is too large. Max size: ${MAX_FILE_SIZE_MB}MB.`);
          setImageFile(null);
          setImagePreview(null);
          return;
      }
      setImageFile(file);
      setError(null);
      setGeneratedText(''); 
      setCopySuccess('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateText = useCallback(async () => {
    if (!imageFile) {
      setError('Please upload an image file first.');
      return;
    }
    if (!prompt.trim()) {
      setError('Please enter a prompt for the AI.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedText('');
    setCopySuccess('');

    try {
      const mimeType = getMimeType(imageFile, ALLOWED_IMAGE_TYPES);
      if (!mimeType) throw new Error("Invalid image MIME type. This should not happen if validation passed.");

      const base64Data = await fileToBase64(imageFile);
      const description = await getTextFromImage(base64Data, mimeType, prompt);
      setGeneratedText(description);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred while analyzing the image.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, prompt]);
  
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
    <SectionContainer title={Feature.IMAGE_TO_TEXT} className="animate-fadeIn">
      <div className="space-y-6">
        <div>
            <label htmlFor="image-upload-i2t" className="block text-sm font-medium text-themed-secondary mb-1">Upload Image File</label>
            <div 
              className={`mt-1 flex flex-col items-center justify-center px-6 py-8 border-2 border-themed-primary border-dashed rounded-xl transition-all duration-200 ease-in-out group ${isLoading ? 'cursor-default opacity-70' : 'cursor-pointer hover:border-[var(--color-accent-primary)] hover:bg-themed-input'}`}
              onClick={triggerFileInput}
              onDrop={(e) => { e.preventDefault(); if (isLoading) return; if (e.dataTransfer.files && e.dataTransfer.files[0]) { const mockEvent = { target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>; handleFileChange(mockEvent);}}}
              onDragOver={(e) => e.preventDefault()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') triggerFileInput();}}
              aria-label="Image upload area"
              aria-disabled={isLoading}
            >
              <UploadIcon className={`mx-auto h-10 w-10 text-themed-muted group-hover:text-[var(--color-accent-primary)] transition-colors ${isLoading ? '' : 'group-hover:animate-bounce'}`} />
              <div className="flex text-xs sm:text-sm text-themed-muted mt-2">
                <p className="pl-1">
                  {imageFile ? imageFile.name : <><span className="font-semibold text-[var(--color-accent-primary)]">Click to upload</span> or drag & drop</>}
                </p>
              </div>
              <p className="text-xs text-themed-muted mt-1">{ALLOWED_IMAGE_TYPES.join(', ')} (Max {MAX_FILE_SIZE_MB}MB)</p>
            </div>
            <input
              id="image-upload-i2t"
              name="image-upload"
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(',')}
              onChange={handleFileChange}
              className="sr-only"
              ref={fileInputRef}
              disabled={isLoading}
            />
        </div>

        {imagePreview && (
          <div className="mt-4 bg-themed-secondary p-2 rounded-lg shadow-md border border-themed-primary">
            <img src={imagePreview} alt="Uploaded preview" className="max-h-60 w-auto mx-auto rounded" />
          </div>
        )}
        
        <div>
          <label htmlFor="image-analysis-prompt" className="block text-sm font-medium text-themed-secondary mb-1">Analysis Prompt</label>
          <textarea
            id="image-analysis-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., What objects are in this image? What style is it?"
            className="w-full p-3 form-input rounded-lg text-sm sm:text-base"
            rows={2}
            disabled={isLoading}
            aria-label="Prompt for image analysis"
          />
        </div>

        <button
          onClick={handleGenerateText}
          disabled={isLoading || !imageFile || !prompt.trim()}
          className="w-full btn-primary font-semibold py-3 px-6 rounded-lg shadow-md flex items-center justify-center text-sm sm:text-base"
          aria-live="polite"
        >
          {isLoading ? <LoadingSpinner size="sm" /> : 'Analyze Image'}
        </button>

        {error && <ErrorMessage message={error} title="Image Analysis Failed"/>}
        {isLoading && !error && <LoadingSpinner message="AI is inspecting the pixels..." />}

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
         {!isLoading && !error && !imageFile && (
          <p className="text-center text-themed-muted py-4">Upload an image and provide a prompt to get its description or analysis.</p>
        )}
      </div>
    </SectionContainer>
  );
};
