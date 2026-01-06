#!/bin/bash

# Script to load Docker images into K3s
# Run this after building your images

set -e  # Exit on error

echo "Loading Docker images into K3s..."

# Function to load an image
load_image() {
    local image_name=$1
    local temp_file=$(mktemp)
    
    echo "Loading ${image_name}..."
    
    # Save image to temporary file
    docker save "${image_name}:latest" -o "${temp_file}"
    
    # Import into K3s
    sudo k3s ctr images import "${temp_file}"
    
    # Clean up temporary file
    rm -f "${temp_file}"
    
    echo "  ✓ ${image_name} loaded successfully"
}

# Load product-service
load_image "product-service"

# Load order-service
load_image "order-service"

# Load payment-service
load_image "payment-service"

# Verify images are loaded
echo ""
echo "Verifying images in K3s:"
sudo k3s ctr images ls | grep -E "product-service|order-service|payment-service" || echo "  No images found (this might be normal if grep doesn't match)"

echo ""
echo "Done! Images are now available in K3s."

