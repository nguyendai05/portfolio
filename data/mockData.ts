import { Project } from '../types';

// PROJECTS: Real personal and team web projects from GitHub
export const PROJECTS: Project[] = [
  {
    id: 1,
    title: "Personal Portfolio – DIZAN",
    category: "Personal Website",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=2669&auto=format&fit=crop",
    description: "My digital identity branded as DIZAN, featuring sections for Home, About, Lab, and Results. A personal website showcasing my journey as an IT student at Nong Lam University, complete with contact information and a video-based hero experience. This project served as the foundation for learning responsive design and personal branding.",
    technologies: ["HTML5", "CSS3", "JavaScript", "Responsive Design", "Video Integration"],
    link: "https://xuni-dizan.github.io/Trang_ca_nhan/",
    featured: true,
    phases: ["Concept", "Design", "Development", "Deployment"]
  },
  {
    id: 2,
    title: "Christmas Gift for Crush",
    category: "Creative Mini Project",
    image: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?q=80&w=2669&auto=format&fit=crop",
    description: "An interactive Christmas-themed mini-site with playful romance elements. Features animated UI components, rating inputs, and heart icons with toggleable background music. Built as a creative gift project focusing on micro-interactions, animations, and emotional UX design.",
    technologies: ["HTML5", "CSS3", "JavaScript", "Animation", "Audio Integration"],
    link: "https://xuni-dizan.github.io/web_noel/",
    phases: ["Concept", "Animation Design", "Implementation"]
  },
  {
    id: 3,
    title: "Flick Tale Movie Website",
    category: "Movie UI / Frontend",
    image: "https://images.unsplash.com/photo-1574267432644-f610a75d3752?q=80&w=2669&auto=format&fit=crop",
    description: "A responsive movie browsing platform featuring categories for standalone films and series, including anime and 2D/3D content. Implements comprehensive search and filter controls by genre, format, year, and rating, with sort options for latest releases and highest-rated titles. Built to practice complex UI layouts and filtering UX patterns.",
    technologies: ["HTML5", "CSS3", "JavaScript", "Responsive Design", "Grid Layout", "UI/UX"],
    link: "https://xuni-dizan.github.io/WebPhim/",
    featured: true,
    phases: ["Research", "Wireframing", "Implementation", "Testing"]
  },
  {
    id: 4,
    title: "HCI Group 10 Course Portal",
    category: "University Group Project",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2670&auto=format&fit=crop",
    description: "Final project website for the Human-Computer Interaction course at Nong Lam University. A comprehensive multi-page portal featuring team member introductions, group diary, technical documentation, style guides, and blog content. Emphasizes collaborative development, information architecture, and usability principles learned throughout the HCI curriculum.",
    technologies: ["HTML5", "CSS3", "JavaScript", "UI/UX", "Accessibility", "Team Collaboration"],
    link: "https://duyhuunguyen.github.io/GroupWeb/GroupWeb/public/home.html",
    phases: ["Planning", "Team Collaboration", "Design", "Delivery"]
  },
  {
    id: 5,
    title: "Handmade Craft Shop – Group 10",
    category: "Team E-commerce Project",
    image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?q=80&w=2670&auto=format&fit=crop",
    description: "A collaborative e-commerce platform showcasing Vietnamese handmade crafts including bamboo weaving, ceramics, woodwork, jewelry, and decorative gifts. Features a hero section emphasizing Vietnamese cultural aesthetics, category navigation, promotional discounts, featured products grid, and news section. Built as a team project focusing on product catalog layout, pricing displays, and responsive design.",
    technologies: ["HTML5", "CSS3", "JavaScript", "Responsive Design", "Flexbox", "E-commerce UI"],
    link: "https://dhphuc211.github.io/WebShop-Handmake-Group10/",
    featured: true,
    phases: ["Planning", "Team Collaboration", "Implementation", "Deployment"]
  }
];

// CLIENTS: Re-purposed as "TECH STACK" for the marquee
export const CLIENTS = ["HTML5", "CSS3", "JAVASCRIPT", "REACT", "TYPESCRIPT", "GIT", "GITHUB", "VS CODE", "FIGMA", "TAILWIND"];

// AWARDS: Re-purposed as "MILESTONES"
export const AWARDS = [
  { year: "2023", org: "Nong Lam University", project: "Enrollment", award: "Started IT Degree" },
  { year: "2024", org: "Web Dev", project: "First Site", award: "Hello World" },
  { year: "2024", org: "HCI Course", project: "Assignments", award: "UI Fundamentals" },
  { year: "2025", org: "Self-Taught", project: "React", award: "Learning Phase" },
];

export const EXPERIMENTS = [
  { id: "01", name: "Hover Effects", desc: "CSS transition studies" },
  { id: "02", name: "Forms", desc: "Validation & Logic" },
  { id: "03", name: "Layouts", desc: "Grid vs Flexbox" },
];