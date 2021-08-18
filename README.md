# Toastmasters Timer Overlay
This is a webpage that can be used as an overlay for the purpose of timing for a Toastmasters meeting

The Overlay is controlled from a local website that is mirrored across all with the same id. The view parameter hides the controls

OBS will hide the background

![site Usage](/img/site.gif)

-----

### Usage:
1. Download 
    - [release version](https://github.com/rakusan2/Toastmasters-Timer-Overlay/releases/)
    - [OBS Studio](https://obsproject.com/)
1. Run the Timer Overlay
1. Open a browser window at [localhost:8888](localhost:8888)
1. Click **Copy Link**
1. Open OBS Studio
1. Setup your video in OBS
    1. Sources -> Add -> Video Capture Device
    1. Click the image and resize and move it to your liking
1. Add Browser Capture
    1. Sources -> Add -> Browser
    1. Paste the copied link
1. Start VirtualCam
    1. Controls -> Start Virtual Camera
1. Change your Video Source to OBS-Camera
    - In Zoom: Settings -> Video -> Camera -> OBS Virtual Camera
1. To test it press hot key
    - `1`, or `g` : Green
    - `2`, or `y` : Yellow
    - `3`, or `r` : Red

------

### To run from source:
1. Download
    - [NodeJS](https://nodejs.org/en/)
2. Run
    1. `npm install`
    2. `npm run build`
3. Start the application with `npm start`
4. Continue from step 3 of Usage above

-----

### To Develop:
1. Requirement
    - [NodeJS](https://nodejs.org/en/)
2. Install dependencies
    - `npm install`
3. Start webpack in dev mode
    - `npm run watch:web`
4. Start with ts-server with cache disabled
    - `npm run dev`
5. Open a browser at `localhost:8888`
    - Optionally the port can be changed by adding `port={number}` to the run dev command

-----

### Arguments
- **Port** [number] The port to listen on
- **Cache** [number or false] How long the client should cache the page for
- **One-Id** [string, boolean on nothing] Forces all ids to be the passed string or the string `aaaa` if true or nothing is passed
- **Open** [string or Nothing] Opens a browser window with optional parameter being the browser to open with

The arguments `port=80 cache=false one-id=true`

Are the same as `80 false one-id` and `80 false true`

And would cause the port to be set to 80, caching to be disabled, and all ids to be `aaaa`
