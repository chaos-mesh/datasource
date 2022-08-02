VERSION=$1
ID=yeya24-chaosmesh-datasource

rm -rf dist

echo "Bundled Version: $VERSION"
echo "Start to build..."
echo

yarn build
# yarn sign

echo "Bundling..."
echo

zip -r $ID-$VERSION.zip dist -x "*.DS_Store*"
md5sum $ID-$VERSION.zip > $ID-$VERSION.zip.md5

echo "Done."
