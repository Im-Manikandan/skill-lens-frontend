## Runtime-only image.
## Requires you to run "pnpm run build" (or appropriate env build) on the host BEFORE docker build.
## Then the existing ./build directory is copied in.

FROM node:20-alpine
WORKDIR /app

COPY . .
# Install only runtime deps (express, compression) from docker/package.json
RUN npm config set registry https://registry.npmjs.org/ \
    && npm install --omit=dev \
    && npm cache clean --force
RUN npm install --omit=dev && npm cache clean --force


# Non-root user
RUN addgroup -S app && adduser -S app -G app
USER app

ENV NODE_ENV=production \
    PORT=3000 \
    BASE_PATH=/landing-user

ENV REACT_APP_A="Landing User" \
    REACT_APP_B="Landing User" \
    REACT_APP_C="Landing User"

ENV VITE_X="Landing User" \
    VITE_Y="Landing User" \
    VITE_Z="Landing User"

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -qO- http://127.0.0.1:3000$BASE_PATH/ || exit 1
CMD ["node", "server.js"]
