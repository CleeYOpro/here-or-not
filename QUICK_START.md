# Quick Start - Get Your Database Running in 5 Minutes

## 1. Install Dependencies (if not done)
```bash
npm install
```

## 2. Create Neon Database
1. Go to https://neon.tech and sign up
2. Click "Create Project"
3. Copy the connection string (looks like `postgresql://...`)

## 3. Create .env File
Create a file called `.env` in your project root:

```env
DATABASE_URL="paste_your_neon_connection_string_here"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="changeme123"
```

## 4. Initialize Database
```bash
npx prisma generate
npx prisma db push
```

This creates all your tables automatically in Neon!

## 5. Add Test Data (Optional)
```bash
npm install -D tsx
npx tsx prisma/seed.ts
```

This creates:
- Admin: username `admin`, password `admin123`
- 2 teachers with students
- Sample attendance records

## 6. Run Your App
```bash
npm run dev
```

Visit http://localhost:3000

## That's It!

Your app now:
- ✅ Saves data to Neon database
- ✅ Data persists across page refreshes
- ✅ Works from localhost
- ✅ Ready to deploy to Vercel

## View Your Data
```bash
npx prisma studio
```

Opens a GUI at http://localhost:5555 to see your database.

## Deploy to Vercel
1. Push code to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
4. Deploy!

Same database works for both local dev and production.
