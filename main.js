var PeerServer = require('peer').PeerServer;
var server = PeerServer({port: 9000, path: '/p2p-voice', proxied: true});

server.on('connection', function(id) 
{
    const player = GetPlayerById(id);
    console.log(`${player.name} (${id}) connected!`);
});

server.on('disconnect', function(id) 
{
    console.log(`${id} disconnected!`);
});

jcmp.events.Add('PlayerReady', (player) => 
{
    jcmp.events.CallRemote('voice/send_id', player, player.client.steamId);
})

jcmp.events.AddRemoteCallable('voice/ready', (player, using_mic) => 
{
    player.using_mic = using_mic; // Whether or not the player has a microphone enabled

    const ids = jcmp.players.map((p) => p.client.steamId);

    jcmp.events.CallRemote('voice/add_connections', player, JSON.stringify(ids));
    jcmp.events.CallRemote('voice/add_connection', null, player.client.steamId);
})

function GetPlayerById(id)
{
    return jcmp.players.find((p) => p.client.steamId === id);
}