$(document).ready(function() 
{
    // 3D stuff
    const camera_pos = {x: 0, y: 0, z: 0};

    // Update the camera's position and rotation
    jcmp.AddEvent('update_camera', (x, y, z) => 
    {
        camera_pos.x = x;
        camera_pos.y = y;
        camera_pos.z = z;
    })

    // Update position of a player
    jcmp.AddEvent('update_position', (sid, x, y, z) => 
    {
        if (!calls[sid]) // If there is no active call, do nothing
        {
            return;
        }

        if (!calls[sid].source)
        {
            return;
        }

        calls[sid].source.setPosition(x - camera_pos.x, y - camera_pos.y, z - camera_pos.z);

    })

    // ----------------------------------- END 3D STUFF

    
    const audioContext = new AudioContext();
    const resonanceAudioScene = new ResonanceAudio(audioContext);
    resonanceAudioScene.output.connect(audioContext.destination);

    let enabled = true;
    let my_id; // Steam id
    let mediaStream; // This client's mediaStream
    let peer; // This client's peer
    const calls_outgoing = {};
    const calls = {};
    let host; // Host address for id
    let port; // Port address for id
    let talk_key; // Key to use push to talk
    let max_distance, min_distance;
    const ids = []; // peer ids of players in range
    let talking = false; // Whether or not we are talking

    function AddStreamToPage(stream, id) 
    {
        StopCall(id); // Stop in case there is a call going already with same id
        const audioElement = document.createElement('audio');
        audioElement.srcObject = stream;
        audioElement.id = `a_${id}`;
        audioElement.volume = 1;

        const audioElementSource = audioContext.createMediaStreamSource(stream);

        const source = resonanceAudioScene.createSource({
            minDistance: min_distance,
            maxDistance: max_distance
        });
        audioElementSource.connect(source.input);

        calls[id].source = source;
        calls[id].audioElement = audioElement;

        audioElement.play();
        audioElement.muted = true; // Mute

    }

    jcmp.AddEvent('init', (id, config) => 
    {
        my_id = id;

        if (config)
        {
            config = JSON.parse(config);
            host = config.host;
            port = config.port;
            min_distance = config.min_distance;
            max_distance = config.max_distance;
            talk_key = config.talk_key.toUpperCase();
            ConnectToServer();
        }
    })

    jcmp.AddEvent('toggle_enabled', (e) => 
    {
        enabled = e;
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
    })

    jcmp.AddEvent('remove_id', (id) => 
    {
        if (ids.indexOf(id) > -1)
        {
            ids.splice(ids.indexOf(id), 1);
        }
    })

    // Player begins holding down key to talk
    document.onkeydown = (e) => 
    {
        const key = e.keyCode;

        if (!key || !talk_key) {return;}
 
        if (key != talk_key.charCodeAt(0) || talking || !enabled) {return;}

        talking = true;
        StartVoice();
        jcmp.CallLocalEvent('player_start_call', my_id);
    };

    // Player releases key to stop talking
    document.onkeyup = (e) => 
    {
        const key = e.keyCode;

        if (!key || !talk_key) {return;}
 
        if (key != talk_key.charCodeAt(0) || !talking) {return;}

        talking = false;
        EndVoice();
        jcmp.CallLocalEvent('player_end_call', my_id);
    };

    // ------------------ PEER FUNCTIONS

    /**
     * Connects our P2P client with ID and registers events
     */
    function ConnectToServer()
    {
        // Create our peer
        peer = new Peer(my_id, {host: host, port: port, path: '/p2p-voice', debug: 2});

        // When we get an id from the server
        peer.on('open', function(id) 
        {
            jcmp.CallLocalEvent('ready', mediaStream != undefined);
        });

        // When someone calls us
        peer.on('call', function(call) 
        {
            calls[call.peer] = {call: call};

            jcmp.CallLocalEvent('player_start_call', call.peer);
            call.answer(); // Only listen to others, and they will listen to you

            call.on('stream', function(stream) 
            {
                AddStreamToPage(stream, call.peer);
            })

            call.on('close', function() 
            {
                StopCall(call.peer);
                jcmp.CallLocalEvent('player_end_call', call.peer);
                delete calls[call.peer];
            })
        });

        peer.on('close', function()
        {
            peer.reconnect(); // Reconnect if we disconnect somehow
        })
    }

    /**
     * Stops an in progress call.
     */
    function StopCall(id)
    {
        if (calls[id] && calls[id].audioElement) 
        {
            calls[id].audioElement.muted = true;
            calls[id].audioElement.src = "";
        }
    }

    /**
     * Call another peer by steam id
     */
    function CallPeer(id)
    {
        // Call another peer
        let call = peer.call(id, mediaStream).on('error', function(err) 
        {
            console.log('ERROR!');
            console.log(err);

            if (calls_outgoing[id]) 
            {
                calls_outgoing[id].call.close(); 
                delete calls_outgoing[id];
            }
        });

        if (!call) {return;}

        calls_outgoing[id] = {call: call};
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
        for (let id in calls_outgoing)
        {
            calls_outgoing[id].call.close(); // End all calls
            delete calls_outgoing[id];
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

    setInterval(function() 
    {
        jcmp.CallLocalEvent('second');
    }, 1000);

})
