/* ═══════════════════════════════════════════════════════════════
   PDFGezo — Frontend Logic
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    // ─── Theme Toggle ───────────────────────────────────────────────
    const toggleBtn = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('icon-sun');
    const moonIcon = document.getElementById('icon-moon');
    const html = document.documentElement;

    if (toggleBtn) {
        // Check saved theme or default
        const savedTheme = localStorage.getItem('theme') || 'dark';
        if (savedTheme === 'light') {
            html.setAttribute('data-theme', 'light');
            if (sunIcon) sunIcon.style.display = 'none';
            if (moonIcon) moonIcon.style.display = 'block';
        } else {
            html.removeAttribute('data-theme');
            if (sunIcon) sunIcon.style.display = 'block';
            if (moonIcon) moonIcon.style.display = 'none';
        }

        toggleBtn.addEventListener('click', () => {
            const isLight = html.getAttribute('data-theme') === 'light';
            if (isLight) {
                html.removeAttribute('data-theme');
                localStorage.setItem('theme', 'dark');
                if (sunIcon) sunIcon.style.display = 'block';
                if (moonIcon) moonIcon.style.display = 'none';
            } else {
                html.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
                if (sunIcon) sunIcon.style.display = 'none';
                if (moonIcon) moonIcon.style.display = 'block';
            }
        });
    }

    // ─── Hamburger Menu Toggle ──────────────────────────────────────
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('open');
        });

        // Mobile dropdown toggles (click to expand)
        const dropdownToggles = navLinks.querySelectorAll('.dropdown-toggle');
        dropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                // Only handle on mobile
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    const dropdown = toggle.closest('.nav-dropdown');
                    dropdown.classList.toggle('open');
                }
            });
        });

        // Close mobile menu when clicking a nav-link (not dropdown toggle)
        navLinks.querySelectorAll('a.nav-link, .dropdown-item').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    hamburger.classList.remove('active');
                    navLinks.classList.remove('open');
                }
            });
        });

        // Close menu when resizing to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('open');
                navLinks.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
            }
        });
    }

    // ─── Page Specific Logic ────────────────────────────────────────
    // Only run on the pdf-to-images page. 
    // Other pages have their own event listeners at the bottom of this file.
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

/* ═══════════════════════════════════════════════════════════════
   Images to PDF — Upload images, convert to PDF, download
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const workspace = document.getElementById('workspace-jpg2pdf');
    if (!workspace) return;

    const dropzone = document.getElementById('jpg2pdf-dropzone');
    const fileInput = document.getElementById('jpg2pdfFileInput');
    const fileListWrap = document.getElementById('jpg2pdfFileList');
    const fileListEl = document.getElementById('jpg2pdfFiles');
    const fileCountEl = document.getElementById('jpg2pdfFileCount');
    const addMoreBtn = document.getElementById('jpg2pdfAddMore');
    const convertBtn = document.getElementById('jpg2pdfBtn');

    const stepUpload = document.getElementById('jpg2pdf-step-upload');
    const stepProcess = document.getElementById('jpg2pdf-step-processing');
    const stepDone = document.getElementById('jpg2pdf-step-done');
    const stepError = document.getElementById('jpg2pdf-step-error');

    const progressBar = document.getElementById('jpg2pdfProgressBar');
    const progressText = document.getElementById('jpg2pdfProgressText');
    const downloadBtn = document.getElementById('jpg2pdfDownloadBtn');
    const anotherBtn = document.getElementById('jpg2pdfAnotherBtn');
    const tryAgainBtn = document.getElementById('jpg2pdfTryAgainBtn');
    const errorText = document.getElementById('jpg2pdfErrorText');

    let files = [];

    function formatBytes(b) {
        if (b < 1024) return b + ' B';
        if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
        return (b / 1048576).toFixed(1) + ' MB';
    }

    function showStep(s) {
        [stepUpload, stepProcess, stepDone, stepError].forEach(el => el.classList.remove('active'));
        s.classList.add('active');
    }

    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    function isImage(f) {
        const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
        return allowedExts.includes(ext);
    }

    function addFiles(newFiles) {
        for (const f of newFiles) {
            if (isImage(f) && f.size <= 50 * 1024 * 1024) files.push(f);
        }
        renderList();
    }

    function renderList() {
        if (files.length === 0) {
            fileListWrap.style.display = 'none';
            convertBtn.style.display = 'none';
            dropzone.style.display = 'block';
            return;
        }
        dropzone.style.display = 'none';
        fileListWrap.style.display = 'block';
        convertBtn.style.display = 'flex';
        fileCountEl.textContent = files.length;

        fileListEl.innerHTML = '';
        files.forEach((f, i) => {
            const li = document.createElement('li');
            li.className = 'merge-file-item';
            li.innerHTML = `
                <div class="merge-file-info">
                    <span class="merge-file-name">${f.name}</span>
                    <span class="merge-file-size">${formatBytes(f.size)}</span>
                </div>
                <button class="merge-file-remove" data-index="${i}" title="Remove">&times;</button>
            `;
            fileListEl.appendChild(li);
        });

        fileListEl.querySelectorAll('.merge-file-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                files.splice(parseInt(btn.dataset.index), 1);
                renderList();
            });
        });
    }

    function resetJpg() {
        files = [];
        fileInput.value = '';
        fileListWrap.style.display = 'none';
        convertBtn.style.display = 'none';
        dropzone.style.display = 'block';
        showStep(stepUpload);
    }

    // Drag & drop
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', e => {
        e.preventDefault(); dropzone.classList.remove('dragover');
        addFiles(e.dataTransfer.files);
    });
    dropzone.addEventListener('click', e => {
        if (e.target.closest('#jpg2pdfSelectBtn')) return;
        fileInput.click();
    });
    fileInput.addEventListener('change', () => { addFiles(fileInput.files); fileInput.value = ''; });
    addMoreBtn.addEventListener('click', () => fileInput.click());

    // Convert action
    convertBtn.addEventListener('click', () => {
        if (!files.length) return;
        showStep(stepProcess);
        progressBar.style.width = '0%';
        progressText.textContent = 'Uploading…';

        const fd = new FormData();
        files.forEach(f => fd.append('files', f));

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/jpg-to-pdf');
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
            progressText.textContent = 'Converting images…';
        });
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const url = URL.createObjectURL(xhr.response);
                downloadBtn.href = url;
                downloadBtn.download = 'images_converted.pdf';
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

    anotherBtn.addEventListener('click', resetJpg);
    tryAgainBtn.addEventListener('click', resetJpg);
});

/* ═══════════════════════════════════════════════════════════════
   Word to PDF — Upload .doc/.docx, convert via LibreOffice, download
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const workspace = document.getElementById('workspace-word2pdf');
    if (!workspace) return;

    const dropzone = document.getElementById('word2pdf-dropzone');
    const fileInput = document.getElementById('word2pdfFileInput');
    const fileInfo = document.getElementById('word2pdfFileInfo');
    const fileNameEl = document.getElementById('word2pdfFileName');
    const fileSizeEl = document.getElementById('word2pdfFileSize');
    const removeBtn = document.getElementById('word2pdfRemoveFile');
    const convertBtn = document.getElementById('word2pdfBtn');

    const stepUpload = document.getElementById('word2pdf-step-upload');
    const stepProcess = document.getElementById('word2pdf-step-processing');
    const stepDone = document.getElementById('word2pdf-step-done');
    const stepError = document.getElementById('word2pdf-step-error');

    const progressBar = document.getElementById('word2pdfProgressBar');
    const progressText = document.getElementById('word2pdfProgressText');
    const downloadBtn = document.getElementById('word2pdfDownloadBtn');
    const anotherBtn = document.getElementById('word2pdfAnotherBtn');
    const tryAgainBtn = document.getElementById('word2pdfTryAgainBtn');
    const errorText = document.getElementById('word2pdfErrorText');

    let selectedFile = null;

    function formatBytes(b) {
        if (b < 1024) return b + ' B';
        if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
        return (b / 1048576).toFixed(1) + ' MB';
    }

    function showStep(s) {
        [stepUpload, stepProcess, stepDone, stepError].forEach(el => el.classList.remove('active'));
        s.classList.add('active');
    }

    function setFile(file) {
        if (!file) return;
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (ext !== '.doc' && ext !== '.docx') return;
        if (file.size > 50 * 1024 * 1024) { alert('File too large.'); return; }
        selectedFile = file;
        fileNameEl.textContent = file.name;
        fileSizeEl.textContent = formatBytes(file.size);
        fileInfo.style.display = 'flex';
        convertBtn.style.display = 'flex';
        dropzone.style.display = 'none';
    }

    function resetWord() {
        selectedFile = null;
        fileInput.value = '';
        fileInfo.style.display = 'none';
        convertBtn.style.display = 'none';
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
        if (e.target.closest('#word2pdfSelectBtn')) return;
        fileInput.click();
    });
    fileInput.addEventListener('change', () => { if (fileInput.files.length) setFile(fileInput.files[0]); });
    removeBtn.addEventListener('click', resetWord);

    // Convert action
    convertBtn.addEventListener('click', () => {
        if (!selectedFile) return;
        showStep(stepProcess);
        progressBar.style.width = '0%';
        progressText.textContent = 'Uploading…';

        const fd = new FormData();
        fd.append('file', selectedFile);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/word-to-pdf');
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
            progressText.textContent = 'Converting… this may take a moment';
        });
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const url = URL.createObjectURL(xhr.response);
                downloadBtn.href = url;
                downloadBtn.download = selectedFile.name.replace(/\.(doc|docx)$/i, '.pdf');
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

    anotherBtn.addEventListener('click', resetWord);
    tryAgainBtn.addEventListener('click', resetWord);
});

/* ═══════════════════════════════════════════════════════════════
   PowerPoint to PDF — Upload .ppt/.pptx, convert via LibreOffice, download
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const workspace = document.getElementById('workspace-pptx2pdf');
    if (!workspace) return;

    const dropzone = document.getElementById('pptx2pdf-dropzone');
    const fileInput = document.getElementById('pptx2pdfFileInput');
    const fileInfo = document.getElementById('pptx2pdfFileInfo');
    const fileNameEl = document.getElementById('pptx2pdfFileName');
    const fileSizeEl = document.getElementById('pptx2pdfFileSize');
    const removeBtn = document.getElementById('pptx2pdfRemoveFile');
    const convertBtn = document.getElementById('pptx2pdfBtn');

    const stepUpload = document.getElementById('pptx2pdf-step-upload');
    const stepProcess = document.getElementById('pptx2pdf-step-processing');
    const stepDone = document.getElementById('pptx2pdf-step-done');
    const stepError = document.getElementById('pptx2pdf-step-error');

    const progressBar = document.getElementById('pptx2pdfProgressBar');
    const progressText = document.getElementById('pptx2pdfProgressText');
    const downloadBtn = document.getElementById('pptx2pdfDownloadBtn');
    const anotherBtn = document.getElementById('pptx2pdfAnotherBtn');
    const tryAgainBtn = document.getElementById('pptx2pdfTryAgainBtn');
    const errorText = document.getElementById('pptx2pdfErrorText');

    let selectedFile = null;

    function formatBytes(b) {
        if (b < 1024) return b + ' B';
        if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
        return (b / 1048576).toFixed(1) + ' MB';
    }

    function showStep(s) {
        [stepUpload, stepProcess, stepDone, stepError].forEach(el => el.classList.remove('active'));
        s.classList.add('active');
    }

    function setFile(file) {
        if (!file) return;
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (ext !== '.ppt' && ext !== '.pptx') return;
        if (file.size > 50 * 1024 * 1024) { alert('File too large.'); return; }
        selectedFile = file;
        fileNameEl.textContent = file.name;
        fileSizeEl.textContent = formatBytes(file.size);
        fileInfo.style.display = 'flex';
        convertBtn.style.display = 'flex';
        dropzone.style.display = 'none';
    }

    function resetPptx() {
        selectedFile = null;
        fileInput.value = '';
        fileInfo.style.display = 'none';
        convertBtn.style.display = 'none';
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
        if (e.target.closest('#pptx2pdfSelectBtn')) return;
        fileInput.click();
    });
    fileInput.addEventListener('change', () => { if (fileInput.files.length) setFile(fileInput.files[0]); });
    removeBtn.addEventListener('click', resetPptx);

    // Convert action
    convertBtn.addEventListener('click', () => {
        if (!selectedFile) return;
        showStep(stepProcess);
        progressBar.style.width = '0%';
        progressText.textContent = 'Uploading…';

        const fd = new FormData();
        fd.append('file', selectedFile);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/pptx-to-pdf');
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
            progressText.textContent = 'Converting… this may take a moment';
        });
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const url = URL.createObjectURL(xhr.response);
                downloadBtn.href = url;
                downloadBtn.download = selectedFile.name.replace(/\.(ppt|pptx)$/i, '.pdf');
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

    anotherBtn.addEventListener('click', resetPptx);
    tryAgainBtn.addEventListener('click', resetPptx);
});

/* ═══════════════════════════════════════════════════════════════
   Excel to PDF — Upload .xls/.xlsx, convert via LibreOffice, download
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const workspace = document.getElementById('workspace-excel2pdf');
    if (!workspace) return;

    const dropzone = document.getElementById('excel2pdf-dropzone');
    const fileInput = document.getElementById('excel2pdfFileInput');
    const fileInfo = document.getElementById('excel2pdfFileInfo');
    const fileNameEl = document.getElementById('excel2pdfFileName');
    const fileSizeEl = document.getElementById('excel2pdfFileSize');
    const removeBtn = document.getElementById('excel2pdfRemoveFile');
    const convertBtn = document.getElementById('excel2pdfBtn');

    const stepUpload = document.getElementById('excel2pdf-step-upload');
    const stepProcess = document.getElementById('excel2pdf-step-processing');
    const stepDone = document.getElementById('excel2pdf-step-done');
    const stepError = document.getElementById('excel2pdf-step-error');

    const progressBar = document.getElementById('excel2pdfProgressBar');
    const progressText = document.getElementById('excel2pdfProgressText');
    const downloadBtn = document.getElementById('excel2pdfDownloadBtn');
    const anotherBtn = document.getElementById('excel2pdfAnotherBtn');
    const tryAgainBtn = document.getElementById('excel2pdfTryAgainBtn');
    const errorText = document.getElementById('excel2pdfErrorText');

    let selectedFile = null;

    function formatBytes(b) {
        if (b < 1024) return b + ' B';
        if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
        return (b / 1048576).toFixed(1) + ' MB';
    }

    function showStep(s) {
        [stepUpload, stepProcess, stepDone, stepError].forEach(el => el.classList.remove('active'));
        s.classList.add('active');
    }

    function setFile(file) {
        if (!file) return;
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (ext !== '.xls' && ext !== '.xlsx') return;
        if (file.size > 50 * 1024 * 1024) { alert('File too large.'); return; }
        selectedFile = file;
        fileNameEl.textContent = file.name;
        fileSizeEl.textContent = formatBytes(file.size);
        fileInfo.style.display = 'flex';
        convertBtn.style.display = 'flex';
        dropzone.style.display = 'none';
    }

    function resetExcel() {
        selectedFile = null;
        fileInput.value = '';
        fileInfo.style.display = 'none';
        convertBtn.style.display = 'none';
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
        if (e.target.closest('#excel2pdfSelectBtn')) return;
        fileInput.click();
    });
    fileInput.addEventListener('change', () => { if (fileInput.files.length) setFile(fileInput.files[0]); });
    removeBtn.addEventListener('click', resetExcel);

    // Convert action
    convertBtn.addEventListener('click', () => {
        if (!selectedFile) return;
        showStep(stepProcess);
        progressBar.style.width = '0%';
        progressText.textContent = 'Uploading…';

        const fd = new FormData();
        fd.append('file', selectedFile);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/excel-to-pdf');
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
            progressText.textContent = 'Converting… this may take a moment';
        });
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const url = URL.createObjectURL(xhr.response);
                downloadBtn.href = url;
                downloadBtn.download = selectedFile.name.replace(/\.(xls|xlsx)$/i, '.pdf');
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

    anotherBtn.addEventListener('click', resetExcel);
    tryAgainBtn.addEventListener('click', resetExcel);
});

/* ═══════════════════════════════════════════════════════════════
   HTML to PDF — Upload .html/.htm, convert via LibreOffice, download
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const workspace = document.getElementById('workspace-html2pdf');
    if (!workspace) return;

    const dropzone = document.getElementById('html2pdf-dropzone');
    const fileInput = document.getElementById('html2pdfFileInput');
    const fileInfo = document.getElementById('html2pdfFileInfo');
    const fileNameEl = document.getElementById('html2pdfFileName');
    const fileSizeEl = document.getElementById('html2pdfFileSize');
    const removeBtn = document.getElementById('html2pdfRemoveFile');
    const convertBtn = document.getElementById('html2pdfBtn');

    const stepUpload = document.getElementById('html2pdf-step-upload');
    const stepProcess = document.getElementById('html2pdf-step-processing');
    const stepDone = document.getElementById('html2pdf-step-done');
    const stepError = document.getElementById('html2pdf-step-error');

    const progressBar = document.getElementById('html2pdfProgressBar');
    const progressText = document.getElementById('html2pdfProgressText');
    const downloadBtn = document.getElementById('html2pdfDownloadBtn');
    const anotherBtn = document.getElementById('html2pdfAnotherBtn');
    const tryAgainBtn = document.getElementById('html2pdfTryAgainBtn');
    const errorText = document.getElementById('html2pdfErrorText');

    let selectedFile = null;

    function formatBytes(b) {
        if (b < 1024) return b + ' B';
        if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
        return (b / 1048576).toFixed(1) + ' MB';
    }

    function showStep(s) {
        [stepUpload, stepProcess, stepDone, stepError].forEach(el => el.classList.remove('active'));
        s.classList.add('active');
    }

    function setFile(file) {
        if (!file) return;
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (ext !== '.html' && ext !== '.htm') return;
        if (file.size > 50 * 1024 * 1024) { alert('File too large.'); return; }
        selectedFile = file;
        fileNameEl.textContent = file.name;
        fileSizeEl.textContent = formatBytes(file.size);
        fileInfo.style.display = 'flex';
        convertBtn.style.display = 'flex';
        dropzone.style.display = 'none';
    }

    function resetHtml() {
        selectedFile = null;
        fileInput.value = '';
        fileInfo.style.display = 'none';
        convertBtn.style.display = 'none';
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
        if (e.target.closest('#html2pdfSelectBtn')) return;
        fileInput.click();
    });
    fileInput.addEventListener('change', () => { if (fileInput.files.length) setFile(fileInput.files[0]); });
    removeBtn.addEventListener('click', resetHtml);

    // Convert action
    convertBtn.addEventListener('click', () => {
        if (!selectedFile) return;
        showStep(stepProcess);
        progressBar.style.width = '0%';
        progressText.textContent = 'Uploading…';

        const fd = new FormData();
        fd.append('file', selectedFile);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/html-to-pdf');
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
            progressText.textContent = 'Converting… this may take a moment';
        });
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const url = URL.createObjectURL(xhr.response);
                downloadBtn.href = url;
                downloadBtn.download = selectedFile.name.replace(/\.(html|htm)$/i, '.pdf');
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

    anotherBtn.addEventListener('click', resetHtml);
    tryAgainBtn.addEventListener('click', resetHtml);
});

/* ═══════════════════════════════════════════════════════════════
   CSV to PDF — Upload .csv, convert via LibreOffice, download
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const workspace = document.getElementById('workspace-csv2pdf');
    if (!workspace) return;

    const dropzone = document.getElementById('csv2pdf-dropzone');
    const fileInput = document.getElementById('csv2pdfFileInput');
    const fileInfo = document.getElementById('csv2pdfFileInfo');
    const fileNameEl = document.getElementById('csv2pdfFileName');
    const fileSizeEl = document.getElementById('csv2pdfFileSize');
    const removeBtn = document.getElementById('csv2pdfRemoveFile');
    const convertBtn = document.getElementById('csv2pdfBtn');

    const stepUpload = document.getElementById('csv2pdf-step-upload');
    const stepProcess = document.getElementById('csv2pdf-step-processing');
    const stepDone = document.getElementById('csv2pdf-step-done');
    const stepError = document.getElementById('csv2pdf-step-error');

    const progressBar = document.getElementById('csv2pdfProgressBar');
    const progressText = document.getElementById('csv2pdfProgressText');
    const downloadBtn = document.getElementById('csv2pdfDownloadBtn');
    const anotherBtn = document.getElementById('csv2pdfAnotherBtn');
    const tryAgainBtn = document.getElementById('csv2pdfTryAgainBtn');
    const errorText = document.getElementById('csv2pdfErrorText');

    let selectedFile = null;

    function formatBytes(b) {
        if (b < 1024) return b + ' B';
        if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
        return (b / 1048576).toFixed(1) + ' MB';
    }

    function showStep(s) {
        [stepUpload, stepProcess, stepDone, stepError].forEach(el => el.classList.remove('active'));
        s.classList.add('active');
    }

    function setFile(file) {
        if (!file) return;
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (ext !== '.csv') return;
        if (file.size > 50 * 1024 * 1024) { alert('File too large.'); return; }
        selectedFile = file;
        fileNameEl.textContent = file.name;
        fileSizeEl.textContent = formatBytes(file.size);
        fileInfo.style.display = 'flex';
        convertBtn.style.display = 'flex';
        dropzone.style.display = 'none';
    }

    function resetCsv() {
        selectedFile = null;
        fileInput.value = '';
        fileInfo.style.display = 'none';
        convertBtn.style.display = 'none';
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
        if (e.target.closest('#csv2pdfSelectBtn')) return;
        fileInput.click();
    });
    fileInput.addEventListener('change', () => { if (fileInput.files.length) setFile(fileInput.files[0]); });
    removeBtn.addEventListener('click', resetCsv);

    // Convert action
    convertBtn.addEventListener('click', () => {
        if (!selectedFile) return;
        showStep(stepProcess);
        progressBar.style.width = '0%';
        progressText.textContent = 'Uploading…';

        const fd = new FormData();
        fd.append('file', selectedFile);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/csv-to-pdf');
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
            progressText.textContent = 'Converting… this may take a moment';
        });
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const url = URL.createObjectURL(xhr.response);
                downloadBtn.href = url;
                downloadBtn.download = selectedFile.name.replace(/\.csv$/i, '.pdf');
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

    anotherBtn.addEventListener('click', resetCsv);
    tryAgainBtn.addEventListener('click', resetCsv);
});

/* ═══════════════════════════════════════════════════════════════
   PDF to Word — Upload .pdf, convert via LibreOffice, download .docx
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const workspace = document.getElementById('workspace-pdf2word');
    if (!workspace) return;

    const dropzone = document.getElementById('pdf2word-dropzone');
    const fileInput = document.getElementById('pdf2wordFileInput');
    const fileInfo = document.getElementById('pdf2wordFileInfo');
    const fileNameEl = document.getElementById('pdf2wordFileName');
    const fileSizeEl = document.getElementById('pdf2wordFileSize');
    const removeBtn = document.getElementById('pdf2wordRemoveFile');
    const convertBtn = document.getElementById('pdf2wordBtn');

    const stepUpload = document.getElementById('pdf2word-step-upload');
    const stepProcess = document.getElementById('pdf2word-step-processing');
    const stepDone = document.getElementById('pdf2word-step-done');
    const stepError = document.getElementById('pdf2word-step-error');

    const progressBar = document.getElementById('pdf2wordProgressBar');
    const progressText = document.getElementById('pdf2wordProgressText');
    const downloadBtn = document.getElementById('pdf2wordDownloadBtn');
    const anotherBtn = document.getElementById('pdf2wordAnotherBtn');
    const tryAgainBtn = document.getElementById('pdf2wordTryAgainBtn');
    const errorText = document.getElementById('pdf2wordErrorText');

    let selectedFile = null;

    function formatBytes(b) {
        if (b < 1024) return b + ' B';
        if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
        return (b / 1048576).toFixed(1) + ' MB';
    }

    function showStep(s) {
        [stepUpload, stepProcess, stepDone, stepError].forEach(el => el.classList.remove('active'));
        s.classList.add('active');
    }

    function setFile(file) {
        if (!file) return;
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (ext !== '.pdf') return;
        if (file.size > 50 * 1024 * 1024) { alert('File too large.'); return; }
        selectedFile = file;
        fileNameEl.textContent = file.name;
        fileSizeEl.textContent = formatBytes(file.size);
        fileInfo.style.display = 'flex';
        convertBtn.style.display = 'flex';
        dropzone.style.display = 'none';
    }

    function resetForm() {
        selectedFile = null;
        fileInput.value = '';
        fileInfo.style.display = 'none';
        convertBtn.style.display = 'none';
        dropzone.style.display = 'block';
        showStep(stepUpload);
    }

    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', e => {
        e.preventDefault(); dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length) setFile(e.dataTransfer.files[0]);
    });
    dropzone.addEventListener('click', e => {
        if (e.target.closest('#pdf2wordSelectBtn')) return;
        fileInput.click();
    });
    fileInput.addEventListener('change', () => { if (fileInput.files.length) setFile(fileInput.files[0]); });
    removeBtn.addEventListener('click', resetForm);

    convertBtn.addEventListener('click', () => {
        if (!selectedFile) return;
        showStep(stepProcess);
        progressBar.style.width = '0%';
        progressText.textContent = 'Uploading…';

        const fd = new FormData();
        fd.append('file', selectedFile);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/pdf-to-word');
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
            progressText.textContent = 'Converting… this may take a moment';
        });
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const url = URL.createObjectURL(xhr.response);
                downloadBtn.href = url;
                downloadBtn.download = selectedFile.name.replace(/\.pdf$/i, '.docx');
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

    anotherBtn.addEventListener('click', resetForm);
    tryAgainBtn.addEventListener('click', resetForm);
});

/* ═══════════════════════════════════════════════════════════════
   PDF to PowerPoint — Upload .pdf, convert via LibreOffice, download .pptx
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const workspace = document.getElementById('workspace-pdf2pptx');
    if (!workspace) return;

    const dropzone = document.getElementById('pdf2pptx-dropzone');
    const fileInput = document.getElementById('pdf2pptxFileInput');
    const fileInfo = document.getElementById('pdf2pptxFileInfo');
    const fileNameEl = document.getElementById('pdf2pptxFileName');
    const fileSizeEl = document.getElementById('pdf2pptxFileSize');
    const removeBtn = document.getElementById('pdf2pptxRemoveFile');
    const convertBtn = document.getElementById('pdf2pptxBtn');

    const stepUpload = document.getElementById('pdf2pptx-step-upload');
    const stepProcess = document.getElementById('pdf2pptx-step-processing');
    const stepDone = document.getElementById('pdf2pptx-step-done');
    const stepError = document.getElementById('pdf2pptx-step-error');

    const progressBar = document.getElementById('pdf2pptxProgressBar');
    const progressText = document.getElementById('pdf2pptxProgressText');
    const downloadBtn = document.getElementById('pdf2pptxDownloadBtn');
    const anotherBtn = document.getElementById('pdf2pptxAnotherBtn');
    const tryAgainBtn = document.getElementById('pdf2pptxTryAgainBtn');
    const errorText = document.getElementById('pdf2pptxErrorText');

    let selectedFile = null;

    function formatBytes(b) {
        if (b < 1024) return b + ' B';
        if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
        return (b / 1048576).toFixed(1) + ' MB';
    }

    function showStep(s) {
        [stepUpload, stepProcess, stepDone, stepError].forEach(el => el.classList.remove('active'));
        s.classList.add('active');
    }

    function setFile(file) {
        if (!file) return;
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (ext !== '.pdf') return;
        if (file.size > 50 * 1024 * 1024) { alert('File too large.'); return; }
        selectedFile = file;
        fileNameEl.textContent = file.name;
        fileSizeEl.textContent = formatBytes(file.size);
        fileInfo.style.display = 'flex';
        convertBtn.style.display = 'flex';
        dropzone.style.display = 'none';
    }

    function resetForm() {
        selectedFile = null;
        fileInput.value = '';
        fileInfo.style.display = 'none';
        convertBtn.style.display = 'none';
        dropzone.style.display = 'block';
        showStep(stepUpload);
    }

    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', e => {
        e.preventDefault(); dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length) setFile(e.dataTransfer.files[0]);
    });
    dropzone.addEventListener('click', e => {
        if (e.target.closest('#pdf2pptxSelectBtn')) return;
        fileInput.click();
    });
    fileInput.addEventListener('change', () => { if (fileInput.files.length) setFile(fileInput.files[0]); });
    removeBtn.addEventListener('click', resetForm);

    convertBtn.addEventListener('click', () => {
        if (!selectedFile) return;
        showStep(stepProcess);
        progressBar.style.width = '0%';
        progressText.textContent = 'Uploading…';

        const fd = new FormData();
        fd.append('file', selectedFile);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/pdf-to-pptx');
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
            progressText.textContent = 'Converting… this may take a moment';
        });
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const url = URL.createObjectURL(xhr.response);
                downloadBtn.href = url;
                downloadBtn.download = selectedFile.name.replace(/\.pdf$/i, '.pptx');
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

    anotherBtn.addEventListener('click', resetForm);
    tryAgainBtn.addEventListener('click', resetForm);
});

/* ═══════════════════════════════════════════════════════════════
   PDF to Excel — Upload .pdf, convert via LibreOffice, download .xlsx
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const workspace = document.getElementById('workspace-pdf2excel');
    if (!workspace) return;

    const dropzone = document.getElementById('pdf2excel-dropzone');
    const fileInput = document.getElementById('pdf2excelFileInput');
    const fileInfo = document.getElementById('pdf2excelFileInfo');
    const fileNameEl = document.getElementById('pdf2excelFileName');
    const fileSizeEl = document.getElementById('pdf2excelFileSize');
    const removeBtn = document.getElementById('pdf2excelRemoveFile');
    const convertBtn = document.getElementById('pdf2excelBtn');

    const stepUpload = document.getElementById('pdf2excel-step-upload');
    const stepProcess = document.getElementById('pdf2excel-step-processing');
    const stepDone = document.getElementById('pdf2excel-step-done');
    const stepError = document.getElementById('pdf2excel-step-error');

    const progressBar = document.getElementById('pdf2excelProgressBar');
    const progressText = document.getElementById('pdf2excelProgressText');
    const downloadBtn = document.getElementById('pdf2excelDownloadBtn');
    const anotherBtn = document.getElementById('pdf2excelAnotherBtn');
    const tryAgainBtn = document.getElementById('pdf2excelTryAgainBtn');
    const errorText = document.getElementById('pdf2excelErrorText');

    let selectedFile = null;

    function formatBytes(b) {
        if (b < 1024) return b + ' B';
        if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
        return (b / 1048576).toFixed(1) + ' MB';
    }

    function showStep(s) {
        [stepUpload, stepProcess, stepDone, stepError].forEach(el => el.classList.remove('active'));
        s.classList.add('active');
    }

    function setFile(file) {
        if (!file) return;
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (ext !== '.pdf') return;
        if (file.size > 50 * 1024 * 1024) { alert('File too large.'); return; }
        selectedFile = file;
        fileNameEl.textContent = file.name;
        fileSizeEl.textContent = formatBytes(file.size);
        fileInfo.style.display = 'flex';
        convertBtn.style.display = 'flex';
        dropzone.style.display = 'none';
    }

    function resetForm() {
        selectedFile = null;
        fileInput.value = '';
        fileInfo.style.display = 'none';
        convertBtn.style.display = 'none';
        dropzone.style.display = 'block';
        showStep(stepUpload);
    }

    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', e => {
        e.preventDefault(); dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length) setFile(e.dataTransfer.files[0]);
    });
    dropzone.addEventListener('click', e => {
        if (e.target.closest('#pdf2excelSelectBtn')) return;
        fileInput.click();
    });
    fileInput.addEventListener('change', () => { if (fileInput.files.length) setFile(fileInput.files[0]); });
    removeBtn.addEventListener('click', resetForm);

    convertBtn.addEventListener('click', () => {
        if (!selectedFile) return;
        showStep(stepProcess);
        progressBar.style.width = '0%';
        progressText.textContent = 'Uploading…';

        const fd = new FormData();
        fd.append('file', selectedFile);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/pdf-to-excel');
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
            progressText.textContent = 'Converting… this may take a moment';
        });
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const url = URL.createObjectURL(xhr.response);
                downloadBtn.href = url;
                downloadBtn.download = selectedFile.name.replace(/\.pdf$/i, '.xlsx');
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

    anotherBtn.addEventListener('click', resetForm);
    tryAgainBtn.addEventListener('click', resetForm);
});

/* ═══════════════════════════════════════════════════════════════
   PDF to CSV — Upload .pdf, convert via LibreOffice, download .csv
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const workspace = document.getElementById('workspace-pdf2csv');
    if (!workspace) return;

    const dropzone = document.getElementById('pdf2csv-dropzone');
    const fileInput = document.getElementById('pdf2csvFileInput');
    const fileInfo = document.getElementById('pdf2csvFileInfo');
    const fileNameEl = document.getElementById('pdf2csvFileName');
    const fileSizeEl = document.getElementById('pdf2csvFileSize');
    const removeBtn = document.getElementById('pdf2csvRemoveFile');
    const convertBtn = document.getElementById('pdf2csvBtn');

    const stepUpload = document.getElementById('pdf2csv-step-upload');
    const stepProcess = document.getElementById('pdf2csv-step-processing');
    const stepDone = document.getElementById('pdf2csv-step-done');
    const stepError = document.getElementById('pdf2csv-step-error');

    const progressBar = document.getElementById('pdf2csvProgressBar');
    const progressText = document.getElementById('pdf2csvProgressText');
    const downloadBtn = document.getElementById('pdf2csvDownloadBtn');
    const anotherBtn = document.getElementById('pdf2csvAnotherBtn');
    const tryAgainBtn = document.getElementById('pdf2csvTryAgainBtn');
    const errorText = document.getElementById('pdf2csvErrorText');

    let selectedFile = null;

    function formatBytes(b) {
        if (b < 1024) return b + ' B';
        if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
        return (b / 1048576).toFixed(1) + ' MB';
    }

    function showStep(s) {
        [stepUpload, stepProcess, stepDone, stepError].forEach(el => el.classList.remove('active'));
        s.classList.add('active');
    }

    function setFile(file) {
        if (!file) return;
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (ext !== '.pdf') return;
        if (file.size > 50 * 1024 * 1024) { alert('File too large.'); return; }
        selectedFile = file;
        fileNameEl.textContent = file.name;
        fileSizeEl.textContent = formatBytes(file.size);
        fileInfo.style.display = 'flex';
        convertBtn.style.display = 'flex';
        dropzone.style.display = 'none';
    }

    function resetForm() {
        selectedFile = null;
        fileInput.value = '';
        fileInfo.style.display = 'none';
        convertBtn.style.display = 'none';
        dropzone.style.display = 'block';
        showStep(stepUpload);
    }

    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', e => {
        e.preventDefault(); dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length) setFile(e.dataTransfer.files[0]);
    });
    dropzone.addEventListener('click', e => {
        if (e.target.closest('#pdf2csvSelectBtn')) return;
        fileInput.click();
    });
    fileInput.addEventListener('change', () => { if (fileInput.files.length) setFile(fileInput.files[0]); });
    removeBtn.addEventListener('click', resetForm);

    convertBtn.addEventListener('click', () => {
        if (!selectedFile) return;
        showStep(stepProcess);
        progressBar.style.width = '0%';
        progressText.textContent = 'Uploading…';

        const fd = new FormData();
        fd.append('file', selectedFile);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/pdf-to-csv');
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
            progressText.textContent = 'Converting… this may take a moment';
        });
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const url = URL.createObjectURL(xhr.response);
                downloadBtn.href = url;
                downloadBtn.download = selectedFile.name.replace(/\.pdf$/i, '.csv');
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

    anotherBtn.addEventListener('click', resetForm);
    tryAgainBtn.addEventListener('click', resetForm);
});
