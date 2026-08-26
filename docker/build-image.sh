set -euo pipefail
rm -rf ./build
# Build the production image using the PRE-BUILT ./build directory.
# You MUST run a host build first, e.g.:
#   pnpm run build            # or pnpm run build:test etc.
# Then build the image:
#   bash docker/build-image.sh              # tag landing-user:latest
#   bash docker/build-image.sh myrepo/app:1  # custom tag


# Copy build output into docker/ subfolder (mirrors root build) for isolated packaging if desired.
DEST_DIR="build"
echo "[build-image] Syncing build -> $DEST_DIR"
rm -rf "$DEST_DIR"
mkdir -p "$DEST_DIR"
cp -R ../build/* "$DEST_DIR"/
echo "[build-image] Sync complete ($(find "$DEST_DIR" -type f | wc -l | tr -d '[:space:]') files)."

IMAGE_TAG="${1:-landing-user:latest}"

echo "[build-image] Building image: $IMAGE_TAG"
docker build -f Dockerfile -t "$IMAGE_TAG" .

echo "[build-image] Done. Run with: docker run -p 3005:3000 $IMAGE_TAG"

docker run -p 3000:5000 landing-user:latest
