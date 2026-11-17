const { validateUserRegistration, validateUserLogin } = require('../models/userModel');
const { registerUser, loginUser, getUserById } = require('../services/authService');
const { sendProblem } = require('../utils/problemDetails');

async function register(req, res, next) {
  const errors = validateUserRegistration(req.body);
  if (errors.length > 0) {
    return sendProblem(
      res,
      400,
      'Validation Failed',
      'One or more registration fields are invalid',
      'https://campuseats.example/problems/validation-error',
      { errors }
    );
  }

  try {
    const { user, token } = await registerUser(req.body);
    return res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
    });
  } catch (err) {
    if (err.status === 409) {
      return sendProblem(
        res,
        409,
        'Conflict',
        err.message,
        'https://campuseats.example/problems/409'
      );
    }
    next(err);
  }
}

async function login(req, res, next) {
  const errors = validateUserLogin(req.body);
  if (errors.length > 0) {
    return sendProblem(
      res,
      400,
      'Validation Failed',
      'Email and password are required',
      'https://campuseats.example/problems/validation-error',
      { errors }
    );
  }

  try {
    const { user, token } = await loginUser(req.body);
    return res.status(200).json({
      message: 'Login successful',
      user,
      token,
    });
  } catch (err) {
    if (err.status === 401) {
      return sendProblem(
        res,
        401,
        'Unauthorized',
        err.message,
        'https://campuseats.example/problems/401'
      );
    }
    next(err);
  }
}

async function getMe(req, res) {
  return res.status(200).json({
    user: req.user,
  });
}

function uploadDocument(req, res) {
  if (!req.file) {
    return sendProblem(
      res,
      400,
      'Bad Request',
      'No file uploaded',
      'https://campuseats.example/problems/400'
    );
  }

  return res.status(200).json({
    message: 'File uploaded successfully',
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    path: `/uploads/${req.file.filename}`,
  });
}

module.exports = {
  register,
  login,
  getMe,
  uploadDocument,
};

