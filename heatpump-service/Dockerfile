FROM node:20-alpine
WORKDIR /home/alex/Scrivania/PROGETTO SOI/heatpump-service
COPY ./ .
RUN npm install 
RUN npm install ws
RUN npm install wscat
RUN npm install node-fetch
CMD ["npm", "start"] 
EXPOSE 8083