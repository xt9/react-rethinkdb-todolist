const r = require('./app/util/rethinkdbdash');
const events = require('events');

const socketIoJsonParser = require('socket.io-json-parser');
const io = require('socket.io')(3333, {
    parser: socketIoJsonParser
});

const ee = new events.EventEmitter();

/* Setup our changefeed for the todos table */
r.table('todos').changes().run((err, cursor) => {
    if (err) { throw err; }

    /* Emit the event when the table changes */
    cursor.each((err, item) => {
        if (item.old_val === null) {
            logDBChange('INSERT');
            ee.emit('RETHINK_TODO_CHANGE', { type: 'TODO_INSERTED', todo: item });
        } else if (item.new_val === null) {
            logDBChange('DELETE');
            ee.emit('RETHINK_TODO_CHANGE', { type: 'TODO_DELETED', todo: item });
        } else {
            logDBChange('UPDATE');
            ee.emit('RETHINK_TODO_CHANGE', { type: 'TODO_UPDATED', todo: item });
        }
    });
});


io.on('connection', (socket) => {
    /* Send all our when the client connects to the server */
    r.table('todos').orderBy('createdAt').run().then((todos) => {
        logEmitEvent('TODO_PAYLOAD');
        socket.emit('TODO_PAYLOAD', todos);
    });

    /* Socket Events, reacting to emits from client */
    socket.on('ADD_TODO', (data) => {
        logOnEvent('ADD_TODO', data);
        r.table('todos').insert({ body: data.value, isCompleted: false, createdAt: new Date() }).run();
    });

    socket.on('DELETE_COMPLETED', (data) => {
        logOnEvent('DELETE_COMPLETED', data);
        r.table('todos').getAll(r.args(data.ids)).delete().run();
    });

    socket.on('TOGGLE_COMPLETED', (data) => {
        logOnEvent('TOGGLE_COMPLETED', data);
        r.table('todos').get(data.id).update({ isCompleted: !data.isCompleted }).run();
    });

    const dbChangeListener = (event) => {
        socket.emit(event.type, event.todo);
    }

    /* Listen on changefeed events */
    ee.on('RETHINK_TODO_CHANGE', dbChangeListener);

    socket.on('disconnect', () => {
        /* Remove listener on disconnect so it does not stay in memory */
        ee.removeListener('RETHINK_TODO_CHANGE', dbChangeListener);
    });
});

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
