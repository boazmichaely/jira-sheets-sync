#!/bin/bash

echo "🔐 Red Hat Credentials Setup"
echo "=============================="
echo ""

if [ -f "credentials.py" ]; then
    echo "⚠️  credentials.py already exists!"
    read -p "Do you want to overwrite it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing credentials.py"
        exit 0
    fi
fi

# Copy template
cp credentials_template.py credentials.py
echo "✅ Created credentials.py from template"
echo ""
echo "📝 Next steps:"
echo "1. Edit credentials.py and add your password"
echo "2. Run: python test_api.py"
echo ""
echo "Opening credentials.py in default editor..."
sleep 1

# Try to open in editor
if command -v code &> /dev/null; then
    code credentials.py
elif command -v nano &> /dev/null; then
    nano credentials.py
else
    open -t credentials.py
fi

