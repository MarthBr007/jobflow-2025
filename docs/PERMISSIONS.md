# JobFlow Permission System

## Role Hierarchy

JobFlow gebruikt een hiërarchisch permission systeem met vier rollen, van hoog naar laag:

### 1. ADMIN (Niveau 4)
**Volledige systeemtoegang**
- Kan alle systeeminstellingen beheren
- Heeft toegang tot alle functies
- Kan gebruikersrollen wijzigen
- Kan gebruikers verwijderen

### 2. MANAGER (Niveau 3)
**Operationeel beheer**
- Kan personeel beheren (aanmaken, bewerken, wachtwoorden resetten)
- Kan projecten en roosters beheren
- Kan werklocaties en werktypes beheren
- Kan bedrijfsbrede data bekijken
- **Kan GEEN** systeeminstellingen wijzigen
- **Kan GEEN** gebruikersrollen wijzigen
- **Kan GEEN** gebruikers verwijderen

### 3. EMPLOYEE (Niveau 2)
**Vaste medewerker**
- Kan tijd registreren
- Kan beschikbaarheid instellen
- Kan eigen projecten bekijken
- Kan interesse tonen in projecten
- **Beperkte toegang** tot alleen eigen data

### 4. FREELANCER (Niveau 1)
**Contractmedewerker**
- Vergelijkbare rechten als EMPLOYEE
- Kan tijd registreren
- Kan beschikbaarheid instellen
- Kan eigen projecten bekijken
- Kan interesse tonen in projecten
- **Beperkte toegang** tot alleen eigen data

## Permission Categorieën

### System Administration
- `canManageSystemSettings`: Systeeminstellingen beheren (ADMIN ONLY)
- `canManageEmailSettings`: Email instellingen beheren (ADMIN + MANAGER)

### System Management (ADMIN + MANAGER)
- `canManageWorkLocations`: Werklocaties beheren
- `canManageWorkTypes`: Werktypes beheren

### User Management
- `canViewAllUsers`: Alle gebruikers bekijken (ADMIN + MANAGER)
- `canCreateUsers`: Gebruikers aanmaken (ADMIN + MANAGER)
- `canEditUsers`: Gebruikers bewerken (ADMIN + MANAGER)
- `canDeleteUsers`: Gebruikers verwijderen (ADMIN ONLY)
- `canChangeUserRoles`: Gebruikersrollen wijzigen (ADMIN ONLY)
- `canResetPasswords`: Wachtwoorden resetten (ADMIN + MANAGER)

### Project Management (ADMIN + MANAGER)
- `canViewAllProjects`: Alle projecten bekijken
- `canCreateProjects`: Projecten aanmaken
- `canEditProjects`: Projecten bewerken
- `canDeleteProjects`: Projecten verwijderen
- `canAssignProjectMembers`: Projectleden toewijzen
- `canViewProjectInterests`: Project interesses bekijken

### Schedule Management (ADMIN + MANAGER)
- `canViewAllSchedules`: Alle roosters bekijken
- `canCreateSchedules`: Roosters aanmaken
- `canEditSchedules`: Roosters bewerken
- `canDeleteSchedules`: Roosters verwijderen
- `canManageShifts`: Diensten beheren

### Time Management (ADMIN + MANAGER)
- `canViewAllTimeEntries`: Alle tijdregistraties bekijken
- `canApproveTimeEntries`: Tijdregistraties goedkeuren
- `canManageClockStatus`: Klokstatus beheren

### Data Access (ADMIN + MANAGER)
- `canViewCompanyWideData`: Bedrijfsbrede data bekijken
- `canViewAllAvailability`: Alle beschikbaarheid bekijken
- `canExportData`: Data exporteren

### Personal Features (ALL ROLES)
- `canRegisterTime`: Tijd registreren
- `canSetAvailability`: Beschikbaarheid instellen
- `canViewOwnProjects`: Eigen projecten bekijken
- `canExpressProjectInterest`: Interesse tonen in projecten

## Implementatie

Het permission systeem is geïmplementeerd in `/src/lib/permissions.ts` en biedt:

### Helper Functions
```typescript
// Check specifieke permissie
hasPermission(role: UserRole, permission: keyof PermissionLevel): boolean

// Check admin-only toegang
isAdmin(role: UserRole): boolean

// Check admin of manager toegang
isAdminOrManager(role: UserRole): boolean

// Get rol niveau (hoger = meer permissies)
getRoleLevel(role: UserRole): number

// Check rol hiërarchie
hasHigherOrEqualRole(roleA: UserRole, roleB: UserRole): boolean
```

### Gebruik in API Routes
```typescript
import { hasPermission, UserRole } from '@/lib/permissions';

// Check permissie
if (!hasPermission(user.role as UserRole, 'canManageUsers')) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
}
```

## Belangrijke Principes

1. **Least Privilege**: Gebruikers krijgen alleen de minimale permissies die nodig zijn
2. **Role Hierarchy**: Hogere rollen erven geen permissies van lagere rollen automatisch
3. **Explicit Permissions**: Elke permissie moet expliciet worden toegekend
4. **Consistency**: Alle API endpoints gebruiken hetzelfde permission systeem
5. **Security First**: Bij twijfel wordt toegang geweigerd

## Veelgestelde Vragen

### Waarom kunnen MANAGERS geen gebruikersrollen wijzigen?
Dit is een veiligheidsmaatregel. Alleen ADMINS kunnen rollen wijzigen om te voorkomen dat managers zichzelf of anderen admin-rechten geven.

### Wat is het verschil tussen EMPLOYEE en FREELANCER?
Momenteel hebben beide rollen dezelfde permissies. Het onderscheid is voorbereid voor toekomstige functionaliteit waarbij freelancers mogelijk beperktere toegang krijgen tot bepaalde bedrijfsinformatie.

### Kunnen MANAGERS email instellingen beheren?
Ja, managers kunnen email instellingen beheren omdat zij personeel moeten kunnen beheren en communicatie-instellingen nodig hebben voor hun operationele taken.

### Hoe voeg ik een nieuwe permissie toe?
1. Voeg de permissie toe aan de `PermissionLevel` interface
2. Definieer welke rollen deze permissie hebben in `ROLE_PERMISSIONS`
3. Gebruik `hasPermission()` in je API routes
4. Update deze documentatie 