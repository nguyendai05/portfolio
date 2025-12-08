import { Project } from '../types';

// TOOLS: Personal utility tools and applications
// Currently empty - tools are fetched from database
export const TOOLS: Project[] = [];

// PROJECTS: Real personal and team web projects from GitHub + latest Next.js portfolio
export const PROJECTS: Project[] = [
  {
    id: 1,
    title: "Personal Portfolio – DIZAN",
    category: "Personal Website",
    image: "https://res.cloudinary.com/dak4x4d7u/image/upload/f_auto,q_auto,w_800/v1763799129/Screenshot_2025-11-22_113653_ex7oun.png",
    description:
      "My first personal website branded as DIZAN, featuring an introduction, skills, project highlights, and a playful lab page for experiments. Built as a foundation for practicing semantic HTML, responsive layouts, and personal branding on the web.",
    technologies: ["HTML5", "CSS3", "JavaScript", "Responsive Design", "Video Integration"],
    link: "https://xuni-dizan.github.io/Trang_ca_nhan/",
    featured: true,
    phases: ["Concept", "Design", "Development", "Deployment"],
  },
  {
    id: 2,
    title: "Christmas Gift for Crush",
    category: "Creative Mini Project",
    image: "https://res.cloudinary.com/dak4x4d7u/image/upload/f_auto,q_auto,w_800/v1763799127/Screenshot_2025-11-22_145743_xzhvlr.png",
    description:
      "An interactive Christmas-themed mini-site created as a digital gift, with music, snow effects, and messages revealed step by step. I focused on micro-interactions, CSS animations, and emotional storytelling to deliver a memorable surprise experience.",
    technologies: ["HTML5", "CSS3", "JavaScript", "Animation", "Audio Integration"],
    link: "https://xuni-dizan.github.io/web_noel/",
    phases: ["Concept", "Animation Design", "Implementation"],
  },
  {
    id: 3,
    title: "Flick Tale Movie Website",
    category: "Movie UI / Frontend",
    image: "https://res.cloudinary.com/dak4x4d7u/image/upload/f_auto,q_auto,w_800/v1763799127/Screenshot_2025-11-22_150710_ceku1x.png",
    description:
      "A responsive movie-browsing interface inspired by modern streaming platforms. Features hero banners, categorized sections, hover cards, and clean typography. Built to practice complex grid/flex layouts, card design, and basic search/filter UX patterns.",
    technologies: ["HTML5", "CSS3", "JavaScript", "Responsive Design", "Grid Layout", "UI/UX"],
    link: "https://xuni-dizan.github.io/WebPhim/",
    featured: true,
    phases: ["Research", "Wireframing", "Implementation", "Testing"],
  },
  {
    id: 4,
    title: "HCI Group 10 Course Portal",
    category: "University Group Project",
    image: "https://res.cloudinary.com/dak4x4d7u/image/upload/f_auto,q_auto,w_800/v1763799128/Screenshot_2025-11-22_150936_hxjruf.png",
    description:
      "Final group project website for the Human–Computer Interaction course. Acts as a mini portal for the class: presenting members, project briefs, design iterations, and final deliverables. The UI applies layout, color, accessibility, and usability principles learned throughout the HCI curriculum.",
    technologies: ["HTML5", "CSS3", "JavaScript", "UI/UX", "Accessibility", "Team Collaboration"],
    link: "https://duyhuunguyen.github.io/GroupWeb/GroupWeb/public/home.html",
    phases: ["Planning", "Team Collaboration", "Design", "Delivery"],
  },
  {
    id: 5,
    title: "Handmade Craft Shop – Group 10",
    category: "Team E-commerce Project",
    image: "https://res.cloudinary.com/dak4x4d7u/image/upload/f_auto,q_auto,w_800/v1763799127/Screenshot_2025-11-22_151116_af4prv.png",
    description:
      "A collaborative e-commerce website for a handmade craft shop, with hero banners, category sections, detailed product cards, and a simple cart UI (static). We focused on clean product catalog layout, consistent pricing displays, and responsive behavior on both mobile and desktop.",
    technologies: ["HTML5", "CSS3", "JavaScript", "Responsive Design", "Flexbox", "E-commerce UI"],
    link: "https://dhphuc211.github.io/WebShop-Handmake-Group10/",
    featured: true,
    phases: ["Planning", "Team Collaboration", "Implementation", "Deployment"],
  },
  {
    id: 6,
    title: "Dizan – Experience Studio (Next.js Portfolio)",
    category: "Next.js Portfolio Website",
    // TODO: replace with a real screenshot of the Next.js portfolio
    image: "https://res.cloudinary.com/dak4x4d7u/image/upload/f_auto,q_auto,w_800/v1763802953/Screenshot_2025-11-22_161516_l9sn2e.png",
    description:
      "The latest version of my personal portfolio, Dizan – Experience Studio, built with Next.js, TypeScript, Tailwind CSS, and Framer Motion. It showcases my services, recent projects, and contact information with a clean, responsive layout. Deployed on Vercel as the central hub for my full-stack work.",
    technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Framer Motion", "Vercel"],
    link: "https://my-portfolio-gamma-two-84.vercel.app/",
    featured: true,
    phases: ["Information Architecture", "UI Design", "Implementation", "Animation Polish", "Deployment"],
  },
];

export const CLIENTS = [
  "HTML5",
  "CSS3",
  "JAVASCRIPT",
  "REACT",
  "NEXT.JS",
  "TYPESCRIPT",
  "NODE.JS",
  "EXPRESS.JS",
  "POSTGRESQL",
  "MONGODB",
  "GIT",
  "GITHUB",
  "VS CODE",
  "FIGMA",
  "TAILWIND CSS",
  "FRAMER MOTION",
  "VERCEL",
];

// AWARDS: Re-purposed as "MILESTONES"
export const AWARDS = [
  { year: "2023", org: "Nong Lam University", project: "Enrollment", award: "Started IT Degree" },
  { year: "2024", org: "Web Dev", project: "First Site", award: "Hello World" },
  { year: "2024", org: "HCI Course", project: "Assignments", award: "UI Fundamentals" },
  { year: "2025", org: "Self-Taught", project: "React & Next.js", award: "Modern Stack Transition" },
];

export const EXPERIMENTS = [
  { id: "01", name: "Hover Effects", desc: "CSS & Framer Motion transition studies" },
  { id: "02", name: "Forms", desc: "Validation, UX copy, and edge cases" },
  { id: "03", name: "Layouts", desc: "Grid vs Flexbox and responsive patterns" },
];
