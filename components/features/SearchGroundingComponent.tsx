import React, { useState, useCallback } from 'react';
import { generateContentWithGoogleSearch } from '../../services/geminiService';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { SectionContainer } from '../common/SectionContainer';
import { Feature } from '../../constants';
import { GroundingSource } from '../../types';
import { MagnifyingGlassIcon } from '../icons/Icons';

interface SearchResult {
  answer: string;
  sources: GroundingSource[];
}

export const SearchGroundingComponent: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setError('Please enter a question or topic to search.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSearchResult(null);
    try {
      const response = await generateContentWithGoogleSearch(query);
      const answer = response.text;
      const rawSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      
      let sources: GroundingSource[] = [];
      if (rawSources && Array.isArray(rawSources)) {
        sources = rawSources
          .map(chunk => chunk.web) // Extract the web object
          .filter(webSource => webSource && webSource.uri) // Filter out undefined or URI-less sources
          .map(webSource => ({
            uri: webSource.uri!, // Non-null assertion as we filtered
            title: webSource.title || webSource.uri!, // Use URI as fallback title
          }))
           // Deduplicate sources based on URI
          .filter((source, index, self) => 
            index === self.findIndex((s) => s.uri === source.uri)
          );
      }

      setSearchResult({ answer, sources });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during the search.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  return (
    <SectionContainer title={Feature.SEARCH_GROUNDING} className="animate-fadeIn">
      <div className="space-y-6">
        <div>
          <label htmlFor="search-query" className="block text-sm font-medium text-themed-secondary mb-1">Your Question or Topic</label>
          <div className="flex gap-2">
            <input
              id="search-query"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSearch()}
              placeholder="e.g., Who won the latest Nobel Peace Prize? What are symptoms of flu?"
              className="w-full p-3 form-input rounded-lg text-sm sm:text-base"
              disabled={isLoading}
              aria-label="Search query input"
            />
            <button
              onClick={handleSearch}
              disabled={isLoading || !query.trim()}
              className="btn-primary font-semibold py-3 px-4 rounded-lg shadow-md flex items-center justify-center text-sm sm:text-base"
              aria-live="polite"
            >
              <MagnifyingGlassIcon className="w-5 h-5 sm:mr-2" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>
        </div>

        {error && <ErrorMessage message={error} title="Search Failed"/>}
        {isLoading && !error && <LoadingSpinner message="Searching the web and formulating an answer..." />}

        {searchResult && (
          <div className="mt-6 p-4 bg-themed-secondary rounded-lg shadow-md border border-themed-primary">
            <h3 className="font-poppins text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] mb-3">AI Generated Answer:</h3>
            <p className="text-themed-primary whitespace-pre-wrap text-sm sm:text-base leading-relaxed mb-6">{searchResult.answer}</p>
            
            {searchResult.sources && searchResult.sources.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-themed-secondary mb-2">Sources:</h4>
                <ul className="list-disc list-inside space-y-1.5">
                  {searchResult.sources.map((source, index) => (
                    <li key={index} className="text-sm">
                      <a 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[var(--color-accent-primary)] hover:text-[var(--color-accent-secondary)] hover:underline"
                        title={source.title || source.uri}
                      >
                        {source.title || source.uri}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
             {searchResult.sources && searchResult.sources.length === 0 && (
                <p className="text-sm text-themed-muted">No specific web sources were cited for this answer.</p>
             )}
          </div>
        )}
        {!isLoading && !error && !searchResult && (
          <p className="text-center text-themed-muted py-4">Ask a question to get up-to-date information powered by Google Search.</p>
        )}
      </div>
    </SectionContainer>
  );
};
