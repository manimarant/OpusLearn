# 🚀 Ollama Setup Guide for Free AI Course Generation

## What is Ollama?

Ollama is a **completely free** local AI service that runs on your machine. It allows you to use powerful AI models without any API costs or internet dependency.

## 📋 Prerequisites

- macOS, Linux, or Windows
- At least 4GB RAM (8GB recommended)
- 2GB free disk space

## 🛠️ Installation

### macOS
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Windows
Download from: https://ollama.ai/download

## 🚀 Quick Start

1. **Start Ollama**
   ```bash
   ollama serve
   ```

2. **Download a Model** (choose one)
   ```bash
   # Fast and efficient (3B parameters)
   ollama pull llama3.2:3b
   
   # Great for programming courses (7B parameters)
   ollama pull codellama:7b
   
   # Balanced performance (7B parameters)
   ollama pull mistral:7b
   
   # Higher quality, slower (8B parameters)
   ollama pull llama3.2:8b
   ```

3. **Test the Installation**
   ```bash
   ollama run llama3.2:3b "Hello, how are you?"
   ```

## 🎯 Using with OpusLearn

1. **Start Ollama** (if not already running)
   ```bash
   ollama serve
   ```

2. **Start OpusLearn**
   ```bash
   npm run dev
   ```

3. **Generate Courses with AI**
   - Go to Course Builder
   - Click "AI Course Generator"
   - Enter your course prompt
   - Select your preferred model
   - Click "Generate Complete Course"

## 🔧 Available Models

| Model | Size | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| `llama3.2:3b` | 3B | ⚡ Fast | Good | Quick generation |
| `codellama:7b` | 7B | 🐌 Medium | Better | Programming courses |
| `mistral:7b` | 7B | 🐌 Medium | Better | General courses |
| `llama3.2:8b` | 8B | 🐌 Slow | Best | High-quality content |

## 💡 Tips

### For Programming Courses
- Use `codellama:7b` for technical content
- Include specific technologies in your prompt
- Example: "JavaScript for beginners with ES6, DOM manipulation, and modern web development"

### For General Courses
- Use `llama3.2:3b` for quick generation
- Use `mistral:7b` for better quality
- Be specific about your target audience

### Prompt Examples
```
"Create a comprehensive React course for beginners covering hooks, state management, and modern patterns"

"Design a Python data science course with pandas, numpy, and matplotlib for intermediate learners"

"Build a complete web development bootcamp covering HTML, CSS, JavaScript, and React"
```

## 🐛 Troubleshooting

### Ollama not starting
```bash
# Check if Ollama is running
ps aux | grep ollama

# Kill existing process
pkill ollama

# Start fresh
ollama serve
```

### Model not found
```bash
# List available models
ollama list

# Pull the model again
ollama pull llama3.2:3b
```

### Slow generation
- Use smaller models (3B instead of 7B/8B)
- Close other applications to free up RAM
- Consider upgrading your system RAM

### Connection refused
- Make sure Ollama is running: `ollama serve`
- Check if port 11434 is available
- Restart Ollama if needed

## 🔒 Security & Privacy

✅ **100% Local**: All AI processing happens on your machine
✅ **No Internet Required**: Works offline after model download
✅ **No Data Sharing**: Your prompts never leave your computer
✅ **Completely Free**: No API costs or usage limits

## 📊 Performance Comparison

| Service | Cost | Speed | Privacy | Quality |
|---------|------|-------|---------|---------|
| **Ollama** | 🆓 Free | ⚡ Fast | 🔒 Private | ⭐⭐⭐⭐ |
| OpenAI GPT-4 | 💰 $0.03/1K tokens | 🐌 Slow | ❌ Shared | ⭐⭐⭐⭐⭐ |
| Anthropic Claude | 💰 $0.015/1K tokens | 🐌 Slow | ❌ Shared | ⭐⭐⭐⭐⭐ |
| Google Gemini | 💰 $0.0005/1K tokens | ⚡ Fast | ❌ Shared | ⭐⭐⭐⭐ |

## 🎉 Ready to Go!

Once Ollama is installed and running, you can:

1. **Generate Complete Courses** with modules, chapters, assignments, quizzes, and discussions
2. **Create Course Content** with AI assistance
3. **Build Professional Courses** without any costs
4. **Work Offline** without internet dependency

Start creating amazing courses with free AI! 🚀 