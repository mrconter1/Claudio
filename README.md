# Claudio Studio

In the world of sound engineering, music production, and language learning, the need to segment and label audio files is becoming increasingly important. Claudio Studio is an interactive application that allows users to visualize, annotate, and model their sound files, making the task of working with audio easy and intuitive.

**Project Purpose**

Claudio Studio was designed with the aim of simplifying the process of working with audio files by providing a user-friendly interface where waveforms can be visualized, annotated, and segmented. The application also provides functionality for training a simple machine learning model using the annotated data which can, for example, be used for tasks such as instrument recognition, music genre classification, or speech recognition.

<br />

**Table of Contents**
- [Project Overview](#project-overview)
- [Setup and Installation](#setup-and-installation)
- [Features](#features)
- [Usage](#usage)
- [Future Enhancements](#future-enhancements)
- [License](#license)

<br />

## Project Overview 

![Overview](https://imgur.com/a/acgibzk)*

<br />

## Setup and Installation

1. Clone the project repository.

   ```
   git clone https://github.com/YourUsername/ClaudioStudio.git
   ```

2. Navigate to the project directory
   ```
   cd ClaudioStudio
   ```

3. Go to the client directory and install dependencies

   ```
   cd client
   npm install
   ```

4. Go to the server directory and install dependencies

   ```
   cd server
   npm install
   ```

5. Run the client side application

   ```
   cd client
   npm start
   ```

6. Run the server side application

   ```
   cd server
   npm start
   ```

7. You can now access Claudio Studio at `localhost:3000`.

*Note: Make sure you have Node.js and Python installed in your system before running the above commands. If not installed, you can download them [here](https://nodejs.org/en/download/) and [here](https://www.python.org/downloads/) respectively.*

<br />

## Features

- **Audio Visualization:** Visualize your sound file in a waveform.

- **Audio Annotation:** Annotate your sound files with labels

- **Audio Segmentation:** Divide your sound files into several segments.

- **Train Model:** Train a simple machine learning model on your annotated sound files.

- **Model Evaluation:** Evaluate your model's performance.

<br />

## Usage

1. Upload a `.wav` audio file and its corresponding `.label` file. Make sure both files have the same name except the extension.

2. Select a file from the side navigation list.

3. Use the controls to play, pause, step back, step forward, and stop.

4. Annotate and label your sound files by clicking on the waveform. Labels can be adjusted or deleted. 

5. Once you're satisfied with your labels, click on "Train Model" to train a simple machine learning model.

<br />

## Future Enhancements

- Integrate more sophisticated machine learning models for audio classification.

- Implement a feature allowing users to download their annotated file and model evaluation results.

- Improve UI/UX design for a smoother and more intuitive experience.

- Add support for more audio file types beyond `.wav`.

<br />

## License

This project is licensed under the [MIT License](LICENSE).

Note: This application is intended for educational purposes and is not suitable for commercial use in its current form. However, suggestions for improvements and contributions are welcome.