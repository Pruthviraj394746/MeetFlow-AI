const Meetings = () => {
    const meeting = JSON.parse(localStorage.getItem("activeMeeting"));

    return (
        <div className="p-10 max-w-7xl mx-auto">
            <h1 className="text-4xl font-black mb-8">Meetings</h1>
            {meeting ? (
                <div className="p-6 bg-slate-900 rounded-2xl border border-white/5 shadow-xl inline-block pr-20">
                    <p className="text-brand-400 font-mono mb-2">Meeting ID: {meeting.meetingId}</p>
                    <p className="text-slate-300 font-bold">Status: <span className="text-green-500">Ongoing</span></p>
                </div>
            ) : (
                <p className="text-slate-400">No meetings</p>
            )}
        </div>
    );
};

export default Meetings;
