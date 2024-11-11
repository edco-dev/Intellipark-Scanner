import { Html5QrcodeScanner } from 'html5-qrcode';

// Define a function to handle the QR code scan success
async function onScanSuccess(decodedText) {
  const resultElement = document.getElementById('qr-result');
  const confirmButton = document.getElementById('confirm-btn');
  
  // Check if the resultElement exists
  if (!resultElement) {
    console.error('Element with id "qr-result" not found.');
    return;
  }

  // Parse the decoded text as a JSON object
  let decodedObj;
  try {
    decodedObj = JSON.parse(decodedText); // Parse the JSON string
  } catch (error) {
    console.error("Error parsing QR code data:", error);
    return;
  }

  const documentId = decodedObj.docId; // Extract docId from the parsed object

  // Display the scanned result
  resultElement.innerText = `Scanned result: ${documentId}`;
  
  // Hide confirm button until validation
  if (confirmButton) {
    confirmButton.style.display = 'none';
  } else {
    console.error('Element with id "confirm-btn" not found.');
  }

  // Validate the scanned document ID with the API
  const isValid = await validateDocumentId(documentId);

  if (isValid) {
    console.log('QR Code is valid:', documentId);
    resultElement.innerText += " (Valid)";
    
    // Show confirm button if valid
    if (confirmButton) {
      confirmButton.style.display = 'block';
      confirmButton.onclick = () => {
        console.log('QR Code confirmed:', documentId);
        // Add further action if needed
      };
    }
  } else {
    console.log('QR Code is NOT valid:', documentId);
    resultElement.innerText += " (Not valid)";
  }
}

// Function to validate the document ID using the API
// Function to validate the document ID using the API
async function validateDocumentId(documentId) {
  try {
    console.log("Received docId:", documentId);
    console.log("Type of docId:", typeof documentId); // Check the type

    // If docId is a JSON string (we're assuming it's a stringified object), parse it
    let parsedDocId = null;
    if (typeof documentId === 'string') {
      try {
        const docObject = JSON.parse(documentId);  // Try to parse the string
        if (docObject && docObject.docId) {
          parsedDocId = docObject.docId;  // Extract the actual docId
          console.log("Parsed docId from JSON:", parsedDocId);
        } else {
          console.error('Invalid docId format in JSON');
          return false;
        }
      } catch (e) {
        console.error('Error parsing docId from JSON:', e);
        return false;
      }
    } else {
      console.error('Invalid docId: Expected a string');
      return false;
    }

    // Now validate the parsed docId
    const trimmedDocId = parsedDocId.trim();  // Trim spaces if any
    console.log("Trimmed docId:", trimmedDocId);

    // If the docId is not a string or empty, we can't validate it
    if (typeof trimmedDocId !== 'string' || trimmedDocId === '') {
      console.error('Invalid docId: It should be a non-empty string');
      return false;
    }

    // Make the API request to validate the docId
    const response = await fetch('https://intellipark-backend.onrender.com/api/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ docId: trimmedDocId }), // Send the trimmed docId
    });

    // If the response is not successful, log and return false
    if (!response.ok) {
      console.error(`Validation API returned status ${response.status}`);
      return false;
    }

    // Parse the response from the API
    const result = await response.json();
    console.log('API Response:', result);

    // Check if the response has a valid field and log accordingly
    if (result.valid === true) {
      console.log("Document ID is valid:", trimmedDocId);
      return true; // Valid ID
    } else {
      console.log("Document ID is invalid:", trimmedDocId);
      return false; // Invalid ID
    }
  } catch (error) {
    // Log any error that occurs during the API call or timeout
    console.error('Error during validation API call:', error);
    return false; // Treat as invalid in case of error
  }
}

let isScanning = false;

function onScanSuccess(decodedText) {
  if (isScanning) {
    console.log('Scan already in progress. Please wait...');
    return; // If scanning is in progress, return early
  }

  isScanning = true; // Set scanning flag to true
  console.log("Scanned docId:", decodedText);  // Log scanned docId (string)

  // Perform the validation
  const docId = decodedText.trim(); // Ensure that the docId is trimmed and clean

  validateDocumentId(docId).then(isValid => {
    if (isValid) {
      console.log("ID is valid, you can now send it to Arduino.");
      // Send to Arduino or perform other actions
    } else {
      console.log("ID is not valid, do not send to Arduino.");
    }
  }).catch(error => {
    console.error("Error in validating the document ID:", error);
  });

  // Set a delay before allowing another scan
  setTimeout(() => {
    isScanning = false; // Reset flag after a delay (e.g., 3 seconds)
    console.log('Ready for the next scan!');
  }, 3000);  // 3 seconds delay
}



// Optional function for scan failure (e.g., no QR code found)
function onScanFailure(error) {
  console.warn(`QR code scan error: ${error}`);
}

// Initialize the QR code scanner
const html5QrcodeScanner = new Html5QrcodeScanner(
  'reader',   
  {
    fps: 10,
    qrbox: 350,
    aspectRatio: 1.0,
    videoConstraints: {
      facingMode: "environment",
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  }
);

// Event listener to start scanning
document.getElementById('start-scanning').addEventListener('click', () => {
  html5QrcodeScanner.render(onScanSuccess, onScanFailure);
});
