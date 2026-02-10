import os
import uuid
import shutil
import zipfile
import subprocess
from flask import Flask, render_template, request, send_file, jsonify
from pdf2image import convert_from_path
from PyPDF2 import PdfMerger, PdfReader, PdfWriter

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50 MB limit

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'uploads')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'outputs')

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)


# ─── Pages ────────────────────────────────────────────────────────────
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/pdf-to-images')
def pdf_to_images_page():
    return render_template('pdf_to_images.html')


@app.route('/merge-pdf')
def merge_pdf_page():
    return render_template('merge_pdf.html')


@app.route('/split-pdf')
def split_pdf_page():
    return render_template('split_pdf.html')


@app.route('/compress-pdf')
def compress_pdf_page():
    return render_template('compress_pdf.html')


# ─── API ──────────────────────────────────────────────────────────────
@app.route('/api/pdf-to-images', methods=['POST'])
def api_pdf_to_images():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are allowed'}), 400

    # Create unique job id
    job_id = str(uuid.uuid4())
    job_upload = os.path.join(UPLOAD_DIR, job_id)
    job_output = os.path.join(OUTPUT_DIR, job_id)
    os.makedirs(job_upload, exist_ok=True)
    os.makedirs(job_output, exist_ok=True)

    pdf_path = os.path.join(job_upload, file.filename)
    file.save(pdf_path)

    try:
        # Convert PDF pages → images
        dpi = int(request.form.get('dpi', 200))
        fmt = request.form.get('format', 'png').lower()
        if fmt not in ('png', 'jpg', 'jpeg'):
            fmt = 'png'

        images = convert_from_path(pdf_path, dpi=dpi)

        base_name = os.path.splitext(file.filename)[0]

        image_paths = []
        for i, img in enumerate(images, start=1):
            img_name = f"{base_name}_page_{i}.{fmt}"
            img_path = os.path.join(job_output, img_name)
            img.save(img_path, fmt.upper().replace('JPG', 'JPEG'))
            image_paths.append(img_path)

        # Bundle into ZIP
        zip_name = f"{base_name}_images.zip"
        zip_path = os.path.join(job_output, zip_name)
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for p in image_paths:
                zf.write(p, os.path.basename(p))

        response = send_file(
            zip_path,
            mimetype='application/zip',
            as_attachment=True,
            download_name=zip_name
        )

        # Cleanup after response is sent
        @response.call_on_close
        def _cleanup():
            shutil.rmtree(job_upload, ignore_errors=True)
            shutil.rmtree(job_output, ignore_errors=True)

        return response

    except Exception as e:
        # Cleanup on error
        shutil.rmtree(job_upload, ignore_errors=True)
        shutil.rmtree(job_output, ignore_errors=True)
        return jsonify({'error': str(e)}), 500


# ─── Merge PDF API ───────────────────────────────────────────────────
@app.route('/api/merge-pdf', methods=['POST'])
def api_merge_pdf():
    files = request.files.getlist('files')
    if not files or len(files) < 2:
        return jsonify({'error': 'Please upload at least 2 PDF files.'}), 400

    for f in files:
        if not f.filename.lower().endswith('.pdf'):
            return jsonify({'error': f'File "{f.filename}" is not a PDF.'}), 400

    job_id = str(uuid.uuid4())
    job_upload = os.path.join(UPLOAD_DIR, job_id)
    job_output = os.path.join(OUTPUT_DIR, job_id)
    os.makedirs(job_upload, exist_ok=True)
    os.makedirs(job_output, exist_ok=True)

    try:
        saved_paths = []
        for f in files:
            path = os.path.join(job_upload, f.filename)
            f.save(path)
            saved_paths.append(path)

        merger = PdfMerger()
        for p in saved_paths:
            merger.append(p)

        merged_name = 'merged.pdf'
        merged_path = os.path.join(job_output, merged_name)
        merger.write(merged_path)
        merger.close()

        response = send_file(
            merged_path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=merged_name
        )

        @response.call_on_close
        def _cleanup():
            shutil.rmtree(job_upload, ignore_errors=True)
            shutil.rmtree(job_output, ignore_errors=True)

        return response

    except Exception as e:
        shutil.rmtree(job_upload, ignore_errors=True)
        shutil.rmtree(job_output, ignore_errors=True)
        return jsonify({'error': str(e)}), 500


# ─── Split PDF API ───────────────────────────────────────────────────
@app.route('/api/split-pdf', methods=['POST'])
def api_split_pdf():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are allowed'}), 400

    ranges_str = request.form.get('ranges', '').strip()
    if not ranges_str:
        return jsonify({'error': 'Please specify page ranges.'}), 400

    job_id = str(uuid.uuid4())
    job_upload = os.path.join(UPLOAD_DIR, job_id)
    job_output = os.path.join(OUTPUT_DIR, job_id)
    os.makedirs(job_upload, exist_ok=True)
    os.makedirs(job_output, exist_ok=True)

    pdf_path = os.path.join(job_upload, file.filename)
    file.save(pdf_path)

    try:
        reader = PdfReader(pdf_path)
        total_pages = len(reader.pages)
        base_name = os.path.splitext(file.filename)[0]

        # Parse ranges like "1-3,5,7-9"
        pages_to_extract = []
        for part in ranges_str.split(','):
            part = part.strip()
            if '-' in part:
                start, end = part.split('-', 1)
                s, e = int(start.strip()), int(end.strip())
                if s < 1 or e > total_pages or s > e:
                    return jsonify({'error': f'Invalid range {part}. PDF has {total_pages} pages.'}), 400
                pages_to_extract.extend(range(s, e + 1))
            else:
                p = int(part)
                if p < 1 or p > total_pages:
                    return jsonify({'error': f'Page {p} is out of range. PDF has {total_pages} pages.'}), 400
                pages_to_extract.append(p)

        if not pages_to_extract:
            return jsonify({'error': 'No valid pages specified.'}), 400

        # Remove duplicates and sort
        pages_to_extract = sorted(set(pages_to_extract))

        writer = PdfWriter()
        for p in pages_to_extract:
            writer.add_page(reader.pages[p - 1])

        out_name = f"{base_name}_split.pdf"
        out_path = os.path.join(job_output, out_name)
        with open(out_path, 'wb') as f:
            writer.write(f)

        response = send_file(
            out_path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=out_name
        )

        @response.call_on_close
        def _cleanup():
            shutil.rmtree(job_upload, ignore_errors=True)
            shutil.rmtree(job_output, ignore_errors=True)

        return response

    except ValueError:
        shutil.rmtree(job_upload, ignore_errors=True)
        shutil.rmtree(job_output, ignore_errors=True)
        return jsonify({'error': 'Invalid page range format. Use format like: 1-3,5,7-9'}), 400
    except Exception as e:
        shutil.rmtree(job_upload, ignore_errors=True)
        shutil.rmtree(job_output, ignore_errors=True)
        return jsonify({'error': str(e)}), 500


# ─── Compress PDF API ────────────────────────────────────────────────
@app.route('/api/compress-pdf', methods=['POST'])
def api_compress_pdf():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are allowed'}), 400

    quality = request.form.get('quality', 'medium').lower()
    gs_settings = {
        'low':    '/screen',      # 72 DPI — smallest size
        'medium': '/ebook',       # 150 DPI — good balance
        'high':   '/printer',     # 300 DPI — high quality
    }
    pdf_setting = gs_settings.get(quality, '/ebook')

    job_id = str(uuid.uuid4())
    job_upload = os.path.join(UPLOAD_DIR, job_id)
    job_output = os.path.join(OUTPUT_DIR, job_id)
    os.makedirs(job_upload, exist_ok=True)
    os.makedirs(job_output, exist_ok=True)

    pdf_path = os.path.join(job_upload, file.filename)
    file.save(pdf_path)

    try:
        base_name = os.path.splitext(file.filename)[0]
        out_name = f"{base_name}_compressed.pdf"
        out_path = os.path.join(job_output, out_name)

        original_size = os.path.getsize(pdf_path)

        # Use Ghostscript for proper PDF compression
        gs_cmd = [
            'gs', '-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.4',
            f'-dPDFSETTINGS={pdf_setting}',
            '-dNOPAUSE', '-dQUIET', '-dBATCH',
            f'-sOutputFile={out_path}', pdf_path
        ]
        result = subprocess.run(gs_cmd, capture_output=True, text=True, timeout=120)

        if result.returncode != 0:
            return jsonify({'error': 'Compression failed. ' + result.stderr[:200]}), 500

        compressed_size = os.path.getsize(out_path)
        ratio = round((1 - compressed_size / original_size) * 100, 1) if original_size > 0 else 0

        response = send_file(
            out_path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=out_name
        )
        response.headers['X-Original-Size'] = str(original_size)
        response.headers['X-Compressed-Size'] = str(compressed_size)
        response.headers['X-Compression-Ratio'] = str(ratio)

        @response.call_on_close
        def _cleanup():
            shutil.rmtree(job_upload, ignore_errors=True)
            shutil.rmtree(job_output, ignore_errors=True)

        return response

    except subprocess.TimeoutExpired:
        shutil.rmtree(job_upload, ignore_errors=True)
        shutil.rmtree(job_output, ignore_errors=True)
        return jsonify({'error': 'Compression timed out. Try a smaller file.'}), 500
    except Exception as e:
        shutil.rmtree(job_upload, ignore_errors=True)
        shutil.rmtree(job_output, ignore_errors=True)
        return jsonify({'error': str(e)}), 500


# ─── Page Count Helper ───────────────────────────────────────────────
@app.route('/api/pdf-page-count', methods=['POST'])
def api_pdf_page_count():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    file = request.files['file']
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are allowed'}), 400

    job_id = str(uuid.uuid4())
    tmp_path = os.path.join(UPLOAD_DIR, f'{job_id}.pdf')
    file.save(tmp_path)
    try:
        reader = PdfReader(tmp_path)
        count = len(reader.pages)
        return jsonify({'pages': count})
    finally:
        os.remove(tmp_path)


# ─── Error Handlers ──────────────────────────────────────────────────
@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File too large. Maximum size is 50 MB.'}), 413


if __name__ == '__main__':
    app.run(debug=True, port=5000)
