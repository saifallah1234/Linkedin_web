$(document).ready(function() {
    $('#create-job-form').on('submit', function(e) {
        e.preventDefault();

        // Création de l'objet avec les noms EXACTS du Schema Mongoose
        const jobData = {
            title: $('input[name="title"]').val(),
            location: $('input[name="location"]').val(),
            category: $('select[name="category"]').val(),
            type: $('select[name="type"]').val(),
            salaryRange: $('input[name="salaryRange"]').val(),
            description: $('textarea[name="description"]').val(),
            startDate: $('input[name="startDate"]').val() || null,
            deadline: $('input[name="deadline"]').val() || null
        };

        console.log("Données collectées :", jobData); // Vérifie ici dans la console F12

        $.ajax({
            url: '/api/jobs',
            type: 'POST',
            dataType: 'json',
            contentType: 'application/json', // Très important !
            data: JSON.stringify(jobData),   // Convertit l'objet en texte JSON
            success: function(response) {
                alert('Job posted successfully!');
                window.location.href = '/jobs';
            },
            error: function(err) {
                console.error("Détails de l'erreur :", err.responseJSON);
                alert('Erreur : ' + (err.responseJSON ? err.responseJSON.message : 'Champs invalides'));
            }
        });
    });
});