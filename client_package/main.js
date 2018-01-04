const ui = new WebUIWindow('voice', 'package://voice/ui/index.html', new Vector2(1,1));
let my_id;

// Set ID when UI is loaded
ui.AddEvent('ui_ready', () => 
{
    ui.CallEvent('set_id', my_id);
})

// Called when the client is ready to connect to others
ui.AddEvent('ready', (using_mic) => 
{
    jcmp.events.CallRemote('voice/ready', using_mic);
})

// Set ID when we receive ID (UI may or may not be loaded)
jcmp.events.AddRemoteCallable('voice/send_id', (id) => 
{
    my_id = id;
    ui.CallEvent('set_id', my_id);
})

jcmp.events.AddRemoteCallable('voice/add_connections', (conns) => 
{
    conns = JSON.parse(conns);

    for (let i = 0; i < conns.length; i++)
    {
        ui.CallEvent('add_id', conns[i]);
    }
})

jcmp.events.AddRemoteCallable('voice/add_connection', (conn) => 
{
    ui.CallEvent('add_id', conn);
})