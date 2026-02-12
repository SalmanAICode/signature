const libre = require('libreoffice-convert');

exports.convertDocxToPdf = (buffer) => {
    return new Promise((resolve, reject) => {
        libre.convert(buffer, '.pdf', undefined, (err, done) => {
            if (err) return reject(err);
            resolve(done);
        });
    });
};
