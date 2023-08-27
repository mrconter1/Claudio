const express = require('express');
const fs = require('fs');
const path = require('path');
const wavDecoder = require('wav-decoder');

const app = express();


// Serve static files
app.use(express.static('public'));

app.get('/files', (req, res) => {
  const dataFolder = path.join(__dirname, 'public', 'data');

  fs.readdir(dataFolder, (err, files) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error reading data folder.');
    } else {
      const wavFiles = files.filter(file => file.endsWith('.wav'));
      res.json(wavFiles);
    }
  });
});

app.get('/samplerate/:file', async (req, res) => {
  const fileName = req.params.file;

  try {
    const filePath = path.join(__dirname, 'public', 'data', fileName);
    const fileData = fs.readFileSync(filePath);
    const audioData = await wavDecoder.decode(fileData);
    res.json({ sampleRate: audioData.sampleRate });

  } catch (err) {
    console.error(err);
    res.status(500).send('Could not decode file.');
  }
});

app.listen(8000, () => console.log('Server is running on port 8000'));