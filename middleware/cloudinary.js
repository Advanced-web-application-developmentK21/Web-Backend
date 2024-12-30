const cloudinary = require('cloudinary').v2;

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: 'dp7adrr6i', // Thay bằng tên Cloudinary của bạn
  api_key: '697586394415365',       // Thay bằng API Key
  api_secret: 'SS2vNbKnz7dVQ6uXrzmtNWyQPRw', // Thay bằng API Secret
});

module.exports = cloudinary;
