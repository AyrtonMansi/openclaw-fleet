#!/bin/bash
# Install OpenClaw Fleet Runner

set -e

RUNNER_DIR="/opt/openclaw-runner"
SERVICE_NAME="openclaw-runner"

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
else
    echo "Unsupported OS: $OSTYPE"
    exit 1
fi

echo "Installing OpenClaw Fleet Runner for $OS..."

# Create directories
sudo mkdir -p "$RUNNER_DIR"
sudo mkdir -p /var/log

# Copy files
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sudo cp "$SCRIPT_DIR/runner.py" "$RUNNER_DIR/"
sudo cp "$SCRIPT_DIR/requirements.txt" "$RUNNER_DIR/"

# Install Python dependencies
echo "Installing Python dependencies..."
sudo pip3 install -r "$RUNNER_DIR/requirements.txt"

# Create config if it doesn't exist
if [ ! -f "$RUNNER_DIR/config.yaml" ]; then
    sudo cp "$SCRIPT_DIR/config.example.yaml" "$RUNNER_DIR/config.yaml"
    echo ""
    echo "=========================================="
    echo "Configuration file created at:"
    echo "  $RUNNER_DIR/config.yaml"
    echo ""
    echo "Please edit this file with your:"
    echo "  - Control plane URL"
    echo "  - Runner token (from Fleet UI)"
    echo "  - Agent definitions"
    echo "=========================================="
    echo ""
fi

# Install service
if [ "$OS" == "macos" ]; then
    echo "Installing LaunchDaemon..."
    sudo cp "$SCRIPT_DIR/com.openclaw.runner.plist" /Library/LaunchDaemons/
    sudo launchctl load /Library/LaunchDaemons/com.openclaw.runner.plist 2>/dev/null || true
    sudo launchctl start com.openclaw.runner 2>/dev/null || true
    echo "Runner started. Check logs with:"
    echo "  tail -f /var/log/openclaw-runner.log"
else
    echo "Installing systemd service..."
    sudo cp "$SCRIPT_DIR/openclaw-runner.service" /etc/systemd/system/
    
    # Create user if not exists
    if ! id -u openclaw &>/dev/null; then
        sudo useradd -r -s /bin/false openclaw
    fi
    
    sudo chown -R openclaw:openclaw "$RUNNER_DIR"
    sudo mkdir -p /tmp/openclaw-workspace
    sudo chown -R openclaw:openclaw /tmp/openclaw-workspace
    
    sudo systemctl daemon-reload
    sudo systemctl enable openclaw-runner
    echo ""
    echo "=========================================="
    echo "Service installed but not started."
    echo ""
    echo "1. Edit the config file:"
    echo "   sudo nano $RUNNER_DIR/config.yaml"
    echo ""
    echo "2. Start the service:"
    echo "   sudo systemctl start openclaw-runner"
    echo ""
    echo "3. Check status:"
    echo "   sudo systemctl status openclaw-runner"
    echo "=========================================="
fi

echo ""
echo "Installation complete!"
