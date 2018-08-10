var crypto = require('crypto');

class Cipher {
  constructor(key, iv)  {
    this.key = key || '098F6BCD4621D373CADE4E832627B4F6';
    this.iv = iv || crypto.randomBytes(16);
  }

  encrypt(data) {
    const cipher = crypto.createCipheriv('aes-256-cbc', this.key, this.iv);
    let encrypted = cipher.update(data, 'utf8', 'binary');
    encrypted += cipher.final('binary');
    return Buffer.from(encrypted, 'binary');
  }

  decrypt(data) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, this.iv);
    let decrypted = decipher.update(data, 'binary', 'base64');
    decrypted += decipher.final('base64');
    return Buffer.from(decrypted, 'base64');
  }
}

module.exports = Cipher;
