-- Import the 56 rows categorized as directories from the Outrank directory CSV.
--
-- Source: /Users/nahuelmoreno/Downloads/outrank_400+ directories - Directories.csv
-- Imported one row per new normalized domain. Existing domains are skipped at
-- migration time so this remains safe if the catalogue changes before apply.
-- CSV fields not represented by public.directories: Effort, Link Type, Status.
-- DA is mapped to domain_rating. Pricing is not present in the CSV, so rows
-- default to is_free = true pending review, except for clearly paid listings
-- identified during verification. URLs are intentionally unverified.
-- Categories are normalized to the existing taxonomy where applicable.

with incoming(name, domain, category, domain_rating, submit_url) as (
  values
    ('1000 Tools', '1000.tools', 'directory', 15, 'https://1000.tools/'),
    ('9Sites.net', '9sites.net', 'directory', 28, 'https://www.9sites.net/addurl.php'),
    ('AffordHunt', 'affordhunt.com', 'directory', 14, 'https://www.affordhunt.com/'),
    ('All Top', 'alltop.com', 'directory', 69, 'https://alltop.com/'),
    ('All top startups', 'alltopstartups.com', 'directory', 72, 'http://alltopstartups.com/submit-startup/'),
    ('Appiod.com', 'appiod.com', 'directory', 20, 'http://appiod.com/submit-app-for-review/'),
    ('AppsThunder', 'appsthunder.com', 'directory', 14, 'http://appsthunder.com/submit-your-app/'),
    ('B2B Stack', 'b2bstack.com.br', 'directory', 46, 'https://b2bstack.com.br'),
    ('Bizzbo', 'bizzbo.com', 'directory', 45, 'https://bizzbo.com'),
    ('Buffer apps', 'bufferapps.com', 'directory', 43, 'https://www.bufferapps.com/'),
    ('Softonic', 'en.softonic.com', 'directory', 92, 'https://en.softonic.com/android'),
    ('EU-Startups Database', 'eu-startups.com', 'directory', 67, 'https://www.eu-startups.com/directory/'),
    ('Foundigy', 'foundigy.com', 'directory', 38, 'https://foundigy.com'),
    ('FoundrList', 'foundrlist.com', 'directory', 52, 'https://foundrlist.com'),
    ('GetApp', 'gartner.com', 'directory', 91, 'https://www.gartner.com/en/digital-markets/basic-listing'),
    ('Geekwire', 'geekwire.com', 'directory', 88, 'https://Geekwire.com'),
    ('Worm', 'getworm.com', 'directory', 29, 'https://getworm.com/submit-startup'),
    ('GrowthBoosters', 'growthboosters.com', 'directory', 12, 'https://www.growthboosters.com/'),
    ('Gust', 'gust.com', 'directory', 68, 'https://gust.com'),
    ('Indiehacker tools', 'indiehacker.tools', 'directory', 6, 'https://www.indiehacker.tools/'),
    ('Insanely cool tools', 'insanelycooltools.com', 'directory', 17, 'https://www.insanelycooltools.com/'),
    ('Landing Folio', 'landingfolio.com', 'directory', 40, 'https://www.landingfolio.com'),
    ('Microstartups', 'microstartups.co', 'directory', 13, 'https://www.microstartups.co/'),
    ('Tech Tools Directory', 'nocode.tech', 'directory', 38, 'https://www.nocode.tech/tools'),
    ('Nocode Devs', 'nocodedevs.com', 'directory', 22, 'https://www.nocodedevs.com/browse-the-directory'),
    ('Open Startup List', 'openstartuplist.com', 'directory', 18, 'https://openstartuplist.com/'),
    ('Owwly', 'owwly.com', 'directory', 25, 'https://owwly.com/'),
    ('Pitchbook', 'pitchbook.com', 'directory', 82, 'https://pitchbook.com'),
    ('Promotehour', 'promotehour.com', 'directory', 33, 'https://promotehour.com/'),
    ('Resource FYI', 'resource.fyi', 'directory', 13, 'https://resource.fyi/'),
    ('Romanian Startups', 'romanianstartups.com', 'directory', 34, 'https://www.romanianstartups.com/'),
    ('SaaS Directory', 'saasdirectory.com', 'directory', 13, 'http://saasdirectory.com/'),
    ('SaaS Genius', 'saasgenius.com', 'directory', 41, 'https://www.saasgenius.com/'),
    ('Serchen', 'serchen.com', 'directory', 49, 'https://www.serchen.com/get-listed/'),
    ('Sitejabber', 'sitejabber.com', 'directory', 74, 'https://www.sitejabber.com/'),
    ('Starticorn', 'starticorn.com', 'directory', 9, 'https://starticorn.com/'),
    ('StartupBlink', 'startupblink.com', 'directory', 56, 'https://www.startupblink.com/'),
    ('Startup Europe', 'startupeurope.net', 'directory', 16, 'http://startupeurope.net/'),
    ('StartupLister', 'startuplister.com', 'directory', 54, 'https://startuplister.com'),
    ('Startup Roulette', 'startuproulette.com', 'directory', 11, 'http://startuproulette.com/'),
    ('Startups List', 'startups-list.com', 'directory', 34, 'https://www.startups-list.com/'),
    ('Snap Munk', 'startups.snapmunk.com', 'directory', 50, 'https://startups.snapmunk.com/'),
    ('Startuptabs', 'startuptabs.com', 'directory', 29, 'http://startuptabs.com/'),
    ('Startup Tracker', 'startuptracker.io', 'directory', 34, 'https://startuptracker.io/'),
    ('Startupxplore', 'startupxplore.com', 'directory', 59, 'https://startupxplore.com/en/startups'),
    ('Techboard', 'techboard.com.au', 'directory', 35, 'https://techboard.com.au/'),
    ('Tech directory', 'techdirectory.io', 'directory', 55, 'http://techdirectory.io/get-listed'),
    ('Techendo', 'techendo.com', 'directory', 29, 'http://techendo.com/beta'),
    ('Hive Index', 'thehiveindex.com', 'directory', 31, 'https://thehiveindex.com/submit/'),
    ('Thingtesting', 'thingtesting.com', 'directory', 45, 'https://thingtesting.com/submit-brand'),
    ('Robin Good''s Tools', 'tools.robingood.com', 'directory', 33, 'http://tools.robingood.com/'),
    ('ToolSalad', 'toolsalad.com', 'directory', 14, 'https://toolsalad.com/submit/'),
    ('Top Similar Sites', 'topsimilarsites.com', 'directory', 34, 'http://www.topsimilarsites.com/add.aspx'),
    ('Vccircle', 'vccircle.com', 'directory', 73, 'https://www.vccircle.com/company/directory'),
    ('Venture Radar', 'ventureradar.com', 'directory', 45, 'https://www.ventureradar.com/database/'),
    ('Web Tools Weekly', 'webtoolsweekly.com', 'directory', 37, 'http://webtoolsweekly.com/submit')
),
deduplicated as (
  select distinct on (domain)
    name,
    domain,
    category,
    domain_rating,
    submit_url
  from incoming
  where category = 'directory'
  order by domain
)
insert into public.directories (
  name,
  domain,
  category,
  domain_rating,
  submit_url,
  check_method,
  is_free,
  is_active,
  submit_url_ok
)
select
  incoming.name,
  incoming.domain,
  incoming.category,
  incoming.domain_rating,
  incoming.submit_url,
  'serp_check'::public.directory_check_method,
  case
    when incoming.domain in ('9sites.net', 'techdirectory.io') then false
    else true
  end,
  true,
  false
from deduplicated as incoming
where not exists (
  select 1
  from public.directories as existing
  where lower(existing.domain) = incoming.domain
     or lower(existing.domain) = 'www.' || incoming.domain
);
