import jsPDF from 'jspdf';

export interface ContractData {
    // Contract details
    contractType: string;
    title: string;
    description?: string;
    startDate: Date;
    endDate?: Date | null;
    salary?: string;
    notes?: string;

    // Employee details
    employee: {
        name: string;
        email: string;
        address?: string;
        phone?: string;
        employeeType: string;
    };

    // Company details
    company: {
        name: string;
        address: string;
        kvk: string;
        email: string;
        phone: string;
    };
}

export interface PDFOptions {
    logo?: string; // Base64 logo
    template?: 'standard' | 'freelance' | 'temp';
    language?: 'nl' | 'en';
}

export class ContractPDFGenerator {
    private doc: jsPDF;
    private pageHeight: number;
    private pageWidth: number;
    private margin: number = 20;
    private currentY: number = 20;

    constructor() {
        this.doc = new jsPDF();
        this.pageHeight = this.doc.internal.pageSize.height;
        this.pageWidth = this.doc.internal.pageSize.width;
    }

    generateContract(contractData: ContractData, options: PDFOptions = {}): string {
        this.setupDocument();
        this.addHeader(contractData.company, options.logo);
        this.addContractTitle(contractData);
        this.addParties(contractData);
        this.addContractDetails(contractData);
        this.addTermsAndConditions(contractData, options.template);
        this.addSignatureSection();
        this.addFooter();

        return this.doc.output('dataurlstring');
    }

    private setupDocument(): void {
        // Set font
        this.doc.setFont('helvetica');
        this.doc.setFontSize(10);
    }

    private addHeader(company: ContractData['company'], logo?: string): void {
        if (logo) {
            try {
                this.doc.addImage(logo, 'PNG', this.margin, this.currentY, 30, 15);
            } catch (error) {
                console.warn('Could not add logo:', error);
            }
        }

        // Company info
        this.doc.setFontSize(16);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(company.name, this.pageWidth - this.margin, this.currentY, { align: 'right' });

        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        this.currentY += 20;
        this.doc.text(company.address, this.pageWidth - this.margin, this.currentY, { align: 'right' });
        this.currentY += 5;
        this.doc.text(`KvK: ${company.kvk}`, this.pageWidth - this.margin, this.currentY, { align: 'right' });
        this.currentY += 5;
        this.doc.text(company.email, this.pageWidth - this.margin, this.currentY, { align: 'right' });
        this.currentY += 5;
        this.doc.text(company.phone, this.pageWidth - this.margin, this.currentY, { align: 'right' });

        this.currentY += 20;
    }

    private addContractTitle(contractData: ContractData): void {
        this.doc.setFontSize(18);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('ARBEIDSOVEREENKOMST', this.pageWidth / 2, this.currentY, { align: 'center' });

        this.currentY += 15;
        this.doc.setFontSize(12);
        this.doc.text(contractData.title, this.pageWidth / 2, this.currentY, { align: 'center' });

        this.currentY += 20;
    }

    private addParties(contractData: ContractData): void {
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('PARTIJEN', this.margin, this.currentY);

        this.currentY += 15;
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(10);

        // Employer
        this.doc.text('Werkgever:', this.margin, this.currentY);
        this.currentY += 8;
        this.doc.text(contractData.company.name, this.margin + 10, this.currentY);
        this.currentY += 5;
        this.doc.text(`gevestigd te ${contractData.company.address}`, this.margin + 10, this.currentY);
        this.currentY += 5;
        this.doc.text(`KvK nummer: ${contractData.company.kvk}`, this.margin + 10, this.currentY);

        this.currentY += 15;

        // Employee
        this.doc.text('Werknemer:', this.margin, this.currentY);
        this.currentY += 8;
        this.doc.text(contractData.employee.name, this.margin + 10, this.currentY);
        this.currentY += 5;
        this.doc.text(`E-mail: ${contractData.employee.email}`, this.margin + 10, this.currentY);
        if (contractData.employee.address) {
            this.currentY += 5;
            this.doc.text(`Adres: ${contractData.employee.address}`, this.margin + 10, this.currentY);
        }
        if (contractData.employee.phone) {
            this.currentY += 5;
            this.doc.text(`Telefoon: ${contractData.employee.phone}`, this.margin + 10, this.currentY);
        }

        this.currentY += 20;
    }

    private addContractDetails(contractData: ContractData): void {
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('CONTRACT DETAILS', this.margin, this.currentY);

        this.currentY += 15;
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(10);

        // Contract type
        this.doc.text(`Type contract: ${this.getContractTypeText(contractData.contractType)}`, this.margin, this.currentY);
        this.currentY += 8;

        // Start date
        this.doc.text(`Startdatum: ${contractData.startDate.toLocaleDateString('nl-NL')}`, this.margin, this.currentY);
        this.currentY += 8;

        // End date (if applicable)
        if (contractData.endDate) {
            this.doc.text(`Einddatum: ${contractData.endDate.toLocaleDateString('nl-NL')}`, this.margin, this.currentY);
            this.currentY += 8;
        }

        // Salary
        if (contractData.salary) {
            this.doc.text(`Salaris: ${contractData.salary}`, this.margin, this.currentY);
            this.currentY += 8;
        }

        // Description
        if (contractData.description) {
            this.doc.text('Functieomschrijving:', this.margin, this.currentY);
            this.currentY += 8;
            const descLines = this.doc.splitTextToSize(contractData.description, this.pageWidth - 2 * this.margin);
            this.doc.text(descLines, this.margin + 10, this.currentY);
            this.currentY += descLines.length * 5;
        }

        this.currentY += 15;
    }

    private addTermsAndConditions(contractData: ContractData, template?: string): void {
        this.checkPageBreak();

        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('ALGEMENE VOORWAARDEN', this.margin, this.currentY);

        this.currentY += 15;
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(9);

        const terms = this.getTermsAndConditions(contractData.contractType, template);

        terms.forEach((term, index) => {
            this.checkPageBreak();
            this.doc.setFont('helvetica', 'bold');
            this.doc.text(`${index + 1}. ${term.title}`, this.margin, this.currentY);
            this.currentY += 6;

            this.doc.setFont('helvetica', 'normal');
            const contentLines = this.doc.splitTextToSize(term.content, this.pageWidth - 2 * this.margin);
            this.doc.text(contentLines, this.margin + 5, this.currentY);
            this.currentY += contentLines.length * 4 + 5;
        });

        // Notes
        if (contractData.notes) {
            this.checkPageBreak();
            this.doc.setFont('helvetica', 'bold');
            this.doc.text('BIJZONDERE BEPALINGEN', this.margin, this.currentY);
            this.currentY += 8;

            this.doc.setFont('helvetica', 'normal');
            const notesLines = this.doc.splitTextToSize(contractData.notes, this.pageWidth - 2 * this.margin);
            this.doc.text(notesLines, this.margin, this.currentY);
            this.currentY += notesLines.length * 4;
        }

        this.currentY += 20;
    }

    private addSignatureSection(): void {
        this.checkPageBreak(60); // Ensure enough space for signatures

        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('ONDERTEKENING', this.margin, this.currentY);

        this.currentY += 20;
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(10);

        // Date and place
        this.doc.text(`Datum: ${new Date().toLocaleDateString('nl-NL')}`, this.margin, this.currentY);
        this.currentY += 10;
        this.doc.text('Plaats: _________________', this.margin, this.currentY);

        this.currentY += 30;

        // Signature lines
        const signatureY = this.currentY;

        // Employer signature
        this.doc.text('Werkgever:', this.margin, signatureY);
        this.doc.line(this.margin, signatureY + 20, this.margin + 80, signatureY + 20);
        this.doc.text('Handtekening', this.margin, signatureY + 25);

        // Employee signature
        this.doc.text('Werknemer:', this.pageWidth - this.margin - 80, signatureY);
        this.doc.line(this.pageWidth - this.margin - 80, signatureY + 20, this.pageWidth - this.margin, signatureY + 20);
        this.doc.text('Handtekening', this.pageWidth - this.margin - 80, signatureY + 25);

        this.currentY = signatureY + 40;
    }

    private addFooter(): void {
        const pageCount = this.doc.getNumberOfPages();

        for (let i = 1; i <= pageCount; i++) {
            this.doc.setPage(i);
            this.doc.setFontSize(8);
            this.doc.setFont('helvetica', 'normal');
            this.doc.text(
                `Pagina ${i} van ${pageCount}`,
                this.pageWidth / 2,
                this.pageHeight - 10,
                { align: 'center' }
            );
        }
    }

    private checkPageBreak(minSpace: number = 20): void {
        if (this.currentY + minSpace > this.pageHeight - 30) {
            this.doc.addPage();
            this.currentY = this.margin;
        }
    }

    private getContractTypeText(contractType: string): string {
        const types: Record<string, string> = {
            'PERMANENT_FULL_TIME': 'Arbeidsovereenkomst voor onbepaalde tijd (fulltime)',
            'PERMANENT_PART_TIME': 'Arbeidsovereenkomst voor onbepaalde tijd (parttime)',
            'TEMPORARY_FULL_TIME': 'Arbeidsovereenkomst voor bepaalde tijd (fulltime)',
            'TEMPORARY_PART_TIME': 'Arbeidsovereenkomst voor bepaalde tijd (parttime)',
            'FREELANCE': 'Freelance/Opdracht overeenkomst',
            'ZERO_HOURS': 'Nul-urencontract',
            'INTERNSHIP': 'Stageovereenkomst',
            'PROBATION': 'Proeftijd contract'
        };
        return types[contractType] || contractType;
    }

    private getTermsAndConditions(contractType: string, template?: string): Array<{ title: string, content: string }> {
        return [
            {
                title: 'Functie-uitoefening',
                content: 'De werknemer verbindt zich de hem opgedragen werkzaamheden naar beste kunnen uit te voeren en zich te gedragen zoals een goed werknemer betaamt.'
            },
            {
                title: 'Arbeidsplaats',
                content: 'De werknemer zal zijn werkzaamheden verrichten op de door de werkgever aangewezen plaatsen.'
            },
            {
                title: 'Arbeidstijd',
                content: 'De arbeidstijd wordt vastgesteld conform de geldende CAO en bedrijfsregelingen. Overwerk wordt vergoed volgens de geldende bepalingen.'
            },
            {
                title: 'Salaris',
                content: 'Het salaris wordt maandelijks betaald. Het salaris en eventuele toeslagen zijn conform de geldende CAO.'
            },
            {
                title: 'Vakantie',
                content: 'De werknemer heeft recht op vakantie conform de Arbeidstijdenwet en geldende CAO bepalingen.'
            },
            {
                title: 'Vertrouwelijkheid',
                content: 'De werknemer verplicht zich tot geheimhouding van alle vertrouwelijke informatie waarvan hij kennis neemt.'
            },
            {
                title: 'Beëindiging',
                content: 'Deze overeenkomst kan worden beëindigd conform de bepalingen in het BW en geldende CAO.'
            }
        ];
    }
}

// Export convenience function
export function generateContractPDF(contractData: ContractData, options?: PDFOptions): string {
    const generator = new ContractPDFGenerator();
    return generator.generateContract(contractData, options);
} 