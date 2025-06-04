# ⚡ 2-MINUTEN DATABASE SETUP

## 🚀 **OPTIE 1: NEON (SNELST - AANBEVOLEN)**

### **Stap-voor-stap (2 minuten):**
1. **Open:** https://neon.tech
2. **Klik:** "Sign up" → Kies GitHub
3. **Create Database:**
   - Database name: `jobflow`
   - Region: `EU West (Amsterdam)` 
4. **Connection String kopiëren:**
   - Ga naar Dashboard
   - Klik op database "jobflow"
   - Tab "Connection Details"
   - Copy "Connection string"
   
### **Resultaat ziet er zo uit:**
```
postgresql://username:password@ep-xxx-xxx.eu-west-1.aws.neon.tech/jobflow?sslmode=require
```

---

## 🚀 **OPTIE 2: PLANETSCALE (MYSQL)**

### **Stap-voor-stap:**
1. **Open:** https://planetscale.com
2. **Sign up** met GitHub
3. **Create database:** 
   - Name: `jobflow`
   - Region: `EU West`
4. **Connection string:**
   - Go to "Connect" 
   - Select "Prisma"
   - Copy connection string

### **Resultaat ziet er zo uit:**
```
mysql://username:password@aws.connect.psdb.cloud/jobflow?sslaccept=strict
```

---

## 🚀 **OPTIE 3: SUPABASE (POSTGRESQL + FEATURES)**

### **Stap-voor-stap:**
1. **Open:** https://supabase.com
2. **New project:** "JobFlow"
3. **Wacht 2 minuten** voor setup
4. **Connection string:**
   - Settings → Database
   - "Connection string" → "URI"
   - Copy de string

### **Resultaat ziet er zo uit:**
```
postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

---

## ✅ **WAT TE DOEN MET DE CONNECTION STRING:**

1. **Copy** je database connection string
2. **Ga naar terminal**
3. **Run:** `node scripts/setup-vercel-env.js`
4. **Plak** de connection string wanneer gevraagd
5. **Wacht** op automatische setup

**Dat is alles!** 🎉 