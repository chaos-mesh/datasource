VERSION=$1
ID=chaosmeshorg-datasource

rm -rf dist

echo "Bundled Version: $VERSION"
echo "Start to build..."
echo

yarn build
# yarn sign

echo "Bundling..."

cp -r dist $ID
zip -r $ID-$VERSION.zip dist -x "*.DS_Store*"
md5sum $ID-$VERSION.zip > $ID-$VERSION.zip.md5
rm -rf $ID

echo "Done."
