# AI Prompts Used

## Round 1: Initial Structure

**Prompt:** Spoke with professor about this since I was not in class and we didn't have the initial prompt recorded. The strategy we took here was to create the individual components first vs trying to do the entire 1.0 of the frontend in one shot.

**Result:**

- What worked immediately
  The general structure of may of the components was correct, but sometimes the implementation was off. I.e. AI would create slop components that did not have proper logic or structuring. They would either be too flat or too nested.
- What needed fixing
  We needed to fix up the general structure of the page. The LLM was not great when it came to understanding which components should be created vs as part of an existing component. Also cutting down bloat is also important to prevent unnecessary slop.
- What we learned
  It's important to focus on how the components are built, not only how they look. One of the most important things for frontend is the structure and planning around it. Good frontend is more than just applying CSS or Tailwind classes then assuming all is well if it looks like the inputted design.

## Round 2: Feature Implementation

**Prompt:** I want to create a way to filter the content feed by creator. Can you use shad to see if this is possible? Can you use the view model?
**Result:**

- What worked immediately: It was able to create a working filter.
- What needed fixing: It tried using Radix, but that caused problems with deployment, so now it uses a native control. In addition, I made edits to change how it appeared on the page.
- What we learned: AI needs more context regarding aesthetic choices. It still needs human creativity.
  **Prompt:** I also want you to make a search feature that allows users to filter the content by the text in them. After you're done making it, integrate it with the content feed but place it above the filter by creator
  **Result:**
- What worked immediately: It made a working search feature in the location that I wanted it to.
- What needed fixing: Nothing. It worked on first try.
- What we learned: AI is really good at creating simple stuff.

## Best Practices Discovered

### Things that made prompts more effective

- Starting with smaller tasks
- Keeping scope relatively contained without too much of an ask (too much and it fails)
- Looking at the implementation of frontend before continuing

### Patterns that worked well

- Understanding that not all frontend is created the same and that component structure matters
- Using other files as references to follow similar design patterns
- Splitting up work amongst team members to prevent overlap on specific files
