import React, {useEffect, useState} from 'react';
import './App.css';
import Amplify, {API, Auth, graphqlOperation} from 'aws-amplify';
import awsconfig from './aws-exports';
import {AmplifySignOut, withAuthenticator} from '@aws-amplify/ui-react';
import {listTodos} from "./graphql/queries";
import {createTodo, deleteTodo, updateTodo} from "./graphql/mutations";
import {Paper, IconButton} from '@material-ui/core';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import DeleteIcon from '@material-ui/icons/Delete';
import Switch from '@material-ui/core/Switch';
import TextField from "@material-ui/core/TextField";


Amplify.configure(awsconfig);

function App() {

    const userEmail = Auth.user.attributes.email;

    const [todos, setTodos] = useState([]);
    const [todoTask, setTodoTask] = useState('');

    useEffect(() => {
        fetchTodos();
    }, []);

    const fetchTodos = async () => {
        try {
            const todoData = await API.graphql(graphqlOperation(listTodos, {
                filter: {
                    userEmail: {
                        eq: userEmail
                    }
                }
            }));
            const todoList = todoData.data.listTodos.items;
            console.log('todo list', todoList);
            setTodos(...todos, todoList);
        } catch (error) {
            console.log('error on fetching todos', error);
        }
    }

    const handleAddTask = async () => {
        try {
            const todo = {
                task: `${todoTask}`,
                done: false,
                userEmail: `${userEmail}`,
            }

            const dataTodo = await API.graphql(graphqlOperation(createTodo, {input: todo}));
            const newTodo = dataTodo.data.createTodo;
            setTodos([...todos, newTodo]);
        } catch (error) {
            console.log('error on add todo', error);
        }
    }

    const handleDeleteTask = async (idx) => {
        try {
            let todo = todos[idx];
            await API.graphql(graphqlOperation(deleteTodo, {input: {id: todo.id}}));

            let arr = [];
            todos.map((e) => {
                if (e.id !== todo.id) {
                    arr.push(e);
                }
            })
            setTodos(arr);
        } catch (error) {
            console.log('error on delete todo', error);
        }
    }

    const handleDoneTask = async (idx) => {
        try {
            let todo = todos[idx];
            if (todo.done === true) {
                todo.done = false;
            } else {
                todo.done = true;
            }

            delete todo.createdAt;
            delete todo.updatedAt;

            const todoData = await API.graphql(graphqlOperation(updateTodo, {input: todo}));
            const todoList = [...todos];
            todoList[idx] = todoData.data.updateTodo;
            setTodos(todoList);
        } catch (error) {
            console.log('error on update todo', error);
        }
    }

    return (
        <div className="App">
            <header className="App-header">
                <h2>Todo List</h2>
                <h2>{userEmail}</h2>
                <AmplifySignOut/>
            </header>
            <div>
                <TextField id="standard-basic" color='secondary' label="Learn English ..." onChange={(e) => {
                    setTodoTask(e.target.value)
                }}/>
                <IconButton aria-label="add" onClick={handleAddTask}>
                    <AddCircleIcon/>
                </IconButton>
            </div>
            <div>
                {todos.map((todo, idx) => {
                    return <Paper variant='outlined' elevation={2}>
                        <div className="todoCard">
                            <FiberManualRecordIcon/>
                            <div className="todoTask">{todo.task}</div>

                            <Switch checked={todo.done} onChange={() => handleDoneTask(idx)} name="checkedA"/>

                            <IconButton aria-label="delete" onClick={() => handleDeleteTask(idx)}>
                                <DeleteIcon/>
                            </IconButton>
                        </div>
                    </Paper>;
                })}
            </div>
        </div>
    );
}

export default withAuthenticator(App);
