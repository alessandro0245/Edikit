export const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

export const plans = [
  {
    id: "prod_TffitWtEKT88s6",
    name: "Starter",
    planType: "Starter",
    price: "$8",
    period: "per month",
    description:
      "Perfect for exploring Edikit and creating your first AI videos",
    features: [
      "60 video generation credits per month",
      "MP4 and MOV export formats",
      "Transparent background support",
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
      "MP4 and MOV export formats",
      "Transparent background support",
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
      "MP4 and MOV export formats",
      "Transparent background support",
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
  description?: string;
  previewUrl: string;
  thumbnail?: string;
  hasTransprentBackground?: boolean;
  fields: {
    [key: string]: {
      type: "text" | "image" | "video" | "media" | "color";
      label: string;
      value?: string;
      maxLength?: number;
      dimensions?: string;
      required: boolean;
    };
  };
}

export const templates: Template[] = [
  {
    id: 1,
    name: "Two Cards Linked Together",
    previewUrl: "/previews/animation-1.mp4",
    thumbnail: "/previews/animation 1.png",
    hasTransprentBackground: true,
    fields: {
      text1: { type: "text", value: "text number 1" , label: "Text 1", maxLength: 18, required: false },
      text2: { type: "text", value: "text number 2" , label: "Text 2", maxLength: 18, required: false },
      media1: {
        type: "media",
        label: "Media 1",
        dimensions: "1080x1000",
        required: false,
      },
      media2: {
        type: "media",
        label: "Media 2",
        dimensions: "1080x1000",
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
    name: "Card Tree Branch Layout",
    previewUrl: "/previews/animation-2.mp4",
    thumbnail: "/previews/animation 2.png",
    hasTransprentBackground: true,
    fields: {
      text1: { type: "text", value: "Text number 1", label: "Text 1", maxLength: 14, required: false },
      text2: { type: "text", value: "Text number 2", label: "Text 2", maxLength: 14, required: false },
      text3: { type: "text", value: "Text number 3", label: "Text 3", maxLength: 14, required: false },
      text4: { type: "text", value: "Text number 4", label: "Text 4", maxLength: 14, required: false },
      media1: {
        type: "media",
        label: "Media 1",
        dimensions: "1080x1080",
        required: false,
      },
      media2: {
        type: "media",
        label: "Media 2",
        dimensions: "1080x1080",
        required: false,
      },
      media3: {
        type: "media",
        label: "Media 3",
        dimensions: "1080x1080",
        required: false,
      },
      media4: {
        type: "media",
        label: "Media 4",
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
    id: 3,
    name: "Swipeable Stack of Cards",
    previewUrl: "/previews/animation-3.mp4",
    thumbnail: "/previews/animation 3.png",
    hasTransprentBackground: true,
    fields: {
      text1: { type: "text", value: "Text number 1", label: "Text 1", maxLength: 15, required: false },
      text2: { type: "text", value: "Text number 2", label: "Text 2", maxLength: 15, required: false },
      text3: { type: "text", value: "Text number 3", label: "Text 3", maxLength: 15, required: false },
      text4: { type: "text", value: "Text number 4", label: "Text 4", maxLength: 15, required: false },
      image1: {
        type: "image",
        label: "Image 1",
        dimensions: "1080x1000",
        required: false,
      },
      image2: {
        type: "image",
        label: "Image 2",
        dimensions: "1080x1000",
        required: false,
      },
      media3: {
        type: "media",
        label: "Media 3",
        dimensions: "1080x1000",
        required: false,
      },
      image4: {
        type: "image",
        label: "Image 4",
        dimensions: "1080x1000",
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
    id: 4,
    name: "Product Price Showcase Card",
    previewUrl: "/previews/animation-4.mp4",
    thumbnail: "/previews/animation 4.png",
    hasTransprentBackground: true,
    fields: {
      text1: {
        type: "text",
        label: "Article Name",
        value: "Article Name",
        maxLength: 15,
        required: false,
      },
      text2: {
        type: "text",
        label: "Article Price",
        value: "$199.99",
        maxLength: 10,
        required: false,
      },
      image1: {
        type: "image",
        label: "Image 1",
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
    id: 5,
    name: "Google Search Results Layout",
    previewUrl: "/previews/animation-5.mp4",
    thumbnail: "/previews/animation 5.png",
    hasTransprentBackground: true,
    fields: {
      text1: { type: "text", value: "This is text number 1", label: "Text 1", maxLength: 35, required: false },
      text2: {
        type: "text",
        value: "https://www.edikit.net/",
        label: "Website Link",
        maxLength: 50,
        required: false,
      },
      text3: {
        type: "text",
        value: "Website title",
        label: "Website Title",
        maxLength: 26,
        required: false,
      },
      text4: {
        type: "text",
        value: "Edikit - blue website title",
        label: "Blue Website Title",
        maxLength: 35,
        required: false,
      },
      text5: {
        type: "text",
        value: "website description",
        label: "Website Description",
        maxLength: 55,
        required: false,
      },
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
    id: 6,
    name: "Folder Opening Image Reveal",
    previewUrl: "/previews/animation-6.mp4",
    thumbnail: "/previews/animation 6.png",
    hasTransprentBackground: true,
    fields: {
      text1: {
        type: "text",
        value: "Comment Keyword for files",
        label: "Comment Keyword",
        maxLength: 45,
        required: false,
      },
      text2: { type: "text", value: "“Edikit”", label: "Keyword", maxLength: 12, required: false },
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
      image3: {
        type: "image",
        label: "Image 3",
        dimensions: "1080x1080",
        required: false,
      },
      keywordColorStart: {
        type: "color",
        value: "#3B82F6",
        label: "Keyword Start Color",
        required: false,
      },
      keywordColorEnd: {
        type: "color",
        value: "#3B82F6",
        label: "Keyword End Color",
        required: false,
      },
      particlesColor: {
        type: "color",
        value: "#5EB5FC",
        label: "Particles Color",
        required: false,
      },
      decorationColor: {
        type: "color",
        value: "#3B82F6",
        label: "Folder Color",
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
    name: "Clock with Sliding Banner",
    previewUrl: "/previews/animation-7.mp4",
    thumbnail: "/previews/animation 7.png",
    hasTransprentBackground: true,
    fields: {
      text1: { type: "text", value: "Text 1, type here", label: "Text", maxLength: 20, required: true },
      bannerColorStart: {
        type: "color",
        value: "#3B82F6",
        label: "Banner End Color",
        required: false,
      },
      bannerColorEnd: {
        type: "color",
        value: "#8abdff",
        label: "Banner Start Color",
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
    id: 8,
    name: "Dark Product Showcase Card",
    previewUrl: "/previews/animation-8.mp4",
    thumbnail: "/previews/animation 8.png",
    hasTransprentBackground: true,
    fields: {
      text1: { type: "text", value: "Text number 1", label: "Text 1", maxLength: 17, required: false },
      text2: { type: "text", value: "Text number 2", label: "Text 2", maxLength: 27, required: false },
      text3: { type: "text", value: "$100.00", label: "Price", maxLength: 8, required: false },
      image1: {
        type: "image",
        label: "Image 1",
        dimensions: "780x645",
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
    id: 9,
    name: "Chat Message Notification Stack",
    previewUrl: "/previews/animation-9.mp4",
    thumbnail: "/previews/animation 9.png",
    hasTransprentBackground: true,
    fields: {
      text1: {
        type: "text",
        value: "This is text number 1! Add text",
        label: "Message 1",
        maxLength: 36,
        required: false,
      },
      text2: {
        type: "text",
        value: "This is text number 2! Add text",
        label: "Message 2",
        maxLength: 36,
        required: false,
      },
      text3: {
        type: "text",
        value: "This is text number 3! Add text",
        label: "Message 3",
        maxLength: 36,
        required: false,
      },
      text4: {
        type: "text",
        value: "This is text number 4! Add text",
        label: "Message 4",
        maxLength: 36,
        required: false,
      },
      text5: {
        type: "text",
        value: "This is text number 5! Add text",
        label: "Message 5",
        maxLength: 36,
        required: false,
      },
      text6: {
        type: "text",
        value: "Name Surname",
        label: "Sender's Name",
        maxLength: 22,
        required: false,
      },
      image1: {
        type: "image",
        label: "Profile Picture",
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
    id: 10,
    name: "Three Cards Linked Together",
    previewUrl: "/previews/animation-10.mp4",
    thumbnail: "/previews/animation 10.png",
    hasTransprentBackground: true,
    fields: {
      text1: { type: "text", value: "text number 1", label: "Text 1", maxLength: 18, required: false },
      text2: { type: "text", value: "text number 2", label: "Text 2", maxLength: 18, required: false },
      text3: { type: "text", value: "text number 3", label: "Text 3", maxLength: 18, required: false },
      media1: {
        type: "media",
        label: "Media 1",
        dimensions: "1080x1000",
        required: false,
      },
      media2: {
        type: "media",
        label: "Media 2",
        dimensions: "1080x1000",
        required: false,
      },
      media3: {
        type: "media",
        label: "Media 3",
        dimensions: "1080x1000",
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
    id: 11,
    name: "Animated Social Media Post",
    previewUrl: "/previews/animation-11.mp4",
    thumbnail: "/previews/animation 11.png",
    hasTransprentBackground: false,
    fields: {
      video1: {
        type: "video",
        label: "Video 1",
        dimensions: "2000x1784",
        required: false,
      },
      image1: {
        type: "image",
        label: "Profile Pic",
        dimensions: "512x512",
        required: false,
      },
      text1: { type: "text", value: "text number 1", label: "Text 1", maxLength: 40, required: false },
      text2: { type: "text", value: "text number 2, type something here", label: "Text 2", maxLength: 40, required: false },
      text3: { type: "text", value: "5,376", label: "Likes", maxLength: 5, required: false },
      text4: {
        type: "text",
        value: "follow_edikit",
        label: "Username",
        maxLength: 20,
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
    id: 12,
    name: "Creator Channel Subscribe Header",
    previewUrl: "/previews/animation-12.mp4",
    thumbnail: "/previews/animation 12.png",
    hasTransprentBackground: false,
    fields: {
      text1: {
        type: "text",
        value: "Channel Name",
        label: "Channel Name",
        maxLength: 14,
        required: false,
      },
      text2: { type: "text", value: "@txt_username", label: "Username", maxLength: 22, required: false },
      text3: {
        type: "text",
        value: "1 Mln subscribers",
        label: "Subscribers Count",
        maxLength: 20,
        required: false,
      },
      image1: {
        type: "image",
        label: "Profile Pic",
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
    id: 13,
    name: "Pinned Calendar Event Card",
    previewUrl: "/previews/animation-13.mp4",
    thumbnail: "/previews/animation 13.png",
    hasTransprentBackground: false,
    fields: {
      text1: { type: "text", value: "Month here", label: "Month", maxLength: 18, required: false },
      text2: { type: "text", value: "2026", label: "Year", maxLength: 18, required: false },
      text3: {
        type: "text",
        value: "Text number 1",
        label: "Event Text",
        maxLength: 18,
        required: false,
      },
      image1: {
        type: "image",
        label: "Image 1",
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
    id: 14,
    name: "Single Line Bouncing Text",
    previewUrl: "/previews/animation-14.mp4",
    thumbnail: "/previews/animation 14.png",
    hasTransprentBackground: true,
    fields: {
      text1: { type: "text", value: "Text number 1", label: "Line 1", maxLength: 20, required: false },
      text2: {
        type: "text", value: "Text number 2", label: "Line 2", maxLength: 20, required: false
      },
      accentColor: {
        type: "color",
        value: "#3B82F6",
        label: "Accent Color",
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
    id: 15,
    name: "Two-Post Social Thread",
    previewUrl: "/previews/animation-15.mp4",
    thumbnail: "/previews/animation 15.png",
    hasTransprentBackground: false,
    fields: {
      text1: { type: "text", value: "This is text number 1, type something here!", label: "Text 1", maxLength: 47, required: false },
      text2: {
        type: "text",
        value: "YourName1",
        label: "Your Name 1",
        maxLength: 33,
        required: false,
      },
      text3: {
        type: "text",
        value: "@username_1",
        label: "Username 1",
        maxLength: 33,
        required: false,
      },
      text4: { type: "text", value: "This is text number 2, type something here!", label: "Text 2", maxLength: 47, required: false },
      text5: {
        type: "text",
        value: "YourName2",
        label: "Your Name 2",
        maxLength: 33,
        required: false,
      },
      text6: {
        type: "text",
        value: "@username_2",
        label: "Username 2",
        maxLength: 33,
        required: false,
      },
      media1: {
        type: "media",
        label: "Post",
        dimensions: "1920x1080",
        required: false,
      },
      image2: {
        type: "image",
        label: "Profile Pic 2",
        dimensions: "1080x1080",
        required: false,
      },
      image3: {
        type: "image",
        label: "Profile Pic 1",
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
    id: 16,
    name: "Social Video Player Card",
    previewUrl: "/previews/animation-16.mp4",
    thumbnail: "/previews/animation 16.png",
    hasTransprentBackground: false,
    fields: {
      text1: { type: "text", value: "2k", label: "Likes", maxLength: 6, required: false },
      text2: { type: "text", value: "@username", label: "Username", maxLength: 27, required: false },
      text3: { type: "text", value: "250k views", label: "Views", maxLength: 10, required: false },
      text4: { type: "text", value: "Type your title here", label: "Title", maxLength: 39, required: false },
      image1: {
        type: "image",
        label: "Profile Pic",
        dimensions: "1080x1080",
        required: false,
      },
      video1: {
        type: "video",
        label: "Video",
        dimensions: "1920x1080",
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
];

export const categoriesTemplate = [
  {
    id: "intro",
    title: "Intro Scene",
    description:
      "Hook your audience instantly with a high-impact opening sequence.",
    iconName: "intro" as const,
    examples: ["Channel Welcome", "Series Title", "Breaking News"],
    imageUrl:
      "",
  },
  {
    id: "content",
    title: "Content Scene",
    description:
      "Pass your message clearly with readable, engaging kinetic typography.",
    iconName: "content" as const,
    examples: ["Top 5 Tips", "Explainer Text", "Quote or Stat"],
    imageUrl:
      "",
  },
  {
    id: "cta",
    title: "Call to Action",
    description:
      "Drive results with a persuasive closing scene that demands action.",
    iconName: "cta" as const,
    examples: ["Subscribe Now", "Visit Website", "Follow Us"],
    imageUrl:
      "",
  },
];
