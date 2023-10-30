import React, { useState, useEffect } from 'react';
import BX24 from '../btx-api';

const TreeNode = ({ data, onSelectUser, setTasks, setTasksResult }) => {
    const [expanded, setExpanded] = useState(true);
    const [portalAddress, setPortalAddress] = useState('');

    useEffect(() => {
        if (window.BX24) {
            setPortalAddress(window.BX24.getDomain());
        }
    }, []);

    const toggleExpanded = () => {
        setExpanded(!expanded);
    };

    if (!data) return null;

    const onClick = (id) => {
        onSelectUser(id);
        setTasks([]);
        setTasksResult(null);
    };

    return (
        <div className="p-4 w-full mx-auto overflow-y-auto" style={{ maxHeight: '80vh' }}>
            {data.department && (
                <div className="flex items-center" onClick={toggleExpanded}>
                    <button className="mb-2 mr-2">
                        {expanded ? '-' : '+'}
                    </button>
                    <div className="font-bold text-xl mb-2">{data.department.NAME}</div>
                </div>
            )}
            {expanded && (
                <ul className="list-disc pl-5">
                    {data.users.map(user => (
                        <li
                            key={user.ID}
                            onClick={() => onClick(user.ID)}
                            className="cursor-pointer hover:bg-gray-200 p-2 rounded flex items-center"
                        >
                            <img
                                src={user.PERSONAL_PHOTO || `https://${portalAddress}/bitrix/js/socialnetwork/entity-selector/src/images/default-user.svg`}
                                alt={`${user.NAME} ${user.LAST_NAME}`}
                                className="w-12 h-12 rounded-full mr-4"
                            />
                            <div className="flex-1">
                                <div className="font-bold text-lg">
                                    {user.NAME} {user.LAST_NAME}
                                </div>
                                <div className="text-gray-600">
                                    {user.WORK_POSITION}
                                </div>
                            </div>
                            <div className="text-right">
                                ({user.totalTasks}/{user.activeTasksCount}/{user.overdueTasksCount})
                            </div>
                        </li>
                    ))}
                    {data.subDepartments.map(subDept => (
                        <li key={subDept.department?.ID || Math.random()}>
                            <TreeNode data={subDept} onSelectUser={onSelectUser} setTasks={setTasks} setTasksResult={setTasksResult} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const DepartmentTree = ({ onSelectUser, setTasks, setTasksResult }) => {
    const [treeData, setTreeData] = useState(null);
    const [progress, setProgress] = useState(0); // Прогресс от 0 до 100

    const fetchDepartmentInfo = async (departmentId) => {
        const department = await BX24.callMethod('department.get', {
            ID: departmentId
        });
        return department.data() ? department.data()[0] : null;
    };

    const fetchTasksForUser = async (userId) => {
        const batchParams = {
            getTotalTasksByUser: ['bizproc.task.list', {
                FILTER: {
                    USER_ID: userId
                },
                SELECT: ['ID'],
            }],
            getTotalTasksByWorkflowStarter: ['bizproc.task.list', {
                FILTER: {
                    WORKFLOW_STARTED_BY: userId
                },
                SELECT: ['ID'],
            }],
            getActiveTasksByUser: ['bizproc.task.list', {
                FILTER: {
                    STATUS: 0,
                    USER_ID: userId
                },
                SELECT: ['ID'],
            }],
            getActiveTasksByWorkflowStarter: ['bizproc.task.list', {
                FILTER: {
                    STATUS: 0,
                    WORKFLOW_STARTED_BY: userId
                },
                SELECT: ['ID'],
            }],
            getOverdueTasksByUser: ['bizproc.task.list', {
                FILTER: {
                    STATUS: 4,
                    USER_ID: userId
                },
                SELECT: ['ID'],
            }],
            getOverdueTasksByWorkflowStarter: ['bizproc.task.list', {
                FILTER: {
                    STATUS: 4,
                    WORKFLOW_STARTED_BY: userId
                },
                SELECT: ['ID'],
            }]
        };

        const batchResponse = await BX24.callBatch(batchParams);
        console.log(batchResponse);
        // // Объединяем результаты
        // const totalTasks = [
        //     ...batchResponse.getTotalTasksByUser,
        //     ...batchResponse.getTotalTasksByWorkflowStarter,
        // ].length;

        // const activeTasks = [
        //     ...batchResponse.getActiveTasksByUser.data(),
        //     ...batchResponse.getActiveTasksByWorkflowStarter.data(),
        // ].length;

        // const overdueTasks = [
        //     ...batchResponse.getOverdueTasksByUser.data(),
        //     ...batchResponse.getOverdueTasksByWorkflowStarter.data(),
        // ].length;

        // Объединяем результаты
        const totalTasks = batchResponse.getTotalTasksByUser.answer.total + batchResponse.getTotalTasksByWorkflowStarter.answer.total;

        const activeTasks = batchResponse.getActiveTasksByUser.answer.total + batchResponse.getActiveTasksByWorkflowStarter.answer.total;

        const overdueTasks = batchResponse.getOverdueTasksByUser.answer.total + batchResponse.getOverdueTasksByWorkflowStarter.answer.total;

        return { totalTasks, activeTasks, overdueTasks };
    };

    const fetchUsersFromDepartment = async (departmentId) => {
        const users = await BX24.callMethod('user.get', {
            UF_DEPARTMENT: departmentId,
            ACTIVE: true,
        });
        for (const user of users.data()) {
            const tasksData = await fetchTasksForUser(user.ID);
            user.totalTasks = tasksData.totalTasks;
            user.activeTasksCount = tasksData.activeTasks;
            user.overdueTasksCount = tasksData.overdueTasks;
        }
        return users.data() || [];
    };

    const fetchChildDepartments = async (parentDepartmentId) => {
        const departments = await BX24.callMethod('department.get', {
            PARENT: parentDepartmentId
        });
        return departments.data() || [];
    };

    const fetchUsersRecursively = async (departmentId) => {
        const departmentData = {
            department: await fetchDepartmentInfo(departmentId),
            users: await fetchUsersFromDepartment(departmentId),
            subDepartments: []
        };

        const childDepartments = await fetchChildDepartments(departmentId);

        setProgress(prev => prev + childDepartments.length > 100 ? 99 : prev + childDepartments.length); // Добавляем прогресс на каждый поддепартамент
        for (const dept of childDepartments) {
            departmentData.subDepartments.push(await fetchUsersRecursively(dept.ID));
        }

        return departmentData;
    };

    useEffect(() => {
        async function fetchData() {
            const currentUser = await BX24.callMethod('user.current');
            const rootDepartment = currentUser.data().UF_DEPARTMENT; //
            const d = await fetchUsersRecursively(rootDepartment);
            setTreeData(d);
            setProgress(100); // Завершаем загрузку после получения всех данных
        }

        fetchData();
    }, []);

    // const renderTree = (data) => {
    //     if (!data) return null;
    //     console.log(data);
    //     return (
    //         <div className="p-4">
    //             {data.department && (
    //                 <div className="font-bold text-xl mb-2">{data.department.NAME}</div>
    //             )}
    //             <ul className="list-disc pl-5">
    //                 {data.users.map(user => (
    //                     <li
    //                         key={user.ID}
    //                         onClick={() => onSelectUser(user.ID)}
    //                         className="cursor-pointer hover:bg-gray-200 p-2 rounded"
    //                     >
    //                         {user.NAME} {user.LAST_NAME}
    //                     </li>
    //                 ))}
    //                 {data.subDepartments.map(subDept => (
    //                     <li key={subDept.department?.ID || Math.random()}>
    //                         {renderTree(subDept)}
    //                     </li>
    //                 ))}
    //             </ul>
    //         </div>
    //     );
    // };

    return (
        <div>
            {progress !== 100 && <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-teal-600 bg-teal-200">
                            Загрузка
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-teal-600">
                            {progress}%
                        </span>
                    </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-teal-200">
                    <div style={{ width: `${progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-teal-500"></div>
                </div>
            </div>}
            {progress === 100 && <TreeNode data={treeData} onSelectUser={onSelectUser} setTasks={setTasks} setTasksResult={setTasksResult} />}
        </div>
    );
};

export default DepartmentTree;
