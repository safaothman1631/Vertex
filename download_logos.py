import urllib.request
import os
import ssl

# Ignore SSL errors
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/webp,image/png,image/*,*/*;q=0.8',
}

OUT = r'C:\Users\SAFA\nexpos-app\public\images\brands'
os.makedirs(OUT, exist_ok=True)

# Multiple URL candidates per brand — tries each until one succeeds
LOGOS = {
    'honeywell': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Honeywell_logo.svg/1200px-Honeywell_logo.svg.png',
        'https://www.honeywell.com/content/dam/honeywellbt/en/images/global/brand/honeywell-logo-rgb.png',
        'https://1000logos.net/wp-content/uploads/2020/08/Honeywell-Logo.png',
    ],
    'zebra': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Zebra_Technologies_logo.svg/1200px-Zebra_Technologies_logo.svg.png',
        'https://www.zebra.com/content/dam/zebra_new_ia/en-us/images/zebra-logo-white.png',
        'https://1000logos.net/wp-content/uploads/2021/05/Zebra-Technologies-logo.png',
    ],
    'ingenico': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Ingenico_logo.svg/1200px-Ingenico_logo.svg.png',
        'https://1000logos.net/wp-content/uploads/2021/09/Ingenico-logo.png',
        'https://www.ingenico.com/sites/default/files/2021-10/ingenico-logo-white.png',
    ],
    'verifone': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Verifone_Logo.svg/1200px-Verifone_Logo.svg.png',
        'https://1000logos.net/wp-content/uploads/2021/09/Verifone-logo.png',
        'https://www.verifone.com/sites/default/files/2020-01/verifone-logo-white.png',
    ],
    'pax': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/PAX_Technology_logo.svg/1200px-PAX_Technology_logo.svg.png',
        'https://1000logos.net/wp-content/uploads/2023/04/PAX-Technology-logo.png',
        'https://www.paxtechnology.com/images/pax-logo-white.png',
    ],
    'epson': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Epson_logo.svg/1200px-Epson_logo.svg.png',
        'https://1000logos.net/wp-content/uploads/2017/04/Epson-Logo.png',
        'https://global.epson.com/company/image/logo-epson.png',
    ],
    'star': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Star_Micronics_logo.svg/1200px-Star_Micronics_logo.svg.png',
        'https://1000logos.net/wp-content/uploads/2022/08/Star-Micronics-logo.png',
        'https://www.starmicronics.com/images/star-micronics-logo.png',
    ],
    'square': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Square%2C_Inc._-_Square_logo.svg/1200px-Square%2C_Inc._-_Square_logo.svg.png',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Square_Logo.svg/1200px-Square_Logo.svg.png',
        'https://1000logos.net/wp-content/uploads/2021/09/Square-logo.png',
    ],
}

def try_download(brand, urls):
    for url in urls:
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
                data = resp.read()
                if len(data) < 500:
                    print(f'  [{brand}] Too small ({len(data)}b), skip: {url}')
                    continue
                ext = 'svg' if b'<svg' in data[:100] else 'png'
                out_path = os.path.join(OUT, f'{brand}.{ext}')
                with open(out_path, 'wb') as f:
                    f.write(data)
                print(f'  [{brand}] OK ({len(data)//1024}KB) -> {brand}.{ext}')
                return True
        except Exception as e:
            print(f'  [{brand}] FAIL: {url}  => {e}')
    return False

print(f'Saving to: {OUT}\n')
results = {}
for brand, urls in LOGOS.items():
    print(f'Downloading: {brand}')
    results[brand] = try_download(brand, urls)

print('\n--- Summary ---')
for brand, ok in results.items():
    print(f'  {"OK" if ok else "FAILED"}: {brand}')
