/**
 * Validates that a password meets the required policy:
 * - At least 8 characters long
 * - Contains at least one uppercase letter
 * - Contains at least one number
 * - Contains at least one special character (punctuation)
 */
export const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'La contraseña debe tener al menos 8 caracteres.' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'La contraseña debe incluir al menos una letra mayúscula.' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'La contraseña debe incluir al menos un número.' };
  }
  
  // Checking for punctuation/special characters
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, message: 'La contraseña debe incluir al menos un signo de puntuación o carácter especial.' };
  }
  
  return { isValid: true, message: '' };
};
