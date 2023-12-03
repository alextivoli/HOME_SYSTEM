FROM node:20-alpine
WORKDIR /home/alex/Scrivania/PROGETTO SOI/backend
COPY ./server/ .
COPY ./.env .
ENV OIDC_CLIENT_ID='777932702410-qe5jrphobeeidisnl1dgb8efiq366hgn.apps.googleusercontent.com'
ENV OIDC_SECRET='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'
ENV OIDC_REDIRECT='http://alex-tivoli.soi2223.unipr.it:8080'
RUN npm install 
RUN npm install ws
RUN npm install node-fetch
CMD ["npm", "start"] 
EXPOSE 8000