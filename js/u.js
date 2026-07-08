let uniqueId = localStorage.getItem('visitorId');
if (!uniqueId) {
    uniqueId = crypto.randomUUID();
    localStorage.setItem('visitorId', uniqueId);
}
umami.identify({ id: uniqueId });