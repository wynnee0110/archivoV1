# 🌐 Archive - Next.js Social Media Platform

![Project Status](https://img.shields.io/badge/Status-Active-success?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

> A modern, serverless social media application built for performance and scale.

**AR Blog** is a full-stack platform featuring real-time interactions, a rich user interface with dark mode, and unique customization options like animated "Legendary" avatar borders.

---

## 📚 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Database Setup (SQL)](#-database-setup-sql)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 👤 User Experience
* **Authentication:** Secure Sign-up, Login, and Logout powered by Supabase Auth.
* **Custom Profiles:** Users can edit their bio, website, and upload profile pictures.
* **✨ Legendary Borders:** Unique gamified feature allowing users to unlock animated avatar borders (Rainbow, Glitch, Galaxy, Neon, etc.).
* **Dark/Light Mode:** Fully responsive theme toggle using `next-themes` and Tailwind v4.

### 📝 Content & Interaction
* **Rich Posts:** Create text posts with optional image attachments.
* **Infinite Feed:** A smooth scrolling feed of community posts.
* **Social Actions:** Real-time **Likes** and **Comments**.
* **Follow System:** Follow/Unfollow users to build your network.
* **Smart Search:** Dual-search engine finding **Posts** (by content) and **People** (by username) simultaneously.

### ⚙️ Technical Highlights
* **Optimistic UI:** Instant feedback on interactions before server confirmation.
* **Real-time Notifications:** Alerts for new followers and interactions.
* **Responsive Design:** Mobile-first layout optimized for all devices.
* **Server Components:** Utilizing Next.js 16 App Router for optimal performance.

---

## 🛠️ Tech Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) | App Router, Server Components |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Static typing for reliability |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first CSS framework |
| **Database** | [Supabase](https://supabase.com/) | Postgres Database & Auth |
| **Icons** | [Lucide React](https://lucide.dev/) | Consistent SVG iconography |
| **State** | React Hooks | `useState`, `useEffect`, `Suspense` |
| **Deployment** | [Vercel](https://vercel.com/) | CI/CD and Edge Network |

---

## 🏗️ Architecture

The app follows a modern Serverless architecture:

* **Frontend:** Next.js handles routing and UI rendering. It uses React Server Components (RSC) for data fetching and Client Components for interactivity.
* **Backend:** Supabase acts as the "Backend-as-a-Service," providing:
    * **Postgres DB:** Relational data for users, posts, and follows.
    * **Auth:** Handling JWTs and user sessions.
    * **Storage:** S3-compatible bucket for user uploads.

---

## 📂 Project Structure

```bash
├── app/
│   ├── auth/           # Login & Signup pages
│   ├── profile/        # User profile & editing logic
│   ├── search/         # Search page with Suspense
│   ├── globals.css     # Global styles & Tailwind variants
│   ├── layout.tsx      # Root layout & ThemeProvider
│   └── page.tsx        # Main Feed (Home)
├── components/
│   ├── PostCard.tsx    # Main feed item component
│   ├── Header.tsx      # Navigation & Search bar
│   └── ...             # Reusable UI components
├── lib/
│   └── supabaseClient.ts # Supabase connection client
├── public/             # Static assets
└── package.json        # Dependencies

```
## 🚀 Getting Started
Follow these steps to run the project locally.

1. Prerequisites
Node.js 18+ installed.

A Supabase account.

2. Clone the Repository

```bash
git clone [https://github.com/your-username/ar-blog.git](https://github.com/your-username/ar-blog.git)
cd ar-blog
```
## 3. Install Dependencies

```bash
npm install
```

## 4. Configure Environment Variables
Create a .env.local file in the root directory:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
## 5. Run the App
```bash
npm run dev
```
Open http://localhost:3000 in your browser.

### 🗄️ Database Setup (SQL)
To make the app work, you need to set up the tables in Supabase. Go to your Supabase Dashboard -> SQL Editor and run this script:

<details> <summary><strong>🔻 Click to expand SQL Schema</strong></summary>

SQL
-- 1. Create Profiles Table
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  bio text,
  border_variant text default 'none',
  updated_at timestamp with time zone
);

-- 2. AUTOMATION: Create Profile on Signup (Crucial!)
-- This ensures every new user gets a row in the profiles table automatically
create function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Create Posts Table
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text,
  content text,
  image_url text,
  author_id uuid references public.profiles(id) not null
);

-- 4. Create Follows Table
create table public.follows (
  follower_id uuid references public.profiles(id) not null,
  following_id uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (follower_id, following_id)
);

-- 5. Enable Storage
-- Go to Storage -> Create new bucket named 'avatars' (Public)
-- Go to Storage -> Create new bucket named 'posts' (Public)
</details>

## 🤝 Contributing
-- Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.
```bash
Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request
```

## 🤖 AI Assistance
```bash
This project was built with the assistance of AI Thought Partners (Gemini/ChatGPT) to accelerate development.

Mock Data Generation: SQL scripts for populating the feed.

Complex CSS: "Galaxy" and "Glitch" border animations.

Debugging: Resolving Next.js hydration and Vercel build errors.

📜 License
Distributed under the MIT License. See LICENSE for more information.
```
