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
      type: "text" | "image" | "video" | "media";
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
    description: "Dual Media & Text",
    previewUrl: "/previews/animation-1.mp4",
    thumbnail: "/previews/animation 1.png",
    category: "Social Media",
    fields: {
      text1: { type: "text", label: "Text 1", maxLength: 18, required: true },
      text2: { type: "text", label: "Text 2", maxLength: 18, required: true },
      media1: { type: "media", label: "Media 1", dimensions: "1080x1000", required: false },
      media2: { type: "media", label: "Media 2", dimensions: "1080x1000", required: false },
      background: { type: "image", label: "Background", dimensions: "2160x3840", required: false },
    },
  },
  {
    id: 2,
    name: "Animation 2",
    description: "Quad Media & Text",
    previewUrl: "/previews/animation-2.mp4",
    thumbnail: "/previews/animation 2.png",
    category: "Social Media",
    fields: {
      text1: { type: "text", label: "Text 1", maxLength: 14, required: true },
      text2: { type: "text", label: "Text 2", maxLength: 14, required: false },
      text3: { type: "text", label: "Text 3", maxLength: 14, required: false },
      text4: { type: "text", label: "Text 4", maxLength: 14, required: false },
      media1: { type: "media", label: "Media 1", dimensions: "1080x1080", required: false },
      media2: { type: "media", label: "Media 2", dimensions: "1080x1080", required: false },
      media3: { type: "media", label: "Media 3", dimensions: "1080x1080", required: false },
      media4: { type: "media", label: "Media 4", dimensions: "1080x1080", required: false },
      background: { type: "image", label: "Background", dimensions: "2160x3840", required: false },
    },
  },
  {
    id: 3,
    name: "Animation 3",
    description: "Mixed Media & Text",
    previewUrl: "/previews/animation-3.mp4",
    thumbnail: "/previews/animation 3.png",
    category: "Social Media",
    fields: {
      text1: { type: "text", label: "Text 1", maxLength: 15, required: false },
      text2: { type: "text", label: "Text 2", maxLength: 15, required: false },
      text3: { type: "text", label: "Text 3", maxLength: 15, required: false },
      text4: { type: "text", label: "Text 4", maxLength: 15, required: false },
      image1: { type: "image", label: "Image 1", dimensions: "1080x1000", required: false },
      image2: { type: "image", label: "Image 2", dimensions: "1080x1000", required: false },
      media3: { type: "media", label: "Media 3", dimensions: "1080x1000", required: false },
      image4: { type: "image", label: "Image 4", dimensions: "1080x1000", required: false },
      background: { type: "image", label: "Background", dimensions: "2160x3840", required: false },
    },
  },
  {
    id: 4,
    name: "Animation 4",
    description: "Product Showcase",
    previewUrl: "/previews/animation-4.mp4",
    thumbnail: "/previews/animation 4.png",
    category: "E-commerce",
    fields: {
      text1: { type: "text", label: "Article Name", maxLength: 15, required: true },
      text2: { type: "text", label: "Article Price", maxLength: 10, required: false },
      image1: { type: "image", label: "Image 1", dimensions: "1080x1080", required: false },
      background: { type: "image", label: "Background", dimensions: "2160x3840", required: false },
    },
  },
  {
    id: 5,
    name: "Animation 5",
    description: "Website Showcase",
    previewUrl: "/previews/animation-5.mp4",
    thumbnail: "/previews/animation 5.png",
    category: "Marketing",
    fields: {
      text1: { type: "text", label: "Text 1", maxLength: 35, required: true },
      text2: { type: "text", label: "Website Link", maxLength: 50, required: false },
      text3: { type: "text", label: "Website Title", maxLength: 26, required: false },
      text4: { type: "text", label: "Blue Website Title", maxLength: 35, required: false },
      text5: { type: "text", label: "Website Description", maxLength: 55, required: false },
      image1: { type: "image", label: "Image 1", dimensions: "1080x1080", required: false },
      image2: { type: "image", label: "Image 2", dimensions: "1080x1080", required: false },
      background: { type: "image", label: "Background", dimensions: "2160x3840", required: false },
    },
  },
  {
    id: 6,
    name: "Animation 6",
    description: "Engagement Template",
    previewUrl: "/previews/animation-6.mp4",
    thumbnail: "/previews/animation 6.png",
    category: "Social Media",
    fields: {
      text1: { type: "text", label: "Comment Keyword", maxLength: 45, required: true },
      text2: { type: "text", label: "Keyword", maxLength: 12, required: false },
      image1: { type: "image", label: "Image 1", dimensions: "1080x1080", required: false },
      image2: { type: "image", label: "Image 2", dimensions: "1080x1080", required: false },
      image3: { type: "image", label: "Image 3", dimensions: "1080x1080", required: false },
      background: { type: "image", label: "Background", dimensions: "2160x3840", required: false },
    },
  },
  {
    id: 7,
    name: "Animation 7",
    description: "Text Animation",
    previewUrl: "/previews/animation-7.mp4",
    thumbnail: "/previews/animation 7.png",
    category: "Social Media",
    fields: {
      text1: { type: "text", label: "Text", maxLength: 20, required: true },
      background: { type: "image", label: "Background", dimensions: "2160x3840", required: false },
    },
  },
  {
    id: 8,
    name: "Animation 8",
    description: "E-commerce Template",
    previewUrl: "/previews/animation-8.mp4",
    thumbnail: "/previews/animation 8.png",
    category: "E-commerce",
    fields: {
      text1: { type: "text", label: "Text 1", maxLength: 17, required: true },
      text2: { type: "text", label: "Text 2", maxLength: 27, required: false },
      text3: { type: "text", label: "Price", maxLength: 8, required: false },
      image1: { type: "image", label: "Image 1", dimensions: "780x645", required: false },
      background: { type: "image", label: "Background", dimensions: "2160x3840", required: false },
    },
  },
  {
    id: 9,
    name: "Animation 9",
    description: "Chat Messages",
    previewUrl: "/previews/animation-9.mp4",
    thumbnail: "/previews/animation 9.png",
    category: "Social Media",
    fields: {
      text1: { type: "text", label: "Message 1", maxLength: 36, required: true },
      text2: { type: "text", label: "Message 2", maxLength: 36, required: false },
      text3: { type: "text", label: "Message 3", maxLength: 36, required: false },
      text4: { type: "text", label: "Message 4", maxLength: 36, required: false },
      text5: { type: "text", label: "Message 5", maxLength: 36, required: false },
      text6: { type: "text", label: "Sender's Name", maxLength: 22, required: false },
      image1: { type: "image", label: "Profile Picture", dimensions: "1080x1080", required: false },
      background: { type: "image", label: "Background", dimensions: "2160x3840", required: false },
    },
  },
  {
    id: 10,
    name: "Animation 10",
    description: "Triple Media",
    previewUrl: "/previews/animation-10.mp4",
    thumbnail: "/previews/animation 10.png",
    category: "Social Media",
    fields: {
      text1: { type: "text", label: "Text 1", maxLength: 18, required: true },
      text2: { type: "text", label: "Text 2", maxLength: 18, required: false },
      text3: { type: "text", label: "Text 3", maxLength: 18, required: false },
      media1: { type: "media", label: "Media 1", dimensions: "1080x1000", required: false },
      media2: { type: "media", label: "Media 2", dimensions: "1080x1000", required: false },
      media3: { type: "media", label: "Media 3", dimensions: "1080x1000", required: false },
      background: { type: "image", label: "Background", dimensions: "2160x3840", required: false },
    },
  },
  {
    id: 11,
    name: "Animation 11",
    description: "Social Video",
    previewUrl: "/previews/animation-11.mp4",
    thumbnail: "/previews/animation 11.png",
    category: "Social Media",
    fields: {
      video1: { type: "video", label: "Video 1", dimensions: "2000x1784", required: false },
      image1: { type: "image", label: "Profile Pic", dimensions: "512x512", required: false },
      text1: { type: "text", label: "Text 1", maxLength: 40, required: true },
      text2: { type: "text", label: "Text 2", maxLength: 40, required: false },
      text3: { type: "text", label: "Likes", maxLength: 5, required: false },
      background: { type: "image", label: "Background", dimensions: "2160x3840", required: false },
    },
  },
  {
    id: 12,
    name: "Animation 12",
    description: "Subscribe Card",
    previewUrl: "/previews/animation-12.mp4",
    thumbnail: "/previews/animation 12.png",
    category: "Social Media",
    fields: {
      text1: { type: "text", label: "Channel Name", maxLength: 14, required: true },
      text2: { type: "text", label: "Username", maxLength: 22, required: true },
      text3: { type: "text", label: "Subscribers Count", maxLength: 20, required: false },
      image1: { type: "image", label: "Profile Pic", dimensions: "1080x1080", required: false },
      background: { type: "image", label: "Background", dimensions: "2160x3840", required: false },
    },
  },
  {
    id: 13,
    name: "Animation 13",
    description: "Calendar Layout",
    previewUrl: "/previews/animation-13.mp4",
    thumbnail: "/previews/animation 13.png",
    category: "Productivity",
    fields: {
      text1: { type: "text", label: "Month", maxLength: 18, required: true },
      text2: { type: "text", label: "Year", maxLength: 18, required: true },
      text3: { type: "text", label: "Event Text", maxLength: 18, required: false },
      image1: { type: "image", label: "Image 1", dimensions: "1080x1080", required: false },
      background: { type: "image", label: "Background", dimensions: "2160x3840", required: false },
    },
  },
  {
    id: 14,
    name: "Animation 14",
    description: "Bouncing Text",
    previewUrl: "/previews/animation-14.mp4",
    thumbnail: "/previews/animation 14.png",
    category: "Typography",
    fields: {
      text1: { type: "text", label: "Text", maxLength: 20, required: true },
      background: { type: "image", label: "Background", dimensions: "2160x3840", required: false },
    },
  },
  {
    id: 15,
    name: "Animation 15",
    description: "Thread Post",
    previewUrl: "/previews/animation-15.mp4",
    thumbnail: "/previews/animation 15.png",
    category: "Social Media",
    fields: {
      text1: { type: "text", label: "Text 1", maxLength: 47, required: true },
      text2: { type: "text", label: "Your Name 1", maxLength: 33, required: true },
      text3: { type: "text", label: "Username 1", maxLength: 33, required: true },
      text4: { type: "text", label: "Text 2", maxLength: 47, required: false },
      text5: { type: "text", label: "Your Name 2", maxLength: 33, required: false },
      text6: { type: "text", label: "Username 2", maxLength: 33, required: false },
      media1: { type: "media", label: "Post", dimensions: "1920x1080", required: false },
      image2: { type: "image", label: "Profile Pic 2", dimensions: "1080x1080", required: false },
      image3: { type: "image", label: "Profile Pic 1", dimensions: "1080x1080", required: false },
      background: { type: "image", label: "Background", dimensions: "2160x3840", required: false },
    },
  },
  {
    id: 16,
    name: "Animation 16",
    description: "Video Card",
    previewUrl: "/previews/animation-16.mp4",
    thumbnail: "/previews/animation 16.png",
    category: "Video",
    fields: {
      text1: { type: "text", label: "Likes", maxLength: 6, required: false },
      text2: { type: "text", label: "Username", maxLength: 27, required: true },
      text3: { type: "text", label: "Views", maxLength: 10, required: false },
      text4: { type: "text", label: "Title", maxLength: 39, required: true },
      image1: { type: "image", label: "Profile Pic", dimensions: "1080x1080", required: false },
      video1: { type: "video", label: "Video", dimensions: "1920x1080", required: false },
      background: { type: "image", label: "Background", dimensions: "2160x3840", required: false },
    },
  },
];

export const categoriesTemplate = [
  {
    id: "intro",
    title: "Intro Scene",
    description: "Hook your audience instantly with a high-impact opening sequence.",
    iconName: "intro" as const,
    examples: ["Channel Welcome", "Series Title", "Breaking News"],
    imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
  },
  {
    id: "content",
    title: "Content Scene",
    description: "Pass your message clearly with readable, engaging kinetic typography.",
    iconName: "content" as const,
    examples: ["Top 5 Tips", "Explainer Text", "Quote or Stat"],
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
  },
  {
    id: "cta",
    title: "Call to Action",
    description: "Drive results with a persuasive closing scene that demands action.",
    iconName: "cta" as const,
    examples: ["Subscribe Now", "Visit Website", "Follow Us"],
    imageUrl: "https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=800&q=80",
  },
];