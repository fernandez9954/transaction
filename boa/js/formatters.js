// Pure Formatting Helpers & Input Masks

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

function formatCurrency(val) {
  const num = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
  if (isNaN(num)) return '$0.00';
  return '$' + num.toFixed(2);
}

// Time Input: Numbers only, 4 digits max, auto-colon after 2 digits, numeric keypad on mobile
function bindTimeInputMask(timeInput, onUpdate) {
  let isTimeDeleting = false;

  timeInput.addEventListener('keydown', (e) => {
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

  timeInput.addEventListener('input', (e) => {
    const isDelete = isTimeDeleting || e.inputType === 'deleteContentBackward' || e.inputType === 'deleteContentForward';
    const rawValue = timeInput.value;
    const digits = rawValue.replace(/\D/g, '').slice(0, 4);

    if (digits.length === 0) {
      timeInput.value = '';
    } else if (digits.length === 1) {
      timeInput.value = digits;
    } else if (digits.length === 2) {
      if (isDelete && !rawValue.includes(':')) {
        timeInput.value = digits.slice(0, 1);
      } else {
        let hours = parseInt(digits, 10);
        if (hours > 23) hours = 23;
        const hh = String(hours).padStart(2, '0');
        timeInput.value = hh + ':';
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
      timeInput.value = `${hh}:${mm}`;
    }

    isTimeDeleting = false;
    onUpdate();
  });
}

// ATM ID Input: Alphanumeric only, uppercase, max 8 characters
function bindAtmIdInputMask(atmIdInput, onUpdate) {
  atmIdInput.addEventListener('input', () => {
    atmIdInput.value = atmIdInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    onUpdate();
  });
}

// Serial Number Input: Digits only, max 4 characters
function bindSerialInputMask(serialInput, onUpdate) {
  serialInput.addEventListener('input', () => {
    serialInput.value = serialInput.value.replace(/\D/g, '').slice(0, 4);
    onUpdate();
  });
}

