import React from 'react';

const Header: React.FC = () => {
  return (
    <div className="mb-12">
      <nav className="text-white/70 mb-4 text-sm">
        <span>Home</span>
        <span className="mx-2">/</span>
        <span>AI Suite</span>
        <span className="mx-2">/</span>
        <span className="text-white">AI Image Generator</span>
      </nav>
      <h1 className="text-5xl font-bold text-white mb-4">AI Image Generator</h1>
      <p className="text-white/80 text-lg max-w-2xl">
        Try the ultimate Image Generator. Access the most advanced AI models and create AI images with just a prompt or an image reference.
      </p>
    </div>
  );
};

export default Header;
