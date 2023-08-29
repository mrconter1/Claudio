import numpy as np
import pandas as pd
import librosa
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.preprocessing.sequence import pad_sequences
from sklearn.model_selection import train_test_split
from pathlib import Path

# Constants
SR = 16000  # Sample rate
T = 1.0    # Seconds per segment

# Function to split audio and labels into chunks of T seconds or SR*T samples
def split_into_chunks(audio, labels, chunk_length=SR):
    # Get total number of chunks
    total_chunks = len(audio) // chunk_length

    # Reshape Audio into 'total_chunks' segments
    audio_chunks = np.reshape(audio[:total_chunks * chunk_length], (total_chunks, chunk_length))

    # Repeat the label for the entire chunk length.
    label_chunks = np.repeat(
        np.any(np.reshape(labels[:total_chunks * chunk_length], (total_chunks, chunk_length)), axis=1).astype(int),
        chunk_length
    ).reshape((total_chunks, chunk_length, 1))

    return audio_chunks, label_chunks

print("Loading data...")
root_dir = Path("public/data")

# Placeholder for loaded data
X_data = []
y_data = []

# Iterate over all wave files
for filename in root_dir.rglob('*.wav'):
    print(f"Processing {filename}...")

    # Load audio
    audio, sr = librosa.load(filename, sr=SR)  # Make sure all audios are the same sampling rate

    # Load corresponding labels
    label_file_path = filename.parent / 'y_labels.csv'
    if label_file_path.exists():
        labels = pd.read_csv(label_file_path).to_numpy()
    else:
        print(f"Warning: No corresponding label file {label_file_path} found.")
        continue

    # Split into chunks and append to data
    audio_chunks, label_chunks = split_into_chunks(audio, labels)
    X_data.append(audio_chunks)
    y_data.append(label_chunks)

# How to concatenate list of arrays into single array
X_data = np.concatenate(X_data)
y_data = np.concatenate(y_data)

# Splitting data
print("Splitting data...")
X_train, X_val, y_train, y_val = train_test_split(X_data, y_data, test_size=0.2)
print('Shapes:', y_train.shape, y_val.shape)

# Padding arrays
# Applying padding only to train and test data, not labels.
X_train_padded = pad_sequences(X_train, dtype='float32', padding='post')
X_val_padded = pad_sequences(X_val, dtype='float32', padding='post')

# Defining the LSTM model
print("Defining the model...")
model = Sequential()
model.add(LSTM(128, return_sequences=True, input_shape=(None, 1)))  # One feature - audio amplitude
model.add(LSTM(64, return_sequences=True))
model.add(Dense(1, activation='sigmoid'))

# Compiling the model
print("Compiling the model...")
model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

# Defining the LSTM model
model.fit(np.expand_dims(X_train_padded, -1), y_train, epochs=3, batch_size=32, validation_data=(np.expand_dims(X_val_padded, -1), y_val), verbose=1)

# Evaluate the model
score = model.evaluate(np.expand_dims(X_val_padded, -1), y_val, verbose=0)
print("Test loss:", score[0])
print("Test accuracy:", score[1])