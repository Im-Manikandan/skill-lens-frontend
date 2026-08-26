import ProfilesController from '../admin/profiles-controller.jsx';

/**
 * Recruitment resume ingestion — reuses the SAME backend pipeline as the
 * default (Talent) JSON profile upload, not a separate one:
 *
 *   1. Send each uploaded resume (PDF/DOCX) to the backend's existing OpenAI
 *      integration via ProfilesController.parseResume — it reads every page
 *      and returns one profile object already shaped to the same Talent
 *      profile JSON ProfilesController already sends for Talent uploads
 *      (name, summary, locations, skills, ...). No client-side text
 *      extraction or field-guessing anymore — the LLM does that server-side.
 *      A JSON file in the same folder is already profile-shaped — it skips
 *      this OpenAI step entirely (see buildProfilesFromJsonFile below).
 *   2. POST the whole parsed batch through ProfilesController.uploadProfiles
 *      with source='recruitment' and batch_id=<this batch> — the exact same
 *      /admin/profiles/:clientId/upload endpoint Talent JSON uploads use.
 *   3. Trigger the existing HCM precompute for this client/industry, scoped
 *      to source='recruitment' + this batch_id, so scores exist by the time
 *      the batch shows up as searchable.
 *
 * The backend tags every row with `source`/`batch_id` and enforces isolation
 * at the DB/search layer — this file never decides what's searchable, it only
 * gets resumes into the shared pipeline. Search itself goes straight through
 * SearchController.semanticSearch / skillFrameworkSearch with
 * source='recruitment' (see SearchInterface.jsx) — there is no separate
 * recruitment search implementation.
 *
 * Unlike the real Talent JSON upload (one file, uploaded instantly), a
 * "batch" here is N resumes that each need a backend OpenAI parse call
 * first — that phase legitimately takes visible time, so job-style progress
 * tracking is kept for the UI, backed by an in-memory (per-tab) job map
 * rather than a server-side job (the backend upload call itself is a single
 * synchronous request once parsing is done).
 */

const jobs = new Map();

function newBatchId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `batch-${crypto.randomUUID()}`;
  return `batch-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/**
 * Sends the raw resume file to the backend's existing OpenAI integration and
 * returns the profile JSON it extracts — already shaped to the same Talent
 * profile schema (name, summary, locations, skills, attributes) uploadProfiles()
 * expects. Falls back to the filename as `attributes.source_file` if the
 * backend omits it, since that's purely a client-known detail.
 */
async function buildProfileFromFile(file, clientId, industryId) {
  const profile = await ProfilesController.parseResume(clientId, { file, industryId });
  return {
    ...profile,
    attributes: {
      ...profile.attributes,
      source_file: profile.attributes?.source_file || file.name,
    },
  };
}

/**
 * A JSON file in the upload folder is a pre-built profile (or array of them),
 * already shaped like the Talent JSON-upload schema — skip the OpenAI
 * resume-parse step entirely and validate/tag it directly. Same required
 * field the backend's ParsedResumeProfile enforces for PDF/DOCX: `name`.
 */
async function buildProfilesFromJsonFile(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const entries = Array.isArray(parsed) ? parsed : [parsed];
  return entries.map((entry, index) => {
    if (!entry || typeof entry.name !== 'string' || !entry.name.trim()) {
      throw new Error(`"${file.name}"${entries.length > 1 ? ` (entry ${index + 1})` : ''} is missing a required "name" field`);
    }
    return {
      ...entry,
      attributes: {
        ...entry.attributes,
        source_file: entry.attributes?.source_file || file.name,
      },
    };
  });
}

function isJsonFile(file) {
  return /\.json$/i.test(file.name);
}

function startJob(files, clientId, industryId, folderLabel) {
  const jobId = newBatchId();
  const total = files.length;
  const job = {
    job_id: jobId,
    status: 'processing',
    total,
    completed: 0,
    failed: 0,
    current_file: files[0]?.name ?? null,
    eta_seconds: Math.round(total * 1.2),
    profiles: [],
    startedAt: Date.now(),
    cancelled: false,
    abortController: new AbortController(),
  };
  jobs.set(jobId, job);

  (async () => {
    // Phase 1: parse each resume through the backend's OpenAI integration —
    // real per-file work, drives the progress bar the same way the old
    // mock's per-file delay did.
    for (let index = 0; index < total; index += 1) {
      if (job.cancelled) return;
      const file = files[index];
      job.current_file = file.name;
      try {
        if (isJsonFile(file)) {
          const profiles = await buildProfilesFromJsonFile(file);
          if (job.cancelled) return;
          job.profiles.push(...profiles);
        } else {
          const profile = await buildProfileFromFile(file, clientId, industryId);
          if (job.cancelled) return;
          job.profiles.push(profile);
        }
      } catch (err) {
        console.error(`Parsing failed for "${file.name}":`, err);
        job.failed += 1;
      }
      job.completed += 1;
      job.eta_seconds = Math.round((total - job.completed) * 1.2);
    }
    if (job.cancelled) return;

    if (job.profiles.length === 0) {
      job.status = 'failed';
      job.current_file = null;
      job.eta_seconds = 0;
      return;
    }

    // Phase 2: one bulk upload through the shared profile pipeline — same
    // endpoint, same DB write path, same auto-embed step Talent JSON
    // uploads go through. Stays 'processing' (now showing an upload/index
    // message) until this resolves, since embedding generation is real work.
    job.current_file = `Indexing ${job.profiles.length} profile(s)...`;
    try {
      const blob = new Blob([JSON.stringify(job.profiles)], { type: 'application/json' });
      const file = new File([blob], `${jobId}.json`, { type: 'application/json' });
      await ProfilesController.uploadProfiles(clientId, {
        file,
        industryId,
        version: 'v1',
        source: 'recruitment',
        batchId: jobId,
        displayName: folderLabel || jobId,
      });
      if (job.cancelled) return;

      // Phase 3: kick off the existing HCM precompute, scoped to this
      // recruitment batch — same scoring engine/storage Talent uses, just
      // filtered to source='recruitment' + batch_id. Best-effort: a scoring
      // failure shouldn't flip an otherwise-successful upload to 'failed'.
      try {
        await ProfilesController.precomputeHCMScores(clientId, industryId, {
          source: 'recruitment',
          batchIds: jobId,
        });
      } catch (err) {
        console.error(`HCM precompute failed for recruitment batch "${jobId}":`, err);
      }

      job.status = 'completed';
      job.current_file = null;
      job.eta_seconds = 0;
    } catch (err) {
      console.error(`Recruitment batch upload failed for job "${jobId}":`, err);
      job.status = 'failed';
      job.error = err;
      job.current_file = null;
      job.eta_seconds = 0;
    }
  })();

  return job;
}

const ResumeProcessingController = {
  uploadResumeFolder: async function({ clientId, industryId, files, folderLabel }) {
    const job = startJob(Array.from(files), clientId, industryId, folderLabel);
    return { job_id: job.job_id, total: job.total };
  },

  getJobStatus: async function(jobId) {
    const job = jobs.get(jobId);
    if (!job) throw new Error('Unknown job');
    return {
      job_id: job.job_id,
      status: job.status,
      total: job.total,
      completed: job.completed,
      failed: job.failed,
      current_file: job.current_file,
      eta_seconds: job.eta_seconds,
    };
  },

  cancelJob: async function(jobId) {
    const job = jobs.get(jobId);
    if (job) {
      job.cancelled = true;
      job.status = 'cancelled';
      job.abortController?.abort();
    }
    return { job_id: jobId, status: 'cancelled' };
  },
};

export default ResumeProcessingController;
