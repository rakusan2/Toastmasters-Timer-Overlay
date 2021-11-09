# Toastmasters Timer Overlay
This is a webpage that can be used as an overlay for the purpose of timing for a Toastmasters meeting

The Overlay is controlled from a local website that is mirrored across all with the same id. The view parameter hides the controls

OBS will hide the background

![site Usage](/img/site.gif)

-----

## Usage:
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

## To run from source:
1. Download
    - [NodeJS](https://nodejs.org/en/)
2. Run
    1. `npm install`
    2. `npm run build`
3. Start the application with `npm start`
4. Continue from step 3 of Usage above

-----

## To Develop:
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

## Arguments
| Name | Alias | Type | Description |
| ---- | ----- | ---- | ----------- |
| **Port** | p | Number | The port to listen on|
| **Cache** |  | Number | How long the client should cache the page for
| **Cache** |  | False | Disable client-side Cache
| **One-Id** | i | String | Sets all ID's to be the assigned value
| **One-Id** | i | True or Switch | Sets all ID's to be the assigned the value `aaaa`
| **Open** | o | Switch | Opens a browser window |
| **Open** | o | String | Opens the specified browser window |
| **OBS** | b | Switch | Opens OBS with Virtual Camera enabled |
| **OBS** | b | String | Opens OBS at assigned path with Virtual Camera enabled |
| **OBS-CWD** |  | String | Location from where to launch OBS |
| **OBS-Profile** |  | String | Sets OBS Profile |
| **OBS-Scene** |  | String | Sets OBS Scene
| **OBS-Minimize** | obs-min | Switch | Sets OBS minimize on start to true
| **ssl** |  | String | File path to SSL directory with both SSL certificate and Key
| **ssl-cert** |  | String | File path to SSL Certificate
| **ssl-key** |  | String | File path to SSL Key
| **UDP** | u | Switch | Starts UDP socket on port 8889
| **UDP** | u | Number | Starts UDP socket on assigned port
| **UDP-Interface** | | String | Sets which Interface will be used by UDP. (Can be Network Adapter Name or an IP address used by a Network Adapter)
| **Broadcast** |  | Switch | Sets UDP Socket to broadcast timing info to port 8890
| **Broadcast** |  | Number | Sets UDP Socket to broadcast timing info to assigned port
| **Broadcast-User** | b-user | String | Sets UDP Socket broadcast filter (Can be assigned more than once)
| **TCP** | t | Switch | Sets up TCP Server on port 8891
| **TCP** | t | Number | Sets up TCP Server on assigned port
| **TCP-Interface** | | String | Sets which Interface will be used by TCP. (Can be Network Adapter Name or an IP address used by a Network Adapter)

The arguments `port=80 cache=false one-id=true` are the same as any of the following:
- `--port 80 --cache false --one-id true`
- `-p 80 --cache false -i`
- `80 false one-id` 
- `80 false true`

All Arguments are case insensitive

**Warning:** Any argument starting with a `-` will disable all switches and assignments without them

Example: `-p 80 one-id=abcd` will set 80 to **Port** and `one-id=abcd` to **Cache** 

----

## Socket
A UDP Socket transmitting timing info

### Packet Definition
| Name | Size | Description |
| ---- | ---- | ----------- |
| Magic Value (0xAEE8A872) | 4 bytes | There to verify that the packet is coming from the timer. (Only UDP)
| User Count | 1 byte | Number of Users in the packet
| **User Definition**
| ID length | 1 byte | byte length of the ID
| ID | N bytes | UTF-8 Encoded String
| Elapsed ms | 4 bytes | Milliseconds since the timer started
| Green s | 2 bytes | Seconds from start till green is shown 
| Yellow s | 2 bytes | Seconds from start till yellow is shown 
| Red s | 2 bytes | Seconds from start till red is shown 
| Overtime s | 2 bytes | Seconds from start till overtime is shown 

### Request Packet Definition
| Name | Size | Description |
| ---- | ---- | ----------- |
| Magic Number (0x7DAE0492) | 4 bytes | (Only UDP) |
| Port | 2 bytes | Port to send data to. (Only UDP) |
| Type | 1 byte | Message Type |
| Data | N bytes | Look for definition below |

#### Stop (Type 0)
Stops sending packets

#### User Info (Type 1)
| Name | Size | Description |
| ---- | ---- | ----------- |
| User Count | 1 byte | Number of users in packet |
| **User Definition**
| ID length | 1 byte | Byte length of User ID |
| ID | N bytes | UTF-8 Encoded String |

Integers are Big-Endian encoded UInt

----

## Hint

The easiest way to run the program is to add the parameters `one-id open obs-min`\
This will:
1. Set all ids to be `aaaa`
1. Open a browser window with the controls
1. Open OBS with Virtual Camera enabled and minimized to tray
    - Closing the process will close OBS as well
    - the parameter `obs` can be used instead to not minimize obs