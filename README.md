# 🚀 MeetFlow-AI
MeetFlow-AI

MeetFlow-AI is a **full-stack, AI-powered meeting assistant platform** that enables seamless video meetings, real-time chat, automatic transcription, and actionable insights.

Built with a modern **React + Vite frontend** and a robust **Node.js/Express backend**, MeetFlow-AI leverages advanced NLP and AI services to supercharge your meetings.

---

## 📄 Documentation

* 📘 [Problem Definition](ProjectReview/MeetFlow_AI_Problem_Definition_Topper1.docx)
* 📗 [PRS (Product Requirement Specification)](ProjectReview/MeetFlow_AI_PRS_Topper1.docx)

---

## 🌟 Features

* 🎥 **Video Conferencing** – High-quality multi-user meetings using WebRTC
* 💬 **Real-Time Chat** – Instant messaging during meetings
* 🧠 **AI Transcription** – Automatic speech-to-text conversion
* 📌 **Action Item Extraction** – NLP detects and assigns tasks
* 📝 **Meeting Summaries** – AI-generated summaries
* 📋 **Task Management** – Track and update action items
* ⚡ **Real-time Communication** – Powered by Socket.IO
* 🔒 **Secure & Scalable** – Built with MERN stack architecture

---

## 🗂️ Project Structure

```bash
MeetFlow-AI/
│
├── backend/                # Node.js/Express backend API & services
│   ├── models/             # Mongoose models
│   ├── public/             
│   ├── services/           # AI & NLP services
│   ├── server.js           
│   └── package.json        
│
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── components/     
│   │   ├── context/        
│   │   ├── hooks/          
│   │   ├── pages/          
│   │   ├── utils/          
│   │   └── assets/         
│   ├── index.html
│   ├── package.json        
│   └── vite.config.js      
│
├── ProjectReview/          # Documentation files
├── netlify.toml            
├── run.ps1                 
└── README.md               
```

---

## ⚙️ Getting Started

### 🔧 Prerequisites

* Node.js (v18+)
* npm
* MongoDB (local or cloud)

---

### 📥 Clone the Repository

```bash
git clone https://github.com/nayan777pratyush/MeetFlow-AI.git
cd MeetFlow-AI
```

---

### ⚙️ Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run start
```

---

### 🎨 Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

---

### ▶️ One-Click Start (Windows)

```bash
./run.ps1
```

---

## 🧠 Key Technologies

### 💻 Frontend

* React
* Vite
* TailwindCSS
* Framer Motion
* Socket.IO Client
* Recharts

### ⚙️ Backend

* Node.js
* Express.js
* MongoDB (Mongoose)
* Socket.IO
* Multer
* dotenv

### 🤖 AI & NLP

* GROQ API (transcription & chat)
* Custom NLP for action extraction

---

## 📁 Folder Highlights

* `backend/models/` → Database schemas
* `backend/services/` → AI + NLP logic
* `frontend/pages/` → Core app flow
* `frontend/components/` → Reusable UI
* `frontend/hooks/` → WebRTC + speech logic
* `frontend/context/` → Real-time socket handling
* `frontend/utils/` → Helper utilities

---

## 🤝 Contributing

Pull requests are welcome!
For major changes, please open an issue first to discuss improvements.

---

## 📝 License

This project is licensed under the **ISC License**.

---

## 💡 Credits

Developed by the **MeetFlow-AI Team** 🚀
---

## 🔧 Updates by Pruthviraj

- Improved documentation structure
- Added additional clarity for project setup
- Minor enhancements for better understanding


