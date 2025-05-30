# JobFlow 2025 - Personnel Management System

Een moderne, real-time personeelsbeheer applicatie gebouwd voor **Broers Verhuur**, **DCRT Event Decorations**, en **DCRT in Building**.

## 🚀 Features

### ✅ Core Functionaliteit
- **Tijdsregistratie** - Real-time start/stop met automatische pauze detectie
- **Team Chat** - Instant messaging met typing indicators en file uploads
- **Beschikbaarheid** - Planning en rooster beheer
- **Project Management** - Toewijzing en voortgang tracking
- **Gebruikersbeheer** - Role-based access control (Admin/Manager/Employee)

### 🔄 Real-time Features
- **WebSocket verbindingen** - Live updates voor alle gebruikers
- **Push notificaties** - Browser notifications voor belangrijke events
- **Live status updates** - Zie wie online is en wat ze doen
- **Instant chat** - Real-time team communicatie
- **Live time tracking** - Directe updates van werkuren

### 📱 PWA Capabilities
- **Offline functionaliteit** - Werk door zonder internetverbinding
- **Installeerbare app** - Native app ervaring op desktop en mobiel
- **Background sync** - Automatische synchronisatie bij verbinding
- **Smart caching** - Optimale performance met intelligente cache strategieën

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, WebSocket (Socket.io)
- **Database**: MySQL met Prisma ORM
- **Authentication**: NextAuth.js
- **Real-time**: Socket.io voor WebSocket verbindingen
- **PWA**: Service Worker met offline support
- **Push**: Web Push API met VAPID keys

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MySQL database
- npm of yarn

### 1. Clone & Install
```bash
git clone [repository-url]
cd jobflow-2025
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

Configureer de volgende environment variables in `.env`:

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/jobflow"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# WebSocket Server
NEXT_PUBLIC_WS_URL="ws://localhost:3001"

# VAPID Keys for Push Notifications
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public-key"
```

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Optional: Add test data
npx prisma db seed
```

### 4. Generate VAPID Keys (for push notifications)
```bash
npx web-push generate-vapid-keys
```
Kopieer de keys naar je `.env` file.

## 🚀 Development

### Start alle services:
```bash
# Start Next.js + WebSocket server
npm run dev:full
```

Of afzonderlijk:
```bash
# Next.js development server (port 3000)
npm run dev

# WebSocket server (port 3001)  
npm run socket
```

## 📱 Usage

### Toegang
- **URL**: http://localhost:3000
- **Test gebruiker**: Maak een account via de registratie pagina
- **Admin functies**: Stel de user role in op "ADMIN" in de database

### Core Features

#### 🕐 Tijdsregistratie
- Start/stop werkdag met één klik
- Automatische pauze detectie
- Real-time updates naar alle teamleden
- GPS locatie (indien ingeschakeld)

#### 💬 Team Chat  
- **Locatie**: http://localhost:3000/dashboard/chat
- **Room types**: Algemeen, Project, Direct messages
- **Features**: 
  - Real-time messaging
  - Typing indicators
  - File uploads
  - Emoji reactions
  - Offline synchronization

#### 👥 Personeel (Admin/Manager)
- Gebruikersbeheer en rollen
- Uren goedkeuring
- Team status overzicht
- Live activiteit monitoring

### PWA Installation
1. Ga naar http://localhost:3000
2. Klik op "Install App" in de browser
3. Of gebruik browser menu > "Install JobFlow"

## 🔧 Architecture

### Real-time Communication
```
Browser (Client) ←→ Next.js (Port 3000) ←→ WebSocket Server (Port 3001)
                                     ↕
                                  Database (MySQL)
```

### WebSocket Events
- `timeUpdate` - Start/stop tijdsregistratie
- `userStatusUpdate` - Online/offline status 
- `chatMessage` - Real-time berichten
- `notification` - Push notificaties
- `projectUpdate` - Project wijzigingen

### PWA Components
- **Service Worker**: `/public/sw.js`
- **Manifest**: `/public/manifest.json`  
- **Offline Page**: `/public/offline.html`

## 🔒 Security

- JWT tokens voor authenticatie
- Role-based access control
- CORS configuratie voor WebSocket
- Input validatie met Zod schemas
- SQL injection preventie via Prisma

## 📊 Monitoring

### Logs
```bash
# WebSocket server logs
pm2 logs socket-server

# Next.js logs  
npm run dev
```

### Health Checks
- **Next.js**: http://localhost:3000/api/health
- **WebSocket**: Connection status in UI (groene/rode dot)
- **Database**: Prisma connection via health endpoint

## 🐛 Troubleshooting

### Common Issues

#### WebSocket connection fails
```bash
# Check if server is running
ps aux | grep socket-server

# Restart WebSocket server
npm run socket
```

#### Database connection errors
```bash
# Check MySQL service
brew services start mysql  # macOS
sudo service mysql start   # Linux

# Verify connection
npx prisma db pull
```

#### Port conflicts
```bash
# Check what's using ports
lsof -i :3000
lsof -i :3001

# Kill processes if needed
kill -9 <PID>
```

#### PWA not installing
1. Check HTTPS (required for PWA)
2. Verify manifest.json is accessible
3. Clear browser cache
4. Check service worker registration in DevTools

### Performance Tips
- **Database**: Add indices voor vaak gebruikte queries
- **WebSocket**: Gebruik rooms voor chat channels
- **PWA**: Cache strategy optimizeren in service worker
- **Images**: Optimaliseer uploads met next/image

## 🤝 Contributing

1. Fork het project
2. Maak een feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit je changes (`git commit -m 'Add AmazingFeature'`)
4. Push naar branch (`git push origin feature/AmazingFeature`)
5. Open een Pull Request

## 📄 License

Dit project is gelicenseerd onder de MIT License - zie [LICENSE](LICENSE) file voor details.

## 🆘 Support

Voor vragen of problemen:
- Maak een GitHub issue aan
- Contact: admin@jobflow.nl

---

**Built with ❤️ for Broers Verhuur, DCRT Event Decorations, and DCRT in Building** 