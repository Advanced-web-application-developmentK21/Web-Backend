const verificationCodes = new Map(); // Temporary storage for codes (use Redis or DB in production)

function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
}

async function saveVerificationCode(email, code) {
    verificationCodes.set(email, { code, expiresAt: Date.now() + 5 * 60 * 1000 }); // Expires in 5 minutes
}

async function verifyCode(email, code) {
    const record = verificationCodes.get(email);
    if (!record || record.code !== code || record.expiresAt < Date.now()) {
        return false;
    }
    verificationCodes.delete(email); // Remove code after verification
    return true;
}

module.exports = { generateVerificationCode, saveVerificationCode, verifyCode };