const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const ErrorResponse = require('../utils/errorResponse');
const mammoth = require('mammoth');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Extract placeholders from Word document
 * @param {Buffer} fileBuffer - Word document buffer
 * @returns {Promise<Array>} - Array of placeholder names found in the document
 */
exports.extractPlaceholders = async (fileBuffer) => {
    try {
        const zip = new PizZip(fileBuffer);
        
        // Method 1: Try using docxtemplater's getFullText
        let text = '';
        try {
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true
            });
            text = doc.getFullText();
        } catch (err) {
            console.warn('getFullText failed, trying XML extraction:', err.message);
        }
        
        // Method 2: Extract from XML directly (more reliable)
        // Check main document XML - placeholders might be split across XML nodes
        const documentXml = zip.files['word/document.xml'];
        if (documentXml) {
            const xmlContent = documentXml.asText();
            
            // Remove XML tags to get clean text (placeholders might be split across <w:t> tags)
            const textWithoutTags = xmlContent
                .replace(/<[^>]+>/g, ' ') // Remove all XML tags
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim();
            
            // Extract placeholders from cleaned XML text
            const xmlPlaceholders = textWithoutTags.match(/\{\{([^}]+)\}\}/g);
            if (xmlPlaceholders) {
                xmlPlaceholders.forEach(placeholder => {
                    const match = placeholder.match(/\{\{([^}]+)\}\}/);
                    if (match) {
                        const name = match[1].trim();
                        if (name && !text.includes(`{{${name}}}`)) {
                            text += ` {{${name}}} `;
                        }
                    }
                });
            }
            
            // Also try direct XML content search (in case placeholders span tags)
            const directMatches = xmlContent.match(/\{\{[^}]+\}\}/g);
            if (directMatches) {
                directMatches.forEach(placeholder => {
                    const match = placeholder.match(/\{\{([^}]+)\}\}/);
                    if (match) {
                        const name = match[1].trim();
                        if (name && !text.includes(`{{${name}}}`)) {
                            text += ` {{${name}}} `;
                        }
                    }
                });
            }
        }
        
        // Also check headers and footers
        const headerFiles = Object.keys(zip.files).filter(name => name.startsWith('word/header') && name.endsWith('.xml'));
        const footerFiles = Object.keys(zip.files).filter(name => name.startsWith('word/footer') && name.endsWith('.xml'));
        
        [...headerFiles, ...footerFiles].forEach(fileName => {
            try {
                const xmlContent = zip.files[fileName].asText();
                
                // Remove XML tags and search for placeholders
                const textWithoutTags = xmlContent
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                
                const xmlPlaceholders = textWithoutTags.match(/\{\{([^}]+)\}\}/g);
                if (xmlPlaceholders) {
                    xmlPlaceholders.forEach(placeholder => {
                        const match = placeholder.match(/\{\{([^}]+)\}\}/);
                        if (match) {
                            const name = match[1].trim();
                            if (name && !text.includes(`{{${name}}}`)) {
                                text += ` {{${name}}} `;
                            }
                        }
                    });
                }
                
                // Also try direct XML search
                const directMatches = xmlContent.match(/\{\{[^}]+\}\}/g);
                if (directMatches) {
                    directMatches.forEach(placeholder => {
                        const match = placeholder.match(/\{\{([^}]+)\}\}/);
                        if (match) {
                            const name = match[1].trim();
                            if (name && !text.includes(`{{${name}}}`)) {
                                text += ` {{${name}}} `;
                            }
                        }
                    });
                }
            } catch (err) {
                // Ignore errors in headers/footers
            }
        });
        
        // Extract placeholders in format {{FieldName}}
        const placeholderRegex = /\{\{([^}]+)\}\}/g;
        const placeholders = [];
        let match;
        
        // Reset regex lastIndex
        placeholderRegex.lastIndex = 0;
        
        while ((match = placeholderRegex.exec(text)) !== null) {
            const placeholderName = match[1].trim();
            if (placeholderName && !placeholders.includes(placeholderName)) {
                placeholders.push(placeholderName);
            }
        }
        
        // Diagnostic: Check for any curly braces
        const hasSingleBraces = text.includes('{') || text.includes('}');
        const hasDoubleBraces = text.includes('{{') || text.includes('}}');
        
        console.log('Placeholder extraction results:', {
            placeholdersFound: placeholders.length,
            placeholders: placeholders,
            hasSingleBraces: hasSingleBraces,
            hasDoubleBraces: hasDoubleBraces,
            textLength: text.length,
            textPreview: text.substring(0, 500).replace(/\s+/g, ' ')
        });
        
        return placeholders;
    } catch (error) {
        console.error('Error extracting placeholders:', error);
        console.error('Error stack:', error.stack);
        throw new ErrorResponse(`Failed to extract placeholders from Word document: ${error.message}`, 400);
    }
};

/**
 * Validate that Word document contains placeholders
 * @param {Buffer} fileBuffer - Word document buffer
 * @returns {Promise<boolean>} - True if placeholders found, false otherwise
 */
exports.validateHasPlaceholders = async (fileBuffer) => {
    try {
        const placeholders = await exports.extractPlaceholders(fileBuffer);
        const hasPlaceholders = placeholders.length > 0;
        console.log(`Placeholder validation: Found ${placeholders.length} placeholders`);
        if (!hasPlaceholders) {
            console.log('No placeholders found. Make sure placeholders are in format {{FieldName}}');
        }
        return hasPlaceholders;
    } catch (error) {
        console.error('Error validating placeholders:', error);
        // Don't throw here, return false so we can provide a better error message
        return false;
    }
};

/**
 * Replace placeholders in Word document with data
 * @param {Buffer} fileBuffer - Word document buffer
 * @param {Object} data - Data object with values to replace placeholders
 * @returns {Promise<Buffer>} - Word document buffer with replaced placeholders
 */
exports.replacePlaceholders = async (fileBuffer, data) => {
    try {
        const zip = new PizZip(fileBuffer);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            delimiters: {
                start: '{{',
                end: '}}'
            }
        });

        // Replace placeholders with data
        // Convert all values to strings and handle null/undefined
        const processedData = {};
        Object.keys(data).forEach(key => {
            const value = data[key];
            if (value === null || value === undefined) {
                processedData[key] = '';
            } else if (typeof value === 'object') {
                // For nested objects, convert to JSON string or handle appropriately
                processedData[key] = JSON.stringify(value);
            } else {
                processedData[key] = String(value);
            }
        });

        doc.setData(processedData);
        
        try {
            doc.render();
        } catch (error) {
            // Handle missing placeholders gracefully
            if (error.properties && error.properties.errors instanceof Array) {
                const errors = error.properties.errors.map(e => e.name).join(', ');
                console.warn('Some placeholders were not replaced:', errors);
            }
            // Continue anyway - missing placeholders will remain as {{FieldName}}
        }

        const buf = doc.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE'
        });

        return buf;
    } catch (error) {
        console.error('Error replacing placeholders:', error);
        throw new ErrorResponse(`Failed to replace placeholders: ${error.message}`, 400);
    }
};

/**
 * Convert Word document to PDF using Mammoth (docx to HTML) + Puppeteer (HTML to PDF)
 * Falls back to LibreOffice if available
 * @param {Buffer} docxBuffer - Word document buffer
 * @returns {Promise<Buffer>} - PDF buffer
 */
exports.convertWordToPdf = async (docxBuffer) => {
    // Try LibreOffice first (best quality, preserves formatting)
    try {
        const libre = require('libreoffice-convert');
        const libreConvert = libre.convert;
        const { promisify } = require('util');
        const libreConvertAsync = promisify(libreConvert);
        console.log('Attempting LibreOffice conversion...');
        const pdfBuffer = await libreConvertAsync(docxBuffer, '.pdf', undefined);
        console.log('LibreOffice conversion successful');
        return pdfBuffer;
    } catch (libreError) {
        console.warn('LibreOffice conversion failed, trying Mammoth + Puppeteer:', libreError.message);
        
        // Fallback to Mammoth + Puppeteer
        try {
            // Step 1: Convert DOCX to HTML using Mammoth
            console.log('Converting DOCX to HTML using Mammoth...');
            const result = await mammoth.convertToHtml({ buffer: docxBuffer });
            const html = result.value;
            
            // Step 2: Convert HTML to PDF using Puppeteer
            console.log('Converting HTML to PDF using Puppeteer...');
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            try {
                const page = await browser.newPage();
                
                // Set content with proper styling
                const htmlContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                margin: 40px;
                                line-height: 1.6;
                            }
                            p { margin: 10px 0; }
                            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
                            table td, table th { border: 1px solid #ddd; padding: 8px; }
                            table th { background-color: #f2f2f2; }
                        </style>
                    </head>
                    <body>
                        ${html}
                    </body>
                    </html>
                `;
                
                await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
                
                // Generate PDF
                const pdfBuffer = await page.pdf({
                    format: 'A4',
                    printBackground: true,
                    margin: {
                        top: '20mm',
                        right: '20mm',
                        bottom: '20mm',
                        left: '20mm'
                    }
                });
                
                console.log('Mammoth + Puppeteer conversion successful');
                return pdfBuffer;
            } finally {
                await browser.close();
            }
        } catch (puppeteerError) {
            console.error('Mammoth + Puppeteer conversion failed:', puppeteerError);
            throw new ErrorResponse(
                'Failed to convert Word document to PDF. ' +
                'Please install LibreOffice (recommended) or ensure Puppeteer dependencies are installed. ' +
                `Error: ${puppeteerError.message}`,
                500
            );
        }
    }
};

/**
 * Process Word template: replace placeholders and convert to PDF
 * @param {Buffer} fileBuffer - Word document buffer
 * @param {Object} data - Data object with values to replace placeholders
 * @returns {Promise<Buffer>} - PDF buffer
 */
exports.processWordTemplate = async (fileBuffer, data) => {
    try {
        // First validate placeholders exist
        const placeholders = await exports.extractPlaceholders(fileBuffer);
        if (!placeholders || placeholders.length === 0) {
            // Try to provide helpful debugging info
            const zip = new PizZip(fileBuffer);
            let sampleText = '';
            try {
                const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
                sampleText = doc.getFullText().substring(0, 200);
            } catch (e) {
                // Ignore
            }
            
            const errorMsg = `Word document does not contain any placeholders in the format {{FieldName}}. ` +
                `Please ensure placeholders are typed exactly as {{FieldName}} (with double curly braces, no spaces inside braces). ` +
                `Found placeholders: ${placeholders.length}. ` +
                `Sample text: ${sampleText.substring(0, 100)}...`;
            
            console.error('Placeholder validation failed:', {
                placeholdersFound: placeholders.length,
                sampleText: sampleText.substring(0, 200)
            });
            
            throw new ErrorResponse(errorMsg, 400);
        }
        
        console.log(`Processing Word template with ${placeholders.length} placeholders:`, placeholders);

        // Replace placeholders
        const populatedDocx = await exports.replacePlaceholders(fileBuffer, data);
        
        // Convert to PDF
        const pdfBuffer = await exports.convertWordToPdf(populatedDocx);
        
        return pdfBuffer;
    } catch (error) {
        // Check if it's an ErrorResponse by checking for statusCode property
        if (error && typeof error === 'object' && 'statusCode' in error && 'message' in error) {
            throw error;
        }
        console.error('Error processing Word template:', error);
        const errorMessage = error?.message || 'Unknown error occurred';
        throw new ErrorResponse(`Failed to process Word template: ${errorMessage}`, 500);
    }
};
