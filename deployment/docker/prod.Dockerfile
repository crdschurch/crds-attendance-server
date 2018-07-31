FROM node:6.14

RUN mkdir /app
WORKDIR /app

# copy the package information first
COPY package*.json ./

# run install so this layer can cache
RUN npm install

# Copy everything
COPY . .

# Set node_env to prod
ENV NODE_ENV=production

EXPOSE 8000
CMD [ "npm", "start" ]