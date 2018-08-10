var crypto = require('crypto');

class Cipher {
  constructor(key, iv)  {
    key = key || 'somekey';
    iv = iv || crypto.randomBytes(16);
    this.cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    this.decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  }

  encrypt(data) {
    let encrypted = this.cipher.update(data, 'utf8', 'binary');
    encrypted += this.cipher.final('binary');
    return Buffer.from(encrypted, 'binary');
  }

  decrypt(data) {
    let decrypted = this.decipher.update(data, 'binary', 'utf8');
    decrypted += this.decipher.final('utf8');
    return Buffer.from(decrypted, 'utf8');
  }
}

module.exports = Cipher;
