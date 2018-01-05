# jc3mp-voice-chat
Peer to peer ingame voice chat for Just Cause 3 Multiplayer

## Installation
Drop it in your packages directory, and you're done!

## Configuration
There's a little bit of configuration you need to do before you can use voice chat.

1. Replace `MY SERVER IP` with your server's IP address in `config.js`
2. (optional) Change the port in `config.js` to a different port.
3. (optional) Adjust `max_distance` and `min_distance` to your liking in `config.js`

## Additional Notes
- This voice chat is peer to peer, which means all voice data is transferred directly between clients and not through the server. This means that no strain is put on the server when you run this package.
- You can actually make this voice chat global. Not recommended for crowded servers.