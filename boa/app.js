function getTodayYMD() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateForReceipt(ymdString) {
  if (!ymdString) return '';
  const parts = ymdString.split('-');
  if (parts.length !== 3) return ymdString;
  const [year, month, day] = parts;
  const shortYear = year.slice(-2);
  return `${month}/${day}/${shortYear}`;
}



let billRows = [
  { qty: '', denom: '' }
];

// DOM References
const els = {
  inDate: document.getElementById('inDate'),
  inTime: document.getElementById('inTime'),
  inAtmId: document.getElementById('inAtmId'),
  inLoc1: document.getElementById('inLoc1'),
  inCity: document.getElementById('inCity'),
  inState: document.getElementById('inState'),
  inCardLast4: document.getElementById('inCardLast4'),
  inAcct1: document.getElementById('inAcct1'),
  inAcct2: document.getElementById('inAcct2'),
  inPostsOn: document.getElementById('inPostsOn'),
  inSerial: document.getElementById('inSerial'),
  displayTotal: document.getElementById('displayTotal'),
  billRowsContainer: document.getElementById('billRowsContainer'),
  addBillRowBtn: document.getElementById('addBillRowBtn'),
  downloadPngBtn: document.getElementById('downloadPngBtn'),
  receiptCanvas: document.getElementById('receiptCanvas'),

  // Receipt Output Nodes
  outDate: document.getElementById('outDate'),
  outTime: document.getElementById('outTime'),
  outAtmId: document.getElementById('outAtmId'),
  outLoc1: document.getElementById('outLoc1'),
  outCity: document.getElementById('outCity'),
  outState: document.getElementById('outState'),
  outCard: document.getElementById('outCard'),
  outAcct1: document.getElementById('outAcct1'),
  outAcct2: document.getElementById('outAcct2'),
  outTotalDeposit: document.getElementById('outTotalDeposit'),
  outPostsOn: document.getElementById('outPostsOn'),
  outAvailableNow: document.getElementById('outAvailableNow'),
  outCashAmount: document.getElementById('outCashAmount'),
  outBillRows: document.getElementById('outBillRows'),
  outSerial: document.getElementById('outSerial')
};

function formatCurrency(val) {
  const num = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
  if (isNaN(num)) return '$0.00';
  return '$' + num.toFixed(2);
}

const VALID_DENOMINATIONS = [1, 5, 10, 20, 50, 100];
const BILL_OPTIONS = ['1', '5', '10', '20', '50'];

function renderBillRowInputs() {
  els.billRowsContainer.innerHTML = '';

  billRows.forEach((row, idx) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center gap-2';

    const billButtonsHtml = BILL_OPTIONS.map((val) => {
      const active = String(row.denom) === val;
      return `<button type="button" data-bill-val="${val}" class="flex-1 py-1.5 rounded-lg text-base font-semibold transition text-center cursor-pointer ${active
        ? 'theme-btn-active shadow-sm'
        : 'text-[var(--text-main)] hover:bg-blue-600/15'
        }">${val}</button>`;
    }).join('');

    wrapper.innerHTML = `
      <div class="w-20">
        <label class="block text-xs mb-1 font-medium">Qty</label>
        <input type="text" inputmode="numeric" pattern="[0-9]*" value="${row.qty}" data-idx="${idx}" data-field="qty" class="form-input text-xl rounded-lg p-2" />
      </div>

      <div class="flex-1">
        <label class="block text-xs mb-1 font-medium">Bill</label>
        <div class="inline-flex rounded-lg p-1 border border-[var(--border-input)] bg-[var(--bg-sidebar)] w-full justify-between gap-1">
          ${billButtonsHtml}
        </div>
      </div>

      <button type="button" data-remove="${idx}" class="mt-5 px-4 py-2 text-xl rounded-xl hover:bg-red-500/25 text-red-500 border-0 transition cursor-pointer" title="Remove row">
        ✕
      </button>
    `;

    // Bind quantity input
    const qtyInput = wrapper.querySelector('input[data-field="qty"]');
    qtyInput.addEventListener('input', (e) => {
      const cleaned = e.target.value.replace(/\D/g, '');
      e.target.value = cleaned;
      billRows[idx].qty = cleaned;
      updateReceipt();
    });

    // Bind bill buttons
    wrapper.querySelectorAll('[data-bill-val]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const val = e.currentTarget.dataset.billVal;
        billRows[idx].denom = (billRows[idx].denom === val) ? '' : val;
        renderBillRowInputs();
        updateReceipt();
      });
    });

    // Bind remove button
    wrapper.querySelector('button[data-remove]').addEventListener('click', () => {
      billRows.splice(idx, 1);
      renderBillRowInputs();
      updateReceipt();
    });

    els.billRowsContainer.appendChild(wrapper);
  });
}

function updateReceipt() {
  const formattedDate = formatDateForReceipt(els.inDate.value);
  const formattedPostsOn = formatDateForReceipt(els.inPostsOn.value);

  els.outDate.textContent = formattedDate;
  els.outTime.textContent = els.inTime.value;
  els.outAtmId.textContent = els.inAtmId.value;
  els.outLoc1.textContent = els.inLoc1.value;
  els.outCity.textContent = els.inCity.value;
  els.outState.textContent = els.inState.value;

  const last4 = els.inCardLast4.value.trim();
  els.outCard.textContent = `XXXXXXXX${last4}`;

  els.outAcct1.textContent = els.inAcct1.value;
  els.outAcct2.textContent = els.inAcct2.value;
  els.outPostsOn.textContent = formattedPostsOn;

  const serial = els.inSerial.value.trim();
  els.outSerial.textContent = serial ? `Ser. No. ${serial}` : '';

  // Render dynamic bill breakdown rows & calculate sum
  els.outBillRows.innerHTML = '';
  let totalAmount = 0;
  let hasValidBills = false;

  billRows.forEach((row) => {
    const qty = parseInt(String(row.qty).replace(/\D/g, ''), 10) || 0;
    const denomNum = parseInt(String(row.denom).replace(/\D/g, ''), 10) || 0;

    // Only include valid standard bills in receipt & calculation
    if (VALID_DENOMINATIONS.includes(denomNum) && qty > 0) {
      const rowSum = qty * denomNum;
      totalAmount += rowSum;
      hasValidBills = true;

      const rowEl = document.createElement('div');
      rowEl.className = 'receipt-bill-row';
      rowEl.innerHTML = `<span class="receipt-bill-left"><span class="receipt-bill-qty">${qty}</span><span class="receipt-bill-x">x</span><span>${formatCurrency(denomNum)}</span></span><span>${formatCurrency(rowSum)}</span>`;
      els.outBillRows.appendChild(rowEl);
    }
  });

  const formattedTotal = hasValidBills ? formatCurrency(totalAmount) : '';
  els.displayTotal.textContent = formattedTotal;
  els.outTotalDeposit.textContent = formattedTotal;
  els.outAvailableNow.textContent = formattedTotal;
  els.outCashAmount.textContent = formattedTotal;
}

// Time Input: Numbers only, 4 digits max, auto-colon after 2 digits, numeric keypad on mobile
let isTimeDeleting = false;

els.inTime.addEventListener('keydown', (e) => {
  if (['Backspace', 'Delete'].includes(e.key)) {
    isTimeDeleting = true;
    return;
  }
  isTimeDeleting = false;

  // Allow navigation and shortcut keys (Tab, Esc, Enter, Arrows, Cmd/Ctrl+A/C/V/X, etc.)
  if (
    ['Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key) ||
    e.ctrlKey || e.metaKey
  ) {
    return;
  }

  // Block any non-digit character on desktop
  if (!/^\d$/.test(e.key)) {
    e.preventDefault();
  }
});

els.inTime.addEventListener('input', (e) => {
  const isDelete = isTimeDeleting || e.inputType === 'deleteContentBackward' || e.inputType === 'deleteContentForward';
  const rawValue = els.inTime.value;
  let digits = rawValue.replace(/\D/g, '').slice(0, 4);

  if (digits.length === 0) {
    els.inTime.value = '';
  } else if (digits.length === 1) {
    els.inTime.value = digits;
  } else if (digits.length === 2) {
    if (isDelete && !rawValue.includes(':')) {
      els.inTime.value = digits.slice(0, 1);
    } else {
      let hours = parseInt(digits, 10);
      if (hours > 23) hours = 23;
      const hh = String(hours).padStart(2, '0');
      els.inTime.value = hh + ':';
    }
  } else {
    let hours = parseInt(digits.slice(0, 2), 10);
    if (hours > 23) hours = 23;
    const hh = String(hours).padStart(2, '0');

    let mm = digits.slice(2);
    if (mm.length === 2) {
      let mins = parseInt(mm, 10);
      if (mins > 59) mins = 59;
      mm = String(mins).padStart(2, '0');
    }
    els.inTime.value = `${hh}:${mm}`;
  }

  isTimeDeleting = false;
  updateReceipt();
});

// Event Listeners for standard inputs
els.inDate.addEventListener('input', () => {
  els.inPostsOn.value = els.inDate.value;
  updateReceipt();
});

// ATM ID Input: Alphanumeric only, uppercase, max 8 characters
els.inAtmId.addEventListener('input', () => {
  els.inAtmId.value = els.inAtmId.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  updateReceipt();
});

// Serial Number Input: Digits only, max 4 characters
els.inSerial.addEventListener('input', () => {
  els.inSerial.value = els.inSerial.value.replace(/\D/g, '').slice(0, 4);
  updateReceipt();
});

[
  els.inLoc1,
  els.inCity,
  els.inState,
  els.inCardLast4,
  els.inAcct1,
  els.inAcct2,
  els.inPostsOn
].forEach((input) => {
  input.addEventListener('input', updateReceipt);
});

// Add Bill Row Button
els.addBillRowBtn.addEventListener('click', () => {
  billRows.push({ qty: '', denom: '' });
  renderBillRowInputs();
  updateReceipt();
});

// Download PNG Button
els.downloadPngBtn.addEventListener('click', async () => {
  // Validate required fields before download
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
    return;
  }

  const originalText = els.downloadPngBtn.textContent;
  const wasDark = document.documentElement.classList.contains('dark');
  try {
    els.downloadPngBtn.textContent = 'Exporting...';
    els.receiptCanvas.classList.add('receipt-exporting');
    if (wasDark) document.documentElement.classList.remove('dark');

    const dataUrl = await window.htmlToImage.toPng(els.receiptCanvas, {
      pixelRatio: 1,
      backgroundColor: '#FFFFFF',
      cacheBust: true,
      style: { filter: 'none' }
    });

    const link = document.createElement('a');
    const amountStr = els.outTotalDeposit.textContent || '$25.00';
    const rawDate = els.inDate.value.trim().replace(/\//g, '-');
    link.download = `Receipt_${rawDate}_${amountStr}.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('PNG Export failed:', err);
  } finally {
    if (wasDark) document.documentElement.classList.add('dark');
    els.receiptCanvas.classList.remove('receipt-exporting');
    els.downloadPngBtn.textContent = originalText;
  }
});

// Direct Receipt Copy Editing Switcher (Locked / Editable)
const editModeBtns = document.querySelectorAll('[data-edit-mode]');
const editableNodes = document.querySelectorAll('[data-editable]');

function setReceiptEditMode(mode) {
  const isEditable = mode === 'editable';
  editableNodes.forEach((node) => {
    node.setAttribute('contenteditable', isEditable ? 'true' : 'false');
  });

  editModeBtns.forEach((btn) => {
    const active = btn.dataset.editMode === mode;
    btn.classList.toggle('theme-btn-active', active);
    btn.classList.toggle('text-[var(--text-muted)]', !active);
  });
}

editModeBtns.forEach((btn) => {
  btn.addEventListener('click', () => setReceiptEditMode(btn.dataset.editMode));
});

// Initialize
els.inDate.value = getTodayYMD();
els.inPostsOn.value = getTodayYMD();
renderBillRowInputs();
updateReceipt();
