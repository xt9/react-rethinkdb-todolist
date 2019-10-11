const r = require('./app/util/rethinkdbdash');
const socketIoJsonParser = require('socket.io-json-parser');

const io = require('socket.io')(3333, {
    parser: socketIoJsonParser
});

io.on('connection', (socket) => {
    /* Send all our when the client connects to the server */
    r.table('todos').orderBy('createdAt').run().then((todos) => {
        logEmitEvent('TODO_PAYLOAD');
        socket.emit('TODO_PAYLOAD', todos);
    });

    /* Setup our changefeed, pass the socket so it can emit on updates, and close the cursor when the socket disconnects */
    setupTodosDBListener(socket);

    /* Socket Events, reacting to emits from client */
    socket.on('ADD_TODO', function (data) {
        logOnEvent('ADD_TODO', data);
        r.table('todos').insert({ body: data.value, isCompleted: false, createdAt: new Date() }).run();
    });

    socket.on('DELETE_COMPLETED', function (data) {
        logOnEvent('DELETE_COMPLETED', data);
        r.table('todos').getAll(r.args(data.ids)).delete().run();
    });

    socket.on('TOGGLE_COMPLETED', function (data) {
        logOnEvent('TOGGLE_COMPLETED', data);
        r.table('todos').get(data.id).update({ isCompleted: !data.isCompleted }).run();
    });

});

function setupTodosDBListener(socket) {
    r.table('todos').changes().run((err, cursor) => {
        if (err) { throw err; }

        cursor.each((err, item) => {
            if (item.old_val === null) {
                logDBChange('INSERT');
                socket.emit('RETHINK_TODO_INSERTED', item);
            } else if (item.new_val === null) {
                logDBChange('DELETE');
                socket.emit('RETHINK_TODO_DELETED', item);
            } else {
                logDBChange('UPDATE');
                socket.emit('RETHINK_TODO_UPDATED', item);
            }
        });

        socket.on('disconnect', () => {
            console.log('client leaving, closing feed');
            cursor.close();
        });
    });
}

/* Logging Functions */
function logDBChange(type) {
    console.info(getHHmmSS() + ': Detected change in DB of type: ' + type);
}

function logEmitEvent(event) {
    console.info(getHHmmSS() + ': Emitting EVENT: ' + event + ' to CLIENT');
}

function logOnEvent(event, msg) {
    console.info(getHHmmSS() + ': Received EVENT: ' + event + ' from CLIENT with msg: ', msg);
}

function getHHmmSS() {
    let date = new Date();
    /* TODO, fix numbers with no leading zeroes */
    return date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
}
