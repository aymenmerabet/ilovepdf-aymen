# 📄 iLovePDF Aymen - Complete Modern PDF Suite

A modern, high-performance web application for PDF manipulation and document management, built with **React**, **FastAPI**, and **PyMuPDF**.

---

## ✨ Features

- 🔄 **Merge PDF**: Combine multiple PDF files into one document in your custom order.
- ✂️ **Split PDF**: Extract page ranges or split all pages into individual files.
- 🗜️ **Compress PDF**: High-efficiency compression (High, Medium, Low).
- 🖼️ **PDF to Images**: High-resolution conversion of PDF pages to JPG/PNG images.
- 📸 **Images to PDF**: Convert JPG, PNG, and WebP images into formatted PDF documents.
- 📑 **Organize Pages**: Visually reorder, rotate, or delete individual pages.
- 🔒 **Protect PDF**: Encrypt and password-protect your sensitive documents.
- 💧 **Watermark & Page Numbers**: Add custom watermark text and page numbering.
- 📝 **Extract Text**: Fast, accurate text extraction.
- 📊 **Admin Dashboard**: Real-time storage monitoring, usage statistics, and temporary file cleanup.
- 🌐 **Multi-language Support**: French (FR), Arabic (AR) with RTL, English (EN).
- 🌙 **Dark / Light Mode**: Sleek modern UI with dark mode support.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Backend**: FastAPI, Python 3.10+, PyMuPDF (fitz), Pillow, Uvicorn
- **Storage**: Local session file storage with metadata tracking

---

## 🚀 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.10+)
- [Git](https://git-scm.com/)

---

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at `http://127.0.0.1:8000/docs`.

---

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser.

---

## 💻 One-Click Start (Windows)
Run `start.bat` in the root folder to launch both the backend and frontend simultaneously.

---

## 📜 License
MIT License - Developed by **Aymen**.
