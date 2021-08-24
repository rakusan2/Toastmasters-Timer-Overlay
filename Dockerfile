FROM node:12

MAINTAINER Rakusan2 <10575235+rakusan2@users.noreply.github.com>

COPY . /opt/Toastmasters-Timer-Overlay/

WORKDIR /opt/Toastmasters-Timer-Overlay
RUN npm install; npm run build

EXPOSE 8888
CMD ["node", "/opt/Toastmasters-Timer-Overlay"]
