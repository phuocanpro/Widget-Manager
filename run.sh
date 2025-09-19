#!/bin/bash

echo "🚀 Starting Client Widget Manager Setup..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your database credentials!"
    echo "   Edit .env file and update:"
    echo "   - DB_PASSWORD=your_postgres_password"
    echo "   - JWT_SECRET=your_jwt_secret_key"
    echo ""
    read -p "Press Enter after updating .env file..."
fi

# Setup database
echo "🗄️  Setting up database..."
npm run setup-db

# Start the application
echo "🎉 Starting application..."
echo "   Frontend: http://localhost:3001"
echo "   API: http://localhost:3001/api"
echo "   Health: http://localhost:3001/health"
echo ""

npm run dev
