"""Browser smoke checks. Uses an existing Playwright installation and Chrome."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '.preview'
OUT.mkdir(exist_ok=True)

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT / 'docs')))
Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}'
errors, failures = [], []

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True)
        page = browser.new_page(viewport={'width':1440,'height':1000}, device_scale_factor=1)
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('response', lambda response: failures.append(f'{response.status} {response.url}') if response.status >= 400 else None)
        page.goto(url)
        page.evaluate('document.fonts.ready')
        assert page.locator('html').get_attribute('dir') == 'rtl'
        expect(page.locator('h1')).to_contain_text('לכל ארוחה')
        page.screenshot(path=str(OUT/'desktop-home.png'), full_page=True)

        page.locator('.hero-actions a[href="#quiz"]').click()
        expect(page.locator('button[type="submit"]')).to_be_disabled()
        page.locator('input[value="steak"]').check()
        page.locator('button[type="submit"]').click()
        page.reload()
        expect(page.locator('legend')).to_contain_text('עם מה מבשלים')
        for value in ['pan','45','1','1','lean','medium','2','3']:
            page.locator(f'input[value="{value}"]').check()
            page.locator('button[type="submit"]').click()
        expect(page.locator('.result-card')).to_have_count(3)
        expect(page.locator('.result-card.first h2')).to_have_text('פילה')
        page.screenshot(path=str(OUT/'desktop-results.png'), full_page=True)
        page.locator('.result-card.first [data-cut]').click()
        expect(page.locator('dialog')).to_be_visible()
        page.keyboard.press('Escape')
        expect(page.locator('dialog')).not_to_be_visible()
        page.locator('[data-action="copy"]').click()
        # Clipboard permissions vary by browser; either the toast or copy dialog must appear.
        expect(page.locator('#toast.visible, dialog[open]')).to_have_count(1)
        if page.locator('dialog[open]').count():
            page.keyboard.press('Escape')

        # An incompatible method must produce an actionable empty state.
        page.locator('[data-step="1"]').click()
        page.locator('input[value="pot"]').check()
        page.locator('button[type="submit"]').click()
        page.goto(url+'/#results')
        expect(page.locator('.empty-state')).to_be_visible()
        expect(page.locator('.result-card')).to_have_count(0)
        expect(page.locator('.empty-state [data-step="1"]')).to_be_visible()

        page.goto(url+'/#glossary')
        expect(page.locator('.cut-card')).to_have_count(25)
        page.locator('#cut-search').fill('12')
        expect(page.locator('.cut-card')).to_have_count(1)
        expect(page.locator('.cut-card h3')).to_have_text('פילה')
        page.locator('#cut-search').fill('Picanha')
        expect(page.locator('.cut-card')).to_have_count(1)
        page.locator('#cut-search').fill('צאך')
        expect(page.locator('.cut-card')).to_have_count(2)
        page.locator('#cut-search').fill('<script>bad</script>')
        expect(page.locator('#catalog .empty-state')).to_be_visible()
        page.locator('[data-action="clear-search"]').click()
        expect(page.locator('.cut-card')).to_have_count(25)
        page.locator('[data-filter="quick"]').click()
        expect(page.locator('.cut-card')).to_have_count(10)
        page.locator('[data-filter="all"]').click()
        page.screenshot(path=str(OUT/'desktop-glossary.png'), full_page=True)

        for width in [360,390,768]:
            page.set_viewport_size({'width':width,'height':844})
            for route in ['home','quiz','glossary','terms','sources']:
                page.goto(url+'/#'+route)
                page.wait_for_timeout(50)
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (width,route)
                if width == 390 and route in ['home','quiz','glossary']:
                    page.screenshot(path=str(OUT/f'mobile-{route}.png'), full_page=True)

        # A complete second journey at phone width exercises every step and back navigation.
        page.set_viewport_size({'width':390,'height':844})
        page.goto(url+'/#quiz')
        page.locator('[data-action="reset"]').click()
        for value in ['stew','pot','360','3','1','internal','braised','1','1']:
            page.locator(f'input[value="{value}"]').check()
            page.locator('button[type="submit"]').click()
        expect(page.locator('.result-card')).to_have_count(3)
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.screenshot(path=str(OUT/'mobile-results.png'), full_page=True)
        page.locator('[data-action="edit"]').click()
        page.locator('[data-action="reset"]').click()
        page.goto(url+'/#results')
        expect(page.locator('legend')).to_contain_text('מה הולך להיות')

        assert not errors, errors
        assert not failures, failures
        print('Passed: desktop and mobile quiz journeys, persistence, recommendation constraints, search, filters, dialogs, clipboard, responsive overflow, and asset/JS errors.')
        browser.close()
finally:
    server.shutdown()
    server.server_close()
