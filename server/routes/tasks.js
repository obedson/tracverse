const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const path = require('path');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/evidence/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|mp4|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'));
    }
  }
});

// POST /api/tasks - Create new task
router.post('/', async (req, res) => {
  try {
    const { type, platform, content_url, age_groups, countries, devices, pp_rate, total_budget, duration_days } = req.body;

    const { data: task } = await supabase
      .from('tasks')
      .insert({
        type,
        platform,
        content_url,
        target_demographics: { age_groups, countries, devices },
        pp_reward: pp_rate,
        total_budget,
        max_completions: Math.floor(total_budget / pp_rate),
        duration_days,
        status: 'active',
        created_by: req.user?.userId || 'anonymous'
      })
      .select()
      .single();

    res.json({ message: 'Task created successfully', task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tasks/available - Get available tasks for user
router.get('/available', async (req, res) => {
  try {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'active')
      .lt('current_completions', supabase.raw('max_completions'))
      .order('created_at', { ascending: false });

    const formattedTasks = tasks?.map(task => ({
      id: task.id,
      type: task.type,
      platform: task.platform,
      title: `${task.type.charAt(0).toUpperCase() + task.type.slice(1)} on ${task.platform}`,
      description: `Complete ${task.type} task and earn ${task.pp_reward} PP`,
      pp_reward: task.pp_reward,
      difficulty: task.pp_reward > 50 ? 'Medium' : 'Easy',
      duration: task.type === 'subscribe' ? '2 minutes' : '1 minute',
      completions: task.current_completions || 0,
      max_completions: task.max_completions,
      promoter_rating: 4.5 + Math.random() * 0.5
    })) || [];

    res.json({ tasks: formattedTasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tasks/:id - Get specific task details
router.get('/:id', async (req, res) => {
  try {
    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const taskDetails = {
      id: task.id,
      type: task.type,
      platform: task.platform,
      title: `${task.type.charAt(0).toUpperCase() + task.type.slice(1)} on ${task.platform}`,
      description: `Complete this ${task.type} task to earn ${task.pp_reward} PP`,
      content_url: task.content_url,
      pp_reward: task.pp_reward,
      instructions: getTaskInstructions(task.type, task.platform),
      evidence_required: `Screenshot showing ${task.type} completion`
    };

    res.json({ task: taskDetails });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tasks/:id/accept - Accept a task
router.post('/:id/accept', async (req, res) => {
  try {
    const userId = req.user?.userId || 'anonymous';
    
    const { data: acceptance } = await supabase
      .from('task_acceptances')
      .insert({
        task_id: req.params.id,
        user_id: userId,
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .select()
      .single();

    res.json({ message: 'Task accepted successfully', acceptance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tasks/:id/submit - Submit task evidence
router.post('/:id/submit', upload.single('evidence'), async (req, res) => {
  try {
    const userId = req.user?.userId || 'anonymous';
    const evidencePath = req.file ? req.file.path : null;

    const { data: submission } = await supabase
      .from('task_submissions')
      .insert({
        task_id: req.params.id,
        user_id: userId,
        evidence_file: evidencePath,
        status: 'pending_verification',
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    res.json({ message: 'Evidence submitted successfully', submission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function getTaskInstructions(type, platform) {
  const instructions = {
    subscribe: {
      youtube: [
        'Click the link to open the YouTube channel',
        'Click the "Subscribe" button',
        'Enable notifications by clicking the bell icon',
        'Take a screenshot showing "Subscribed" status',
        'Upload the screenshot as evidence'
      ],
      instagram: [
        'Click the link to open the Instagram profile',
        'Click the "Follow" button',
        'Take a screenshot showing "Following" status',
        'Upload the screenshot as evidence'
      ]
    },
    like: {
      youtube: [
        'Click the link to open the YouTube video',
        'Click the thumbs up (like) button',
        'Take a screenshot showing the liked video',
        'Upload the screenshot as evidence'
      ],
      instagram: [
        'Click the link to open the Instagram post',
        'Double-tap or click the heart icon to like',
        'Take a screenshot showing the red heart',
        'Upload the screenshot as evidence'
      ]
    }
  };

  return instructions[type]?.[platform] || [
    'Complete the required action on the platform',
    'Take a screenshot as proof',
    'Upload the evidence'
  ];
}

module.exports = router;
