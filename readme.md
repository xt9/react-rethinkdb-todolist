# React websockets RethinkDB todolist app

## Prerequisites 
- RethinkDB installed
- A database called todolist
- A table called todos

## Setting up a demo
- run `npm install` in both the client and server folders.
- run rethinkdb
- start the backend from `server-todolist` using `node index.js`
- `npm start` inside of `client-todolist`

## Running e2e tests
Cypress tests can be inspected by running the command  `npx cypress open` from the client folder, for a step by step view of the tests.  

They can be executed headlessly using `npx cypress run`, this also records a video that can be found under cypress/videos 

## Predictable database state before test runs
Setting up db state is done with `Cypress` and can be found in client/cypress/plugin where cypress keeps all of its tasks.  
These are run before tests that need them to ensure a predictable db state.