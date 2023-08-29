const waveformContainer = document.getElementById('waveformContainer');
const playPauseBtn = document.getElementById('playPauseBtn');
const stepBackBtn = document.getElementById('stepBackBtn');
const stepForwardBtn = document.getElementById('stepForwardBtn');
const stopBtn = document.getElementById('stopBtn');
const playerBtn = document.getElementById('playerBtn');
const fileInput = document.createElement('input');
const canvas = document.getElementById('waveformCanvas');
const player = document.getElementById('player');
const timestampInput = document.getElementById('timestampInput');
const seekBtn = document.getElementById('seekBtn');
const nextLabelBtn = document.getElementById('nextLabelBtn');
const prevLabelBtn = document.getElementById('prevLabelBtn');

// Set canvas to display size.
canvas.style.width = '100%';
canvas.style.height = '150px';

// Increase canvas pixel density for HD-DPI screens (e.g. Retina Display)
const scaleFactor = window.devicePixelRatio;
canvas.width = canvas.offsetWidth * scaleFactor;
canvas.height = canvas.offsetHeight * scaleFactor;

let audioData = null;
let animationId = null;

let labels = null;
let selectedIndex = -1; // to store the current selected index of a label
let hoverIndex = -1; // to handle case of hovering over a label
let dragging = false;
let draggingIndex = -1;
let draggingStartX = -1;
let draggingEnd = '';

let activeLink = null;

const context = canvas.getContext('2d');

// Scale context to match scaled canvas size.
context.scale(scaleFactor, scaleFactor);

fileInput.type = 'file';
fileInput.accept = '.wav';
fileInput.style.display = 'none';

fileInput.addEventListener('change', function (event) {
    const file = event.target.files[0];

    if (file && file.type && file.type.includes('audio')) {
        loadAudio(file);
    } else {
        alert('Please choose a valid audio file.');
    }
});

document.querySelector('.sample-list').innerHTML = '';
fetch('/files')
    .then(response => response.json())
    .then(files => {
        const samplesList = document.querySelector('.sample-list');
        const anchors = files.map(fileData => {
            const file = fileData;
            const anchorTag = document.createElement('a');
            anchorTag.textContent = file;
            anchorTag.href = "#";
            anchorTag.addEventListener('click', (event) => {
                event.preventDefault();
                loadFile(file);
                setActiveLink(anchorTag)
            });
            samplesList.appendChild(anchorTag);
            return anchorTag;
        });
        loadFile(files[0]);
        setActiveLink(anchors[0]); // Set the first file as active
    });

function setActiveLink(link) {
    if (activeLink) {
        activeLink.classList.remove('active');  // Remove active class from the previously active link
    }
    link.classList.add('active');  // Add active class to the newly selected link
    activeLink = link;  // Update the active link
}

function loadFile(file) {

    // Clear existing labels
    document.getElementById('labelContainer').innerHTML = '';

    fetch(`data/${file}.wav`)
        .then(response => response.blob())
        .then(loadAudio);
    fetch(`data/${file}.label`)
        .then(response => response.text())
        .then(content => {
            labels = loadLabel(content);
            drawLabels(labels);
            if (labels.length > 0) {
                selectLabelAndSeek(0);
            }
        });
    fetch(`/samplerate/${file}.wav`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('fileName').textContent = `${file}`;
            document.getElementById('sampleRate').textContent = data.sampleRate + " Hz";
        })
        .catch(err => console.error("Error: ", err));
}

function getLabelIndexAtPosition(x) {
    const clickTime = (x / canvas.offsetWidth) * player.duration;
    for (let i = 0; i < labels.length; i++) {
        const label = labels[i];
        if (label.time <= clickTime && clickTime <= (label.time + label.length)) {
            return i;
        }
    }
    return -1;
}

function loadLabel(content) {
    const lines = content.split("\n");
    const labels = lines.slice(1).map(line => {
        const parts = line.split(",");
        const time = Number.parseFloat(parts[0]);
        const length = Number.parseFloat(parts[1]);
        const label = parts[2];
        return {
            time,
            length,
            label
        };
    });
    return labels; // Return labels
}

function drawLabels(labels) {
    const duration = player.duration;

    labels.forEach((label, i) => {
        context.save();
        if (i === selectedIndex) {
            context.fillStyle = "rgba(255, 0, 0, 0.5)";
        } else if (i === hoverIndex) {
            context.fillStyle = "rgba(255, 165, 0, 0.5)";
        } else {
            context.fillStyle = "rgba(0, 255, 0, 0.25)";
        }
        const start = label.time / duration * canvas.width;
        const width = label.length / duration * canvas.width;
        context.fillRect(start, 0, width, canvas.height);
        context.restore();
    });
}

function updateLabelUI() {
    const labelContainer = document.getElementById('labelContainer');
    labelContainer.innerHTML = '';

    if (selectedIndex === -1) {
        const div = document.createElement('div');
        div.className = 'label-item';
        div.textContent = 'No label selected';
        labelContainer.appendChild(div);
    } else {
        const label = labels[selectedIndex];
        const div = document.createElement('div');
        div.className = 'label-item';

        // Create a Delete button element for the selected label
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'btn btn-danger ml-2';

        // Add event listener to the Delete button
        deleteButton.addEventListener('click', function () {
            const confirmDeletion = confirm('Are you sure you want to delete this label?');
            if (confirmDeletion) {
                // Remove the label from labels array
                labels.splice(selectedIndex, 1);
                // Clear selection
                selectedIndex = -1;
                // Update UI
                updateLabelUI();
                // Draw labels
                drawLabels(labels);
            }
        });

        div.innerHTML = `
                    <div class="label-attr"><span>Start Time</span><input type="text" value="${label.time}" class="form-control"></div>
                    <div class="label-attr"><span>Length</span><input type="text" value="${label.length}" class="form-control"></div>
                    <div class="label-attr"><span>Class</span><input type="text" value="${label.label}" class="form-control"></div>
                `;

        div.appendChild(deleteButton);
        labelContainer.appendChild(div);
    }
}

nextLabelBtn.addEventListener('click', function () {
    if (labels && labels.length > 0) {
        selectedIndex = (selectedIndex + 1) % labels.length;
        selectLabelAndSeek(selectedIndex);
    }
});

prevLabelBtn.addEventListener('click', function () {
    if (labels && labels.length > 0) {
        selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : labels.length - 1;
        selectLabelAndSeek(selectedIndex);
    }
});

function selectLabelAndSeek(index) {
    selectedIndex = index;
    player.currentTime = labels[index].time;
    updateLabelUI();
    updatePlayhead();
}

function loadAudio(file) {
    const reader = new FileReader();

    reader.onload = function (e) {
        const audioContext = new AudioContext();
        audioContext.decodeAudioData(e.target.result, function (buffer) {
            audioData = buffer.getChannelData(0);
            drawWaveform(audioData);
            player.src = URL.createObjectURL(file);

            player.oncanplaythrough = function () {
                // Condition to check if labels are not loaded yet
                if (labels) {
                    drawLabels(labels);
                }
            };
        });
    };

    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    reader.readAsArrayBuffer(file);
    waveformContainer.style.display = 'block';
}

playPauseBtn.addEventListener('click', function () {
    if (player.paused) {
        player.play();
        animateWave();
        playPauseBtn.textContent = 'Pause';
    } else {
        player.pause();
        cancelAnimationFrame(animationId);
        playPauseBtn.textContent = 'Play';
    }
});

stepBackBtn.addEventListener('click', function () {
    const currentTime = player.currentTime;
    player.currentTime = currentTime - 1;
});

stepForwardBtn.addEventListener('click', function () {
    const currentTime = player.currentTime;
    player.currentTime = currentTime + 1;
});

stopBtn.addEventListener('click', function () {
    player.pause();
    player.currentTime = 0;
    cancelAnimationFrame(animationId);
    playPauseBtn.textContent = 'Play';
});

seekBtn.addEventListener('click', function () {
    const timestamp = timestampInput.value;
    const [hours, minutes, seconds] = timestamp.split(':');
    const totalTime = player.duration;
    const seekTime = (Number(hours) * 3600) + (Number(minutes) * 60) + Number(seconds);
    if (seekTime >= 0 && seekTime <= totalTime) {
        player.currentTime = seekTime;
        updatePlayhead();
    } else {
        alert('Invalid timestamp.');
    }
});

player.addEventListener('canplay', function () {
    playerContainer.style.display = 'block';
});

function updateAll() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawWaveform(audioData);
    if (labels) {
        drawLabels(labels);
    }
    updatePlayhead();
}

canvas.addEventListener('mousedown', function (event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;

    const index = getLabelIndexAtPosition(x);
    if (index !== -1) {
        selectedIndex = index;
        dragging = true;
        draggingIndex = index;

        const labelStart = labels[draggingIndex].time / player.duration * rect.width;
        const labelEnd = (labels[draggingIndex].time + labels[draggingIndex].length) / player.duration * rect.width;
        if (Math.abs(x - labelStart) < 5) {
            draggingEnd = 'start';
        } else if (Math.abs(x - labelEnd) < 5) {
            draggingEnd = 'end';
        } else {
            draggingEnd = 'middle';
        }

        draggingStartX = x;
    } else {

        // Let's add a new label here
        const newLabelTime = (x / canvas.offsetWidth) * player.duration;
        const newLabelLength = 1; // Set the length for newly created labels to be 1 second
        const newLabel = {
            time: newLabelTime,
            length: newLabelLength,
            label: 'New Label' // This is the label (class). Update this value as per your requirement
        };
        labels.push(newLabel);
        selectedIndex = labels.length - 1;

        updateLabelUI();
        drawLabels(labels);
    }

    updateLabelUI();
    updatePlayhead();
});

canvas.addEventListener('mouseup', function (event) {
    dragging = false;
    updateLabelUI();
});

canvas.addEventListener('mouseleave', function (event) {
    dragging = false;
});

canvas.addEventListener('mousemove', function (event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;

    // Check if we're over the start or end of a label
    let onLabelEdge = null;
    labels.forEach((label, index) => {
        const labelStart = label.time / player.duration * rect.width;
        const labelEnd = (label.time + label.length) / player.duration * rect.width;
        if (Math.abs(x - labelStart) < 5) {
            draggingEnd = 'start';
            onLabelEdge = index;
        } else if (Math.abs(x - labelEnd) < 5) {
            draggingEnd = 'end';
            onLabelEdge = index;
        }
    });

    if (onLabelEdge !== null) {
        canvas.style.cursor = 'ew-resize';
    } else {
        canvas.style.cursor = 'default';
    }

    const hoverIndexPrev = hoverIndex; // Store previous hover index
    hoverIndex = getLabelIndexAtPosition(x);
    if (hoverIndexPrev !== hoverIndex) {
        drawLabels(labels);
        updatePlayhead();
    }

    if (dragging) {
        if (draggingEnd === 'start') {
            labels[draggingIndex].time = (x / rect.width) * player.duration;
        } else if (draggingEnd === 'end') {
            const difference = (x - draggingStartX) / rect.width * player.duration;
            labels[draggingIndex].length += difference;
            draggingStartX = x;
        } else if (draggingEnd === 'middle') {
            const difference = (x - draggingStartX) / rect.width * player.duration;
            labels[draggingIndex].time += difference;
            draggingStartX = x;

            // Make sure labels stay within bounds
            labels[draggingIndex].time = Math.max(0, labels[draggingIndex].time);
            labels[draggingIndex].time = Math.min(player.duration - labels[draggingIndex].length, labels[draggingIndex].time);
        }
        updatePlayhead();
    }
});

function animateWave() {
    updatePlayhead();
    animationId = requestAnimationFrame(animateWave);
}

function updatePlayhead() {
    const progress = player.currentTime / player.duration;
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawWaveform(audioData);
    if (labels) { // Check if labels are loaded
        drawLabels(labels);
    }
    drawPlayhead(progress);
    timestampInput.value = formatTimestamp(player.currentTime);
}

function formatTimestamp(time) {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

function drawPlayhead(progress) {
    context.strokeStyle = 'green';
    context.beginPath();
    context.moveTo(canvas.width * progress, 0);
    context.lineTo(canvas.width * progress, canvas.height);
    context.stroke();
}

function drawWaveform(data) {
    const width = canvas.width;
    const height = canvas.height;
    const step = Math.ceil(data.length / width);
    const amplitude = height / 2;
    context.clearRect(0, 0, width, height);
    context.strokeStyle = 'red';
    context.beginPath();
    context.moveTo(0, amplitude);

    for (let i = 0; i < width; i++) {
        let min = 1.0;
        let max = -1.0;

        for (let j = 0; j < step; j++) {
            const datum = data[i * step + j];

            if (datum < min) {
                min = datum;
            } else if (datum > max) {
                max = datum;
            }
        }

        context.lineTo(i, (1 + min) * amplitude);
        context.lineTo(i, (1 + max) * amplitude);
    }

    context.lineTo(width, amplitude);
    context.stroke();
}
