# PDFGezo

Free online PDF toolkit built with **Python Flask**. Convert, split, merge, and compress your PDF documents — right in your browser.

![PDFGezo](https://img.shields.io/badge/Python-3.9+-blue) ![Flask](https://img.shields.io/badge/Flask-3.1-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## Features

| Tool | Description |
|---|---|
| **PDF to Images** | Convert each page of a PDF into high-quality PNG/JPG images |
| **Merge PDF** | Combine multiple PDFs into a single document (drag to reorder) |
| **Split PDF** | Extract specific pages or page ranges into a new PDF |
| **Compress PDF** | Reduce file size using Ghostscript with 3 quality presets |
| **JPG to PDF** | Convert images (JPG, PNG, WEBP) into a PDF document |

## Tech Stack

- **Backend:** Python 3, Flask
- **PDF Processing:** PyPDF2, pdf2image (Poppler), Ghostscript, Pillow
- **Frontend:** Vanilla HTML/CSS/JS with glassmorphism dark theme
- **Fonts:** Inter (Google Fonts)

## Getting Started

### Prerequisites

- Python 3.9+
- [Poppler](https://poppler.freedesktop.org/) (for PDF to Images)
- [Ghostscript](https://www.ghostscript.com/) (for Compress PDF)

**macOS (Homebrew):**
```bash
brew install poppler ghostscript
```

### Installation

```bash
# Clone the repo
git clone https://github.com/gezzzo/PDFGezo.git
cd PDFGezo

# Create virtual environment
python3 -m venv venv

# Activate virtual environment

# Linux/macOS: 
source venv/bin/activate

# Windows: 
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the app
python app.py
```

The app will be available at **http://127.0.0.1:5000**

## Project Structure

```
PDFGezo/
├── app.py                  # Flask app with all routes & APIs
├── requirements.txt        # Python dependencies
├── static/
│   ├── css/style.css       # Global styles (dark glassmorphism)
│   └── js/app.js           # Frontend logic for all tools
├── templates/
│   ├── base.html           # Base layout (nav, footer)
│   ├── index.html          # Home page with tool cards
│   ├── pdf_to_images.html  # PDF to Images tool
│   ├── merge_pdf.html      # Merge PDF tool
│   ├── split_pdf.html      # Split PDF tool
│   ├── compress_pdf.html   # Compress PDF tool
│   └── jpg_to_pdf.html     # JPG to PDF tool
├── uploads/                # Temporary upload storage (gitignored)
└── outputs/                # Temporary output storage (gitignored)
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/pdf-to-images` | Convert PDF pages to images (returns ZIP) |
| `POST` | `/api/merge-pdf` | Merge multiple PDFs into one |
| `POST` | `/api/split-pdf` | Extract pages by range (e.g. `1-3,5,8-10`) |
| `POST` | `/api/compress-pdf` | Compress PDF with quality presets |
| `POST` | `/api/jpg-to-pdf` | Convert images to PDF |
| `POST` | `/api/pdf-page-count` | Get total page count of a PDF |

## License

This project is licensed under the MIT License - see the LICENSE file for details.