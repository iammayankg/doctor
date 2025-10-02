# Stage 1: Build frontend
FROM node:18 AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./frontend/
RUN cd frontend && npm install
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Stage 2: Setup backend
FROM node:18
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm install
COPY backend/ ./backend/
COPY --from=build /app/frontend/dist ./frontend/dist

EXPOSE 3001
CMD ["node", "backend/index.js"]