import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

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
    breaks?: any[];
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
}

export class ExportUtils {
    /**
     * Export schedule to PDF with professional formatting
     */
    static async exportScheduleToPDF(
        shifts: ScheduleShift[],
        date: string,
        options: ExportOptions = {}
    ): Promise<void> {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        // Company branding
        const companyName = options.companyName || 'JobFlow Solutions';
        const title = options.title || `Rooster ${format(new Date(date), 'dd MMMM yyyy', { locale: nl })}`;

        // Header
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(companyName, pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(16);
        doc.setFont('helvetica', 'normal');
        doc.text(title, pageWidth / 2, 30, { align: 'center' });

        // Date and time generated
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text(
            `Gegenereerd op: ${format(new Date(), 'dd-MM-yyyy HH:mm', { locale: nl })}`,
            pageWidth - 15,
            15,
            { align: 'right' }
        );

        // Reset color
        doc.setTextColor(0, 0, 0);

        // Summary statistics
        const totalShifts = shifts.length;
        const totalHours = shifts.reduce((total, shift) => {
            const start = new Date(shift.startTime);
            const end = new Date(shift.endTime);
            return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }, 0);

        const uniqueEmployees = new Set(shifts.map(s => s.user.id)).size;
        const uniqueProjects = new Set(shifts.map(s => s.project?.id).filter(Boolean)).size;

        // Summary box
        doc.setFillColor(240, 248, 255);
        doc.rect(15, 40, pageWidth - 30, 25, 'F');
        doc.setDrawColor(59, 130, 246);
        doc.rect(15, 40, pageWidth - 30, 25);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('📊 Samenvatting:', 20, 50);

        doc.setFont('helvetica', 'normal');
        const summaryY = 55;
        doc.text(`Totaal diensten: ${totalShifts}`, 20, summaryY);
        doc.text(`Totaal uren: ${totalHours.toFixed(1)}h`, 80, summaryY);
        doc.text(`Medewerkers: ${uniqueEmployees}`, 140, summaryY);
        doc.text(`Projecten: ${uniqueProjects}`, 180, summaryY);

        // Prepare table data
        const tableData = shifts.map(shift => {
            const startTime = format(new Date(shift.startTime), 'HH:mm');
            const endTime = format(new Date(shift.endTime), 'HH:mm');
            const duration = ((new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60)).toFixed(1);

            const row = [
                shift.user.name,
                `${startTime} - ${endTime}`,
                `${duration}h`,
                shift.role || '-',
                shift.project?.name || '-',
                shift.project?.company || '-',
                this.getStatusText(shift.status)
            ];

            if (options.includeBreaks && shift.breaks?.length) {
                const totalBreaks = shift.breaks.reduce((total, breakItem) =>
                    total + (breakItem.duration || 30), 0
                );
                row.push(`${totalBreaks} min`);
            }

            if (options.includeNotes) {
                row.push(shift.notes || '-');
            }

            return row;
        });

        // Table headers
        const headers = [
            'Medewerker',
            'Tijd',
            'Duur',
            'Rol',
            'Project',
            'Bedrijf',
            'Status'
        ];

        if (options.includeBreaks) {
            headers.push('Pauzes');
        }

        if (options.includeNotes) {
            headers.push('Notities');
        }

        // Generate table
        autoTable(doc, {
            head: [headers],
            body: tableData,
            startY: 75,
            styles: {
                fontSize: 9,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: 255,
                fontStyle: 'bold',
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252],
            },
            columnStyles: {
                0: { cellWidth: 35 }, // Medewerker
                1: { cellWidth: 30 }, // Tijd
                2: { cellWidth: 20 }, // Duur
                3: { cellWidth: 25 }, // Rol
                4: { cellWidth: 30 }, // Project
                5: { cellWidth: 30 }, // Bedrijf
                6: { cellWidth: 20 }, // Status
            },
            didDrawPage: (data) => {
                // Footer
                doc.setFontSize(8);
                doc.setTextColor(128, 128, 128);
                doc.text(
                    `Pagina ${data.pageNumber}`,
                    pageWidth / 2,
                    pageHeight - 10,
                    { align: 'center' }
                );
                doc.text(
                    'JobFlow - Rooster Management Systeem',
                    pageWidth - 15,
                    pageHeight - 10,
                    { align: 'right' }
                );
            }
        });

        // Save the PDF
        const fileName = `rooster-${format(new Date(date), 'dd-MM-yyyy')}.pdf`;
        doc.save(fileName);
    }

    /**
     * Export schedule to Excel with multiple sheets
     */
    static exportScheduleToExcel(
        shifts: ScheduleShift[],
        date: string,
        options: ExportOptions = {}
    ): void {
        const workbook = XLSX.utils.book_new();

        // Main schedule sheet
        const scheduleData = shifts.map(shift => ({
            'Medewerker': shift.user.name,
            'Email': shift.user.email,
            'Rol Medewerker': shift.user.role,
            'Starttijd': format(new Date(shift.startTime), 'HH:mm'),
            'Eindtijd': format(new Date(shift.endTime), 'HH:mm'),
            'Datum': format(new Date(shift.startTime), 'dd-MM-yyyy'),
            'Totaal Uren': ((new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60)).toFixed(1),
            'Werkrol': shift.role || '',
            'Project': shift.project?.name || '',
            'Bedrijf': shift.project?.company || '',
            'Status': this.getStatusText(shift.status),
            'Notities': shift.notes || '',
            'Pauzes (min)': shift.breaks?.reduce((total, breakItem) =>
                total + (breakItem.duration || 30), 0
            ) || 0,
        }));

        const scheduleSheet = XLSX.utils.json_to_sheet(scheduleData);

        // Auto-width columns
        const scheduleColWidths = [
            { wch: 20 }, // Medewerker
            { wch: 25 }, // Email
            { wch: 15 }, // Rol Medewerker
            { wch: 10 }, // Starttijd
            { wch: 10 }, // Eindtijd
            { wch: 12 }, // Datum
            { wch: 12 }, // Totaal Uren
            { wch: 20 }, // Werkrol
            { wch: 25 }, // Project
            { wch: 20 }, // Bedrijf
            { wch: 12 }, // Status
            { wch: 30 }, // Notities
            { wch: 12 }, // Pauzes
        ];
        scheduleSheet['!cols'] = scheduleColWidths;

        XLSX.utils.book_append_sheet(workbook, scheduleSheet, 'Rooster');

        // Summary sheet
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
                    breakTotal + (breakItem.duration || 30), 0
                ) || 0);
            }, 0);

            return {
                'Medewerker': employee,
                'Aantal Diensten': employeeShifts.length,
                'Totaal Uren': totalHours.toFixed(1),
                'Totaal Pauzes (min)': totalBreaks,
                'Gemiddelde Uren per Dienst': (totalHours / employeeShifts.length).toFixed(1),
                'Status Verdeling': employeeShifts.map(s => this.getStatusText(s.status)).join(', '),
            };
        });

        const summarySheet = XLSX.utils.json_to_sheet(employeeSummary);
        summarySheet['!cols'] = [
            { wch: 20 }, // Medewerker
            { wch: 15 }, // Aantal Diensten
            { wch: 12 }, // Totaal Uren
            { wch: 18 }, // Totaal Pauzes
            { wch: 20 }, // Gemiddelde Uren
            { wch: 30 }, // Status Verdeling
        ];

        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Samenvatting');

        // Project breakdown sheet if projects exist
        const projectShifts = shifts.filter(s => s.project);
        if (projectShifts.length > 0) {
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
                    'Bedrijf': projShifts[0].project!.company,
                    'Aantal Diensten': projShifts.length,
                    'Totaal Uren': totalHours.toFixed(1),
                    'Medewerkers': Array.from(new Set(projShifts.map(s => s.user.name))).join(', '),
                    'Gemiddelde Uren per Dienst': (totalHours / projShifts.length).toFixed(1),
                };
            });

            const projectSheet = XLSX.utils.json_to_sheet(projectSummary);
            projectSheet['!cols'] = [
                { wch: 25 }, // Project
                { wch: 20 }, // Bedrijf
                { wch: 15 }, // Aantal Diensten
                { wch: 12 }, // Totaal Uren
                { wch: 40 }, // Medewerkers
                { wch: 20 }, // Gemiddelde Uren
            ];

            XLSX.utils.book_append_sheet(workbook, projectSheet, 'Per Project');
        }

        // Save the Excel file
        const fileName = `rooster-${format(new Date(date), 'dd-MM-yyyy')}.xlsx`;
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, fileName);
    }

    /**
     * Export trend analysis data to Excel
     */
    static exportTrendAnalysisToExcel(
        trendData: any[],
        dateRange: { start: string; end: string }
    ): void {
        const workbook = XLSX.utils.book_new();

        // Trends sheet
        const trendsSheet = XLSX.utils.json_to_sheet(trendData);
        XLSX.utils.book_append_sheet(workbook, trendsSheet, 'Trends');

        const fileName = `trend-analyse-${format(new Date(dateRange.start), 'dd-MM')}-tot-${format(new Date(dateRange.end), 'dd-MM-yyyy')}.xlsx`;
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, fileName);
    }

    /**
     * Utility function to get status text in Dutch
     */
    private static getStatusText(status: string): string {
        const statusMap: Record<string, string> = {
            'SCHEDULED': 'Gepland',
            'CONFIRMED': 'Bevestigd',
            'CANCELLED': 'Geannuleerd',
            'COMPLETED': 'Voltooid'
        };
        return statusMap[status] || status;
    }
}

export default ExportUtils; 