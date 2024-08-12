ABOUT

This is a simple example of an almost bare bones GeoGuessr knock off. I included a small coordinate set of 500 preset coordinates around the US.
If you want more locations simply add your own coordinate set and replace coordinates.json.

The server is only needed if you wish to play multiplayer.

CLIENT:

To use the client it must be hosted in order to access the json file. To do this I have used http-server. 
1. Install`npm install http-server`.
2. Go to the /client directory and run http-server.
3. Go to your local IP address. (You can find this by running ipconfig on windows.) 

SERVER:
The server runs using node.js.
1. Install these packages using npm. `npm install express cors quick.db fs os`
2. Go to the directory /server.
3. Run node server.js
