// Receipt Form State, Bill Breakdown & Live Canvas Sync

const VALID_DENOMINATIONS = [1, 5, 10, 20, 50, 100];
const BILL_OPTIONS = ['1', '5', '10', '20', '50'];

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
  savePhotosBtn: document.getElementById('savePhotosBtn'),
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

// Wire Input Masks
bindTimeInputMask(els.inTime, updateReceipt);
bindAtmIdInputMask(els.inAtmId, updateReceipt);
bindSerialInputMask(els.inSerial, updateReceipt);

// Event Listeners for standard inputs
els.inDate.addEventListener('input', () => {
  els.inPostsOn.value = els.inDate.value;
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

// Wire Export Buttons (Download PNG & Save to Photos)
bindReceiptExportActions(els, () => billRows);

// Initialize
els.inDate.value = getTodayYMD();
els.inPostsOn.value = getTodayYMD();
renderBillRowInputs();
updateReceipt();
