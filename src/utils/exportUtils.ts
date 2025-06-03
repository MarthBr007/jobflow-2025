import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface DocumentTemplate {
    id: string;
    name: string;
    description: string;
    type: "CONTRACT" | "SCHEDULE" | "INVOICE" | "LETTER" | "REPORT";
    category: string;
    content: string;
    variables: string[];
    headerImage?: string;
    footerImage?: string;
    logoImage?: string;
    isActive: boolean;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}

interface TemplateVariables {
    [key: string]: string | number | Date;
}

interface ScheduleShift {
    id: string;
    userId: string;
    projectId?: string;
    startTime: string;
    endTime: string;
    role?: string;
    notes?: string;
    status: "SCHEDULED" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
    project?: {
        id: string;
        name: string;
        company: string;
    };
    breaks?: Array<{
        startTime: string;
        endTime: string;
        type?: string;
        duration: number;
    }>;
}

interface ExportOptions {
    title?: string;
    companyName?: string;
    companyLogo?: string;
    includeBreaks?: boolean;
    includeNotes?: boolean;
    includeMetadata?: boolean;
    dateRange?: {
        start: string;
        end: string;
    };
    theme?: 'default' | 'minimal' | 'professional';
    watermark?: string;
    template?: DocumentTemplate;
    templateVariables?: TemplateVariables;
}

export class ExportUtils {
    /**
     * Generate document from template with variables
     */
    static generateDocumentFromTemplate(
        template: DocumentTemplate,
        variables: TemplateVariables,
        outputFormat: 'PDF' | 'DOCX' | 'HTML' = 'PDF'
    ): void {
        let content = template.content;

        // Replace all template variables with actual values
        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            content = content.replace(regex, String(value));
        });

        switch (outputFormat) {
            case 'PDF':
                this.generateTemplatePDF(template, content, variables);
                break;
            case 'HTML':
                this.generateTemplateHTML(template, content, variables);
                break;
            default:
                this.generateTemplatePDF(template, content, variables);
        }
    }

    /**
     * Generate PDF document from template
     */
    private static generateTemplatePDF(
        template: DocumentTemplate,
        processedContent: string,
        variables: TemplateVariables
    ): void {
        const doc = new jsPDF('portrait', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        // Add header with logo if available
        if (template.headerImage || template.logoImage) {
            this.addTemplateHeader(doc, template, pageWidth);
        }

        // Add document title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(17, 24, 39);
        const titleY = template.headerImage ? 60 : 30;
        doc.text(template.name, pageWidth / 2, titleY, { align: 'center' });

        // Add content
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(75, 85, 99);

        const contentLines = processedContent.split('\n');
        let currentY = titleY + 20;
        const lineHeight = 7;
        const margin = 20;

        contentLines.forEach((line) => {
            if (currentY > pageHeight - 40) {
                doc.addPage();
                currentY = 30;
            }

            // Handle markdown-style formatting
            if (line.startsWith('**') && line.endsWith('**')) {
                doc.setFont('helvetica', 'bold');
                const text = line.slice(2, -2);
                doc.text(text, margin, currentY);
                doc.setFont('helvetica', 'normal');
            } else if (line.startsWith('- ')) {
                doc.text('• ' + line.slice(2), margin + 5, currentY);
            } else if (line.trim() === '') {
                currentY += lineHeight / 2;
                return;
            } else {
                doc.text(line, margin, currentY);
            }

            currentY += lineHeight;
        });

        // Add footer if available
        if (template.footerImage) {
            this.addTemplateFooter(doc, template, pageWidth, pageHeight);
        } else {
            // Default footer
            this.addDefaultFooter(doc, pageWidth, pageHeight, template.name);
        }

        // Save document
        const fileName = `${template.name.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        doc.save(fileName);
    }

    /**
     * Generate HTML document from template
     */
    private static generateTemplateHTML(
        template: DocumentTemplate,
        processedContent: string,
        variables: TemplateVariables
    ): void {
        const htmlContent = `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.name}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            max-height: 80px;
            margin-bottom: 20px;
        }
        h1 {
            color: #1f2937;
            margin-bottom: 10px;
        }
        .content {
            white-space: pre-wrap;
            margin-bottom: 40px;
        }
        .footer {
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
        .variables {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-top: 30px;
        }
        .variable-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .variable-item:last-child {
            border-bottom: none;
        }
    </style>
</head>
<body>
    <div class="header">
        ${template.logoImage ? `<img src="${template.logoImage}" alt="Logo" class="logo">` : ''}
        <h1>${template.name}</h1>
        <p>Gegenereerd op ${format(new Date(), 'dd MMMM yyyy', { locale: nl })}</p>
    </div>
    
    <div class="content">${processedContent}</div>
    
    <div class="variables">
        <h3>Gebruikte Variabelen:</h3>
        ${Object.entries(variables).map(([key, value]) =>
            `<div class="variable-item">
                <strong>${key}:</strong>
                <span>${value}</span>
            </div>`
        ).join('')}
    </div>
    
    <div class="footer">
        <p>Aangemaakt met JobFlow Solutions Document Templates</p>
        <p>© ${new Date().getFullYear()} JobFlow Solutions B.V.</p>
    </div>
</body>
</html>`;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const fileName = `${template.name.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.html`;
        saveAs(blob, fileName);
    }

    /**
     * Add template header to PDF
     */
    private static addTemplateHeader(doc: jsPDF, template: DocumentTemplate, pageWidth: number): void {
        if (template.headerImage) {
            // Header image would be added here
            doc.setFillColor(248, 250, 252);
            doc.rect(0, 0, pageWidth, 50, 'F');
        }

        if (template.logoImage) {
            // Logo would be added here - for now, placeholder
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(15, 10, 40, 30, 3, 3, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(59, 130, 246);
            doc.text('LOGO', 35, 28, { align: 'center' });
        }
    }

    /**
     * Add template footer to PDF
     */
    private static addTemplateFooter(doc: jsPDF, template: DocumentTemplate, pageWidth: number, pageHeight: number): void {
        const footerY = pageHeight - 20;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);

        doc.text(`Template: ${template.name}`, 15, footerY);
        doc.text(format(new Date(), 'dd-MM-yyyy HH:mm'), pageWidth - 15, footerY, { align: 'right' });
    }

    /**
     * Add default footer to PDF
     */
    private static addDefaultFooter(doc: jsPDF, pageWidth: number, pageHeight: number, templateName: string): void {
        const footerY = pageHeight - 15;

        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(0.5);
        doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(17, 24, 39);

        doc.text(`${templateName} - JobFlow Solutions`, 15, footerY);
        doc.text('© 2025 JobFlow Solutions B.V.', pageWidth / 2, footerY, { align: 'center' });
        doc.text('Pagina 1', pageWidth - 15, footerY, { align: 'right' });
    }

    /**
     * Generate contract from employee data
     */
    static generateEmployeeContract(
        employeeData: any,
        template?: DocumentTemplate
    ): void {
        const variables: TemplateVariables = {
            employee_name: employeeData.name || '',
            employee_email: employeeData.email || '',
            employee_phone: employeeData.phone || '',
            employee_address: employeeData.address || '',
            employee_type: employeeData.employeeType || '',
            hourly_rate: employeeData.hourlyRate || employeeData.hourlyWage || '',
            start_date: employeeData.startDate ? format(new Date(employeeData.startDate), 'dd MMMM yyyy', { locale: nl }) : format(new Date(), 'dd MMMM yyyy', { locale: nl }),
            contract_duration: employeeData.contractDuration || 'Onbepaalde tijd',
            job_title: employeeData.jobTitle || employeeData.role || '',
            company_name: 'JobFlow Solutions',
            company_address: 'Bedrijfsadres',
            today_date: format(new Date(), 'dd MMMM yyyy', { locale: nl }),
        };

        if (template) {
            this.generateDocumentFromTemplate(template, variables, 'PDF');
        } else {
            // Use default contract template
            const defaultTemplate: DocumentTemplate = {
                id: 'default-contract',
                name: 'Arbeidsovereenkomst',
                description: 'Standaard arbeidsovereenkomst',
                type: 'CONTRACT',
                category: 'Standaard',
                content: `ARBEIDSOVEREENKOMST

Tussen:
{{company_name}}
Gevestigd te: {{company_address}}

En:
{{employee_name}}
Wonende te: {{employee_address}}
E-mail: {{employee_email}}
Telefoon: {{employee_phone}}

**Artikel 1: Functie**
De werknemer wordt aangesteld als {{job_title}}.

**Artikel 2: Dienstverband**
Type dienstverband: {{employee_type}}
Ingangsdatum: {{start_date}}
Duur: {{contract_duration}}

**Artikel 3: Salaris**
Uurtarief: €{{hourly_rate}} per uur

**Artikel 4: Ondertekening**
Datum: {{today_date}}

Werkgever: ________________    Werknemer: ________________
{{company_name}}              {{employee_name}}`,
                variables: Object.keys(variables),
                isActive: true,
                isDefault: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'System',
            };

            this.generateDocumentFromTemplate(defaultTemplate, variables, 'PDF');
        }
    }

    /**
     * Professional PDF export with JobFlow branding
     */
    static async exportScheduleToPDF(
        shifts: ScheduleShift[],
        date: string,
        options: ExportOptions = {}
    ): Promise<void> {
        const doc = new jsPDF('landscape', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        // Company branding
        const companyName = options.companyName || 'JobFlow Solutions';
        const title = options.title || `Werkrooster ${format(new Date(date), 'dd MMMM yyyy', { locale: nl })}`;

        // Header with JobFlow branding
        this.addPDFHeader(doc, companyName, title, date, pageWidth);

        // Summary section with metrics
        const summaryY = this.addPDFSummary(doc, shifts, pageWidth);

        // Professional table
        this.addPDFTable(doc, shifts, summaryY + 10, options);

        // Footer with branding
        this.addPDFFooter(doc, pageWidth, pageHeight);

        // Save with professional filename
        const fileName = `JobFlow-Rooster-${format(new Date(date), 'yyyy-MM-dd')}.pdf`;
        doc.save(fileName);
    }

    /**
     * Advanced Excel export with multiple sheets and professional formatting
     */
    static exportScheduleToExcel(
        shifts: ScheduleShift[],
        date: string,
        options: ExportOptions = {}
    ): void {
        const workbook = XLSX.utils.book_new();

        // Main schedule sheet with professional formatting
        this.addExcelScheduleSheet(workbook, shifts, date, options);

        // Summary analytics sheet
        this.addExcelSummarySheet(workbook, shifts, date);

        // Employee breakdown sheet
        this.addExcelEmployeeSheet(workbook, shifts);

        // Project analysis sheet (if projects exist)
        if (shifts.some(s => s.project)) {
            this.addExcelProjectSheet(workbook, shifts);
        }

        // Save with professional filename
        const fileName = `JobFlow-Rooster-Analyse-${format(new Date(date), 'yyyy-MM-dd')}.xlsx`;
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        saveAs(blob, fileName);
    }

    /**
     * Add professional header to PDF
     */
    private static addPDFHeader(doc: jsPDF, companyName: string, title: string, date: string, pageWidth: number): void {
        // Background header bar with JobFlow blue
        doc.setFillColor(59, 130, 246);
        doc.rect(0, 0, pageWidth, 35, 'F');

        // Company logo placeholder (left side)
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(15, 8, 45, 20, 3, 3, 'F');

        // Logo text
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(59, 130, 246);
        doc.text('JF', 37.5, 21, { align: 'center' });

        // Company name and title (center)
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.text(companyName, pageWidth / 2, 18, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(14);
        doc.text(title, pageWidth / 2, 28, { align: 'center' });

        // Date and generation info (right side)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(
            format(new Date(date), 'EEEE d MMMM yyyy', { locale: nl }),
            pageWidth - 15,
            15,
            { align: 'right' }
        );
        doc.text(
            `Gegenereerd: ${format(new Date(), 'dd-MM-yyyy HH:mm')}`,
            pageWidth - 15,
            22,
            { align: 'right' }
        );
        doc.text(
            'jobflow-solutions.nl',
            pageWidth - 15,
            29,
            { align: 'right' }
        );

        // Reset text color
        doc.setTextColor(0, 0, 0);
    }

    /**
     * Add summary metrics section
     */
    private static addPDFSummary(doc: jsPDF, shifts: ScheduleShift[], pageWidth: number): number {
        const startY = 45;

        // Calculate metrics
        const totalShifts = shifts.length;
        const totalHours = shifts.reduce((total, shift) => {
            const start = new Date(shift.startTime);
            const end = new Date(shift.endTime);
            return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }, 0);

        const uniqueEmployees = new Set(shifts.map(s => s.user.id)).size;
        const uniqueProjects = new Set(shifts.map(s => s.project?.id).filter(Boolean)).size;
        const totalBreakTime = shifts.reduce((total, shift) => {
            return total + (shift.breaks?.reduce((breakTotal, breakItem) =>
                breakTotal + breakItem.duration, 0) || 0);
        }, 0);

        // Summary background
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(15, startY, pageWidth - 30, 25, 5, 5, 'F');
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(0.5);
        doc.roundedRect(15, startY, pageWidth - 30, 25, 5, 5, 'S');

        // Summary title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(17, 24, 39);
        doc.text('Rooster Samenvatting', 20, startY + 8);

        // Metrics in columns
        const metrics = [
            { label: 'Totaal Diensten', value: totalShifts.toString() },
            { label: 'Totaal Uren', value: `${totalHours.toFixed(1)}h` },
            { label: 'Medewerkers', value: uniqueEmployees.toString() },
            { label: 'Projecten', value: uniqueProjects.toString() },
            { label: 'Pauzetijd', value: `${totalBreakTime}min` }
        ];

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        const columnWidth = (pageWidth - 50) / metrics.length;
        metrics.forEach((metric, index) => {
            const x = 25 + (index * columnWidth);
            doc.setFont('helvetica', 'bold');
            doc.text(metric.value, x, startY + 15);
            doc.setFont('helvetica', 'normal');
            doc.text(metric.label, x, startY + 20);
        });

        return startY + 25;
    }

    /**
     * Add professional table with JobFlow styling
     */
    private static addPDFTable(doc: jsPDF, shifts: ScheduleShift[], startY: number, options: ExportOptions): void {
        // Prepare table data
        const tableData = shifts
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .map(shift => {
                const startTime = format(new Date(shift.startTime), 'HH:mm');
                const endTime = format(new Date(shift.endTime), 'HH:mm');
                const duration = ((new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60)).toFixed(1);

                const breakTime = shift.breaks?.reduce((total, breakItem) => total + breakItem.duration, 0) || 0;

                return [
                    shift.user.name,
                    `${startTime} - ${endTime}`,
                    `${duration}h`,
                    shift.role || '-',
                    shift.project?.name || 'Algemeen',
                    shift.project?.company || '-',
                    this.getStatusDisplayText(shift.status),
                    breakTime > 0 ? `${breakTime}min` : '-',
                    shift.notes || '-'
                ];
            });

        // Professional table headers
        const headers = [
            'Medewerker', 'Werktijd', 'Duur', 'Functie',
            'Project', 'Opdrachtgever', 'Status', 'Pauzes', 'Opmerkingen'
        ];

        // Generate table with JobFlow styling
        autoTable(doc, {
            head: [headers],
            body: tableData,
            startY: startY,
            styles: {
                fontSize: 8,
                cellPadding: 4,
                lineColor: [248, 250, 252],
                lineWidth: 0.1,
            },
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9,
                cellPadding: 5,
            },
            alternateRowStyles: {
                fillColor: [249, 250, 251],
            },
            columnStyles: {
                0: { cellWidth: 30, fontStyle: 'bold' },
                1: { cellWidth: 25, halign: 'center' },
                2: { cellWidth: 15, halign: 'center' },
                3: { cellWidth: 25 },
                4: { cellWidth: 35 },
                5: { cellWidth: 30 },
                6: { cellWidth: 20, halign: 'center' },
                7: { cellWidth: 15, halign: 'center' },
                8: { cellWidth: 40, fontSize: 7 },
            },
            didParseCell: (data) => {
                // Color coding for status column
                if (data.column.index === 6 && data.cell.text.length > 0) {
                    const status = data.cell.text[0];
                    switch (status) {
                        case 'Bevestigd':
                            data.cell.styles.textColor = [16, 185, 129];
                            break;
                        case 'Gepland':
                            data.cell.styles.textColor = [59, 130, 246];
                            break;
                        case 'Geannuleerd':
                            data.cell.styles.textColor = [239, 68, 68];
                            break;
                    }
                }
            }
        });
    }

    /**
     * Add professional footer with branding
     */
    private static addPDFFooter(doc: jsPDF, pageWidth: number, pageHeight: number): void {
        const footerY = pageHeight - 15;

        // Footer line
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(0.5);
        doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);

        // Footer text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(17, 24, 39);

        doc.text('JobFlow Solutions - Rooster Management Systeem', 15, footerY);
        doc.text('© 2025 JobFlow Solutions B.V.', pageWidth / 2, footerY, { align: 'center' });
        doc.text('Pagina 1', pageWidth - 15, footerY, { align: 'right' });
    }

    /**
     * Add main schedule sheet to Excel workbook
     */
    private static addExcelScheduleSheet(workbook: any, shifts: ScheduleShift[], date: string, options: ExportOptions): void {
        const scheduleData = shifts.map(shift => ({
            'Datum': format(new Date(shift.startTime), 'dd-MM-yyyy'),
            'Medewerker': shift.user.name,
            'Email': shift.user.email,
            'Rol': shift.user.role,
            'Starttijd': format(new Date(shift.startTime), 'HH:mm'),
            'Eindtijd': format(new Date(shift.endTime), 'HH:mm'),
            'Totaal Uren': ((new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60)).toFixed(1),
            'Functie': shift.role || '',
            'Project': shift.project?.name || 'Algemeen',
            'Opdrachtgever': shift.project?.company || '',
            'Status': this.getStatusDisplayTextExcel(shift.status),
            'Pauzes (min)': shift.breaks?.reduce((total, breakItem) =>
                total + breakItem.duration, 0) || 0,
            'Opmerkingen': shift.notes || '',
            'Kostprijs': this.calculateShiftCost(shift),
        }));

        const scheduleSheet = XLSX.utils.json_to_sheet(scheduleData);

        // Professional column widths
        scheduleSheet['!cols'] = [
            { wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 15 },
            { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 20 },
            { wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 12 },
            { wch: 30 }, { wch: 15 }
        ];

        XLSX.utils.book_append_sheet(workbook, scheduleSheet, 'Rooster Details');
    }

    /**
     * Add analytics summary sheet
     */
    private static addExcelSummarySheet(workbook: any, shifts: ScheduleShift[], date: string): void {
        const totalHours = shifts.reduce((total, shift) => {
            const start = new Date(shift.startTime);
            const end = new Date(shift.endTime);
            return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }, 0);

        const summary = [
            { 'Metriek': 'Datum', 'Waarde': format(new Date(date), 'dd MMMM yyyy', { locale: nl }) },
            { 'Metriek': 'Totaal Diensten', 'Waarde': shifts.length },
            { 'Metriek': 'Totaal Uren', 'Waarde': `${totalHours.toFixed(1)} uur` },
            { 'Metriek': 'Unieke Medewerkers', 'Waarde': new Set(shifts.map(s => s.user.id)).size },
            { 'Metriek': 'Unieke Projecten', 'Waarde': new Set(shifts.map(s => s.project?.id).filter(Boolean)).size },
            { 'Metriek': 'Totale Pauzetijd', 'Waarde': `${shifts.reduce((total, shift) => total + (shift.breaks?.reduce((breakTotal, breakItem) => breakTotal + breakItem.duration, 0) || 0), 0)} minuten` },
            { 'Metriek': 'Geschatte Kosten', 'Waarde': `€ ${shifts.reduce((total, shift) => total + this.calculateShiftCost(shift), 0).toFixed(2)}` },
            { 'Metriek': 'Gegenereerd op', 'Waarde': format(new Date(), 'dd-MM-yyyy HH:mm') },
        ];

        const summarySheet = XLSX.utils.json_to_sheet(summary);
        summarySheet['!cols'] = [{ wch: 25 }, { wch: 30 }];

        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Samenvatting');
    }

    /**
     * Add employee breakdown sheet
     */
    private static addExcelEmployeeSheet(workbook: any, shifts: ScheduleShift[]): void {
        const uniqueEmployees = Array.from(new Set(shifts.map(s => s.user.name)));
        const employeeSummary = uniqueEmployees.map(employee => {
            const employeeShifts = shifts.filter(s => s.user.name === employee);
            const totalHours = employeeShifts.reduce((total, shift) => {
                const start = new Date(shift.startTime);
                const end = new Date(shift.endTime);
                return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            }, 0);

            const totalBreaks = employeeShifts.reduce((total, shift) => {
                return total + (shift.breaks?.reduce((breakTotal, breakItem) =>
                    breakTotal + breakItem.duration, 0) || 0);
            }, 0);

            return {
                'Medewerker': employee,
                'Email': employeeShifts[0].user.email,
                'Rol': employeeShifts[0].user.role,
                'Aantal Diensten': employeeShifts.length,
                'Totaal Uren': totalHours.toFixed(1),
                'Totaal Pauzes (min)': totalBreaks,
                'Gemiddelde Uren per Dienst': (totalHours / employeeShifts.length).toFixed(1),
                'Totale Kosten': `€ ${employeeShifts.reduce((total, shift) => total + this.calculateShiftCost(shift), 0).toFixed(2)}`,
                'Projecten': Array.from(new Set(employeeShifts.map(s => s.project?.name).filter(Boolean))).join(', ') || 'Algemeen',
            };
        });

        const employeeSheet = XLSX.utils.json_to_sheet(employeeSummary);
        employeeSheet['!cols'] = [
            { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
            { wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 15 }, { wch: 30 }
        ];

        XLSX.utils.book_append_sheet(workbook, employeeSheet, 'Per Medewerker');
    }

    /**
     * Add project analysis sheet
     */
    private static addExcelProjectSheet(workbook: any, shifts: ScheduleShift[]): void {
        const projectShifts = shifts.filter(s => s.project);
        const uniqueProjects = Array.from(new Set(projectShifts.map(s => s.project!.name)));

        const projectSummary = uniqueProjects.map(projectName => {
            const projShifts = projectShifts.filter(s => s.project!.name === projectName);
            const totalHours = projShifts.reduce((total, shift) => {
                const start = new Date(shift.startTime);
                const end = new Date(shift.endTime);
                return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            }, 0);

            return {
                'Project': projectName,
                'Opdrachtgever': projShifts[0].project!.company,
                'Aantal Diensten': projShifts.length,
                'Totaal Uren': totalHours.toFixed(1),
                'Aantal Medewerkers': new Set(projShifts.map(s => s.user.id)).size,
                'Projectkosten': `€ ${projShifts.reduce((total, shift) => total + this.calculateShiftCost(shift), 0).toFixed(2)}`,
                'Gemiddelde Uren per Dienst': (totalHours / projShifts.length).toFixed(1),
                'Functies': Array.from(new Set(projShifts.map(s => s.role).filter(Boolean))).join(', '),
                'Medewerkers': Array.from(new Set(projShifts.map(s => s.user.name))).join(', '),
            };
        });

        const projectSheet = XLSX.utils.json_to_sheet(projectSummary);
        projectSheet['!cols'] = [
            { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 12 },
            { wch: 18 }, { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 40 }
        ];

        XLSX.utils.book_append_sheet(workbook, projectSheet, 'Per Project');
    }

    /**
     * Get professional status display text - no emojis for PDF
     */
    private static getStatusDisplayText(status: string): string {
        const statusMap: Record<string, string> = {
            'SCHEDULED': 'Gepland',
            'CONFIRMED': 'Bevestigd',
            'CANCELLED': 'Geannuleerd',
            'COMPLETED': 'Voltooid'
        };
        return statusMap[status] || status;
    }

    /**
     * Get status display text with emojis for Excel
     */
    private static getStatusDisplayTextExcel(status: string): string {
        const statusMap: Record<string, string> = {
            'SCHEDULED': '🕐 Gepland',
            'CONFIRMED': '✅ Bevestigd',
            'CANCELLED': '❌ Geannuleerd',
            'COMPLETED': '🏁 Voltooid'
        };
        return statusMap[status] || status;
    }

    /**
     * Calculate estimated shift cost (placeholder - would be based on employee rates)
     */
    private static calculateShiftCost(shift: ScheduleShift): number {
        const hours = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60);

        // Placeholder rates - in real implementation, get from employee data
        const rateMap: Record<string, number> = {
            'ADMIN': 35,
            'MANAGER': 30,
            'EMPLOYEE': 20,
            'FREELANCER': 25
        };

        const hourlyRate = rateMap[shift.user.role] || 20;
        return hours * hourlyRate;
    }
} 