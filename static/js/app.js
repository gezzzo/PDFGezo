/* ═══════════════════════════════════════════════════════════════
   PdfGezo — Frontend Logic
   Handles drag-and-drop, file upload, and conversion flow
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    // Only run on the pdf-to-images page
    const workspace = document.getElementById('workspace');
    if (!workspace) return;

    // DOM refs
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const optionsRow = document.getElementById('optionsRow');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const removeFileBtn = document.getElementById('removeFile');
    const convertBtn = document.getElementById('convertBtn');
    const dpiSelect = document.getElementById('dpiSelect');
    const formatSelect = document.getElementById('formatSelect');

    const stepUpload = document.getElementById('step-upload');
    const stepProcessing = document.getElementById('step-processing');
    const stepDone = document.getElementById('step-done');
    const stepError = document.getElementById('step-error');

    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const downloadBtn = document.getElementById('downloadBtn');
    const convertAnother = document.getElementById('convertAnotherBtn');
    const tryAgainBtn = document.getElementById('tryAgainBtn');
    const errorText = document.getElementById('errorText');

    let selectedFile = null;

    // ─── Helpers ────────────────────────────────────────────
    function showStep(step) {
        [stepUpload, stepProcessing, stepDone, stepError].forEach(s => s.classList.remove('active'));
        step.classList.add('active');
    }

    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }

    function setFile(file) {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            alert('Please select a PDF file.');
            return;
        }
        if (file.size > 50 * 1024 * 1024) {
            alert('File is too large. Maximum size is 50 MB.');
            return;
        }
        selectedFile = file;
        fileName.textContent = file.name;
        fileSize.textContent = formatBytes(file.size);
        fileInfo.style.display = 'flex';
        optionsRow.style.display = 'flex';
        convertBtn.style.display = 'flex';
        dropzone.style.display = 'none';
    }

    function resetUpload() {
        selectedFile = null;
        fileInput.value = '';
        fileInfo.style.display = 'none';
        optionsRow.style.display = 'none';
        convertBtn.style.display = 'none';
        dropzone.style.display = 'block';
        showStep(stepUpload);
    }

    // ─── Drag & Drop ───────────────────────────────────────
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            setFile(e.dataTransfer.files[0]);
        }
    });

    // Click on dropzone to select
    dropzone.addEventListener('click', (e) => {
        if (e.target.id === 'selectFileBtn' || e.target.closest('#selectFileBtn')) return;
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) setFile(fileInput.files[0]);
    });

    // Remove file
    removeFileBtn.addEventListener('click', resetUpload);

    // ─── Convert ────────────────────────────────────────────
    convertBtn.addEventListener('click', () => {
        if (!selectedFile) return;

        showStep(stepProcessing);
        progressBar.style.width = '0%';
        progressText.textContent = 'Uploading…';

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('dpi', dpiSelect.value);
        formData.append('format', formatSelect.value);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/pdf-to-images');
        xhr.responseType = 'blob';

        // Upload progress
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                progressBar.style.width = pct + '%';
                progressText.textContent = `Uploading… ${pct}%`;
            }
        });

        xhr.upload.addEventListener('load', () => {
            progressBar.style.width = '100%';
            progressText.textContent = 'Converting pages to images… please wait';
        });

        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                // Create download link
                const blob = xhr.response;
                const url = URL.createObjectURL(blob);
                downloadBtn.href = url;

                // Extract filename from Content-Disposition or use default
                const cd = xhr.getResponseHeader('Content-Disposition');
                let dlName = 'images.zip';
                if (cd) {
                    const match = cd.match(/filename=(.+)/);
                    if (match) dlName = match[1].replace(/['"]/g, '');
                }
                downloadBtn.download = dlName;

                showStep(stepDone);
            } else {
                // Try to parse error from JSON blob
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const err = JSON.parse(reader.result);
                        errorText.textContent = err.error || 'An unexpected error occurred.';
                    } catch {
                        errorText.textContent = 'An unexpected error occurred.';
                    }
                };
                reader.readAsText(xhr.response);
                showStep(stepError);
            }
        });

        xhr.addEventListener('error', () => {
            errorText.textContent = 'Network error. Please try again.';
            showStep(stepError);
        });

        xhr.send(formData);
    });

    // ─── Reset Buttons ──────────────────────────────────────
    convertAnother.addEventListener('click', resetUpload);
    tryAgainBtn.addEventListener('click', resetUpload);
});

/* ═══════════════════════════════════════════════════════════════
   Merge PDF — Multi-file upload, drag-to-reorder, merge
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const workspaceMerge = document.getElementById('workspace-merge');
    if (!workspaceMerge) return;

    const dropzone = document.getElementById('merge-dropzone');
    const fileInput = document.getElementById('mergeFileInput');
    const fileListWrap = document.getElementById('mergeFileList');
    const fileListEl = document.getElementById('mergeFiles');
    const fileCountEl = document.getElementById('mergeFileCount');
    const addMoreBtn = document.getElementById('addMoreBtn');
    const mergeBtn = document.getElementById('mergeBtn');

    const stepUpload = document.getElementById('merge-step-upload');
    const stepProcessing = document.getElementById('merge-step-processing');
    const stepDone = document.getElementById('merge-step-done');
    const stepError = document.getElementById('merge-step-error');

    const progressBar = document.getElementById('mergeProgressBar');
    const progressText = document.getElementById('mergeProgressText');
    const downloadBtn = document.getElementById('mergeDownloadBtn');
    const mergeAnother = document.getElementById('mergeAnotherBtn');
    const tryAgainBtn = document.getElementById('mergeTryAgainBtn');
    const errorText = document.getElementById('mergeErrorText');

    let mergeFiles = []; // array of File objects

    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }

    function showStep(step) {
        [stepUpload, stepProcessing, stepDone, stepError].forEach(s => s.classList.remove('active'));
        step.classList.add('active');
    }

    function updateUI() {
        fileCountEl.textContent = mergeFiles.length;
        if (mergeFiles.length > 0) {
            fileListWrap.style.display = 'block';
            dropzone.style.display = 'none';
            mergeBtn.style.display = mergeFiles.length >= 2 ? 'flex' : 'none';
        } else {
            fileListWrap.style.display = 'none';
            dropzone.style.display = 'block';
            mergeBtn.style.display = 'none';
        }
        renderFileList();
    }

    function renderFileList() {
        fileListEl.innerHTML = '';
        mergeFiles.forEach((file, idx) => {
            const li = document.createElement('li');
            li.className = 'merge-file-item';
            li.draggable = true;
            li.dataset.index = idx;
            li.innerHTML = `
                <span class="merge-file-grip">
                    <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
                </span>
                <span class="merge-file-name">${file.name}</span>
                <span class="merge-file-size">${formatBytes(file.size)}</span>
                <button class="merge-file-remove" data-idx="${idx}" title="Remove">✕</button>
            `;
            fileListEl.appendChild(li);
        });
        initDragReorder();
    }

    // ─── Add Files ──────────────────────────────────────────
    function addFiles(newFiles) {
        for (const f of newFiles) {
            if (!f.name.toLowerCase().endsWith('.pdf')) continue;
            mergeFiles.push(f);
        }
        updateUI();
    }

    // ─── Remove File ────────────────────────────────────────
    fileListEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.merge-file-remove');
        if (!btn) return;
        const idx = parseInt(btn.dataset.idx);
        mergeFiles.splice(idx, 1);
        updateUI();
    });

    // ─── Drag & Drop to add ─────────────────────────────────
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => { dropzone.classList.remove('dragover'); });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    });
    dropzone.addEventListener('click', (e) => {
        if (e.target.id === 'mergeSelectBtn' || e.target.closest('#mergeSelectBtn')) return;
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) addFiles(fileInput.files);
        fileInput.value = '';
    });

    addMoreBtn.addEventListener('click', () => fileInput.click());

    // ─── Drag to Reorder ────────────────────────────────────
    let dragIdx = null;
    function initDragReorder() {
        const items = fileListEl.querySelectorAll('.merge-file-item');
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                dragIdx = parseInt(item.dataset.index);
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                items.forEach(i => i.classList.remove('drag-over'));
                dragIdx = null;
            });
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                item.classList.add('drag-over');
            });
            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over');
            });
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('drag-over');
                const dropIdx = parseInt(item.dataset.index);
                if (dragIdx !== null && dragIdx !== dropIdx) {
                    const moved = mergeFiles.splice(dragIdx, 1)[0];
                    mergeFiles.splice(dropIdx, 0, moved);
                    updateUI();
                }
            });
        });
    }

    // ─── Merge ──────────────────────────────────────────────
    mergeBtn.addEventListener('click', () => {
        if (mergeFiles.length < 2) return;

        showStep(stepProcessing);
        progressBar.style.width = '0%';
        progressText.textContent = 'Uploading…';

        const formData = new FormData();
        mergeFiles.forEach(f => formData.append('files', f));

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/merge-pdf');
        xhr.responseType = 'blob';

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                progressBar.style.width = pct + '%';
                progressText.textContent = `Uploading… ${pct}%`;
            }
        });

        xhr.upload.addEventListener('load', () => {
            progressBar.style.width = '100%';
            progressText.textContent = 'Merging PDFs… please wait';
        });

        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const blob = xhr.response;
                const url = URL.createObjectURL(blob);
                downloadBtn.href = url;
                downloadBtn.download = 'merged.pdf';
                showStep(stepDone);
            } else {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const err = JSON.parse(reader.result);
                        errorText.textContent = err.error || 'An unexpected error occurred.';
                    } catch { errorText.textContent = 'An unexpected error occurred.'; }
                };
                reader.readAsText(xhr.response);
                showStep(stepError);
            }
        });

        xhr.addEventListener('error', () => {
            errorText.textContent = 'Network error. Please try again.';
            showStep(stepError);
        });

        xhr.send(formData);
    });

    // ─── Reset ──────────────────────────────────────────────
    function resetMerge() {
        mergeFiles = [];
        fileInput.value = '';
        updateUI();
        showStep(stepUpload);
    }
    mergeAnother.addEventListener('click', resetMerge);
    tryAgainBtn.addEventListener('click', resetMerge);
});

/* ═══════════════════════════════════════════════════════════════
   Split PDF — Upload, get page count, enter ranges, download
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const workspace = document.getElementById('workspace-split');
    if (!workspace) return;

    const dropzone = document.getElementById('split-dropzone');
    const fileInput = document.getElementById('splitFileInput');
    const fileInfo = document.getElementById('splitFileInfo');
    const fileNameEl = document.getElementById('splitFileName');
    const fileSizeEl = document.getElementById('splitFileSize');
    const removeBtn = document.getElementById('splitRemoveFile');
    const splitOptions = document.getElementById('splitOptions');
    const pageCountBadge = document.getElementById('pageCountBadge');
    const rangesInput = document.getElementById('splitRanges');
    const splitBtn = document.getElementById('splitBtn');

    const stepUpload = document.getElementById('split-step-upload');
    const stepProcessing = document.getElementById('split-step-processing');
    const stepDone = document.getElementById('split-step-done');
    const stepError = document.getElementById('split-step-error');

    const progressBar = document.getElementById('splitProgressBar');
    const progressText = document.getElementById('splitProgressText');
    const downloadBtn = document.getElementById('splitDownloadBtn');
    const anotherBtn = document.getElementById('splitAnotherBtn');
    const tryAgainBtn = document.getElementById('splitTryAgainBtn');
    const errorText = document.getElementById('splitErrorText');

    let selectedFile = null;

    function formatBytes(b) {
        if (b < 1024) return b + ' B';
        if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
        return (b / 1048576).toFixed(1) + ' MB';
    }

    function showStep(s) {
        [stepUpload, stepProcessing, stepDone, stepError].forEach(el => el.classList.remove('active'));
        s.classList.add('active');
    }

    function setFile(file) {
        if (!file || !file.name.toLowerCase().endsWith('.pdf')) return;
        if (file.size > 50 * 1024 * 1024) { alert('File too large.'); return; }
        selectedFile = file;
        fileNameEl.textContent = file.name;
        fileSizeEl.textContent = formatBytes(file.size);
        fileInfo.style.display = 'flex';
        splitOptions.style.display = 'block';
        splitBtn.style.display = 'flex';
        dropzone.style.display = 'none';
        pageCountBadge.textContent = 'Counting pages…';

        // Get page count
        const fd = new FormData();
        fd.append('file', file);
        fetch('/api/pdf-page-count', { method: 'POST', body: fd })
            .then(r => r.json())
            .then(d => {
                if (d.pages) {
                    pageCountBadge.textContent = `${d.pages} page${d.pages > 1 ? 's' : ''} detected`;
                    rangesInput.placeholder = `e.g. 1-${Math.min(d.pages, 3)}, ${Math.min(d.pages, 5)}`;
                }
            })
            .catch(() => { pageCountBadge.textContent = 'Could not count pages'; });
    }

    function resetSplit() {
        selectedFile = null;
        fileInput.value = '';
        rangesInput.value = '';
        fileInfo.style.display = 'none';
        splitOptions.style.display = 'none';
        splitBtn.style.display = 'none';
        dropzone.style.display = 'block';
        showStep(stepUpload);
    }

    // Drag & drop
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', e => {
        e.preventDefault(); dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length) setFile(e.dataTransfer.files[0]);
    });
    dropzone.addEventListener('click', e => {
        if (e.target.closest('#splitSelectBtn')) return;
        fileInput.click();
    });
    fileInput.addEventListener('change', () => { if (fileInput.files.length) setFile(fileInput.files[0]); });
    removeBtn.addEventListener('click', resetSplit);

    // Split action
    splitBtn.addEventListener('click', () => {
        if (!selectedFile || !rangesInput.value.trim()) {
            alert('Please enter page ranges.');
            return;
        }
        showStep(stepProcessing);
        progressBar.style.width = '0%';
        progressText.textContent = 'Uploading…';

        const fd = new FormData();
        fd.append('file', selectedFile);
        fd.append('ranges', rangesInput.value.trim());

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/split-pdf');
        xhr.responseType = 'blob';

        xhr.upload.addEventListener('progress', e => {
            if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                progressBar.style.width = pct + '%';
                progressText.textContent = `Uploading… ${pct}%`;
            }
        });
        xhr.upload.addEventListener('load', () => {
            progressBar.style.width = '100%';
            progressText.textContent = 'Splitting pages…';
        });
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const url = URL.createObjectURL(xhr.response);
                downloadBtn.href = url;
                downloadBtn.download = 'split.pdf';
                showStep(stepDone);
            } else {
                const reader = new FileReader();
                reader.onload = () => {
                    try { errorText.textContent = JSON.parse(reader.result).error; }
                    catch { errorText.textContent = 'An error occurred.'; }
                };
                reader.readAsText(xhr.response);
                showStep(stepError);
            }
        });
        xhr.addEventListener('error', () => { errorText.textContent = 'Network error.'; showStep(stepError); });
        xhr.send(fd);
    });

    anotherBtn.addEventListener('click', resetSplit);
    tryAgainBtn.addEventListener('click', resetSplit);
});

/* ═══════════════════════════════════════════════════════════════
   Compress PDF — Upload, pick quality, compress, show stats
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const workspace = document.getElementById('workspace-compress');
    if (!workspace) return;

    const dropzone = document.getElementById('compress-dropzone');
    const fileInput = document.getElementById('compressFileInput');
    const fileInfo = document.getElementById('compressFileInfo');
    const fileNameEl = document.getElementById('compressFileName');
    const fileSizeEl = document.getElementById('compressFileSize');
    const removeBtn = document.getElementById('compressRemoveFile');
    const options = document.getElementById('compressOptions');
    const compressBtn = document.getElementById('compressBtn');

    const stepUpload = document.getElementById('compress-step-upload');
    const stepProcessing = document.getElementById('compress-step-processing');
    const stepDone = document.getElementById('compress-step-done');
    const stepError = document.getElementById('compress-step-error');

    const progressBar = document.getElementById('compressProgressBar');
    const progressText = document.getElementById('compressProgressText');
    const downloadBtn = document.getElementById('compressDownloadBtn');
    const anotherBtn = document.getElementById('compressAnotherBtn');
    const tryAgainBtn = document.getElementById('compressTryAgainBtn');
    const errorText = document.getElementById('compressErrorText');

    const statOriginal = document.getElementById('statOriginal');
    const statCompressed = document.getElementById('statCompressed');
    const statRatio = document.getElementById('statRatio');

    let selectedFile = null;

    function formatBytes(b) {
        if (b < 1024) return b + ' B';
        if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
        return (b / 1048576).toFixed(1) + ' MB';
    }

    function showStep(s) {
        [stepUpload, stepProcessing, stepDone, stepError].forEach(el => el.classList.remove('active'));
        s.classList.add('active');
    }

    function setFile(file) {
        if (!file || !file.name.toLowerCase().endsWith('.pdf')) return;
        if (file.size > 50 * 1024 * 1024) { alert('File too large.'); return; }
        selectedFile = file;
        fileNameEl.textContent = file.name;
        fileSizeEl.textContent = formatBytes(file.size);
        fileInfo.style.display = 'flex';
        options.style.display = 'block';
        compressBtn.style.display = 'flex';
        dropzone.style.display = 'none';
    }

    function resetCompress() {
        selectedFile = null;
        fileInput.value = '';
        fileInfo.style.display = 'none';
        options.style.display = 'none';
        compressBtn.style.display = 'none';
        dropzone.style.display = 'block';
        showStep(stepUpload);
    }

    // Drag & drop
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', e => {
        e.preventDefault(); dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length) setFile(e.dataTransfer.files[0]);
    });
    dropzone.addEventListener('click', e => {
        if (e.target.closest('#compressSelectBtn')) return;
        fileInput.click();
    });
    fileInput.addEventListener('change', () => { if (fileInput.files.length) setFile(fileInput.files[0]); });
    removeBtn.addEventListener('click', resetCompress);

    // Compress action
    compressBtn.addEventListener('click', () => {
        if (!selectedFile) return;

        const quality = document.querySelector('input[name="quality"]:checked').value;

        showStep(stepProcessing);
        progressBar.style.width = '0%';
        progressText.textContent = 'Uploading…';

        const fd = new FormData();
        fd.append('file', selectedFile);
        fd.append('quality', quality);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/compress-pdf');
        xhr.responseType = 'blob';

        xhr.upload.addEventListener('progress', e => {
            if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                progressBar.style.width = pct + '%';
                progressText.textContent = `Uploading… ${pct}%`;
            }
        });
        xhr.upload.addEventListener('load', () => {
            progressBar.style.width = '100%';
            progressText.textContent = 'Compressing… this may take a moment';
        });
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const url = URL.createObjectURL(xhr.response);
                downloadBtn.href = url;
                downloadBtn.download = 'compressed.pdf';

                // Show stats
                const origSize = parseInt(xhr.getResponseHeader('X-Original-Size') || '0');
                const compSize = parseInt(xhr.getResponseHeader('X-Compressed-Size') || '0');
                const ratio = xhr.getResponseHeader('X-Compression-Ratio') || '0';

                statOriginal.textContent = formatBytes(origSize);
                statCompressed.textContent = formatBytes(compSize);
                statRatio.textContent = ratio + '% smaller';

                showStep(stepDone);
            } else {
                const reader = new FileReader();
                reader.onload = () => {
                    try { errorText.textContent = JSON.parse(reader.result).error; }
                    catch { errorText.textContent = 'An error occurred.'; }
                };
                reader.readAsText(xhr.response);
                showStep(stepError);
            }
        });
        xhr.addEventListener('error', () => { errorText.textContent = 'Network error.'; showStep(stepError); });
        xhr.send(fd);
    });

    anotherBtn.addEventListener('click', resetCompress);
    tryAgainBtn.addEventListener('click', resetCompress);
});
