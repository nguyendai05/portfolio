import { Project } from '../types';

// PROJECTS: Based on student coursework and labs
export const PROJECTS: Project[] = [
  {
    id: 1,
    title: "HCI EXPERIMENTS",
    category: "University Coursework",
    image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=2555&auto=format&fit=crop",
    description: "A collection of Human-Computer Interaction exercises exploring user flow, layout hierarchies, and navigation structures. Built as part of the HCI curriculum at Nong Lam University.",
    technologies: ["HTML5", "CSS3", "Wireframing", "UI Principles"],
    link: "https://github.com/Xuni-Dizan/Human_Computer_Interaction",
    featured: true,
    phases: ["Research", "Prototyping", "Implementation"]
  },
  {
    id: 2,
    title: "DIGITAL IDENTITY",
    category: "Personal Website",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=2669&auto=format&fit=crop",
    description: "My personal corner of the web. A static site playground used to practice sectioning, multimedia embedding, and responsive design techniques. The foundation of my front-end journey.",
    technologies: ["HTML", "CSS", "JavaScript", "Responsive Design"],
    link: "https://github.com/Xuni-Dizan/Trang_ca_nhan",
    featured: true,
    phases: ["Design", "Development", "Deployment"]
  },
  {
    id: 3,
    title: "DOM LABS",
    category: "JavaScript Practice",
    image: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?q=80&w=2574&auto=format&fit=crop",
    description: "A series of raw JavaScript experiments. Focusing on DOM manipulation, event handling, and logic implementation without the crutch of modern frameworks. Pure functional exploration.",
    technologies: ["Vanilla JS", "DOM API", "Event Handling"],
    link: "https://github.com/Xuni-Dizan/lab1-nhom2"
  },
  {
    id: 4,
    title: "UI SANDBOX",
    category: "R&D",
    image: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=2574&auto=format&fit=crop",
    description: "Small, isolated UI components and animations. Where I break CSS to see how it works.",
    technologies: ["CSS Animations", "Keyframes", "Experimental Layouts"],
    link: "#"
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