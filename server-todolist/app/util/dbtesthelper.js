const r = require('./rethinkdbdash');

module.exports = {
    clearTodosTable: () => r.table('todos').delete().run(),
    completeAllTodos: () => {
        return r.table('todos').filter({ isCompleted: false }).update({ isCompleted: true }).run();
    }
}