$(document).ready(function() 
{
    let my_id; // Steam id
    let mediaStream; // This client's mediaStream
    let peer; // This client's peer
    const calls = {};
    const HOST = 'localhost';
    const talk_key = 192; // ` key
    const ids = [];
    let talking = false;

    function AddStreamToPage(stream, id) 
    {
        $(`#a_${id}`).remove(); // Remove if there is an existing stream of same id
        $('html').append(
            $(`<audio id='a_${id}' src='${window.URL.createObjectURL(stream)}' autoplay></audio>`));
    }

    jcmp.AddEvent('set_id', (id) => 
    {
        my_id = id;

        ConnectToServer();
    })

    jcmp.AddEvent('add_id', (id) => 
    {
        if (id == my_id) {return;}
        if (!ids.includes(id))
        {
            ids.push(id);

            if (talking) // If the player is currently talking, connect to the new peer too
            {
                CallPeer(id);
            }
        }
        //CallPeer(id);
    })

    // Player begins holding down key to talk
    document.onkeydown = (e) => 
    {
        const key = (typeof e.which === 'number') ? e.which : e.keyCode;

        if (key != talk_key || talking) {return;}

        talking = true;
        StartVoice();
        console.log('Begin talking');
    };

    // Player releases key to stop talking
    document.onkeyup = (e) => 
    {
        const key = (typeof e.which === 'number') ? e.which : e.keyCode;

        if (key != talk_key || !talking) {return;}

        talking = false;
        EndVoice();
        console.log('End talking');
    };

    // ------------------ PEER FUNCTIONS

    /**
     * Connects our P2P client with ID and registers events
     */
    function ConnectToServer()
    {
        // Create our peer
        peer = new Peer(my_id, {host: HOST, port: 9000, path: '/p2p-voice', debug: 2});

        // When we get an id from the server
        peer.on('open', function(id) {
            console.log('My peer ID is: ' + id);
            jcmp.CallLocalEvent('ready', mediaStream != undefined);
        });

        // When someone calls us
        peer.on('call', function(call) 
        {
            console.log(`Someone called us, answering...`);
            // Answer the call, providing our mediaStream
            //if (!mediaStream) {return;}
            //call.answer(mediaStream);
            call.answer(); // Only listen to others, and they will listen to you

            call.on('stream', function(stream) 
            {
                console.log(`We got a stream from a peer 2!`);
                AddStreamToPage(stream, call.peer);
            })

            call.on('close', function() 
            {
                $(`#a_${call.peer}`).remove();
            })
        });

        peer.on('close', function()
        {
            peer.reconnect(); // Reconnect if we disconnect somehow
        })
    }

    /**
     * Call another peer by steam id
     */
    function CallPeer(id)
    {
        console.log(`Calling peer ${id}...`)
        // Call another peer
        let call = peer.call(id, mediaStream).on('error', function(err) 
        {
            console.log('ERROR!');
            console.log(err);
            $(`#a_${id}`).remove();
        });

        if (!call) {return;}

        calls[id] = call;
    }

    /**
     * Called when the player presses the talk key
     */
    function StartVoice()
    {
        for (let i = 0; i < ids.length; i++)
        {
            CallPeer(ids[i]);
        }
    }

    /**
     * Called when the player releases the talk key
     */
    function EndVoice()
    {
        for (let id in calls)
        {
            calls[id].close(); // End all calls
            delete calls[id];
        }
    }


    // ------------------ END PEER FUNCTIONS

    // Get microphone media stream
    navigator.mediaDevices.getUserMedia({audio: true, video: false})
    .then(function(stream) {
        mediaStream = stream;
        jcmp.CallLocalEvent('ui_ready');
        //AddStreamToPage(mediaStream, '3213123'); 
    })
    .catch(function(err) {
        console.log(err);
        jcmp.CallLocalEvent('ui_ready');
        // Client denied using media
    });

})
