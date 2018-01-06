const config = require('./config');
const PeerServer = require('peer').PeerServer;
const server = PeerServer({port: config.port, path: '/p2p-voice', proxied: true});

jcmp.events.Add('PlayerReady', (player) => 
{
    jcmp.events.CallRemote('voice/init', player, player.client.steamId, JSON.stringify(config));
})

jcmp.events.AddRemoteCallable('voice/ready', (player, using_mic) => 
{
    player.using_mic = using_mic; // Whether or not the player has a microphone enabled

    const ids = jcmp.players.map((p) => ({sid: p.client.steamId, pid: p.networkId}));

    jcmp.events.CallRemote('voice/add_connections', player, JSON.stringify(ids));
    jcmp.events.CallRemote('voice/add_connection', null, player.client.steamId, player.networkId);
})

jcmp.events.Add('PlayerDestroyed', (player) => 
{
    jcmp.events.CallRemote('voice/remove_connection', null, player.client.steamId, player.networkId);
})
