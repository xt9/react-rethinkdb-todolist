import React, { useReducer, useEffect, useRef } from 'react';

import produce from "immer";
import ioc from 'socket.io-client';
import jsonParser from 'socket.io-json-parser';

import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, ListGroup, InputGroup, FormControl, OverlayTrigger, Tooltip } from 'react-bootstrap';
import './App.css';

let io = ioc('ws://localhost:' + 3333, {
    parser: jsonParser
});

const reducer = produce((draft, action) => {
    switch (action.type) {
        case 'RECEIVED_TODOS':
            console.log('TODO LIST CHANGED at', new Date());
            return action.todos;
        default:
            break;
    }
});

const App = () => {
    const [todos, dispatch] = useReducer(reducer, []);
    const todoInput = useRef(null);
    const completed = todos.filter((todo) => todo.isCompleted);

    // useEffect with no deps will only run once when mounted (no return callback so it wont be called on unmount)
    useEffect(() => {
        /* Attach a listener for the TODO_PAYLOAD event */
        io.on('TODO_PAYLOAD', (todos) => dispatch({ type: 'RECEIVED_TODOS', todos: todos }));
    }, []);

    function addTodo() {
        /* Only having Client validation is poor practice, but this is just a quick example so we dont care */
        if (todoInput.current.value.trim().length > 0) {
            io.emit('ADD_TODO', { value: todoInput.current.value });
            todoInput.current.value = '';
        }
    }

    function deleteCompleted() {
        let ids = [];
        completed.forEach(todo => {
            ids.push(todo.id);
        });
        /* Collect the ids of our completed todos and pass them along in the emit */
        io.emit('DELETE_COMPLETED', { ids: ids });
    }

    function toggleCompleted(id, isCompleted) {
        io.emit('TOGGLE_COMPLETED', { id: id, isCompleted: isCompleted });
    }

    return (
        <div className="App">
            <h4>Add Todos</h4>

            <InputGroup className="mb-3">
                <FormControl placeholder="Feed the T-rex out back" ref={todoInput} />
                <Button variant="success" className="btn-add" onClick={() => addTodo()}>Add Todo</Button>
            </InputGroup>

            <h4>Your Todos ({todos.length})</h4>
            <ListGroup>
                {todos.map((todo, i) => {
                    return (
                        <OverlayTrigger placement='left' overlay={<Tooltip>Clicking me will mark me as {todo.isCompleted ? 'uncompleted' : 'completed'}.</Tooltip>}>
                            <ListGroup.Item className={todo.isCompleted ? 'completed-todo' : ''} key={i} onClick={() => toggleCompleted(todo.id, todo.isCompleted)}>
                                {todo.body}
                            </ListGroup.Item>
                        </OverlayTrigger>
                    );
                })}
            </ListGroup>
            <Button variant="outline-danger" disabled={completed.length === 0} onClick={() => deleteCompleted()}>
                Delete Completed ({completed.length})
            </Button>
        </div>
    );
}

export default App;
