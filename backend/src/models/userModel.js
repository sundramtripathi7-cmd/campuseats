function validateUserRegistration(data) {
  const errors = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return ['Request body must be a JSON object'];
  }

  const { name, email, password, role = 'student' } = data;

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('name is required and must be a non-empty string');
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    errors.push('valid email is required');
  }

  if (!password || typeof password !== 'string' || password.length < 4) {
    errors.push('password is required (minimum 4 characters)');
  }

  const validRoles = ['student', 'vendor', 'admin', 'administrator'];
  if (!validRoles.includes(role.toLowerCase())) {
    errors.push(`role must be one of: ${validRoles.join(', ')}`);
  }

  return errors;
}

function validateUserLogin(data) {
  const errors = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return ['Request body must be a JSON object'];
  }

  const { email, password } = data;

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('email is required');
  }

  if (!password || typeof password !== 'string') {
    errors.push('password is required');
  }

  return errors;
}

module.exports = {
  validateUserRegistration,
  validateUserLogin,
};

