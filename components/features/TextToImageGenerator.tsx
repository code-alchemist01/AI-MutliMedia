import React, { useState, useCallback } from 'react';
import { generateImageFromText } from '../../services/geminiService';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { SectionContainer } from '../common/SectionContainer';
import { Feature, MAX_IMAGES_GENERATION } from '../../constants';
import { DownloadIcon, PhotoIcon } from '../icons/Icons';

export const TextToImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [numberOfImages, setNumberOfImages] = useState<number>(1);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateImage = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt to inspire the AI.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);
    try {
      const images = await generateImageFromText(prompt, numberOfImages);
      if (images.length > 0) {
        setGeneratedImages(images);
      } else {
        setError('No images were generated. Try a different prompt or settings.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during image generation.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, numberOfImages]);

  const handleDownloadImage = (base64Image: string, index: number) => {
    const link = document.createElement('a');
    link.href = `data:image/jpeg;base64,${base64Image}`;
    link.download = `generated_image_${prompt.substring(0,20).replace(/\s+/g, '_')}_${index + 1}.jpeg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SectionContainer title={Feature.TEXT_TO_IMAGE} className="animate-fadeIn">
      <div className="space-y-6">
        <div>
          <label htmlFor="image-prompt" className="block text-sm font-medium text-themed-secondary mb-1">Your Creative Prompt</label>
          <textarea
            id="image-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A futuristic cityscape at sunset with flying cars, cinematic lighting"
            className="w-full p-3 form-input rounded-lg min-h-[100px] text-sm sm:text-base"
            rows={3}
            disabled={isLoading}
            aria-label="Text prompt for image generation"
          />
        </div>

        <div>
          <label htmlFor="num-images" className="block text-sm font-medium text-themed-secondary mb-1">Number of Images (1-{MAX_IMAGES_GENERATION})</label>
          <select
            id="num-images"
            value={numberOfImages}
            onChange={(e) => setNumberOfImages(parseInt(e.target.value, 10))}
            disabled={isLoading}
            className="w-full sm:w-auto p-3 form-input rounded-lg text-sm sm:text-base"
            aria-label="Number of images to generate"
          >
            {Array.from({ length: MAX_IMAGES_GENERATION }, (_, i) => i + 1).map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
        
        <button
          onClick={handleGenerateImage}
          disabled={isLoading || !prompt.trim()}
          className="w-full btn-primary font-semibold py-3 px-6 rounded-lg shadow-md flex items-center justify-center text-sm sm:text-base"
          aria-live="polite"
        >
          {isLoading ? <LoadingSpinner size="sm" /> : <><PhotoIcon className="w-5 h-5 mr-2" /> Generate Images</>}
        </button>

        {error && <ErrorMessage message={error} title="Image Generation Failed" />}
        {isLoading && !error && <LoadingSpinner message="AI is painting your vision..." />}

        {generatedImages.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-themed-primary mb-4">Generated Masterpieces:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {generatedImages.map((base64Image, index) => (
                <div key={index} className="bg-themed-secondary p-2 rounded-lg shadow-lg border border-themed-primary group relative">
                  <img
                    src={`data:image/jpeg;base64,${base64Image}`}
                    alt={`Generated art ${index + 1} from prompt`}
                    className="w-full h-auto object-contain rounded-md"
                    loading="lazy"
                  />
                  <button
                    onClick={() => handleDownloadImage(base64Image, index)}
                    className="absolute top-2 right-2 bg-[var(--color-accent-primary)]/80 hover:bg-[var(--color-accent-primary)] text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    aria-label={`Download image ${index + 1}`}
                  >
                    <DownloadIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
         {!isLoading && !error && generatedImages.length === 0 && !prompt && (
          <p className="text-center text-themed-muted py-4">Enter a prompt above and let the AI create unique images for you!</p>
        )}
      </div>
    </SectionContainer>
  );
};
