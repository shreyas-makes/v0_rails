import React, { useState } from 'react';

const TodoList = ({ initialTodos = [], title = 'Todo List' }) => {
  const [todos, setTodos] = useState(initialTodos);
  const [newTodo, setNewTodo] = useState('');

  const handleAddTodo = () => {
    if (newTodo.trim() === '') return;
    
    setTodos([...todos, { id: Date.now(), text: newTodo, completed: false }]);
    setNewTodo('');
  };

  const handleToggleTodo = (id) => {
    setTodos(
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleDeleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-4">
      <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>
      
      <div className="flex mb-4">
        <input
          type="text"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Add a new todo..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
        />
        <button
          className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={handleAddTodo}
        >
          Add
        </button>
      </div>
      
      <ul className="divide-y divide-gray-200">
        {todos.map(todo => (
          <li key={todo.id} className="py-2 flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={todo.completed}
                onChange={() => handleToggleTodo(todo.id)}
              />
              <span className={todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}>
                {todo.text}
              </span>
            </div>
            <button
              className="text-red-500 hover:text-red-700 ml-2"
              onClick={() => handleDeleteTodo(todo.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      
      {todos.length === 0 && (
        <p className="text-gray-500 text-center mt-4">No todos yet. Add one above!</p>
      )}
      
      {todos.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          {todos.filter(todo => todo.completed).length} of {todos.length} completed
        </div>
      )}
    </div>
  );
};

export default TodoList; 