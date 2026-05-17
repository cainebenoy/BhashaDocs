# 🌍 BhashaDocs - Real-Time PDF Translation to Indian Languages

> **Translate PDFs instantly to 22+ Indian languages with AI-powered streaming translation**

## 🚀 Live Demo

**Frontend:** [https://bhasha-docs.vercel.app/](https://bhasha-docs.vercel.app/)  
**Backend API:** [Hugging Face Spaces](https://huggingface.co/spaces)

---

## 🏗️ Architecture

A modern full-stack application with real-time streaming translation:

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js Frontend (Vercel)                                  │
│  • React 19 + Tailwind CSS                                  │
│  • Framer Motion animations                                 │
│  • Real-time streaming UI                                   │
└──────────────┬──────────────────────────────────────────────┘
               │ HTTP POST (multipart/form-data)
               │ PDF file + target language
               ▼
┌─────────────────────────────────────────────────────────────┐
│  FastAPI Backend (Hugging Face Spaces / Docker)             │
│  • PDF text extraction (PyPDF2)                             │
│  • Sentence chunking & processing                           │
│  • AI-powered translation (IndicTrans2)                     │
└──────────────┬──────────────────────────────────────────────┘
               │ Server-Sent Events (SSE)
               │ Streaming JSON chunks
               ▼
┌─────────────────────────────────────────────────────────────┐
│  AI Model (IndicTrans2 1.1B)                               │
│  • AI4Bharat's state-of-the-art translation model          │
│  • Support for 22 Indian languages                          │
│  • GPU/CPU optimized inference                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Features

- **Streaming Architecture**: Real-time translation results as they're processed, not after completion
- **CORS-Enabled**: Secure cross-origin communication between Vercel frontend and Hugging Face backend
- **Cloud-Optimized Headers**: `X-Accel-Buffering: no` prevents CDN/proxy buffering for smooth streaming
- **Scalable PDF Processing**: Handles multi-page documents with intelligent chunking

---

## 💻 Tech Stack

### Frontend
- **[Next.js](https://nextjs.org/)** 16.2.6 - React framework with SSR/SSG
- **[React](https://react.dev/)** 19.2.4 - UI library
- **[Tailwind CSS](https://tailwindcss.com/)** 4 - Utility-first styling
- **[Framer Motion](https://www.framer.com/motion/)** - Smooth animations
- **[Lucide React](https://lucide.dev/)** - Beautiful icon library
- **TypeScript** 5 - Type-safe JavaScript

### Backend
- **[FastAPI](https://fastapi.tiangolo.com/)** - Modern Python API framework
- **[uvicorn](https://www.uvicorn.org/)** - ASGI server
- **[PyPDF2](https://github.com/py-pdf/PyPDF2)** - PDF text extraction
- **[Torch](https://pytorch.org/)** - Deep learning framework
- **[Transformers](https://huggingface.co/transformers/)** - State-of-the-art NLP models
- **[IndicTransToolkit](https://github.com/AI4Bharat/IndicTransToolkit)** - Indic text processing

### AI Model
- **[IndicTrans2 1.1B](https://huggingface.co/ai4bharat/indictrans2-en-indic-1B)** by AI4Bharat
  - Encoder-Decoder Seq2Seq architecture
  - Supports 22 Indian languages
  - 1.1 billion parameters (optimized for production)
  - GPU or CPU inference support

### Infrastructure
- **[Docker](https://www.docker.com/)** - Containerization for consistent deployment
- **[Hugging Face Spaces](https://huggingface.co/spaces)** - Serverless backend hosting
- **[Vercel](https://vercel.com/)** - Optimized Next.js deployment

---

## 📋 Supported Languages

BhashaDocs translates from **English to 22+ Indian languages**:

- Assamese (অসমীয়া)
- Bengali (বাংলা)
- Bodo (बड़ो)
- Dogri (डोगरी)
- Gujarati (ગુજરાતી)
- Hindi (हिन्दी)
- Kannada (ಕನ್ನಡ)
- Kashmiri (کٲشُر)
- Konkani (कोंकणी)
- Maithili (मैथिली)
- Malayalam (മലയാളം)
- Manipuri (মৈতৈলোন্)
- Marathi (मराठी)
- Nepali (नेपाली)
- Odia (ଓଡ଼ିଆ)
- Punjabi (ਪੰਜਾਬੀ)
- Sanskrit (संस्कृतम्)
- Santali (ᱥᱟᱱᱛᱟᱲᱤ)
- Sindhi (سنڌي)
- Tamil (தமிழ்)
- Telugu (తెలుగు)
- Urdu (اردو)

---

## 🚀 Quick Start

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# API available at http://localhost:8000
```

### Docker Deployment (Hugging Face Spaces)
```bash
cd backend
docker build -t bhasha-docs .
# Deploy to Hugging Face Spaces for production
```

---

## 📡 API Endpoints

### POST `/api/translate-doc`
Translate a PDF document to a target Indian language with real-time streaming.

**Request:**
```bash
curl -X POST http://localhost:8000/api/translate-doc \
  -F "file=@document.pdf" \
  -F "target_language=hin_Deva"
```

**Response (Server-Sent Events):**
```json
{"original": "Hello", "translated": "नमस्ते"}
{"original": "How are you?", "translated": "आप कैसे हैं?"}
```

---

## 🎨 UI Highlights

- **Dynamic Theme System**: Each language has a unique color theme
- **Real-time Feedback**: Watch translations appear as they're processed
- **Smooth Animations**: Powered by Framer Motion for delightful UX
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Accessibility**: Semantic HTML and ARIA labels

---

## 🛠️ Project Structure

```
BhashaDocs/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Main upload & translation UI
│   │   │   ├── layout.tsx        # Layout wrapper
│   │   │   └── globals.css       # Global styles
│   │   └── ...
│   ├── package.json              # Frontend dependencies
│   ├── next.config.ts            # Next.js configuration
│   └── tsconfig.json             # TypeScript config
│
├── backend/
│   ├── main.py                   # FastAPI application
│   ├── translator.py             # IndicTrans2 integration & streaming
│   ├── utils.py                  # PDF extraction utilities
│   ├── requirements.txt          # Python dependencies
│   ├── Dockerfile                # Docker configuration
│   └── temp_uploads/             # Temporary storage for uploads
│
└── README.md                      # This file
```

---

## 🔄 How It Works

1. **Upload**: User uploads a PDF and selects a target language
2. **Extract**: Backend extracts text from PDF using PyPDF2
3. **Chunk**: Text is split into intelligent sentence chunks
4. **Translate**: Each chunk is translated using IndicTrans2 model
5. **Stream**: Translations are sent back in real-time via Server-Sent Events
6. **Display**: Frontend renders translations as they arrive with smooth animations

---

## 🎯 Performance Optimizations

- **Streaming Response**: Reduces perceived latency by sending results incrementally
- **Smart Chunking**: Sentence-level splits for accurate translation
- **CUDA Support**: Automatic GPU acceleration when available
- **Lightweight Model**: 1.1B parameters fits in modest hardware constraints
- **Cloud Headers**: Bypasses CDN/proxy buffering for true real-time streaming

---

## 📚 Dependencies

### Python (Backend)
```
fastapi          - Web framework
uvicorn          - ASGI server
torch            - Deep learning
transformers     - Model loading
IndicTransToolkit - Indic text processing
PyPDF2           - PDF extraction
python-multipart - Multipart form parsing
```

### Node.js (Frontend)
```
next              - React framework
react             - UI library
tailwindcss       - CSS utilities
framer-motion     - Animations
lucide-react      - Icons
typescript        - Type safety
```

---

## 🔐 Security

- **CORS Validation**: Configured for production Vercel domain
- **File Type Validation**: Only PDF files accepted
- **Error Handling**: Graceful error messages without exposing internals
- **Input Sanitization**: PDF content is validated before processing

---

## 📈 Future Enhancements

- [ ] Multi-PDF batch processing
- [ ] Document preview with highlighted translations
- [ ] Translation quality scoring
- [ ] Custom language pair training
- [ ] Export translated documents as PDF/DOCX
- [ ] Translation history and caching
- [ ] User authentication and quotas

---

## 🤝 Built With

- **[AI4Bharat](https://ai4bharat.org/)** - Providing world-class Indic translation models
- **[Hugging Face](https://huggingface.co/)** - Model hosting and community
- **[Vercel](https://vercel.com/)** - Next.js optimization and deployment
- **[PyTorch](https://pytorch.org/)** - Deep learning foundation

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🤖 About

**BhashaDocs** is a portfolio project demonstrating:
- Full-stack AI/ML integration
- Real-time streaming architectures
- Cloud-native deployment patterns
- Modern frontend/backend best practices
- Production-grade error handling

**Built with ❤️ to break language barriers in India**

---

## 📞 Contact & Support

For questions, suggestions, or collaborations:
- **Email**: cainebenoy@gmail.com
- **GitHub**: [cainebenoy](https://github.com/cainebenoy)
- **Portfolio**: [cainebenoy.vercel.app](https://cainebenoy.vercel.app/)

---

## 🙏 Acknowledgments

- Special thanks to AI4Bharat for the incredible IndicTrans2 model
- Inspired by the need for accessible translation tools in Indian languages
- Built during jobless times.

---

**Happy Translating! 🌏**
