import React, { useState } from 'react';
import TaskList from './components/TaskList';
import FilterInput from './components/FilterInput';
import './App.css';
import DepartmentTree from './components/DepartmentTree';

function App() {
  // const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tasksResult, setTasksResult] = useState(null);
  const [filterInput, setFilterInput] = useState('');

  return (
    <div className="App p-4 bg-gray-100 min-h-screen">
      <div className="grid grid-cols-2 gap-4">
        <h1 className="text-2xl">Просмотр заданий БП</h1>
        <FilterInput onChange={setFilterInput} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <DepartmentTree onSelectUser={setSelectedUser} setTasks={setTasks} setTasksResult={setTasksResult} />
        {selectedUser && <TaskList selectedUser={selectedUser} tasks={tasks} tasksResult={tasksResult} setTasks={setTasks} setTasksResult={setTasksResult} />}
      </div>
    </div>
  );
}

export default App;
