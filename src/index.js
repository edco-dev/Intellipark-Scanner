import { Html5QrcodeScanner } from 'html5-qrcode';

let isProcessing = false; // Flag to track if a scan is being processed

// Function to toggle the loader visibility
function toggleLoader(show) {
  const loader = document.getElementById("loader");
  loader.style.display = show ? "block" : "none";
}

// Function to handle successful QR code scan
async function onScanSuccess(decodedText) {
  if (isProcessing) return; // Prevent multiple scans during processing

  isProcessing = true; // Set processing state to true
  toggleLoader(true); // Show loader

  let docId;
  let fullData = {}; // Object to hold data for API calls

  // Parse QR code data
  try {
    const decodedObj = JSON.parse(decodedText);
    docId = decodedObj.docId;
    console.log("Extracted docId:", docId);
  } catch (error) {
    console.error("Error parsing QR code data:", error);
    toggleLoader(false);
    isProcessing = false;
    return;
  }

  // Stop scanner temporarily
  html5QrcodeScanner.clear();

  // Validate document ID
  const isValid = await validateDocumentId(docId, (data) => {
    fullData = data;
  });

  if (isValid) {
    console.log("Validation passed:", fullData);

    // Check the vehicle's status for entry or exit
    if (fullData.status === "inside") {
      console.log("Vehicle is already inside. Processing exit.");
      const exitSuccess = await vehicleExit(fullData); // Handle exit

      if (exitSuccess) {
        console.log("Vehicle exit successful.");
        document.getElementById('qr-result').innerText = "Vehicle exit successful!";
      }
    } else {
      console.log("Vehicle is outside. Processing entry.");
      const entrySuccess = await vehicleEntry(fullData); // Handle entry

      if (entrySuccess) {
        console.log("Vehicle entry successful.");
        document.getElementById('qr-result').innerText = "Vehicle entry successful!";
      }
    }
  } else {
    console.error("Validation failed.");
  }

  // Cleanup
  toggleLoader(false);
  isProcessing = false;

  // Stop camera feed
  const videoElement = document.querySelector("video");
  if (videoElement) {
    const stream = videoElement.srcObject;
    const tracks = stream?.getTracks();
    tracks?.forEach(track => track.stop());
  }
}

// Function to validate the document ID using the API with the corrected structure
async function validateDocumentId(documentId, onSuccess) {
  try {
    documentId = documentId.trim();
    console.log("Trimmed docId:", documentId);

    if (typeof documentId !== 'string' || documentId === '') {
      console.error('Invalid docId: Expected a non-empty string');
      return false;
    }

    console.log("Sending request to /api/validate with docId:", documentId);

    const response = await fetch('https://intellipark-backend.onrender.com/api/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ docId: documentId })
    });

    console.log("Response status:", response.status);
    if (!response.ok) {
      console.error("API request failed with status:", response.status);
      return false;
    }

    const result = await response.json();
    console.log('Parsed API Response:', result);

    // Check if result contains action and proceed based on action type
    if (result && result.action === "enter") {
      console.log("Document ID is valid for entry:", documentId);

      // Structure data for vehicle entry
      const data = {
        firstName: result.data?.firstName || "",
        middleName: result.data?.middleName || "",
        lastName: result.data?.lastName || "",
        contactNumber: result.data?.contactNumber || "",
        userType: result.data?.userType || "",
        vehicleType: result.data?.vehicleType || "",
        status: result.data?.status,
        vehicleColor: result.data?.vehicleColor || "",
        plateNumber: result.data?.plateNumber || "",
        message: result.message || ""  // `message` is still directly on `result`
      };

      // Trigger the callback function for successful validation
      if (onSuccess) onSuccess(data);
      return true; // Return true if the action is "enter"
    } else if (result && result.action === "exit") {
      console.log("Document ID is valid for exit:", documentId);

      // Structure data for vehicle exit
      const data = {
        firstName: result.data?.firstName || "",
        middleName: result.data?.middleName || "",
        lastName: result.data?.lastName || "",
        contactNumber: result.data?.contactNumber || "",
        userType: result.data?.userType || "",
        vehicleType: result.data?.vehicleType || "",
        status: result.data?.status,
        vehicleColor: result.data?.vehicleColor || "",
        plateNumber: result.data?.plateNumber || "",
        message: result.message || ""  // `message` is still directly on `result`
      };

      // Call vehicleExit API (you should implement this function somewhere in your code)
      const exitSuccess = await vehicleExit(data); // Send data for vehicle exit

      if (exitSuccess) {
        console.log("Vehicle exit successful.");
      } else {
        console.error("Vehicle exit failed.");
      }
      return true; // Return true after exit action is processed
    } else {
      console.error("Validation failed. Document ID invalid or action not recognized.");
      if (result.message) {
        alert(result.message); // Show message if available
      }
      return false; // Return false if no valid action
    }
  } catch (error) {
    console.error('Error during validation API call:', error);
    return false; // Return false if there's an error in the request
  }
}


// Function to handle vehicle entry API call
// Function to handle vehicle entry API call
async function vehicleEntry(data) {
  console.log("Attempting vehicle entry with the following data:", data);
  try {
    const response = await fetch('https://intellipark-backend.onrender.com/api/vehicle-entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      console.error(`Vehicle entry API request failed with status ${response.status}`);
      return false;
    }

    const result = await response.json();
    console.log("Vehicle entry API response:", result);

    openGate();
    
    setTimeout(async () => {
        console.log("Closing gate after vehicle entry.");
        await closeGate();
    }, 10000);
    
      return true;
  } catch (error) {
    console.error("Error during vehicle entry API call:", error);
    return false;
  }
}

// Function to handle vehicle exit API call
async function vehicleExit(data) {
  console.log("Attempting vehicle exit with the following data:", data);
  try {
    const response = await fetch('https://intellipark-backend.onrender.com/api/vehicle-exit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      console.error(`Vehicle exit API request failed with status ${response.status}`);
      return false;
    }

    const result = await response.json();
    console.log("Vehicle exit API response:", result);
    
    openGate();  // Open gate

    // Close gate after 3 seconds (allowing the vehicle to pass)
    setTimeout(async () => {
      console.log("Closing gate after vehicle entry.");
      await closeGate();
    }, 10000);
    // If exit is successful, trigger gate closing immediately

  } catch (error) {
    console.error("Error during vehicle exit API call:", error);
    return false;
  }
}

// Function to open the gate (trigger GET request)
async function openGate() {
  try {
    const response = await fetch('http://localhost:3000/api/open', { method: 'GET' });
    if (!response.ok) {
      console.error(`Failed to open gate. Status: ${response.status}`);
      return false;
    }
    console.log("Gate opened successfully.");
    return true;
  } catch (error) {
    console.error("Error opening the gate:", error);
    return false;
  }
}

// Function to close the gate (trigger GET reques)
async function closeGate() {
  try {
    const response = await fetch('http://localhost:3000/api/close', { method: 'GET' });
    if (!response.ok) {
      console.error(`Failed to close gate. Status: ${response.status}`);
      return false;
    }
    console.log("Gate closed successfully.");
    return true;
  } catch (error) {
    console.error("Error closing the gate:", error);
    return false;
  }
}


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

document.getElementById('start-scanning').addEventListener('click', () => {
  isProcessing = false;
  document.getElementById('qr-result').innerText = "";
  html5QrcodeScanner.render(onScanSuccess, onScanFailure);
});

function onScanFailure(error) {
  console.warn(`QR code scan error: ${error}`);
}


//this only
