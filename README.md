# AI Studio

A React-based web application that simulates an AI image generation studio with a clean, accessible interface.

## Features

- **Image Upload**: Support for PNG/JPG files up to 10MB with automatic client-side downscaling
- **Prompt Input**: Text area for describing what you want to generate
- **Style Selection**: Choose from 5 different styles (Editorial, Streetwear, Vintage, Minimalist, Futuristic)
- **Live Preview**: Real-time preview of uploaded image with prompt and style
- **Mock Generation**: Simulated API with 1-2s delay and 20% error rate
- **Error Handling**: Automatic retry with exponential backoff (max 3 attempts)
- **Abort Functionality**: Cancel in-flight generation requests
- **History**: Last 5 generations saved in localStorage with click-to-restore
- **Accessibility**: Full keyboard navigation, ARIA labels, and visible focus states
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **React 19** with TypeScript (strict mode)
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **ESLint** and **Prettier** for code quality
- **PostCSS** with autoprefixer

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd modelia_studio
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
