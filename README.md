# 🎬 Emotional Storyboard Generator for Filmmakers

An AI-powered web application that transforms film scripts into emotionally expressive storyboards using Natural Language Processing and Stable Diffusion.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

### 🎭 AI Emotion Detection
- **Scene-wise Analysis**: Automatically analyzes each scene in your script
- **Advanced NLP**: Uses Hugging Face Transformers (BERT, RoBERTa) for emotion classification
- **High Accuracy**: Confidence scoring for each emotion detection
- **Fallback Systems**: Multiple layers of emotion detection for reliability

### 🖼️ AI-Generated Visuals
- **Stable Diffusion Integration**: Creates stunning visual representations
- **Emotion-Matched Styling**: Each frame reflects the scene's emotional tone
- **Professional Quality**: Film-industry standard aspect ratios and composition
- **Customizable Generation**: Regenerate individual frames with custom prompts

### 📝 Script Processing
- **Multiple Formats**: Supports .txt and .fountain screenplay formats
- **Intelligent Parsing**: Automatically identifies scene breaks and dialogue
- **Large File Support**: Handles scripts up to 5MB
- **Secure Upload**: Server-side validation and processing

### 🎛️ Interactive Storyboard Editor
- **Drag & Drop Reordering**: Rearrange frames with beautiful animations
- **Individual Frame Regeneration**: Regenerate specific frames that need adjustment
- **Real-time Updates**: Live preview of changes
- **Responsive Design**: Works seamlessly on desktop and mobile

### 💾 Project Management
- **SQLite Database**: Reliable local storage for all projects
- **Version History**: Track changes and iterations
- **Project Analytics**: Emotion distribution and frame statistics
- **Export Capabilities**: Download storyboards for production use

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js framework
- **SQLite** database with custom migration system
- **Hugging Face Transformers** for emotion analysis
- **Stable Diffusion** for image generation
- **Multer** for file upload handling

### Frontend
- **React 18** with modern hooks and patterns
- **React Router** for navigation
- **Framer Motion** for animations
- **React Beautiful DnD** for drag-and-drop functionality
- **Axios** for API communication
- **React Hot Toast** for notifications

### AI/ML Services
- **Hugging Face Inference API** for emotion detection
- **Stable Diffusion XL** for high-quality image generation
- **Custom emotion mapping** for visual style adaptation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Hugging Face API key (free account available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/film-storyboard-ai.git
   cd film-storyboard-ai
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Hugging Face API key:
   ```env
   HUGGINGFACE_API_KEY=hf_your_api_key_here
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

This will start:
- Backend server on `http://localhost:5000`
- Frontend development server on `http://localhost:3000`

### Getting a Hugging Face API Key

1. Go to [Hugging Face](https://huggingface.co)
2. Create a free account
3. Go to Settings → Access Tokens
4. Create a new token with "Read" permissions
5. Copy the token to your `.env` file

## 📋 Usage Guide

### 1. Upload Your Script
- Click "Upload Your Script" on the home page
- Drag and drop a `.txt` or `.fountain` file
- Enter a project title
- Click "Analyze Script"

### 2. Generate Storyboard
- After analysis, click "Generate Storyboard"
- Wait for AI to create visual frames for each scene
- View the emotion-based storyboard

### 3. Edit and Refine
- **Rearrange frames**: Enable "Rearrange" mode and drag frames
- **Regenerate frames**: Click the refresh icon on any frame
- **View details**: See emotion confidence and scene content

### 4. Export and Share
- Download individual frames or complete storyboards
- Share projects with team members
- Use in pre-production planning

## 🎨 Emotion Categories

The AI detects and visualizes these emotions:

| Emotion | Visual Style | Use Cases |
|---------|-------------|-----------|
| **Happy** | Bright, warm colors, golden lighting | Comedy, celebration scenes |
| **Sad** | Cool tones, soft lighting, muted palette | Drama, emotional moments |
| **Angry** | Intense reds, sharp contrasts | Conflict, action scenes |
| **Fearful** | Dark shadows, eerie atmosphere | Horror, suspense |
| **Romantic** | Warm golden tones, soft focus | Love scenes, intimate moments |
| **Dramatic** | Bold composition, strong contrasts | Climactic moments |
| **Mysterious** | Shadows, silhouettes, noir style | Thrillers, mysteries |

## 📁 Project Structure

```
film-storyboard-ai/
├── backend/                 # Node.js Express server
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── services/           # Core services
│   │   ├── emotionService.js    # AI emotion detection
│   │   ├── imageService.js      # Stable Diffusion integration
│   │   └── databaseService.js   # Database operations
│   └── server.js           # Main server file
├── frontend/               # React application
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Route components
│   │   ├── services/       # API services
│   │   └── hooks/          # Custom React hooks
├── uploads/                # Uploaded script files
├── generated_images/       # AI-generated storyboard frames
└── database.sqlite         # SQLite database
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `HUGGINGFACE_API_KEY` | Hugging Face API key | Required |
| `CORS_ORIGIN` | Frontend URL for CORS | `http://localhost:3000` |

### Database Schema

The application uses SQLite with the following main tables:

- **projects**: Store script information and metadata
- **scenes**: Individual script scenes with emotion analysis
- **storyboard_frames**: Generated visual frames with image URLs
- **user_preferences**: Application settings

## 🚀 Deployment

### Production Build

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Set production environment**
   ```bash
   export NODE_ENV=production
   ```

3. **Start the production server**
   ```bash
   npm start
   ```

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔍 API Documentation

### Script Upload
```http
POST /api/upload-script
Content-Type: multipart/form-data

{
  "script": file,
  "title": "Project Title"
}
```

### Generate Storyboard
```http
POST /api/generate-storyboard/:projectId
```

### Get Storyboard Frames
```http
GET /api/storyboards/project/:projectId
```

### Regenerate Frame
```http
POST /api/storyboards/frame/:frameId/regenerate
{
  "customPrompt": "optional custom prompt"
}
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Hugging Face** for providing excellent NLP models and inference API
- **Stability AI** for Stable Diffusion image generation
- **React Beautiful DnD** for smooth drag-and-drop functionality
- **Framer Motion** for beautiful animations
- **Film Industry** for inspiration and feedback

## 📞 Support

- 📧 Email: support@filmstoryboardai.com
- 💬 Discord: [Join our community](https://discord.gg/filmstoryboardai)
- 📖 Documentation: [Read the docs](https://docs.filmstoryboardai.com)
- 🐛 Issues: [Report bugs](https://github.com/your-username/film-storyboard-ai/issues)

## 🔮 Roadmap

- [ ] **Advanced Emotion Detection**: Custom fine-tuned models for film scripts
- [ ] **Video Generation**: Convert storyboards to animated previews
- [ ] **Collaboration Tools**: Real-time editing with team members
- [ ] **Integration APIs**: Connect with popular screenwriting software
- [ ] **Cloud Storage**: Optional cloud backup and sync
- [ ] **Mobile App**: Native iOS and Android applications

---

**Made with ❤️ for the film community**

Transform your scripts into visual stories with the power of AI!