const ui = new WebUIWindow('voice', 'package://voice/ui/index.html', new Vector2(600,600));
ui.autoRenderTexture = false;
ui.hidden = true;
let my_id;
let config;
const connections = {}; // [pid] = sid
const players_talking = []; // sids

const offset = new Vector3f(0.5, 0, 0);
const zero = new Vector3f(300, -300, 0);
const size = new Vector2f(512, 512);
const scale = new Vector3f(0.0006, 0.0006, 0.0006);
const rot = new Vector3f(0, 0, 0);

// Set ID when UI is loaded
ui.AddEvent('ui_ready', () => 
{
    ui.CallEvent('init', my_id, (config) ? JSON.stringify(config) : config);
})

// Called when the client is ready to connect to others
ui.AddEvent('ready', (using_mic) => 
{
    jcmp.events.CallRemote('voice/ready', using_mic);
})

// Set ID when we receive ID (UI may or may not be loaded)
jcmp.events.AddRemoteCallable('voice/init', (id, cfg) => 
{
    my_id = id;
    config = JSON.parse(cfg);
    ui.CallEvent('init', my_id, cfg);
})

jcmp.events.AddRemoteCallable('voice/add_connections', (conns) => 
{
    conns = JSON.parse(conns);

    for (let i = 0; i < conns.length; i++)
    {
        connections[conns[i].pid] = conns[i].sid;
    }
})

jcmp.events.AddRemoteCallable('voice/add_connection', (sid, pid) => 
{
    connections[pid] = sid;
})

jcmp.events.AddRemoteCallable('voice/remove_connection', (sid, pid) => 
{
    ui.CallEvent('remove_id', sid);
    delete connections[pid];
})

ui.AddEvent('player_start_call', (sid) => 
{
    if (players_talking.includes(sid)) {return;} // If it's already there, don't add it
    players_talking.push(sid); // Add to array of players talking
})

ui.AddEvent('player_end_call', (sid) => 
{
    if (!players_talking.includes(sid)) {return;} // If it's not there, do nothing
    players_talking.splice(players_talking.indexOf(sid), 1); // Remove it
})

jcmp.events.Add('GameUpdateRender', (r) => 
{
    if (!ui) {return;}

    const pos = jcmp.localPlayer.camera.position;
    const rot = jcmp.localPlayer.camera.rotation;
    ui.CallEvent('update_camera', pos.x, pos.y, pos.z, rot.x, rot.y);

    // Update positions of people who are talking
    for (let i = 0; i < players_talking.length; i++)
    {
        const sid = players_talking[i];
        const pid = GetPidFromSid(sid);
        let player = jcmp.players.find((p) => p.networkId == pid);

        if (pid !== undefined && player)
        {
            const player_pos = player.GetBoneTransform(0x87AE44CB, r.dtf).position; // Upper lip

            ui.CallEvent('update_position', sid, player_pos.x, player_pos.y, player_pos.z);

            RenderSpeaker(r, player.GetBoneTransform(0xA877D9CC, r.dtf));
        }
        else if (sid == my_id)
        {
            player = jcmp.players.find((p) => p.networkId == jcmp.localPlayer.networkId);
            if (player)
            {
                RenderSpeaker(r, player.GetBoneTransform(0xA877D9CC, r.dtf));
            }
        }
    }
})

// Block voice chat from triggering while someone is typing
jcmp.ui.AddEvent('chat_input_state', (s) => 
{
    if (!ui) {return;}
    ui.CallEvent('toggle_enabled', !s);
});

/**
 * Renders a speaker icon next to a player's head in game.
 */
function RenderSpeaker(r, m)
{
    r.SetTransform(m.Scale(scale));
    r.DrawTexture(ui.texture, zero, size);
}

// Every second, check close people
ui.AddEvent('second', () => 
{
    const player_pos = jcmp.localPlayer.position;
    for (let pid in connections)
    {
        const sid = connections[pid];
        if (IsInRange(pid, player_pos))
        {
            ui.CallEvent('add_id', sid);
        }
        else
        {
            ui.CallEvent('remove_id', sid);
        }
    }
})

/**
 * Checks if a player with pid is in range of position
 */
function IsInRange(pid, pos)
{
    let player = jcmp.players.find((p) => p.networkId == pid);
    if (player && config)
    {
        let dist = player.position.sub(pos).length;
        if (dist < config.max_distance + 50) // Small buffer to improve smoothness as people move
        {
            return true;
        }
    }

    return false;
}

function GetPidFromSid(sid)
{
    for (let pid in connections)
    {
        if (connections[pid] === sid)
        {
            return pid;
        }
    }
    return;
}