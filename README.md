# beepr, the distributed web synth orchestra

Using websockets as a means of communication and the Web Audio API as a means of creating sounds, beepr tries
to explore the possibilities of web technology to collaboratively create music. Currently it is thought of as a
one-to-many mechanism, but this is easily expandable.

## Making it run

It's using node.js, so having node and npm installed is a must. After that you can simply run "npm install" and npm
will fetch the dependencies. To run the web app, just type "node app.js" into the terminal.

You can then open up various urls:

* http://localhost:8000/keyboard.html starts the control surface. That surface is known to work on desktop browsers (but obviously lags polyhpony support) and iOS-devices (iPad, iPhone).
* http://localhost:8000/ opens up the player. You can basically open as many of them as you want and have them all play the notes input by the control surface one by one.

## Credits

This hack uses node.js, express.js, socket.io and the wonderful Web Audio API.

Much <3 <3 <3 to the team that made the Music Hack Day become a thing - A pretty awesome thing that is.

