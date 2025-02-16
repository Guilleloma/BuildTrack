const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');
const { formatCurrency } = require('./formatters');

// Configuración de colores y estilos
const COLORS = {
    primary: '#2196F3',      // Azul principal
    secondary: '#757575',    // Gris secundario
    success: '#4CAF50',      // Verde para estados positivos
    warning: '#FFC107',      // Amarillo para advertencias
    text: '#333333',         // Color principal del texto
    lightGrey: '#F5F5F5'     // Fondo gris claro
};

function generatePDFReport(project, stream) {
    // Crear el documento
    const doc = new PDFDocument({
        margins: { top: 50, bottom: 70, left: 50, right: 50 },
        bufferPages: true
    });

    doc.pipe(stream);

    // Función helper para dibujar una línea separadora
    const drawSeparator = () => {
        doc.strokeColor(COLORS.lightGrey)
           .lineWidth(1)
           .moveTo(50, doc.y)
           .lineTo(550, doc.y)
           .stroke();
        doc.moveDown(1);
    };

    // Función helper para crear una barra de progreso
    const drawProgressBar = (x, y, width, progress, color) => {
        // Fondo de la barra
        doc.fillColor(COLORS.lightGrey)
           .rect(x, y, width, 10)
           .fill();
        // Barra de progreso
        doc.fillColor(color)
           .rect(x, y, width * (progress / 100), 10)
           .fill();
    };

    // Función helper para verificar espacio y añadir página si es necesario
    const checkSpace = (neededSpace = 150) => {
        const currentY = doc.y;
        const pageHeight = doc.page.height;
        const marginBottom = 70;

        if (currentY + neededSpace > pageHeight - marginBottom) {
            doc.addPage();
            doc.y = 50; // Reset Y position to top margin
            return true;
        }
        return false;
    };

    try {
        // Header con título
        doc.fontSize(24)
           .fillColor(COLORS.primary)
           .text('Project Report', { align: 'center' });
        
        doc.moveDown(0.5);
        
        doc.fontSize(12)
           .fillColor(COLORS.secondary)
           .text(new Date().toLocaleDateString(), { align: 'center' });
        
        doc.moveDown(2);

        // Project Details Section
        doc.fontSize(16)
           .fillColor(COLORS.primary)
           .text('Project Details');
        
        doc.moveDown(1);
        drawSeparator();

        // Project info en una caja con fondo
        const projectBoxY = doc.y;
        doc.fillColor(COLORS.lightGrey)
           .rect(50, projectBoxY, 500, 120)
           .fill();
        
        doc.fillColor(COLORS.text)
           .fontSize(12)
           .text(`Name: ${project.name}`, 70, projectBoxY + 10)
           .text(`Description: ${project.description || 'N/A'}`, 70, projectBoxY + 35)
           .text(`Total Budget: ${formatCurrency(project.totals.base)}`, 70, projectBoxY + 60)
           .text(`Total with Tax: ${formatCurrency(project.totals.totalWithTax)}`, 70, projectBoxY + 85);

        doc.y = projectBoxY + 140; // Move past the box

        // Project Progress Section
        checkSpace(200);
        doc.fontSize(16)
           .fillColor(COLORS.primary)
           .text('Project Progress');
        
        doc.moveDown(1);
        drawSeparator();

        // Payment Progress
        doc.fontSize(12)
           .fillColor(COLORS.text)
           .text(`Payment Progress: ${project.totals.paymentPercentage.toFixed(2)}% (${formatCurrency(project.totals.paid)}/${formatCurrency(project.totals.totalWithTax)})`);
        
        doc.moveDown(1);
        drawProgressBar(50, doc.y, 500, project.totals.paymentPercentage, COLORS.success);
        doc.moveDown(2);

        // Tasks Progress
        const totalTasks = project.milestones.reduce((sum, m) => sum + (m.tasks?.length || 0), 0);
        const completedTasks = project.milestones.reduce((sum, m) => 
            sum + (m.tasks?.filter(t => t.status === 'COMPLETED').length || 0), 0);
        const taskCompletionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        doc.fontSize(12)
           .fillColor(COLORS.text)
           .text(`Tasks Progress: ${taskCompletionPercentage.toFixed(2)}% (${completedTasks} Tareas Realizadas/${totalTasks} Total Tareas)`);
        
        doc.moveDown(1);
        drawProgressBar(50, doc.y, 500, taskCompletionPercentage, COLORS.primary);
        doc.moveDown(3);

        // Milestones Section
        project.milestones.forEach((milestone, index) => {
            checkSpace(400); // Increased space needed for milestone section

            // Milestone header
            const milestoneHeaderY = doc.y;
            doc.fontSize(14)
               .fillColor(COLORS.primary)
               .text(`${index + 1}. ${milestone.name}`);
            
            doc.moveDown(1);

            // Milestone info box
            const milestoneBoxY = doc.y;
            doc.fillColor(COLORS.lightGrey)
               .rect(50, milestoneBoxY, 500, 150)
               .fill();

            // Milestone details
            doc.fillColor(COLORS.text)
               .fontSize(12)
               .text(`Description: ${milestone.description || 'N/A'}`, 70, milestoneBoxY + 10)
               .text(`Budget: ${formatCurrency(milestone.budget)}`, 70, milestoneBoxY + 35);

            let currentY = milestoneBoxY + 60;

            if (milestone.hasTax) {
                doc.text(`Tax Rate: ${milestone.taxRate}%`, 70, currentY);
                currentY += 25;
                doc.text(`Total with Tax: ${formatCurrency(milestone.totalWithTax)}`, 70, currentY);
                currentY += 25;
            }

            doc.text(`Paid Amount: ${formatCurrency(milestone.paidAmount)}`, 70, currentY);
            
            doc.y = milestoneBoxY + 160; // Move past the info box

            // Progress bars section
            doc.moveDown(1);
            doc.fillColor(COLORS.text)
               .text(`Payment Progress: ${milestone.paymentPercentage.toFixed(2)}% (${formatCurrency(milestone.paidAmount)}/${formatCurrency(milestone.totalWithTax)})`, 70);
            doc.moveDown(1);
            drawProgressBar(70, doc.y, 460, milestone.paymentPercentage, COLORS.success);
            doc.moveDown(2);

            doc.fillColor(COLORS.text)
               .text(`Tasks Progress: ${milestone.taskCompletionPercentage.toFixed(2)}% (${milestone.completedTasks} Tareas Realizadas/${milestone.totalTasks} Total Tareas)`, 70);
            doc.moveDown(1);
            drawProgressBar(70, doc.y, 460, milestone.taskCompletionPercentage, COLORS.primary);
            doc.moveDown(2);

            // Tasks list
            if (milestone.tasks && milestone.tasks.length > 0) {
                checkSpace(150);
                doc.fontSize(12)
                   .fillColor(COLORS.primary)
                   .text('Tasks:', 70);
                
                doc.moveDown(1);

                milestone.tasks.forEach(task => {
                    checkSpace(50);
                    const status = task.status === 'COMPLETED' ? '(FINALIZADO)' : '(PENDIENTE)';
                    doc.fontSize(10)
                       .fillColor(COLORS.text)
                       .text(`${task.name} `, 90, doc.y, { continued: true })
                       .fillColor(task.status === 'COMPLETED' ? COLORS.success : COLORS.secondary)
                       .text(status, { continued: false });
                    doc.moveDown(0.5);
                });
            }

            // Payments list
            if (milestone.payments && milestone.payments.length > 0) {
                checkSpace(150);
                doc.moveDown(1);
                doc.fontSize(12)
                   .fillColor(COLORS.primary)
                   .text('Payments:', 70);
                
                doc.moveDown(1);

                milestone.payments.forEach(payment => {
                    checkSpace(50);
                    const date = new Date(payment.paymentDate).toLocaleDateString();
                    doc.fontSize(10)
                       .fillColor(COLORS.text)
                       .text(`• ${date}: ${formatCurrency(payment.amount)} (${payment.paymentMethod})`, 90);
                    doc.moveDown(0.5);
                });
            }

            doc.moveDown(2);
            drawSeparator();
        });

        doc.end();
    } catch (error) {
        console.error('Error generating PDF:', error);
        stream.end();
    }
}

function generateExcelReport(project) {
    const workbook = XLSX.utils.book_new();

    // Project Overview Sheet
    const overviewData = [
        ['Project Report'],
        [],
        ['Project Details'],
        ['Name', project.name],
        ['Description', project.description || 'N/A'],
        ['Total Budget', formatCurrency(project.totals.base)],
        ['Total with Tax', formatCurrency(project.totals.totalWithTax)],
        ['Total Paid', formatCurrency(project.totals.paid)],
        ['Payment Progress', `${project.totals.paymentPercentage.toFixed(2)}%`],
    ];

    const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');

    // Milestones Sheet
    const milestonesData = [
        ['Milestone Name', 'Description', 'Budget', 'Tax Rate', 'Total with Tax', 'Paid Amount', 'Payment Progress', 'Tasks Progress', 'Tasks Completed']
    ];

    project.milestones.forEach(milestone => {
        milestonesData.push([
            milestone.name,
            milestone.description || 'N/A',
            formatCurrency(milestone.budget),
            milestone.hasTax ? `${milestone.taxRate}%` : 'N/A',
            formatCurrency(milestone.totalWithTax),
            formatCurrency(milestone.paidAmount),
            `${milestone.paymentPercentage.toFixed(2)}%`,
            `${milestone.taskCompletionPercentage.toFixed(2)}%`,
            `${milestone.completedTasks}/${milestone.totalTasks}`
        ]);
    });

    const milestonesSheet = XLSX.utils.aoa_to_sheet(milestonesData);
    XLSX.utils.book_append_sheet(workbook, milestonesSheet, 'Milestones');

    // Tasks Sheet
    const tasksData = [
        ['Milestone', 'Task Name', 'Description', 'Status']
    ];

    project.milestones.forEach(milestone => {
        if (milestone.tasks) {
            milestone.tasks.forEach(task => {
                tasksData.push([
                    milestone.name,
                    task.name,
                    task.description || 'N/A',
                    task.status
                ]);
            });
        }
    });

    const tasksSheet = XLSX.utils.aoa_to_sheet(tasksData);
    XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Tasks');

    // Payments Sheet
    const paymentsData = [
        ['Milestone', 'Date', 'Amount', 'Method', 'Description']
    ];

    project.milestones.forEach(milestone => {
        if (milestone.payments) {
            milestone.payments.forEach(payment => {
                paymentsData.push([
                    milestone.name,
                    new Date(payment.paymentDate).toLocaleDateString(),
                    formatCurrency(payment.amount),
                    payment.paymentMethod,
                    payment.description || 'N/A'
                ]);
            });
        }
    });

    const paymentsSheet = XLSX.utils.aoa_to_sheet(paymentsData);
    XLSX.utils.book_append_sheet(workbook, paymentsSheet, 'Payments');

    return workbook;
}

module.exports = {
    generatePDFReport,
    generateExcelReport
}; 
