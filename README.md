# 🐕 Sniffr ATX

> Safe, casual connections for dog owners - without exchanging phone numbers.

[![React Native](https://img.shields.io/badge/React_Native-Expo-blue)](https://expo.dev/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-green)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

## 🎯 The Problem

Dog parks are inherently social - you see the same people, your dogs play together, you chat about breeds and toys. But exchanging phone numbers with someone you just met feels like too much commitment. Most dog owners want a low-friction way to stay connected with park friends without the awkwardness.

## 💡 The Solution

Sniffr ATX lets dog owners connect via QR code exchange at the park. Share your profile, not your phone number. Stay connected with your dog's friends (and their humans) through the app.

## ✨ MVP Features (v1.0)

- **User & Dog Profiles** - Create profiles for yourself and your pup
- **QR Code Exchange** - Generate your unique QR, scan others to connect
- **Connections List** - See all your park friends in one place
- **In-App Messaging** - Chat without sharing personal contact info
- **Favorite Places** - Show where you frequent with your dog

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React Native (Expo) |
| **Navigation** | Expo Router |
| **Backend** | Supabase (Auth, Database, Storage, Realtime) |
| **Styling** | NativeWind (Tailwind CSS) |
| **QR Code** | react-native-qrcode-svg, expo-camera |

## 📁 Project Structure

```
sniffr-atx/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Auth screens (login, signup)
│   ├── (tabs)/            # Main tab navigation
│   │   ├── index.tsx      # Home/Connections
│   │   ├── scan.tsx       # QR Scanner
│   │   ├── messages.tsx   # Conversations
│   │   └── profile.tsx    # User profile
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
├── lib/                   # Utilities & configs
│   ├── supabase.ts       # Supabase client
│   └── types.ts          # TypeScript types
├── hooks/                 # Custom React hooks
├── assets/               # Images, fonts
└── docs/                 # Documentation
```

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/1-20-15-11-1-4/sniffr-atx.git
cd sniffr-atx

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Supabase credentials to .env

# Start the development server
npx expo start
```

## 📱 Development

```bash
# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Run on physical device
npx expo start --tunnel
```

## 🗄 Database Schema

See [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) for complete Supabase schema.

## 📋 Documentation

- [Product Requirements (PRD)](docs/PRD.md)
- [Technical Architecture](docs/ARCHITECTURE.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [API Design](docs/API_DESIGN.md)
- [7-Day Sprint Plan](docs/7_DAY_SPRINT.md)

## 🎯 Target Market

**Austin, Texas** - One of the highest dog ownership rates in the US:
- 75% of households own pets
- 68% of pet households have dogs
- 712,000+ pet-owning households
- Strong dog park culture (Red Bud Isle, Auditorium Shores, Zilker, etc.)

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 👤 Author

**Dakota St. Pierre**
- GitHub: [@1-20-15-11-1-4](https://github.com/1-20-15-11-1-4)

---

Built with ❤️ in Austin, TX 🤘
