const r = require('rethinkdbdash')({
    db: 'todolist'
})

module.exports = r;