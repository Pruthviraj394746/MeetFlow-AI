export const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
        console.warn("Browser does not support desktop notification");
        return false;
    }

    if (Notification.permission === "granted") {
        return true;
    } else if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
    }
    
    return false;
};

export const notifyActionItem = (title, body) => {
    if (Notification.permission === "granted") {
        new Notification(title, {
            body: body,
            icon: '/vite.svg', // Assuming default icon exists
            tag: 'task-alert'
        });
    }
};
