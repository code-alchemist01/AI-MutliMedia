import React, { useState, useCallback, useEffect } from 'react';
import { Feature, ALL_FEATURES } from './constants';
import { TextToImageGenerator } from './components/features/TextToImageGenerator';
import { ImageToTextGenerator } from './components/features/ImageToTextGenerator';
import { VideoToTextGenerator } from './components/features/VideoToTextGenerator';
import { ChatComponent } from './components/features/ChatComponent';
import { SearchGroundingComponent } from './components/features/SearchGroundingComponent';
import { SparklesIcon, SunIcon, MoonIcon } from './components/icons/Icons';

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>(ALL_FEATURES[0].name);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const renderFeatureComponent = useCallback(() => {
    switch (activeFeature) {
      case Feature.TEXT_TO_IMAGE:
        return <TextToImageGenerator />;
      case Feature.IMAGE_TO_TEXT:
        return <ImageToTextGenerator />;
      case Feature.VIDEO_TO_TEXT:
        return <VideoToTextGenerator />;
      case Feature.CHAT_WITH_AI:
        return <ChatComponent />;
      case Feature.SEARCH_GROUNDING:
        return <SearchGroundingComponent />;
      default:
        if (ALL_FEATURES.length > 0 && !ALL_FEATURES.find(f => f.name === activeFeature)) {
          setActiveFeature(ALL_FEATURES[0].name);
          return null; 
        }
        return <TextToImageGenerator />;
    }
  }, [activeFeature]);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 bg-themed-primary text-themed-primary transition-colors duration-300">
      <header className="w-full max-w-6xl mb-8 sm:mb-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <SparklesIcon className="w-10 h-10 sm:w-14 sm:h-14 text-[var(--color-accent-primary)] mr-2 sm:mr-3 animate-subtle-sparkle-pulse" />
            <h1 className="text-3xl sm:text-5xl font-poppins font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-accent-primary)] via-[var(--color-accent-secondary)] to-[var(--color-accent-tertiary)]">
              AI Multimedia Studio Pro
            </h1>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
          </button>
        </div>
        <p className="text-themed-muted text-md sm:text-lg mt-1 sm:mt-2">Explore the frontiers of generative AI with enhanced tools.</p>
      </header>

      <nav className="w-full max-w-4xl mb-8 sm:mb-10 bg-themed-card/70 backdrop-blur-lg shadow-xl rounded-xl p-2 sm:p-2.5 border border-themed-primary">
        <ul className="flex flex-wrap justify-center gap-2 sm:gap-2.5">
          {ALL_FEATURES.map((featureItem) => (
            <li key={featureItem.id} className="flex-grow xs:flex-grow-0">
              <button
                onClick={() => setActiveFeature(featureItem.name)}
                className={`nav-button group w-full flex items-center justify-center px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium rounded-lg 
                  ${activeFeature === featureItem.name ? 'active' : '' }`}
                aria-current={activeFeature === featureItem.name ? "page" : undefined}
              >
                {featureItem.icon && <featureItem.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 group-hover:text-[var(--color-accent-primary)] transition-colors" />}
                {featureItem.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <main className="w-full max-w-5xl flex-grow">
        {renderFeatureComponent()}
      </main>
      
      <footer className="w-full max-w-5xl mt-12 sm:mt-16 py-6 border-t border-themed-primary text-center text-themed-muted text-xs sm:text-sm">
        <p>&copy; {new Date().getFullYear()} AI Multimedia Studio Pro. All rights reserved.</p>
        <p className="mt-1">Ensure <code className="bg-themed-input px-1.5 py-0.5 rounded text-themed-secondary text-xs">API_KEY</code> is set for Gemini API access.</p>
      </footer>
    </div>
  );
};

export default App;
