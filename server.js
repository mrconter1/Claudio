const express = require('express');
const fs = require('fs');
const path = require('path');
const wavDecoder = require('wav-decoder');

const app = express();

const server = require('http').createServer(app);
const io = require("socket.io")(server);
const { spawn } = require('child_process');

// Serve static files
app.use(express.static('public'));

io.on("connection", socket => {
  socket.on("train_model", () => {
    const python = spawn('python3', ['train.py']);
    python.stdout.on('data', function (data) {
      console.log('Pipe data from python script ...');
      socket.emit('out', data.toString());
    });
    python.on('close', (code) => {
      console.log(`child process close all stdio with code ${code}`);
      socket.emit('out', `Process complete with code ${code}`);
    });
    python.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
      socket.emit('out', `Error: ${data}`);
    });
  });
});

app.get('/files', (req, res) => {
  const dataFolder = path.join(__dirname, 'public', 'data');

  fs.readdir(dataFolder, (err, files) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error reading data folder.');
    } else {
      const wavFiles = files
        .filter(file => file.endsWith('.wav') || file.endsWith('.label'))
        .map(file => path.basename(file, path.extname(file)))
      const uniqueFiles = [...new Set(wavFiles)];
      res.json(uniqueFiles);
    }
  });
});

app.get('/samplerate/:file', async (req, res) => {
    const fileName = req.params.file;

    try {
        const filePath = path.join(__dirname, 'public', 'data', fileName);
        const fileData = fs.readFileSync(filePath);
        const audioData = await wavDecoder.decode(fileData);
        res.json({sampleRate: audioData.sampleRate, path: filePath});  // Modify this line

    } catch(err) {
        console.error(err);
        res.status(500).send('Could not decode file.');
    }
});

server.listen(8000, () => console.log('Server running on port 8000'));
