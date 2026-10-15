# Discount Darts

Build a website called Steam Deals that lists only games currently discounted on the official Steam Store, sorted automatically from the lowest discounted price to the highest. Use free Steam Store endpoints wherever possible, without paid APIs or external game-key marketplaces. Fetch game information such as title, cover image, original price, current discounted price, discount percentage, and Steam Store URL. Display the games in a clean, modern, responsive dark-themed gaming UI inspired by Steam, with a searchable game list, sorting by lowest price first by default, and a currency/region selector supporting INR (India) and other available Steam regions. Use actual regional Steam prices whenever available rather than simply converting currencies. Show only games with a genuine active discount, handle free games separately if necessary, and provide loading states, empty states, and error handling. Since Steam does not guarantee a supported public bulk-deals API, implement a practical free data-fetching strategy using available Steam Store endpoints, caching results to reduce requests, and clearly document any limitations. Do not use paid APIs, mock data, hardcoded game lists, or unnecessary authentication. Keep the implementation simple and focused on the core feature: find discounted Steam games and list them from cheapest to most expensive. Make the website functional end to end, not just a static UI.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ab84e75b-2140-4c0a-bd8f-ddedb0728ceb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
