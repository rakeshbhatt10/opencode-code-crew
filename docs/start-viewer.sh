#!/bin/bash

# Documentation Viewer Startup Script (VitePress)

echo "🚀 Starting Multi-Agent System Documentation Viewer..."
echo ""

# Check if Node.js is available
if command -v node &> /dev/null; then
    echo "✓ Using VitePress (Node.js)"
    echo "📖 Documentation will be available at: http://localhost:5173"
    echo "🛑 Press Ctrl+C to stop the server"
    echo ""
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install
        echo ""
    fi
    
    # Start VitePress dev server
    npm run dev
    
# Fallback to Python
elif command -v python3 &> /dev/null; then
    echo "⚠️  Node.js not found, using Python fallback"
    echo "   (For best experience, install Node.js and run: npm install && npm run dev)"
    echo ""
    echo "✓ Using Python 3 HTTP server"
    echo "📖 Documentation will be available at: http://localhost:3000"
    echo "   (Note: This serves static files only, no hot reload)"
    echo "🛑 Press Ctrl+C to stop the server"
    echo ""
    python3 -m http.server 3000
    
# Fallback to PHP
elif command -v php &> /dev/null; then
    echo "⚠️  Node.js not found, using PHP fallback"
    echo "   (For best experience, install Node.js and run: npm install && npm run dev)"
    echo ""
    echo "✓ Using PHP built-in server"
    echo "📖 Documentation will be available at: http://localhost:3000"
    echo "   (Note: This serves static files only, no hot reload)"
    echo "🛑 Press Ctrl+C to stop the server"
    echo ""
    php -S localhost:3000
    
else
    echo "❌ Error: No suitable server found"
    echo ""
    echo "Please install Node.js to use VitePress:"
    echo "  - macOS: brew install node"
    echo "  - Ubuntu: sudo apt install nodejs npm"
    echo "  - Windows: Download from https://nodejs.org"
    echo ""
    echo "Or install Python 3 or PHP for a basic fallback"
    exit 1
fi
