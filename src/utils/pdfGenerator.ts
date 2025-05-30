import jsPDF from 'jspdf';

export interface ContractData {
    contractNumber: string;
    generatedAt: string;

    // Parties
    companyName: string;
    employeeName: string;
    employeeAddress: string;
    employeeEmail: string;
    employeeBirthDate?: string;

    // Contract specifics
    contractType: 'FREELANCE' | 'EMPLOYMENT' | 'ON_CALL';
    startDate: string;
    endDate?: string;

    // Employment specific
    position?: string;
    department?: string;
    monthlySalary?: string;
    workingHours?: string;
    vacation?: string;
    employeeType?: 'PERMANENT' | 'FLEX_WORKER';

    // On-call specific
    hourlyWage?: string;
    minimumHours?: string;
    maximumHours?: string;
    callNotice?: string;

    // Freelance specific
    projectTitle?: string;
    projectDescription?: string;
    deliverables?: string;
    projectValue?: string;
    paymentTerms?: string;
    kvkNumber?: string;
    btwNumber?: string;
    specificScope?: string;

    // DBA compliance (freelance)
    independenceClause?: boolean;
    substitutionAllowed?: boolean;
    performanceBased?: boolean;
    ownRisk?: boolean;

    // Additional fields for database storage
    userId?: string;
    createdById?: string;
}

// Function to save contract to database
export const saveContractToDatabase = async (contractData: ContractData, pdfBlob: Blob): Promise<string | null> => {
    try {
        // Convert PDF blob to base64
        const arrayBuffer = await pdfBlob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...Array.from(new Uint8Array(arrayBuffer))));

        // Determine contract type enum value
        let dbContractType = 'FREELANCE';
        if (contractData.contractType === 'EMPLOYMENT') {
            if (contractData.employeeType === 'PERMANENT') {
                dbContractType = 'PERMANENT_FULL_TIME';
            } else {
                dbContractType = 'TEMPORARY_FULL_TIME';
            }
        } else if (contractData.contractType === 'ON_CALL') {
            dbContractType = 'ZERO_HOURS';
        }

        // Generate contract title
        const contractTitle = `${contractData.contractType === 'FREELANCE'
            ? 'Freelance Overeenkomst'
            : contractData.contractType === 'ON_CALL'
                ? 'Oproepovereenkomst'
                : 'Arbeidsovereenkomst'
            } - ${contractData.employeeName}`;

        // Generate file name
        const fileName = `${contractTitle.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

        // Salary value based on contract type
        let salary = '';
        if (contractData.contractType === 'FREELANCE') {
            salary = contractData.projectValue ? `€${contractData.projectValue}` : '';
        } else if (contractData.contractType === 'ON_CALL') {
            salary = contractData.hourlyWage ? `€${contractData.hourlyWage}/uur` : '';
        } else {
            salary = contractData.monthlySalary ? `€${contractData.monthlySalary}/maand` : '';
        }

        // Create contract in database
        const response = await fetch('/api/contracts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: contractData.userId,
                contractType: dbContractType,
                title: contractTitle,
                description: contractData.projectDescription || `${contractData.position} - ${contractData.department}`,
                startDate: contractData.startDate,
                endDate: contractData.endDate,
                salary: salary,
                notes: `Gegenereerd op ${new Date().toLocaleDateString('nl-NL')}`,
                fileContent: base64,
                fileName: fileName,
            }),
        });

        if (response.ok) {
            const contract = await response.json();
            return contract.id;
        } else {
            console.error('Failed to save contract to database:', await response.text());
            return null;
        }
    } catch (error) {
        console.error('Error saving contract to database:', error);
        return null;
    }
};

export class PDFGenerator {
    private doc: jsPDF;
    private pageHeight: number;
    private margin: number;
    private currentY: number;
    private lineHeight: number;

    constructor() {
        this.doc = new jsPDF();
        this.pageHeight = this.doc.internal.pageSize.height;
        this.margin = 20;
        this.currentY = this.margin;
        this.lineHeight = 7;
    }

    private addHeader(title: string): void {
        // Company Logo placeholder (you can add actual logo later)
        this.doc.setFontSize(20);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('BROERS VERHUUR', this.margin, this.currentY);

        this.currentY += 15;
        this.doc.setFontSize(16);
        this.doc.text(title, this.margin, this.currentY);

        this.currentY += 20;
        this.addLine();
    }

    private addLine(): void {
        this.doc.setLineWidth(0.5);
        this.doc.line(this.margin, this.currentY, 210 - this.margin, this.currentY);
        this.currentY += 10;
    }

    private addText(text: string, fontSize: number = 11, isBold: boolean = false): void {
        if (this.currentY > this.pageHeight - 30) {
            this.doc.addPage();
            this.currentY = this.margin;
        }

        this.doc.setFontSize(fontSize);
        this.doc.setFont('helvetica', isBold ? 'bold' : 'normal');

        const splitText = this.doc.splitTextToSize(text, 170);
        this.doc.text(splitText, this.margin, this.currentY);
        this.currentY += splitText.length * this.lineHeight;
    }

    private addSection(title: string, content: string): void {
        this.addText(title, 12, true);
        this.currentY += 5;
        this.addText(content);
        this.currentY += 10;
    }

    private addContractHeader(data: ContractData): void {
        this.addText(`Contractnummer: ${data.contractNumber}`, 10);
        this.addText(`Datum: ${new Date(data.generatedAt).toLocaleDateString('nl-NL')}`, 10);
        this.currentY += 10;
    }

    private addParties(data: ContractData): void {
        this.addSection(
            'PARTIJEN:',
            `Werkgever: ${data.companyName}

Werknemer/Freelancer: ${data.employeeName}${data.employeeBirthDate ? `\nGeboortedatum: ${new Date(data.employeeBirthDate).toLocaleDateString('nl-NL')}` : ''}
Adres: ${data.employeeAddress}
E-mail: ${data.employeeEmail}${data.kvkNumber ? `\nKvK nummer: ${data.kvkNumber}` : ''}${data.btwNumber ? `\nBTW nummer: ${data.btwNumber}` : ''}`
        );
    }

    generateFreelanceContract(data: ContractData): void {
        this.addHeader('RAAMOVEREENKOMST VOOR FREELANCE DIENSTVERLENING');
        this.addText('(Wet DBA Compliant)', 10, true);
        this.currentY += 10;

        this.addContractHeader(data);
        this.addParties(data);

        this.addSection(
            'PROJECT DETAILS:',
            `Titel: ${data.projectTitle}
Beschrijving: ${data.projectDescription}
Te leveren prestaties: ${data.deliverables}
Periode: ${data.startDate} tot ${data.endDate}
Projectwaarde: €${data.projectValue}
Betalingsvoorwaarden: ${data.paymentTerms}`
        );

        this.addSection(
            'WET DBA COMPLIANCE:',
            `1. SPECIFIEKE OMVANG VAN HET WERK
${data.specificScope}

2. ONAFHANKELIJKHEID
De freelancer bepaalt zelf hoe en wanneer het werk wordt uitgevoerd. De opdrachtgever heeft geen zeggenschap over de werkwijze of werktijden.

3. VERVANGINGSMOGELIJKHEID
De freelancer heeft het recht om een gekwalificeerde vervanger in te zetten voor de uitvoering van deze opdracht.

4. PRESTATIEGERICHTE BETALING
Betaling vindt plaats op basis van geleverde prestaties en resultaten, niet op basis van gewerkte uren.

5. EIGEN BEDRIJFSRISICO
De freelancer draagt eigen bedrijfskosten en -risico's en is verantwoordelijk voor eigen verzekeringen en belastingaangiften.`
        );

        this.addSignatureSection();
        this.addCompliance();
    }

    generateEmploymentContract(data: ContractData): void {
        if (data.employeeType === 'FLEX_WORKER') {
            this.generateOnCallContract(data);
            return;
        }

        this.addHeader('ARBEIDSOVEREENKOMST');
        this.addContractHeader(data);
        this.addParties(data);

        this.addSection(
            'FUNCTIE EN WERKZAAMHEDEN:',
            `Functie: ${data.position}
Afdeling: ${data.department}
Startdatum: ${data.startDate}${data.endDate ? `\nEinddatum: ${data.endDate}` : '\nAard contract: Voor onbepaalde tijd'}`
        );

        this.addSection(
            'ARBEIDSVOORWAARDEN:',
            `Brutoloon: €${data.monthlySalary} per maand
Werkende uren: ${data.workingHours} uur per week
Vakantiedagen: ${data.vacation} dagen per jaar

ARBEIDSOMSTANDIGHEDEN:
- Werkgever zorgt voor een veilige en gezonde werkomgeving
- Werknemer dient zich te houden aan bedrijfsreglementen
- Geheimhoudingsplicht geldt tijdens en na het dienstverband`
        );

        this.addSection(
            'PROEFTIJD:',
            `Er geldt een proeftijd van 2 maanden waarin de arbeidsovereenkomst door beide partijen met onmiddellijke ingang kan worden opgezegd.`
        );

        this.addSection(
            'OPZEGGING:',
            `Deze arbeidsovereenkomst kan door beide partijen worden opgezegd met inachtneming van de wettelijke opzegtermijnen zoals vastgelegd in het Burgerlijk Wetboek.`
        );

        this.addSection(
            'TOEPASSELIJK RECHT:',
            `Op deze arbeidsovereenkomst is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in Nederland.`
        );

        this.addSignatureSection();
    }

    generateOnCallContract(data: ContractData): void {
        this.addHeader('OPROEPOVEREENKOMST');
        this.addText('(Conform artikel 7:628a BW)', 10, true);
        this.currentY += 10;

        this.addContractHeader(data);
        this.addParties(data);

        this.addSection(
            'FUNCTIE EN WERKZAAMHEDEN:',
            `Functie: ${data.position}
Afdeling: ${data.department}
Startdatum: ${data.startDate}${data.endDate ? `\nEinddatum: ${data.endDate}` : '\nAard contract: Voor onbepaalde tijd'}

De werknemer verricht werkzaamheden op oproep van de werkgever. Er bestaat geen verplichting om werk aan te bieden, noch om aangeboden werk te accepteren.`
        );

        this.addSection(
            'ARBEIDSVOORWAARDEN:',
            `Bruto uurloon: €${data.hourlyWage} per uur
${data.minimumHours ? `Minimum aantal uren per week: ${data.minimumHours} uur` : 'Geen gegarandeerde uren per week'}
${data.maximumHours ? `Maximum aantal uren per week: ${data.maximumHours} uur` : ''}
Vakantiedagen: ${data.vacation || '20'} dagen per jaar (naar rato)

OPROEPVOORWAARDEN:
- Oproepen gebeuren minimaal ${data.callNotice || '4 uur'} van tevoren
- De werknemer heeft het recht om een oproep te weigeren
- Bij aanvaarding van een oproep is de werknemer verplicht het werk uit te voeren
- Uitbetaling vindt plaats per gewerkt uur`
        );

        this.addSection(
            'BESCHIKBAARHEID:',
            `De werknemer geeft bij aanvaarding van deze overeenkomst aan in welke perioden hij/zij beschikbaar is voor werkzaamheden. Wijzigingen in beschikbaarheid dienen tijdig te worden gecommuniceerd.`
        );

        this.addSection(
            'OPZEGGING:',
            `Deze oproepovereenkomst kan door beide partijen worden opgezegd met inachtneming van de wettelijke opzegtermijnen. Voor oproepkrachten gelden specifieke regels conform artikel 7:628a BW.`
        );

        this.addSection(
            'RECHTEN EN VERPLICHTINGEN:',
            `RECHTEN OPROEPKRACHT:
- Recht op weigering van oproepen zonder gevolgen
- Recht op doorbetaling bij annulering binnen 4 uur
- Recht op evenredige arbeidsvoorwaarden
- Recht op ontwikkeling en training

VERPLICHTINGEN:
- Bij aanvaarding van oproep: werkzaamheden naar behoren uitvoeren
- Tijdige communicatie over beschikbaarheid
- Naleving van bedrijfsreglementen tijdens werkperioden`
        );

        this.addSection(
            'TOEPASSELIJK RECHT:',
            `Op deze oproepovereenkomst is Nederlands recht van toepassing. Specifiek artikel 7:628a BW betreffende oproepovereenkomsten. Geschillen worden voorgelegd aan de bevoegde rechter in Nederland.`
        );

        this.addSignatureSection();
    }

    private addSignatureSection(): void {
        this.currentY += 20;
        this.addText('HANDTEKENINGEN:', 12, true);
        this.currentY += 20;

        this.addText('Werkgever: _________________________    Datum: ___________');
        this.currentY += 20;
        this.addText('Werknemer/Freelancer: _______________    Datum: ___________');
    }

    private addCompliance(): void {
        this.currentY += 20;
        this.addText('Deze overeenkomst is opgesteld conform de Wet Deregulering Beoordeling Arbeidsrelaties (DBA).', 10, true);
    }

    download(filename: string): void {
        this.doc.save(filename);
    }

    getBlob(): Blob {
        return this.doc.output('blob');
    }
}

export const generateFreelancePDF = (data: ContractData): Blob => {
    const generator = new PDFGenerator();
    generator.generateFreelanceContract(data);
    return generator.getBlob();
};

export const generateEmploymentPDF = (data: ContractData): Blob => {
    const generator = new PDFGenerator();
    generator.generateEmploymentContract(data);
    return generator.getBlob();
};

export const generateOnCallPDF = (data: ContractData): Blob => {
    const generator = new PDFGenerator();
    generator.generateOnCallContract(data);
    return generator.getBlob();
};

// Updated download functions that also save to database
export const downloadFreelanceContract = async (data: ContractData): Promise<string | null> => {
    const generator = new PDFGenerator();
    generator.generateFreelanceContract(data);
    const blob = generator.getBlob();

    // Download PDF
    const filename = `Freelance_Overeenkomst_${data.employeeName.replace(/\s+/g, '_')}.pdf`;
    generator.download(filename);

    // Save to database if userId is provided
    if (data.userId) {
        return await saveContractToDatabase(data, blob);
    }

    return null;
};

export const downloadEmploymentContract = async (data: ContractData): Promise<string | null> => {
    const generator = new PDFGenerator();
    generator.generateEmploymentContract(data);
    const blob = generator.getBlob();

    // Download PDF
    const filename = `Arbeidsovereenkomst_${data.employeeName.replace(/\s+/g, '_')}.pdf`;
    generator.download(filename);

    // Save to database if userId is provided
    if (data.userId) {
        return await saveContractToDatabase(data, blob);
    }

    return null;
};

export const downloadOnCallContract = async (data: ContractData): Promise<string | null> => {
    const generator = new PDFGenerator();
    generator.generateOnCallContract(data);
    const blob = generator.getBlob();

    // Download PDF
    const filename = `Oproepovereenkomst_${data.employeeName.replace(/\s+/g, '_')}.pdf`;
    generator.download(filename);

    // Save to database if userId is provided
    if (data.userId) {
        return await saveContractToDatabase(data, blob);
    }

    return null;
}; 