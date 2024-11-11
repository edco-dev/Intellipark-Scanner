const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// Create a mock serial port (in reality, this would connect to the actual Arduino port)
const mockPort = new SerialPort({
   path: '/tmp/mock', // Virtual path for simulation
   baudRate: 9600,
   autoOpen: false
});

const parser = mockPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

mockPort.on('open', () => {
   console.log("Mock Arduino port is open.");
});

parser.on('data', (data) => {
   console.log("Mock Arduino received data:", data);
   // Simulate a response back to the sender
   mockPort.write("Data received\n");
});

// Open the port (to simulate Arduino being active)
mockPort.open();
