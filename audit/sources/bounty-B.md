# Bounty B

- URL: https://curator.geobrowser.io/bounty/4582fbbee28a16589154f7e36f1ee3c5/974d54402b9a4d53b90b8219a500e3bd
- Fetch method: Geo Curator bundle inspection -> GraphQL `entity` query on `https://api-testnet.geobrowser.io/graphql` (WebFetch and plain HTML returned only the SPA shell)
- Bounty entity id: `974d54402b9a4d53b90b8219a500e3bd`
- Space id: `4582fbbee28a16589154f7e36f1ee3c5`
- Entity name: Dataset import - US politics

## Values (property: value)

- **Name** (`a126ca530c8e48d5b88882c734c38935`): text=Dataset import - US politics
- **Bounty budget** (`9ece325c592d42d5b2e785e8e6fe05b6`): float=500
- **Description** (`9b1f76ff9711404c861e59dc3fa7d037`): text=Bring structured data into US politics space at scale through scraping and import.

## Relations (type -> target)

- **Blocks** (`beaba5cba67741a8b35377030613fc70`) -> Content (`474a91dc677f4518b34f870834af52dd`)
- **Blocks** (`beaba5cba67741a8b35377030613fc70`) -> Content (`55188a8e77b143a085a55b6fd2ebaeaa`)
- **Blocks** (`beaba5cba67741a8b35377030613fc70`) -> Content (`044a7b3ad4dd4b878fbf3addf74286df`)
- **Blocks** (`beaba5cba67741a8b35377030613fc70`) -> Content (`52b9301ef28a45c1b12ca30312c8e81e`)
- **Blocks** (`beaba5cba67741a8b35377030613fc70`) -> Content (`cf3e4e438afd4faf81b12ed127638beb`)
- **Task status** (`054a7993ec2843e29688c84ac7a09220`) -> Done (`425f3e809cf9488696581775159dfc33`)
- **Types** (`8f151ba4de204e3c9cb499ddf96f48f1`) -> Bounty (`808af0bad5884e3391f09dd4b25e18be`)
- **0693e377eafd42278487cd143250357f** (`0693e377eafd42278487cd143250357f`) -> Dan Cordie (`7c6a1b419591415eb355b63fa03dc4cb`)
- **Difficulty** (`8c8405abc6bc4d46a5806e4fc80d8187`) -> Medium (`74a88abeaf694d4d969eef651c61f58a`)
- **Blocks** (`beaba5cba67741a8b35377030613fc70`) -> Content (`a14db9ed284a4c138073fff1f06bff99`)
- **Blocks** (`beaba5cba67741a8b35377030613fc70`) -> Content (`4d7fe50a494c4839beec5b45ba5fa7bf`)
- **Creator** (`e200041dba1a4ca7b28497fe22d8e234`) -> Dan Cordie (`7c6a1b419591415eb355b63fa03dc4cb`)

## Body blocks (markdown, in position order)

The goal of this bounty is to fill US politics space with structured data that would take too long to add by hand, e.g. lists, records, datasets, and reference information from public sources.

**How to do it:**

1. Check for requested subjects and public sources following this link: https://www.geobrowser.io/space/4582fbbee28a16589154f7e36f1ee3c5/f0a7cf787aa2412ca6bc38b5d2c56757

2. Prepare it, clean it to match the space's existing types and properties, and import it (CSV import supported). Check with the bounty maintainer before imports so the structure fits the space's setup, and always record the origin of the data.

3. Message about it on US politics channel in discord.

4. Implement editors' recommended revisions and earn points.

**Questions?** Reach out to the bounty maintainer Dan.

## Submissions / linked proposals (curator API)

GET https://curator-api-staging-testnet.up.railway.app/space/<spaceId>/bounty/<bountyId>/submissions returned HTTP 200 with `{"submissions":[]}` (raw: bounty-B.submissions.raw.json). No linked proposals or submissions in the entity relations either.
