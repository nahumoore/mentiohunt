# Test prompt: reproducing OpenRouter model failures

Captured verbatim from a real `apps/server` run (`score-resource-page-inclusion`,
`.logs/dev-discover-resource-page-inclusions-e8c88e84-770f-406c-93a2-219d0e2acdd6-2026-07-13T17-45-32-178Z.txt`,
line 12) via the new `"llm request"` log line. Same shape (system prompt + 2200-char
excerpt batch + `json_schema strict` + `reasoning.max_tokens` + `provider.require_parameters`)
is used by every scoring call across `apps/server/src/methods/prospect-generation-methods/*`
— this is what's timing out on `z-ai/glm-4.7-flash` and erroring on `qwen/qwen3.6-flash`
fallback.

## Test on OpenRouter

Paste this as a raw request body against `https://openrouter.ai/api/v1/chat/completions`,
or drop `messages` into the [OpenRouter chat playground](https://openrouter.ai/chat) UI
(model picker: `z-ai/glm-4.7-flash`, then separately try `qwen/qwen3.6-flash`) to see
which part fails and how.

```bash
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d @docs/test-prompts.request.json
```

Swap `"model"` to `"qwen/qwen3.6-flash"` to reproduce the fallback's `"Provider returned
error"` directly.

## Request body

```json
{
  "model": "z-ai/glm-4.7-flash",
  "messages": [
    {
      "role": "system",
      "content": "You are evaluating external web pages as outreach targets for adding one specific user-owned page as a useful resource.\n\nProduct: Design Henge\nDescription: Design Henge is a Chicago based website design and development company specializing in modern website development for businesses.  As a professional digital agency in Chicago specializing in branding, web design, SEO, UI UX, and digital marketing to help businesses grow online.\n\nFor each candidate, decide whether the external page is a good \"resource page inclusion\" prospect for the provided target page.\n\nA good prospect:\n- Curates, recommends, references, or links out to useful resources/tools/guides/templates/checklists on the target topic.\n- Has a clear topical match with the target page.\n- Does not already appear to include or link to the target page/product.\n- Would make a natural, non-spammy outreach ask: \"would you consider adding this resource for readers?\"\n\nScore guide (1-5):\n- 5: Clear curated resource/tool/template/guide page in the exact topic; target page is a strong missing fit.\n- 4: Strong topical fit and likely open to external resources, but not a perfect curated page.\n- 3: Some topical fit, but inclusion ask is plausible only with a loose angle.\n- 2: Weak fit, mostly an article/news/company page, or hard to justify adding a link.\n- 1: Wrong topic, own/product/social/aggregator/noise page, or already includes the target.\n\nReturn ALL items. Be strict about alreadyLinksToTarget when the candidate appears to mention the exact product, URL, or target page title."
    },
    {
      "role": "user",
      "content": "Candidates:\n[\n  {\n    \"id\": \"https://www.startherestl.org/housing.html::0c17c4bf-fba3-4b23-a568-4077790b4f9c\",\n    \"candidateUrl\": \"https://www.startherestl.org/housing.html\",\n    \"candidateTitle\": \"HOUSING - START HERE\",\n    \"candidateSnippet\": \"Free, easy-to-use, and mobile-friendly resources to Missouri tenants facing eviction or other housing needs. ... 314-726-6665. To Top of Page. The Start Here St.\",\n    \"candidateExcerpt\": \"HOUSING - START HERE\\nSTART HERE\\n\\n\\t\\t\\t\\tHOME PAGE\\n\\t\\t\\t\\n\\n\\t\\t\\t\\tBEFORE YOU START\\n\\t\\t\\t\\n\\n\\t\\t\\t\\tHOTLINES & WEBSITES\\n\\t\\t\\t\\n\\n\\t\\t\\t\\tCLOTHING/HOUSEHOLD\\n\\t\\t\\t\\n\\n\\t\\t\\t\\tDISABILITY\\n\\t\\t\\t\\n\\n\\t\\t\\t\\tDOMESTIC VIOLENCE\\n\\t\\t\\t\\n\\n\\t\\t\\t\\tDROP-IN CENTERS\\n\\t\\t\\t\\n\\n\\t\\t\\t\\tEMPLOYMENT & TRAINING\\n\\t\\t\\t\\n\\n\\t\\t\\t\\tFOOD PROGRAMS & PANTRIES\\n\\t\\t\\t\\n\\n\\t\\t\\t\\tHOUSING\\n\\t\\t\\t\\n\\n\\t\\t\\t\\tShelters for Men\\n\\t\\t\\t\\n\\n\\t\\t\\t\\tShelters for Women\\n\\t\\t\\t\\n\\n\\t\\t\\t\\tIMMIGRANT SERVICES\\n\\t\\t\\t\\n\\n\\t\\t\\t\\tLEGAL SERVICES\\n\\t\\t\\t\\n\\n\\t\\t\\t\\tLGBTQ\\n\\t\\t\\t\\n\\n\\t\\t\\t\\tMEDICAL\\n\\t\\t\\t\\n\\n\\t\\t\\t\\tMENTAL HEALTH\\n\\t\\t\\t\\n\\n\\t\\t\\t\\tMONEY MATTERS\\n\\t\\t\\t\\n\\n\\t\\t\\t\\tOUTSTATE RESOURCES\\n\\t\\t\\t\\n\\n\\t\\t\\t\\tRE-ENTRY\\n\\t\\t\\t\\n\\n\\t\\t\\t\\tSTREETWISE\\n\\t\\t\\t\\n\\n\\t\\t\\t\\tSUBSTANCE ABUSE TREATMENT\\n\\t\\t\\t\\n\\n\\t\\t\\t\\tUTILITY ASSISTANCE\\n\\t\\t\\t\\n\\n\\t\\t\\t\\tfor VETERANS\\n\\t\\t\\t\\n\\n\\t\\t\\t\\tYOUTH SERVICES\\n\\t\\t\\t\\n\\n\\t\\t\\t\\tCONTACT US\\n\\t\\t\\t\\nHOUSING\\nQUICK LINKS\\nWALK IN RENTAL ASSISTANCE \\nCLINICS\\nHORIZON HOUSING DEVELOPMENT COMPANY\\n3001 Arsenal St., St. Louis, MO 63118\\nwww.hhdc-stl.org\\n314-865-0383\\nMonday-Friday: 9:00am-5:00pm\\nWednesday & Thursday: 9:00am-5:00pm.  Evening Clinics: 5:30 pm-8:00pm\\nWOHL RECREATION CENTER\\n1515 N Kingshighway Blvd., St. Louis, MO  63113\\n314-367-2292\\nMonday, Tuesday, Friday, Saturday: 9:00am-12:00pm.\\nWednesday and Thursday: 9:0 am-12:00pm;  Evening Clinics: 5:30pm-8:00pm.\\nCRAIGS LIST\\nwww.stlouis.craigslist.org/search/hhh​\\nHousing for sale or rent.\\nHOUSING AUTHORITIES\\nSt. Louis City:  3520 Page Blvd.,  St. Louis, MO 63106\\nwww.slha.org\\n314-531-4770\\nSt. Louis County Housing Authority: \\n8865 Natural Bridge Rd., St. Louis, MO  63121\\nwww.haslc.com\\n314-428-3200\\nEast St. Louis Housing Authority: 700 N 20th St., East St. Louis, IL 62205\\nwww.eslha.org \\n618-646-7100\\nHUD (Housing and Urban Development)\\nwww.hud.gov\\n202-708-1112\\nThis is the website for HUD, the Department of Housing and Urban Development.\\nLEGAL AID HOUSING LAW PROGRAM\\n​\\nwww.lsem.org/housing-law\\nMISSOURI TENANT HELP\\nwww.MoTenantHelp.org\\nFree, easy-to-use, and mobile-friendly resources to Missouri tenants facing eviction or other housing needs. Forms are accessible to tenants, attorneys, paralegals, or anyone helping a tenant. \\n_____________________________________________________________\\n3010 APARTMENTS\\n3010 Washington Ave.,  St. Louis, MO 63103\\nwww.centralusa.salvationarmy.org/midland/3010-apartments\\n314-833-4040\\n58 one-bedroom, low income apartments operated by Sal\",\n    \"targetPage\": {\n      \"url\": \"https://www.designhenge.com/template-pages/start-here\",\n      \"title\": \"Start Here - Subscription X - Webflow Ecommerce website template\",\n      \"description\": \"Subscription X offers a top-tier Design Subscription Agency Webflow Template perfect for agencies looking to showcase their services with a professional and intuitive design.\",\n      \"pageType\": \"article\",\n      \"priority\": 3,\n      \"keywords\": []\n    }\n  },\n  {\n    \"id\": \"https://autisticadvocacy.org/resources/books/start-here-resources::0c17c4bf-fba3-4b23-a568-4077790b4f9c\",\n    \"candidateUrl\": \"https://autisticadvocacy.org/resources/books/start-here-resources\",\n    \"candidateTitle\": \"Start Here Resources - Autistic Self Advocacy Network\",\n    \"candidateSnippet\": \"Start Here Resources ... Sesame Street – A television show with an autistic character, Julia. Loop – A Pixar animated short film featuring a non-speaking autistic ...\",\n    \"candidateExcerpt\": \"Start Here Resources - Autistic Self Advocacy Network\\n\\n\\t\\tSkip to content\\nFacebook-f\\nBluesky\\nBluesky Streamline Icon: https://streamlinehq.com\\nBluesky\\nTumblr\\nInstagram\\nYoutube\\nShopping-cart\\nSearch ...\\nAll Categories\\nAction Alert\\nAnnouncement\\nASAN Activity\\nBlog\\nCampaign\\nIssue\\nNews\\nNewsletter\\nPolicy\\nPublications\\nResource\\nStatement\\nUncategorized\\n Results\\nSee all results\\nAbout\\nAbout ASAN\\nWho We Are\\nWhat We Do\\nWhat We Believe\\nFAQs\\nAction Center\\nAction Center\\nAction Alerts\\nFind My Officials\\nIssue Tracker\\nResources\\nResource Library\\nAbout Autism\\nIdentity-First Language\\nAccessibility Resources\\nTeighlor McGee Grassroots Mini Grants\\nAutism Campus Inclusion\\nBrowse by\\nGet Involved\\nAffiliate Groups\\nGet our Newsletter\\nVolunteer\\nFollow Us\\nWork at ASAN\\nDonate\\nBecome a Member\\nHow To Give to ASAN \\nRun for Team ASAN\\nAbout\\nAbout ASAN\\nWho We Are\\nWhat We Do\\nWhat We Believe\\nFAQs\\nAction Center\\nAction Center\\nAction Alerts\\nFind My Officials\\nIssue Tracker\\nResources\\nResource Library\\nAbout Autism\\nIdentity-First Language\\nAccessibility Resources\\nTeighlor McGee Grassroots Mini Grants\\nAutism Campus Inclusion\\nBrowse by\\nGet Involved\\nAffiliate Groups\\nGet our Newsletter\\nVolunteer\\nFollow Us\\nWork at ASAN\\nDonate\\nBecome a Member\\nHow To Give to ASAN \\nRun for Team ASAN\\nHome\\nResource Library\\nBooks\\nStart Here Resources\\nStart Here Resources\\nWelcome to the Autistic Community\\n – by the Autistic Self Advocacy Network. Also available online at autismacceptance.com\\nSincerely, Your Autistic Child: What People on the Autism Spectrum Wish Their Parents Knew About Growing Up, Acceptance, and Identity – by Autistic Women & Nonbinary Network\\nUniquely Human: A Different Way of Seeing Autism – by Barry Prizant\\nThe Real Experts: Readings for Parents of Autistic Children (anthology)\\nLoud Hands: Autistic People, Speaking (anthology)\\nAll the Weight of our Dreams: on living racialized autism (anthology)\\nSpectrums: Autistic Transgender People in their Own Words (anthology)\\nTyped Words, Loud Voices: A Collection (anthology)\\nWhy Johnny Doesn’t Flap: NT is OK! – by Clay and Gail Morton\\nMedia for kids\\nJust Right for You – by Melanie Heyworth\\nAll Cats Are On The Autism Spectrum – by Kathy Hoopmann\\nI Like Dinosaurs Too! – by Mandy Fa\",\n    \"targetPage\": {\n      \"url\": \"https://www.designhenge.com/template-pages/start-here\",\n      \"title\": \"Start Here - Subscription X - Webflow Ecommerce website template\",\n      \"description\": \"Subscription X offers a top-tier Design Subscription Agency Webflow Template perfect for agencies looking to showcase their services with a professional and intuitive design.\",\n      \"pageType\": \"article\",\n      \"priority\": 3,\n      \"keywords\": []\n    }\n  }\n]"
    }
  ],
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "resource_page_inclusion_scores",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": {
          "results": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": { "type": "string" },
                "score": { "type": "number" },
                "reason": { "type": "string" },
                "isCuratedResourcePage": { "type": "boolean" },
                "alreadyLinksToTarget": { "type": "boolean" }
              },
              "required": ["id", "score", "reason", "isCuratedResourcePage", "alreadyLinksToTarget"],
              "additionalProperties": false
            }
          }
        },
        "required": ["results"],
        "additionalProperties": false
      }
    }
  },
  "reasoning": { "max_tokens": 2000 },
  "provider": { "require_parameters": true },
  "stream": false
}
```

## What we know so far

- `z-ai/glm-4.7-flash` aborts client-side at the 30s default `timeoutMs`
  (`packages/openrouter/generate-text.ts`, `AbortSignal.timeout(timeoutMs)`).
  This particular batch (2 items) is small — bigger batches (up to 10 items,
  `BATCH_SIZE` varies per method) are more likely to hit this.
- `qwen/qwen3.6-flash` (the fallback) fails with a generic `"Provider returned
  error"` — that string comes straight from OpenRouter's own `error.message`,
  no status code or extra detail captured. Test it directly against the
  playground/curl to see the actual status + body OpenRouter returns; that's
  the part we can't see from our own logs.
- `provider.require_parameters: true` forces OpenRouter to only route to
  providers that support every parameter in the request (`response_format`
  json_schema + `reasoning`). Worth checking whether `qwen/qwen3.6-flash`
  has a provider backing it that actually supports that combination — if none
  do, this fails deterministically every time, not just under load.

## Related fix

`apps/server/src/helpers/logger.ts` previously truncated any logged string at
10,000 chars (Node's default `util.inspect` `maxStringLength`) — large
requests were getting cut off mid-JSON in the `.logs/*.txt` files. Fixed by
passing `maxStringLength: Infinity` to `inspect()`. Future `"llm request"` log
lines will contain the complete input, no more `... N more characters`.
