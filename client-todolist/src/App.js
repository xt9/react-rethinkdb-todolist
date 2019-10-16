import React, { useRef } from 'react';

import ioc from 'socket.io-client';
import jsonParser from 'socket.io-json-parser';
import useTodos from './hooks/useTodos';

import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, InputGroup, FormControl } from 'react-bootstrap';
import './App.scss';

let socket = ioc('ws://localhost:' + 3333, {
    parser: jsonParser
});

const App = () => {
    const { todos, completed, addTodo, deleteCompleted, toggleCompleted } = useTodos(socket);
    const todoInput = useRef(null);

    const addTodoHandler = (e) => {
        if (e.key === 'Enter') {
            addTodo(todoInput.current);
        }
    };

    return (
        <div className="App">
            <h4>Add Todos</h4>

            <InputGroup className="mb-3">
                <FormControl
                    className="add-todo"
                    ref={todoInput}
                    onKeyDown={addTodoHandler}
                    placeholder="Throw gasoline on spider-infested house"
                />
                <Button variant="success" className="btn-add add-todo" onClick={() => addTodo(todoInput.current)}>Add Todo</Button>
            </InputGroup>

            <h4>Your Todos ({todos.length})</h4>

            <div className="todolist">
                {todos.map((todo, i) => {
                    return (
                        <div key={i} className='todoitem'>
                            <input
                                id={'todo' + i}
                                type="checkbox"
                                checked={todo.isCompleted}
                                onChange={() => toggleCompleted(todo.id, todo.isCompleted)}
                            />
                            <label htmlFor={'todo' + i}>{todo.body}</label>
                        </div>
                    );
                })}
            </div>
            <Button id="delete-todos" variant="outline-danger" disabled={completed.length === 0} onClick={() => deleteCompleted()}>
                Delete Completed ({completed.length})
            </Button>
        </div>
    );
}

export default App;
