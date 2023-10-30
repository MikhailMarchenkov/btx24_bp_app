import React, { useState, useEffect } from 'react';
import BX24 from '../btx-api';

const TaskCard = ({ task }) => {
    const [portalAddress, setPortalAddress] = useState('');

    console.log(task);
    useEffect(() => {
        if (window.BX24) {
            setPortalAddress(window.BX24.getDomain());
        }
    }, []);

    function convertUrlToLink(text, portalAddress) {
        if (!text || typeof text !== 'string') {
            return '';
        }

        const urlRegex = /\[url=(.*?)\](.*?)\[\/url\]/g;

        return text.replace(urlRegex, function (_, href, linkText) {
            return `<a href="https://${portalAddress}${href}" target="_blank">${linkText}</a>`;
        });
    }

    function parseBBCode(text) {
        let formattedText = text;

        // Замена тегов [b] на <strong>
        formattedText = formattedText.replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>');
        // Замена тегов [i] на <em>
        formattedText = formattedText.replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>');
        // Замена тегов [u] на <u>
        formattedText = formattedText.replace(/\[u\](.*?)\[\/u\]/g, '<u>$1</u>');

        return formattedText;
    }

    // Эта функция возвращает классы CSS для окраски статуса задачи.
    function getStatusColor(status) {
        switch (status) {
            case '0':
                return 'text-blue-500'; // Пример цвета для статуса 0
            case '1':
                return 'text-green-500'; // Пример цвета для статуса 1
            // Добавьте другие статусы по аналогии
            default:
                return 'text-gray-500';
        }
    }

    function formatDate(dateString) {
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit' };
        const date = new Date(dateString);
        return `${date.toLocaleDateString(undefined, dateOptions)} ${date.toLocaleTimeString(undefined, timeOptions)}`;
    }

    function handleClick(task) {
        const url = `https://${portalAddress}/company/personal/bizproc/${task.ID}/?USER_ID=${task.USER_ID}`; // Замените на желаемый URL
        window.open(url, '_blank');
        // window.BX24.openPath(
        //     `https://${portalAddress}`,
        //     function (result) {
        //         console.log(result);
        //     }
        // );
    }

    return (
        <div className="p-4">
            {
                task && (<div
                    onClick={() => handleClick(task)}
                    className="task-card p-4 bg-white shadow-md rounded">
                    <h2 className="font-bold text-xl mb-2">Задание: {task.NAME}</h2>
                    <div className="text-sm mb-2"><span className="font-bold">Описание:</span>
                        <div
                            dangerouslySetInnerHTML={{ __html: parseBBCode(convertUrlToLink(task.DESCRIPTION, portalAddress)) }}
                        />
                    </div>
                    <p className="mb-2">Дата старта процесса: {formatDate(task.WORKFLOW_STARTED)}</p>
                    <p className="mb-2">Дата старта задания: {formatDate(task.MODIFIED)}</p>
                    <p className="mb-2">
                        Статус:
                        <span className={`font-medium ${getStatusColor(task.WORKFLOW_STATE)}`}>
                            {task.WORKFLOW_STATE}
                        </span>
                    </p>
                    <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full overflow-hidden">
                            <img src={(task.WORKFLOW_STARTED_BY_INFO && task.WORKFLOW_STARTED_BY_INFO.PERSONAL_PHOTO) || `https://${portalAddress}/bitrix/js/socialnetwork/entity-selector/src/images/default-user.svg`} alt={task.WORKFLOW_STARTED_BY_INFO && task.WORKFLOW_STARTED_BY_INFO.NAME} className="w-12 h-12 rounded-full" />
                        </div>
                        <div className="flex items-center mx-4">
                            <span className="border-r border-black h-1 w-4/5"></span>
                            <span className="text-lg">&#8594;</span>
                        </div>
                        <div className="w-12 h-12 rounded-full overflow-hidden">
                            <img src={(task.USER_ID_INFO && task.USER_ID_INFO.PERSONAL_PHOTO) || `https://${portalAddress}/bitrix/js/socialnetwork/entity-selector/src/images/default-user.svg`} alt={task.USER_ID_INFO && task.USER_ID_INFO.NAME} className="w-12 h-12 rounded-full" />
                        </div>
                    </div>
                </div>)
            }
        </div>
    );
};

export default TaskCard;
