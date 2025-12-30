$(document).ready(function() {
    loadApplicants();

    function loadApplicants() {
        $.get('/api/jobs', function(jobs) {
            const list = $('#applicants-list');
            list.empty();

            jobs.forEach(job => {
                if (!job.applicants || job.applicants.length === 0) return;

                job.applicants.forEach(app => {
                    const scoreClass = app.score >= 70 ? 'bg-success' : (app.score >= 40 ? 'bg-warning' : 'bg-danger');
                    
                    list.append(`
                        <tr>
                            <td class="ps-4">
                                <div class="d-flex align-items-center">
                                    <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                        ${app.userId?.firstName?.charAt(0) || 'U'}
                                    </div>
                                    <div class="ms-3">
                                        <div class="fw-bold">${app.userId?.firstName} ${app.userId?.lastName}</div>
                                        <div class="text-muted small">${app.userId?.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td><span class="fw-semibold">${job.title}</span></td>
                            <td>
                                <span class="badge ${scoreClass} rounded-pill px-3 py-2">
                                    ${app.score}% Match
                                </span>
                            </td>
                            <td>
                                <a href="${app.resumeUrl}" target="_blank" class="btn btn-link btn-sm text-decoration-none p-0">
                                    <i class="bi bi-file-earmark-pdf"></i> View CV
                                </a>
                            </td>
                            <td>
                                <span class="badge bg-light text-dark border text-capitalize">${app.status}</span>
                            </td>
                            <td class="text-end pe-4">
                                ${app.status === 'pending' ? `
                                    <button class="btn btn-success btn-sm me-1" onclick="updateStatus('${job._id}', '${app.userId._id}', 'accepted')">
                                        <i class="bi bi-check-lg"></i>
                                    </button>
                                    <button class="btn btn-outline-danger btn-sm" onclick="updateStatus('${job._id}', '${app.userId._id}', 'rejected')">
                                        <i class="bi bi-x-lg"></i>
                                    </button>
                                ` : '<i class="bi bi-dash-circle text-muted"></i>'}
                            </td>
                        </tr>
                    `);
                });
            });
        });
    }

    window.updateStatus = (jobId, userId, status) => {
        if (!confirm(`Are you sure you want to set this applicant to ${status}?`)) return;

        $.ajax({
            url: `/api/jobs/${jobId}/applicants/${userId}/status`,
            type: 'PUT',
            data: { status: status },
            success: function() {
                alert(`Candidate ${status} successfully!`);
                loadApplicants();
            }
        });
    };
});