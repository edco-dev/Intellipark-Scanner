import { Html5QrcodeScanner } from 'html5-qrcode';

// Define a function to handle the QR code scan success
function onScanSuccess(decodedText) {
  // Display the scanned result in the result paragraph
  const resultElement = document.getElementById('qr-result');
  const confirmButton = document.getElementById('confirm-btn');
  
  if (resultElement) {
    resultElement.innerText = `Scanned result: ${decodedText}`;
    confirmButton.style.display = 'block';  // Show the confirm button after scanning
    
    // Handle the action to confirm entry (e.g., sending the decoded text to the API)
    confirmButton.onclick = () => {
      // You can send the decodedText to an API here (e.g., Arduino API)
      console.log('QR Code confirmed:', decodedText);
    };
  } else {
    console.error('Element with id "qr-result" not found.');
  }
}

// Optional: Define a function to handle scan failure (usually when no QR code is found)
function onScanFailure(error) {
  console.warn(`QR code scan error: ${error}`);
}

// Initialize the QR code scanner with settings
const html5QrcodeScanner = new Html5QrcodeScanner(
  'reader',   // HTML element ID for the scanner
  {
    fps: 10,    // Frames per second for the camera scan
    qrbox: 350, // Display area size for the QR code scanner
    aspectRatio: 1.0, // Optional: Keep scan area square
    videoConstraints: {
      facingMode: "environment",  // Default: rear camera
      width: { ideal: 1280 },     // Better resolution for scanning
      height: { ideal: 720 },     // Better resolution for scanning
    }
  }
);

// Add events listener to the "Start Scanning" button to trigger scanning
document.getElementById('start-scanning').addEventListener('click', () => {
  html5QrcodeScanner.render(onScanSuccess, onScanFailure);
});
