# Matrix Finance - DeFi Yield Optimization Platform

A modern React application for DeFi yield optimization with a Matrix-themed interface.

## 🚀 Quick Start

The application is currently running at: **http://localhost:3001/**

### For macOS Users - Step by Step Setup

If the terminal command isn't working, follow these steps:

1. **Check if Node.js is installed:**
```bash
node --version
npm --version
```
If not installed, download from [nodejs.org](https://nodejs.org/)

2. **Navigate to the correct directory:**
```bash
# Navigate to the browser folder
cd /Users/$(whoami)/Desktop/polybets-monorepo/.github/browser

# Verify you're in the right place - you should see package.json
ls -la
```

3. **You're already in the right directory!** 
Notice your terminal prompt shows `browser %` - this means you're already in the browser folder. **Don't run `cd .github/browser` again.**

4. **Install dependencies (if needed):**
```bash
npm install
```

5. **Start the development server:**
```bash
npm run dev
```

**Since you're already in the browser directory, just run:**
```bash
npm run dev
```

### Alternative Access Methods

**The app is already running!** You can access it directly:

1. **Direct Browser Access**: Open http://localhost:3001/ in your browser
2. **macOS Open Command**: `open http://localhost:3001/`
3. **VSCode Terminal**: The app is currently running in VSCode's integrated terminal

### Troubleshooting for macOS

If you get "command not found" errors:

```bash
# Check if you're in the right directory
ls -la
# You should see: package.json, src/, index.html

# If npm command fails, try:
which npm
# If nothing appears, Node.js isn't installed

# If permission errors:
sudo npm install -g npm
```

## 📱 Application Features

### Pages
- **Home** - Hero section with Matrix theme and feature highlights
- **Dashboard** - Portfolio overview with stats and recent activity
- **Vaults** - Yield vault listings with APY rates and risk indicators
- **FAQ** - Interactive FAQ with DeFi information
- **Login** - Wallet connection interface

### Navigation
- Click the "MATRIX FINANCE" logo to return to home
- Use navigation buttons to switch between pages
- All pages are interconnected with proper state management

## 🎨 Design Features

- **Matrix/Cyberpunk Theme** - Green matrix colors with futuristic styling
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Interactive Elements** - Hover effects and smooth animations
- **Professional Layout** - Clean, modern DeFi platform interface

## 🛠 Technical Stack

- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Responsive Design** with mobile-first approach

## 🔧 Development

### Project Structure
```
.github/browser/
├── src/
│   ├── pages/          # Main application pages
│   ├── components/     # Reusable UI components
│   ├── store/         # State management
│   ├── styles/        # Global styles
│   └── utils/         # Utility functions
├── index.html         # Entry point
└── package.json       # Dependencies
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌐 Accessing the Application

**Current Status**: ✅ Running on http://localhost:3001/

If the port changes, check the terminal output for the correct URL.

## 📋 Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## 🎯 Usage Instructions

1. **Navigate** to http://localhost:3001/
2. **Explore** different pages using the navigation
3. **Test** interactive elements like FAQ accordions
4. **Simulate** wallet connection on the Login page
5. **View** responsive design by resizing your browser

The application is fully functional with all pages working correctly!
