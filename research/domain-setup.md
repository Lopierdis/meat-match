# meat-match.com

Hosting: GitHub Pages, `Lopierdis/meat-match`, branch `main`, folder `/docs`.

The domain currently uses Namecheap BasicDNS. The lookup on 2026-11-17 returned `192.64.119.111` for the apex and `parkingpage.namecheap.com` for `www`.

In Namecheap, open Domain List → Manage next to meat-match.com → Advanced DNS → Host Records. Replace the parking/URL Redirect record for `@` and the parking CNAME for `www` with:

| Type | Host | Value | TTL |
| --- | --- | --- | --- |
| A | @ | 185.199.108.153 | Automatic |
| A | @ | 185.199.109.153 | Automatic |
| A | @ | 185.199.110.153 | Automatic |
| A | @ | 185.199.111.153 | Automatic |
| CNAME | www | lopierdis.github.io | Automatic |

Keep unrelated mail and TXT records. GitHub's custom domain must be set to `meat-match.com` before these DNS changes. After propagation and certificate issuance, enable Enforce HTTPS in repository Settings → Pages.

Sources: [Namecheap's GitHub Pages guide](https://www.namecheap.com/support/knowledgebase/article.aspx/9645/2208/how-do-i-link-my-domain-to-github-pages/) and [GitHub's custom domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
