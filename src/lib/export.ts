import jsPDF from 'jspdf';
import 'jspdf-autotable';
// @ts-ignore
import XlsxPopulate from 'xlsx-populate';
import html2canvas from 'html2canvas';

// Types for export data
interface ExportData {
    title: string;
    subtitle?: string;
    data: any[];
    metadata?: {
        generated: string;
        user: string;
        filters?: Record<string, any>;
    };
}

interface ReportConfig {
    orientation?: 'portrait' | 'landscape';
    format?: 'a4' | 'letter';
    margins?: { top: number; right: number; bottom: number; left: number };
    includeCharts?: boolean;
    includeMetadata?: boolean;
    customStyles?: any;
}

interface ExcelConfig {
    sheetName?: string;
    includeCharts?: boolean;
    formatting?: {
        headerStyle?: any;
        dataStyle?: any;
    };
}

// PDF Export Functions
export async function exportToPDF(
    data: ExportData,
    config: ReportConfig = {}
): Promise<Blob> {
    const {
        orientation = 'portrait',
        format = 'a4',
        margins = { top: 20, right: 20, bottom: 20, left: 20 },
        includeMetadata = true,
    } = config;

    const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format,
    });

    let yPosition = margins.top;

    // Add header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(data.title, margins.left, yPosition);
    yPosition += 10;

    if (data.subtitle) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'normal');
        pdf.text(data.subtitle, margins.left, yPosition);
        yPosition += 8;
    }

    // Add metadata
    if (includeMetadata && data.metadata) {
        yPosition += 5;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Generated: ${data.metadata.generated}`, margins.left, yPosition);
        yPosition += 5;
        pdf.text(`User: ${data.metadata.user}`, margins.left, yPosition);
        yPosition += 10;
    }

    // Add table
    if (data.data.length > 0) {
        const columns = Object.keys(data.data[0]).map(key => ({
            header: formatColumnHeader(key),
            dataKey: key,
        }));

        (pdf as any).autoTable({
            columns,
            body: data.data,
            startY: yPosition,
            theme: 'grid',
            styles: {
                fontSize: 8,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'bold',
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245],
            },
            margin: margins,
        });
    }

    // Add footer
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(
            `Page ${i} of ${pageCount}`,
            pdf.internal.pageSize.width - margins.right - 20,
            pdf.internal.pageSize.height - margins.bottom + 5
        );
        pdf.text(
            `JobFlow 2025 - ${new Date().toLocaleDateString()}`,
            margins.left,
            pdf.internal.pageSize.height - margins.bottom + 5
        );
    }

    return pdf.output('blob');
}

// Excel Export Functions
export async function exportToExcel(
    data: ExportData,
    config: ExcelConfig = {}
): Promise<Blob> {
    const { sheetName = 'Data', formatting = {} } = config;

    try {
        const workbook = await XlsxPopulate.fromBlankAsync();
        const sheet = workbook.sheet(0);
        sheet.name(sheetName);

        if (data.data.length === 0) {
            throw new Error('No data to export');
        }

        // Get column headers
        const headers = Object.keys(data.data[0]);

        // Add title
        sheet.cell('A1').value(data.title).style({
            bold: true,
            fontSize: 16,
        });

        if (data.subtitle) {
            sheet.cell('A2').value(data.subtitle).style({
                fontSize: 12,
            });
        }

        // Add metadata
        let currentRow = data.subtitle ? 4 : 3;
        if (data.metadata) {
            sheet.cell(`A${currentRow}`).value(`Generated: ${data.metadata.generated}`);
            sheet.cell(`A${currentRow + 1}`).value(`User: ${data.metadata.user}`);
            currentRow += 3;
        }

        // Add headers
        headers.forEach((header, index) => {
            const cellRef = sheet.cell(currentRow, index + 1);
            cellRef.value(formatColumnHeader(header));
            cellRef.style({
                bold: true,
                fill: 'E3F2FD',
                border: true,
                ...formatting.headerStyle,
            });
        });

        // Add data
        data.data.forEach((row, rowIndex) => {
            headers.forEach((header, colIndex) => {
                const cellRef = sheet.cell(currentRow + rowIndex + 1, colIndex + 1);
                cellRef.value(row[header]);
                if (rowIndex % 2 === 1) {
                    cellRef.style({
                        fill: 'F5F5F5',
                        border: true,
                        ...formatting.dataStyle,
                    });
                } else {
                    cellRef.style({
                        border: true,
                        ...formatting.dataStyle,
                    });
                }
            });
        });

        // Auto-fit columns
        headers.forEach((_, index) => {
            sheet.column(index + 1).width(15);
        });

        return workbook.outputAsync('blob');
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        throw new Error('Failed to generate Excel file');
    }
}

// Chart Export Functions
export async function exportChartToPNG(elementId: string): Promise<Blob> {
    const element = document.getElementById(elementId);
    if (!element) {
        throw new Error(`Element with id "${elementId}" not found`);
    }

    const canvas = await html2canvas(element, {
        backgroundColor: 'white',
        scale: 2,
        useCORS: true,
    });

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob!);
        }, 'image/png');
    });
}

// Schedule Export Functions
export async function exportScheduleToPDF(
    scheduleData: any[],
    dateRange: { start: string; end: string },
    filters?: any
): Promise<Blob> {
    const exportData: ExportData = {
        title: 'Schedule Report',
        subtitle: `${dateRange.start} - ${dateRange.end}`,
        data: scheduleData.map(shift => ({
            Date: new Date(shift.startTime).toLocaleDateString(),
            'Start Time': new Date(shift.startTime).toLocaleTimeString(),
            'End Time': new Date(shift.endTime).toLocaleTimeString(),
            Employee: shift.user?.name || 'N/A',
            Project: shift.project?.name || 'General',
            Role: shift.role || 'N/A',
            Status: shift.status,
            Notes: shift.notes || '',
        })),
        metadata: {
            generated: new Date().toLocaleString(),
            user: 'Current User',
            filters,
        },
    };

    return exportToPDF(exportData, {
        orientation: 'landscape',
        includeMetadata: true,
    });
}

// Time Tracking Export Functions
export async function exportTimeTrackingToExcel(
    timeEntries: any[],
    dateRange: { start: string; end: string }
): Promise<Blob> {
    const exportData: ExportData = {
        title: 'Time Tracking Report',
        subtitle: `Period: ${dateRange.start} - ${dateRange.end}`,
        data: timeEntries.map(entry => {
            const duration = entry.endTime
                ? (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60 * 60)
                : 0;

            return {
                Date: new Date(entry.startTime).toLocaleDateString(),
                Employee: entry.user?.name || 'N/A',
                Project: entry.project?.name || 'General',
                'Start Time': new Date(entry.startTime).toLocaleTimeString(),
                'End Time': entry.endTime ? new Date(entry.endTime).toLocaleTimeString() : 'In Progress',
                'Duration (hours)': Math.round(duration * 100) / 100,
                Description: entry.description || '',
                Status: entry.status || 'COMPLETED',
            };
        }),
        metadata: {
            generated: new Date().toLocaleString(),
            user: 'Current User',
        },
    };

    return exportToExcel(exportData, {
        sheetName: 'Time Tracking',
        formatting: {
            headerStyle: {
                fill: '2E7D32',
                fontColor: 'FFFFFF',
            },
        },
    });
}

// Personnel Export Functions
export async function exportPersonnelToPDF(
    personnel: any[],
    includeDetails: boolean = false
): Promise<Blob> {
    const exportData: ExportData = {
        title: 'Personnel Directory',
        subtitle: `${personnel.length} employees`,
        data: personnel.map(person => {
            const baseData = {
                Name: person.name,
                Email: person.email,
                Role: person.role,
                Company: person.company,
                Status: person.status,
                'Employee Type': person.employeeType,
            };

            if (includeDetails) {
                return {
                    ...baseData,
                    Phone: person.phone || 'N/A',
                    Address: person.address || 'N/A',
                    'Hourly Rate': person.hourlyRate || 'N/A',
                    'KVK Number': person.kvkNumber || 'N/A',
                    'BTW Number': person.btwNumber || 'N/A',
                    'Has Contract': person.hasContract ? 'Yes' : 'No',
                };
            }

            return baseData;
        }),
        metadata: {
            generated: new Date().toLocaleString(),
            user: 'Current User',
        },
    };

    return exportToPDF(exportData, {
        orientation: 'landscape',
        includeMetadata: true,
    });
}

// Analytics Export Functions
export async function exportAnalyticsReport(
    analyticsData: any,
    chartElementId?: string
): Promise<Blob> {
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    let yPosition = 20;

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Analytics Report', 20, yPosition);
    yPosition += 15;

    // Summary statistics
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Key Metrics', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    Object.entries(analyticsData.summary || {}).forEach(([key, value]) => {
        pdf.text(`${formatColumnHeader(key)}: ${value}`, 20, yPosition);
        yPosition += 6;
    });

    // Add chart if provided
    if (chartElementId) {
        try {
            const chartBlob = await exportChartToPNG(chartElementId);
            const chartUrl = URL.createObjectURL(chartBlob);
            const img = new Image();

            await new Promise((resolve) => {
                img.onload = resolve;
                img.src = chartUrl;
            });

            yPosition += 10;
            const imgWidth = 170;
            const imgHeight = (img.height * imgWidth) / img.width;

            if (yPosition + imgHeight > 280) {
                pdf.addPage();
                yPosition = 20;
            }

            pdf.addImage(img, 'PNG', 20, yPosition, imgWidth, imgHeight);
            URL.revokeObjectURL(chartUrl);
        } catch (error) {
            console.error('Error adding chart to PDF:', error);
        }
    }

    // Add footer
    pdf.setFontSize(8);
    pdf.text(
        `Generated on ${new Date().toLocaleString()}`,
        20,
        pdf.internal.pageSize.height - 10
    );

    return pdf.output('blob');
}

// Utility Functions
function formatColumnHeader(header: string): string {
    return header
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

export function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Batch Export Functions
export async function exportMultipleReports(
    reports: Array<{
        name: string;
        type: 'pdf' | 'excel';
        data: ExportData;
        config?: ReportConfig | ExcelConfig;
    }>
): Promise<Blob> {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    for (const report of reports) {
        try {
            let blob: Blob;

            if (report.type === 'pdf') {
                blob = await exportToPDF(report.data, report.config as ReportConfig);
                zip.file(`${report.name}.pdf`, blob);
            } else {
                blob = await exportToExcel(report.data, report.config as ExcelConfig);
                zip.file(`${report.name}.xlsx`, blob);
            }
        } catch (error) {
            console.error(`Error exporting ${report.name}:`, error);
        }
    }

    return zip.generateAsync({ type: 'blob' });
}

// Email Export Functions
export async function emailReport(
    reportBlob: Blob,
    recipient: string,
    subject: string,
    message: string
): Promise<void> {
    // Convert blob to base64
    const reader = new FileReader();
    const base64Data = await new Promise<string>((resolve) => {
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); // Remove data:type;base64, prefix
        };
        reader.readAsDataURL(reportBlob);
    });

    // Send email via API
    const response = await fetch('/api/reports/email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            recipient,
            subject,
            message,
            attachment: {
                filename: `report_${new Date().toISOString().split('T')[0]}.pdf`,
                data: base64Data,
                contentType: 'application/pdf',
            },
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to send email');
    }
}

// Auto-scheduled Reports
export function scheduleAutomaticReports(
    reportConfig: {
        frequency: 'daily' | 'weekly' | 'monthly';
        reports: string[];
        recipients: string[];
    }
) {
    // This would be implemented with a background job system
    console.log('Scheduling automatic reports:', reportConfig);

    // In a real implementation, this would:
    // 1. Store the schedule in the database
    // 2. Set up a cron job or use a job queue
    // 3. Generate and send reports automatically
} 