export interface ValidationRule {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    min?: number;
    max?: number;
    custom?: (value: any) => string | null;
}

export interface ValidationRules {
    [fieldName: string]: ValidationRule;
}

export interface ValidationErrors {
    [fieldName: string]: string;
}

export class FormValidator {
    private rules: ValidationRules;
    private errors: ValidationErrors = {};

    constructor(rules: ValidationRules) {
        this.rules = rules;
    }

    validate(data: Record<string, any>): { isValid: boolean; errors: ValidationErrors } {
        this.errors = {};

        for (const [fieldName, rule] of Object.entries(this.rules)) {
            const value = data[fieldName];
            const error = this.validateField(fieldName, value, rule);

            if (error) {
                this.errors[fieldName] = error;
            }
        }

        return {
            isValid: Object.keys(this.errors).length === 0,
            errors: { ...this.errors }
        };
    }

    validateField(fieldName: string, value: any, rule: ValidationRule): string | null {
        // Required validation
        if (rule.required && (value === undefined || value === null || value === '')) {
            return `${this.getFieldDisplayName(fieldName)} is verplicht`;
        }

        // Skip other validations if field is empty and not required
        if (!rule.required && (value === undefined || value === null || value === '')) {
            return null;
        }

        // String validations
        if (typeof value === 'string') {
            if (rule.minLength && value.length < rule.minLength) {
                return `${this.getFieldDisplayName(fieldName)} moet minimaal ${rule.minLength} karakters bevatten`;
            }

            if (rule.maxLength && value.length > rule.maxLength) {
                return `${this.getFieldDisplayName(fieldName)} mag maximaal ${rule.maxLength} karakters bevatten`;
            }

            if (rule.pattern && !rule.pattern.test(value)) {
                return `${this.getFieldDisplayName(fieldName)} heeft een ongeldig formaat`;
            }
        }

        // Number validations
        if (typeof value === 'number') {
            if (rule.min !== undefined && value < rule.min) {
                return `${this.getFieldDisplayName(fieldName)} moet minimaal ${rule.min} zijn`;
            }

            if (rule.max !== undefined && value > rule.max) {
                return `${this.getFieldDisplayName(fieldName)} mag maximaal ${rule.max} zijn`;
            }
        }

        // Custom validation
        if (rule.custom) {
            return rule.custom(value);
        }

        return null;
    }

    private getFieldDisplayName(fieldName: string): string {
        const displayNames: Record<string, string> = {
            firstName: 'Voornaam',
            lastName: 'Achternaam',
            email: 'E-mailadres',
            title: 'Titel',
            description: 'Beschrijving',
            startDate: 'Startdatum',
            endDate: 'Einddatum',
            salary: 'Salaris',
            employeeType: 'Dienstverband',
            notes: 'Opmerkingen',
        };

        return displayNames[fieldName] || fieldName;
    }
}

// Predefined validation rules for common fields
export const commonValidationRules = {
    email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        custom: (value: string) => {
            if (value && !value.includes('@')) {
                return 'Voer een geldig e-mailadres in';
            }
            return null;
        }
    },

    name: {
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-ZÀ-ÿ\s-']+$/,
    },

    title: {
        required: true,
        minLength: 5,
        maxLength: 100,
    },

    description: {
        maxLength: 500,
    },

    salary: {
        required: true,
        min: 0,
        max: 999999,
        custom: (value: number) => {
            if (value && value < 1000) {
                return 'Salaris lijkt te laag, controleer of het bedrag correct is';
            }
            return null;
        }
    },

    date: {
        required: true,
        custom: (value: string) => {
            if (value) {
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    return 'Voer een geldige datum in';
                }
                if (date < new Date('1900-01-01')) {
                    return 'Datum mag niet voor 1900 zijn';
                }
                if (date > new Date('2100-01-01')) {
                    return 'Datum mag niet na 2100 zijn';
                }
            }
            return null;
        }
    },

    contractDates: {
        custom: (value: any, allData?: Record<string, any>) => {
            if (allData && allData.startDate && allData.endDate) {
                const start = new Date(allData.startDate);
                const end = new Date(allData.endDate);

                if (end <= start) {
                    return 'Einddatum moet na de startdatum zijn';
                }

                const diffMonths = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
                if (diffMonths > 60) {
                    return 'Contract mag niet langer dan 5 jaar zijn';
                }
            }
            return null;
        }
    }
};

// Contract-specific validation rules
export const contractValidationRules: ValidationRules = {
    title: commonValidationRules.title,
    description: commonValidationRules.description,
    startDate: commonValidationRules.date,
    endDate: commonValidationRules.date,
    salary: commonValidationRules.salary,
    employeeType: { required: true },
    contractDates: commonValidationRules.contractDates,
};

// User validation rules  
export const userValidationRules: ValidationRules = {
    firstName: commonValidationRules.name,
    lastName: commonValidationRules.name,
    email: commonValidationRules.email,
    employeeType: { required: true },
};

// Real-time validation hook
export function useFormValidation(rules: ValidationRules) {
    const validator = new FormValidator(rules);

    return {
        validateForm: (data: Record<string, any>) => validator.validate(data),
        validateField: (fieldName: string, value: any) =>
            validator.validateField(fieldName, value, rules[fieldName] || {}),
    };
} 