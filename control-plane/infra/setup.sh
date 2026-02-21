#!/bin/bash
# Setup script for OpenClaw Fleet VPS

set -e

echo "=== OpenClaw Fleet VPS Setup ==="

# Check arguments
if [ -z "$1" ]; then
    echo "Usage: $0 <domain>"
    echo "Example: $0 fleet.example.com"
    exit 1
fi

DOMAIN=$1

echo "Setting up for domain: $DOMAIN"

# Detect package manager
if command -v apt-get &> /dev/null; then
    PKG_MANAGER="apt"
elif command -v yum &> /dev/null; then
    PKG_MANAGER="yum"
else
    echo "Unsupported package manager"
    exit 1
fi

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    usermod -aG docker $USER || true
fi

# Install Docker Compose plugin if not present
if ! docker compose version &> /dev/null; then
    echo "Installing Docker Compose..."
    if [ "$PKG_MANAGER" == "apt" ]; then
        apt-get update
        apt-get install -y docker-compose-plugin
    fi
fi

# Create directories
INSTALL_DIR="/opt/openclaw-fleet"
mkdir -p $INSTALL_DIR/{infra/ssl,backups}
cd $INSTALL_DIR

# Generate secrets if .env doesn't exist
if [ ! -f .env ]; then
    echo "Generating secrets..."
    cat > .env << EOF
DOMAIN=$DOMAIN
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
MINIO_ROOT_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
SECRET_KEY=$(openssl rand -base64 48 | tr -d '\n')
ADMIN_EMAIL=admin@$DOMAIN
ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -d '\n')
EOF
    echo ""
    echo "=========================================="
    echo "Generated .env file with random passwords"
    echo ""
    echo "Admin credentials:"
    grep "ADMIN_" .env
    echo "=========================================="
    echo ""
fi

# Source the env file
set -a
source .env
set +a

# Get initial certificate
echo "Obtaining SSL certificate..."
docker run -it --rm \
    -v $INSTALL_DIR/infra/certbot_data:/etc/letsencrypt \
    -v $INSTALL_DIR/infra/certbot_www:/var/www/certbot \
    -p 80:80 \
    certbot/certbot certonly --standalone -d $DOMAIN --agree-tos --no-eff-email -m admin@$DOMAIN || {
        echo "Failed to obtain certificate. Make sure DNS points to this server."
        exit 1
    }

# Replace domain in nginx config
if [ -f infra/nginx.conf ]; then
    sed -i "s/\${DOMAIN}/$DOMAIN/g" infra/nginx.conf
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Ensure DNS for $DOMAIN points to this server ($(curl -s ipinfo.io/ip 2>/dev/null || echo 'your server IP'))"
echo "2. Review .env file: nano $INSTALL_DIR/.env"
echo "3. Start services:"
echo "   cd $INSTALL_DIR"
echo "   docker compose up -d"
echo ""
echo "4. Access the UI at: https://$DOMAIN"
echo "   Login with the admin credentials shown above"
echo ""
