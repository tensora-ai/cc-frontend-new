# Stage 1: Building the code  
FROM node:20.19.2-alpine AS builder

# Install pnpm
RUN npm install -g pnpm
  
WORKDIR /app  
  
# Copy the package.json and package-lock.json from your project into the Docker container  
COPY package.json pnpm-lock.yaml ./  
  
# Install the dependencies in the container  
RUN pnpm i
  
# Copy the rest of your app's source code from your host to your Docker container  
COPY . .  
  
# Build the Next.js application  
RUN pnpm run build  
  
# Stage 2: Run the Next.js application  
FROM node:20.19.2-alpine AS runner

# Install pnpm
RUN npm install -g pnpm
  
WORKDIR /app  
  
# Copy the built code from the builder stage to the runner stage  
COPY --from=builder /app/next.config.ts ./  
COPY --from=builder /app/.next ./.next  
COPY --from=builder /app/node_modules ./node_modules  
COPY --from=builder /app/package.json ./package.json  
  
# If your Next.js app is not listening on the default port 3000, you can set a different port here  
ENV PORT 3000  
  
# Expose the port the app runs on  
EXPOSE $PORT  
  
# Start the Next.js app  
CMD ["pnpm", "run", "start"]