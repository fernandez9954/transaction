// 1. Initialize Date
document.getElementById('dateInput').valueAsDate = new Date();

// 2. Setup Signature Pad & Variables
const canvas = document.getElementById('sigPad');
const ctx = canvas.getContext('2d');
const placeholder = document.getElementById('sigPlaceholder');
let drawing = false;
let hasSignature = false;

function resizeCanvas() { 
  canvas.width = canvas.offsetWidth; 
  canvas.height = canvas.offsetHeight; 
}
window.onload = resizeCanvas;
window.onresize = resizeCanvas;

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return { x: clientX - rect.left, y: clientY - rect.top };
}

const startDraw = (e) => { 
  e.preventDefault(); 
  drawing = true; 
  hasSignature = true; 
  placeholder.style.display = 'none'; 
  const pos = getPos(e); 
  
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#0058bc'; 

  ctx.beginPath(); 
  ctx.moveTo(pos.x, pos.y); 
};

const draw = (e) => { 
  if (!drawing) return; 
  e.preventDefault(); 
  const pos = getPos(e); 
  ctx.lineTo(pos.x, pos.y); 
  ctx.stroke(); 
};

const stopDraw = (e) => { 
  e.preventDefault(); 
  drawing = false; 
};

function clearSig() { 
  ctx.clearRect(0, 0, canvas.width, canvas.height); 
  hasSignature = false; 
  placeholder.style.display = 'block'; 
}

canvas.addEventListener('mousedown', startDraw); 
canvas.addEventListener('mousemove', draw); 
canvas.addEventListener('mouseup', stopDraw); 
canvas.addEventListener('mouseout', stopDraw);

canvas.addEventListener('touchstart', startDraw, {passive: false}); 
canvas.addEventListener('touchmove', draw, {passive: false}); 
canvas.addEventListener('touchend', stopDraw);

// 3. Engine Core: Generate Final Image
function generateImage() {
  if (!hasSignature) {
    alert("Please provide a signature before generating the record.");
    return;
  }

  document.getElementById('genBtn').innerText = "Generating...";
  
  const bgImg = new Image();
  bgImg.onload = function() {
    const outCanvas = document.createElement('canvas');
    outCanvas.width = bgImg.width; outCanvas.height = bgImg.height;
    const oCtx = outCanvas.getContext('2d');

    oCtx.drawImage(bgImg, 0, 0);
    oCtx.font = "26px Arial"; oCtx.fillStyle = "black";

    const dateVal = document.getElementById('dateInput').value;
    const dParts = dateVal.split('-'); 
    const formattedDate = `${dParts[1]}/${dParts[2]}/${dParts[0].slice(-2)}`;

    const ww = parseFloat(document.getElementById('wwInput').value) || 0;
    const local = parseFloat(document.getElementById('localInput').value) || 0;
    const total = ww + local;

    oCtx.fillText(formattedDate, outCanvas.width * 0.76, outCanvas.height * 0.185);
    oCtx.fillText('$' + ww.toFixed(2), outCanvas.width * 0.76, outCanvas.height * 0.385);
    oCtx.fillText('$' + local.toFixed(2), outCanvas.width * 0.76, outCanvas.height * 0.45);
    oCtx.fillText('$' + total.toFixed(2), outCanvas.width * 0.76, outCanvas.height * 0.69);
    
    oCtx.font = "22px Arial";
    oCtx.fillText(document.getElementById('noteInput').value, outCanvas.width * 0.22, outCanvas.height * 0.925);
    
    oCtx.drawImage(canvas, outCanvas.width * 0.13, outCanvas.height * 0.68, outCanvas.width * 0.25, outCanvas.height * 0.1);

    // Update summary card
    document.getElementById('summaryTotal').innerText = `$${total.toFixed(2)}`;
    document.getElementById('summaryWW').innerText = `WW: $${ww.toFixed(2)}`;
    document.getElementById('summaryLocal').innerText = `Local: $${local.toFixed(2)}`;

    // Output logic
    const finalData = outCanvas.toDataURL("image/png");
    document.getElementById('finalImage').src = finalData;
    
    document.getElementById('formContainer').style.display = 'none';
    document.getElementById('resultContainer').style.display = 'block';
  };
  // Updated path to use your new img/ directory!
  bgImg.src = 'img/template.png'; 
}

// 4. Reset flow
function resetForm() {
  document.getElementById('wwInput').value = '';
  document.getElementById('localInput').value = '';
  document.getElementById('noteInput').value = '';
  clearSig(); 
  document.getElementById('genBtn').innerText = "Generate Record";
  document.getElementById('resultContainer').style.display = 'none';
  document.getElementById('formContainer').style.display = 'block';
  window.scrollTo(0, 0); 
}

// 5. Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registered!'))
      .catch(err => console.error('Service Worker registration failed:', err));
  });
}