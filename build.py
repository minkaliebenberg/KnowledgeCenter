"""Rebuild the single-file index.html (served by GitHub Pages) from src/."""
from pathlib import Path
root = Path(__file__).parent
html = (root / 'src/index.html').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="css/styles.css">', '<style>\n' + (root / 'src/css/styles.css').read_text(encoding='utf-8') + '\n</style>')
for name in ('data', 'store', 'app'):
    html = html.replace(f'<script src="js/{name}.js"></script>', '<script>\n' + (root / f'src/js/{name}.js').read_text(encoding='utf-8') + '\n</script>')
assert 'src="js/' not in html and 'css/styles.css' not in html
(root / 'index.html').write_text(html, encoding='utf-8')
print('Built index.html')
