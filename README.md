# Toastmasters Timer Overlay
This is a webpage that can be used as an overlay for the purpose of timing for a Toastmasters meeting

The Overlay is controlled from a local website that is mirrored across all with the same id. The view parameter hides the controls

OBS will hide the background

![site Usage](/img/site.gif)

Usage:
1. Download 
    - this project
    - [NodeJS](https://nodejs.org/en/)
    - [Typescript](https://www.typescriptlang.org/)
    - [OBS Studio](https://obsproject.com/)
    - [OBS VirtualCam](https://obsproject.com/forum/resources/obs-virtualcam.539/)
2. Run `npm install`
3. Run `tsc`
4. Run `npm start`
5. Open a browser window at [localhost:8888](localhost:8888)
6. Click **Copy Link**
4. Open OBS Studio
5. Setup your video in OBS
    1. Sources -> Add -> Video Capture Device
    2. Click the image and resize and move it to your liking
6. Add Browser Capture
    1. Sources -> Add -> Browser
    2. Paste the copied link
7. Start VirtualCam
    1. (Top Bar) -> Tools -> VirtualCam -> Start
8. Change your Video Source to OBS-Camera
    - In Zoom: Settings -> Video -> Camera -> OBS-Camera
