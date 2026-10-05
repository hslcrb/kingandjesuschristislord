import pathlib, zipfile
root = pathlib.Path(__file__).resolve().parent.parent
release = root / 'release'
release.mkdir(exist_ok=True)
target = release / 'loved-to-the-end.zip'
with zipfile.ZipFile(target, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=5) as archive:
    for path in (root / 'dist').rglob('*'):
        if path.is_file(): archive.write(path, path.relative_to(root))
    for name in ['README.md', 'CREDITS.md', 'start-film.ps1', 'scripts/serve.mjs']:
        archive.write(root / name, name)
    for path in (root / 'docs' / 'images').glob('*.png'):
        archive.write(path, path.relative_to(root))
    archive.writestr('먼저 읽어주세요.txt', '끝까지 사랑하시니 — 24분 20초, 5막 38장면\n\n압축을 푼 폴더에서 터미널을 열고 다음을 실행하세요.\n\nnode scripts/serve.mjs\n\n그다음 브라우저에서 http://127.0.0.1:4197 을 여세요.\nNode.js 22.12 이상이 필요합니다. npm install은 완성본 감상에 필요하지 않습니다.\nPowerShell 실행이 허용된 환경에서는 start-film.ps1을 실행해도 됩니다.\n\n모든 글꼴·음악·내레이션은 포함되어 있습니다. 외부 성경 링크만 인터넷이 필요합니다.\n헤드폰과 전체 화면을 권장합니다.\n')
print(f'Packaged {target.name}: {target.stat().st_size / 1024 / 1024:.1f} MiB')
