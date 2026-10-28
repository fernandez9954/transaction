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

// Default State matching Receipt layout, initialized to today
const DEFAULT_STATE = {
  date: getTodayYMD(),
  time: '',
  atmId: 'IFLN1752',
  loc1: '*PREMBROKE PINES',
  city: 'PEMBROKE PINE',
  state: 'FL',
  cardLast4: '3688',
  acct1: 'PRIMARY',
  acct2: 'Checking',
  postsOn: getTodayYMD(),
  serial: '',
  manualTotal: '25.00',
  billRows: [
    { qty: 1, denom: '5.00' },
    { qty: 1, denom: '20.00' }
  ]
};

let billRows = DEFAULT_STATE.billRows.map((r) => ({ ...r }));

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
  inManualTotal: document.getElementById('inManualTotal'),
  calcModeBadge: document.getElementById('calcModeBadge'),
  billRowsContainer: document.getElementById('billRowsContainer'),
  addBillRowBtn: document.getElementById('addBillRowBtn'),
  resetBtn: document.getElementById('resetBtn'),
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

function renderBillRowInputs() {
  els.billRowsContainer.innerHTML = '';

  billRows.forEach((row, idx) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center gap-2 app-card p-2 rounded';

    wrapper.innerHTML = `
      <div class="w-20">
        <label class="block text-[10px] app-muted">Qty</label>
        <input type="number" min="0" step="1" value="${row.qty}" data-idx="${idx}" data-field="qty" class="form-input text-xs py-1" />
      </div>
      <div class="app-muted text-xs pt-3">×</div>
      <div class="flex-1">
        <label class="block text-[10px] app-muted">Denomination ($)</label>
        <input type="text" value="${row.denom}" data-idx="${idx}" data-field="denom" class="form-input text-xs py-1" />
      </div>
      <button type="button" data-remove="${idx}" class="mt-3 px-2 py-1 text-xs rounded bg-red-500/15 hover:bg-red-500/25 text-red-500 border border-red-500/30 transition cursor-pointer">
        ✕
      </button>
    `;
    els.billRowsContainer.appendChild(wrapper);
  });

  // Bind input events
  els.billRowsContainer.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', (e) => {
      const idx = Number(e.target.dataset.idx);
      const field = e.target.dataset.field;
      billRows[idx][field] = e.target.value;
      updateReceipt();
    });
  });

  // Bind remove events
  els.billRowsContainer.querySelectorAll('button[data-remove]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const idx = Number(e.currentTarget.dataset.remove);
      billRows.splice(idx, 1);
      renderBillRowInputs();
      updateReceipt();
    });
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
  els.outSerial.textContent = `Ser. No. ${serial || '????'}`;

  // Render dynamic bill breakdown rows & calculate sum
  els.outBillRows.innerHTML = '';
  let totalAmount = 0;

  if (billRows.length > 0) {
    billRows.forEach((row) => {
      const qty = parseInt(row.qty, 10) || 0;
      const denom = parseFloat(String(row.denom).replace(/[^0-9.-]/g, '')) || 0;
      const rowSum = qty * denom;
      totalAmount += rowSum;

      const rowEl = document.createElement('div');
      rowEl.className = 'receipt-bill-row';
      rowEl.innerHTML = `<span class="receipt-bill-left"><span class="receipt-bill-qty">${qty}</span><span class="receipt-bill-x">x</span><span>${formatCurrency(denom)}</span></span><span>${formatCurrency(rowSum)}</span>`;
      els.outBillRows.appendChild(rowEl);
    });

    els.inManualTotal.value = totalAmount.toFixed(2);
    els.inManualTotal.disabled = true;
    els.inManualTotal.classList.add('opacity-60', 'cursor-not-allowed');
    els.calcModeBadge.textContent = `Auto-Sum (${billRows.length} row${billRows.length > 1 ? 's' : ''})`;
  } else {
    els.inManualTotal.disabled = false;
    els.inManualTotal.classList.remove('opacity-60', 'cursor-not-allowed');
    els.calcModeBadge.textContent = 'Manual (0 Bill Rows)';
    totalAmount = parseFloat(String(els.inManualTotal.value).replace(/[^0-9.-]/g, '')) || 0;
  }

  const formattedTotal = formatCurrency(totalAmount);
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
      els.inTime.value = digits + ':';
    }
  } else {
    els.inTime.value = digits.slice(0, 2) + ':' + digits.slice(2);
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
  els.inPostsOn,
  els.inManualTotal
].forEach((input) => {
  input.addEventListener('input', updateReceipt);
});

// Add Bill Row Button
els.addBillRowBtn.addEventListener('click', () => {
  const defaultDenom = billRows.length === 0 ? '5.00' : '20.00';
  billRows.push({ qty: 1, denom: defaultDenom });
  renderBillRowInputs();
  updateReceipt();
});

// Reset Default Button
els.resetBtn.addEventListener('click', () => {
  els.inDate.value = DEFAULT_STATE.date;
  els.inTime.value = DEFAULT_STATE.time;
  els.inAtmId.value = DEFAULT_STATE.atmId;
  els.inLoc1.value = DEFAULT_STATE.loc1;
  els.inCity.value = DEFAULT_STATE.city;
  els.inState.value = DEFAULT_STATE.state;
  els.inCardLast4.value = DEFAULT_STATE.cardLast4;
  els.inAcct1.value = DEFAULT_STATE.acct1;
  els.inAcct2.value = DEFAULT_STATE.acct2;
  els.inPostsOn.value = DEFAULT_STATE.postsOn;
  els.inSerial.value = DEFAULT_STATE.serial;
  els.inManualTotal.value = DEFAULT_STATE.manualTotal;
  billRows = DEFAULT_STATE.billRows.map((r) => ({ ...r }));
  renderBillRowInputs();
  updateReceipt();
});

// Download PNG Button
els.downloadPngBtn.addEventListener('click', async () => {
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

// Initialize
els.inDate.value = DEFAULT_STATE.date;
els.inPostsOn.value = DEFAULT_STATE.postsOn;
renderBillRowInputs();
updateReceipt();
