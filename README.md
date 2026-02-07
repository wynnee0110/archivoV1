# 🌐 AR Blog - Next.js Social Media Platform

![Project Status](https://img.shields.io/badge/Status-Active-success)
![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC)

A modern, full-featured social media application built with **Next.js 16** and **Supabase**. It features real-time interactions, a rich user interface with dark mode, and unique customization options like animated avatar borders.

---

## 📸 Screenshots

*(Place screenshots of your Home Feed and Profile Page here)*

---

## ✨ Features

### 👤 User Experience
* **Authentication:** Secure Sign-up and Login powered by Supabase Auth.
* **Custom Profiles:** Edit bio, website, and upload avatars.
* **✨ Legendary Borders:** unique feature allowing users to unlock animated avatar borders (Rainbow, Glitch, Galaxy, Neon, etc.).
* **Dark/Light Mode:** Fully responsive theme toggle using Tailwind v4.

### 📝 Content & Interaction
* **Create Posts:** Rich text posts with image attachments.
* **Social Feed:** Infinite scroll-style feed of community posts.
* **Likes & Comments:** Real-time social interactions.
* **Follow System:** Follow/Unfollow users to curate your feed.
* **Search Engine:** Dual-search capability to find **Posts** (by content) and **People** (by username) simultaneously.

### ⚙️ Technical Highlights
* **Real-time Notifications:** Alerts for likes, comments, and follows.
* **Optimistic UI:** Instant feedback on likes and follows before server confirmation.
* **Responsive Design:** Mobile-first layout using Tailwind CSS.

---

## 🛠️ Tech Stack

This project uses the latest web technologies for performance and scalability.

| Category | Technology | Usage |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) | Core application framework |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Type safety and logic |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Styling and Dark Mode |
| **Icons** | [Lucide React](https://lucide.dev/) | Beautiful, consistent SVG icons |
| **Backend** | [Supabase](https://supabase.com/) | PostgreSQL Database & Auth |
| **Storage** | Supabase Storage | Image hosting for Avatars/Posts |
| **Deployment** | [Vercel](https://vercel.com/) | Hosting and CI/CD |

---

## 🏗️ Architecture

The app follows a modern Serverless architecture.

* **Frontend:** Next.js handles routing and UI rendering. It uses React Server Components (RSC) for data fetching and Client Components for interactivity.
* **Backend:** Supabase acts as the "Backend-as-a-Service," providing:
    * **Postgres DB:** Relational data for users, posts, and follows.
    * **Auth:** Handling JWTs and user sessions.
    * **Storage:** S3-compatible bucket for user uploads.



---

## 🚀 Getting Started

Follow these steps to run the project locally.

### 1. Prerequisites
* Node.js 18+ installed.
* A [Supabase](https://supabase.com/) account.

### 2. Clone the Repository
```bash
git clone [https://github.com/your-username/ar-blog.git](https://github.com/your-username/ar-blog.git)
cd ar-blog
