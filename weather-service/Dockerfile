FROM node:20-alpine
WORKDIR /home/alex/Scrivania/PROGETTO SOI/weather-service
COPY ./ .
RUN npm install 
RUN npm install ws
RUN npm install wscat
CMD ["npm", "start"] 
EXPOSE 8081