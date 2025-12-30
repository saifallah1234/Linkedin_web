function renderConversationList(conversations) {
    conversations.forEach(conv => {
        const hasUnread = !conv.lastMessage.isRead && conv.lastMessage.receiverId === currentUserId;
        $('#conversation-list').append(`
            <a href="#" class="list-group-item list-group-item-action d-flex align-items-center gap-3">
                <div class="position-relative">
                    <div class="bg-secondary rounded-circle" style="width: 45px; height: 45px;"></div>
                    ${hasUnread ? '<span class="position-absolute top-0 start-100 translate-middle p-1 bg-primary border border-light rounded-circle"></span>' : ''}
                </div>
                <div class="overflow-hidden">
                    <h6 class="mb-0 text-truncate ${hasUnread ? 'fw-bold text-dark' : ''}">User Name</h6>
                    <small class="text-muted text-truncate d-block">${conv.lastMessage.content}</small>
                </div>
            </a>
        `);
    });
}