import { useReducer, useEffect } from 'react';
import produce from "immer";

const reducer = produce((draft, action) => {
    let matchesActionId = (todo) => todo.id === action.data.old_val.id;
    switch (action.type) {
        case 'RECEIVED_TODOS':
            return action.data;
        case 'TODO_INSERTED':
            draft.push(action.data.new_val);
            return;
        case 'TODO_DELETED':
            draft.splice(draft.findIndex(matchesActionId), 1);
            return;
        case 'TODO_UPDATED':
            draft[draft.findIndex(matchesActionId)] = action.data.new_val;
            return;
        default:
            break;
    }
});

const useTodos = (socket) => {
    const [todos, dispatch] = useReducer(reducer, []);
    const completed = todos.filter((todo) => todo.isCompleted);

    // useEffect with socket as deps will only run once when mounted (no return callback so it wont be called on unmount)
    useEffect(() => {
        /* Attach a listeners */
        socket.on('TODO_PAYLOAD', (todos) => dispatch({ type: 'RECEIVED_TODOS', data: todos }));
        socket.on('RETHINK_TODO_INSERTED', (todo) => dispatch({ type: 'TODO_INSERTED', data: todo }));
        socket.on('RETHINK_TODO_DELETED', (todo) => dispatch({ type: 'TODO_DELETED', data: todo }));
        socket.on('RETHINK_TODO_UPDATED', (todo) => dispatch({ type: 'TODO_UPDATED', data: todo }));
    }, [socket]);

    function addTodo(currentInput) {
        /* Only having Client validation is poor practice, but this is just a quick example so we dont care */
        if (currentInput.value.trim().length > 0) {
            socket.emit('ADD_TODO', { value: currentInput.value });
            currentInput.value = '';
        }
    }

    function deleteCompleted() {
        socket.emit('DELETE_COMPLETED', { ids: completed.map(todo => todo.id) });
    }

    function toggleCompleted(id, isCompleted) {
        socket.emit('TOGGLE_COMPLETED', { id: id, isCompleted: isCompleted });
    }

    return {
        addTodo,
        deleteCompleted,
        toggleCompleted,
        dispatch,
        todos,
        completed
    };
};

export default useTodos;