// Receipt PNG Export & iOS Share Sheet Manager

function validateReceiptBeforeExport(els, billRows) {
  const missing = [];

  const timeVal = els.inTime.value.trim();
  if (!timeVal || timeVal.length < 5) {
    missing.push('• Time (full 4 digits)');
  }

  const serialVal = els.inSerial.value.trim();
  if (!serialVal || serialVal.length < 4) {
    missing.push('• Serial Number (4 digits)');
  }

  const hasCompleteBillRow = billRows.some((row) => {
    const qty = parseInt(String(row.qty).replace(/\D/g, ''), 10) || 0;
    const denom = String(row.denom).trim();
    return qty > 0 && denom !== '';
  });

  if (!hasCompleteBillRow) {
    missing.push('• At least 1 bill row (Qty and Bill)');
  }

  if (missing.length > 0) {
    alert(`Please complete the following before downloading:\n\n${missing.join('\n')}`);
    return false;
  }

  return true;
}

function getReceiptFileName(els) {
  const amountStr = els.outTotalDeposit.textContent || '$25.00';
  const rawDate = els.inDate.value.trim().replace(/\//g, '-');
  return `Receipt_${rawDate}_${amountStr}.png`;
}

async function captureReceiptCanvas(receiptCanvas, mode) {
  const wasDark = document.documentElement.classList.contains('dark');
  receiptCanvas.classList.add('receipt-exporting');
  if (wasDark) document.documentElement.classList.remove('dark');

  const options = {
    pixelRatio: 1,
    backgroundColor: '#FFFFFF',
    cacheBust: true,
    style: { filter: 'none' }
  };

  try {
    if (mode === 'blob') {
      return await window.htmlToImage.toBlob(receiptCanvas, options);
    }
    return await window.htmlToImage.toPng(receiptCanvas, options);
  } finally {
    if (wasDark) document.documentElement.classList.add('dark');
    receiptCanvas.classList.remove('receipt-exporting');
  }
}

function bindReceiptExportActions(els, getBillRows) {
  // Download PNG Button
  els.downloadPngBtn.addEventListener('click', async () => {
    if (!validateReceiptBeforeExport(els, getBillRows())) return;

    const originalText = els.downloadPngBtn.textContent;
    try {
      els.downloadPngBtn.textContent = 'Exporting...';
      const dataUrl = await captureReceiptCanvas(els.receiptCanvas, 'png');

      const link = document.createElement('a');
      link.download = getReceiptFileName(els);
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('PNG Export failed:', err);
    } finally {
      els.downloadPngBtn.textContent = originalText;
    }
  });

  // Save to Photos Button (Native iOS Share Sheet -> Save Image)
  els.savePhotosBtn.addEventListener('click', async () => {
    if (!validateReceiptBeforeExport(els, getBillRows())) return;

    const originalText = els.savePhotosBtn.textContent;
    try {
      els.savePhotosBtn.textContent = 'Saving...';
      const blob = await captureReceiptCanvas(els.receiptCanvas, 'blob');

      if (!blob) {
        throw new Error('Failed to generate PNG blob.');
      }

      const fileName = getReceiptFileName(els);
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: fileName
        });
      } else if (navigator.share) {
        await navigator.share({
          files: [file]
        });
      } else {
        alert('Native Share to Photos is not supported in this browser or context (requires HTTPS or iOS Safari). Use "Download PNG" instead.');
      }
    } catch (err) {
      if (err && err.name !== 'AbortError') {
        console.error('Save to Photos failed:', err);
        alert(`Could not open Share Sheet: ${err.message || err}`);
      }
    } finally {
      els.savePhotosBtn.textContent = originalText;
    }
  });
}

