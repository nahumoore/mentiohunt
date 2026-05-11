INSERT INTO directories (id, name, domain, submit_url, slug_pattern, category, check_method, is_free, is_active) VALUES

-- Launch Platforms
(gen_random_uuid(), 'Product Hunt', 'producthunt.com', 'https://www.producthunt.com/posts/new', 'https://www.producthunt.com/products/{slug}', 'launch', 'head_check', true, true),
(gen_random_uuid(), 'BetaList', 'betalist.com', 'https://betalist.com/submit', 'https://betalist.com/startups/{slug}', 'launch', 'head_check', true, true),
(gen_random_uuid(), 'Uneed', 'uneed.best', 'https://www.uneed.best/submit', 'https://www.uneed.best/tool/{slug}', 'launch', 'head_check', true, true),
(gen_random_uuid(), 'Microlaunch', 'microlaunch.net', 'https://microlaunch.net/submit', 'https://microlaunch.net/p/{slug}', 'launch', 'head_check', true, true),
(gen_random_uuid(), 'DevHunt', 'devhunt.org', 'https://devhunt.org/submit', 'https://devhunt.org/tool/{slug}', 'launch', 'head_check', true, true),
(gen_random_uuid(), 'Launching Next', 'launchingnext.com', 'https://www.launchingnext.com/submit/', 'https://www.launchingnext.com/startup/{slug}', 'launch', 'head_check', true, true),
(gen_random_uuid(), 'StartupStash', 'startupstash.com', 'https://startupstash.com/submit/', null, 'launch', 'serp_check', true, true),
(gen_random_uuid(), 'Betapage', 'betapage.co', 'https://betapage.co/submit-startup', 'https://betapage.co/startup/{slug}', 'launch', 'head_check', true, true),
(gen_random_uuid(), 'Pitchwall', 'pitchwall.co', 'https://pitchwall.co/submit', 'https://pitchwall.co/product/{slug}', 'launch', 'head_check', true, true),
(gen_random_uuid(), 'Launched', 'launched.io', 'https://launched.io/submit', 'https://launched.io/{slug}', 'launch', 'head_check', true, true),
(gen_random_uuid(), 'Startup Buffer', 'startupbuffer.com', 'https://startupbuffer.com/site/submit', 'https://startupbuffer.com/startups/{slug}', 'launch', 'head_check', true, true),

-- Review & Comparison Sites
(gen_random_uuid(), 'G2', 'g2.com', 'https://sell.g2.com/free-listing', 'https://www.g2.com/products/{slug}', 'review', 'head_check', true, true),
(gen_random_uuid(), 'Capterra', 'capterra.com', 'https://vendors.capterra.com/listing/add', null, 'review', 'serp_check', true, true),
(gen_random_uuid(), 'GetApp', 'getapp.com', 'https://vendors.capterra.com/listing/add', null, 'review', 'serp_check', true, true),
(gen_random_uuid(), 'Software Advice', 'softwareadvice.com', 'https://vendors.capterra.com/listing/add', null, 'review', 'serp_check', true, true),
(gen_random_uuid(), 'Trustpilot', 'trustpilot.com', 'https://business.trustpilot.com/signup', 'https://www.trustpilot.com/review/{slug}', 'review', 'head_check', true, true),
(gen_random_uuid(), 'TrustRadius', 'trustradius.com', 'https://www.trustradius.com/vendor/sign-up', 'https://www.trustradius.com/products/{slug}', 'review', 'head_check', true, true),
(gen_random_uuid(), 'Crozdesk', 'crozdesk.com', 'https://crozdesk.com/add-software', 'https://crozdesk.com/software/{slug}', 'review', 'head_check', true, true),
(gen_random_uuid(), 'GoodFirms', 'goodfirms.co', 'https://www.goodfirms.co/software/list-your-software', 'https://www.goodfirms.co/software/{slug}', 'review', 'head_check', true, true),
(gen_random_uuid(), 'Clutch', 'clutch.co', 'https://clutch.co/get-listed', 'https://clutch.co/profile/{slug}', 'review', 'head_check', true, true),

-- General Software Directories
(gen_random_uuid(), 'AlternativeTo', 'alternativeto.net', 'https://alternativeto.net/add-app/', 'https://alternativeto.net/software/{slug}/', 'software', 'head_check', true, true),
(gen_random_uuid(), 'SaaSHub', 'saashub.com', 'https://www.saashub.com/add-software', 'https://www.saashub.com/{slug}', 'software', 'head_check', true, true),
(gen_random_uuid(), 'StackShare', 'stackshare.io', 'https://stackshare.io/new-tool', 'https://stackshare.io/{slug}', 'software', 'head_check', true, true),
(gen_random_uuid(), 'SourceForge', 'sourceforge.net', 'https://sourceforge.net/projects/add/', 'https://sourceforge.net/projects/{slug}/', 'software', 'head_check', true, true),
(gen_random_uuid(), 'Softpedia', 'softpedia.com', 'https://www.softpedia.com/get/submit-your-program', null, 'software', 'serp_check', true, true),

-- Startup & Company Directories
(gen_random_uuid(), 'Crunchbase', 'crunchbase.com', 'https://www.crunchbase.com/add-to-database', 'https://www.crunchbase.com/organization/{slug}', 'startup', 'head_check', true, true),
(gen_random_uuid(), 'Wellfound', 'wellfound.com', 'https://wellfound.com/company/new', 'https://wellfound.com/company/{slug}', 'startup', 'head_check', true, true),
(gen_random_uuid(), 'F6S', 'f6s.com', 'https://www.f6s.com/company/apply', 'https://www.f6s.com/company/{slug}', 'startup', 'head_check', true, true),
(gen_random_uuid(), 'Startup Ranking', 'startupranking.com', 'https://www.startupranking.com/add-startup', 'https://www.startupranking.com/{slug}', 'startup', 'head_check', true, true),

-- Community & Discussion
(gen_random_uuid(), 'Indie Hackers', 'indiehackers.com', 'https://www.indiehackers.com/post/new', 'https://www.indiehackers.com/product/{slug}', 'community', 'head_check', true, true),
(gen_random_uuid(), 'Peerlist', 'peerlist.io', 'https://peerlist.io/tools/submit', 'https://peerlist.io/tools/{slug}', 'community', 'head_check', true, true),
(gen_random_uuid(), 'Hacker News', 'news.ycombinator.com', 'https://news.ycombinator.com/submit', null, 'community', 'serp_check', true, true),
(gen_random_uuid(), 'SideProjectors', 'sideprojectors.com', 'https://www.sideprojectors.com/project/create', null, 'community', 'serp_check', true, true),

-- AI Directories
(gen_random_uuid(), 'Futurepedia', 'futurepedia.io', 'https://www.futurepedia.io/submit-tool', 'https://www.futurepedia.io/tool/{slug}', 'ai', 'head_check', true, true),
(gen_random_uuid(), 'There''s An AI For That', 'theresanaiforthat.com', 'https://theresanaiforthat.com/submit/', 'https://theresanaiforthat.com/ai/{slug}/', 'ai', 'head_check', true, true),
(gen_random_uuid(), 'Toolify', 'toolify.ai', 'https://www.toolify.ai/submit', 'https://www.toolify.ai/ai-tools/{slug}', 'ai', 'head_check', true, true),
(gen_random_uuid(), 'AI Top Tools', 'aitoptools.com', 'https://aitoptools.com/submit/', null, 'ai', 'serp_check', true, true),

-- Marketplace
(gen_random_uuid(), 'AppSumo', 'appsumo.com', 'https://partners.appsumo.com', 'https://appsumo.com/products/{slug}/', 'marketplace', 'head_check', false, true)

ON CONFLICT DO NOTHING;
