export const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

export const plans = [
  {
    id: "prod_TffitWtEKT88s6",
    name: "Starter",
    planType: "Starter",
    price: "$8",
    period: "per month",
    description: "Perfect for exploring Edikit and creating your first AI videos",
    features: [
      "80 video generation credits per month",
      "10 template-based videos",
      "16 AI prompt-generated videos",
      "Export in 720p resolution",
      "MP4 video export"
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    id: "prod_Tffkh0QPN6G92B",
    name: "Creator",
    planType: "Creator",
    price: "$22",
    period: "per month",
    description: "Ideal for creators producing content regularly",
    features: [
      "300 video generation credits per month",
      "30 template-based videos",
      "75 AI prompt-generated videos",
      "Full HD 1080p exports",
      "MP4 and MOV export formats",
      "Transparent background support"
    ],
    cta: "Choose Creator",
    popular: true,
  },
  {
    id: "prod_TffnEJPkjRMHpY",
    name: "Studio",
    planType: "Studio",
    price: "$44",
    period: "per month",
    description: "Built for teams, agencies, and power creators",
    features: [
      "600 video generation credits per month",
      "60 template-based videos",
      "120 AI prompt-generated videos",
      "Ultra HD 4K exports",
      "MP4 and MOV export formats",
      "Transparent background support"
    ],
    cta: "Go Studio",
    popular: false,
  },
];

export const categories = [
  "All",
  "Marketing",
  "Social",
  "Branding",
  "Events",
  "Technology",
];

export interface Template {
  id: number;
  name: string;
  description: string;
  previewUrl: string;
  thumbnail?: string;
  category: string;
  fields: {
    [key: string]: {
      type: "text" | "image" | "video";
      label: string;
      maxLength?: number;
      dimensions?: string;
      required: boolean;
    };
  };
}

export const templates: Template[] = [
  {
    id: 1,
    name: "Animation 1",
    description: "Image & Text Template",
    previewUrl: "/previews/animation-1.mp4",
    thumbnail: "/previews/animation 1.png", // Use video as thumbnail
    category: "Social Media",
    fields: {
      text1: { type: "text", label: "Text 1", maxLength: 13, required: true },
      text2: { type: "text", label: "Text 2", maxLength: 13, required: true },
      image1: {
        type: "image",
        label: "Image 1",
        dimensions: "1080x1080",
        required: false,
      },
      image2: {
        type: "image",
        label: "Image 2",
        dimensions: "1080x1080",
        required: false,
      },
      background: {
        type: "image",
        label: "Background",
        dimensions: "2160x3840",
        required: false,
      },
    },
  },
  {
    id: 2,
    name: "Animation 2",
    description: "Icon & Text Template",
    previewUrl: "/previews/animation-2.mp4",
    thumbnail: "/previews/animation 2.png",
    category: "Social Media",
    fields: {
      text1: { type: "text", label: "Text 1", maxLength: 20, required: true },
      icon1: {
        type: "image",
        label: "Icon 1",
        dimensions: "800x800-1920x1920",
        required: false,
      },
      icon2: {
        type: "image",
        label: "Icon 2",
        dimensions: "800x800-1920x1920",
        required: false,
      },
      background: {
        type: "image",
        label: "Background",
        dimensions: "2160x3840",
        required: false,
      },
    },
  },
  {
    id: 3,
    name: "Animation 3",
    description: "Icon & Text Template",
    previewUrl: "/previews/animation-3.mp4",
    thumbnail: "/previews/animation 3.png",
    category: "Social Media",
    fields: {
      icon1: {
        type: "image",
        label: "Icon 1",
        dimensions: "800x800-1920x1920",
        required: false,
      },
      text1: { type: "text", label: "Text 1", maxLength: 8, required: true },
      text2: { type: "text", label: "Text 2", maxLength: 8, required: true },
      background: {
        type: "image",
        label: "Background",
        dimensions: "2160x3840",
        required: false,
      },
    },
  },
  {
    id: 4,
    name: "Animation 4",
    description: "Multiple Icons & Text",
    previewUrl: "/previews/animation-4.mp4",
    thumbnail: "/previews/animation 4.png",
    category: "Social Media",
    fields: {
      text1: { type: "text", label: "Text 1", maxLength: 22, required: true },
      icon1: {
        type: "image",
        label: "Icon 1",
        dimensions: "800x800-1920x1920",
        required: false,
      },
      icon2: {
        type: "image",
        label: "Icon 2",
        dimensions: "800x800-1920x1920",
        required: false,
      },
      icon3: {
        type: "image",
        label: "Icon 3",
        dimensions: "800x800-1920x1920",
        required: false,
      },
      background: {
        type: "image",
        label: "Background",
        dimensions: "2160x3840",
        required: false,
      },
    },
  },
  {
    id: 5,
    name: "Animation 5",
    description: "Two Icons & Text",
    previewUrl: "/previews/animation-5.mp4",
    thumbnail: "/previews/animation 5.png",
    category: "Social Media",
    fields: {
      text1: { type: "text", label: "Text 1", maxLength: 15, required: true },
      text2: { type: "text", label: "Text 2", maxLength: 9, required: false },
      icon1: {
        type: "image",
        label: "Icon 1",
        dimensions: "800x800-1920x1920",
        required: false,
      },
      icon2: {
        type: "image",
        label: "Icon 2",
        dimensions: "800x800-1920x1920",
        required: false,
      },
      background: {
        type: "image",
        label: "Background",
        dimensions: "2160x3840",
        required: false,
      },
    },
  },
  {
    id: 6,
    name: "Animation 6",
    description: "Video & Text Template",
    previewUrl: "/previews/animation-6.mp4",
    thumbnail: "/previews/animation 6.png",
    category: "Video",
    fields: {
      text1: { type: "text", label: "Text 1", maxLength: 15, required: false },
      text2: { type: "text", label: "Text 2", maxLength: 15, required: true },
      text3: { type: "text", label: "Text 3", maxLength: 15, required: false },
      text4: { type: "text", label: "Text 4", maxLength: 15, required: true },
      video1: {
        type: "video",
        label: "Video 1",
        dimensions: "1080x1920",
        required: false,
      },
      background: {
        type: "image",
        label: "Background",
        dimensions: "2160x3840",
        required: false,
      },
    },
  },
  {
    id: 7,
    name: "Animation 7",
    description: "Simple Text Template",
    previewUrl: "/previews/animation-7.mp4",
    thumbnail: "/previews/animation 7.png",
    category: "Social Media",
    fields: {
      text1: { type: "text", label: "Text 1", maxLength: 14, required: false },
      text2: { type: "text", label: "Text 2", maxLength: 8, required: false },
      text3: { type: "text", label: "Text 3", maxLength: 16, required: true },
      background: {
        type: "image",
        label: "Background",
        dimensions: "2160x3840",
        required: false,
      },
    },
  },
  {
    id: 8,
    name: "Animation 8",
    description: "Product Showcase",
    previewUrl: "/previews/animation-8.mp4",
    thumbnail: "/previews/animation 8.png",
    category: "E-commerce",
    fields: {
      image: {
        type: "image",
        label: "Product Image",
        dimensions: "1080x1080",
        required: false,
      },
      text1: { type: "text", label: "Text 1", maxLength: 15, required: true },
      text2: { type: "text", label: "Text 2", maxLength: 12, required: true },
      text3: { type: "text", label: "Text 3", maxLength: 30, required: false },
      background: {
        type: "image",
        label: "Background",
        dimensions: "2160x3840",
        required: false,
      },
    },
  },
  {
    id: 9,
    name: "Animation 9",
    description: "Triple Text Template",
    previewUrl: "/previews/animation-9.mp4",
    thumbnail: "/previews/animation 9.png",
    category: "Social Media",
    fields: {
      text1: { type: "text", label: "Text 1", maxLength: 15, required: true },
      text2: { type: "text", label: "Text 2", maxLength: 15, required: true },
      text3: { type: "text", label: "Text 3", maxLength: 15, required: true },
      background: {
        type: "image",
        label: "Background",
        dimensions: "2160x3840",
        required: false,
      },
    },
  },
  {
    id: 10,
    name: "Animation 10",
    description: "Four Icons & Text",
    previewUrl: "/previews/animation-10.mp4",
    thumbnail: "/previews/animation 10.png",
    category: "Social Media",
    fields: {
      icon1: {
        type: "image",
        label: "Icon 1",
        dimensions: "800x800-1920x1920",
        required: false,
      },
      icon2: {
        type: "image",
        label: "Icon 2",
        dimensions: "800x800-1920x1920",
        required: false,
      },
      icon3: {
        type: "image",
        label: "Icon 3",
        dimensions: "800x800-1920x1920",
        required: false,
      },
      icon4: {
        type: "image",
        label: "Icon 4",
        dimensions: "800x800-1920x1920",
        required: false,
      },
      icon5: {
        type: "image",
        label: "Icon 5",
        dimensions: "800x800-1920x1920",
        required: false,
      },
      text1: { type: "text", label: "Text 1", maxLength: 16, required: true },
      background: {
        type: "image",
        label: "Background",
        dimensions: "2160x3840",
        required: false,
      },
    },
  },
  {
    id: 11,
    name: "Animation 11",
    description: "Social Media Style",
    previewUrl: "/previews/animation-11.mp4",
    thumbnail: "/previews/animation 11.png",
    category: "Social Media",
    fields: {
      icon1: {
        type: "image",
        label: "Profile Icon",
        dimensions: "800x800-1920x1920",
        required: false,
      },
      text1: { type: "text", label: "Username", maxLength: 13, required: true },
      video1: {
        type: "video",
        label: "Video 1",
        dimensions: "1080x1920",
        required: false,
      },
      text2: { type: "text", label: "Text 2", maxLength: 9, required: true },
      background: {
        type: "image",
        label: "Background",
        dimensions: "2160x3840",
        required: false,
      },
    },
  },
];

export const categoriesTemplate = [
  {
    id: "social-media-videos",
    title: "Social Media Videos",
    description:
      "Create videos optimized for Instagram Reels, TikTok, and YouTube Shorts.",
    iconName: "instagram" as const,
    examples: ["Instagram Reels", "TikTok", "YouTube Shorts"],
    imageUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80",
  },
  {
    id: "business-marketing",
    title: "Business & Marketing",
    description:
      "Professional videos for product promotions, demos, and testimonials.",
    iconName: "briefcase" as const,
    examples: ["Product Promo", "App Demo", "Testimonial"],
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
  },
  {
    id: "personal-videos",
    title: "Personal Videos",
    description:
      "Celebrate special moments with personalized videos for any occasion.",
    iconName: "heart" as const,
    examples: ["Birthday", "Wedding", "Travel"],
    imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
  },
  {
    id: "educational-content",
    title: "Educational Content",
    description:
      "Engaging videos for courses, tutorials, and presentations.",
    iconName: "graduationCap" as const,
    examples: ["Course Intro", "Tutorial", "Slides"],
    imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80",
  },
  {
    id: "branding-logo",
    title: "Branding & Logo",
    description:
      "Professional animations for logo reveals and brand videos.",
    iconName: "sparkles" as const,
    examples: ["Logo Reveal", "Brand Intro", "Outro"],
    imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
  },
  {
    id: "custom-creation",
    title: "Custom Creation",
    description: "Bring your unique vision to life with custom video templates.",
    iconName: "custom" as const,
    examples: ["Your Idea", "Any Style", "Any Length"],
    imageUrl: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&q=80",
    isCustom: true,
  },
];