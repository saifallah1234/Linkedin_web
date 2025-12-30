// $(document).ready(function() {
//     updateNotifBadge();

//     function updateNotifBadge() {
//         $.get('/api/notifications', function(data) {
//             const unread = data.filter(n => !n.isRead).length;
//             if (unread > 0) {
//                 $('#notif-badge').text(unread).removeClass('d-none');
//             }
            
//             // Populate Preview
//             $('#notif-items').empty();
//             data.slice(0, 5).forEach(notif => {
//                 const icon = notif.type === 'message' ? 'bi-chat-dots' : 'bi-briefcase';
//                 $('#notif-items').append(`
//                     <li class="p-2 border-bottom ${notif.isRead ? '' : 'bg-light'}">
//                         <a class="dropdown-item d-flex align-items-center gap-2 py-2 px-0" href="/notifications" onclick="markRead('${notif._id}')">
//                             <i class="bi ${icon} text-primary"></i>
//                             <div class="text-wrap small">
//                                 <strong>${notif.sender?.id?.firstName || 'Someone'}</strong> sent you a ${notif.type.replace('_', ' ')}
//                             </div>
//                         </a>
//                     </li>
//                 `);
//             });
//         });
//     }

//     window.markRead = (id) => {
//         $.ajax({ url: `/api/notifications/${id}/read`, type: 'PUT' ,});
//     };
// });

$(document).ready(function () {
  updateNotifBadge();

  function updateNotifBadge() {
    $.ajax({
      url: '/api/notifications',
      method: 'GET',
      headers: DEV_HEADERS,
      success: function (data) {
        if (!Array.isArray(data)) return;

        const unread = data.filter(n => !n.isRead).length;
        if (unread > 0) {
          $('#notif-badge').text(unread).removeClass('d-none');
        } else {
          $('#notif-badge').addClass('d-none');
        }

        // Populate preview list
        $('#notif-items').empty();

        data.slice(0, 5).forEach(notif => {
          const icon = notif.type === 'message'
            ? 'bi-chat-dots'
            : 'bi-briefcase';

          const senderName =
            notif.sender && notif.sender.id
              ? notif.sender.id.firstName
              : 'Someone';

          $('#notif-items').append(`
            <li class="p-2 border-bottom ${notif.isRead ? '' : 'bg-light'}">
              <a class="dropdown-item d-flex align-items-center gap-2 py-2 px-0"
                 href="/notifications"
                 onclick="markRead('${notif._id}')">
                <i class="bi ${icon} text-primary"></i>
                <div class="text-wrap small">
                  <strong>${senderName}</strong>
                  sent you a ${notif.type.replace('_', ' ')}
                </div>
              </a>
            </li>
          `);
        });
      },
      error: function (err) {
        console.error('Failed to load notifications', err.responseText);
      }
    });
  }

  window.markRead = function (id) {
    $.ajax({
      url: `/api/notifications/${id}/read`,
      method: 'PUT',
      headers: DEV_HEADERS,
      success: function () {
        updateNotifBadge(); // refresh badge after read
      },
      error: function (err) {
        console.error('Failed to mark as read', err.responseText);
      }
    });
  };
});
