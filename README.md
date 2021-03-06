# jc3mp-voice-chat
Peer to peer ingame voice chat for Just Cause 3 Multiplayer

![](https://i.imgur.com/zha9X7c.png)

## Installation
1. Drop it in your packages directory.
2. Run `npm install` inside the package to install the required node module.

## Configuration
There's a little bit of configuration you need to do before you can use voice chat.

1. Replace `MY SERVER IP` with your server's IP address in `config.js`
2. (optional) Change the port in `config.js` to a different port.
3. (optional) Adjust `max_distance` and `min_distance` to your liking in `config.js`
4. (optional) Change the `talk_key` to whatever key you want in `config.js`

## Additional Notes
- This voice chat is peer to peer, which means all voice data is transferred directly between clients and not through the server. This means that no strain is put on the server when you run this package.
- The maximum distance is capped to a player's streaming range, so it cannot be global. I may add an option for global voice later.
- Players have a red speaker icon next to their head when they talk.
- The port in `config.js` must be open to allow voice chat to work.

## Bugs
- Media Access Request popup doesn't work quite right, and this will be fixed in a later update by nanos. See [here](https://gitlab.nanos.io/jc3mp/bugs/issues/494).
- Not recommended for production use yet because sometimes microphone streams don't stop when you stop holding down the push to talk key. This makes voices global and no longer push to talk. I am investigating this issue.

## Todo
- Add a small UI so that players can mute other players, adjust volume, or disable entirely.