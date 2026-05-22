SEED_CATEGORIES = [
    {"slug": "social-media", "name": "Social Media Marketing", "description": "Strategies for Facebook, Instagram, TikTok, LinkedIn and beyond. What platforms drive real engagement?", "color": "#3B82F6", "icon": "share-2", "status": "approved"},
    {"slug": "seo-sem", "name": "SEO / SEM", "description": "Search engine optimization and marketing tactics. Organic vs paid — what actually moves the needle?", "color": "#22C55E", "icon": "search", "status": "approved"},
    {"slug": "influencer-marketing", "name": "Influencer Marketing", "description": "Micro vs macro influencers, ROI tracking, and partnership strategies from around the globe.", "color": "#A855F7", "icon": "users", "status": "approved"},
    {"slug": "integrated-marketing", "name": "Integrated Marketing", "description": "Omnichannel campaigns that connect digital and traditional. How do you make it all work together?", "color": "#F97316", "icon": "layers", "status": "approved"},
    {"slug": "consumer-behavior", "name": "Consumer Behavior", "description": "Understanding what makes people buy. Psychology, data, and cultural differences across markets.", "color": "#EF4444", "icon": "brain", "status": "approved"},
    {"slug": "branding", "name": "Branding", "description": "Building memorable brands that resonate. Identity, positioning, and storytelling that sticks.", "color": "#FACC15", "icon": "award", "status": "approved"},
    {"slug": "marketing-tools", "name": "Marketing Tools", "description": "The best tools, platforms, and tech stacks marketers are using worldwide. Reviews and recommendations.", "color": "#14B8A6", "icon": "wrench", "status": "approved"},
    {"slug": "digital-marketing", "name": "Digital Marketing", "description": "The full spectrum of online marketing — from display ads to landing pages, funnels, and conversion optimization.", "color": "#6366F1", "icon": "monitor", "status": "approved"},
    {"slug": "marketing-and-ai", "name": "Marketing & AI", "description": "How artificial intelligence is reshaping marketing — from predictive analytics to AI-generated content and automation.", "color": "#EC4899", "icon": "cpu", "status": "approved"},
    {"slug": "keywords", "name": "Keywords & Search Strategy", "description": "Keyword research, long-tail strategy, search intent, and the evolving landscape of how people find things online.", "color": "#06B6D4", "icon": "key", "status": "approved"},
    {"slug": "careers", "name": "Marketing Careers", "description": "Career paths, job hunting, skill development, portfolio building, and navigating the marketing job market worldwide.", "color": "#D97706", "icon": "briefcase", "status": "approved"},
]

SEED_SUBCATEGORIES = [
    {"slug": "4ps-of-marketing", "name": "The 4 P's of Marketing", "parent": "integrated-marketing"},
    {"slug": "wheel-and-spoke", "name": "Wheel & Spoke Method", "parent": "integrated-marketing"},
    {"slug": "swot-analysis", "name": "SWOT Analysis", "parent": "marketing-tools"},
    {"slug": "competitor-analysis", "name": "Competitor Analysis", "parent": "marketing-tools"},
    {"slug": "content-marketing", "name": "Content Marketing", "parent": "social-media"},
    {"slug": "email-marketing", "name": "Email Marketing", "parent": "marketing-tools"},
    {"slug": "brand-storytelling", "name": "Brand Storytelling", "parent": "branding"},
    {"slug": "seo-fundamentals", "name": "SEO Fundamentals", "parent": "seo-sem"},
    {"slug": "paid-advertising", "name": "Paid Advertising", "parent": "seo-sem"},
    {"slug": "market-research", "name": "Market Research", "parent": "consumer-behavior"},
    {"slug": "chatgpt-marketing", "name": "ChatGPT for Marketing", "parent": "marketing-and-ai"},
    {"slug": "predictive-analytics", "name": "Predictive Analytics", "parent": "marketing-and-ai"},
    {"slug": "ppc-strategy", "name": "PPC Strategy", "parent": "digital-marketing"},
    {"slug": "conversion-optimization", "name": "Conversion Optimization", "parent": "digital-marketing"},
    {"slug": "keyword-research", "name": "Keyword Research", "parent": "keywords"},
    {"slug": "search-intent", "name": "Search Intent", "parent": "keywords"},
    {"slug": "portfolio-building", "name": "Portfolio Building", "parent": "careers"},
    {"slug": "freelancing", "name": "Freelancing & Consulting", "parent": "careers"},
]

CATEGORY_COLORS = ["#3B82F6", "#22C55E", "#A855F7", "#F97316", "#EF4444", "#FACC15", "#14B8A6", "#6366F1", "#EC4899", "#06B6D4", "#D97706", "#F43F5E", "#8B5CF6", "#10B981", "#F59E0B"]

SEED_POSTS = [
    {
        "title": "How TikTok Changed the Game for Small Business Marketing",
        "excerpt": "From NYC bodegas to Tokyo ramen shops — short-form video is the great equalizer in marketing. Here's what's working in 2025.",
        "content": "Short-form video content has fundamentally shifted how small businesses reach new customers...",
        "category_slug": "social-media",
        "subcategory": "content-marketing",
        "tags": ["tiktok", "small-business", "video-marketing", "social-media"],
        "author_name": "Marcus Chen",
        "author_city": "New York",
        "author_country": "United States"
    },
    {
        "title": "The Death and Rebirth of Email Marketing in the AI Age",
        "excerpt": "Everyone said email was dead. The data says otherwise — but only if you adapt to how AI is reshaping inboxes.",
        "content": "Email marketing was supposed to be dead by now. Every year, some thought leader declares its demise...",
        "category_slug": "marketing-tools",
        "subcategory": "email-marketing",
        "tags": ["email", "AI", "automation", "personalization"],
        "author_name": "Sarah Okonkwo",
        "author_city": "London",
        "author_country": "United Kingdom"
    },
    {
        "title": "Micro-Influencers Are Outperforming Celebrity Endorsements — Here's the Data",
        "excerpt": "Our analysis of 10,000 campaigns across 30 countries reveals a clear winner in the influencer debate.",
        "content": "The influencer marketing industry hit $21 billion in 2024, but not all influencer strategies are created equal...",
        "category_slug": "influencer-marketing",
        "tags": ["influencers", "micro-influencers", "ROI", "data"],
        "author_name": "Aisha Patel",
        "author_city": "Mumbai",
        "author_country": "India"
    },
    {
        "title": "SEO in 2025: Why Most Strategies Are Already Outdated",
        "excerpt": "AI Overviews, zero-click searches, and the rise of answer engines are forcing a complete rethink of organic search strategy.",
        "content": "If your SEO strategy still revolves around keyword density and backlink building, I have bad news...",
        "category_slug": "seo-sem",
        "subcategory": "seo-fundamentals",
        "tags": ["SEO", "AI", "google", "search"],
        "author_name": "Lars Erikson",
        "author_city": "Stockholm",
        "author_country": "Sweden"
    },
    {
        "title": "The Psychology of Color in Global Branding: What Works Where",
        "excerpt": "Red means luck in China but danger in the West. A deep dive into how color psychology varies across cultures and markets.",
        "content": "Color is one of the most powerful tools in a marketer's arsenal...",
        "category_slug": "branding",
        "subcategory": "brand-storytelling",
        "tags": ["branding", "color-psychology", "global", "culture"],
        "author_name": "Yuki Tanaka",
        "author_city": "Tokyo",
        "author_country": "Japan"
    },
    {
        "title": "Building an Integrated Campaign: Lessons from a $2M Product Launch",
        "excerpt": "How we coordinated 8 channels, 4 countries, and 12 content formats into one cohesive campaign.",
        "content": "Last quarter, our agency managed a $2M integrated product launch for a consumer tech brand...",
        "category_slug": "integrated-marketing",
        "subcategory": "4ps-of-marketing",
        "tags": ["integrated", "campaign", "product-launch", "omnichannel"],
        "author_name": "James O'Brien",
        "author_city": "Dublin",
        "author_country": "Ireland"
    },
    {
        "title": "Consumer Behavior Shifts Post-Pandemic: A Global Snapshot",
        "excerpt": "Three years later, some pandemic shopping habits stuck and others faded. Here's what the data shows across 15 markets.",
        "content": "The pandemic permanently altered consumer behavior in ways most marketers didn't predict...",
        "category_slug": "consumer-behavior",
        "subcategory": "market-research",
        "tags": ["consumer-behavior", "research", "global", "post-pandemic"],
        "author_name": "Maria Santos",
        "author_city": "São Paulo",
        "author_country": "Brazil"
    },
    {
        "title": "Google Ads vs Meta Ads: Where Should Your Budget Go in 2025?",
        "excerpt": "We split-tested $500K across Google and Meta for 20 different industries. The results surprised us.",
        "content": "The eternal question in paid advertising: Google or Meta?...",
        "category_slug": "seo-sem",
        "subcategory": "paid-advertising",
        "tags": ["google-ads", "meta-ads", "PPC", "paid-advertising"],
        "author_name": "Alex Müller",
        "author_city": "Berlin",
        "author_country": "Germany"
    },
    {
        "title": "The Wheel and Spoke Content Strategy: Why It Still Works",
        "excerpt": "This classic content marketing framework is more relevant than ever.",
        "content": "The Wheel and Spoke (or Hub and Spoke) content model has been around for years...",
        "category_slug": "integrated-marketing",
        "subcategory": "wheel-and-spoke",
        "tags": ["content-strategy", "hub-spoke", "SEO", "content-marketing"],
        "author_name": "Priya Sharma",
        "author_city": "Delhi",
        "author_country": "India"
    },
    {
        "title": "SWOT Analysis for Digital Marketing: A Modern Framework",
        "excerpt": "The classic SWOT analysis gets a digital-age makeover.",
        "content": "SWOT analysis is a fundamental strategic tool, but most marketers apply it too broadly...",
        "category_slug": "marketing-tools",
        "subcategory": "swot-analysis",
        "tags": ["SWOT", "strategy", "framework", "analysis"],
        "author_name": "Elena Rodriguez",
        "author_city": "Mexico City",
        "author_country": "Mexico"
    },
    {
        "title": "How Competitor Analysis Saved Our Client $3M in Wasted Ad Spend",
        "excerpt": "A systematic approach to competitive intelligence that revealed our client was fighting battles they couldn't win.",
        "content": "One of our clients was spending $500K/month on Google Ads in a category dominated by three massive competitors...",
        "category_slug": "marketing-tools",
        "subcategory": "competitor-analysis",
        "tags": ["competitor-analysis", "PPC", "strategy", "cost-optimization"],
        "author_name": "David Kim",
        "author_city": "Seoul",
        "author_country": "South Korea"
    },
    {
        "title": "Building a Brand That Transcends Borders: Lessons from 5 Global Success Stories",
        "excerpt": "What do Nike, IKEA, and Spotify have in common? Their brands work everywhere while feeling local.",
        "content": "Building a brand that resonates globally while feeling locally relevant is the holy grail of marketing...",
        "category_slug": "branding",
        "subcategory": "brand-storytelling",
        "tags": ["branding", "global", "case-study", "strategy"],
        "author_name": "Fatima Al-Hassan",
        "author_city": "Dubai",
        "author_country": "UAE"
    }
]
