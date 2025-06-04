# 🚀 Vercel Deployment Gids - JobFlow

## 📋 **Voor Deployment Checklist**

### ✅ **KRITIEKE BEVEILIGINGSCHECKS**
- [ ] Build succesvol (`npm run build`)
- [ ] Alle beveiligingsfixes geïmplementeerd
- [ ] Environment variables voorbereid
- [ ] Database configured
- [ ] NEXTAUTH_SECRET gegenereerd (32+ karakters)

---

## 🎯 **STAP-VOOR-STAP DEPLOYMENT**

### **1. Database Setup (Kies één optie)**

#### **Optie A: PlanetScale (Aanbevolen)**
```bash
# 1. Ga naar planetscale.com
# 2. Maak database aan: jobflow-production
# 3. Kopieer connection string
# 4. Vervang in .env.production.template
```

#### **Optie B: Supabase PostgreSQL**
```bash
# 1. Ga naar supabase.com
# 2. Nieuw project: JobFlow
# 3. Kopieer connection string uit Settings > Database
# 4. Vervang in .env.production.template
```

#### **Optie C: Neon (PostgreSQL Serverless)**
```bash
# 1. Ga naar neon.tech
# 2. Maak database aan
# 3. Kopieer connection string
# 4. Vervang in .env.production.template
```

---

### **2. Environment Secrets Genereren**

```bash
# NEXTAUTH_SECRET genereren (32+ karakters)
openssl rand -base64 32

# VAPID keys voor push notifications (optioneel)
npx web-push generate-vapid-keys
```

---

### **3. Vercel Deployment**

#### **Via Vercel CLI (Aanbevolen)**
```bash
# 1. Installeer Vercel CLI
npm i -g vercel

# 2. Login bij Vercel
vercel login

# 3. Deploy naar Vercel
vercel

# 4. Volg de setup wizard:
# - Link to existing project? N
# - Project name: jobflow-2025 (of jouw keuze)
# - Directory: ./
# - Override settings? N
```

#### **Via GitHub (Alternatief)**
```bash
# 1. Push naar GitHub repository
git add .
git commit -m "🚀 Ready for Vercel deployment"
git push origin main

# 2. Ga naar vercel.com
# 3. Import GitHub repository
# 4. Configureer environment variables
```

---

### **4. Environment Variables in Vercel**

**Ga naar Vercel Dashboard > Project > Settings > Environment Variables**

**🚨 KRITIEKE VARIABELEN (VEREIST):**
```
NODE_ENV = production
NEXTAUTH_SECRET = [jouw-32-karakter-secret]
NEXTAUTH_URL = https://jouw-app.vercel.app
DATABASE_URL = [jouw-database-connection-string]
ALLOW_SETUP = false
ALLOW_SEEDING = false
```

**🔒 BEVEILIGINGSVARIABELEN:**
```
RATE_LIMIT_ENABLED = true
RATE_LIMIT_WINDOW_MS = 60000
RATE_LIMIT_MAX_REQUESTS = 100
IP_VALIDATION_ENABLED = true
AUDIT_LOGGING_ENABLED = true
ENABLE_REGISTRATION = false
```

**📧 EMAIL (OPTIONEEL):**
```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = [jouw-email]
SMTP_PASS = [app-password]
SMTP_FROM = noreply@jouw-bedrijf.nl
```

---

### **5. Database Migratie**

```bash
# Na deployment, push database schema
npx prisma db push

# Optioneel: Seed initial data (alleen development!)
# NIET uitvoeren in productie!
```

---

### **6. Custom Domain (Optioneel)**

**In Vercel Dashboard > Project > Settings > Domains:**
```
1. Voeg custom domain toe: jobflow.jouw-bedrijf.nl
2. Configureer DNS bij jouw provider:
   - Type: CNAME
   - Name: jobflow
   - Value: cname.vercel-dns.com
3. Update NEXTAUTH_URL naar custom domain
```

---

## 🔒 **NA DEPLOYMENT BEVEILIGINGSCHECK**

### **1. Test Beveiligingsendpoints**
```bash
# Setup endpoint moet disabled zijn
curl https://jouw-app.vercel.app/api/admin/setup
# Verwacht: 403 Forbidden

# Security audit uitvoeren (als admin)
curl https://jouw-app.vercel.app/api/admin/security-audit
```

### **2. SSL/HTTPS Verificatie**
```bash
# Check SSL certificate
curl -I https://jouw-app.vercel.app
# Verwacht: 200 OK met security headers
```

### **3. Performance Test**
```bash
# Check loading speed
curl -w "@curl-format.txt" -o /dev/null -s https://jouw-app.vercel.app
```

---

## 🚨 **PRODUCTIE VEILIGHEID**

### **✅ AUTOMATISCH BEVEILIGD:**
- Setup endpoints uitgeschakeld
- Seed endpoints uitgeschakeld  
- Debug mode uit
- Rate limiting actief
- Security headers ingesteld

### **⚠️ HANDMATIG CONTROLEREN:**
- [ ] Database connection SSL enabled
- [ ] Alle environment variables correct
- [ ] Geen hardcoded secrets
- [ ] Admin accounts beveiligd
- [ ] Default passwords vervangen

---

## 🔧 **TROUBLESHOOTING**

### **Build Errors**
```bash
# Lokaal builden om errors te debuggen
npm run build

# Check environment variables
cat .env.production.template
```

### **Database Connection Errors**
```bash
# Test database connection
npx prisma db push --preview-feature

# Check connection string format
echo $DATABASE_URL
```

### **Authentication Errors**
```bash
# NEXTAUTH_SECRET te kort
# NEXTAUTH_URL verkeerd ingesteld
# Check Vercel environment variables
```

---

## 📊 **MONITORING SETUP**

### **Vercel Analytics (Gratis)**
```bash
# Ga naar Vercel Dashboard > Project > Analytics
# Schakel in voor performance monitoring
```

### **Error Tracking (Optioneel)**
```bash
# Sentry setup
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Google Analytics
GA_TRACKING_ID=G-XXXXXXXXXX
```

---

## 🎉 **DEPLOYMENT VOLTOOID!**

**Je JobFlow applicatie draait nu veilig op:**
- 🌍 **URL:** https://jouw-app.vercel.app
- 🔒 **Beveiliging:** Productie-klaar
- 📊 **Performance:** Geoptimaliseerd
- 🚀 **Auto-scaling:** Vercel edge network

### **Volgende Stappen:**
1. 👥 Maak admin account aan
2. 📝 Configureer bedrijfsinstellingen  
3. 👷 Voeg medewerkers toe
4. 📅 Setup roosters
5. 🎯 Begin met shift planning!

---

## 📞 **Support**

**Deployment Issues:**
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs

**Database Issues:**
- PlanetScale: https://planetscale.com/docs
- Supabase: https://supabase.com/docs
- Neon: https://neon.tech/docs 