# Matrix Finance - DeFi Yield Optimization Platform

A modern, high-performance decentralized finance web application built with React, TypeScript, and cutting-edge web technologies. This platform provides advanced yield optimization strategies and real-time DeFi analytics with an immersive 3D user interface.

## Features

### Core Functionality
- Real-time yield tracking and optimization
- Multi-chain wallet integration (Web3Modal)
- Interactive 3D data visualizations
- Advanced performance monitoring
- Comprehensive accessibility support
- Dark/light theme switching

### Technical Highlights
- Built with React 18 and TypeScript for type safety
- Vite for lightning-fast development and builds
- Three.js integration for 3D graphics and animations
- Zustand for state management
- Tailwind CSS for responsive styling
- Advanced caching and performance optimization

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. Clone the repository
```bash
git clone https://github.com/liquiditymax/pendle-pt-yt-contracts.git
cd polybets-monorepo/matrixwebsite
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open http://localhost:3000 in your browser

### Build for Production

```bash
npm run build
```

The optimized production build will be available in the `dist/` directory.

## Project Structure

```
src/
├── components/          # Reusable React components
│   ├── audio/          # Audio system components
│   ├── layout/         # Layout components (Navbar, Footer)
│   ├── three/          # 3D graphics components
│   └── ui/             # UI components (modals, forms, etc.)
├── pages/              # Page components
├── providers/          # React context providers
├── services/           # API clients and external services
├── store/              # Global state management
├── styles/             # Global CSS and theme definitions
├── utils/              # Utility functions and helpers
├── App.tsx            # Main application component
└── main.tsx           # Application entry point
```

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5.4+
- **Styling**: Tailwind CSS
- **3D Graphics**: Three.js with React Three Fiber
- **State Management**: Zustand
- **Web3 Integration**: Web3Modal, Wagmi
- **Animation**: Framer Motion
- **Development**: ESLint, Prettier

## Performance

The application is optimized for performance with:
- Bundle size: ~340KB total (gzipped)
- Build time: ~2.1 seconds
- Web Vitals compliance (FCP, LCP, CLS)
- Service worker caching
- Image optimization and lazy loading

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Mobile-first responsive design ensures compatibility across all device sizes.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

## License

This project is part of the Polybets monorepo. See the root directory for license information.

## Support

For questions and support, please open an issue in the GitHub repository.
