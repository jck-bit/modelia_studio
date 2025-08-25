import React from 'react';

interface ErrorMessageProps {
  error: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error }) => {
  if (!error) return null;

  return (
    <div
      className="p-4 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-xl"
      role="alert"
    >
      <p className="text-red-200">{error}</p>
    </div>
  );
};

export default ErrorMessage;
