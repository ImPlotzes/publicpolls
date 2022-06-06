# PublicPolls
PublicPolls is a site that allows anyone to create a poll and vote on the polls of others. You don't need to create an account or enter any personal information. It was made for the [Cloudflare Spring Developer Challenge 2022](https://blog.cloudflare.com/announcing-our-spring-developer-challenge/ "Cloudflare's announcement blog"). The goal of the challenge was to make something real-time and collaborative using Cloudflare products.
This whole service runs on Cloudflare's free plan. It does not need any of the paid features, like Durable Objects. A goal I gave myself was to show how extensive and limitless Cloudflare's free plan is. I would only need to pay if PublicPolls got incredibly popular, and even then it would cost very little per month.

## Deploy it yourself
If you want to deploy this site for yourself then there are a few things you need to change. These things are mostly places where the code uses the domain of the site. Since your deployment will be hosted on another domain, you will need to edit those parts.
PublicPolls exists of two different parts. Cloudflare Pages for the front-end and Workers for the back-end. In this repository these in their own folders, one is `/pages` and the other is `/worker`. To deploy it you will first need to fork this repository and make it available on GitHub or a GitLab server. Also install [`wrangler`](https://developers.cloudflare.com/workers/wrangler/get-started/ "wrangler"), the Workers CLI, to deploy the worker.  It's also important that you have your own domain. This is because the worker and Pages project have to be hosted on the same domain.

### Workers
The worker you're going to deploy is responsible for the API and saving/updating all poll data in R2, a Cloudflare storage solution. Before you can deploy this worker, you will need to enable R2 and create a bucket. You do this in your Cloudflare dashboard. Then the following steps need to be done to configure and deploy your worker, assuming you've cloned this repository to your local machine and installed `wrangler`.
1. Open `/worker/wrangler.toml` and edit the following configurations.
    - **route = "\[your\].\[domain\].\[tld\]/api/\*"** (HAS TO USE THE PATH `/api/*`)
    - **bucket_name = "\[your-r2-bucket-name\]"**
    - **preview_bucket_name = "\[your-r2-bucket-name\]"**
2. Open a terminal in the `/worker` directory.
3. Publish your worker by running `wrangler publish`.

After these steps your worker should be published and running on your custom domain and on a workers.dev domain.

### Cloudflare Pages
To deploy the front-end, clone this repository. Then create a new Pages project in the Cloudflare dashboard. Connect to Git and select this repository. Choose a name and make sure your project has the following settings:
- Framework preset: **None**
- Build command:
- Build output directory: **/**
- Root directory (advanced): **/pages**
- Environment variables (advanced):
  - **API_DOMAIN = https://publicpolls.[name].workers.dev** (DON'T USE CUSTOM DOMAIN HERE, IT WILL BREAK)

Then it is important that you also set up a custom domain for your project. This has to be the same domain that you used in your `/worker/wrangler.toml` configuration. You do this by going to your Pages project in the Cloudflare dashboard and going to the tab **Custom domains**.

---

After doing these steps, your fork of PublicPolls should be fully online. Any help or questions can be sent to **Plotzes#8332** on Discord, you can also join [my Discord server](https://plotzes.ml/discord "Plotzes Discord server") to reach me.
