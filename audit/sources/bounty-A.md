# Bounty A

- URL: https://curator.geobrowser.io/bounty/41e851610e13a19441c4d980f2f2ce6b/8181dcf5c33666a5a9328cffaa0be3d0
- Fetch method: Geo Curator bundle inspection -> GraphQL `entity` query on `https://api-testnet.geobrowser.io/graphql` (WebFetch and plain HTML returned only the SPA shell)
- Bounty entity id: `8181dcf5c33666a5a9328cffaa0be3d0`
- Space id: `41e851610e13a19441c4d980f2f2ce6b`
- Entity name: Add debate claims on the US–China AI incident hotline — AI

## Values (property: value)

- **Description** (`9b1f76ff9711404c861e59dc3fa7d037`): text=Extract debate claims from coverage and commentary on the US–China AI incident hotline agreed in September 2026 and add them to its topic page.
- **Bounty budget** (`9ece325c592d42d5b2e785e8e6fe05b6`): float=500
- **Name** (`a126ca530c8e48d5b88882c734c38935`): text=Add debate claims on the US–China AI incident hotline — AI

## Relations (type -> target)

- **Blocks** (`beaba5cba67741a8b35377030613fc70`) -> (unnamed) (`180358f8bb62e7e0a86b27ed9fc5c420`)
- **Blocks** (`beaba5cba67741a8b35377030613fc70`) -> (unnamed) (`c2b54a61a1266aefb5fb0c652678651e`)
- **Blocks** (`beaba5cba67741a8b35377030613fc70`) -> (unnamed) (`49b329136704852d1ceeb0155c20e75b`)
- **Creator** (`e200041dba1a4ca7b28497fe22d8e234`) -> Catalin (`cc4924c6190943c49d2c1f65e2862a93`)
- **Maintainers** (`e9fa6d66d839404588bb5f7d7c675ce6`) -> Catalin (`cc4924c6190943c49d2c1f65e2862a93`)
- **Task status** (`054a7993ec2843e29688c84ac7a09220`) -> Todo (`76b5b831a5fa4203ad61b3f93915edec`)
- **Difficulty** (`8c8405abc6bc4d46a5806e4fc80d8187`) -> Medium (`74a88abeaf694d4d969eef651c61f58a`)
- **Blocks** (`beaba5cba67741a8b35377030613fc70`) -> (unnamed) (`7398c97c4cf525497bfc9c1b288536ba`)
- **Blocks** (`beaba5cba67741a8b35377030613fc70`) -> (unnamed) (`e99cb58f91c9bd2ab6cc69690357c4b5`)
- **Blocks** (`beaba5cba67741a8b35377030613fc70`) -> (unnamed) (`602bf3be03ba4ad38233664cd8ed0034`)
- **Blocks** (`beaba5cba67741a8b35377030613fc70`) -> (unnamed) (`7d91c75ddaf815ad0e8e0fdb23f84233`)
- **Types** (`8f151ba4de204e3c9cb499ddf96f48f1`) -> Bounty (`808af0bad5884e3391f09dd4b25e18be`)
- **Blocks** (`beaba5cba67741a8b35377030613fc70`) -> (unnamed) (`bd7ddb00c6fc7919774f1661e74fb201`)

## Body blocks (markdown, in position order)

## Why it matters

In September 2026 the US and China agreed to set up a channel for AI incidents, the first formal AI crisis line between the two leading AI powers. Nobody yet knows what will trigger it, who will staff it, or whether either side will use it. That is where the real disagreements are. Help map them.

## What to publish

Start from the topic page US–China AI incident hotline 19a3d1c7f9ec4da4a2b3e4b963a2c118. Add debate claims extracted from sources about the hotline. Every claim must:

- Come from a source approved by the AI space 28cfd95d56ddf4794eb56378bf1d4703, and be connected to that source
- Be genuinely contested: a position reasonable people disagree on, not a fact or a quote. "X says Y" is not a debate claim
- Be context-independent: it must make sense on its own. Name the US and China and the AI incident hotline or channel, and anchor it in time where needed. No "it", "the channel" or "this deal"
- Be a single, short proposition with no trailing period
- Have the Debate tag 55c95b2626f8482cb9739ea99dfde438 and a Topics link to US–China AI incident hotline 19a3d1c7f9ec4da4a2b3e4b963a2c118
- Not repeat a claim already on the topic page or one another curator has published

Angles to explore: what should trigger the channel, military AI, private AI labs, information sharing versus the AI race, verification and trust, bilateral versus multilateral rules.

**A submission counts when** its claims meet the rules above and are published to the AI space.

Questions? Reach out to the bounty maintainer Catalin.

## Submissions / linked proposals (curator API)

GET https://curator-api-staging-testnet.up.railway.app/space/<spaceId>/bounty/<bountyId>/submissions returned HTTP 200 with `{"submissions":[]}` (raw: bounty-A.submissions.raw.json). No linked proposals or submissions in the entity relations either.
