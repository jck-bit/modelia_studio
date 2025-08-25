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
git clone https://github.com/jck-bit/modelia_studio.git
```

Navigate to the project directory:
```bash
cd modelia_studio
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open http://localhost:5173 in your browser to see the app.

