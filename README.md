# Toastmasters Timer Overlay
This is a webpage that can be used as an overlay for the purpose of timing for a Toastmasters meeting

The Overlay is controlled from a local website that is mirrored across all with the same id. The view parameter hides the controls

OBS will hide the background

![site Usage](/img/site.gif)

-----

## Usage:
1. Download 
    - [release version](https://github.com/rakusan2/Toastmasters-Timer-Overlay/releases/tag/v1.0.0)
    - [OBS Studio](https://obsproject.com/)
    - [OBS VirtualCam](https://obsproject.com/forum/resources/obs-virtualcam.539/)
2. Run the Timer Overlay
3. Open a browser window at [localhost:8888](localhost:8888)
4. Click **Copy Link**
5. Open OBS Studio
6. Setup your video in OBS
    1. Sources -> Add -> Video Capture Device
    2. Click the image and resize and move it to your liking
7. Add Browser Capture
    1. Sources -> Add -> Browser
    2. Paste the copied link
8. Start VirtualCam
    1. (Top Bar) -> Tools -> VirtualCam -> Start
9. Change your Video Source to OBS-Camera
    - In Zoom: Settings -> Video -> Camera -> OBS-Camera

------

## To run from source:
1. Download
    - [NodeJS](https://nodejs.org/en/)
    - [Typescript](https://www.typescriptlang.org/)
2. Run
    1. `npm install`
    2. `tsc`
3. Start the application with `npm start`
4. Continua from step 3 of Usage above