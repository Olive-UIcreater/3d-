#!/bin/bash

# 3D Sound Sculpture - Installation Script
echo "🎵 Installing 3D Sound Sculpture - Envelope Module..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "❌ Node.js version 14 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create desktop shortcut (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🖥️  Creating desktop shortcut for macOS..."
    
    # Create app bundle
    mkdir -p "3D Sound Sculpture.app/Contents/MacOS"
    mkdir -p "3D Sound Sculpture.app/Contents/Resources"
    
    # Create Info.plist
    cat > "3D Sound Sculpture.app/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>3D Sound Sculpture</string>
    <key>CFBundleIdentifier</key>
    <string>com.3dsoundsculpture.app</string>
    <key>CFBundleName</key>
    <string>3D Sound Sculpture</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>CFBundleIconFile</key>
    <string>icon.icns</string>
</dict>
</plist>
EOF

    # Create launcher script
    cat > "3D Sound Sculpture.app/Contents/MacOS/3D Sound Sculpture" << EOF
#!/bin/bash
cd "\$(dirname "\$0")/../../.."
exec electron .
EOF

    chmod +x "3D Sound Sculpture.app/Contents/MacOS/3D Sound Sculpture"
    
    echo "✅ Desktop shortcut created!"
fi

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "🚀 To start the application:"
echo "   npm start"
echo ""
echo "🛠️  For development mode:"
echo "   npm run dev"
echo ""
echo "📦 To build the application:"
echo "   npm run build"
echo ""
echo "Enjoy your 3D Sound Sculpture! 🎵🎨"