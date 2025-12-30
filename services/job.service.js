const JobOffer = require('../models/joboffer.model');
const User = require('../models/User.model');
const messageService = require('./message.service');
const notificationService = require('./notification.service');
// --- HELPER: Extraction de mots-clés améliorée ---
const extractKeywords = (text) => {
    if (!text) return [];
    // On ne coupe plus sur le point (.) au milieu pour préserver Node.js, .NET, etc.
    return text.toLowerCase()
        .split(/[\s,/?!]+/) 
        .map(w => w.replace(/\.$/, "")) // Enlever le point seulement en fin de mot
        .filter(w => w.length > 1);
};

// --- LOGIQUE MÉTIER ---

// exports.createJob = async (companyId, data) => {
//     return JobOffer.create({ ...data, companyId });
// };


exports.createJob = async (jobData) => {
    // jobData contient déjà title, location, companyId, etc.
    const newJob = new JobOffer(jobData); 
    return await newJob.save();
};

exports.getAllJobs = async (filters = {}) => {
    let query = { isActive: true };
    if (filters.location) query.location = new RegExp(filters.location, 'i');
    return JobOffer.find(query)
        .sort({ createdAt: -1 })
        .populate('companyId', 'firstName lastName avatar');
};

exports.getJobById = async (jobId) => {
    return await JobOffer.findById(jobId)
        .populate('companyId', 'firstName lastName email bio');
};

exports.applyToJob = async (jobId, userId, applicationData) => {
    const job = await JobOffer.findById(jobId);
    if (!job || !job.isActive) throw new Error('Job not found or closed');

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const alreadyApplied = job.applicants.some(a => a.userId.toString() === userId);
    if (alreadyApplied) throw new Error('Already applied');

    // --- CALCUL DU SCORE (Logique précise) ---
    let score = 0;
    const jobKeywords = extractKeywords(`${job.title} ${job.description}`);

    // 1. Skills (Exact match pour éviter Java vs JavaScript)
    const userSkills = (user.skills || []).map(s => s.name.toLowerCase());
    const matchedSkills = userSkills.filter(skill => jobKeywords.includes(skill));
    score += Math.min(40, matchedSkills.length * 10); 

    // 2. Experience (Word boundary check)
    if (user.experiences?.length > 0) {
        const relevantExp = user.experiences.filter(exp => {
            const expText = `${exp.title} ${exp.description}`.toLowerCase();
            return jobKeywords.some(key => new RegExp(`\\b${key.replace(".", "\\.")}\\b`, 'i').test(expText));
        });
        score += Math.min(30, relevantExp.length * 15);
    }

    // 3. Education
    const isRelevantEducation = (user.education || []).some(edu => {
        const eduText = `${edu.fieldOfStudy} ${edu.degree}`.toLowerCase();
        return jobKeywords.some(key => eduText.includes(key));
    });
    if (isRelevantEducation) score += 15;

    // 4. Projects
    const relevantProjects = (user.projects || []).filter(proj => 
        (proj.technologies || []).some(tech => jobKeywords.includes(tech.toLowerCase()))
    );
    score += Math.min(10, relevantProjects.length * 5);

    // 5. Certificates
    if (user.certificates?.length > 0) score += 5;

    // --- SAUVEGARDE ---
    job.applicants.push({
        userId,
        resumeUrl: applicationData.resumeUrl,
        additionalAttachment: applicationData.additionalAttachment,
        score: score 
    });
    await job.save();

    // --- MESSAGERIE & NOTIFICATION ---
    // Utiliser le service pour déclencher automatiquement la notification
    await messageService.sendMessage(
        userId, 
        job.companyId, 
        `Hello, I've just applied for the "${job.title}" position. I'm looking forward to your feedback!`,
        [], 
        'User', 
        'Company'
    );
    await notificationService.createNotification(
        { id: job.companyId, type: 'Company' }, // Receveur (Entreprise)
        { id: userId, type: 'User' },          // Expéditeur (Candidat)
        'job_application',                           // Type de notification
        { id: job._id, type: 'JobApplication' }      // Entité liée (L'offre)
    );

    return job;
};

exports.getUserApplications = async (userId) => {
    // Cherche tous les jobs où l'utilisateur apparaît dans la liste des candidats
    return await JobOffer.find({ "applicants.userId": userId })
        .populate('companyId', 'firstName lastName avatar');
};

exports.closeJob = async (jobId, companyId) => {
    const job = await JobOffer.findOneAndUpdate(
        { _id: jobId, companyId: companyId },
        { isActive: false },
        { new: true }
    );
    if (!job) throw new Error("Job not found or unauthorized");

    // Notification optionnelle pour dire aux candidats que le poste est clos
    // Ici on notifie tous les candidats restés en 'pending'
    const pendingApplicants = job.applicants.filter(a => a.status === 'pending');
    for (const applicant of pendingApplicants) {
        await notificationService.createNotification(
            { id: applicant.userId, type: 'User' },
            { id: companyId, type: 'Company' },
            'job_offer',
            { id: job._id, type: 'JobOffer' }
        );
    }

    return job;
};

exports.updateApplicantStatus = async (jobId, applicantId, status) => {
    const job = await JobOffer.findById(jobId);
    if (!job) throw new Error("Job not found");

    const applicantIndex = job.applicants.findIndex(a => a.userId.toString() === applicantId);
    if (applicantIndex === -1) throw new Error("Applicant not found");

    // Mise à jour
    job.applicants[applicantIndex].status = status;

    if (status === 'accepted') {
        job.isActive = false; // Fermeture automatique

        // Rejet des autres + notif
        for (const app of job.applicants) {
            if (app.userId.toString() !== applicantId && app.status === 'pending') {
                app.status = 'rejected';

                // Envoi de la notification de rejet aux candidats évincés
                await notificationService.createNotification(
                    { id: app.userId, type: 'User' },
                    { id: job.companyId, type: 'Company' },
                    'job_offer', 
                    { id: job._id, type: 'JobOffer' }
                );
            }
        }
        // Message de félicitations (via service pour notifier)
        await messageService.sendMessage(
            job.companyId, 
            applicantId, 
            `Félicitations ! Vous avez été accepté pour le poste : ${job.title}`,
            [], 
            'Company', 
            'User'
        );
    } else if (status === 'rejected') {
        // Notification simple pour le rejet
        await notificationService.createNotification(
            { id: applicantId, type: 'User' },
            { id: job.companyId, type: 'Company' },
            'job_offer',
            { id: job._id, type: 'JobOffer' }
        );
    }

    await job.save();
    return job;
};