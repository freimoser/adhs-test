#!/usr/bin/env python3
"""Erzeugt alle statischen Seiten des ADHS-Checks. Aufruf: python3 build.py"""
import json, os, html
BASE = "https://freimoser.github.io/adhs-test/"
P = "/adhs-test/"
LASTMOD = "2026-10-17"
LINKEDIN = "https://www.linkedin.com/in/freimoser"
NOTE = "Selbsteinschätzung zur Vorbereitung auf das Arztgespräch – keine Diagnose, kein Medizinprodukt."
NAV = [("", "ADHS-Check"), ("adhs-erwachsene-frauen/", "ADHS bei Erwachsenen"), ("adhs-kriterien-dsm5-icd11/", "Kriterien"),
       ("fremdeinschaetzung-angehoerige/", "Für Angehörige"), ("adhs-diagnose-ablauf/", "Diagnose-Ablauf")]

ABOUT = f'''<section class="about noprint"><div class="wrap"><img src="{P}favicon.svg" alt="" width="44" height="44"><div><h2>Über den Entwickler</h2><p><strong>Thomas Freimoser</strong> entwickelt kostenlose, datensparsame Web-Tools rund um Gesundheit und Praxisalltag – alles läuft im Browser, nichts wird hochgeladen. München / Remote.</p><div class="btns"><a class="btn" href="https://freimoser.de/">freimoser.de</a><a class="btn" href="{LINKEDIN}" rel="noopener" target="_blank">LinkedIn</a><a class="btn" href="https://freimoser.de/projekte/">Alle Projekte</a></div></div></div></section>'''

def faq_ld(faqs):
    return {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faqs]}

def faq_html(faqs):
    return "<h2>Häufige Fragen</h2>" + "".join(f'<details class="faq"><summary>{html.escape(q)}</summary><p>{html.escape(a)}</p></details>' for q, a in faqs)

def page(path, title, desc, h1, lead, body, faqs, tool=False, extra_ld=None):
    url = BASE + path
    lds = ([faq_ld(faqs)] if faqs else []) + ([extra_ld] if extra_ld else [])
    lds.append({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "ADHS-Check", "item": BASE}] + ([{"@type": "ListItem", "position": 2, "name": h1, "item": url}] if path else [])})
    nav = "".join(f'<a href="{P}{p}"{" aria-current=\"page\"" if p == path else ""}>{n}</a>' for p, n in NAV)
    ld = "\n".join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in lds)
    tool_html = TOOL if tool else f'<p><a class="btn pri" href="{P}">Zum kostenlosen ADHS-Check →</a></p>'
    scripts = f'<script src="{P}questions.js"></script><script src="{P}app.js"></script>' if tool else ""
    return f'''<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="{url}">
<meta name="google-site-verification" content="6pYvtFCnU7UFcQFajtMSkQ7tYMy3Z_Bt7teKiT5yKNg" />
<meta name="msvalidate.01" content="E1F30DEB311AAF5458907DB431B481AC" />
<meta name="referrer" content="no-referrer">
<meta property="og:type" content="website"><meta property="og:locale" content="de_DE"><meta property="og:site_name" content="ADHS-Check zu dritt">
<meta property="og:title" content="{html.escape(title)}"><meta property="og:description" content="{html.escape(desc)}">
<meta property="og:url" content="{url}"><meta property="og:image" content="{BASE}icon-512.png">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#0b1117">
<link rel="icon" href="{P}favicon.svg" type="image/svg+xml"><link rel="icon" href="{P}favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="{P}apple-touch-icon.png">
<link rel="stylesheet" href="{P}styles.css">
{ld}
<meta name="author" content="Thomas Freimoser">
</head>
<body>
<header class="top noprint"><div class="wrap"><a class="brand" href="{P}"><img src="{P}favicon.svg" alt="" width="28" height="28">ADHS-Check</a><button class="menu-btn" id="menuBtn" type="button" aria-expanded="false" aria-controls="mainNav" aria-label="Menü öffnen"><span></span></button><nav class="main" id="mainNav" aria-label="Hauptmenü">{nav}</nav></div></header><script>(function(){{var b=document.getElementById("menuBtn"),n=document.getElementById("mainNav");if(!b)return;function s(o){{n.classList.toggle("open",o);b.setAttribute("aria-expanded",o?"true":"false");b.setAttribute("aria-label",o?"Menü schließen":"Menü öffnen")}}b.onclick=function(e){{e.stopPropagation();s(!n.classList.contains("open"))}};n.addEventListener("click",function(e){{if(e.target.closest("a"))s(false)}});document.addEventListener("click",function(e){{if(n.classList.contains("open")&&!n.contains(e.target))s(false)}});document.addEventListener("keydown",function(e){{if(e.key==="Escape"&&n.classList.contains("open")){{s(false);b.focus()}}}})}})();</script>
<main class="wrap">
<div class="mdr" role="note">ℹ️ {NOTE} Deine Antworten bleiben in deinem Browser.</div>
<h1>{h1}</h1>
<p class="lead">{lead}</p>
{tool_html}
<div class="content">{body}{faq_html(faqs) if faqs else ""}</div>
</main>
{ABOUT}
<footer class="noprint"><div class="wrap">
<p class="cols"><a href="https://freimoser.github.io/freimoser.de/impressum/">Impressum</a><a href="{P}datenschutz/">Datenschutz</a><a href="https://freimoser.de/">Portfolio Thomas Freimoser</a></p>
<p>{NOTE} ASRS-V1.1 Screener: © New York University and the President and Fellows of Harvard College. Kessler RC, Adler L, Ames M et al. The World Health Organization Adult ADHD Self-Report Scale (ASRS): a short screening scale for use in the general population. Psychological Medicine 2005; 35(2): 245–256. <a href="https://license.tov.med.nyu.edu/product/asrs6Qscreener">Lizenz (NYU)</a>. Historischer Hinweis: Das Originalformular nennt © World Health Organization 2004. Eigene Fragen © Thomas Freimoser, nicht wissenschaftlich geprüft. Gebaut in München / Remote.</p>
</div></footer>
{scripts}
</body></html>
'''

TOOL = '''<div class="hook"><p><strong>So geht's:</strong> ① den offiziellen ASRS-Kurztest und eigene Fragen ausfüllen (ca. 10 Minuten) → ② beliebig viele Einladungslinks an Menschen schicken, die dich gut kennen → ③ deren Antwortlinks öffnen und sehen, wo ihr euch einig seid. Kostenlos, ohne Anmeldung, ohne Server.</p></div>
<noscript><p class="warn">Der Check braucht JavaScript. Es werden trotzdem keine Daten übertragen.</p></noscript>
<div id="app" aria-live="polite"></div>'''

SRC = '''<h2>Quellen</h2><ul class="src">
<li>Deutsche Gesellschaft für Kinder- und Jugendpsychiatrie u. a.: S3-Leitlinie „ADHS bei Kindern, Jugendlichen und Erwachsenen“, AWMF-Register-Nr. 028-045, Stand 2017. <a href="https://register.awmf.org/de/leitlinien/detail/028-045">register.awmf.org</a></li>
<li>American Psychiatric Association: Diagnostic and Statistical Manual of Mental Disorders, 5. Auflage (DSM-5), 2013.</li>
<li>Weltgesundheitsorganisation: ICD-11, 6A05 Attention deficit hyperactivity disorder. <a href="https://icd.who.int/browse/2024-01/mms/en#821852937">icd.who.int</a></li>
<li>Kessler RC, Adler L, Ames M et al. The World Health Organization Adult ADHD Self-Report Scale (ASRS): a short screening scale for use in the general population. Psychological Medicine 2005; 35(2): 245–256. ASRS-V1.1 Screener © New York University and the President and Fellows of Harvard College; <a href="https://license.tov.med.nyu.edu/product/asrs6Qscreener">Lizenzseite NYU</a>.</li>
</ul>'''

PAGES = []
PAGES.append(("", page("", "ADHS Test Erwachsene kostenlos – mit Fremdeinschätzung, ohne Anmeldung",
  "Kostenloser ADHS-Selbsttest für Erwachsene ohne Anmeldung: WHO-Kurztest ASRS plus Einschätzung von Partner, Familie und Freunden. Zur Vorbereitung aufs Arztgespräch.",
  "Wie sehen dich deine Freunde? Der ADHS-Check zu dritt.",
  "Ein kostenloser ADHS-Test für Erwachsene, ohne Anmeldung: Du füllst den offiziellen Kurztest der WHO und unsere Fragen aus – und lädst Menschen, die dich kennen, ein, dieselben Fragen über dich zu beantworten. Auch für Angehörige gedacht.",
  '''<h2>Warum zu dritt?</h2>
<p>Wer sich selbst einschätzt, sieht manches zu streng und anderes gar nicht. Ärztinnen und Ärzte fragen in der ADHS-Diagnostik deshalb fast immer auch Menschen aus dem Umfeld. Dieser Check übernimmt dieses Prinzip: Du siehst, ob Partnerin, Bruder und Kollege dasselbe beobachten wie du – oder etwas ganz anderes. Empfehlenswert sind 3–4 Personen aus verschiedenen Lebensbereichen, eine feste Grenze gibt es nicht.</p>
<div class="grid3">
<div class="card"><h3>🔒 Bleibt bei dir</h3><p>Kein Konto, kein Server, keine Analyse-Tools. Antworten liegen nur im Speicher deines Browsers und lassen sich mit einem Klick löschen.</p></div>
<div class="card"><h3>🔗 Links statt Datenbank</h3><p>Einladung und Antwort reisen als Link. Der Antwortlink trägt die Daten hinter dem #, das wird nie an einen Server gesendet – auf Wunsch zusätzlich mit Passwort verschlüsselt.</p></div>
<div class="card"><h3>🩺 Fürs Arztgespräch</h3><p>Am Ende gibt es eine Druckansicht mit Kurztest, Profil und Vergleich. Damit gehst du vorbereitet in den Termin.</p></div></div>
<h2>Was ist im Check enthalten?</h2>
<p><strong>Teil 1</strong> ist der ASRS-V1.1 Screener: sechs Fragen, die Forscher der Harvard Medical School und der New York University mit der WHO entwickelt haben. Er wird im Original-Wortlaut und mit der offiziellen Auswertung verwendet und nur von dir selbst beantwortet.</p>
<p><strong>Teil 2</strong> sind 26 eigene Fragen zu den Bereichen Aufmerksamkeit, Unruhe und Impulsivität, Kindheit und Auswirkungen im Alltag. Sie folgen den Symptombereichen aus <a href="adhs-kriterien-dsm5-icd11/">DSM-5 und ICD-11</a>, sind aber selbst formuliert und <strong>nicht wissenschaftlich geprüft</strong>. Deshalb wird hier nichts gezählt und es gibt keinen Grenzwert – nur ein Profil und den Vergleich mit anderen.</p>
<h2>Was der Check nicht ist</h2>
<p>Er ist keine Diagnose und ersetzt keine Untersuchung. Ein auffälliges Ergebnis heißt nicht, dass ADHS vorliegt, und ein unauffälliges schließt es nicht aus. Wie die Abklärung abläuft, steht unter <a href="adhs-diagnose-ablauf/">Diagnose-Ablauf</a>.</p>''' + SRC,
  [("Ist der ADHS-Test kostenlos und ohne Anmeldung?", "Ja. Es gibt kein Konto, keine E-Mail-Abfrage und keine Bezahlschranke."),
   ("Kann ich damit ADHS feststellen?", "Nein. Der Check ist eine Selbsteinschätzung zur Vorbereitung auf das Arztgespräch, keine Diagnose und kein Medizinprodukt. Diagnostizieren können nur Fachärzte oder Psychotherapeuten."),
   ("Sieht meine Vertrauensperson meine Antworten?", "Nein. Der Einladungslink enthält nur die Fragen-Version, eine Zufalls-ID und den Namen, den du einträgst."),
   ("Wo werden die Daten gespeichert?", "Nur im localStorage deines Browsers. Mit „Alles löschen“ entfernst du sie vollständig."),
   ("Wie viele Personen kann ich einladen?", "Beliebig viele. Empfehlenswert sind 3 bis 4 Menschen aus verschiedenen Lebensbereichen.")],
  tool=True, extra_ld={"@context": "https://schema.org", "@type": "WebApplication", "name": "ADHS-Check zu dritt", "url": BASE, "applicationCategory": "HealthApplication", "operatingSystem": "Browser", "inLanguage": "de", "isAccessibleForFree": True, "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"}, "author": {"@type": "Person", "name": "Thomas Freimoser", "url": "https://freimoser.de/"}})))

exec(open('articles.py', encoding='utf-8').read())

for path, content in PAGES:
    if path:
        os.makedirs(path, exist_ok=True)
    open(os.path.join(path, "index.html") if path else "index.html", "w").write(content)

open("404.html", "w").write(page("404/", "Seite nicht gefunden – ADHS-Check", "Diese Seite gibt es nicht.", "Seite nicht gefunden",
  "Die angeforderte Seite existiert nicht.", "", []).replace('<meta name="robots" content="index, follow, max-image-preview:large">', '<meta name="robots" content="noindex">').replace(f'<link rel="canonical" href="{BASE}404/">', ""))

sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for path, _ in PAGES:
    sm.append(f"<url><loc>{BASE}{path}</loc><lastmod>{LASTMOD}</lastmod></url>")
sm.append("</urlset>")
open("sitemap.xml", "w").write("\n".join(sm) + "\n")
open("robots.txt", "w").write(f"User-agent: *\nAllow: /\nSitemap: {BASE}sitemap.xml\n")
open("llms.txt", "w").write(f"""# ADHS-Check zu dritt

> Kostenloser ADHS-Selbsttest für Erwachsene ohne Anmeldung, mit Fremdeinschätzung durch Angehörige und Freunde. {NOTE} Alle Daten bleiben im Browser.

## Seiten
""" + "\n".join(f"- [{t}]({BASE}{p})" for p, t in [("", "ADHS-Check (ASRS-V1.1 Screener + eigene Fragen, Einladungslinks)")] + [(p, n) for p, n in NAV[1:]] + [("datenschutz/", "Datenschutz")]) + """

## Hinweise
- Der ASRS-V1.1 Screener (© New York University and the President and Fellows of Harvard College; Kessler RC, Adler L, Ames M et al. The World Health Organization Adult ADHD Self-Report Scale (ASRS): a short screening scale for use in the general population. Psychological Medicine 2005; 35(2): 245–256; Lizenz: https://license.tov.med.nyu.edu/product/asrs6Qscreener) wird unverändert verwendet; nur er hat eine offizielle Auswertung.
- Die eigenen Fragen sind nicht wissenschaftlich geprüft; es gibt keinen Grenzwert.
- Autor: Thomas Freimoser, München / Remote, https://freimoser.de/
""")
print("ok", len(PAGES))
