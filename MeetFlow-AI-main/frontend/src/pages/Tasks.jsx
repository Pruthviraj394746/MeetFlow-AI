import { useState, useEffect } from 'react';

const Tasks = () => {
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("actions")) || [];
        setTasks(stored);
    }, []);

    return (
        <div className="p-10 max-w-7xl mx-auto">
            <h1 className="text-4xl font-black mb-8">Tasks</h1>
            <div className="space-y-4">
                {tasks.length === 0 ? (
                    <p className="text-slate-400">No tasks available</p>
                ) : (
                    tasks.map((task, i) => (
                        <div key={i} className="p-6 bg-slate-900 rounded-2xl border border-white/5 shadow-xl">
                            <p className="text-lg mb-2"><strong>{task.task}</strong></p>
                            <p className="text-sm text-slate-400">Assigned to: <span className="text-brand-400">{task.assignee}</span></p>
                            <p className="text-sm text-slate-400">Deadline: {task.deadline}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Tasks;
