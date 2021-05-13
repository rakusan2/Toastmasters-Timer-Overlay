FROM node:12

MAINTAINER Thunderbird2086 <37539914+Thunderbird2086@users.noreply.github.com>

COPY . /opt/Toastmasters-Timer-Overlay/

WORKDIR /opt/Toastmasters-Timer-Overlay
RUN npm install; npm run build

EXPOSE 8888
CMD ["node", "/opt/Toastmasters-Timer-Overlay"]
