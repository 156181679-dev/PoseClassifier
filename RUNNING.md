# Running

This repository ships the Python code, Flask UI, the default ST-GCN checkpoint, the RTMPose ONNX checkpoint, and the local YOLOv8 nano weight. Large demo videos are intentionally not committed to Git.

## Start the web app

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python web_app.py
```

Open `http://127.0.0.1:4000`.

PyTorch is still installed separately because the right wheel depends on your CUDA/CPU environment. Follow the official PyTorch install command for your machine before running inference.

For a fully offline machine with no Python packages installed, prepare an offline wheelhouse or a prebuilt environment as well. This repository now includes the model weights, but it does not vendor every Python dependency wheel.

## Optional demo video folder

The upload flow works without the bundled demo videos. To make the example video selector use local videos, point `POSE_VIDEO_DIR` at a folder containing `.mp4` files:

```powershell
$env:POSE_VIDEO_DIR = "E:\Program\PoseClassifier\配套视频"
python web_app.py
```

AI feedback uses local Ollama with `deepseek-r1:8b`. If Ollama is not running or the model is not pulled, classification can still run, but the generated coach feedback will return an Ollama error message.
