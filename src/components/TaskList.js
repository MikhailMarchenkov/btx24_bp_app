
import React, { useEffect, useState } from 'react';
import TaskCard from './TaskCard';
import BX24 from '../btx-api';


function TaskList({ selectedUser, tasks, tasksResult, setTasks, setTasksResult }) {

  useEffect(() => {
    if (selectedUser) {
      fetchTasksForUser(selectedUser);
    }
  }, [selectedUser]);

  const fetchUserInfo = async (userId) => {
    const result = await BX24.callMethod('user.get', { ID: userId });
    return result.data()[0];
  };

  const fetchTasksForUser = async (userId) => {
    const baseParams = {
      select: [
        'ID',
        'WORKFLOW_ID',
        'DOCUMENT_NAME',
        'DESCRIPTION',
        'NAME',
        'MODIFIED',
        'WORKFLOW_STARTED',
        'WORKFLOW_STARTED_BY',
        'OVERDUE_DATE',
        'WORKFLOW_TEMPLATE_ID',
        'WORKFLOW_TEMPLATE_NAME',
        'WORKFLOW_STATE',
        'STATUS',
        'USER_ID',
        'USER_STATUS',
        'MODULE_ID',
        'ENTITY',
        'DOCUMENT_ID',
        'ACTIVITY',
        'ACTIVITY_NAME',
        'PARAMETERS'
      ],
      order: {
        ID: 'DESC'
      }
    };
    // const params = {
    //   select: [
    //     'ID',
    //     'WORKFLOW_ID',
    //     'DOCUMENT_NAME',
    //     'DESCRIPTION',
    //     'NAME',
    //     'MODIFIED',
    //     'WORKFLOW_STARTED',
    //     'WORKFLOW_STARTED_BY',
    //     'OVERDUE_DATE',
    //     'WORKFLOW_TEMPLATE_ID',
    //     'WORKFLOW_TEMPLATE_NAME',
    //     'WORKFLOW_STATE',
    //     'STATUS',
    //     'USER_ID',
    //     'USER_STATUS',
    //     'MODULE_ID',
    //     'ENTITY',
    //     'DOCUMENT_ID',
    //     'ACTIVITY',
    //     'ACTIVITY_NAME',
    //     'PARAMETERS'
    //   ],
    //   order: {
    //     ID: 'DESC'
    //   },
    //   FILTER: {
    //     LOGIC: 'OR',
    //     'USER_ID': userId,
    //     'WORKFLOW_STARTED_BY': userId
    //   }
    // };

    const batchParams = {
      tasksByUser: ['bizproc.task.list', {
        ...baseParams,
        FILTER: { 'USER_ID': userId }
      }],
      tasksByWorkflowStarter: ['bizproc.task.list', {
        ...baseParams,
        FILTER: { 'WORKFLOW_STARTED_BY': userId }
      }]
    };

    // let result;
    // if (!tasksResult) {
    //   result = await BX24.callMethod('bizproc.task.list', params);
    // } else {
    //   result = await tasksResult.next();
    // }
    // setTasksResult(result);

    // if (result) {
    //   const tasksData = result.data();
    //   // Соберем уникальные ID пользователей
    //   const userIdsToFetch = [...new Set(tasksData.map(task => [task.WORKFLOW_STARTED_BY, task.USER_ID]).flat())];

    //   // Запустим все запросы параллельно
    //   const userInfos = await Promise.all(userIdsToFetch.map(id => fetchUserInfo(id)));

    //   // Преобразуем список пользователей в объект для удобства доступа
    //   const usersMap = {};
    //   userInfos.forEach(user => {
    //     usersMap[user.ID] = user;
    //   });

    //   // Добавляем информацию о пользователях к задачам
    //   tasksData.forEach(task => {
    //     task.WORKFLOW_STARTED_BY_INFO = usersMap[task.WORKFLOW_STARTED_BY];
    //     task.USER_ID_INFO = usersMap[task.USER_ID];
    //   });
    //   setTasks(prevTasks => [...prevTasks, ...tasksData]);
    // }

    let batchResponse;
    if (!tasksResult || (!tasksResult.tasksByUserResult && !tasksResult.tasksByWorkflowStarterResult)) {
      batchResponse = await BX24.callBatch(batchParams);
    } else {
      const userTasksNext = tasksResult.tasksByUserResult && tasksResult.tasksByUserResult.more() ? await tasksResult.tasksByUserResult.next() : null;
      const starterTasksNext = tasksResult.tasksByWorkflowStarterResult && tasksResult.tasksByWorkflowStarterResult.more() ? await tasksResult.tasksByWorkflowStarterResult.next() : null;
      batchResponse = {
        tasksByUser: userTasksNext,
        tasksByWorkflowStarter: starterTasksNext
      };
    }
    setTasksResult({ tasksByUserResult: batchResponse.tasksByUser, tasksByWorkflowStarterResult: batchResponse.tasksByWorkflowStarterResult });

    // Объединяем задачи из обоих запросов
    const tasksData = [
      ...(batchResponse.tasksByUser ? batchResponse.tasksByUser.data() : []),
      ...(batchResponse.tasksByWorkflowStarter ? batchResponse.tasksByWorkflowStarter.data() : []),
    ];

    // Убираем дубликаты задач по ID
    const uniqueTasks = tasksData.filter((task, index, self) =>
      index === self.findIndex(t => t.ID === task.ID)
    );

    // Соберем уникальные ID пользователей
    const userIdsToFetch = [...new Set(uniqueTasks.map(task => [task.WORKFLOW_STARTED_BY, task.USER_ID]).flat())];

    // Запустим все запросы параллельно
    const userInfos = await Promise.all(userIdsToFetch.map(id => fetchUserInfo(id)));

    // Преобразуем список пользователей в объект для удобства доступа
    const usersMap = {};
    userInfos.forEach(user => {
      usersMap[user.ID] = user;
    });

    // Добавляем информацию о пользователях к задачам
    uniqueTasks.forEach(task => {
      task.WORKFLOW_STARTED_BY_INFO = usersMap[task.WORKFLOW_STARTED_BY];
      task.USER_ID_INFO = usersMap[task.USER_ID];
    });

    setTasks(prevTasks => [...prevTasks, ...uniqueTasks]);
  };

  const loadMoreTasks = () => {
    fetchTasksForUser(selectedUser);
  };

  return (
    <div className="bg-white p-4 rounded shadow-md w-full mx-auto mt-4 overflow-y-auto" style={{ maxHeight: '80vh' }}>
      <h2 className="text-2xl font-semibold">Список заданий</h2>
      <ul>
        {tasks.map(task => {
          return (
            <TaskCard key={task.ID} task={task} />
          )
        })}
      </ul>
      {tasksResult && ((tasksResult.tasksByUserResult && tasksResult.tasksByUserResult.more()) || (tasksResult.tasksByWorkflowStarterResult && tasksResult.tasksByWorkflowStarterResult.more())) &&
        <button onClick={loadMoreTasks} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4 w-full">
          Загрузить больше задач
        </button>
      }
    </div>
  );
}

export default TaskList;

