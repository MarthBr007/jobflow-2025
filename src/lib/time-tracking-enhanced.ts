export interface TimeBalance {
    userId: string;
    regularHours: number;
    overtimeHours: number;
    compensationHours: number; // Tijd-voor-tijd opgebouwd
    usedCompensationHours: number; // Opgenomen compensatie
    shortageHours: number; // Te kort gewerkte uren
    expectedHours: number; // Verwachte uren volgens contract
    actualHours: number; // Werkelijk gewerkte uren
    breakHours: number;
    weekendHours: number; // Weekend uren
    eveningHours: number; // Avond uren (na 18:00)
    nightHours: number; // Nacht uren (22:00-06:00)
    holidayHours: number; // Feestdag uren
    autoBreakDeducted: number; // Automatisch afgetrokken pauze
    period: {
        start: Date;
        end: Date;
    };
}

export interface WorkingTimeRules {
    standardWorkingHours: number; // 40 uur per week
    overtimeThreshold: number; // Na hoeveel uur overtime begint
    compensationTimeMultiplier: number; // 1.0 = 1:1, 1.5 = 1.5:1
    maxCompensationBalance: number; // Max opgebouwde uren
    shortageThreshold: number; // Wanneer tekort alarmeert
    breakMinimumMinutes: number; // Minimum pauze tijd
    breakRequiredAfterHours: number; // Pauze verplicht na X uur
    weekendMultiplier: number; // Weekend toeslag (1.5 = 150%)
    eveningMultiplier: number; // Avond toeslag (na 18:00)
    nightMultiplier: number; // Nacht toeslag (22:00-06:00)
    holidayMultiplier: number; // Feestdag toeslag
    autoBreakAfterHours: number; // Automatische pauze na X uur
    autoBreakMinutes: number; // Automatische pauze duur
    flexibleWorkWeek: boolean; // Flexibele werkweek
    contractHoursPerWeek?: number; // Contract uren per week (override standard)
    maxDailyHours: number; // Max uren per dag
    minRestBetweenShifts: number; // Min rust tussen diensten (uren)
}

export interface TimeEntry {
    id: string;
    userId: string;
    clockIn: Date;
    clockOut?: Date;
    breakStart?: Date;
    breakEnd?: Date;
    totalBreakMinutes?: number;
    workType: 'REGULAR' | 'OVERTIME' | 'COMPENSATION_USED' | 'SICK' | 'VACATION';
    projectId?: string;
    location?: string;
    notes?: string;
    approved: boolean;
    approvedBy?: string;
    approvedAt?: Date;
    calculatedHours?: number;
    compensationEarned?: number;
    isWeekend?: boolean;
    isEvening?: boolean;
    isNight?: boolean;
    isHoliday?: boolean;
    autoBreakApplied?: boolean;
    shiftType?: 'DAY' | 'EVENING' | 'NIGHT' | 'WEEKEND';
}

export interface ShortageAlert {
    userId: string;
    userName: string;
    expectedHours: number;
    actualHours: number;
    shortageHours: number;
    period: string;
    severity: 'WARNING' | 'CRITICAL';
    notified: boolean;
    consecutiveWeeksShort: number;
    suggestedActions: string[];
    autoNotificationSent: boolean;
    managerNotified: boolean;
}

export interface BulkCompensationAction {
    userId: string;
    dates: string[];
    hoursPerDay: number;
    type: 'VACATION' | 'PERSONAL' | 'SICK' | 'FLEX';
    reason: string;
    totalHours: number;
}

export const DUTCH_HOLIDAYS_2024 = [
    '2024-01-01', // Nieuwjaarsdag
    '2024-03-29', // Goede Vrijdag
    '2024-03-31', // Paaszondag
    '2024-04-01', // Paasmaandag
    '2024-04-27', // Koningsdag
    '2024-05-05', // Bevrijdingsdag
    '2024-05-09', // Hemelvaart
    '2024-05-19', // Pinksteren
    '2024-05-20', // Pinkstermaandag
    '2024-12-25', // Eerste Kerstdag
    '2024-12-26', // Tweede Kerstdag
];

export class EnhancedTimeTracking {
    private rules: WorkingTimeRules;

    constructor(customRules?: Partial<WorkingTimeRules>) {
        this.rules = {
            standardWorkingHours: 40,
            overtimeThreshold: 40,
            compensationTimeMultiplier: 1.0, // 1:1 compensatie
            maxCompensationBalance: 80, // Max 80 uur opbouwen
            shortageThreshold: 4, // Alarm bij 4+ uur tekort
            breakMinimumMinutes: 30,
            breakRequiredAfterHours: 6,
            weekendMultiplier: 1.5, // 150% weekend toeslag
            eveningMultiplier: 1.25, // 125% avond toeslag
            nightMultiplier: 1.5, // 150% nacht toeslag
            holidayMultiplier: 2.0, // 200% feestdag toeslag
            autoBreakAfterHours: 6, // Auto pauze na 6 uur
            autoBreakMinutes: 30, // 30 min auto pauze
            flexibleWorkWeek: false,
            maxDailyHours: 12, // Max 12 uur per dag
            minRestBetweenShifts: 11, // Min 11 uur rust
            ...customRules,
        };
    }

    /**
     * Bereken tijd balans voor een gebruiker in een periode (verbeterd)
     */
    calculateTimeBalance(entries: TimeEntry[], period: { start: Date; end: Date }, contractHours?: number): TimeBalance {
        // Gebruik contract uren of standaard uren
        const weeklyHours = contractHours || this.rules.contractHoursPerWeek || this.rules.standardWorkingHours;

        let totalWorkedHours = 0;
        let weekendHours = 0;
        let eveningHours = 0;
        let nightHours = 0;
        let holidayHours = 0;
        let autoBreakDeducted = 0;

        entries.forEach(entry => {
            if (entry.clockOut && entry.workType === 'REGULAR') {
                const { hours, breakdown } = this.calculateDetailedWorkedHours(entry);
                totalWorkedHours += hours;
                weekendHours += breakdown.weekendHours;
                eveningHours += breakdown.eveningHours;
                nightHours += breakdown.nightHours;
                holidayHours += breakdown.holidayHours;
                autoBreakDeducted += breakdown.autoBreakDeducted;
            }
        });

        const totalBreakHours = entries.reduce((total, entry) => {
            return total + (entry.totalBreakMinutes || 0) / 60;
        }, 0);

        // Bereken verwachte uren
        const weeksDiff = this.getWeeksBetweenDates(period.start, period.end);
        const expectedHours = weeksDiff * weeklyHours;

        // Bereken overtime en compensatie met toeslagen
        const regularHours = Math.min(totalWorkedHours, expectedHours);
        const overtimeHours = Math.max(0, totalWorkedHours - weeklyHours);

        // Compensatie berekening met toeslagen
        let compensationEarned = overtimeHours * this.rules.compensationTimeMultiplier;
        compensationEarned += weekendHours * (this.rules.weekendMultiplier - 1);
        compensationEarned += eveningHours * (this.rules.eveningMultiplier - 1);
        compensationEarned += nightHours * (this.rules.nightMultiplier - 1);
        compensationEarned += holidayHours * (this.rules.holidayMultiplier - 1);

        // Bereken gebruikte compensatie uren
        const usedCompensationHours = entries
            .filter(entry => entry.workType === 'COMPENSATION_USED')
            .reduce((total, entry) => {
                if (entry.clockOut) {
                    return total + this.calculateWorkedHours(entry.clockIn, entry.clockOut);
                }
                return total;
            }, 0);

        // Bereken tekort
        const shortageHours = Math.max(0, expectedHours - totalWorkedHours);

        return {
            userId: entries[0]?.userId || '',
            regularHours,
            overtimeHours,
            compensationHours: compensationEarned,
            usedCompensationHours,
            shortageHours,
            expectedHours,
            actualHours: totalWorkedHours,
            breakHours: totalBreakHours,
            weekendHours,
            eveningHours,
            nightHours,
            holidayHours,
            autoBreakDeducted,
            period,
        };
    }

    /**
     * Gedetailleerde uren berekening met toeslagen
     */
    calculateDetailedWorkedHours(entry: TimeEntry): {
        hours: number;
        breakdown: {
            regularHours: number;
            weekendHours: number;
            eveningHours: number;
            nightHours: number;
            holidayHours: number;
            autoBreakDeducted: number;
        };
    } {
        if (!entry.clockOut) {
            return {
                hours: 0,
                breakdown: {
                    regularHours: 0,
                    weekendHours: 0,
                    eveningHours: 0,
                    nightHours: 0,
                    holidayHours: 0,
                    autoBreakDeducted: 0,
                }
            };
        }

        const startTime = new Date(entry.clockIn);
        const endTime = new Date(entry.clockOut);
        const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

        // Automatische pauze detectie
        let autoBreakDeducted = 0;
        const workedHours = totalMinutes / 60;
        if (workedHours >= this.rules.autoBreakAfterHours && !entry.totalBreakMinutes) {
            autoBreakDeducted = this.rules.autoBreakMinutes / 60;
        }

        const actualWorkedMinutes = totalMinutes - (entry.totalBreakMinutes || 0) - (autoBreakDeducted * 60);
        const actualWorkedHours = actualWorkedMinutes / 60;

        // Bepaal type uren
        const isWeekend = startTime.getDay() === 0 || startTime.getDay() === 6;
        const isHoliday = this.isHoliday(startTime);
        const isEvening = startTime.getHours() >= 18 || endTime.getHours() >= 18;
        const isNight = (startTime.getHours() >= 22 || startTime.getHours() < 6) ||
            (endTime.getHours() >= 22 || endTime.getHours() < 6);

        let regularHours = actualWorkedHours;
        let weekendHours = 0;
        let eveningHours = 0;
        let nightHours = 0;
        let holidayHours = 0;

        if (isHoliday) {
            holidayHours = actualWorkedHours;
            regularHours = 0;
        } else if (isWeekend) {
            weekendHours = actualWorkedHours;
            regularHours = 0;
        } else if (isNight) {
            nightHours = actualWorkedHours;
            regularHours = 0;
        } else if (isEvening) {
            eveningHours = actualWorkedHours;
            regularHours = 0;
        }

        return {
            hours: actualWorkedHours,
            breakdown: {
                regularHours,
                weekendHours,
                eveningHours,
                nightHours,
                holidayHours,
                autoBreakDeducted,
            }
        };
    }

    /**
     * Check of datum een feestdag is
     */
    private isHoliday(date: Date): boolean {
        const dateString = date.toISOString().split('T')[0];
        return DUTCH_HOLIDAYS_2024.includes(dateString);
    }

    /**
     * Detecteer tekorten en genereer alerts (verbeterd)
     */
    detectShortages(balances: TimeBalance[], historicalData?: TimeBalance[][]): ShortageAlert[] {
        return balances
            .filter(balance => balance.shortageHours >= this.rules.shortageThreshold)
            .map(balance => {
                // Bepaal aantal opeenvolgende weken tekort
                let consecutiveWeeksShort = 1;
                if (historicalData) {
                    const userHistory = historicalData.find(history =>
                        history.some(h => h.userId === balance.userId)
                    );
                    if (userHistory) {
                        consecutiveWeeksShort = this.calculateConsecutiveShortWeeks(userHistory, balance.userId);
                    }
                }

                const suggestedActions = this.generateShortageActions(balance, consecutiveWeeksShort);

                return {
                    userId: balance.userId,
                    userName: `User ${balance.userId}`,
                    expectedHours: balance.expectedHours,
                    actualHours: balance.actualHours,
                    shortageHours: balance.shortageHours,
                    period: `${balance.period.start.toLocaleDateString()} - ${balance.period.end.toLocaleDateString()}`,
                    severity: balance.shortageHours >= 8 ? 'CRITICAL' : 'WARNING',
                    notified: false,
                    consecutiveWeeksShort,
                    suggestedActions,
                    autoNotificationSent: false,
                    managerNotified: consecutiveWeeksShort >= 3,
                };
            });
    }

    /**
     * Genereer acties voor tekorten
     */
    private generateShortageActions(balance: TimeBalance, consecutiveWeeks: number): string[] {
        const actions = [];

        if (balance.shortageHours <= 4) {
            actions.push('Plan extra uren deze week');
            actions.push('Overleg met manager over flexibele uren');
        } else if (balance.shortageHours <= 8) {
            actions.push('Plan inhaaldag deze week');
            actions.push('Gebruik compensatie uren indien beschikbaar');
            actions.push('Overleg met planning over extra shifts');
        } else {
            actions.push('Urgent: Plan meerdere inhaaldagen');
            actions.push('Manager gesprek vereist');
            actions.push('Evalueer werkbelasting en planning');
        }

        if (consecutiveWeeks >= 2) {
            actions.push('Structureel probleem: evalueer contract uren');
            actions.push('Bespreek werkdruk met HR');
        }

        if (consecutiveWeeks >= 3) {
            actions.push('Escalatie naar management');
            actions.push('Mogelijk contract aanpassing nodig');
        }

        return actions;
    }

    /**
     * Bereken opeenvolgende weken tekort
     */
    private calculateConsecutiveShortWeeks(history: TimeBalance[], userId: string): number {
        const userBalances = history
            .filter(b => b.userId === userId)
            .sort((a, b) => b.period.start.getTime() - a.period.start.getTime());

        let consecutive = 0;
        for (const balance of userBalances) {
            if (balance.shortageHours >= this.rules.shortageThreshold) {
                consecutive++;
            } else {
                break;
            }
        }

        return consecutive;
    }

    /**
     * Bulk compensatie verwerking
     */
    processBulkCompensation(action: BulkCompensationAction): {
        success: boolean;
        message: string;
        entries: any[];
        remainingBalance: number;
    } {
        const totalHoursNeeded = action.totalHours;

        // Valideer beschikbare compensatie (dit zou uit database komen)
        const availableCompensation = 40; // Placeholder

        if (totalHoursNeeded > availableCompensation) {
            return {
                success: false,
                message: `Niet genoeg compensatie uren. Beschikbaar: ${formatDuration(availableCompensation)}, Nodig: ${formatDuration(totalHoursNeeded)}`,
                entries: [],
                remainingBalance: availableCompensation,
            };
        }

        // Genereer entries voor elke dag
        const entries = action.dates.map(date => ({
            date,
            hours: action.hoursPerDay,
            type: action.type,
            reason: action.reason,
            status: 'PENDING_APPROVAL',
        }));

        return {
            success: true,
            message: `${action.dates.length} dagen compensatie aangevraagd (${formatDuration(totalHoursNeeded)})`,
            entries,
            remainingBalance: availableCompensation - totalHoursNeeded,
        };
    }

    /**
     * Bereken gewerkte uren inclusief pauzes
     */
    private calculateWorkedHours(clockIn: Date, clockOut: Date, breakMinutes: number = 0): number {
        const totalMinutes = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60);
        const workedMinutes = totalMinutes - breakMinutes;
        return Math.max(0, workedMinutes / 60);
    }

    /**
     * Bereken aantal weken tussen datums
     */
    private getWeeksBetweenDates(start: Date, end: Date): number {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays / 7;
    }

    /**
     * Valideer pauze regels
     */
    validateBreakRules(entry: TimeEntry): { valid: boolean; message?: string } {
        if (!entry.clockOut) return { valid: true };

        const workedHours = this.calculateWorkedHours(entry.clockIn, entry.clockOut, 0);
        const breakMinutes = entry.totalBreakMinutes || 0;

        // Check minimum pauze
        if (breakMinutes < this.rules.breakMinimumMinutes) {
            return {
                valid: false,
                message: `Minimum ${this.rules.breakMinimumMinutes} minuten pauze vereist`,
            };
        }

        // Check verplichte pauze na lange werkdag
        if (workedHours > this.rules.breakRequiredAfterHours && breakMinutes < 30) {
            return {
                valid: false,
                message: `Na ${this.rules.breakRequiredAfterHours} uur werken is minimaal 30 minuten pauze verplicht`,
            };
        }

        return { valid: true };
    }

    /**
     * Genereer tijd rapportage
     */
    generateTimeReport(balances: TimeBalance[]): {
        summary: {
            totalRegularHours: number;
            totalOvertimeHours: number;
            totalCompensationBalance: number;
            totalShortageHours: number;
            averageProductivity: number;
        };
        alerts: ShortageAlert[];
        recommendations: string[];
    } {
        const summary = balances.reduce(
            (acc, balance) => ({
                totalRegularHours: acc.totalRegularHours + balance.regularHours,
                totalOvertimeHours: acc.totalOvertimeHours + balance.overtimeHours,
                totalCompensationBalance: acc.totalCompensationBalance + (balance.compensationHours - balance.usedCompensationHours),
                totalShortageHours: acc.totalShortageHours + balance.shortageHours,
                averageProductivity: acc.averageProductivity + (balance.actualHours / balance.expectedHours) * 100,
            }),
            {
                totalRegularHours: 0,
                totalOvertimeHours: 0,
                totalCompensationBalance: 0,
                totalShortageHours: 0,
                averageProductivity: 0,
            }
        );

        summary.averageProductivity = summary.averageProductivity / balances.length;

        const alerts = this.detectShortages(balances);
        const recommendations = this.generateRecommendations(summary, alerts);

        return { summary, alerts, recommendations };
    }

    /**
     * Genereer aanbevelingen gebaseerd op data
     */
    private generateRecommendations(summary: any, alerts: ShortageAlert[]): string[] {
        const recommendations: string[] = [];

        if (summary.totalShortageHours > 20) {
            recommendations.push('WAARSCHUWING: Er zijn significante tekorten gedetecteerd. Overweeg rooster aanpassingen.');
        }

        if (summary.totalOvertimeHours > summary.totalRegularHours * 0.2) {
            recommendations.push('OVERTIME: Hoge overtime uren. Mogelijk extra personeel nodig.');
        }

        if (summary.totalCompensationBalance > 200) {
            recommendations.push('COMPENSATIE: Veel opgebouwde compensatie uren. Stimuleer opname om burnout te voorkomen.');
        }

        if (summary.averageProductivity < 80) {
            recommendations.push('PRODUCTIVITEIT: Lage productiviteit gedetecteerd. Analyseer oorzaken en ondersteun medewerkers.');
        }

        if (alerts.length > 0) {
            recommendations.push(`TEKORTEN: ${alerts.length} medewerkers hebben tekorten. Directe aandacht vereist.`);
        }

        return recommendations;
    }

    /**
     * Automatische compensatie berekening
     */
    calculateCompensationTime(overtimeHours: number, isWeekend: boolean = false, isHoliday: boolean = false): number {
        let multiplier = this.rules.compensationTimeMultiplier;

        // Weekend toeslag
        if (isWeekend) multiplier += 0.5;

        // Feestdag toeslag
        if (isHoliday) multiplier += 1.0;

        return overtimeHours * multiplier;
    }

    /**
     * Check compensatie balans limiet
     */
    canEarnCompensation(currentBalance: number, newHours: number): { allowed: boolean; maxAllowed?: number } {
        const newTotal = currentBalance + newHours;

        if (newTotal <= this.rules.maxCompensationBalance) {
            return { allowed: true };
        }

        const maxAllowed = Math.max(0, this.rules.maxCompensationBalance - currentBalance);
        return { allowed: false, maxAllowed };
    }
}

// Export enhanced time tracking utilities
export const timeTracker = new EnhancedTimeTracking();

// Nederlandse tijd formatteringen
export const formatDuration = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}u ${m}m`;
};

export const formatTimeBalance = (balance: TimeBalance): string => {
    const compensationBalance = balance.compensationHours - balance.usedCompensationHours;

    return `
Periode: ${balance.period.start.toLocaleDateString()} - ${balance.period.end.toLocaleDateString()}
Gewerkt: ${formatDuration(balance.actualHours)} / ${formatDuration(balance.expectedHours)}
Overtime: ${formatDuration(balance.overtimeHours)}
Compensatie saldo: ${formatDuration(compensationBalance)}
${balance.shortageHours > 0 ? `TEKORT: ${formatDuration(balance.shortageHours)}` : 'TARGET BEHAALD'}
  `.trim();
};

export default EnhancedTimeTracking; 