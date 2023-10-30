
import React from 'react';

function UserList({ users, onSelectUser }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-red-500">Пользователи</h2>
      <ul>
        {users.map(user => (
          <li
            key={user.ID}
            onClick={() => onSelectUser(user.ID)}
            className="cursor-pointer hover:bg-gray-200 p-2 rounded"
          >
            {user.NAME} {user.LAST_NAME}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UserList;
