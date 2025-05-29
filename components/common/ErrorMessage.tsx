import React from 'react';
import { SparklesIcon } from '../icons/Icons'; // Using a generic icon for now or could be specific error icon

interface ErrorMessageProps {
  message: string;
  title?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, title = "An Error Occurred" }) => {
  if (!message) return null;
  return (
    <div className="bg-red-500/10 border-l-4 border-red-500 text-red-300 dark:text-red-400 p-4 rounded-md my-4 shadow-md" role="alert">
      <div className="flex items-center">
        {/* Optional: Error Icon */}
        {/* <SparklesIcon className="h-6 w-6 text-red-500 mr-3" /> */}
        <div>
          <p className="font-bold text-red-400 dark:text-red-500">{title}</p>
          <p className="text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
};
