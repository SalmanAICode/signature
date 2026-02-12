const path = require('path');
const fs = require('fs');
const Handlebars = require('handlebars');

Handlebars.registerHelper('inc', (value) => value + 1);

exports.generatePDF = async (data, filePath) => {
    const templatePath = path.join(process.cwd(), filePath);
    const html = fs.readFileSync(templatePath, 'utf8');

    const template = Handlebars.compile(html);
    const logoPath = path.join(process.cwd(), 'public', 'icon.png');
    let logoDataUri = '';
    try {
        const logoBuffer = fs.readFileSync(logoPath);
        const ext = path.extname(logoPath).slice(1) || 'png';
        const base64 = logoBuffer.toString('base64');
        logoDataUri = `data:image/${ext};base64,${base64}`;
    } catch (err) {
        console.warn('Logo not found or couldn\'t be read:', err);
    }

    const finalHtml = template({
        ...data,
        logoDataUri,
    });

    return finalHtml;
};