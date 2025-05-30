# Print en Email Functionaliteit voor Roosters

## Overzicht

De JobFlow applicatie heeft nu print en email functionaliteit voor roosters in de admin/manager kant. Deze functionaliteit stelt beheerders in staat om roosters te printen en te emailen naar medewerkers.

## Functionaliteiten

### 🖨️ Print Functionaliteit

**Locatie:** `/dashboard/schedule`

**Hoe het werkt:**
- Klik op de "Printen" knop in de rooster pagina
- Er wordt automatisch een print-vriendelijke versie gegenereerd
- Het rooster wordt geopend in een nieuw venster en de print dialog verschijnt
- De print versie bevat:
  - Bedrijfsheader (JobFlow)
  - Datum van het rooster
  - Samenvatting (aantal diensten, totaal uren)
  - Gedetailleerde tabel met alle diensten
  - Contactgegevens
  - Ruimte voor handtekening manager

**Print Layout:**
- A4 formaat
- Professionele styling
- Zwart-wit vriendelijk
- Alle belangrijke informatie overzichtelijk weergegeven

### 📧 Email Functionaliteit

**Locatie:** `/dashboard/schedule`

**Hoe het werkt:**
1. Klik op de "Emailen" knop in de rooster pagina
2. Vul de email modal in:
   - **Ontvangers:** Meerdere email adressen gescheiden door komma's
   - **Onderwerp:** Optioneel (automatisch gegenereerd als leeg)
   - **Bericht:** Optionele aanvullende informatie
3. Klik op "Versturen"

**Email Inhoud:**
- HTML email met professionele styling
- Rooster informatie in tabel vorm
- Samenvatting van diensten en uren
- Eventueel aangepast bericht
- Contactgegevens

**Huidige Status:**
- Demo mode: Emails worden gelogd maar niet daadwerkelijk verstuurd
- Voor productie gebruik moet een email service worden geconfigureerd

## Technische Implementatie

### Bestanden

1. **`src/components/ui/PrintableSchedule.tsx`**
   - React component voor print layout
   - Bevat alle styling voor print versie

2. **`src/app/dashboard/schedule/page.tsx`**
   - Hoofdpagina met print en email knoppen
   - Print functionaliteit via `handlePrint()`
   - Email modal en functionaliteit

3. **`src/app/api/schedule/email/route.ts`**
   - API endpoint voor email functionaliteit
   - Momenteel in demo mode

### Gebruikte Technologieën

- **Print:** Browser native print API
- **Email:** REST API endpoint (klaar voor email service integratie)
- **Styling:** Tailwind CSS met print-specific classes
- **Icons:** Heroicons (PrinterIcon, EnvelopeIcon)

## Email Service Integratie

Voor productie gebruik kan de email functionaliteit worden uitgebreid met:

### Aanbevolen Email Services:

1. **SendGrid**
   ```bash
   npm install @sendgrid/mail
   ```

2. **Resend**
   ```bash
   npm install resend
   ```

3. **Nodemailer + SMTP**
   ```bash
   npm install nodemailer
   ```

4. **AWS SES**
   ```bash
   npm install @aws-sdk/client-ses
   ```

### Environment Variables

Voor email functionaliteit voeg toe aan `.env.local`:

```env
# Voor SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key

# Voor SMTP (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@jobflow.nl

# Voor Resend
RESEND_API_KEY=your_resend_api_key
```

## Gebruikerservaring

### Voor Admins/Managers:

1. **Print Workflow:**
   - Navigeer naar rooster pagina
   - Selecteer gewenste datum
   - Klik "Printen" knop
   - Print dialog opent automatisch

2. **Email Workflow:**
   - Navigeer naar rooster pagina
   - Selecteer gewenste datum
   - Klik "Emailen" knop
   - Vul ontvangers in
   - Optioneel: pas onderwerp en bericht aan
   - Klik "Versturen"

### Toegankelijkheid:

- Print en email knoppen zijn alleen zichtbaar als er diensten zijn ingepland
- Duidelijke feedback bij acties
- Loading states tijdens email verzending
- Error handling met gebruiksvriendelijke berichten

## Toekomstige Uitbreidingen

Mogelijke verbeteringen:

1. **Bulk Email:**
   - Automatisch alle medewerkers van een dienst emailen
   - Email templates voor verschillende doeleinden

2. **PDF Generatie:**
   - PDF export functionaliteit
   - Bijlagen voor emails

3. **Email Templates:**
   - Verschillende templates voor verschillende situaties
   - Personalisatie per ontvanger

4. **Scheduling:**
   - Automatisch roosters emailen op vaste tijden
   - Herinneringen voor komende diensten

5. **Analytics:**
   - Tracking van email opens/clicks
   - Print statistieken

## Troubleshooting

### Print Problemen:
- **Pop-up blocker:** Zorg dat pop-ups zijn toegestaan
- **Print preview:** Controleer browser print instellingen
- **Styling:** Print CSS wordt automatisch toegepast

### Email Problemen:
- **Demo mode:** Emails worden momenteel alleen gelogd
- **Validatie:** Controleer email adres formaat
- **API errors:** Check browser console voor details

## Support

Voor vragen over de print en email functionaliteit:
- Check browser console voor error logs
- Controleer network tab voor API calls
- Bekijk server logs voor email debugging 