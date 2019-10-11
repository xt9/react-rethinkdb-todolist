const r = require('./app/util/rethinkdbdash');
const socketIoJsonParser = require('socket.io-json-parser');

const io = require('socket.io')(3333, {
    parser: socketIoJsonParser
});

io.sockets.on('connection', function (socket) {
    /* Notifies the client about a db change, emits a payload with current todos */
    const sendTodos = () => {
        r.table('todos').orderBy('createdAt').run().then((todos) => {
            logEmitEvent('TODO_PAYLOAD');
            socket.emit('TODO_PAYLOAD', todos);
        });
    };

    /* Send todos when the client connects to the server */
    sendTodos();

    /* Events */
    socket.on('ADD_TODO', function (data) {
        logOnEvent('ADD_TODO', data);
        const todo = {
            body: data.value,
            isCompleted: false,
            createdAt: new Date()
        };
        r.table('todos').insert(todo).run().then(sendTodos);
    });

    socket.on('DELETE_COMPLETED', function (data) {
        logOnEvent('DELETE_COMPLETED', data);
        r.table('todos').getAll(r.args(data.ids)).delete().run().then(sendTodos);
    });

    socket.on('TOGGLE_COMPLETED', function (data) {
        logOnEvent('TOGGLE_COMPLETED', data);
        r.table('todos').get(data.id).update({ isCompleted: !data.isCompleted }).run().then(sendTodos);
    });
});

function logEmitEvent(event) {
    console.info(getHHmmSS() + ': Emitting EVENT: ' + event + ' to CLIENT');
}

function logOnEvent(event, msg) {
    console.info(getHHmmSS() + ': Received EVENT: ' + event + ' from CLIENT with msg: ', msg);
}

function getHHmmSS() {
    let date = new Date();
    return date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
}
