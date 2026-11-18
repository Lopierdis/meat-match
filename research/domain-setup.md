# meat-match.com

Hosting: GitHub Pages, `Lopierdis/meat-match`, branch `main`, folder `/docs`.

The domain uses Namecheap BasicDNS. On 2026-11-18, the Namecheap API replaced the default parking/redirect records with the five records below. A fresh API read confirmed every record. Public DNS propagation and GitHub certificate issuance are separate from that provider confirmation.

The records are managed under Namecheap → Domain List → Manage → Advanced DNS → Host Records:

| Type | Host | Value | TTL |
| --- | --- | --- | --- |
| A | @ | 185.199.108.153 | 1800 seconds |
| A | @ | 185.199.109.153 | 1800 seconds |
| A | @ | 185.199.110.153 | 1800 seconds |
| A | @ | 185.199.111.153 | 1800 seconds |
| CNAME | www | lopierdis.github.io | 1800 seconds |

GitHub's custom domain was already set to `meat-match.com` before the DNS update. The domain's email-forwarding mode was preserved. No credentials are stored in the repository. After propagation and certificate issuance, enable Enforce HTTPS in repository Settings → Pages.

Public Google and Cloudflare DNS returned the correct records on 2026-11-18. The live mobile questionnaire passed all nine steps at `http://meat-match.com/`, and `www` redirected to the main domain. GitHub had not yet issued its TLS certificate at that check.

A bounded one-time user service on Bulbasaur, `meat-match-https-finalize.service`, runs the ignored `.preview/finish-https.sh`. It checks HTTPS once a minute, verifies the domain still belongs to this Pages configuration, enables HTTPS enforcement when the certificate works, and exits. It stops after 24 hours if the certificate is still unavailable. It uses existing GitHub CLI authentication and does not use the Namecheap key.

Inspect completion with `journalctl --user -u meat-match-https-finalize.service` and `gh api repos/Lopierdis/meat-match/pages --jq '{https_enforced,https_certificate}'`.

Sources: [Namecheap's GitHub Pages guide](https://www.namecheap.com/support/knowledgebase/article.aspx/9645/2208/how-do-i-link-my-domain-to-github-pages/) and [GitHub's custom domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
