VERSION=$1
ID=chaosmeshorg-datasource

rm -rf dist
rm -rf $ID

echo "Bundled Version: $VERSION"
echo "Start to build..."
echo

yarn build
yarn sign

echo "Bundling..."

mkdir $ID && cp -R dist/* $ID
zip -r $ID-$VERSION.zip $ID -x "*.DS_Store*"
md5sum $ID-$VERSION.zip > $ID-$VERSION.zip.md5

echo "Done."
