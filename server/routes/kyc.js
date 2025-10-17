const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth-enterprise');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/kyc');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.user.id}-${req.body.type}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
    }
  }
});

// Upload document
router.post('/upload', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { type } = req.body;
    const userId = req.user.id;

    // Save document info to database
    const { data, error } = await supabase
      .from('kyc_documents')
      .upsert({
        user_id: userId,
        document_type: type,
        file_path: req.file.path,
        file_name: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        status: 'uploaded',
        uploaded_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,document_type'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to save document info' });
    }

    res.json({
      message: 'Document uploaded successfully',
      document: {
        id: data.id,
        type: data.document_type,
        status: data.status,
        uploaded_at: data.uploaded_at
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get user's document status
router.get('/documents', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('kyc_documents')
      .select('document_type, status, uploaded_at, verified_at')
      .eq('user_id', userId);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch documents' });
    }

    // Convert to object format
    const documents = {};
    data.forEach(doc => {
      documents[doc.document_type] = doc.status;
    });

    res.json({ documents });

  } catch (error) {
    console.error('Fetch documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Update personal information
router.post('/personal-info', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, dateOfBirth, phoneNumber, address, city, state, country } = req.body;

    // Update user profile
    const { error: userError } = await supabase
      .from('users')
      .update({
        full_name: fullName,
        phone: phoneNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (userError) {
      console.error('User update error:', userError);
      return res.status(500).json({ error: 'Failed to update user profile' });
    }

    // Save/update KYC personal info
    const { error: kycError } = await supabase
      .from('kyc_personal_info')
      .upsert({
        user_id: userId,
        full_name: fullName,
        date_of_birth: dateOfBirth,
        phone_number: phoneNumber,
        address: address,
        city: city,
        state: state,
        country: country,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (kycError) {
      console.error('KYC info error:', kycError);
      return res.status(500).json({ error: 'Failed to save personal information' });
    }

    res.json({ message: 'Personal information updated successfully' });

  } catch (error) {
    console.error('Personal info update error:', error);
    res.status(500).json({ error: 'Failed to update personal information' });
  }
});

// Get KYC status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get document count
    const { data: documents, error: docError } = await supabase
      .from('kyc_documents')
      .select('status')
      .eq('user_id', userId);

    if (docError) {
      console.error('Document fetch error:', docError);
      return res.status(500).json({ error: 'Failed to fetch KYC status' });
    }

    // Get personal info
    const { data: personalInfo, error: infoError } = await supabase
      .from('kyc_personal_info')
      .select('*')
      .eq('user_id', userId)
      .single();

    const totalDocuments = 4; // National ID, Passport Photo, Proof of Address, Bank Statement
    const uploadedDocuments = documents.filter(doc => doc.status === 'uploaded' || doc.status === 'verified').length;
    const verifiedDocuments = documents.filter(doc => doc.status === 'verified').length;

    const kycStatus = verifiedDocuments === totalDocuments ? 'verified' : 
                     uploadedDocuments > 0 ? 'pending' : 'not_started';

    res.json({
      status: kycStatus,
      documents_uploaded: uploadedDocuments,
      documents_verified: verifiedDocuments,
      total_documents: totalDocuments,
      personal_info_complete: !!personalInfo,
      compliance_score: Math.round((verifiedDocuments / totalDocuments) * 100)
    });

  } catch (error) {
    console.error('KYC status error:', error);
    res.status(500).json({ error: 'Failed to fetch KYC status' });
  }
});

module.exports = router;
