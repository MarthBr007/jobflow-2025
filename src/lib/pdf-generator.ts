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
        firstName?: string;
        lastName?: string;
        zipCode?: string;
        city?: string;
        iban?: string;
        kvkNumber?: string;
        btwNumber?: string;
    };

    // Company details
    company: {
        name: string;
        address: string;
        kvk: string;
        email: string;
        phone: string;
        website?: string;
        logoBase64?: string;
    };
}

export interface PDFOptions {
    logo?: string; // Base64 logo
    template?: 'standard' | 'freelance' | 'temp' | 'zero_hours';
    language?: 'nl' | 'en';
    theme?: 'blue' | 'professional' | 'modern';
}

export class ContractPDFGenerator {
    private doc: jsPDF;
    private pageHeight: number;
    private pageWidth: number;
    private margin: number = 25;
    private currentY: number = 25;
    private theme: string = 'blue';
    private primaryColor: [number, number, number] = [41, 98, 255]; // Blue
    private secondaryColor: [number, number, number] = [248, 250, 252]; // Light blue/gray
    private textColor: [number, number, number] = [31, 41, 55]; // Dark gray

    constructor(options: PDFOptions = {}) {
        this.doc = new jsPDF();
        this.pageHeight = this.doc.internal.pageSize.height;
        this.pageWidth = this.doc.internal.pageSize.width;
        this.theme = options.theme || 'blue';
        this.setThemeColors();
    }

    private setThemeColors(): void {
        switch (this.theme) {
            case 'professional':
                this.primaryColor = [17, 24, 39]; // Dark gray
                this.secondaryColor = [243, 244, 246]; // Light gray
                break;
            case 'modern':
                this.primaryColor = [79, 70, 229]; // Indigo
                this.secondaryColor = [238, 242, 255]; // Light indigo
                break;
            default: // blue
                this.primaryColor = [41, 98, 255];
                this.secondaryColor = [248, 250, 252];
        }
    }

    generateContract(contractData: ContractData, options: PDFOptions = {}): string {
        this.setupDocument();
        this.addBrandedHeader(contractData.company, options.logo);
        this.addContractTitle(contractData);
        this.addParties(contractData);
        this.addContractDetails(contractData);
        this.addTermsAndConditions(contractData, options.template);
        this.addSignatureSection();
        this.addBrandedFooter(contractData.company);

        return this.doc.output('dataurlstring');
    }

    private setupDocument(): void {
        // Set font
        this.doc.setFont('helvetica');
        this.doc.setFontSize(10);
        this.doc.setTextColor(...this.textColor);
    }

    private addBrandedHeader(company: any, logo?: string): void {
        // Header background
        this.doc.setFillColor(...this.primaryColor);
        this.doc.rect(0, 0, this.pageWidth, 60, 'F');

        // Logo (if provided)
        if (logo || company.logoBase64) {
            try {
                const logoData = logo || company.logoBase64;
                this.doc.addImage(logoData, 'PNG', this.margin, 15, 30, 30);
            } catch (error) {
                console.warn('Could not add logo to PDF:', error);
            }
        }

        // Company name and details in white
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(20);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(company.name, logo ? this.margin + 40 : this.margin, 25);

        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(company.address, logo ? this.margin + 40 : this.margin, 35);
        this.doc.text(`KvK: ${company.kvk} | ${company.email} | ${company.phone}`, logo ? this.margin + 40 : this.margin, 42);
        if (company.website) {
            this.doc.text(company.website, logo ? this.margin + 40 : this.margin, 49);
        }

        // Contract metadata in top right corner
        this.doc.setFontSize(9);
        const rightX = this.pageWidth - this.margin;
        this.doc.text('Contract gegenereerd op:', rightX, 25, { align: 'right' });
        this.doc.text(new Date().toLocaleDateString('nl-NL'), rightX, 32, { align: 'right' });
        this.doc.text('Document ID:', rightX, 39, { align: 'right' });
        this.doc.text(`BROERS-${Date.now().toString().slice(-6)}`, rightX, 46, { align: 'right' });

        this.currentY = 80;
        this.doc.setTextColor(...this.textColor);
    }

    private addContractTitle(contractData: ContractData): void {
        // Title background section
        this.doc.setFillColor(...this.secondaryColor);
        this.doc.rect(0, this.currentY - 5, this.pageWidth, 35, 'F');

        this.doc.setFontSize(24);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(...this.primaryColor);
        this.doc.text('ARBEIDSOVEREENKOMST', this.pageWidth / 2, this.currentY + 10, { align: 'center' });

        this.currentY += 20;
        this.doc.setFontSize(14);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(...this.textColor);
        this.doc.text(contractData.title, this.pageWidth / 2, this.currentY + 5, { align: 'center' });

        this.currentY += 35;
    }

    private addParties(contractData: ContractData): void {
        this.addSectionHeader('CONTRACTPARTIJEN');

        // Two column layout for parties
        const leftColumnX = this.margin;
        const rightColumnX = this.pageWidth / 2 + 10;
        const startY = this.currentY;

        // Left column - Company
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(12);
        this.doc.setTextColor(...this.primaryColor);
        this.doc.text('WERKGEVER', leftColumnX, startY);

        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(10);
        this.doc.setTextColor(...this.textColor);
        this.doc.text(contractData.company.name, leftColumnX, startY + 10);
        this.doc.text(contractData.company.address, leftColumnX, startY + 18);
        this.doc.text(`KvK nummer: ${contractData.company.kvk}`, leftColumnX, startY + 26);
        this.doc.text(`Email: ${contractData.company.email}`, leftColumnX, startY + 34);
        this.doc.text(`Telefoon: ${contractData.company.phone}`, leftColumnX, startY + 42);

        // Right column - Employee
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(12);
        this.doc.setTextColor(...this.primaryColor);
        this.doc.text('WERKNEMER', rightColumnX, startY);

        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(10);
        this.doc.setTextColor(...this.textColor);
        this.doc.text(contractData.employee.name, rightColumnX, startY + 10);
        if (contractData.employee.address) {
            this.doc.text(contractData.employee.address, rightColumnX, startY + 18);
        }
        if (contractData.employee.zipCode && contractData.employee.city) {
            this.doc.text(`${contractData.employee.zipCode} ${contractData.employee.city}`, rightColumnX, startY + 26);
        }
        this.doc.text(`Email: ${contractData.employee.email}`, rightColumnX, startY + 34);
        if (contractData.employee.phone) {
            this.doc.text(`Telefoon: ${contractData.employee.phone}`, rightColumnX, startY + 42);
        }

        this.currentY = startY + 60;
    }

    private addContractDetails(contractData: ContractData): void {
        this.addSectionHeader('CONTRACT DETAILS');

        // Contract details in a structured format
        const details = [
            { label: 'Type contract', value: this.getContractTypeText(contractData.contractType) },
            { label: 'Startdatum', value: contractData.startDate.toLocaleDateString('nl-NL') },
        ];

        if (contractData.endDate) {
            details.push({ label: 'Einddatum', value: contractData.endDate.toLocaleDateString('nl-NL') });
        }

        if (contractData.salary) {
            details.push({ label: 'Beloning', value: contractData.salary });
        }

        // Display details in two columns
        details.forEach((detail, index) => {
            const isLeftColumn = index % 2 === 0;
            const x = isLeftColumn ? this.margin : this.pageWidth / 2 + 10;
            const y = this.currentY + Math.floor(index / 2) * 12;

            this.doc.setFont('helvetica', 'bold');
            this.doc.setFontSize(10);
            this.doc.setTextColor(...this.primaryColor);
            this.doc.text(`${detail.label}:`, x, y);

            this.doc.setFont('helvetica', 'normal');
            this.doc.setTextColor(...this.textColor);
            this.doc.text(detail.value, x + 40, y);
        });

        this.currentY += Math.ceil(details.length / 2) * 12 + 10;

        // Description (if provided)
        if (contractData.description) {
            this.doc.setFont('helvetica', 'bold');
            this.doc.setFontSize(10);
            this.doc.setTextColor(...this.primaryColor);
            this.doc.text('Functieomschrijving:', this.margin, this.currentY);
            this.currentY += 8;

            this.doc.setFont('helvetica', 'normal');
            this.doc.setTextColor(...this.textColor);
            const descLines = this.doc.splitTextToSize(contractData.description, this.pageWidth - 2 * this.margin);
            this.doc.text(descLines, this.margin, this.currentY);
            this.currentY += descLines.length * 5 + 10;
        }
    }

    private addTermsAndConditions(contractData: ContractData, template?: string): void {
        this.checkPageBreak(60);
        this.addSectionHeader('ALGEMENE VOORWAARDEN');

        const terms = this.getEnhancedTermsAndConditions(contractData.contractType, template);

        terms.forEach((term, index) => {
            this.checkPageBreak(40);

            // Term header with number badge
            this.doc.setFillColor(...this.primaryColor);
            this.doc.circle(this.margin + 5, this.currentY, 5, 'F');

            this.doc.setTextColor(255, 255, 255);
            this.doc.setFont('helvetica', 'bold');
            this.doc.setFontSize(9);
            this.doc.text((index + 1).toString(), this.margin + 5, this.currentY + 1, { align: 'center' });

            this.doc.setTextColor(...this.primaryColor);
            this.doc.setFont('helvetica', 'bold');
            this.doc.setFontSize(11);
            this.doc.text(term.title, this.margin + 15, this.currentY + 2);
            this.currentY += 10;

            this.doc.setFont('helvetica', 'normal');
            this.doc.setFontSize(9);
            this.doc.setTextColor(...this.textColor);
            const contentLines = this.doc.splitTextToSize(term.content, this.pageWidth - 2 * this.margin - 10);
            this.doc.text(contentLines, this.margin + 10, this.currentY);
            this.currentY += contentLines.length * 4 + 8;
        });

        // Special provisions (notes)
        if (contractData.notes) {
            this.checkPageBreak(40);
            this.addSectionHeader('BIJZONDERE BEPALINGEN');

            this.doc.setFont('helvetica', 'normal');
            this.doc.setFontSize(9);
            this.doc.setTextColor(...this.textColor);
            const notesLines = this.doc.splitTextToSize(contractData.notes, this.pageWidth - 2 * this.margin);
            this.doc.text(notesLines, this.margin, this.currentY);
            this.currentY += notesLines.length * 4 + 15;
        }
    }

    private addSignatureSection(): void {
        this.checkPageBreak(100);
        this.addSectionHeader('ONDERTEKENING');

        // Signature date
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(10);
        this.doc.setTextColor(...this.textColor);
        this.doc.text(`Plaats en datum: ________________________________, ${new Date().toLocaleDateString('nl-NL')}`, this.margin, this.currentY);
        this.currentY += 25;

        // Signature boxes
        const leftX = this.margin;
        const rightX = this.pageWidth / 2 + 10;

        // Company signature
        this.doc.setDrawColor(...this.primaryColor);
        this.doc.setLineWidth(0.5);
        this.doc.rect(leftX, this.currentY, 80, 40);

        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(10);
        this.doc.setTextColor(...this.primaryColor);
        this.doc.text('WERKGEVER', leftX + 2, this.currentY - 3);

        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(9);
        this.doc.setTextColor(...this.textColor);
        this.doc.text('Handtekening:', leftX + 2, this.currentY + 8);
        this.doc.text('Naam:', leftX + 2, this.currentY + 25);
        this.doc.text('Functie:', leftX + 2, this.currentY + 35);

        // Employee signature
        this.doc.rect(rightX, this.currentY, 80, 40);

        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(10);
        this.doc.setTextColor(...this.primaryColor);
        this.doc.text('WERKNEMER', rightX + 2, this.currentY - 3);

        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(9);
        this.doc.setTextColor(...this.textColor);
        this.doc.text('Handtekening:', rightX + 2, this.currentY + 8);
        this.doc.text('Naam:', rightX + 2, this.currentY + 25);
        this.doc.text('Datum:', rightX + 2, this.currentY + 35);

        this.currentY += 50;
    }

    private addBrandedFooter(company: any): void {
        const pageCount = this.doc.getNumberOfPages();

        for (let i = 1; i <= pageCount; i++) {
            this.doc.setPage(i);

            // Footer background
            this.doc.setFillColor(...this.secondaryColor);
            this.doc.rect(0, this.pageHeight - 25, this.pageWidth, 25, 'F');

            // Footer content
            this.doc.setFontSize(8);
            this.doc.setFont('helvetica', 'normal');
            this.doc.setTextColor(...this.textColor);

            // Left side - company info
            this.doc.text(`${company.name} | KvK: ${company.kvk}`, this.margin, this.pageHeight - 15);
            this.doc.text(`${company.email} | ${company.phone}`, this.margin, this.pageHeight - 8);

            // Center - confidentiality notice
            this.doc.text('🔒 Vertrouwelijk document', this.pageWidth / 2, this.pageHeight - 12, { align: 'center' });

            // Right side - page number
            this.doc.text(`Pagina ${i} van ${pageCount}`, this.pageWidth - this.margin, this.pageHeight - 12, { align: 'right' });
        }
    }

    private addSectionHeader(title: string): void {
        this.doc.setFillColor(...this.secondaryColor);
        this.doc.rect(this.margin - 5, this.currentY - 5, this.pageWidth - 2 * this.margin + 10, 15, 'F');

        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(12);
        this.doc.setTextColor(...this.primaryColor);
        this.doc.text(title, this.margin, this.currentY + 5);
        this.currentY += 20;
    }

    private checkPageBreak(requiredSpace: number = 50): void {
        if (this.currentY + requiredSpace > this.pageHeight - 40) {
            this.doc.addPage();
            this.currentY = 30;
        }
    }

    private getContractTypeText(contractType: string): string {
        const types: Record<string, string> = {
            'PERMANENT_FULL_TIME': '🏢 Vast contract voltijd',
            'PERMANENT_PART_TIME': '🏢 Vast contract deeltijd',
            'TEMPORARY_FULL_TIME': '⏰ Tijdelijk contract voltijd',
            'TEMPORARY_PART_TIME': '⏰ Tijdelijk contract deeltijd',
            'FREELANCE': '💼 Freelance overeenkomst',
            'ZERO_HOURS': '📞 0-urencontract',
            'INTERNSHIP': '🎓 Stage overeenkomst',
            'PROBATION': '🔍 Proeftijd contract',
        };
        return types[contractType] || contractType;
    }

    private getEnhancedTermsAndConditions(contractType: string, template?: string): Array<{ title: string, content: string }> {
        const baseTerms = [
            {
                title: 'Functie-uitoefening en professionaliteit',
                content: 'De werknemer verbindt zich de hem opgedragen werkzaamheden naar beste kunnen uit te voeren en zich te gedragen zoals een goed werknemer betaamt. Dit omvat het naleven van bedrijfsreglementen, het respecteren van collega\'s en het professioneel vertegenwoordigen van de werkgever.'
            },
            {
                title: 'Arbeidsplaats en flexibiliteit',
                content: 'De werknemer zal zijn werkzaamheden verrichten op de door de werkgever aangewezen plaatsen. In overleg kan thuiswerken worden toegestaan conform het bedrijfsbeleid. Bij wijziging van de arbeidsplaats wordt rekening gehouden met redelijke reisafstand.'
            },
            {
                title: 'Arbeidstijd en roosters',
                content: 'De arbeidstijd wordt vastgesteld conform de geldende CAO en bedrijfsregelingen. Overwerk wordt vergoed volgens de geldende bepalingen. Flexibele werktijden kunnen in overleg worden afgesproken, mits dit niet ten koste gaat van de bedrijfsvoering.'
            },
            {
                title: 'Beloning en secundaire arbeidsvoorwaarden',
                content: 'Het salaris wordt maandelijks voor de laatste werkdag betaald. Het salaris en eventuele toeslagen zijn conform de geldende CAO. Secundaire arbeidsvoorwaarden zoals pensioenaanspraken, ziektekosten en vakantiegeld worden toegekend conform wettelijke bepalingen.'
            },
            {
                title: 'Vakantie en verlof',
                content: 'De werknemer heeft recht op vakantie conform de Arbeidstijdenwet en geldende CAO bepalingen. Vakantie dient tijdig te worden aangevraagd en wordt toegekend in overleg met de leidinggevende. Niet opgenomen vakantiedagen vervallen conform wettelijke bepalingen.'
            },
            {
                title: 'Vertrouwelijkheid en geheimhouding',
                content: 'De werknemer verplicht zich tot geheimhouding van alle vertrouwelijke informatie waarvan hij kennis neemt tijdens het dienstverband. Deze verplichting blijft ook na beëindiging van het dienstverband van kracht. Schending van deze verplichting kan leiden tot schadevergoeding.'
            },
            {
                title: 'Ontwikkeling en training',
                content: 'De werkgever bevordert de ontwikkeling van de werknemer door middel van training en scholing. Kosten hiervan worden gedragen door de werkgever, tenzij anders overeengekomen. Bij externe opleidingen kan een terugbetalingsregeling van toepassing zijn.'
            },
            {
                title: 'Ziekte en arbeidsongeschiktheid',
                content: 'Bij ziekte dient de werknemer zich te houden aan de bedrijfsregels betreffende ziekmelding. Gedurende ziekte heeft de werknemer recht op loondoorbetaling conform de Ziektewet en eventuele bovenwettelijke regelingen in de CAO.'
            },
            {
                title: 'Beëindiging en opzegtermijnen',
                content: 'Deze overeenkomst kan worden beëindigd conform de bepalingen in het BW en geldende CAO. De opzegtermijnen zijn afhankelijk van de duur van het dienstverband. Bij ontslag om dringende redenen gelden bijzondere bepalingen.'
            },
            {
                title: 'Toepasselijk recht en geschillen',
                content: 'Op deze arbeidsovereenkomst is Nederlands recht van toepassing. Geschillen zullen in eerste instantie worden besproken tussen partijen. Indien geen oplossing wordt gevonden, zijn de geschillen onderworpen aan de bevoegde rechter in Nederland.'
            }
        ];

        // Add specific terms based on contract type
        if (contractType === 'FREELANCE') {
            baseTerms.push({
                title: 'DBA-compliance en zelfstandigheid',
                content: 'Deze overeenkomst is opgezet conform de Wet Deregulering Beoordeling Arbeidsrelaties (DBA). De opdrachtnemer handelt als zelfstandige ondernemerr, draagt eigen risico en heeft volledige autonomie in de uitvoering van werkzaamheden.'
            });
        }

        if (contractType === 'ZERO_HOURS') {
            baseTerms.push({
                title: 'Oproepverplichtingen en flexibiliteit',
                content: 'Er bestaat geen wederzijdse verplichting tot het aanbieden respectievelijk aannemen van werk. Oproepen gebeuren met een redelijke termijn. De werknemer kan oproepen weigeren zonder gevolgen voor toekomstige oproepen.'
            });
        }

        return baseTerms;
    }
}

// Export convenience function
export function generateContractPDF(contractData: ContractData, options?: PDFOptions): string {
    const generator = new ContractPDFGenerator(options);
    return generator.generateContract(contractData, options);
} 