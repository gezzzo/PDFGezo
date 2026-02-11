# PDFGezo

Free online PDF toolkit built with **Python Flask**. Convert, split, merge, and compress your PDF documents — right in your browser.

![PDFGezo](https://img.shields.io/badge/Python-3.9+-blue) ![Flask](https://img.shields.io/badge/Flask-3.1-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## Features

### Convert to PDF

| Tool | Description |
|---|---|
| **Images to PDF** | Convert images (JPG, PNG, WEBP) into a PDF document |
| **Word to PDF** | Convert Word documents (.doc, .docx) to PDF |
| **PowerPoint to PDF** | Convert presentations (.ppt, .pptx) to PDF |
| **Excel to PDF** | Convert spreadsheets (.xls, .xlsx) to PDF |
| **HTML to PDF** | Convert HTML files (.html, .htm) to PDF |
| **CSV to PDF** | Convert CSV files to PDF |

### Convert from PDF

| Tool | Description |
|---|---|
| **PDF to Images** | Convert each page of a PDF into high-quality PNG/JPG images |
| **PDF to Word** | Convert PDF to editable Word document (.docx) using `pdf2docx` |
| **PDF to PowerPoint** | Convert PDF pages to PowerPoint slides (.pptx) with full-page images |
| **PDF to Excel** | Extract tables from PDF into Excel spreadsheet (.xlsx) using `pdfplumber` |
| **PDF to CSV** | Extract tables from PDF into CSV format using `pdfplumber` |

### PDF Tools

| Tool | Description |
|---|---|
| **Merge PDF** | Combine multiple PDFs into a single document (drag to reorder) |
| **Split PDF** | Extract specific pages or page ranges into a new PDF |
| **Compress PDF** | Reduce file size using Ghostscript with 3 quality presets |

## Tech Stack

- **Backend:** Python 3, Flask
- **PDF Processing:** PyPDF2, pdf2image (Poppler), Ghostscript, Pillow
- **PDF to Word:** pdf2docx, PyMuPDF
- **PDF to PowerPoint:** pdf2image, python-pptx
- **PDF to Excel/CSV:** pdfplumber, openpyxl
- **Office to PDF:** LibreOffice (headless)
- **Frontend:** Vanilla HTML/CSS/JS with glassmorphism dark theme
- **Fonts:** Inter (Google Fonts)

## Getting Started

### Prerequisites

- Python 3.9+
- [Poppler](https://poppler.freedesktop.org/) (for PDF to Images & PDF to PowerPoint)
- [Ghostscript](https://www.ghostscript.com/) (for Compress PDF)
- [LibreOffice](https://www.libreoffice.org/) (for Word/PowerPoint/Excel/HTML/CSV to PDF)

**macOS (Homebrew):**
```bash
brew install poppler ghostscript
brew install --cask libreoffice
```
**Linux (Ubuntu/Debian):**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install poppler-utils ghostscript libreoffice -y
```
**Windows (Chocolatey):**
```bash
choco install poppler ghostscript libreoffice
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
├── app.py                      # Flask app with all routes & APIs
├── requirements.txt            # Python dependencies
├── static/
│   ├── css/style.css           # Global styles (dark glassmorphism)
│   └── js/app.js               # Frontend logic for all tools
├── templates/
│   ├── base.html               # Base layout (nav, footer)
│   ├── index.html              # Home page with tool cards
│   ├── merge_pdf.html          # Merge PDF tool
│   ├── split_pdf.html          # Split PDF tool
│   ├── compress_pdf.html       # Compress PDF tool
│   ├── jpg_to_pdf.html         # Images to PDF tool
│   ├── word_to_pdf.html        # Word to PDF tool
│   ├── pptx_to_pdf.html        # PowerPoint to PDF tool
│   ├── excel_to_pdf.html       # Excel to PDF tool
│   ├── html_to_pdf.html        # HTML to PDF tool
│   ├── csv_to_pdf.html         # CSV to PDF tool
│   ├── pdf_to_images.html      # PDF to Images tool
│   ├── pdf_to_word.html        # PDF to Word tool
│   ├── pdf_to_pptx.html        # PDF to PowerPoint tool
│   ├── pdf_to_excel.html       # PDF to Excel tool
│   └── pdf_to_csv.html         # PDF to CSV tool
├── uploads/                    # Temporary upload storage (gitignored)
└── outputs/                    # Temporary output storage (gitignored)
```

## API Endpoints

### Convert to PDF

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/jpg-to-pdf` | Convert images to PDF |
| `POST` | `/api/word-to-pdf` | Convert Word documents to PDF |
| `POST` | `/api/pptx-to-pdf` | Convert PowerPoint presentations to PDF |
| `POST` | `/api/excel-to-pdf` | Convert Excel spreadsheets to PDF |
| `POST` | `/api/html-to-pdf` | Convert HTML files to PDF |
| `POST` | `/api/csv-to-pdf` | Convert CSV files to PDF |

### Convert from PDF

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/pdf-to-images` | Convert PDF pages to images (returns ZIP) |
| `POST` | `/api/pdf-to-word` | Convert PDF to Word (.docx) |
| `POST` | `/api/pdf-to-pptx` | Convert PDF to PowerPoint (.pptx) |
| `POST` | `/api/pdf-to-excel` | Convert PDF to Excel (.xlsx) |
| `POST` | `/api/pdf-to-csv` | Convert PDF to CSV |

### PDF Tools

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/merge-pdf` | Merge multiple PDFs into one |
| `POST` | `/api/split-pdf` | Extract pages by range (e.g. `1-3,5,8-10`) |
| `POST` | `/api/compress-pdf` | Compress PDF with quality presets |
| `POST` | `/api/pdf-page-count` | Get total page count of a PDF |

## License

This project is licensed under the MIT License - see the LICENSE file for details.