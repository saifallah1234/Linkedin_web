$(document).ready(function() {
    // Chargement initial
    loadJobs();

    // 1. Fonction de recherche en temps réel
    $('#job-search').on('keyup', function() {
        const value = $(this).val().toLowerCase();
        $('.job-card').filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
        });
    });

    // 2. Récupération des jobs depuis l'API
    function loadJobs() {
        $.get('/api/jobs', function(jobs) {
            $('#jobs-loading').hide();
            const container = $('#jobs-container');
            container.empty();

            if (jobs.length === 0) {
                container.html('<div class="card p-5 text-center shadow-sm border-0"><h5>No jobs available right now.</h5></div>');
                return;
            }

            jobs.forEach(job => {
                container.append(`
                    <div class="card shadow-sm border-0 mb-3 job-card transition-hover">
                        <div class="card-body d-flex gap-3">
                            <div class="bg-light rounded p-3 text-primary d-flex align-items-center justify-content-center" style="width: 80px; height: 80px;">
                                <i class="bi bi-building fs-1"></i>
                            </div>
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between">
                                    <h5 class="fw-bold mb-0 text-dark">${job.title}</h5>
                                    <small class="text-muted">${timeAgo(job.createdAt)}</small>
                                </div>
                                <p class="text-primary fw-semibold mb-1 small">${job.companyId?.firstName || 'Company'} • ${job.location}</p>
                                <div class="mb-3">
                                    <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">Actively Hiring</span>
                                    <span class="badge bg-light text-muted border px-2 py-1">${job.category || 'General'}</span>
                                </div>
                                <div class="d-flex gap-2">
                                    <button class="btn btn-primary btn-sm rounded-pill px-4" onclick="openApplyModal('${job._id}', '${job.title}')">Easy Apply</button>
                                    <button class="btn btn-outline-secondary btn-sm rounded-pill px-4" onclick="showSkillGap('${job._id}')">Check Match</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
            });
        });
    }

    // 3. Gestion de la fenêtre modale (Apply)
    window.openApplyModal = (id, title) => {
        $('#modal-job-id').val(id);
        $('#modal-job-title').text(title);
        $('#applyModal').modal('show');
    };

    // 4. Envoi de la candidature
    $('#apply-form').submit(function(e) {
        e.preventDefault();
        const jobId = $('#modal-job-id').val();
        const data = {
            resumeUrl: $('#resumeUrl').val(),
            content: $('#applicationNote').val() // Utilisé pour le message automatique
        };

        const submitBtn = $(this).find('button[type="submit"]');
        submitBtn.prop('disabled', true).text('Sending...');

        $.post(`/api/jobs/${jobId}/apply`, data)
            .done((response) => {
                $('#applyModal').modal('hide');
                alert('Success! Your application was sent with a match score of ' + response.score + '%');
                // Optionnel: Rediriger vers ses applications
            })
            .fail(err => {
                alert(err.responseJSON?.error || 'Error during application');
            })
            .always(() => {
                submitBtn.prop('disabled', false).text('Send Application');
            });
    });

    // 5. Skill Gap Analysis (Simulation Client-side pour l'exemple)
    window.showSkillGap = (jobId) => {
        $('#skill-gap-card').removeClass('d-none');
        const list = $('#skill-analysis-list');
        list.empty().append('<div class="spinner-border spinner-border-sm text-primary"></div>');

        // Note: Dans un vrai projet, on ferait un GET /api/jobs/:id pour avoir les skills requis
        setTimeout(() => {
            list.empty().append(`
                <div class="d-flex justify-content-between mb-1 small"><span>React.js</span> <i class="bi bi-check-circle-fill text-success"></i></div>
                <div class="d-flex justify-content-between mb-1 small"><span>Node.js</span> <i class="bi bi-check-circle-fill text-success"></i></div>
                <div class="d-flex justify-content-between mb-1 small"><span>Docker</span> <i class="bi bi-x-circle text-danger"></i></div>
            `);
        }, 500);
    };

    // Helper: Temps écoulé
    function timeAgo(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return "Just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return minutes + "m ago";
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return hours + "h ago";
        return Math.floor(hours / 24) + "d ago";
    }
});